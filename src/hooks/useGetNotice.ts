import { useState, useEffect } from "react";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import {
  markNotificationAsRead as markAsReadInSession,
  filterUnreadNotifications,
  isNotificationRead,
} from "@/lib/notificationSession";

export interface Notification {
  id: number;
  type: "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  time: string;
  unread: boolean;
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseGetNoticeReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  markAsRead: (notificationId: number) => void;
}

/**
 * Custom hook to fetch and manage notifications from the API
 *
 * Features:
 * - Fetches notifications from /api/integration/get-notice endpoint
 * - Returns empty array if API fails or returns no data
 * - Handles loading states and error conditions
 * - Supports marking notifications as read
 * - Auto-formats timestamps to relative time
 * - Refetch functionality for manual refresh
 *
 * @returns {UseGetNoticeReturn} Object containing notifications, loading state, error, and utility functions
 */
export const useGetNotice = (): UseGetNoticeReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const access_token = getCookie("access_token");
      const tokenString =
        access_token instanceof Promise ? await access_token : access_token;
      const params: ApiPropsType = {
        url: "/api/integration/get-notice",
        method: "get",
        applyDefaultDomain: false,
        headers: {
          Authorization: `Bearer ${tokenString}`,
        },
      };

      const { data, status } = await apiCall(params);

      if (status === 200 && data !== null && data !== undefined) {
        let transformedNotifications: Notification[] = [];

        if (Array.isArray(data)) {
          // Filter out null/undefined items and empty objects
          transformedNotifications = data
            .filter(
              (item: any) =>
                item !== null &&
                item !== undefined &&
                Object.keys(item).length > 0
            )
            .map((item: any, index: number) => ({
              id: item.id || index + 1,
              type:
                item.type &&
                ["success", "info", "warning", "error"].includes(item.type)
                  ? (item.type as "success" | "info" | "warning" | "error")
                  : "info",
              title: item.title || item.subject || "Notification",
              message: item.message || item.description || item.body || "",
              time: formatTime(
                item.time || item.created_at || item.timestamp || "Just now"
              ),
              unread: item.unread !== undefined ? Boolean(item.unread) : true,
              icon: item.icon || getDefaultIcon(item.type || "info"),
              created_at: item.created_at,
              updated_at: item.updated_at,
            }));
        } else if (data && typeof data === "object" && !Array.isArray(data)) {
          // Check if object has meaningful content (not empty object and has at least title or message)
          const hasContent =
            (data.title ||
              data.subject ||
              data.message ||
              data.description ||
              data.body) &&
            Object.keys(data).length > 0;

          if (hasContent) {
            const notificationType =
              data.type &&
              ["success", "info", "warning", "error"].includes(data.type)
                ? (data.type as "success" | "info" | "warning" | "error")
                : "info";

            transformedNotifications = [
              {
                id: data.id || 1,
                type: notificationType,
                title: data.title || data.subject || "Notification",
                message: data.message || data.description || data.body || "",
                time: formatTime(
                  data.time || data.created_at || data.timestamp || "Just now"
                ),
                unread: data.unread !== undefined ? Boolean(data.unread) : true,
                icon: data.icon || getDefaultIcon(notificationType),
                created_at: data.created_at,
                updated_at: data.updated_at,
              },
            ];
          }
        }

        // Filter out notifications that have been read in the current session
        const sessionFilteredNotifications = filterUnreadNotifications(
          transformedNotifications
        );
        setNotifications(sessionFilteredNotifications);
      } else if (status === 404) {
        setError(
          "Notifications endpoint not found. Please check if the backend server is running."
        );
        setNotifications([]);
      } else {
        setError(`API Error: ${status} - ${data?.message || "Unknown error"}`);
        setNotifications([]);
      }
    } catch (err) {
      let errorMessage = "Failed to load notifications";

      if (err instanceof Error) {
        if (
          err.message.includes("ENOENT") ||
          err.message.includes("no such file")
        ) {
          errorMessage =
            "Backend server not accessible. Please check if the backend server is running.";
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("CORS")
        ) {
          errorMessage =
            "Network error. Please check your connection and server status.";
        } else if (err.message.includes("404")) {
          errorMessage = "Notifications API endpoint not found.";
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      setError(errorMessage);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = (notificationId: number) => {
    // Mark as read in session storage
    markAsReadInSession(notificationId);

    // Update local state to reflect the change
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, unread: false }
          : notification
      )
    );
  };

  const refetch = async () => {
    await fetchNotifications();
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Calculate unread count based on notifications that are both unread from API and not read in session
  const unreadCount = notifications.filter(
    n => n.unread && !isNotificationRead(n.id)
  ).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    refetch,
    markAsRead,
  };
};

// Helper function to get default icons based on notification type
const getDefaultIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    success: "🎯",
    info: "👥",
    warning: "⚠️",
    error: "❌",
  };
  return iconMap[type] || "📢";
};

// Helper function to format time strings
const formatTime = (timeString: string): string => {
  if (!timeString) return "Just now";

  // If it's already a relative time string, return as is
  if (timeString.includes("ago") || timeString.includes("now")) {
    return timeString;
  }

  // If it's a timestamp, convert to relative time
  const date = new Date(timeString);
  if (isNaN(date.getTime())) {
    return timeString; // Return original if not a valid date
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  return `${Math.floor(diffInSeconds / 86400)} days ago`;
};
