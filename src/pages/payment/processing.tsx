"use client";

import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Loader2, Clock } from "lucide-react";
import { formatDate, formatTime } from "@/lib/helper";
import { apiCall } from "@/lib/apiCall";

interface SubscriptionItem {
  is_selected: boolean;
  trial_conflict?: boolean;
  is_conflict_resolved?: boolean;
  plan_code: string;
  start_date: string;
  seat_count: number;
  is_trial: boolean;
  is_active?: boolean;
}

interface ProcessingData {
  plan_name: string;
  order_id: string;
  date: string;
  seat_number: number;
  is_trial: boolean;
  total_amount: number;
  is_success: boolean;
  is_processing: boolean;
  is_payment_failed: boolean;
  message: string;
  is_card_duplicate: boolean;
  trial_conflict: boolean;
  is_conflict_resolved: boolean;
  subscription: SubscriptionItem[];
  invoice: {
    id: string;
    amount_paid: number;
  };
}

const SuccessBox = ({
  data,
  selectedSubscription,
  router,
}: {
  data: ProcessingData;
  selectedSubscription: SubscriptionItem;
  router: any;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
    <Card className="max-w-2xl w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-green-600">
          Subscription Successful
        </CardTitle>
        <p className="text-muted-foreground">
          You have successfully subscribed to the{" "}
          {selectedSubscription.plan_code} plan. Please check your email for
          more details.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Subscription Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Invoice ID:</span>
              <span className="font-mono text-sm break-all">
                {data.invoice.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Date:</span>
              <span>
                {formatDate(selectedSubscription.start_date)} at{" "}
                {formatTime(selectedSubscription.start_date)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Seats:</span>
              <span>{selectedSubscription.seat_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Amount:</span>
              <span>
                {selectedSubscription.is_trial || data.invoice.amount_paid === 0
                  ? "Trial"
                  : `$${(data.invoice.amount_paid / 100).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <Button
          onClick={async () => {
            try {
              //
              // Update onboarding step to INTEGRATION
              const response = await fetch("/api/onboarding/update-step", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                  current_step: "INTEGRATION",
                }),
              });

              //

              if (response.ok) {
              } else {
                const errorData = await response.json();
              }

              // Redirect to integration page
              router.push("/settings/integrations");
            } catch (error) {
              // Still redirect even if step update fails
              router.push("/settings/integrations");
            }
          }}
          className="w-full"
          size="lg"
        >
          Next
        </Button>
      </CardContent>
    </Card>
  </div>
);

const FailedBox = ({ message, router }: { message: string; router: any }) => (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
    <Card className="max-w-lg w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-red-600">
          Subscription Error
        </CardTitle>
        <p className="text-muted-foreground">{message}</p>
      </CardHeader>

      <CardContent>
        <Button
          onClick={() => router.push("/onboarding/choose-plan")}
          className="w-full"
          size="lg"
        >
          Try Again
        </Button>
      </CardContent>
    </Card>
  </div>
);

const ProcessingBox = ({
  message = "Processing your payment...",
}: {
  message?: string;
}) => (
  <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
    <Card className="max-w-lg w-full shadow-lg">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <CardTitle className="text-2xl font-bold text-blue-600">
          Processing Payment
        </CardTitle>
        <p className="text-muted-foreground">{message}</p>
      </CardHeader>

      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>This may take a few moments...</span>
        </div>
      </CardContent>
    </Card>
  </div>
);

const Processing = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProcessingData | null>(null);
  const [initialDelay, setInitialDelay] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [content, setContent] = useState<ReactNode | null>(null);
  const router = useRouter();
  const { id: checkoutSessionId } = router.query;
  const [processingAttempts, setProcessingAttempts] = useState(0);
  // Track activation retries separately from processing retries
  const [activationRetries, setActivationRetries] = useState(0);
  const MAX_ACTIVATION_RETRIES = 3;

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialDelay(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(
    async (checkoutSessionId: string) => {
      try {
        const response = await apiCall({
          url: "/api/subscription/validateSubscription",
          method: "post",
          body: { checkoutSessionId },
          applyDefaultDomain: false,
        });

        const { data } = response;
        setData(data);

        if (data.is_processing) {
          if (processingAttempts < 3) {
            //
            setProcessingAttempts(prevAttempts => prevAttempts + 1);

            setTimeout(() => fetchData(checkoutSessionId), 5000);
            return;
          } else {
            setContent(
              <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
                <Card className="max-w-lg w-full shadow-lg">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-orange-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-orange-600">
                      Something went wrong
                    </CardTitle>
                    <p className="text-muted-foreground">
                      We couldn&apos;t process your request at this time. Please
                      try again later.
                    </p>
                  </CardHeader>

                  <CardContent>
                    <Button
                      onClick={() => router.push("/onboarding/choose-plan")}
                      className="w-full"
                      size="lg"
                    >
                      Go Back
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
            return;
          }
        } else {
          if (data.is_success) {
            const selectedSubscription = data.subscription.find(
              (s: SubscriptionItem) => s.is_selected
            );

            // Payment succeeded - check if subscription is active
            if (selectedSubscription && selectedSubscription.is_active) {
              // Subscription is active - handle trial conflict or show success
              if (
                selectedSubscription.is_trial &&
                selectedSubscription.trial_conflict
              ) {
                if (selectedSubscription.is_conflict_resolved) {
                  setContent(
                    <SuccessBox
                      data={data}
                      selectedSubscription={selectedSubscription}
                      router={router}
                    />
                  );
                } else {
                  router.push("/onboarding/warning");
                  return;
                }
              } else {
                setContent(
                  <SuccessBox
                    data={data}
                    selectedSubscription={selectedSubscription}
                    router={router}
                  />
                );
              }
            } else if (
              selectedSubscription &&
              !selectedSubscription.is_active
            ) {
              // Payment succeeded but subscription not active yet
              // This can happen due to race condition - retry a few times
              if (activationRetries < MAX_ACTIVATION_RETRIES) {
                console.log(
                  `[Processing] Payment success but subscription not active. Retry ${activationRetries + 1}/${MAX_ACTIVATION_RETRIES}`
                );
                setActivationRetries(prev => prev + 1);
                setTimeout(() => fetchData(checkoutSessionId), 2000);
                return;
              } else {
                // Max retries reached but payment was successful
                // Trust the backend is_success flag and show success
                // The subscription should be active by now after retries
                console.warn(
                  "[Processing] Max activation retries reached. Proceeding with success."
                );
                setContent(
                  <SuccessBox
                    data={data}
                    selectedSubscription={selectedSubscription}
                    router={router}
                  />
                );
              }
            } else {
              // No subscription found at all - this is an error
              router.push("/onboarding/warning");
              return;
            }
          } else if (data.is_payment_failed) {
            setContent(<FailedBox message={data.message} router={router} />);
          } else if (!data.is_payment_failed && !data.is_processing) {
            setContent(
              <FailedBox message="Something went wrong" router={router} />
            );
          } else {
            setContent(
              <FailedBox message="Something went wrong" router={router} />
            );
          }
        }
      } catch (error) {
        setContent(
          <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full shadow-lg">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-600">
                  Error
                </CardTitle>
                <p className="text-muted-foreground">
                  Error occurred while fetching data
                </p>
              </CardHeader>

              <CardContent>
                <Button
                  onClick={() => router.push("/onboarding/choose-plan")}
                  className="w-full"
                  size="lg"
                >
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      } finally {
        setLoading(false);
      }
    },
    [processingAttempts, activationRetries, router]
  );

  useEffect(() => {
    if (!initialDelay && typeof checkoutSessionId === "string") {
      fetchData(checkoutSessionId);
    }
  }, [checkoutSessionId, initialDelay, fetchData]);

  if (initialDelay) {
    return <ProcessingBox message="Preparing your payment..." />;
  }

  if (loading) {
    return <ProcessingBox message="Validating your subscription..." />;
  }

  return <div>{content}</div>;
};

Processing.getLayout = (page: ReactNode) => (
  <div className="min-h-screen bg-background">{page}</div>
);

export default Processing;
