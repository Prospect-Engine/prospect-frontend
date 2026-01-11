"use client";

import { useState, useEffect } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Lock, RefreshCw, Eye, EyeOff } from "lucide-react";
import ShowShortMessage from "@/base-component/ShowShortMessage";

interface ValidationErrors {
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
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
    setErrors(prev => ({ ...prev, otp: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitted(true);
    setErrors({});

    // Client-side validation
    const validationErrors: ValidationErrors = {};

    if (!otp || otp.length !== 6) {
      validationErrors.otp = "Please enter a valid 6-digit verification code";
    }

    if (!password) {
      validationErrors.password = "Password is required";
    } else if (password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        ShowShortMessage(data.message, "success");
        // Redirect to auth page after successful reset
        setTimeout(() => {
          router.push("/auth");
        }, 1500);
      } else {
        const errorMessage =
          data.message || "Failed to reset password. Please try again.";
        ShowShortMessage(errorMessage, "error");
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      ShowShortMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToAuth = () => {
    router.push("/auth");
  };

  if (!email) {
    return <ResetPasswordSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter the verification code sent to
          </p>
          <p className="font-medium text-foreground">{email}</p>
        </div>

        {/* Reset Password Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Create New Password
            </CardTitle>
            <CardDescription className="text-center">
              Enter your verification code and new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ResetPasswordSkeleton />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    disabled={isLoading}
                    autoComplete="one-time-code"
                    aria-invalid={submitted && errors.otp ? "true" : "false"}
                    aria-describedby={
                      submitted && errors.otp ? "otp-error" : undefined
                    }
                  />
                  {submitted && errors.otp && (
                    <p
                      id="otp-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.otp}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }}
                      required
                      disabled={isLoading}
                      className="pr-10"
                      aria-invalid={
                        submitted && errors.password ? "true" : "false"
                      }
                      aria-describedby={
                        submitted && errors.password
                          ? "password-error password-hint"
                          : "password-hint"
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff
                          className="w-4 h-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="w-4 h-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  </div>
                  {submitted && errors.password ? (
                    <p
                      id="password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.password}
                    </p>
                  ) : (
                    <p
                      id="password-hint"
                      className="text-xs text-muted-foreground"
                    >
                      Must be at least 8 characters long
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setErrors(prev => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }}
                      required
                      disabled={isLoading}
                      className="pr-10"
                      aria-invalid={
                        submitted && errors.confirmPassword ? "true" : "false"
                      }
                      aria-describedby={
                        submitted && errors.confirmPassword
                          ? "confirm-password-error"
                          : undefined
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          className="w-4 h-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="w-4 h-4 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </Button>
                  </div>
                  {submitted && errors.confirmPassword && (
                    <p
                      id="confirm-password-error"
                      className="text-sm text-destructive"
                      role="alert"
                    >
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Timer */}
                {timeLeft > 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Code expires in {formatTime(timeLeft)}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    isLoading ||
                    otp.length !== 6 ||
                    !password ||
                    !confirmPassword
                  }
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {/* Back to Auth */}
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={handleBackToAuth}
                className="text-sm"
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeleton Component
function ResetPasswordSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  );
}
