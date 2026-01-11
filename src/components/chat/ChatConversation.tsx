"use client";

/**
 * CHAT CONVERSATION
 * ==================
 * Message thread view with input.
 */

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import {
  Send,
  Smile,
  Paperclip,
  MoreHorizontal,
  Reply,
  Copy,
  Trash2,
} from "lucide-react";
import type { Message } from "@/types/chat";

export function ChatConversation() {
  const { messages, sendMessage, addReaction, currentUser } = useChat();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Date Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
              <span className="text-xs font-medium text-muted-foreground px-2">
                {date}
              </span>
              <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {msgs.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUser?.id}
                  onReaction={(emoji) => addReaction(message.id, emoji)}
                />
              ))}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-[#00BCD4]/10 flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-[#00BCD4]" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Start the conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Send a message to start chatting with your team.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl",
            "bg-black/[0.04] dark:bg-white/[0.06]",
            "focus-within:ring-2 focus-within:ring-[#00BCD4]/30"
          )}
        >
          <button className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              "flex-1 bg-transparent border-none outline-none",
              "text-sm text-foreground placeholder:text-muted-foreground"
            )}
          />
          <button className="p-1 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
            <Smile className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={cn(
              "p-1.5 rounded-lg transition-all",
              inputValue.trim()
                ? "bg-[#00BCD4] text-white hover:bg-[#0097A7]"
                : "bg-black/[0.04] dark:bg-white/[0.06] text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
  onReaction,
}: {
  message: Message;
  isOwn: boolean;
  onReaction: (emoji: string) => void;
}) {
  const [showActions, setShowActions] = useState(false);

  const quickEmojis = ["👍", "❤️", "😂", "🎉", "🔥"];

  return (
    <div
      className={cn("group flex gap-3", isOwn && "flex-row-reverse")}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
          {message.sender?.name?.charAt(0).toUpperCase() || "?"}
        </div>
      )}

      <div className={cn("flex flex-col max-w-[75%]", isOwn && "items-end")}>
        {/* Sender name & time */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-foreground">
              {message.sender?.name || "Unknown"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className="relative">
          <div
            className={cn(
              "px-3 py-2 rounded-2xl text-sm",
              isOwn
                ? "bg-[#00BCD4] text-white rounded-tr-md"
                : "bg-black/[0.04] dark:bg-white/[0.06] text-foreground rounded-tl-md"
            )}
          >
            {message.content}
          </div>

          {/* Quick actions */}
          {showActions && (
            <div
              className={cn(
                "absolute top-0 flex items-center gap-1 p-1 rounded-lg",
                "bg-white dark:bg-[#2c2c2e] shadow-lg border border-black/[0.06] dark:border-white/[0.08]",
                isOwn ? "right-full mr-2" : "left-full ml-2"
              )}
            >
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => onReaction(emoji)}
                  className="p-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded transition-colors text-sm"
                >
                  {emoji}
                </button>
              ))}
              <button className="p-1 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded transition-colors">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1">
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => onReaction(reaction.emoji)}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs",
                  "bg-black/[0.04] dark:bg-white/[0.06]",
                  "hover:bg-black/[0.08] dark:hover:bg-white/[0.12]",
                  "transition-colors"
                )}
              >
                <span>{reaction.emoji}</span>
                <span className="text-muted-foreground">{reaction.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time for own messages */}
        {isOwn && (
          <span className="text-[10px] text-muted-foreground mt-1">
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  }
}

function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const dateKey = formatDate(message.createdAt);
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return groups;
}
