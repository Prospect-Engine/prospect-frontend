import React, { useState } from "react";
import {
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import authService from "../../services/sales-services/authService";

interface ForgotPasswordFormProps {
  onSwitchToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onSwitchToLogin,
}) => {
  const [step, setStep] = useState<"email" | "token" | "password">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.forgotPassword({ email });

      if (response.success) {
        setSuccess("Password reset instructions sent to your email!");
        setStep("token");
      } else {
        setError(
          response.error ||
            "Failed to send reset instructions. Please try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError("Reset token is required");
      return;
    }

    // Validate token format (6-digit numeric code)
    if (!/^\d{6}$/.test(token.trim())) {
      setError("Token must be a 6-digit numeric code");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // For now, we'll proceed to password step if token is provided
      // In a real implementation, you might want to verify the token first
      setSuccess("Token verified! Please enter your new password.");
      setStep("password");
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setError("New password is required");
      return;
    }
    if (typeof newPassword !== "string") {
      setError("Password must be a string");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.resetPassword({
        otp: token,
        password: newPassword,
      });

      if (response.success) {
        setSuccess(
          "Password reset successfully! You can now sign in with your new password."
        );
        setTimeout(() => {
          onSwitchToLogin();
        }, 2000);
      } else {
        setError(
          response.error || "Failed to reset password. Please try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendResetEmail = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.forgotPassword({ email });

      if (response.success) {
        setSuccess("Reset email resent successfully!");
      } else {
        setError("Failed to resend reset email. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "token") {
    return (
      <div className="w-full">
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-xl">
          <div className="mb-8 text-center">
            <button
              onClick={() => setStep("email")}
              className="flex items-center mb-4 space-x-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to email</span>
            </button>
            <div className="inline-block relative mb-6">
              <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
                <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Enter Reset Token
            </h1>
            <p className="text-sm text-gray-600">
              We&apos;ve sent a reset token to{" "}
              <strong className="text-gray-700">{email}</strong>
            </p>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">{success}</span>
            </div>
          )}

          <form onSubmit={handleTokenSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="token"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Reset Token
              </label>
              <input
                id="token"
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                className="px-3 py-3 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter reset token"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify Token"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the token?{" "}
              <button
                onClick={resendResetEmail}
                disabled={isLoading}
                className="font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50"
              >
                Resend token
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === "password") {
    return (
      <div className="w-full">
        <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-xl">
          <div className="mb-8 text-center">
            <button
              onClick={() => setStep("token")}
              className="flex items-center mb-4 space-x-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to token</span>
            </button>
            <div className="inline-block relative mb-6">
              <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
                <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
                  <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                </div>
              </div>
              <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Set New Password
            </h1>
            <p className="text-sm text-gray-600">
              Enter your new password below
            </p>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">{success}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="py-3 pr-10 pl-10 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 transition-colors transform -translate-y-1/2 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block mb-2 text-sm font-medium text-gray-700"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="py-3 pr-10 pl-10 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 text-gray-400 transition-colors transform -translate-y-1/2 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-xl">
        <div className="mb-8 text-center">
          <button
            onClick={onSwitchToLogin}
            className="flex items-center mb-4 space-x-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to login</span>
          </button>
          <div className="inline-block relative mb-6">
            <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
              <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              </div>
            </div>
            <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Forgot Password
          </h1>
          <p className="text-sm text-gray-600">
            Enter your email to receive reset instructions
          </p>
        </div>

        {error && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">{success}</span>
          </div>
        )}

        <form onSubmit={handleEmailSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              E-Mail Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="py-3 pr-3 pl-10 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter your email..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Send Reset Instructions"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            Remember your password?{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-semibold text-red-600 transition-colors hover:text-red-700"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
