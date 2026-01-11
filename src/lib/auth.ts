import { apiCall } from "./apiCall";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import { authService } from "./../services/sales-services/authService";
import { AuthSync } from "./authSync";

interface LoginResponse {
  user_id: string;
  username: string;
  name: string;
  login_type: string;
  role_id: string;
  joined_at: string;
  is_onboarded: string;
  onboarding_date: string;
  current_onboarding_step: any;
  access_token: string;
  refresh_token: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

export class AuthService {
  public static isLoggingOut = false;

  // Helper method to get cookie value by name
  private static getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;

    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift();
      return cookieValue || null;
    }
    return null;
  }

  static async login(
    credentials: LoginRequest,
    rememberMe: boolean = false
  ): Promise<LoginResponse | { error: string; success: false }> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...credentials, rememberMe }),
    });

    const responseData = await response.json().catch(() => ({}));

    // Check if response is successful (200 status)
    if (response.status !== 200) {
      // Return error with message from API
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        "Invalid credentials. Please try again.";
      return {
        error: errorMessage,
        success: false,
      };
    }

    // Check if response data indicates success
    if (!responseData?.success || !responseData?.data) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        "Invalid login response from server.";
      return {
        error: errorMessage,
        success: false,
      };
    }

    // Extract tenant_id from response data (same way as TeamSwitcher)
    if (responseData?.success && responseData?.data) {
      try {
        // Get tenant_id from the decoded token payload (available in API response)
        const tokenParts = responseData.data.access_token?.split(".");
        if (tokenParts && tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          const tenantId = payload.tenant_id;

          if (tenantId) {
            // Use tenant_id to authenticate with CRM
            // Call the tenant-login endpoint which auto-creates users if they don't exist
            const crmresponse = await authService.tenantLogin({
              tenantId: tenantId,
            });

            // Store CRM tokens and user data
            localStorage.setItem(
              "crm_access_token",
              crmresponse.data?.accessToken ?? ""
            );
            localStorage.setItem(
              "crm_refresh_token",
              crmresponse.data?.refreshToken ?? ""
            );
            localStorage.setItem(
              "crm_user",
              JSON.stringify(crmresponse.data?.user ?? {})
            );

            //
          } else {
          }
        }
      } catch (error) {
        // Don't block Red Magic login if CRM auth fails
      }
    }

    return responseData;
  }

  static storeAuthData(data: LoginResponse, rememberMe: boolean = false): void {
    // Tokens are now stored in HTTP-only cookies by the API
    // Only store user data in localStorage
    const userData = {
      user_id: data.user_id,
      username: data.username,
      name: data.name,
      login_type: data.login_type,
      role_id: data.role_id,
      joined_at: data.joined_at,
      is_onboarded: data.is_onboarded,
      onboarding_date: data.onboarding_date,
      current_onboarding_step: data.current_onboarding_step,
    };

    localStorage.setItem("user_data", JSON.stringify(userData));

    // Store remember me preference with timestamp
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("rememberMeTimestamp", Date.now().toString());
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberMeTimestamp");
    }

    // Notify other tabs about authentication state change
    AuthSync.notifyAuthChange(true, userData);
  }

  static getAuthData(): { accessToken: string | null; userData: any | null } {
    // Use helper method to get access token from cookies
    const accessToken = this.getCookie("access_token");

    const userDataStr = localStorage.getItem("user_data");
    const userData = userDataStr ? JSON.parse(userDataStr) : null;

    return { accessToken, userData };
  }

  // Check if user has remember me enabled and it's still valid
  static isRememberMeActive(): boolean {
    const rememberMe = localStorage.getItem("rememberMe");
    const timestamp = localStorage.getItem("rememberMeTimestamp");

    if (!rememberMe || rememberMe !== "true" || !timestamp) {
      return false;
    }

    // Check if remember me is still valid (30 days)
    const rememberMeAge = Date.now() - parseInt(timestamp);
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    if (rememberMeAge > thirtyDaysInMs) {
      // Remember me has expired, clean it up
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("rememberMeTimestamp");
      return false;
    }

    return true;
  }

  // Get remember me preference for forms
  static getRememberMePreference(): boolean {
    return localStorage.getItem("rememberMe") === "true";
  }

  static isAuthenticated(): boolean {
    const { accessToken, userData } = this.getAuthData();
    // User is authenticated if both token and user data exist
    return !!(accessToken && userData);
  }

  static clearAuthData(): void {
    // Remove all localStorage keys except theme and remember me (if user wants to be remembered)
    const keysToPreserve = ["theme"];

    // If remember me is active, preserve it for next login
    if (this.isRememberMeActive()) {
      keysToPreserve.push("rememberMe", "rememberMeTimestamp");
    }

    // Get all localStorage keys
    const allKeys = Object.keys(localStorage);

    // Remove all keys except the ones we want to preserve
    allKeys.forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key);
      }
    });

    // Clear all sessionStorage data
    sessionStorage.clear();

    // Clear all cookies by setting them to expire in the past
    if (typeof document !== "undefined") {
      // Get all cookies
      const cookies = document.cookie.split(";");

      // Clear each cookie
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name =
          eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();

        // Clear cookie for current domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;

        // Clear cookie for parent domain (if subdomain)
        const domain = window.location.hostname;
        const domainParts = domain.split(".");
        if (domainParts.length > 1) {
          const parentDomain = "." + domainParts.slice(-2).join(".");
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${parentDomain};`;
        }

        // Clear cookie for root domain
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain};`;
      });
    }

    // Clear any IndexedDB data (if used)
    if (typeof window !== "undefined" && window.indexedDB) {
      try {
        // This will clear common IndexedDB databases
        const dbNames = ["authDB", "userDB", "crmDB", "appDB"];
        dbNames.forEach(dbName => {
          const deleteReq = indexedDB.deleteDatabase(dbName);
          // deleteReq.onerror = () =>
        });
      } catch (error) {}
    }

    // Clear any WebSQL data (deprecated but still might exist)
    if (typeof window !== "undefined" && (window as any).openDatabase) {
      try {
        const db = (window as any).openDatabase("", "", "", "");
        if (db) {
          db.transaction((tx: any) => {
            tx.executeSql("DROP TABLE IF EXISTS auth_data");
            tx.executeSql("DROP TABLE IF EXISTS user_data");
          });
        }
      } catch (error) {}
    }

    // Notify other tabs about logout
    AuthSync.clearAuthState();
  }

  static getAccessToken(): string | null {
    // Use helper method to get access token from cookies
    return this.getCookie("access_token");
  }

  static getRefreshToken(): string | null {
    // Refresh token is now in HTTP-only cookies, not accessible from client
    return null;
  }

  static async refreshToken(): Promise<LoginResponse> {
    // Call the Next.js API route which handles cookie management
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const result = await response.json();
    return result.data;
  }

  static async logout(): Promise<void> {
    // Prevent multiple logout calls
    if (this.isLoggingOut) {
      return;
    }

    this.isLoggingOut = true;

    try {
      // Call the Next.js API route for logout
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Always clear local data regardless of API response
      this.clearAuthData();

      // Redirect to login page instead of showing message
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    } catch (error) {
      console.warn("Logout API call failed:", error);
      // Still clear local data and redirect
      this.clearAuthData();
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
    } finally {
      this.isLoggingOut = false;
    }
  }

  static getUserData(): any | null {
    const userDataStr = localStorage.getItem("user_data");
    return userDataStr ? JSON.parse(userDataStr) : null;
  }

  static isTokenExpired(): boolean {
    const accessToken = this.getAccessToken();
    if (!accessToken) return true;

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);

      // Check if token has expired
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  // Method to validate authentication state
  static async validateAuthState(): Promise<boolean> {
    const { accessToken, userData } = this.getAuthData();

    if (!accessToken || !userData) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired()) {
      // Try to refresh token
      try {
        await this.refreshToken();
        return true;
      } catch (error) {
        this.clearAuthData();
        return false;
      }
    }

    return true;
  }
}

export type { LoginResponse, LoginRequest };
