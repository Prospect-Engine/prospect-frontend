import isSuccessful from "./status";
// import showError from "@/base-component/showError";
import { AuthService } from "@/lib/auth";
// import ShowConfirmationMessage from "@/base-component/ShowConfirmationMessage";
import ShowCustomerSupportMessage from "@/base-component/showCustomerSupportMessage";
import ShowShortMessage from "@/base-component/ShowShortMessage";
// import { useRouter } from "next/router";
export type ApiPropsType = {
  url: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  body?: object;
  applyDefaultDomain?: boolean;
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  skipAuthRetry?: boolean; // Skip auto-refresh retry (used internally)
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token
 * Returns true if refresh was successful, false otherwise
 */
async function attemptTokenRefresh(): Promise<boolean> {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });

      if (response.ok) {
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiCall<TData extends Record<string, any> = any>({
  url,
  method = "get",
  body = {},
  applyDefaultDomain = true,
  headers = {},
  credentials = "same-origin",
  skipAuthRetry = false,
}: ApiPropsType): Promise<{
  data: TData;
  status: number;
}> {
  let status = 500,
    data;
  try {
    const fetchParams = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: method === "get" ? undefined : JSON.stringify(body),
      credentials,
    };
    const fullUrl = `${applyDefaultDomain ? process.env.NEXT_PUBLIC_BACKEND_URL : ""}${url}`;

    const response = await fetch(fullUrl, fetchParams);

    status = response.status;

    const responseText = await response.text();

    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      data = { error: "Invalid JSON response", rawResponse: responseText };
    }

    // Only runs in the client side
    if (!isSuccessful(status) && typeof window !== "undefined") {
      // Handle 401 - try to refresh token before logging out
      if (status === 401 && !skipAuthRetry) {
        const refreshSuccess = await attemptTokenRefresh();

        if (refreshSuccess) {
          // Retry the original request with the new token
          return apiCall({
            url,
            method,
            body,
            applyDefaultDomain,
            headers,
            credentials,
            skipAuthRetry: true, // Prevent infinite retry loop
          });
        } else {
          // Refresh failed - logout
          AuthService.logout();
        }
      } else if (status === 403) {
        // 403 is permission denied, not token expired - logout immediately
        AuthService.logout();
      }

      if (status === 438) {
        ShowCustomerSupportMessage(
          "Your trial period has expired, please pay bill to continue your actions. "
        );
      } else if (status === 498) {
        ShowCustomerSupportMessage(
          "Your extension period has expired, please pay bill to continue your actions. "
        );
      } else if (status !== 401 && status !== 403) {
        // Check if we have field errors and show the first one
        if (
          data?.field_errors &&
          Array.isArray(data.field_errors) &&
          data.field_errors.length > 0
        ) {
          ShowShortMessage(data.field_errors[0].message, "error");
        } else {
          ShowShortMessage(
            data?.message ??
              "Sorry, something went wrong. Please try again later",
            "error"
          );
        }
      }
    }
  } catch (error) {
    if (
      error instanceof TypeError &&
      error.message.includes("Failed to fetch")
    ) {
      ShowShortMessage(
        `CORS error or network issue. Please check if the API server is running and CORS is configured.`,
        "error"
      );
    } else {
      ShowShortMessage(
        `Sorry, something went wrong. Please try again later.`,
        "error"
      );
    }
  } finally {
    return { data, status };
  }
}
