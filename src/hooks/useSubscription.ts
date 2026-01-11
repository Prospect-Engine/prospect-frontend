import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

interface Subscription {
  type: string;
  is_active: boolean;
  is_canceled: boolean;
  is_disabled: boolean;
  has_previous_subscription: boolean;
  is_trial: boolean;
  is_on_grace_period: boolean;
  is_conflict_resolved: boolean;
  trial_used: boolean;
  trial_conflict: boolean;
  grace_period: number;
  is_eligible_for_grace: boolean;
  seat_count: number;
  start_date: string | null;
  end_date: string;
  plan_code: string;
  payment_status: string;
  plan_duration_type: string;
  // New canonical field names
  owner_organization_id?: string;
  user_organization_id?: string;
  // Legacy field names (for backward compatibility)
  owner_tenant_id?: string;
  user_tenant_id?: string;
  is_selected: boolean;
  next_cycle: {
    seat_count: number | null;
    package_price: number;
    estimated_cost: number;
  };
  current_cycle: {
    seat_count: number;
    package_price: number;
    current_cost: number;
  };
  // New canonical field name
  workspace?: any;
  // Legacy field name (for backward compatibility)
  team?: any;
}

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/getSubscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();

        // Normalize the subscription data to support both old and new field names
        const normalizedSubscription = data.subscription
          ? {
              ...data.subscription,
              // Prefer new canonical names, fallback to legacy
              owner_organization_id:
                data.subscription.owner_organization_id ||
                data.subscription.owner_tenant_id,
              user_organization_id:
                data.subscription.user_organization_id ||
                data.subscription.user_tenant_id,
              workspace: data.subscription.workspace || data.subscription.team,
              // Keep legacy fields for backward compatibility
              owner_tenant_id:
                data.subscription.owner_tenant_id ||
                data.subscription.owner_organization_id,
              user_tenant_id:
                data.subscription.user_tenant_id ||
                data.subscription.user_organization_id,
              team: data.subscription.team || data.subscription.workspace,
            }
          : null;

        setSubscription(normalizedSubscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("[useSubscription] Fetch error:", err);
      setError("Failed to fetch subscription data");
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSubscription = async () => {
    await fetchSubscription();
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      setSubscription(null);
    }
  }, [isAuthenticated]);

  return {
    subscription,
    isLoading,
    error,
    refreshSubscription,
  };
};
