"use client";

/**
 * CHAT CONTEXT
 * =============
 * Global state management for team chat feature.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type {
  Channel,
  Message,
  ChatUser,
  ChatPanelState,
  PresenceStatus,
  TypingIndicator,
} from "@/types/chat";

// Mock data for development
const mockUsers: ChatUser[] = [
  { id: "1", name: "John Doe", email: "john@example.com", status: "online" },
  { id: "2", name: "Jane Smith", email: "jane@example.com", status: "away" },
  { id: "3", name: "Bob Wilson", email: "bob@example.com", status: "offline" },
  { id: "4", name: "Alice Brown", email: "alice@example.com", status: "online" },
];

const mockChannels: Channel[] = [
  {
    id: "ch-1",
    name: "general",
    type: "public",
    description: "General discussions",
    members: ["1", "2", "3", "4"],
    createdBy: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 3,
  },
  {
    id: "ch-2",
    name: "sales-team",
    type: "public",
    description: "Sales team channel",
    members: ["1", "2"],
    createdBy: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 0,
  },
  {
    id: "ch-3",
    name: "marketing",
    type: "public",
    description: "Marketing discussions",
    members: ["1", "3", "4"],
    createdBy: "3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 1,
  },
];

const mockDirectMessages: Channel[] = [
  {
    id: "dm-1",
    name: "Jane Smith",
    type: "direct",
    members: ["1", "2"],
    createdBy: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 2,
    participants: [mockUsers[1]],
  },
  {
    id: "dm-2",
    name: "Bob Wilson",
    type: "direct",
    members: ["1", "3"],
    createdBy: "1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    unreadCount: 0,
    participants: [mockUsers[2]],
  },
];

const mockMessages: Record<string, Message[]> = {
  "ch-1": [
    {
      id: "msg-1",
      channelId: "ch-1",
      senderId: "2",
      sender: mockUsers[1],
      content: "Hey everyone! How's the project going?",
      type: "text",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      reactions: [{ emoji: "👍", userIds: ["1", "3"], count: 2 }],
    },
    {
      id: "msg-2",
      channelId: "ch-1",
      senderId: "1",
      sender: mockUsers[0],
      content: "Going great! Just finished the new feature.",
      type: "text",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: "msg-3",
      channelId: "ch-1",
      senderId: "3",
      sender: mockUsers[2],
      content: "Awesome work team! 🎉",
      type: "text",
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
  ],
  "dm-1": [
    {
      id: "msg-4",
      channelId: "dm-1",
      senderId: "2",
      sender: mockUsers[1],
      content: "Hi! Can we discuss the sales report?",
      type: "text",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "msg-5",
      channelId: "dm-1",
      senderId: "1",
      sender: mockUsers[0],
      content: "Sure! What do you need?",
      type: "text",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
};

interface ChatContextType {
  // State
  isOpen: boolean;
  panelState: ChatPanelState;
  channels: Channel[];
  directMessages: Channel[];
  messages: Message[];
  currentUser: ChatUser | null;
  activeChannel: Channel | null;
  typingUsers: TypingIndicator[];
  totalUnreadCount: number;

  // Actions
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  selectChannel: (channelId: string) => void;
  sendMessage: (content: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  markAsRead: (channelId: string) => void;
  searchMessages: (query: string) => Message[];
  createChannel: (name: string, type: "public" | "private") => void;
  startDirectMessage: (userId: string) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelState, setPanelState] = useState<ChatPanelState>({
    isOpen: false,
    activeChannelId: null,
    activeThreadId: null,
    view: "channels",
  });
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [directMessages, setDirectMessages] = useState<Channel[]>(mockDirectMessages);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(mockMessages);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);

  // Mock current user (in real app, get from AuthContext)
  const currentUser: ChatUser = mockUsers[0];

  // Get active channel
  const activeChannel =
    [...channels, ...directMessages].find((c) => c.id === panelState.activeChannelId) || null;

  // Get messages for active channel
  const messages = panelState.activeChannelId ? messagesMap[panelState.activeChannelId] || [] : [];

  // Calculate total unread count
  const totalUnreadCount = [...channels, ...directMessages].reduce(
    (acc, channel) => acc + channel.unreadCount,
    0
  );

  // Actions
  const openChat = useCallback(() => {
    setIsOpen(true);
    setPanelState((prev) => ({ ...prev, isOpen: true }));
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setPanelState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
    setPanelState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const selectChannel = useCallback((channelId: string) => {
    setPanelState((prev) => ({
      ...prev,
      activeChannelId: channelId,
      view: "conversation",
    }));
    // Mark as read
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
    setDirectMessages((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!panelState.activeChannelId || !content.trim()) return;

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        channelId: panelState.activeChannelId,
        senderId: currentUser.id,
        sender: currentUser,
        content: content.trim(),
        type: "text",
        createdAt: new Date().toISOString(),
      };

      setMessagesMap((prev) => ({
        ...prev,
        [panelState.activeChannelId!]: [...(prev[panelState.activeChannelId!] || []), newMessage],
      }));
    },
    [panelState.activeChannelId, currentUser]
  );

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessagesMap((prev) => {
      const updated = { ...prev };
      for (const channelId in updated) {
        updated[channelId] = updated[channelId].map((msg) => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find((r) => r.emoji === emoji);
            if (existingReaction) {
              // Toggle reaction
              if (existingReaction.userIds.includes(currentUser.id)) {
                existingReaction.userIds = existingReaction.userIds.filter(
                  (id) => id !== currentUser.id
                );
                existingReaction.count--;
              } else {
                existingReaction.userIds.push(currentUser.id);
                existingReaction.count++;
              }
              return { ...msg, reactions: reactions.filter((r) => r.count > 0) };
            } else {
              return {
                ...msg,
                reactions: [...reactions, { emoji, userIds: [currentUser.id], count: 1 }],
              };
            }
          }
          return msg;
        });
      }
      return updated;
    });
  }, [currentUser.id]);

  const markAsRead = useCallback((channelId: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
    setDirectMessages((prev) =>
      prev.map((c) => (c.id === channelId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const searchMessages = useCallback(
    (query: string): Message[] => {
      if (!query.trim()) return [];
      const results: Message[] = [];
      for (const channelId in messagesMap) {
        const channelMessages = messagesMap[channelId].filter((msg) =>
          msg.content.toLowerCase().includes(query.toLowerCase())
        );
        results.push(...channelMessages);
      }
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    [messagesMap]
  );

  const createChannel = useCallback((name: string, type: "public" | "private") => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: name.toLowerCase().replace(/\s+/g, "-"),
      type,
      members: [currentUser.id],
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    };
    setChannels((prev) => [...prev, newChannel]);
    selectChannel(newChannel.id);
  }, [currentUser.id, selectChannel]);

  const startDirectMessage = useCallback(
    (userId: string) => {
      // Check if DM already exists
      const existingDm = directMessages.find(
        (dm) => dm.members.includes(userId) && dm.members.includes(currentUser.id)
      );
      if (existingDm) {
        selectChannel(existingDm.id);
        return;
      }

      // Create new DM
      const targetUser = mockUsers.find((u) => u.id === userId);
      if (!targetUser) return;

      const newDm: Channel = {
        id: `dm-${Date.now()}`,
        name: targetUser.name,
        type: "direct",
        members: [currentUser.id, userId],
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        participants: [targetUser],
      };
      setDirectMessages((prev) => [...prev, newDm]);
      selectChannel(newDm.id);
    },
    [directMessages, currentUser.id, selectChannel]
  );

  // Keyboard shortcut to toggle chat (Cmd/Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        toggleChat();
      }
      // Close on Escape
      if (e.key === "Escape" && isOpen) {
        closeChat();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleChat, closeChat, isOpen]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        panelState,
        channels,
        directMessages,
        messages,
        currentUser,
        activeChannel,
        typingUsers,
        totalUnreadCount,
        openChat,
        closeChat,
        toggleChat,
        selectChannel,
        sendMessage,
        addReaction,
        markAsRead,
        searchMessages,
        createChannel,
        startDirectMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
