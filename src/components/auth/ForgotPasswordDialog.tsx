"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShowShortMessage from "@/base-component/ShowShortMessage";

interface ForgotPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ValidationErrors {
  email?: string;
}

export default function ForgotPasswordDialog({
  open,
  onOpenChange,
}: ForgotPasswordDialogProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitted(true);
    setErrors({});

    // Client-side validation
    const validationErrors: ValidationErrors = {};
    if (!email.trim()) {
      validationErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      validationErrors.email = "Please enter a valid email address";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        ShowShortMessage(data.message, "success");
        // Close dialog and redirect to reset password page immediately
        const emailParam = email.toLowerCase().trim();
        onOpenChange(false);
        // Use replace to avoid back button issues
        router.replace(
          `/reset-password?email=${encodeURIComponent(emailParam)}`
        );
      } else {
        const errorMessage =
          data.message || "Failed to send reset code. Please try again.";
        ShowShortMessage(errorMessage, "error");
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      ShowShortMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail("");
      setErrors({});
      setSubmitted(false);
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Forgot Password?</DialogTitle>
          <DialogDescription className="text-center">
            {success
              ? "We've sent a password reset code to your email. Redirecting..."
              : "Enter your email address and we'll send you a code to reset your password."}
          </DialogDescription>
        </DialogHeader>

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
                aria-invalid={submitted && errors.email ? "true" : "false"}
                aria-describedby={
                  submitted && errors.email ? "forgot-email-error" : undefined
                }
              />
              {submitted && errors.email && (
                <p
                  id="forgot-email-error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {errors.email}
                </p>
              )}
            </div>

            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Code"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {success && (
          <div className="flex justify-center py-4">
            <div className="w-8 h-8 rounded-full border-4 animate-spin border-primary border-t-transparent"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
