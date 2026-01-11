import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { AuthSync } from "@/lib/authSync";
import { AuthService } from "@/lib/auth";

/**
 * Hook to handle cross-tab authentication synchronization
 */
export function useAuthSync() {
  const router = useRouter();

  const handleAuthStateChange = useCallback(async () => {
    // Get the current authentication state
    const isCurrentlyAuth = AuthService.isAuthenticated();
    const syncState = AuthSync.getAuthState();

    // If sync state indicates user is not authenticated but we think they are
    if (syncState && !syncState.isAuthenticated && isCurrentlyAuth) {
      // User logged out in another tab, clear local state and redirect
      AuthService.clearAuthData();
      router.replace("/auth");
    }

    // If sync state indicates user is authenticated but we think they're not
    if (
      syncState &&
      syncState.isAuthenticated &&
      !isCurrentlyAuth &&
      syncState.userData
    ) {
      // User logged in from another tab, update local state
      localStorage.setItem("user_data", JSON.stringify(syncState.userData));

      // Refresh the page to update the UI
      window.location.reload();
    }
  }, [router]);

  useEffect(() => {
    // Add listener for auth state changes
    const removeListener = AuthSync.addListener(handleAuthStateChange);

    // Cleanup listener on unmount
    return () => {
      removeListener();
    };
  }, [handleAuthStateChange]);

  return {
    // Expose method to manually trigger auth state sync
    syncAuthState: handleAuthStateChange,
  };
}
