/**
 * Subscription Response Adapter
 *
 * Normalizes inconsistent backend subscription responses into a unified PlanType structure.
 * Handles 4 different response formats from /paywall/subscription/me endpoint.
 */

export interface PlanType {
  end_date?: string;
  on_trial?: boolean;
  plan_id?: string;
  plan_code?: string;
  name?: string;
  payment_status?: string;
  start_date?: string;
  interval?: string;
  quantity?: number;
  type?: string;
  is_active?: boolean;
  is_canceled?: boolean;
  is_disabled?: boolean;
  has_previous_subscription?: boolean;
  is_trial?: boolean;
  is_on_grace_period?: boolean;
  is_conflict_resolved?: boolean;
  is_team_subscription?: boolean;
  trial_used?: boolean;
  trial_conflict?: boolean;
  grace_period?: any;
  is_eligible_for_grace?: boolean;
  seat_count?: number;
  plan_duration_type?: string;
  owner_tenant_id?: string;
  user_tenant_id?: string;
  is_selected?: boolean;
  team?: any;
  card_used_before?: boolean;
}

export interface NormalizedSubscription {
  subscription: PlanType | null;
  hasActiveSubscription: boolean;
  isOnTrial: boolean;
  isOnGracePeriod: boolean;
  needsSubscription: boolean;
}

/**
 * Normalizes various backend subscription response formats
 *
 * Supported formats:
 * 1. { subscriptions: [...] }
 * 2. [...]
 * 3. { subscription: {...} }
 * 4. {...} (direct subscription object)
 */
export function normalizeSubscriptionResponse(
  response: any
): NormalizedSubscription {
  try {
    let subscription: PlanType | null = null;

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response first if it's in this format
    const unwrappedResponse =
      response?.success === true && response?.data !== undefined
        ? response.data
        : response;

    // Format 1: { subscriptions: [...] }
    if (
      unwrappedResponse?.subscriptions &&
      Array.isArray(unwrappedResponse.subscriptions)
    ) {
      subscription =
        unwrappedResponse.subscriptions.find(
          (sub: any) => sub?.is_selected === true
        ) ||
        unwrappedResponse.subscriptions[0] ||
        null;
    }
    // Format 2: [...]
    else if (Array.isArray(unwrappedResponse)) {
      subscription =
        unwrappedResponse.find((sub: any) => sub?.is_selected === true) ||
        unwrappedResponse[0] ||
        null;
    }
    // Format 3: { subscription: {...} }
    else if (
      unwrappedResponse?.subscription &&
      typeof unwrappedResponse.subscription === "object"
    ) {
      subscription = unwrappedResponse.subscription;
    }
    // Format 4: {...} (direct subscription object)
    else if (unwrappedResponse && typeof unwrappedResponse === "object") {
      // Check if it looks like a subscription object (has subscription-specific fields)
      if (hasSubscriptionFields(unwrappedResponse)) {
        subscription = unwrappedResponse;
      }
    }

    // Calculate derived states
    const hasActiveSubscription = !!(
      subscription?.is_active === true &&
      subscription?.is_disabled !== true &&
      subscription?.is_canceled !== true
    );

    const isOnTrial = !!(
      subscription?.is_trial === true || subscription?.on_trial === true
    );

    const isOnGracePeriod = !!(subscription?.is_on_grace_period === true);

    const needsSubscription =
      !hasActiveSubscription && !isOnTrial && !isOnGracePeriod;

    return {
      subscription,
      hasActiveSubscription,
      isOnTrial,
      isOnGracePeriod,
      needsSubscription,
    };
  } catch (error) {
    console.error("Error normalizing subscription response:", error);

    // Safe fallback
    return {
      subscription: null,
      hasActiveSubscription: false,
      isOnTrial: false,
      isOnGracePeriod: false,
      needsSubscription: true,
    };
  }
}

/**
 * Checks if an object has subscription-specific fields
 */
function hasSubscriptionFields(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;

  const subscriptionFields = [
    "plan_code",
    "plan_id",
    "is_active",
    "is_trial",
    "payment_status",
    "start_date",
    "end_date",
    "seat_count",
    "is_disabled",
  ];

  // Object is considered a subscription if it has at least 2 subscription fields
  const matchCount = subscriptionFields.filter(field => field in obj).length;
  return matchCount >= 2;
}

/**
 * Extracts subscription array from response (for components that need arrays)
 */
export function extractSubscriptionArray(response: any): PlanType[] {
  try {
    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response first if it's in this format
    const unwrappedResponse =
      response?.success === true && response?.data !== undefined
        ? response.data
        : response;

    // Format 1: { subscriptions: [...] }
    if (
      unwrappedResponse?.subscriptions &&
      Array.isArray(unwrappedResponse.subscriptions)
    ) {
      return unwrappedResponse.subscriptions;
    }
    // Format 2: [...]
    else if (Array.isArray(unwrappedResponse)) {
      return unwrappedResponse;
    }
    // Format 3: { subscription: {...} }
    else if (
      unwrappedResponse?.subscription &&
      typeof unwrappedResponse.subscription === "object"
    ) {
      return [unwrappedResponse.subscription];
    }
    // Format 4: {...} (direct subscription object)
    else if (
      unwrappedResponse &&
      typeof unwrappedResponse === "object" &&
      hasSubscriptionFields(unwrappedResponse)
    ) {
      return [unwrappedResponse];
    }

    return [];
  } catch (error) {
    console.error("Error extracting subscription array:", error);
    return [];
  }
}

/**
 * Validates adapter with all known response formats
 * Run this in development to ensure adapter works correctly
 */
export function validateAdapter(): boolean {
  const mockSubscription = {
    plan_code: "STARTER",
    is_active: true,
    is_trial: false,
    seat_count: 1,
  };

  const testCases = [
    {
      name: "Format 1: { subscriptions: [...] }",
      input: { subscriptions: [mockSubscription] },
      expected: { subscription: mockSubscription, hasActiveSubscription: true },
    },
    {
      name: "Format 2: [...]",
      input: [mockSubscription],
      expected: { subscription: mockSubscription, hasActiveSubscription: true },
    },
    {
      name: "Format 3: { subscription: {...} }",
      input: { subscription: mockSubscription },
      expected: { subscription: mockSubscription, hasActiveSubscription: true },
    },
    {
      name: "Format 4: {...}",
      input: mockSubscription,
      expected: { subscription: mockSubscription, hasActiveSubscription: true },
    },
    {
      name: "Empty response",
      input: null,
      expected: {
        subscription: null,
        hasActiveSubscription: false,
        needsSubscription: true,
      },
    },
  ];

  let allPassed = true;

  testCases.forEach(test => {
    const result = normalizeSubscriptionResponse(test.input);
    const passed =
      result.hasActiveSubscription === test.expected.hasActiveSubscription;

    if (!passed) {
      console.error(`❌ Failed: ${test.name}`);
      allPassed = false;
    }
  });

  if (allPassed) {
    console.log("✅ All subscription adapter tests passed");
  }

  return allPassed;
}
