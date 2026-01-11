/**
 * TEAM CHAT TYPES
 * ================
 * TypeScript interfaces for the team chat feature.
 */

export type PresenceStatus = "online" | "away" | "offline" | "dnd";

export type ChannelType = "public" | "private" | "direct";

export type MessageType = "text" | "file" | "image" | "system";

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: PresenceStatus;
  lastSeen?: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  members: string[]; // user IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  lastMessage?: Message;
  // For DMs
  participants?: ChatUser[];
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  sender?: ChatUser;
  content: string;
  type: MessageType;
  attachments?: Attachment[];
  reactions?: Reaction[];
  threadId?: string; // Parent message ID if this is a reply
  replyCount?: number;
  mentions?: string[]; // user IDs
  isEdited?: boolean;
  isPinned?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
  count: number;
}

export interface Thread {
  parentMessage: Message;
  replies: Message[];
  participantIds: string[];
}

export interface TypingIndicator {
  channelId: string;
  userId: string;
  userName: string;
}

// Socket events
export interface ChatSocketEvents {
  // Emit
  "chat:join": { channelId: string };
  "chat:leave": { channelId: string };
  "chat:message": { channelId: string; content: string; type: MessageType };
  "chat:typing": { channelId: string };
  "chat:stop-typing": { channelId: string };
  "chat:read": { channelId: string; messageId: string };
  "chat:reaction": { messageId: string; emoji: string };

  // Receive
  "chat:new-message": Message;
  "chat:message-updated": Message;
  "chat:message-deleted": { messageId: string; channelId: string };
  "chat:user-typing": TypingIndicator;
  "chat:user-stop-typing": TypingIndicator;
  "chat:presence-update": { userId: string; status: PresenceStatus };
  "chat:channel-updated": Channel;
}

// API responses
export interface GetChannelsResponse {
  channels: Channel[];
  directMessages: Channel[];
}

export interface GetMessagesResponse {
  messages: Message[];
  hasMore: boolean;
  cursor?: string;
}

export interface SearchMessagesResponse {
  results: Message[];
  total: number;
}

// Chat panel state
export interface ChatPanelState {
  isOpen: boolean;
  activeChannelId: string | null;
  activeThreadId: string | null;
  view: "channels" | "conversation" | "thread" | "search";
}
