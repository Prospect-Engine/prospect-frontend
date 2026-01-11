"use client";

/**
 * CHAT BUTTON
 * ===========
 * Button in TopBar to toggle the team chat panel.
 */

import { MessageCircle } from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";

export function ChatButton() {
  const { toggleChat, isOpen, totalUnreadCount } = useChat();

  return (
    <button
      onClick={toggleChat}
      className={cn(
        "relative p-2 rounded-xl transition-all duration-200",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        "active:scale-95",
        isOpen && "bg-black/[0.04] dark:bg-white/[0.06]"
      )}
      title="Team Chat (⌘/)"
    >
      <MessageCircle
        className={cn(
          "h-5 w-5 transition-colors",
          isOpen ? "text-[#00BCD4]" : "text-muted-foreground"
        )}
      />
      {totalUnreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-semibold text-white bg-red-500 rounded-full">
          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
        </span>
      )}
    </button>
  );
}
