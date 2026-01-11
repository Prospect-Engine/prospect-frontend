"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { apiCall } from "@/lib/apiCall";
import { toast } from "sonner";
import isSuccessful from "@/lib/status";

export interface LinkedInAuthState {
  status:
    | "idle"
    | "connecting"
    | "connected"
    | "completed"
    | "disconnected"
    | "otp_required"
    | "captcha_required"
    | "otp-verification";
  progress: number;
  currentStep: string;
  message: string;
  error?: string;
  requiredAction?:
    | "PROVIDE_OTP"
    | "SOLVE_CAPTCHA"
    | "RETRY"
    | "UPDATE_CREDENTIALS";
  debugUrl?: string;
  iframeConfig?: {
    viewportWidth: number;
    viewportHeight: number;
    cropOffset: number;
    iframeHeight: number;
    containerHeight: number;
  };
  profile?: {
    fullName: string;
    firstName: string;
    lastName: string;
    profileUrl: string;
    headline: string;
    salesNavigator: boolean;
  };
}

export interface LinkedInAuthConfig {
  email: string;
  password: string;
  useProxy: boolean;
  useTwoFactorAuth: boolean;
  proxy_country: string;
  country_code: string;
  twoFactorSecret: string;
}

interface ResumeOptions {
  message?: string;
}

