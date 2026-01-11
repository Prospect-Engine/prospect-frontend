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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Mail, RefreshCw } from "lucide-react";

export default function VerifyOTPPage() {
  const router = useRouter();
  const { verifyEmail, resendOtp, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    const emailParam = router.query.email as string;
    if (emailParam) {
      setEmail(emailParam);
    } else {
      // Redirect to auth page if no email provided
      router.push("/auth");
    }
  }, [router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError("");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError("");

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
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setError("");

    try {
      // Use AuthContext's resendOtp function
      await resendOtp(email);
      setTimeLeft(300); // Reset timer
      setOtp(""); // Clear OTP field
      setError("Verification code has been resent to your email.");
    } catch (error) {
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToAuth = () => {
    router.push("/auth");
  };

  if (!email) {
    return <VerifyOTPSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Mail className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Verify Your Email
          </h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a 6-digit verification code to
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        {/* OTP Verification Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Enter Verification Code
            </CardTitle>
            <CardDescription className="text-center">
              Please enter the code we sent to your email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || authLoading ? (
              <VerifyOTPSkeleton />
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOTPChange}
                    className="text-center text-2xl font-mono tracking-widest"
                    maxLength={6}
                    required
                    disabled={isLoading || authLoading}
                    autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div className="text-sm text-destructive text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || authLoading || otp.length !== 6}
                >
                  {isLoading || authLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {authLoading ? "Processing..." : "Verifying..."}
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>
              </form>
            )}

            {/* Timer and Resend */}
            <div className="mt-6 text-center space-y-2">
              {timeLeft > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Code expires in {formatTime(timeLeft)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Code has expired
                </p>
              )}

              <Button
                variant="link"
                onClick={handleResendOTP}
                disabled={isResending || timeLeft > 0}
                className="text-sm"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>

            {/* Back to Auth */}
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToAuth}
                className="text-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Didn&apos;t receive the code? Check your spam folder or{" "}
            <Button
              variant="link"
              className="px-0 text-sm"
              onClick={handleResendOTP}
              disabled={isResending || timeLeft > 0}
            >
              resend
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Skeleton Component
function VerifyOTPSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="text-center space-y-2">
        <Skeleton className="h-4 w-40 mx-auto" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </div>
    </div>
  );
}
