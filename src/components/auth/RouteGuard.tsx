"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthService } from "@/lib/auth";

interface RouteGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
  requireSubscription?: boolean;
  allowedRoles?: string[];
  redirectTo?: string;
}

export default function RouteGuard({
  children,
  fallback,
  requireAuth = true,
  requireSubscription = false,
  allowedRoles = [],
  redirectTo,
}: RouteGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check authentication if required
        if (requireAuth) {
          // Quick check - if we have valid cached data, use it
          const { accessToken, userData } = AuthService.getAuthData();

          if (!accessToken || !userData || AuthService.isTokenExpired()) {
            // Only do expensive validation if we don't have valid cached data
            const isValidAuth = await AuthService.validateAuthState();

            if (!isValidAuth) {
              const returnUrl = router.asPath;
              router.replace({
                pathname: "/auth",
                query: { returnUrl },
              });
              return;
            }
          }

          // Check user role if specified
          if (allowedRoles.length > 0) {
            const currentUserData = AuthService.getUserData();
            if (
              !currentUserData ||
              !allowedRoles.includes(currentUserData.role_id)
            ) {
              router.replace("/sales");
              return;
            }
          }

          // Check subscription if required
          if (requireSubscription) {
            try {
              const response = await fetch(
                "/api/subscription/getsubscriptions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  credentials: "include",
                }
              );

              if (!response.ok) {
                router.push("/onboarding/choose-plan");
                return;
              }

              const data = await response.json();
              const subscriptionData = data.find((s: any) => s.is_selected);

              if (
                !subscriptionData ||
                (!subscriptionData.is_active &&
                  !subscriptionData.has_previous_subscription &&
                  !subscriptionData.is_on_grace_period)
              ) {
                router.push("/onboarding/choose-plan");
                return;
              }
            } catch (error) {
              console.error("Error checking subscription:", error);
              router.push("/onboarding/choose-plan");
              return;
            }
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error("Error checking access:", error);
        router.replace("/auth");
      } finally {
        setIsChecking(false);
      }
    };

    checkAccess();
  }, [router, requireAuth, requireSubscription, allowedRoles]);

  // Show loading state while checking
  if (isChecking) {
    return (
      fallback || (
        <div className="flex justify-center items-center min-h-screen bg-background">
          <div className="space-y-4 text-center">
            <div className="mx-auto w-8 h-8 rounded-full border-4 animate-spin border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Checking access...</p>
          </div>
        </div>
      )
    );
  }

  // Show children if authorized
  if (isAuthorized) {
    return <>{children}</>;
  }

  // This shouldn't render as we redirect in useEffect, but just in case
  return null;
}
