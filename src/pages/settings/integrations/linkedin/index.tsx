"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { apiCall } from "@/lib/apiCall";
import { toast } from "sonner";
import isSuccessful from "@/lib/status";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import { validateEmail, validatePassword } from "@/lib/validation";
import { useLinkedInAuth } from "@/hooks/useLinkedInAuth";
import { ProgressIndicator } from "@/components/linkedin/ProgressIndicator";
import { CaptchaIframe } from "@/components/linkedin/CaptchaIframe";
import { OTPInput } from "@/components/linkedin/OTPInput";
import {
  Linkedin,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Bell,
  Smartphone,
  Phone,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import toastService from "@/services/sales-services/toastService";

interface ConnectionStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "error" | "requires_action";
  icon: React.ComponentType<any>;
  requiresHumanAction?: boolean;
  actionType?: "otp" | "mobile_approval" | "qr_code" | "captcha";
  actionData?: any;
  estimatedTime?: string;
}

interface NotificationData {
  id: string;
  type: "info" | "warning" | "success" | "error";
  title: string;
  message: string;
  actionRequired?: boolean;
  actionText?: string;
  timestamp: string;
}

const countries = [
  { name: "United States", code: "US" },
  { name: "Canada", code: "CA" },
  { name: "United Kingdom", code: "GB" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Italy", code: "IT" },
  { name: "Spain", code: "ES" },
  { name: "Netherlands", code: "NL" },
  { name: "Sweden", code: "SE" },
  { name: "Norway", code: "NO" },
  { name: "Denmark", code: "DK" },
  { name: "Finland", code: "FI" },
  { name: "Switzerland", code: "CH" },
  { name: "Austria", code: "AT" },
  { name: "Belgium", code: "BE" },
  { name: "Ireland", code: "IE" },
  { name: "Portugal", code: "PT" },
  { name: "Poland", code: "PL" },
  { name: "Czech Republic", code: "CZ" },
  { name: "Hungary", code: "HU" },
  { name: "Romania", code: "RO" },
  { name: "Bulgaria", code: "BG" },
  { name: "Croatia", code: "HR" },
  { name: "Slovenia", code: "SI" },
  { name: "Slovakia", code: "SK" },
  { name: "Estonia", code: "EE" },
  { name: "Bangladesh", code: "BD" },
  { name: "Latvia", code: "LV" },
  { name: "Lithuania", code: "LT" },
  { name: "Australia", code: "AU" },
  { name: "New Zealand", code: "NZ" },
  { name: "Japan", code: "JP" },
  { name: "South Korea", code: "KR" },
  { name: "Singapore", code: "SG" },
  { name: "Hong Kong", code: "HK" },
  { name: "Taiwan", code: "TW" },
  { name: "India", code: "IN" },
  { name: "Brazil", code: "BR" },
  { name: "Mexico", code: "MX" },
  { name: "Argentina", code: "AR" },
  { name: "Chile", code: "CL" },
  { name: "Colombia", code: "CO" },
  { name: "Peru", code: "PE" },
  { name: "South Africa", code: "ZA" },
  { name: "Israel", code: "IL" },
  { name: "Turkey", code: "TR" },
  { name: "Russia", code: "RU" },
  { name: "Ukraine", code: "UA" },
  { name: "Belarus", code: "BY" },
  { name: "Kazakhstan", code: "KZ" },
  { name: "Uzbekistan", code: "UZ" },
  { name: "Thailand", code: "TH" },
  { name: "Malaysia", code: "MY" },
  { name: "Indonesia", code: "ID" },
  { name: "Philippines", code: "PH" },
  { name: "Vietnam", code: "VN" },
  { name: "China", code: "CN" },
  { name: "Egypt", code: "EG" },
  { name: "Nigeria", code: "NG" },
  { name: "Kenya", code: "KE" },
  { name: "Morocco", code: "MA" },
  { name: "Tunisia", code: "TN" },
  { name: "Algeria", code: "DZ" },
  { name: "Ghana", code: "GH" },
  { name: "Ethiopia", code: "ET" },
  { name: "Uganda", code: "UG" },
  { name: "Tanzania", code: "TZ" },
];

function LinkedInIntegrationContent() {
  const router = useRouter();
  const {
    authState,
    isLoading,
    isConnected,
    startAuthentication,
    submitOTP,
    reset,
    resumeIntegration,
  } = useLinkedInAuth();

  // Form state
  const [showPassword, setShowPassword] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    useProxy: false,
    useTwoFactorAuth: false,
    proxy_country: "",
    country_code: "",
    twoFactorSecret: "",
  });

  // Integration ID will be set from API response
  const [integrationId, setIntegrationId] = useState<string | null>(null);
  const [hasResumedFromQuery, setHasResumedFromQuery] = useState(false);

  // Error state for better validation feedback
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    proxy_country?: string;
    twoFactorSecret?: string;
  }>({});

  // Handle form input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle OTP submission
  const handleOTPSubmit = useCallback(
    async (otpCode: string) => {
      await submitOTP(otpCode);
    },
    [submitOTP]
  );

  // Handle redirect when connection is successful
  useEffect(() => {
    if (authState.status === "connected") {
      ShowShortMessage("LinkedIn connected successfully!");
      setTimeout(() => {
        try {
          router.push("/settings/integrations");
        } catch (error) {
          console.error("❌ Router push failed, using window.location:", error);
          window.location.href = "/settings/integrations";
        }
      }, 1000);
    }
  }, [authState.status, router]);

  useEffect(() => {
    if (!router.isReady || hasResumedFromQuery) return;

    const { integrationId: integrationIdQuery, mode } = router.query;

    if (
      typeof integrationIdQuery === "string" &&
      (mode === "reconnect" || mode === "resume")
    ) {
      resumeIntegration(integrationIdQuery, {
        message:
          "Reconnection initiated. Follow the steps below to complete LinkedIn authentication.",
      });
      setIntegrationId(integrationIdQuery);
      setHasResumedFromQuery(true);
    }
  }, [router.isReady, router.query, hasResumedFromQuery, resumeIntegration]);

  const startConnectionProcess = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate form data
    const errors: typeof fieldErrors = {};
    let isValid = true;

    if (!formData.email) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password) {
      errors.password = "Password is required";
      isValid = false;
    } else if (!validatePassword(formData.password)) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.proxy_country) {
      errors.proxy_country = "Please select a proxy country";
      isValid = false;
    }

    if (formData.useTwoFactorAuth && !formData.twoFactorSecret.trim()) {
      errors.twoFactorSecret =
        "2FA secret code is required when 2FA is enabled";
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
      ShowShortMessage("Please fix the errors before continuing", "error");
      return;
    }

    try {
      // Check if this is a reconnect flow (has existing integrationId from query params)
      const { mode, integrationId: queryIntegrationId } = router.query;
      const isReconnectMode =
        (mode === "reconnect" || mode === "resume") &&
        typeof queryIntegrationId === "string";

      if (isReconnectMode) {
        // Reconnect flow: use reconnect API with credentials for full re-auth
        const reconnectResponse = await apiCall({
          url: "/api/integration/reconnect",
          method: "post",
          body: {
            integration_id: queryIntegrationId,
            email: formData.email.trim(),
            password: formData.password.trim(),
            country_name: formData.proxy_country,
            country_code: formData.country_code || "US",
            use_authenticator: formData.useTwoFactorAuth,
            authenticator_secret: formData.useTwoFactorAuth
              ? formData.twoFactorSecret
              : null,
          },
          applyDefaultDomain: false,
        });

        if (isSuccessful(reconnectResponse.status)) {
          // Reconnection initiated, start polling
          setIntegrationId(queryIntegrationId);
          await startAuthentication(formData, queryIntegrationId);
        } else {
          console.error("Reconnection API error:", {
            status: reconnectResponse.status,
            message: reconnectResponse.data?.message,
            data: reconnectResponse.data,
          });
          return;
        }
      } else {
        // New integration flow: create via connect API
        const connectResponse = await apiCall({
          url: "/api/integration/connect",
          method: "post",
          body: {
            email: formData.email.trim(),
            password: formData.password.trim(),
            country_name: formData.proxy_country,
            country_code: formData.country_code || "US",
            type: "LINKEDIN",
            use_authenticator: formData.useTwoFactorAuth,
            authenticator_secret: formData.useTwoFactorAuth
              ? formData.twoFactorSecret
              : null,
          },
          applyDefaultDomain: false,
        });

        if (isSuccessful(connectResponse.status)) {
          const newIntegrationId = connectResponse.data.id;
          setIntegrationId(newIntegrationId);

          // Now start authentication with the integration ID
          await startAuthentication(formData, newIntegrationId);
        } else {
          // apiCall already shows the error toast automatically
          console.error("Connection API error:", {
            status: connectResponse.status,
            message: connectResponse.data?.message,
            data: connectResponse.data,
          });
          return;
        }
      }
    } catch (error: any) {
      // apiCall already handles network errors and shows toasts
      console.error("Connection error:", error);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleCountrySelect = (country: { name: string; code: string }) => {
    handleInputChange("proxy_country", country.name);
    handleInputChange("country_code", country.code);
    setCountrySearch("");
    setIsCountryDropdownOpen(false);
    if (fieldErrors.proxy_country) {
      setFieldErrors(prev => ({ ...prev, proxy_country: undefined }));
    }
  };

  // Generate progress steps based on auth state
  const getProgressSteps = () => {
    const steps = [
      {
        id: "credential-submission",
        title: "Account Verification",
        description: "Verify your LinkedIn account credentials",
        status: (authState.currentStep === "credential-submission"
          ? authState.status === "connecting"
            ? "in_progress"
            : "completed"
          : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "credential-submission"
            ? authState.progress
            : 0,
        message:
          authState.currentStep === "credential-submission"
            ? authState.message
            : "",
        estimatedTime: "15-25 seconds",
      },
      {
        id: "challenge-detection",
        title: "Challenge Detection",
        description: "Detecting security challenges (captcha, OTP, etc.)",
        status: (authState.currentStep === "challenge-detection"
          ? authState.error === "INVALID_CREDENTIALS" ||
            authState.requiredAction === "UPDATE_CREDENTIALS"
            ? "error"
            : authState.status === "connecting"
              ? "in_progress"
              : "completed"
          : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "challenge-detection"
            ? authState.progress
            : 0,
        message:
          authState.currentStep === "challenge-detection"
            ? authState.message
            : "",
        estimatedTime: "2-5 seconds",
      },
      {
        id: "captcha-solving",
        title: "Captcha Verification",
        description: "Solve captcha challenge if required",
        status: (authState.status === "captcha_required"
          ? "waiting_for_user_input"
          : authState.currentStep === "captcha-solving"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? "completed"
              : "in_progress"
            : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "captcha-solving"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? 100
              : authState.progress
            : 0,
        message:
          authState.currentStep === "captcha-solving"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? "Captcha solved successfully!"
              : authState.message
            : "",
        estimatedTime: "3-5 minutes",
      },
      {
        id: "otp-verification",
        title: "OTP Verification",
        description: "Verify two-factor authentication code",
        status: (authState.status === "otp_required"
          ? "waiting_for_user_input"
          : authState.currentStep === "otp-verification"
            ? "in_progress"
            : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "otp-verification" ? authState.progress : 0,
        message:
          authState.currentStep === "otp-verification" ? authState.message : "",
        estimatedTime: "2-5 seconds (TOTP) or 30-120s (manual)",
      },
      {
        id: "2fa-approval",
        title: "2FA Approval",
        description:
          "Waiting for two-factor authentication approval on your device",
        status: (authState.currentStep === "2fa-approval"
          ? authState.status === "connected" || authState.status === "completed"
            ? "completed"
            : "in_progress"
          : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "2fa-approval"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? 100
              : authState.progress
            : 0,
        message:
          authState.currentStep === "2fa-approval" ? authState.message : "",
        estimatedTime: "30-120 seconds",
      },
      {
        id: "feed-verification",
        title: "Feed Verification",
        description: "Verifying LinkedIn feed page access",
        status: (authState.currentStep === "feed-verification"
          ? authState.status === "connected" || authState.status === "completed"
            ? "completed"
            : "in_progress"
          : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "feed-verification"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? 100
              : authState.progress
            : 0,
        message:
          authState.currentStep === "feed-verification"
            ? authState.message
            : "",
        estimatedTime: "5-10 seconds",
      },
      {
        id: "profile-extraction",
        title: "Profile Extraction",
        description: "Extract LinkedIn profile information",
        status: (authState.currentStep === "profile-extraction"
          ? authState.status === "connected" || authState.status === "completed"
            ? "completed"
            : "in_progress"
          : "pending") as
          | "pending"
          | "in_progress"
          | "completed"
          | "error"
          | "waiting_for_user_input",
        progress:
          authState.currentStep === "profile-extraction"
            ? authState.status === "connected" ||
              authState.status === "completed"
              ? 100
              : authState.progress
            : 0,
        message:
          authState.currentStep === "profile-extraction"
            ? authState.message
            : "",
        estimatedTime: "5-10 seconds",
      },
      // {
      //   id: "profile-extraction",
      //   title: "Profile Extraction",
      //   description: "Extract LinkedIn profile information",
      //   status: (authState.currentStep === "profile-extraction"
      //     ? authState.status === "connected"
      //       ? "completed"
      //       : "in_progress"
      //     : "pending") as
      //     | "pending"
      //     | "in_progress"
      //     | "completed"
      //     | "error"
      //     | "waiting_for_user_input",
      //   progress:
      //     authState.currentStep === "profile-extraction"
      //       ? authState.progress
      //       : 0,
      //   message:
      //     authState.currentStep === "profile-extraction"
      //       ? authState.message
      //       : "",
      //   estimatedTime: "5-10 seconds",
      // },
    ];

    return steps;
  };

  const shouldShowProgressPanel =
    authState.status === "connecting" ||
    authState.status === "otp_required" ||
    authState.status === "captcha_required" ||
    authState.status === "disconnected" ||
    authState.status === "connected";

  const statusMessage =
    authState.message ||
    (authState.status === "connected"
      ? "LinkedIn authentication completed successfully."
      : authState.status === "disconnected"
        ? "Connection interrupted. Please review the step details below."
        : "LinkedIn authentication initiated. Checking progress...");

  const progressSteps = getProgressSteps();

  const completedSteps = progressSteps
    .filter(step => step.status === "completed")
    .reverse();

  const activeStep =
    progressSteps.find(step => step.id === authState.currentStep) ||
    progressSteps.find(step => step.status === "in_progress") ||
    progressSteps.find(step => step.status === "waiting_for_user_input") ||
    completedSteps[0] ||
    progressSteps[0];

  const visibleSteps = activeStep ? [activeStep] : [];

  return (
    <AuthGuard>
      <AppLayout activePage="Settings">
        <style jsx>{`
          @keyframes stepSlideIn {
            0% {
              opacity: 0;
              transform: translateX(20px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1.02);
            }
          }

          @keyframes notificationSlideIn {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes layoutExpand {
            0% {
              max-width: 50%;
              transform: scale(0.98);
            }
            100% {
              max-width: 100%;
              transform: scale(1);
            }
          }

          @keyframes layoutContract {
            0% {
              max-width: 100%;
              transform: scale(1);
            }
            100% {
              max-width: 50%;
              transform: scale(0.98);
            }
          }

          .scrollbar-hide {
            -ms-overflow-style: none; /* Internet Explorer 10+ */
            scrollbar-width: none; /* Firefox */
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none; /* Safari and Chrome */
          }
        `}</style>
        <div className="space-y-6">
          {/* Two-column responsive layout; right panel remains reserved */}
          <div
            className={cn(
              "transition-all duration-700 ease-in-out",
              "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(360px,1fr)]"
            )}
          >
            {/* Left Side - Credentials Form */}
            <div className="space-y-6 transition-all duration-700 ease-in-out">
              <Card
                className={cn(
                  "bg-card backdrop-blur-sm border border-border shadow-sm transition-all duration-200",
                  authState.status === "connecting"
                    ? "opacity-90"
                    : "hover:shadow-md"
                )}
              >
                <CardHeader className="space-y-4">
                  <div className="flex justify-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.history.back()}
                      className="-ml-2 text-sm font-medium hover:bg-accent transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-2xl font-semibold text-foreground">
                        Account Credentials
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed">
                      Enter your LinkedIn account information to begin the
                      connection process
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Email */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="email"
                      className="text-sm font-semibold text-foreground"
                    >
                      LinkedIn Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@company.com"
                      value={formData.email || ""}
                      onChange={e => {
                        handleInputChange("email", e.target.value);
                        if (fieldErrors.email) {
                          setFieldErrors(prev => ({
                            ...prev,
                            email: undefined,
                          }));
                        }
                      }}
                      className={cn(
                        "h-11 text-base transition-colors focus-visible:ring-2",
                        fieldErrors.email &&
                          "border-red-500 focus-visible:ring-red-500"
                      )}
                      disabled={isLoading}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby={
                        fieldErrors.email ? "email-error" : undefined
                      }
                    />
                    {fieldErrors.email && (
                      <p
                        id="email-error"
                        className="text-sm text-red-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200"
                      >
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password || ""}
                        onChange={e => {
                          handleInputChange("password", e.target.value);
                          if (fieldErrors.password) {
                            setFieldErrors(prev => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        className={cn(
                          "h-11 text-base pr-12 transition-colors focus-visible:ring-2",
                          fieldErrors.password &&
                            "border-red-500 focus-visible:ring-red-500"
                        )}
                        disabled={isLoading}
                        aria-invalid={!!fieldErrors.password}
                        aria-describedby={
                          fieldErrors.password ? "password-error" : undefined
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 p-0 hover:bg-accent"
                        onClick={() => setShowPassword(!showPassword || false)}
                        disabled={isLoading}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {fieldErrors.password && (
                      <p
                        id="password-error"
                        className="text-sm text-red-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200"
                      >
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                  {/* Proxy Country */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="proxy_country"
                      className="text-sm font-semibold text-foreground"
                    >
                      Proxy Country
                    </Label>
                    <Popover
                      open={isCountryDropdownOpen}
                      onOpenChange={setIsCountryDropdownOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isCountryDropdownOpen}
                          className={cn(
                            "w-full justify-between h-11 text-base font-normal transition-colors",
                            fieldErrors.proxy_country && "border-red-500"
                          )}
                          disabled={isLoading}
                          aria-invalid={!!fieldErrors.proxy_country}
                          aria-describedby={
                            fieldErrors.proxy_country
                              ? "country-error"
                              : undefined
                          }
                        >
                          {formData.proxy_country || "Select a country"}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[var(--radix-popover-trigger-width)] p-0"
                        align="start"
                      >
                        <div className="p-3 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search countries..."
                              value={countrySearch}
                              onChange={e => setCountrySearch(e.target.value)}
                              className="pl-10 h-9"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map(country => (
                              <div
                                key={country.code}
                                className="flex items-center justify-between px-3 py-2 hover:bg-muted cursor-pointer"
                                onClick={() => handleCountrySelect(country)}
                              >
                                <span className="text-sm">{country.name}</span>
                                {formData.proxy_country === country.name && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                              No countries found.
                            </div>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                    {fieldErrors.proxy_country && (
                      <p
                        id="country-error"
                        className="text-sm text-red-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200"
                      >
                        {fieldErrors.proxy_country}
                      </p>
                    )}
                  </div>

                  <Separator className="my-8" />

                  {/* Two-Factor Authentication */}
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="useTwoFactorAuth"
                          checked={formData.useTwoFactorAuth || false}
                          onCheckedChange={checked =>
                            handleInputChange("useTwoFactorAuth", checked)
                          }
                          className="mt-1"
                          disabled={isLoading}
                        />
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor="useTwoFactorAuth"
                            className="text-sm font-medium text-foreground cursor-pointer leading-relaxed"
                          >
                            Use Two-Factor Authentication (2FA)
                          </Label>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Check this if your LinkedIn account has 2FA enabled
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2FA Secret Code Input - Only show when 2FA is enabled */}
                    {formData.useTwoFactorAuth && (
                      <div className="space-y-3 pl-14 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                        <Label
                          htmlFor="twoFactorSecret"
                          className="text-sm font-semibold text-foreground"
                        >
                          2FA Secret Code
                        </Label>
                        <Input
                          id="twoFactorSecret"
                          type="text"
                          placeholder="Enter your 2FA secret code"
                          value={formData.twoFactorSecret}
                          onChange={e => {
                            handleInputChange(
                              "twoFactorSecret",
                              e.target.value
                            );
                            if (fieldErrors.twoFactorSecret) {
                              setFieldErrors(prev => ({
                                ...prev,
                                twoFactorSecret: undefined,
                              }));
                            }
                          }}
                          className={cn(
                            "h-11 text-base transition-colors focus-visible:ring-2 font-mono",
                            fieldErrors.twoFactorSecret &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                          maxLength={32}
                          disabled={isLoading}
                          aria-invalid={!!fieldErrors.twoFactorSecret}
                          aria-describedby={
                            fieldErrors.twoFactorSecret
                              ? "2fa-error"
                              : undefined
                          }
                        />
                        {fieldErrors.twoFactorSecret ? (
                          <p
                            id="2fa-error"
                            className="text-sm text-red-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200"
                          >
                            {fieldErrors.twoFactorSecret}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            Enter the secret code from your authenticator app
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Start Connection Button */}
                  <div className="pt-6">
                    <Button
                      className="w-full h-12 text-base font-semibold transition-colors"
                      onClick={startConnectionProcess}
                      disabled={
                        !formData.email ||
                        !formData.password ||
                        !formData.proxy_country ||
                        isLoading
                      }
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Linkedin className="w-5 h-5 mr-2" />
                          Start Connection
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - Status, Progress, and Verification Helpers */}
            <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-700">
              {shouldShowProgressPanel ? (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Integration Status
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {statusMessage}
                        </p>
                      </div>
                      {authState.status === "connecting" && (
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting...</span>
                        </div>
                      )}
                      {authState.status === "disconnected" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={reset}
                          className="h-8 text-xs transition-all duration-300 ease-in-out hover:scale-105"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Try Again
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span>Progress</span>
                        <span>{authState.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-700 ease-in-out"
                          style={{ width: `${authState.progress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card/60 backdrop-blur-2xl border border-dashed border-border/40 rounded-2xl">
                  <CardContent className="p-6 text-sm text-muted-foreground">
                    Start a connection to view real-time status updates here.
                  </CardContent>
                </Card>
              )}

              {shouldShowProgressPanel && visibleSteps.length > 0 && (
                <Card className="bg-card/60 backdrop-blur-2xl rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Current Step
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Bell className="w-4 h-4" />
                        <span>{activeStep?.title}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ProgressIndicator
                      steps={visibleSteps}
                      currentStep={authState.currentStep}
                    />
                  </CardContent>
                </Card>
              )}

              {(authState.status === "captcha_required" ||
                authState.currentStep === "captcha-solving") &&
                authState.debugUrl && (
                  <Card className="bg-card/60 backdrop-blur-2xl border border-blue-200/40 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold text-foreground">
                        Captcha Verification
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Complete the captcha challenge to continue
                        authentication.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CaptchaIframe
                        debugUrl={authState.debugUrl}
                        iframeConfig={authState.iframeConfig}
                        status={authState.status}
                        onCaptchaSolved={() => {
                          // Captcha solved callback handled via socket updates
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

              {authState.status === "otp_required" && (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-foreground">
                      Enter OTP Code
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Provide the verification code from your authenticator or
                      SMS to continue.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OTPInput
                      onSubmit={handleOTPSubmit}
                      isLoading={isLoading}
                      error={authState.error}
                      success={false}
                      isAutoVerifying={
                        authState.message?.includes("auto") || false
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}

export default function LinkedInIntegration() {
  return <LinkedInIntegrationContent />;
}
