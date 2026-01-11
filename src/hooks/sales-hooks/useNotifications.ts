import { useState, useEffect } from "react";
import { Notification } from "../../types/sales-types";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const randomNotifications: Notification[] = [
        {
          id: Date.now().toString(),
          type: "info",
          title: "New Lead Assigned",
          message: "A new lead has been assigned to you",
          timestamp: new Date(),
          isRead: false,
        },
        {
          id: (Date.now() + 1).toString(),
          type: "success",
          title: "Deal Closed",
          message: "Congratulations! Deal with Acme Corp has been closed",
          timestamp: new Date(),
          isRead: false,
        },
        {
          id: (Date.now() + 2).toString(),
          type: "warning",
          title: "Task Due Soon",
          message: "Follow up with client is due in 2 hours",
          timestamp: new Date(),
          isRead: false,
        },
      ];

      const randomNotification =
        randomNotifications[
          Math.floor(Math.random() * randomNotifications.length)
        ];

      if (Math.random() > 0.7) {
        // 30% chance
        setNotifications(prev => [randomNotification, ...prev.slice(0, 9)]);
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, isRead: true } : notif))
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    markAsRead,
    clearAll,
    unreadCount: notifications.filter(n => !n.isRead).length,
  };
};
