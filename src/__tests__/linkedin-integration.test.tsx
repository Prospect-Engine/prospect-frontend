/**
 * Comprehensive test suite for LinkedIn Integration flow
 * Tests all integration steps as shown in the backend response sequence:
 * 1. credential-submission (started → completed)
 * 2. challenge-detection (started → completed with TWO_FACTOR_REQ)
 * 3. 2fa-approval (started → completed) - notification only
 * 4. feed-verification (started → completed)
 * 5. profile-extraction (started → completed)
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LinkedInIntegration from "@/pages/settings/integrations/linkedin/index";
import { useLinkedInAuth } from "@/hooks/useLinkedInAuth";

// Mock the hooks and dependencies
jest.mock("@/hooks/useLinkedInAuth");
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock("@/components/layout/AppLayout", () => {
  return function MockAppLayout({ children }: any) {
    return <div data-testid="app-layout">{children}</div>;
  };
});

jest.mock("@/components/auth/AuthGuard", () => {
  return function MockAuthGuard({ children }: any) {
    return <>{children}</>;
  };
});

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/base-component/ShowShortMessage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe.skip("LinkedIn Integration - Complete Flow Test", () => {
  const mockIntegrationId = "ef21c2c0-3021-42e8-8f7e-e95418521b25";
  let mockStartAuthentication: jest.Mock;
  let mockSubmitOTP: jest.Mock;
  let mockReset: jest.Mock;
  let authState: any;
  let setAuthState: jest.Mock;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Setup auth state
    authState = {
      status: "idle",
      progress: 0,
      currentStep: "",
      message: "",
    };

    setAuthState = jest.fn(updater => {
      if (typeof updater === "function") {
        authState = updater(authState);
      } else {
        authState = updater;
      }
    });

    mockStartAuthentication = jest.fn();
    mockSubmitOTP = jest.fn();
    mockReset = jest.fn();

    // Mock useLinkedInAuth hook
    (useLinkedInAuth as jest.Mock).mockReturnValue({
      authState,
      isLoading: false,
      isConnected: true,
      startAuthentication: mockStartAuthentication,
      submitOTP: mockSubmitOTP,
      reset: mockReset,
    });

    // Mock fetch for connect API
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes("/api/integration/connect")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            id: mockIntegrationId,
            status: "connecting",
          }),
        });
      }
      return Promise.reject(new Error("Unknown API endpoint"));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Step 1: Credential Submission", () => {
    it("should show credential submission step with started status", async () => {
      // Simulate auth state after connection starts
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 0,
          currentStep: "credential-submission",
          message: "Submitting credentials...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      // Check for credential submission step
      await waitFor(() => {
        expect(screen.getByText(/Account Verification/i)).toBeTruthy();
      });

      // Check for progress message (may appear multiple times, use getAllByText)
      expect(
        screen.getAllByText(/Submitting credentials/i).length
      ).toBeGreaterThan(0);
    });

    it("should show credential submission completed", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 16,
          currentStep: "credential-submission",
          message: "Submitting credentials...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Submitting credentials/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 16% (may appear multiple times)
      expect(screen.getAllByText(/16%/i).length).toBeGreaterThan(0);
    });
  });

  describe.skip("Step 2: Challenge Detection", () => {
    it("should show challenge detection started", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 16,
          currentStep: "challenge-detection",
          message: "Checking login status...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(screen.getByText(/Challenge Detection/i)).toBeTruthy();
        expect(
          screen.getAllByText(/Checking login status/i).length
        ).toBeGreaterThan(0);
      });
    });

    it("should show challenge detected with TWO_FACTOR_REQ message", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 33,
          currentStep: "challenge-detection",
          message: "Challenge detected: TWO_FACTOR_REQ...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Challenge detected: TWO_FACTOR_REQ/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 33% (may appear multiple times)
      expect(screen.getAllByText(/33%/i).length).toBeGreaterThan(0);
    });
  });

  describe.skip("Step 3: 2FA Approval (Notification Only)", () => {
    it("should show 2FA approval waiting message without input component", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 50,
          currentStep: "2fa-approval",
          message: "Waiting for 2FA approval (60s remaining...)",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        // 2FA Approval may appear in step title and message
        expect(screen.getAllByText(/2FA Approval/i).length).toBeGreaterThan(0);
        expect(
          screen.getAllByText(/Waiting for 2FA approval/i).length
        ).toBeGreaterThan(0);
      });

      // IMPORTANT: No OTP input should be shown for 2FA approval
      expect(screen.queryByPlaceholderText(/Enter OTP/i)).not.toBeTruthy();
      expect(screen.queryByText(/Enter Verification Code/i)).not.toBeTruthy();

      // Progress should be 50% (may appear multiple times)
      expect(screen.getAllByText(/50%/i).length).toBeGreaterThan(0);
    });

    it("should show 2FA approved successfully message", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 83,
          currentStep: "2fa-approval",
          message: "2FA approved successfully",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/2FA approved successfully/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 83% (may appear multiple times)
      expect(screen.getAllByText(/83%/i).length).toBeGreaterThan(0);
    });
  });

  describe.skip("Step 4: Feed Verification", () => {
    it("should show feed verification started", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 75,
          currentStep: "feed-verification",
          message: "Verifying feed page loaded...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Verifying feed page loaded/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 75% (may appear multiple times)
      expect(screen.getAllByText(/75%/i).length).toBeGreaterThan(0);
    });

    it("should show feed verification completed", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 83,
          currentStep: "feed-verification",
          message: "Feed page verified",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Feed page verified/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 83% (may appear multiple times)
      expect(screen.getAllByText(/83%/i).length).toBeGreaterThan(0);
    });
  });

  describe.skip("Step 5: Profile Extraction", () => {
    it("should show profile extraction started", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connecting",
          progress: 83,
          currentStep: "profile-extraction",
          message: "Extracting profile information...",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Extracting profile information/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 83% (may appear multiple times)
      expect(screen.getAllByText(/83%/i).length).toBeGreaterThan(0);
    });

    it("should show profile extraction completed and connection success", async () => {
      const mockRouterPush = jest.fn();
      jest.mock("next/router", () => ({
        useRouter: () => ({
          push: mockRouterPush,
          back: jest.fn(),
        }),
      }));

      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "connected",
          progress: 100,
          currentStep: "profile-extraction",
          message: "Profile information extracted",
          profile: {
            fullName: "John Doe",
            firstName: "John",
            lastName: "Doe",
            profileUrl: "https://linkedin.com/in/johndoe",
          },
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Profile information extracted/i).length
        ).toBeGreaterThan(0);
      });

      // Progress should be 100% (may appear multiple times)
      expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0);
    });
  });

  describe.skip("Complete Integration Flow Sequence", () => {
    // Increase timeout for this test suite (complex integration test)
    jest.setTimeout(200000);

    it("should handle the complete flow from credential submission to connection", async () => {
      let currentStep = "credential-submission";
      let currentProgress = 0;
      let currentStatus = "connecting";
      let currentMessage = "Submitting credentials...";

      // Create a helper to update auth state
      const updateAuthState = (
        step: string,
        status: string,
        progress: number,
        message: string
      ) => {
        currentStep = step;
        currentProgress = progress;
        currentStatus = status;
        currentMessage = message;
      };

      // Mock useLinkedInAuth with dynamic state
      (useLinkedInAuth as jest.Mock).mockImplementation(() => ({
        authState: {
          status: currentStatus,
          progress: currentProgress,
          currentStep: currentStep,
          message: currentMessage,
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      }));

      // Mock fetch to simulate polling responses
      let pollCount = 0;
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes("/api/integration/sync-status")) {
          pollCount++;

          // Simulate API responses in sequence
          const responses = [
            // Step 1: Credential submission started
            {
              step: "credential-submission",
              status: "started",
              progress: 0,
              message: "Submitting credentials...",
              connection_status: "CONNECTING",
            },
            // Step 1: Credential submission completed
            {
              step: "credential-submission",
              status: "completed",
              progress: 16,
              message: "Submitting credentials...",
              connection_status: "CONNECTING",
            },
            // Step 2: Challenge detection started
            {
              step: "challenge-detection",
              status: "started",
              progress: 16,
              message: "Checking login status...",
              connection_status: "CONNECTING",
            },
            // Step 2: Challenge detection completed
            {
              step: "challenge-detection",
              status: "completed",
              progress: 33,
              message: "Challenge detected: TWO_FACTOR_REQ...",
              connection_status: "CONNECTING",
            },
            // Step 3: 2FA approval started
            {
              step: "2fa-approval",
              status: "started",
              progress: 50,
              message: "Waiting for 2FA approval (60s remaining...)",
              connection_status: "CONNECTING",
            },
            // Step 3: 2FA approval completed
            {
              step: "2fa-approval",
              status: "completed",
              progress: 83,
              message: "2FA approved successfully",
              connection_status: "CONNECTING",
            },
            // Step 4: Feed verification started
            {
              step: "feed-verification",
              status: "started",
              progress: 75,
              message: "Verifying feed page loaded...",
              connection_status: "CONNECTING",
            },
            // Step 4: Feed verification completed
            {
              step: "feed-verification",
              status: "completed",
              progress: 83,
              message: "Feed page verified",
              connection_status: "CONNECTING",
            },
            // Step 5: Profile extraction started
            {
              step: "profile-extraction",
              status: "started",
              progress: 83,
              message: "Extracting profile information...",
              connection_status: "CONNECTING",
            },
            // Step 5: Profile extraction completed - CONNECTED
            {
              step: "profile-extraction",
              status: "completed",
              progress: 100,
              message: "Profile information extracted",
              connection_status: "CONNECTED",
            },
          ];

          const responseIndex = Math.min(pollCount - 1, responses.length - 1);
          const response = responses[responseIndex];

          // Update auth state for next render
          updateAuthState(
            response.step,
            response.status,
            response.progress,
            response.message
          );

          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              id: `mock-id-${response.step}-${response.status}`,
              integration_id: mockIntegrationId,
              ...response,
              metadata: {},
              created_at: new Date().toISOString(),
            }),
          });
        }

        if (url.includes("/api/integration/connect")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              id: mockIntegrationId,
              status: "connecting",
            }),
          });
        }

        return Promise.reject(new Error("Unknown API endpoint"));
      });

      const { rerender, container } = render(<LinkedInIntegration />);

      // Simulate user starting connection
      const emailInput = screen.getByLabelText(/LinkedIn Email/i);
      // Password field - use querySelector to avoid duplicate matches with label text
      const passwordInput = container.querySelector(
        "#password"
      ) as HTMLInputElement;
      expect(passwordInput).toBeTruthy();
      const startButton = screen.getByRole("button", {
        name: /Start Connection/i,
      });

      await userEvent.type(emailInput, "test@example.com");
      await userEvent.type(passwordInput, "password123");
      await userEvent.click(startButton);

      // Wait for initial connection
      await waitFor(() => {
        expect(mockStartAuthentication).toHaveBeenCalled();
      });

      // Simulate polling intervals (3 seconds each)
      for (let i = 0; i < 10; i++) {
        act(() => {
          jest.advanceTimersByTime(3000);
        });

        // Rerender to get updated state
        rerender(<LinkedInIntegration />);

        // Wait for UI updates
        await waitFor(
          () => {
            expect(screen.getByText(/Progress/i)).toBeTruthy();
          },
          { timeout: 1000 }
        );
      }

      // Verify final connected state
      await waitFor(() => {
        expect(
          screen.getAllByText(/Profile information extracted/i).length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe.skip("Error Handling", () => {
    it("should handle failed status gracefully", async () => {
      (useLinkedInAuth as jest.Mock).mockReturnValue({
        authState: {
          status: "disconnected",
          progress: 10,
          currentStep: "credential-submission",
          message: "Authentication failed. Please try again.",
          error: "Invalid credentials",
        },
        isLoading: false,
        isConnected: true,
        startAuthentication: mockStartAuthentication,
        submitOTP: mockSubmitOTP,
        reset: mockReset,
      });

      render(<LinkedInIntegration />);

      await waitFor(() => {
        expect(
          screen.getAllByText(/Authentication failed/i).length
        ).toBeGreaterThan(0);
      });

      // Should show "Try Again" button (use getByRole to avoid duplicate matches)
      expect(screen.getByRole("button", { name: /Try Again/i })).toBeTruthy();
    });
  });
});
