import React, { useState } from "react";
import { AlertCircle, CheckCircle, ArrowLeft, Mail } from "lucide-react";
import authService from "../../services/sales-services/authService";

interface EmailVerificationProps {
  email: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
  context: "signup" | "login";
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
  email,
  onVerificationSuccess,
  onBack,
  context,
}) => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError("Verification code is required");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.verifyEmail({
        token: verificationCode,
      });

      if (response.success) {
        setSuccess("Email verified successfully!");

        // If this is a login verification, we need to login the user after verification
        if (context === "login") {
          // The user should now be able to login, so we can proceed
          setTimeout(() => {
            onVerificationSuccess();
          }, 1500);
        } else {
          // For signup, just show success and let parent handle
          setTimeout(() => {
            onVerificationSuccess();
          }, 1500);
        }
      } else {
        setError(
          response.error || "Invalid verification code. Please try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.resendVerification({
        email: email,
      });

      if (response.success) {
        setSuccess("Verification code resent successfully!");
      } else {
        setError("Failed to resend verification code. Please try again.");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-xl">
        <div className="mb-8 text-center">
          <button
            onClick={onBack}
            className="flex items-center mb-4 space-x-1 text-xs font-medium text-red-600 transition-colors hover:text-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {context === "login" ? "login" : "signup"}</span>
          </button>
          <div className="inline-block relative mb-6">
            <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Verify Your Email
          </h1>
          <p className="text-sm text-gray-600">
            We&apos;ve sent a verification code to{" "}
            <strong className="font-semibold text-red-600">{email}</strong>
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

        <form onSubmit={handleVerification} className="space-y-5">
          <div>
            <label
              htmlFor="verificationCode"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={e => setVerificationCode(e.target.value)}
              className="px-3 py-3 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter verification code"
              maxLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="mb-2 text-sm text-gray-600">
            Didn&apos;t receive the code?
          </p>
          <button
            onClick={resendVerificationCode}
            disabled={isLoading}
            className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Sending..." : "Resend verification code"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
