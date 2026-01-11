"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface OtpTimerProps {
  onResend: () => void;
  isResending: boolean;
  initialTime?: number; // in seconds
}

export default function OtpTimer({
  onResend,
  isResending,
  initialTime = 300, // 5 minutes default
}: OtpTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleResend = () => {
    if (canResend && !isResending) {
      setTimeLeft(initialTime);
      setCanResend(false);
      onResend();
    }
  };

  return (
    <div className="text-center">
      {!canResend ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Resend code in{" "}
            <span className="font-mono font-medium text-gray-900">
              {formatTime(timeLeft)}
            </span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gray-400 h-2 rounded-full transition-all duration-1000 ease-linear"
              style={{
                width: `${((initialTime - timeLeft) / initialTime) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleResend}
          disabled={isResending}
          className="w-full border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        >
          {isResending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend Code
            </>
          )}
        </Button>
      )}
    </div>
  );
}
