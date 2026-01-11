"use client";

/**
 * CHAT LAYOUT WRAPPER
 * ====================
 * Wraps the app content and chat panel in a side-by-side layout.
 * When chat is open, main content shrinks and chat panel appears on the right.
 */

import { useChat } from "@/context/ChatContext";
import { TeamChatPanel } from "./TeamChatPanel";
import { cn } from "@/lib/utils";

interface ChatLayoutWrapperProps {
  children: React.ReactNode;
}

export function ChatLayoutWrapper({ children }: ChatLayoutWrapperProps) {
  const { isOpen } = useChat();

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Main App Content - takes full width when chat closed, shrinks when open */}
      <div
        className={cn(
          "h-full overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "flex-1 min-w-0" : "w-full"
        )}
      >
        {children}
      </div>

      {/* Chat Panel - rendered on the right when open */}
      <TeamChatPanel />
    </div>
  );
}
