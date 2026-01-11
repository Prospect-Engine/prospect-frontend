import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory cache for authentication checks
const authCache = new Map<string, { isValid: boolean; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached auth result
function getCachedAuth(token: string): boolean | null {
  const cached = authCache.get(token);
  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    authCache.delete(token);
    return null;
  }

  return cached.isValid;
}

// Helper function to cache auth result
function setCachedAuth(token: string, isValid: boolean): void {
  authCache.set(token, {
    isValid,
    timestamp: Date.now(),
  });
}

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  "/auth",
  "/register",
  "/verify-otp",
  "/reset-password",
  "/payment/processing", // Allow Stripe redirect without authentication
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/resend-otp",
  "/api/auth/reset-password",
  "/api/maintenance/status",
  "/api",
  "/_next",
  "/favicon.ico",
  "/assets",
  "/images",
  "/public",
];

// Paths that require authentication but are part of onboarding flow
const ONBOARDING_PATHS = ["/onboarding"];

// Helper function to check if path is public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

// Helper function to check if path is onboarding
function isOnboardingPath(pathname: string): boolean {
  return ONBOARDING_PATHS.some(path => pathname.startsWith(path));
}

// Helper function to get access token from cookies
function getAccessToken(request: NextRequest): string | null {
  return request.cookies.get("access_token")?.value || null;
}

// Helper function to validate JWT token (optimized)
function isTokenValid(token: string): boolean {
  try {
    // Quick check - just decode and check expiration without full validation
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // Remove buffer to match AuthService validation
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to essential paths (API, static files, etc.)
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Special handling for API routes - allow them through without authentication checks
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Get access token from cookies
  const accessToken = getAccessToken(request);

  // Require authentication for all non-public, non-API routes
  if (!accessToken) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token exists - check cache first, then validate if needed
  const cachedResult = getCachedAuth(accessToken);
  let isTokenValidResult: boolean;

  if (cachedResult !== null) {
    // Use cached result
    isTokenValidResult = cachedResult;
  } else {
    // Validate token and cache result
    isTokenValidResult = isTokenValid(accessToken);
    setCachedAuth(accessToken, isTokenValidResult);
  }

  if (!isTokenValidResult) {
    const loginUrl = new URL("/auth", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token is valid - check maintenance status only for authenticated users
  // and only if not already checked recently
  const maintenanceCheck = request.headers.get("x-maintenance-check");
  if (!maintenanceCheck || maintenanceCheck !== "skip") {
    try {
      // Check maintenance status from our API (with timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

      const host = request.headers.get("host") || request.nextUrl.host;
      const protocol = request.nextUrl.protocol || "https:";
      const origin = `${protocol}//${host}`;

      const response = await fetch(`${origin}/api/maintenance/status`, {
        next: { revalidate: 0 },
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Cookie: request.headers.get("cookie") || "",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const status = await response.json();
        // If maintenance mode is active and not done, let the MaintenanceMode component handle it
        if (status?.is_maintenance_mode === true && status?.is_done === false) {
          return NextResponse.next();
        }
      }
    } catch (error) {
      // If maintenance check fails or times out, allow normal flow
      console.warn("Maintenance check failed or timed out:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (static assets)
     * - images (image files)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|assets|images|public).*)",
  ],
};
