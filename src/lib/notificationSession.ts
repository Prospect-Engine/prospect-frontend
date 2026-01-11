/**
 * Session-based notification management utility
 * Tracks which notifications have been read in the current browser session
 */

const SESSION_STORAGE_KEY = "read_notifications_session";

export interface ReadNotification {
  id: number;
  readAt: number; // timestamp when marked as read
}

/**
 * Get all read notification IDs from session storage
 */
export const getReadNotifications = (): ReadNotification[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    return [];
  }
};

/**
 * Mark a notification as read in session storage
 */
export const markNotificationAsRead = (notificationId: number): void => {
  if (typeof window === "undefined") return;

  try {
    const readNotifications = getReadNotifications();
    const existingIndex = readNotifications.findIndex(
      n => n.id === notificationId
    );

    if (existingIndex === -1) {
      // Add new read notification
      readNotifications.push({
        id: notificationId,
        readAt: Date.now(),
      });
    } else {
      // Update existing entry
      readNotifications[existingIndex].readAt = Date.now();
    }

    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(readNotifications)
    );
  } catch (error) {}
};

/**
 * Check if a notification has been read in the current session
 */
export const isNotificationRead = (notificationId: number): boolean => {
  const readNotifications = getReadNotifications();
  return readNotifications.some(n => n.id === notificationId);
};

/**
 * Clear all read notifications from session storage
 */
export const clearReadNotifications = (): void => {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {}
};

/**
 * Get count of read notifications in current session
 */
export const getReadNotificationsCount = (): number => {
  return getReadNotifications().length;
};

/**
 * Filter notifications to exclude those read in current session
 */
export const filterUnreadNotifications = <T extends { id: number }>(
  notifications: T[]
): T[] => {
  return notifications.filter(
    notification => !isNotificationRead(notification.id)
  );
};
