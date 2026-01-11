"use client";

/**
 * TEAM CHAT PANEL
 * ================
 * Side panel for team chat - pushes main content to the left.
 */

import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { X, ArrowLeft, Hash, MessageCircle, PanelRightClose } from "lucide-react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatConversation } from "./ChatConversation";

export function TeamChatPanel() {
  const { isOpen, closeChat, panelState, activeChannel, selectChannel } = useChat();

  const handleBack = () => {
    selectChannel("");
  };

  // Don't render anything if closed (the space is handled by the layout wrapper)
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "h-full w-[380px] flex-shrink-0",
        "bg-white dark:bg-[#1c1c1e]",
        "border-l border-black/[0.06] dark:border-white/[0.08]",
        "flex flex-col",
        "animate-in slide-in-from-right duration-300"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-3">
          {panelState.view === "conversation" && activeChannel ? (
            <>
              <button
                onClick={handleBack}
                className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {activeChannel.type === "direct" ? (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {activeChannel.name.charAt(0).toUpperCase()}
                    </div>
                    {activeChannel.participants?.[0]?.status === "online" && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1c1c1e] rounded-full" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#00BCD4]/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-[#00BCD4]" />
                  </div>
                )}
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {activeChannel.type === "direct" ? activeChannel.name : `#${activeChannel.name}`}
                  </h2>
                  {activeChannel.type !== "direct" && activeChannel.members && (
                    <p className="text-xs text-muted-foreground">
                      {activeChannel.members.length} members
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#00BCD4] to-[#0097A7] flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Team Chat</h2>
                <p className="text-xs text-muted-foreground">Chat with your team</p>
              </div>
            </>
          )}
        </div>
        <button
          onClick={closeChat}
          className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          title="Close chat"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {panelState.view === "conversation" && activeChannel ? (
          <ChatConversation />
        ) : (
          <ChatSidebar />
        )}
      </div>
    </div>
  );
}