export function useLinkedInAuth() {
  const [authState, setAuthState] = useState<LinkedInAuthState>({
    status: "idle",
    progress: 0,
    currentStep: "",
    message: "",
  });

  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingDelayRef = useRef<number>(0);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map backend status to frontend status
  const mapBackendStatusToFrontend = useCallback(
    (
      step: string,
      status: string,
      connectionStatus: string,
      debugUrl?: string,
      profileData?: any
    ) => {
      // Handle completion - check connection_status from API response
      if (connectionStatus === "CONNECTED" && status === "completed") {
        return "connected";
      }
      if (status === "failed") return "disconnected";

      // Handle waiting for user input states
      if (status === "waiting_for_user_input") {
        if (step === "captcha-solving") return "captcha_required";
        if (step === "otp-verification") return "otp_required";
        // 2fa-approval doesn't require input - just shows notification/waiting
        if (step === "2fa-approval") return "connecting";
        return "connecting";
      }

      // Handle ongoing captcha solving - maintain captcha_required if:
      // 1. Current step is captcha-solving, OR
      // 2. We have a debugUrl (indicating captcha is still active)
      if (step === "captcha-solving" || debugUrl) {
        return "captcha_required";
      }

      // Handle ongoing OTP verification
      if (step === "otp-verification") {
        return "otp_required";
      }

      // Handle 2FA approval step - this is notification-only, no input required
      // User approves on their mobile device, we just show progress messages
      if (step === "2fa-approval") {
        return "connecting"; // Always show as connecting/in-progress, no input needed
      }

      // Default to connecting for other cases
      return "connecting";
    },
    []
  );

  // Poll integration status from API
  const pollIntegrationStatus = useCallback(async () => {
    if (!integrationId) return;

    try {
      const response = await fetch(
        `/api/integration/sync-status?id=${integrationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newDebugUrl = data.metadata?.debugUrl;
        const newStep = data.step || "";
        const newStatus = data.status;
        const connectionStatus = data.connection_status || "";
        const message = data.message || "";

        // Check for invalid credentials error
        const isInvalidCredentials =
          newStep === "challenge-detection" &&
          newStatus === "completed" &&
          message.toUpperCase().includes("INVALID_CREDENTIALS");

        if (isInvalidCredentials) {
          setAuthState(prev => ({
            ...prev,
            status: "disconnected",
            progress: data.progress ?? prev.progress,
            currentStep: newStep,
            message:
              "Invalid credentials. Please check your email and password and try again.",
            error: "INVALID_CREDENTIALS",
            requiredAction: "UPDATE_CREDENTIALS",
          }));
          setIsLoading(false);
          toast.error("Invalid Credentials", {
            description:
              "The email or password you entered is incorrect. Please verify your credentials and try again.",
          });
          // Stop polling - will be cleaned up by useEffect when status changes
          return;
        }

        // Determine the frontend status
        const frontendStatus = mapBackendStatusToFrontend(
          newStep,
          newStatus,
          connectionStatus,
          newDebugUrl,
          data.profile
        );

        setAuthState(prev => {
          // Special handling for captcha state persistence:
          // If we were in captcha_required state and debugUrl is cleared but step is still captcha-solving,
          // maintain the captcha_required state until the step actually changes
          const shouldMaintainCaptchaState =
            prev.status === "captcha_required" &&
            newStep === "captcha-solving" &&
            !newDebugUrl &&
            frontendStatus === "connecting";

          // Additional captcha persistence: if we're in captcha step, always show captcha
          const isCaptchaStep =
            newStep === "captcha-solving" ||
            prev.currentStep === "captcha-solving";
          const shouldForceCaptchaState =
            isCaptchaStep && (newDebugUrl || prev.debugUrl);

          // Prevent completion if we're in captcha state, but only if we're still in captcha step
          const isInCaptchaState =
            (prev.status === "captcha_required" ||
              shouldMaintainCaptchaState ||
              shouldForceCaptchaState) &&
            newStep === "captcha-solving";
          const finalStatus = isInCaptchaState
            ? "captcha_required"
            : frontendStatus;

          return {
            ...prev,
            progress: data.progress ?? prev.progress,
            currentStep: newStep,
            message: message || prev.message,
            status: finalStatus,
            debugUrl:
              newStep === "captcha-solving"
                ? newDebugUrl || prev.debugUrl
                : undefined,
            profile: data.profile || prev.profile, // Store profile data when available
            iframeConfig: data.metadata?.iframeConfig || prev.iframeConfig,
            requiredAction:
              data.status === "waiting_for_user_input"
                ? data.step === "captcha-solving"
                  ? "SOLVE_CAPTCHA"
                  : "PROVIDE_OTP"
                : undefined,
          };
        });

        // Handle completion - check connection_status from API
        if (connectionStatus === "CONNECTED") {
          setAuthState(prev => ({
            ...prev,
            status: "connected",
            message: "LinkedIn connected successfully!",
            progress: 100,
          }));
          setIsLoading(false);
          toast.success("LinkedIn Connected", {
            description:
              "Your LinkedIn account has been successfully connected.",
          });
          // Stop polling - will be cleaned up by useEffect when status changes
        } else if (newStatus === "failed") {
          setAuthState(prev => ({
            ...prev,
            status: "disconnected",
            message: "Authentication failed. Please try again.",
          }));
          setIsLoading(false);
          // Stop polling - will be cleaned up by useEffect when status changes
        }
      } else {
        // Handle non-OK responses
        const errorData = await response.json().catch(() => ({}));
        console.error("Error polling integration status:", {
          status: response.status,
          data: errorData,
        });
      }
    } catch (error) {
      console.error("Error polling integration status:", error);
      // Don't stop polling on error, just log it
    }
  }, [integrationId, mapBackendStatusToFrontend]);

  // Start/stop polling based on integrationId and current status
  useEffect(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }

    // Only poll if we have an integrationId and status indicates we should continue
    if (
      integrationId &&
      authState.status !== "idle" &&
      authState.status !== "connected" &&
      authState.status !== "disconnected"
    ) {
      const delay = pollingDelayRef.current;
      const startPolling = () => {
        pollIntegrationStatus();
        pollingIntervalRef.current = setInterval(() => {
          pollIntegrationStatus();
        }, 3000);
      };

      if (delay && delay > 0) {
        pollingDelayRef.current = 0;
        pollingTimeoutRef.current = setTimeout(() => {
          startPolling();
        }, delay);
      } else {
        startPolling();
      }

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }
      };
    }
  }, [integrationId, authState.status, pollIntegrationStatus]);

  const startAuthentication = useCallback(
    async (config: LinkedInAuthConfig, integrationId: string) => {
      setIsLoading(true);
      setIntegrationId(integrationId);
      pollingDelayRef.current = 0;
      setAuthState({
        status: "connecting",
        progress: 0,
        currentStep: "credential-submission",
        message: "LinkedIn authentication initiated. Checking progress...",
      });

      // Polling will start automatically via the useEffect hook
    },
    []
  );

  const resumeIntegration = useCallback(
    (existingIntegrationId: string, options?: ResumeOptions) => {
      if (!existingIntegrationId) return;

      setIntegrationId(existingIntegrationId);
      setAuthState(prev => ({
        ...prev,
        status: "connecting",
        progress: prev.progress || 0,
        currentStep: prev.currentStep || "credential-submission",
        message:
          options?.message ||
          prev.message ||
          "Resuming LinkedIn authentication. Monitoring progress...",
      }));
      setIsLoading(true);
    },
    []
  );

  const submitOTP = useCallback(
    async (code: string) => {
      if (!integrationId) {
        toast.error("No active integration");
        return;
      }

      setIsLoading(true);
      setAuthState(prev => ({
        ...prev,
        message: "Verifying OTP code...",
        error: undefined, // Clear any previous errors
      }));

      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setAuthState(prev => ({
          ...prev,
          error: "Request timed out. Please try again.",
        }));
        toast.error("Request Timeout", {
          description:
            "The OTP verification request timed out. Please try again.",
        });
      }, 30000); // 30 second timeout

      try {
        const response = await apiCall({
          url: `/api/integration/sendOTP`,
          method: "post",
          body: {
            integrationId,
            code,
          },
          applyDefaultDomain: false,
        });

        clearTimeout(timeoutId); // Clear timeout on successful response
        if (response.status === 200) {
          setAuthState(prev => ({
            ...prev,
            status: "connecting", // Keep as connecting, wait for socket confirmation
            message:
              "OTP verified successfully! Waiting for final confirmation...",
            profile: response.data, // Store profile data but don't mark as connected yet
          }));
          setIsLoading(false);
          toast.success("OTP Verified", {
            description:
              "OTP verified successfully! Waiting for final confirmation...",
          });
        } else {
          const errorMessage = response.data?.message || "Invalid OTP code";
          console.error("🔐 OTP Verification Failed:", {
            status: response.status,
            message: errorMessage,
            response: response.data,
            code: code,
            integrationId: integrationId,
          });

          // Don't throw error immediately, set error state instead
          setAuthState(prev => ({
            ...prev,
            error: errorMessage,
            requiredAction: "PROVIDE_OTP",
          }));
          setIsLoading(false);
          toast.error("OTP Verification Failed", {
            description: errorMessage,
          });
          return; // Exit early instead of throwing
        }
      } catch (error: any) {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error("🔐 OTP verification error:", error);

        // Check if it's a network error or API error
        const errorMessage =
          error.message || "Invalid OTP code. Please try again.";

        setAuthState(prev => ({
          ...prev,
          error: errorMessage,
          requiredAction: "PROVIDE_OTP",
        }));
        setIsLoading(false);
        toast.error("OTP Verification Failed", {
          description: errorMessage,
        });
      }
    },
    [integrationId]
  );

  const reset = useCallback(() => {
    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIntegrationId(null);
    setIsLoading(false);
    setAuthState({
      status: "idle",
      progress: 0,
      currentStep: "",
      message: "",
    });
  }, []);

  // Reset loading state when status changes to prevent stuck loading
  useEffect(() => {
    if (authState.status === "otp_required" && isLoading) {
      // If we're in OTP required state but still loading, reset loading state
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
      }, 5000); // 5 second grace period

      return () => clearTimeout(timeoutId);
    }
  }, [authState.status, isLoading]);

  return {
    authState,
    isLoading,
    isConnected: true, // Always return true since we're not using socket anymore
    startAuthentication,
    submitOTP,
    reset,
    resumeIntegration,
  };
}
