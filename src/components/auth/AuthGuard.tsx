"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { AuthService } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  checkSubscription?: boolean;
}

export default function AuthGuard({
  children,
  fallback,
  checkSubscription = false,
}: AuthGuardProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubscriptionValid, setIsSubscriptionValid] = useState<
    boolean | null
  >(null);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/subscription/getsubscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/onboarding/choose-plan");
        return;
      }

      const data = await response.json();

      // ✅ New API format: { subscription: {...}, needsSubscription: boolean }
      if (!data?.subscription || data.needsSubscription) {
        router.push("/onboarding/choose-plan");
        return;
      }

      // Optional deeper validation for safety (supports both old/new API formats)
      const sub = data.subscription;
      const isPersonalActive = sub?.is_active === true;
      const isTeamActive = sub?.team?.is_active === true;
      const onGrace = sub?.is_on_grace_period === true;
      const hadPrevious = sub?.has_previous_subscription === true;

      if (isPersonalActive || isTeamActive || onGrace || hadPrevious) {
        setIsSubscriptionValid(true);
        return;
      }

      router.push("/onboarding/choose-plan");
    } catch (error) {
      console.error("[AuthGuard] Subscription check error:", error);
      router.push("/onboarding/choose-plan");
    }
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const existingUserData = localStorage.getItem("user_data");
      const { accessToken } = AuthService.getAuthData();

      // Quick local validation
      if (existingUserData && accessToken && !AuthService.isTokenExpired()) {
        setIsAuthenticated(true);
        if (checkSubscription) await checkSubscriptionStatus();
        return;
      }

      // Deep validation
      try {
        const isValidAuth = await AuthService.validateAuthState();

        if (!isValidAuth) {
          // Try to recover using valid cookie-based token
          if (accessToken && !AuthService.isTokenExpired()) {
            try {
              const response = await fetch("/api/profile/getProfile", {
                method: "GET",
                credentials: "include",
              });

              if (response.ok) {
                const userData = await response.json();
                localStorage.setItem("user_data", JSON.stringify(userData));
                setIsAuthenticated(true);
                if (checkSubscription) await checkSubscriptionStatus();
                return;
              }
            } catch (error) {
              console.error("[AuthGuard] Error fetching user profile:", error);
            }
          }

          AuthService.clearAuthData();
          router.replace("/auth");
          return;
        }

        setIsAuthenticated(true);
        if (checkSubscription) await checkSubscriptionStatus();
      } catch (error) {
        console.error("[AuthGuard] Error validating auth state:", error);
        AuthService.clearAuthData();
        router.replace("/auth");
      }
    };

    checkAuth();
  }, [router, checkSubscription, checkSubscriptionStatus]);

  // Loading state
  if (
    isAuthenticated === null ||
    (checkSubscription && isSubscriptionValid === null)
  ) {
    return (
      fallback || (
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="space-y-4 text-center">
            <div className="mx-auto w-8 h-8 rounded-full border-4 animate-spin border-primary border-t-transparent" />
            <p className="text-muted-foreground">
              {isAuthenticated === null
                ? "Checking authentication..."
                : "Checking subscription..."}
            </p>
          </div>
        </div>
      )
    );
  }

  // Render protected content
  if (isAuthenticated && (!checkSubscription || isSubscriptionValid)) {
    return <>{children}</>;
  }

  // Safety fallback
  return null;
}

// 🔹 Helper: set authentication flags
export const setAuthenticated = (value: boolean, remember = false) => {
  if (value) {
    if (remember) {
      localStorage.setItem("rememberMe", "true");
    } else {
      sessionStorage.setItem("isAuthenticated", "true");
    }
  }
};

// 🔹 Helper: clear authentication
export const clearAuthentication = async () => {
  await AuthService.logout();
};
