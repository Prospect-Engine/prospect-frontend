import { ReactNode, ReactElement, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionGuardProps {
  children: ReactNode;
  fallback: ReactElement | null;
}

const PermissionGuard = ({ children, fallback }: PermissionGuardProps) => {
  const { user, isLoading } = useAuth();
  const { permissions } = usePermissions();
  const router = useRouter();
  const { pathname } = router;
  const [showFallback, setShowFallback] = useState<boolean>(true);

  // Check if user is in a workspace context
  const isImpersonated = !!user?.is_impersonate && !!user?.workspace_id;
  const notOwner = user?.role !== "OWNER";

  useEffect(() => {
    setShowFallback(true);

    if (!router.isReady) return;

    if (isImpersonated) {
      // Always blocked routes
      if (pathname.includes("/teams") || pathname.includes("/white-label")) {
        router.replace("/sales");
        return;
      }

      // Conditional blocks for OWNER
      if (!notOwner) {
        if (
          (pathname.includes("/integration") &&
            !permissions.includes("INTEGRATE_ACCOUNT")) ||
          (pathname.includes("/billing") &&
            !permissions.includes("VIEW_BILLING")) ||
          (pathname.includes("/tools/search") &&
            !permissions.includes("MANAGE_CAMPAIGNS"))
        ) {
          router.replace("/sales");
          return;
        }
      }

      // Conditional blocks for NON-OWNER
      if (notOwner) {
        if (
          (pathname.includes("inbox") &&
            !permissions.includes("VIEW_MESSAGES")) ||
          (pathname.includes("connection") &&
            !permissions.includes("VIEW_CONNECTIONS")) ||
          pathname.includes("billing") ||
          pathname.includes("/teams")
        ) {
          router.replace("/sales");
          return;
        }
      }
    }

    setShowFallback(false);
  }, [router.pathname, router.isReady, isImpersonated, permissions, notOwner]);

  if (isLoading || user === null || showFallback) {
    return fallback;
  }

  return <>{children}</>;
};

export default PermissionGuard;
