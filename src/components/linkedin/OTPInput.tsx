"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface OTPInputProps {
  onSubmit: (otpCode: string) => void;
  isLoading?: boolean;
  error?: string;
  success?: boolean;
  timeRemaining?: number;
  isAutoVerifying?: boolean;
  className?: string;
}

export function OTPInput({
  onSubmit,
  isLoading = false,
  error,
  success = false,
  timeRemaining,
  isAutoVerifying = false,
  className,
}: OTPInputProps) {
  const [otpCode, setOtpCode] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset submission state when OTP code changes
  useEffect(() => {
    if (otpCode.length < 6) {
      setHasSubmitted(false);
    }
  }, [otpCode]);

  // Reset submission state and clear OTP when there's an error
  useEffect(() => {
    if (error) {
      setHasSubmitted(false);
      setOtpCode(""); // Clear the OTP input on error
    }
  }, [error]);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current && !isAutoVerifying) {
      inputRef.current.focus();
    }
  }, [isAutoVerifying]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      e.key === "Enter" &&
      otpCode.length === 6 &&
      !isLoading &&
      !hasSubmitted
    ) {
      setHasSubmitted(true);
      onSubmit(otpCode);
    }
  };

  const handleSubmit = () => {
    if (otpCode.length === 6 && !isLoading && !hasSubmitted) {
      setHasSubmitted(true);
      onSubmit(otpCode);
    }
  };

  if (isAutoVerifying) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center gap-3 p-6 bg-muted/50 border border-border rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              Auto-verifying OTP code...
            </span>
            <span className="text-xs text-muted-foreground mt-0.5">
              TOTP code is being auto-generated and submitted
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* OTP Input Field */}
      <div className="space-y-3">
        <Label
          htmlFor="otp-code"
          className="text-sm font-semibold text-foreground"
        >
          Verification Code
        </Label>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            ref={inputRef}
            id="otp-code"
            type="text"
            placeholder="000000"
            value={otpCode}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-11 text-base font-mono tracking-[0.5em] text-center transition-colors focus-visible:ring-2",
              error && "border-red-500 focus-visible:ring-red-500",
              success && "border-green-500 focus-visible:ring-green-500"
            )}
            maxLength={6}
            disabled={isLoading || success}
            autoComplete="one-time-code"
            aria-invalid={!!error}
            aria-describedby={
              error ? "otp-error" : success ? "otp-success" : undefined
            }
          />
          <Button
            className="w-full sm:w-auto h-11 px-8 text-base font-semibold transition-colors"
            disabled={
              otpCode.length !== 6 || isLoading || success || hasSubmitted
            }
            onClick={handleSubmit}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Verified
              </>
            ) : (
              "Verify Code"
            )}
          </Button>
        </div>
        {error && (
          <p
            id="otp-error"
            className="text-sm text-red-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
        {success && (
          <p
            id="otp-success"
            className="text-sm text-green-600 font-medium animate-in fade-in-0 slide-in-from-top-1 duration-200 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            OTP verified successfully!
          </p>
        )}
        {timeRemaining !== undefined &&
          timeRemaining > 0 &&
          !error &&
          !success && (
            <p className="text-xs text-muted-foreground">
              Code expires in {timeRemaining} seconds
            </p>
          )}
      </div>
    </div>
  );
}
