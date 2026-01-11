"use client";

/**
 * CHAT SIDEBAR
 * =============
 * List of channels and direct messages.
 */

import { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import {
  Hash,
  Lock,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Users,
} from "lucide-react";
import type { Channel } from "@/types/chat";

export function ChatSidebar() {
  const { channels, directMessages, selectChannel } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [dmsExpanded, setDmsExpanded] = useState(true);

  // Filter channels and DMs based on search
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredDMs = directMessages.filter((dm) =>
    dm.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-xl",
              "bg-black/[0.04] dark:bg-white/[0.06]",
              "border-none outline-none",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:ring-2 focus:ring-[#00BCD4]/30"
            )}
          />
        </div>
      </div>

      {/* Channels & DMs List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-4">
        {/* Channels Section */}
        <div>
          <button
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-1">
              {channelsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Channels</span>
            </div>
            <Plus className="h-3.5 w-3.5 hover:text-[#00BCD4]" />
          </button>

          {channelsExpanded && (
            <div className="mt-1 space-y-0.5">
              {filteredChannels.map((channel) => (
                <ChannelItem
                  key={channel.id}
                  channel={channel}
                  onClick={() => selectChannel(channel.id)}
                />
              ))}
              {filteredChannels.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No channels found
                </p>
              )}
            </div>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <button
            onClick={() => setDmsExpanded(!dmsExpanded)}
            className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <div className="flex items-center gap-1">
              {dmsExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Direct Messages</span>
            </div>
            <Plus className="h-3.5 w-3.5 hover:text-[#00BCD4]" />
          </button>

          {dmsExpanded && (
            <div className="mt-1 space-y-0.5">
              {filteredDMs.map((dm) => (
                <DirectMessageItem
                  key={dm.id}
                  channel={dm}
                  onClick={() => selectChannel(dm.id)}
                />
              ))}
              {filteredDMs.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No conversations found
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08]">
        <button
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-xl",
            "text-sm text-muted-foreground",
            "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
            "transition-colors"
          )}
        >
          <Users className="h-4 w-4" />
          <span>Browse all members</span>
        </button>
      </div>
    </div>
  );
}

function ChannelItem({
  channel,
  onClick,
}: {
  channel: Channel;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-xl",
        "text-sm text-foreground",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        "transition-colors group"
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {channel.type === "private" ? (
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="truncate">{channel.name}</span>
      </div>
      {channel.unreadCount > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold text-white bg-red-500 rounded-full min-w-[18px] text-center">
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}

function DirectMessageItem({
  channel,
  onClick,
}: {
  channel: Channel;
  onClick: () => void;
}) {
  const participant = channel.participants?.[0];
  const status = participant?.status || "offline";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 w-full px-3 py-2 rounded-xl",
        "text-sm text-foreground",
        "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
        "transition-colors group"
      )}
    >
      <div className="relative flex-shrink-0">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-medium">
          {channel.name.charAt(0).toUpperCase()}
        </div>
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1c1c1e]",
            status === "online" && "bg-green-500",
            status === "away" && "bg-yellow-500",
            status === "dnd" && "bg-red-500",
            status === "offline" && "bg-gray-400"
          )}
        />
      </div>
      <span className="truncate flex-1 text-left">{channel.name}</span>
      {channel.unreadCount > 0 && (
        <span className="px-1.5 py-0.5 text-[10px] font-semibold text-white bg-red-500 rounded-full min-w-[18px] text-center">
          {channel.unreadCount}
        </span>
      )}
    </button>
  );
}
