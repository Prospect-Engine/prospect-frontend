import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AuthService } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Wait a bit to ensure cookies are loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if user is authenticated
        const isValidAuth = await AuthService.validateAuthState();

        if (isValidAuth) {
          // User is authenticated, redirect to dashboard
          router.replace("/sales");
        } else {
          // User is not authenticated, redirect to auth
          router.replace("/auth");
        }
      } catch (error) {
        // On error, redirect to auth to be safe
        router.replace("/auth");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // This should not render as we redirect in useEffect
  return null;
}
