"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
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
import { ArrowLeft, Loader2, Mail, RefreshCw, Shield } from "lucide-react";
import Link from "next/link";
import OtpTimer from "../../components/OtpTimer";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { verifyEmail, resendOtp, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (router.isReady) {
      const emailParam = router.query.email as string;
      if (emailParam) {
        setEmail(emailParam);
      } else {
        // Redirect to register page if no email provided
        router.push("/register");
      }
    }
  }, [router]);

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError("");
    setSuccess("");
  };

  const validateOTP = (): boolean => {
    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return false;
    }
    return true;
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateOTP()) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use AuthContext's verifyEmail function which handles:
      // - Setting auth state and user data
      // - Storing data in localStorage
      // - Checking subscription status
      // - Routing based on onboarding flow
      await verifyEmail(
        {
          email,
          verification_code: otp,
        },
        (errorData: any) => {
          // Error callback - handle verification failure
          setError(
            errorData.message || "Invalid verification code. Please try again."
          );
          setIsLoading(false);
        }
      );
      // No need for success handling - AuthContext handles routing
      setSuccess("Email verified successfully! Processing...");
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      // Use AuthContext's resendOtp function
      await resendOtp(email);
      setSuccess("Verification code sent successfully!");
      setOtp(""); // Clear the OTP input
    } catch (error) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/register">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Registration
            </Button>
          </Link>
        </div>

        {/* OTP Verification Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-gray-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We&apos;ve sent a 6-digit verification code to
            </CardDescription>
            <div className="flex items-center justify-center mt-2">
              <Mail className="w-4 h-4 text-gray-400 mr-2" />
              <span className="font-medium text-gray-900">{email}</span>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* OTP Input */}
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 font-medium">
                  Verification Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOTPChange}
                  className="text-center text-2xl font-mono tracking-widest bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                  disabled={isLoading || authLoading}
                  maxLength={6}
                  required
                />
                <p className="text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* Timer Component */}
              <OtpTimer onResend={handleResendOTP} isResending={isResending} />

              {/* Verify Button */}
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium transition-all duration-200"
                disabled={isLoading || authLoading || otp.length !== 6}
              >
                {isLoading || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {authLoading ? "Processing..." : "Verifying..."}
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the code?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="text-gray-900 hover:underline font-medium disabled:opacity-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3 h-3 inline mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend Code"
                  )}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
