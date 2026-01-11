"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/sales-hooks/useAuth";
import { usePathname, useRouter } from "next/navigation";

interface AppContentProps {
  children: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure we only run client-side logic after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug logging (only on client)
  useEffect(() => {
    if (isClient) {
    }
  }, [isClient, isLoading, isAuthenticated, pathname, user]);

  // Handle redirects after hydration
  useEffect(() => {
    if (!isClient || isLoading) return;

    const publicRoutes = ["/auth", "/accept-invitation"];
    const isPublicRoute = publicRoutes.some(route =>
      pathname.startsWith(route)
    );

    // Redirect logic
    if (!isAuthenticated && !isPublicRoute && pathname !== "/") {
      router.push("/auth");
      return;
    }

    if (isAuthenticated && pathname === "/auth") {
      router.push("/sales/leads");
      return;
    }

    if (isAuthenticated && pathname === "/") {
      router.push("/sales/leads");
      return;
    }
  }, [isClient, isLoading, isAuthenticated, pathname, router]);

  // Show loading state during initial auth check or before hydration
  if (!isClient || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <div>{children}</div>;
};

export default AppContent;
