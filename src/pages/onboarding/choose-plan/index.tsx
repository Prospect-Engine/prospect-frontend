import React, { ReactNode, useEffect, useState } from "react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useRouter } from "next/router";
import { apiCall } from "@/lib/apiCall";
import config from "@/configs/payment";
import isSuccessful from "@/lib/status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Shield, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toastService from "@/services/sales-services/toastService";
import NavbarWithoutMenu from "@/components/common/blanknavigation";

// Types

interface PricingPlan {
  id: string;
  title: string | null;
  product: string;
  product_id: string;
  price: number;
  currency: string;
  save_percentage: number;
  per_month: number;
  highlighted: boolean;
  is_enabled: boolean;
  description: {
    limits: Record<string, string>;
    features: string[];
  };
  has_trial: boolean;
  trial_in_days: number;
  duration_type: string;
}

// Pricing Card Component
const PricingCard = ({
  plan,
  onStartTrial,
  isLoading,
}: {
  plan: PricingPlan;
  onStartTrial: (plan: PricingPlan) => void;
  isLoading: boolean;
}) => {
  const isYearly = plan.duration_type === "yearly";
  const isQuarterly = plan.duration_type === "quarterly";
  const savings = plan.save_percentage;

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 hover:shadow-lg max-w-md mx-[30px]",
        plan.highlighted && "border-primary/20"
      )}
    >
      {/* Badges/Ribbons */}
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex flex-col gap-1 items-center">
        {plan.highlighted && (
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        )}
        {savings > 0 && (
          <Badge className="bg-primary text-white px-3 py-1">
            Save {savings}%
          </Badge>
        )}
      </div>

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">{plan.product}</CardTitle>
        <div className="mt-4">
          <div className="text-4xl font-bold">
            ${plan.price}
            <span className="text-lg font-normal text-muted-foreground">
              /
              {plan.duration_type === "yearly"
                ? "year"
                : plan.duration_type === "quarterly"
                  ? "quarter"
                  : "month"}
            </span>
          </div>
          {plan.has_trial && (
            <div className="text-sm text-blue-600 font-medium mt-1">
              {plan.trial_in_days}-day free trial
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features */}
        <div className="space-y-2">
          {plan.description.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Limits
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Included Limits</h4>
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            {Object.entries(plan.description.limits).slice(0, 4).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span>{key.replace(" Limit", "")}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div> */}

        <Button
          className="w-full mt-6"
          onClick={() => onStartTrial(plan)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Starting Trial...
            </div>
          ) : (
            `Start ${plan.trial_in_days}-Day Free Trial`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

// Main Payment Component
function Payment() {
  const router = useRouter();
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("monthly");
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Fetch pricing plans
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data, status } = await apiCall({
          url: config.pricing,
          method: "get",
          applyDefaultDomain: false,
        });

        if (!isSuccessful(status)) {
          toastService.error("Failed to fetch pricing plans");
          return;
        }

        setPricingPlans(data);
        if (data.length > 0) {
          // Set initial tab to the highlighted plan's duration type, or monthly
          const highlightedPlan = data.find(
            (plan: PricingPlan) => plan.highlighted
          );
          if (highlightedPlan) {
            setActiveTab(highlightedPlan.duration_type);
          }
        }
      } catch (err) {
        setError("Failed to load pricing plans. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricing();
  }, []);

  // Check if user already has a valid subscription and redirect to dashboard
  useEffect(() => {
    const checkExistingSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/getsubscriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();

          if (data?.hasActiveSubscription) {
            router.push("/sales");
            return;
          }
        }
      } catch (error) {
        console.error("[Choose Plan] Subscription check error:", error);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkExistingSubscription();
  }, [router]);

  // Start trial when user clicks start trial button
  const handleStartTrial = async (plan: PricingPlan) => {
    // Add this plan to loading state
    setLoadingPlans(prev => new Set(prev).add(plan.id));
    setError(null);

    try {
      const { data, status } = await apiCall({
        url: config.checkoutSession,
        method: "post",
        body: {
          id: plan.id,
        },
        applyDefaultDomain: false,
      });

      if (!isSuccessful(status)) {
        // Check if it's a specific error about inactive product
        if (data && data.message && data.message.includes("not active")) {
          toastService.error(
            "This plan is currently unavailable. Please try a different plan or contact support."
          );
          setLoadingPlans(prev => {
            const newSet = new Set(prev);
            newSet.delete(plan.id);
            return newSet;
          });
          return;
        }

        // Check for authentication errors
        if (
          data &&
          data.message &&
          (data.message.includes("login again") ||
            data.message.includes("SE-AU-03"))
        ) {
          toastService.error("Please log in to start your trial.");
          setLoadingPlans(prev => {
            const newSet = new Set(prev);
            newSet.delete(plan.id);
            return newSet;
          });
          return;
        }

        // Check for unexpected response format errors
        if (
          data &&
          data.error &&
          data.error.includes("Unexpected response format")
        ) {
          toastService.error(
            "Unable to process request. Please try again or contact support."
          );
          setLoadingPlans(prev => {
            const newSet = new Set(prev);
            newSet.delete(plan.id);
            return newSet;
          });
          return;
        }

        // Check status codes
        if (status === 403 || status === 401) {
          toastService.error("Please log in to start your trial.");
          setLoadingPlans(prev => {
            const newSet = new Set(prev);
            newSet.delete(plan.id);
            return newSet;
          });
          return;
        }

        toastService.error(
          "Failed to create checkout session. Please try again."
        );
        setLoadingPlans(prev => {
          const newSet = new Set(prev);
          newSet.delete(plan.id);
          return newSet;
        });
        return;
      }

      // Redirect to the checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        toastService.error("No checkout URL received. Please try again.");
        setLoadingPlans(prev => {
          const newSet = new Set(prev);
          newSet.delete(plan.id);
          return newSet;
        });
        return;
      }
    } catch (err) {
      // Show appropriate error notification
      if (err instanceof Error) {
        if (
          err.message.includes("not active") ||
          err.message.includes("unavailable")
        ) {
          toastService.error(
            "This plan is currently unavailable. Please try a different plan or contact support."
          );
        } else if (
          err.message.includes("network") ||
          err.message.includes("fetch")
        ) {
          toastService.error(
            "Network error. Please check your connection and try again."
          );
        } else if (
          err.message.includes("unauthorized") ||
          err.message.includes("401")
        ) {
          toastService.error("Please log in to start your trial.");
        } else if (
          err.message.includes("forbidden") ||
          err.message.includes("403")
        ) {
          toastService.error(
            "You don't have permission to start this trial. Please contact support."
          );
        } else {
          toastService.error("Failed to start trial. Please try again.");
        }
      } else {
        toastService.error("Failed to start trial. Please try again.");
      }

      setLoadingPlans(prev => {
        const newSet = new Set(prev);
        newSet.delete(plan.id);
        return newSet;
      });
    }
  };

  // Organize plans by duration type
  const plansByDuration = pricingPlans.reduce(
    (acc, plan) => {
      if (!acc[plan.duration_type]) {
        acc[plan.duration_type] = [];
      }
      acc[plan.duration_type].push(plan);
      return acc;
    },
    {} as Record<string, PricingPlan[]>
  );

  // Get available duration types
  const durationTypes = Object.keys(plansByDuration).sort((a, b) => {
    const order = { yearly: 0, monthly: 1, quarterly: 2 };
    return (
      (order[a as keyof typeof order] || 3) -
      (order[b as keyof typeof order] || 3)
    );
  });

  // Check if we should show tabs (only if there are more than 2 plans per duration type)
  const shouldShowTabs = durationTypes.length > 1 && pricingPlans.length > 2;

  // Get current plans to display
  const currentPlans = shouldShowTabs
    ? plansByDuration[activeTab] || []
    : pricingPlans;

  // Show loading state while checking subscription or loading pricing
  if (checkingSubscription || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">
            {checkingSubscription
              ? "Checking subscription..."
              : "Loading plans..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        {/* Header with user/workspace switching */}
        <div className="container mx-auto px-4 py-4">
          <NavbarWithoutMenu />
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            {/* <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1> */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Select the perfect plan for your needs. All plans include a free
              trial period.
            </p>
          </div>

          {/* Pricing Cards */}
          {shouldShowTabs ? (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex justify-center mb-8">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  {durationTypes.map(duration => (
                    <TabsTrigger
                      key={duration}
                      value={duration}
                      className="capitalize"
                    >
                      {duration}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {durationTypes.map(duration => (
                <TabsContent key={duration} value={duration} className="mt-0">
                  <div className="flex justify-center mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
                      {plansByDuration[duration].map(plan => (
                        <PricingCard
                          key={plan.id}
                          plan={plan}
                          onStartTrial={handleStartTrial}
                          isLoading={loadingPlans.has(plan.id)}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="flex justify-center mb-12">
              <div
                className={`grid gap-6 w-full ${
                  pricingPlans.length === 1
                    ? "grid-cols-1 max-w-md"
                    : pricingPlans.length === 2
                      ? "grid-cols-1 md:grid-cols-2 max-w-4xl"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl"
                }`}
              >
                {pricingPlans.map(plan => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    onStartTrial={handleStartTrial}
                    isLoading={loadingPlans.has(plan.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trust Indicators */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

// Layout configuration
Payment.getLayout = (page: ReactNode) => (
  <div className="min-h-screen bg-background">{page}</div>
);

export default Payment;
