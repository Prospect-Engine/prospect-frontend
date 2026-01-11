import React, { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  CreditCard,
  Loader2,
  Home,
  Settings,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentStatus = "processing" | "success" | "failed" | "cancelled";

interface PaymentProcessingProps {
  sessionId?: string;
  status?: PaymentStatus;
}

function PaymentProcessing({
  sessionId,
  status: initialStatus,
}: PaymentProcessingProps) {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>(
    initialStatus || "processing"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Simulate payment processing steps
  useEffect(() => {
    if (status === "processing") {
      const steps = [
        { step: "Validating payment details...", progress: 20 },
        { step: "Processing with bank...", progress: 40 },
        { step: "Verifying transaction...", progress: 60 },
        { step: "Activating subscription...", progress: 80 },
        { step: "Finalizing...", progress: 100 },
      ];

      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < steps.length) {
          setProgress(steps[currentStep].progress);
          currentStep++;
        } else {
          clearInterval(interval);
          // Simulate successful payment
          setTimeout(() => {
            setStatus("success");
            setIsLoading(false);
            // Redirect to success page after showing success state
            setTimeout(() => {
              router.push("/payment/success");
            }, 3000);
          }, 1000);
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [status]);

  const handleRetry = () => {
    setStatus("processing");
    setIsLoading(true);
    setError(null);
    setProgress(0);
  };

  const handleGoHome = () => {
    router.push("/sales");
  };

  const handleGoToSettings = () => {
    router.push("/settings");
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "bg-green-100";
      case "failed":
      case "cancelled":
        return "bg-red-100";
      default:
        return "bg-primary/10";
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case "success":
        return "Payment Successful!";
      case "failed":
        return "Payment Failed";
      case "cancelled":
        return "Payment Cancelled";
      default:
        return "Processing Payment...";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "success":
        return "Your subscription has been activated and you now have access to all premium features.";
      case "failed":
        return "We encountered an issue processing your payment. Please try again or contact support.";
      case "cancelled":
        return "Your payment was cancelled. No charges have been made to your account.";
      default:
        return "Please wait while we process your payment securely.";
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader className="text-center">
            <div
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                getStatusColor()
              )}
            >
              {getStatusIcon()}
            </div>
            <CardTitle
              className={cn(
                "text-2xl font-bold",
                status === "success" && "text-green-600",
                (status === "failed" || status === "cancelled") &&
                  "text-red-600",
                status === "processing" && "text-primary"
              )}
            >
              {getStatusTitle()}
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-semibold">
                {status === "success"
                  ? "Welcome to your new plan!"
                  : "Payment Status"}
              </p>
              <p className="text-muted-foreground">{getStatusMessage()}</p>
            </div>

            {/* Processing Progress */}
            {status === "processing" && (
              <div className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Processing</span>
                    <span className="text-sm text-muted-foreground">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Your payment is secure and encrypted</span>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold mb-2 text-green-800">
                  What&apos;s next?
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Explore your new features</li>
                  <li>• Set up your preferences</li>
                  <li>• Start using your increased limits</li>
                </ul>
              </div>
            )}

            {/* Error State */}
            {(status === "failed" || status === "cancelled") && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold mb-2 text-red-800">Need Help?</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Check your payment method</li>
                  <li>• Contact your bank if needed</li>
                  <li>• Try a different payment method</li>
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {status === "success" ? (
                <>
                  <Button onClick={handleGoHome} className="w-full" size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>

                  <Button
                    onClick={handleGoToSettings}
                    variant="outline"
                    className="w-full"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Settings
                  </Button>
                </>
              ) : status === "processing" ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>This may take a few moments...</span>
                </div>
              ) : (
                <>
                  <Button onClick={handleRetry} className="w-full" size="lg">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>

                  <Button
                    onClick={handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </>
              )}
            </div>

            {/* Session Info */}
            {sessionId && (
              <div className="text-xs text-muted-foreground">
                Session ID: {sessionId}
              </div>
            )}

            {/* Auto-redirect for success */}
            {status === "success" && (
              <p className="text-xs text-muted-foreground">
                Redirecting to dashboard in 5 seconds...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}

PaymentProcessing.getLayout = (page: ReactNode) => (
  <div className="min-h-screen bg-background">{page}</div>
);

export default PaymentProcessing;
