"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Mail,
  Search,
  Filter,
  User,
  Clock,
  MessageCircle,
  Star,
  Archive,
  Trash2,
  Send,
  Smile,
  Building,
  Tag,
  List,
  ChevronDown,
  RefreshCw,
  Zap,
  Inbox,
  MessageSquare,
  Paperclip,
  Folder,
  LayoutDashboard,
  Info,
  FileText,
  TrendingUp,
  CheckCircle2,
  Plus,
  Activity,
  Loader2,
  CheckSquare,
  BarChart3,
  StickyNote,
  Download,
  Image as ImageIcon,
  Video,
  Music,
  File,
  FileSpreadsheet,
  FileArchive,
  X,
  AlertCircle,
  Calendar,
  CheckSquare2,
  Linkedin,
  Megaphone,
  Mic,
} from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import EmptyInboxState from "@/components/inbox/EmptyInboxState";
import { VoiceRecorder } from "@/components/inbox/VoiceRecorder";
import { VoicePlayer } from "@/components/inbox/VoicePlayer";
import { useSendVoiceMessage } from "@/hooks/useSendVoiceMessage";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import tagService from "@/services/sales-services/tagService";
import { contactService } from "@/services/sales-services/contactService";
import { notesService, type Note } from "@/services/sales-services/notesService";
import taskService, {
  CreateTaskRequest,
} from "@/services/sales-services/taskService";
import { useWorkspace } from "@/hooks/sales-hooks/useWorkspace";

const InboxPage = () => {
  const { user } = useAuth();
  const { subscribeToMessages, unsubscribeFromMessages } = useSocket();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const router = useRouter();

  // Debug user object
  //
  //
  //
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("Informations");
  const [sidebarOpen, setSidebarOpen] = useState(true); // Always open
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("all_teams");
  const [selectedMember, setSelectedMember] = useState("all_members");
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingLead, setIsCreatingLead] = useState(false);
  const [leadCreated, setLeadCreated] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskCreated, setTaskCreated] = useState(false);
  const [contactExists, setContactExists] = useState(false);
  const [isCheckingContact, setIsCheckingContact] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);

  // Task form state
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    isAutomated: false,
  });
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [taskList, setTaskList] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // API data state
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<string, any[]>>({});
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [notes, setNotes] = useState<Record<string, any[]>>({});
  const [notesList, setNotesList] = useState<Note[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [notesSearchTerm, setNotesSearchTerm] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [noteForm, setNoteForm] = useState<{
    id?: string;
    title: string;
    content: string;
  }>({ title: "", content: "" });
  const [activities, setActivities] = useState<Record<string, any[]>>({});
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [hasConnectedIntegration, setHasConnectedIntegration] = useState<
    boolean | null
  >(null); // null = loading, false = no integration, true = has integration
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [leadInformation, setLeadInformation] = useState<any>(null);
  const [isLoadingLeadInfo, setIsLoadingLeadInfo] = useState(false);
  const [leadActivity, setLeadActivity] = useState<any>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  // Infinite scroll state
  const [hasMoreConversations, setHasMoreConversations] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastConversationId, setLastConversationId] = useState<string | null>(
    null
  );
  const [conversationLimit] = useState(20);

  // LinkedIn specific state
  const [linkedInProfile, setLinkedInProfile] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);

  // Voice message sending hook
  const { sendVoiceMessage, isSending: isSendingVoice } = useSendVoiceMessage();

  // Get current conversations from state (now using API data)
  const currentConversations = conversations;

  // Get messages for the selected conversation from state
  const currentMessages = selectedConversation
    ? messages[selectedConversation] || []
    : [];

  // SAFETY CHECK: Ensure we only show messages for the currently selected conversation
  if (selectedConversation && Object.keys(messages).length > 1) {
    setMessages({
      [selectedConversation]: currentMessages,
    });
  }

  // ADDITIONAL SAFETY: Filter messages to ensure they belong to the current conversation
  const validatedCurrentMessages = currentMessages.filter((msg: any) => {
    // If message has conversationId property, verify it matches
    if (msg.conversationId) {
      const matches = msg.conversationId === selectedConversation;
      if (!matches) {
      }
      return matches;
    }
    // If no conversationId property, assume it's valid (for backward compatibility)
    return true;
  });

  if (validatedCurrentMessages.length !== currentMessages.length) {
    // Update the messages state with cleaned messages
    if (selectedConversation) {
      setMessages({
        [selectedConversation]: validatedCurrentMessages,
      });
    }
  }

  // FINAL VALIDATION: Make sure we only show messages from the right people
  let validatedMessages = validatedCurrentMessages;
  if (selectedConversation && validatedCurrentMessages.length > 0) {
    const selectedConv = conversations.find(
      conv => conv.id === selectedConversation
    );
    const selectedParticipant =
      selectedConv?.profile || selectedConv?.participants?.[0];
    const currentUserProfile = linkedInProfile?.profile;

    if (selectedParticipant && currentUserProfile) {
      const participantName =
        `${selectedParticipant.first_name || ""} ${selectedParticipant.last_name || ""}`.trim();
      const currentUserName =
        `${currentUserProfile.first_name || ""} ${currentUserProfile.last_name || ""}`.trim();

      // Get all senders in current messages
      const currentSenders = [
        ...new Set(validatedCurrentMessages.map((m: any) => m.sender)),
      ];

      // Check if we have any unexpected senders
      const expectedSenders = [currentUserName, participantName];
      const unexpectedSenders = currentSenders.filter(
        sender =>
          !expectedSenders.some(
            expected => expected.toLowerCase() === sender.toLowerCase()
          )
      );

      if (unexpectedSenders.length > 0) {
        // Remove messages from unexpected senders
        validatedMessages = validatedCurrentMessages.filter((msg: any) => {
          const senderName = msg.sender?.trim();
          const isExpected = expectedSenders.some(
            expected => expected.toLowerCase() === senderName.toLowerCase()
          );
          if (!isExpected) {
          }
          return isExpected;
        });
      } else {
      }
    }
  }

  // Sort to show oldest messages first (newest at bottom)
  const displayedMessages = [...validatedMessages].sort((a: any, b: any) => {
    const aTime = new Date(a?.timestamp ?? 0).getTime();
    const bTime = new Date(b?.timestamp ?? 0).getTime();
    // Oldest first, newest last (new messages at the bottom)
    return aTime - bTime;
  });

  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const messageVirtualizer = useVirtualizer({
    count: displayedMessages.length,
    getScrollElement: () => messagesContainerRef.current,
    estimateSize: () => 100,
    overscan: 5,
    getItemKey: index => displayedMessages[index]?.id || index,
  });

  const filteredConversations = (() => {
    switch (selectedFilter) {
      case "unread":
        return currentConversations.filter(c => c.unread);
      case "starred":
        return currentConversations.filter(c => c.isStarred);
      case "replies":
        return currentConversations.filter(
          c =>
            c.lastMessage.includes("Thanks") ||
            c.lastMessage.includes("interested") ||
            c.lastMessage.includes("love to learn") ||
            c.lastMessage.includes("sounds interesting") ||
            c.lastMessage.includes("demo") ||
            c.lastMessage.includes("pricing") ||
            c.lastMessage.includes("no") ||
            c.lastMessage.includes("not interested") ||
            c.lastMessage.includes("busy") ||
            c.lastMessage.includes("later") ||
            c.lastMessage.includes("Hello") ||
            c.lastMessage.includes("Hi") ||
            c.lastMessage.includes("Yes") ||
            c.lastMessage.includes("Sure") ||
            c.lastMessage.includes("Maybe") ||
            c.lastMessage.includes("When") ||
            c.lastMessage.includes("How") ||
            c.lastMessage.includes("What") ||
            c.lastMessage.includes("Can") ||
            c.lastMessage.includes("Would")
        );
      case "recent":
        return currentConversations.filter(
          conversation =>
            conversation.time.includes("m") || conversation.time.includes("h")
        );
      case "archived":
        return currentConversations.filter(() => false); // No archived conversations yet
      default:
        return currentConversations;
    }
  })();

  const conversationListRef = useRef<HTMLDivElement>(null);

  const conversationVirtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => conversationListRef.current,
    estimateSize: () => 88,
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    const el = messagesContainerRef.current;
    if (el) {
      // Force scroll to bottom immediately
      el.scrollTop = el.scrollHeight;
    }
  }, []);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Cooldown countdown timer for sync button
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const intervalId = setInterval(() => {
      setCooldownRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, [cooldownRemaining]);

  // Listen for real-time messages
  useEffect(() => {
    const handleMessage = (data: any) => {
      console.log("InboxPage received message:", data);

      const receivedMsg = data.message || data;
      // Extract conversation ID - handle various formats
      const conversationId =
        receivedMsg.conversation_urn_id ||
        receivedMsg.conversation_id ||
        receivedMsg.conversationId ||
        receivedMsg.conversation?.urn_id;

      if (!conversationId) return;

      // 1. Update Messages State (if conversation is loaded in state)
      setMessages(prev => {
        const currentMsgs = prev[conversationId];
        // If we haven't loaded this conversation's messages yet, don't auto-create the array
        // (unless it's the selected one, but that should be loaded)
        if (!currentMsgs && selectedConversation !== conversationId) {
          return prev;
        }

        const msgs = currentMsgs || [];

        // Check if message already exists (deduplication)
        // Check by ID or temporary ID
        if (
          msgs.some(
            (m: any) => m.id === receivedMsg.id || m.id === receivedMsg.tempId
          )
        ) {
          return prev;
        }

        // Format message for display
        const newMsgFormatted = {
          id: receivedMsg.id || Date.now().toString(),
          sender:
            receivedMsg.sender?.name || receivedMsg.sender_name || "Unknown",
          message:
            receivedMsg.text ||
            receivedMsg.message_text ||
            receivedMsg.content ||
            "",
          time: new Date(
            receivedMsg.created_at || Date.now()
          ).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          timestamp: receivedMsg.created_at || Date.now(),
          isFromCurrentUser:
            receivedMsg.sender_id === user?.user_id ||
            receivedMsg.is_from_me ||
            false,
          avatar: (
            receivedMsg.sender?.name?.[0] ||
            receivedMsg.sender_name?.[0] ||
            "U"
          ).toUpperCase(),
          profilePicUrl:
            receivedMsg.sender?.profile_pic_url ||
            receivedMsg.sender_profile_pic ||
            "",
          attachments: receivedMsg.attachments,
          reactions: receivedMsg.reactions,
          status: "sent",
        };

        return {
          ...prev,
          [conversationId]: [...msgs, newMsgFormatted],
        };
      });

      // 2. Update Conversations List (Last Message, Unread Count, Sort Order)
      setConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              lastMessage:
                receivedMsg.text ||
                receivedMsg.message_text ||
                receivedMsg.content ||
                conv.lastMessage,
              time: "Just now",
              unread: selectedConversation === conversationId ? false : true, // Only mark unread if not currently viewing
              conversationData: {
                ...conv.conversationData,
                last_activity_at: new Date(
                  receivedMsg.created_at || Date.now()
                ).getTime(),
              },
            };
          }
          return conv;
        });

        // Re-sort: newest activity first
        return updated.sort((a, b) => {
          const timeA = new Date(
            a.conversationData?.last_activity_at || 0
          ).getTime();
          const timeB = new Date(
            b.conversationData?.last_activity_at || 0
          ).getTime();
          return timeB - timeA;
        });
      });

      // If this is the selected conversation, scroll to bottom
      if (selectedConversation === conversationId) {
        setTimeout(() => scrollToBottom(), 100);
      }
    };

    subscribeToMessages(handleMessage);
    return () => unsubscribeFromMessages(handleMessage);
  }, [
    subscribeToMessages,
    unsubscribeFromMessages,
    user?.user_id,
    selectedConversation,
    scrollToBottom,
  ]);

  // File upload constraints
  const MAX_FILES = 5;
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB

  // Custom CSS for hiding scrollbars
  const scrollbarHideStyles = `
    .scrollbar-hide {
      -ms-overflow-style: none;  /* Internet Explorer 10+ */
      scrollbar-width: none;  /* Firefox */
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;  /* Safari and Chrome */
    }
  `;

  // Helper function to get file icon based on file type
  const getFileIcon = (fileType: string, fileName: string) => {
    const lowerFileName = fileName.toLowerCase();

    // Images
    if (fileType.startsWith("image/")) {
      return <ImageIcon className="flex-shrink-0 w-4 h-4" />;
    }

    // Videos
    if (fileType.startsWith("video/")) {
      return <Video className="flex-shrink-0 w-4 h-4" />;
    }

    // Audio
    if (fileType.startsWith("audio/")) {
      return <Music className="flex-shrink-0 w-4 h-4" />;
    }

    // Spreadsheets
    if (
      fileType.includes("spreadsheet") ||
      fileType.includes("excel") ||
      lowerFileName.endsWith(".xlsx") ||
      lowerFileName.endsWith(".xls") ||
      lowerFileName.endsWith(".csv")
    ) {
      return <FileSpreadsheet className="flex-shrink-0 w-4 h-4" />;
    }

    // Archives
    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z") ||
      fileType.includes("tar") ||
      fileType.includes("gzip") ||
      lowerFileName.match(/\\.(zip|rar|7z|tar|gz)$/)
    ) {
      return <FileArchive className="flex-shrink-0 w-4 h-4" />;
    }

    // Documents (PDF, Word, etc.)
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("msword") ||
      fileType.includes("text") ||
      lowerFileName.match(/\\.(pdf|doc|docx|txt)$/)
    ) {
      return <FileText className="flex-shrink-0 w-4 h-4" />;
    }

    // Default
    return <File className="flex-shrink-0 w-4 h-4" />;
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Helper function to get user ID from access token
  const getUserIdFromToken = () => {
    try {
      // Get access token from cookies
      const cookies = document.cookie.split(";");
      //
      const accessTokenCookie = cookies.find(cookie =>
        cookie.trim().startsWith("access_token=")
      );

      if (!accessTokenCookie) {
        //
        return null;
      }

      const accessToken = accessTokenCookie.split("=")[1];

      // Decode JWT token (without verification for client-side)
      const payload = JSON.parse(atob(accessToken.split(".")[1]));

      //
      return payload.user_id || payload.sub || payload.id;
    } catch (error) {
      return null;
    }
  };

  // API Functions
  const fetchConversations = useCallback(
    async (loadMore: boolean = false) => {
      try {
        // Get user ID from access token
        const userId = getUserIdFromToken();

        if (!userId) {
          toast.error("User ID could not be extracted from access token");
          return;
        }

        // Determine team_id and member_id based on selection
        let teamId = null;
        let memberId = null;

        if (selectedTeam !== "all_teams") {
          // Team is selected - find the team ID
          const selectedTeamMember = teamMembers.find(
            member => member.team === selectedTeam
          );
          if (selectedTeamMember && selectedTeamMember.team_id) {
            teamId = selectedTeamMember.team_id;
          } else if (selectedTeamMember) {
            teamId = selectedTeam;
          }

          if (selectedMember !== "all_members") {
            // Both team and member are selected
            const selectedMemberData = teamMembers.find(
              member => member.id === selectedMember
            );
            if (selectedMemberData) {
              memberId = selectedMemberData.id;
            }
          } else {
            // Only team is selected, member_id should be null
            memberId = null;
          }
        } else {
          // Nothing is selected, use user_id from token
          memberId = userId;
        }

        //

        const requestBody = {
          id: memberId, // member_id when both team+member selected, null when team only, user_id from token when nothing selected
          team_id: teamId, // team_id when team selected, null otherwise
          limit: conversationLimit,
          ...(loadMore &&
            lastConversationId && { created_before: lastConversationId }),
        };

        //

        const response = await fetch(
          "/api/conversations/inbox/database/getUnifiedChatList",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(requestBody),
          }
        );

        //

        if (!response.ok) {
          const errorText = await response.text();

          toast.error(
            `Failed to fetch conversations: ${response.status} - ${errorText}`
          );
          return;
        }

        const data = await response.json();
        //

        // Transform API data to match our interface
        const conversationsData = data.conversations || [];
        const transformedConversations = conversationsData.map((conv: any) => {
          // Get participant info (first participant is usually the contact)
          const participant = conv.participants?.[0];
          const lastMessage = conv.last_message;

          // Format time from timestamp
          const formatTime = (timestamp: number) => {
            const now = Date.now();
            const diff = now - timestamp;
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            if (minutes < 60) return `${minutes}m`;
            if (hours < 24) return `${hours}h`;
            return `${days}d`;
          };

          // Try multiple sources for profile picture
          const profilePicUrl =
            participant?.profile_pic_url ||
            conv.last_message?.sender_profile?.profile_pic_url ||
            lastMessage?.sender?.profile_pic_url ||
            "";

          return {
            id: conv.conversation_urn_id || "",
            name: participant
              ? `${participant.first_name} ${participant.last_name}`.trim()
              : "Unknown",
            email: participant?.public_identifier
              ? `https://www.linkedin.com/in/${participant.public_identifier}`
              : "",
            lastMessage: lastMessage?.message_text || "",
            time: formatTime(conv.last_activity_at),
            unread: conv.unread_count > 0,
            avatar: participant
              ? `${participant.first_name?.[0] || ""}${participant.last_name?.[0] || ""}`.toUpperCase()
              : "U",
            profilePicUrl: profilePicUrl,
            isStarred: conv.is_starred || false,
            isOnline: false, // API doesn't provide online status
            company: participant?.headline || "",
            companyRole: participant?.headline || "",
            profile: participant,
            conversationData: conv, // Store full conversation data
          };
        });

        // Handle pagination
        if (loadMore) {
          //
          setConversations(prev => {
            const newConversations = [...prev, ...transformedConversations];
            //
            return newConversations;
          });
        } else {
          //
          setConversations(transformedConversations);
        }

        // Update pagination state
        if (transformedConversations.length > 0) {
          const lastConv =
            transformedConversations[transformedConversations.length - 1];
          // Use the last_activity_at timestamp for pagination, not the conversation ID
          const lastTimestamp = lastConv.conversationData?.last_activity_at;
          if (lastTimestamp) {
            setLastConversationId(lastTimestamp.toString());
            //
          }
        }

        // Check if there are more conversations to load
        // If we got fewer conversations than the limit, we've reached the end
        const hasMore = transformedConversations.length === conversationLimit;
        //
        setHasMoreConversations(hasMore);

        return transformedConversations;
      } catch (error) {
        toast.error("Error fetching conversations");
      }
    },
    [
      selectedTeam,
      selectedMember,
      teamMembers,
      conversationLimit,
      lastConversationId,
      conversations.length,
    ]
  );

  // Force sync conversations from source
  const syncMessages = useCallback(async () => {
    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      setIsSyncing(true);
      setError(null);

      const response = await fetch(
        "/api/conversations/inbox/database/getUnifiedChatList",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: userId,
            team_id: user?.workspace_id || null,
            limit: conversationLimit,
            force: true,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(
          `Failed to sync conversations: ${response.status} - ${errorText}`
        );
        return;
      }

      const data = await response.json();
      const conversationsData = data.conversations || [];

      const transformedConversations = conversationsData.map((conv: any) => {
        const participant = conv.participants?.[0];
        const lastMessage = conv.last_message;

        const formatTime = (timestamp: number) => {
          const now = Date.now();
          const diff = now - timestamp;
          const minutes = Math.floor(diff / (1000 * 60));
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          if (minutes < 60) return `${minutes}m`;
          if (hours < 24) return `${hours}h`;
          return `${days}d`;
        };

        const profilePicUrl =
          participant?.profile_pic_url ||
          conv.last_message?.sender_profile?.profile_pic_url ||
          lastMessage?.sender?.profile_pic_url ||
          "";

        return {
          id: conv.conversation_urn_id || "",
          name: participant
            ? `${participant.first_name} ${participant.last_name}`.trim()
            : "Unknown",
          email: participant?.public_identifier
            ? `https://www.linkedin.com/in/${participant.public_identifier}`
            : "",
          lastMessage: lastMessage?.message_text || "",
          time: formatTime(conv.last_activity_at),
          unread: conv.unread_count > 0,
          avatar: participant
            ? `${participant.first_name?.[0] || ""}${participant.last_name?.[0] || ""}`.toUpperCase()
            : "U",
          profilePicUrl: profilePicUrl,
          isStarred: conv.is_starred || false,
          isOnline: false,
          company: participant?.headline || "",
          companyRole: participant?.headline || "",
          profile: participant,
          conversationData: conv,
        };
      });

      // Reset pagination and set new conversations
      setLastConversationId(null);
      setHasMoreConversations(
        transformedConversations.length === conversationLimit
      );
      setConversations(transformedConversations);

      // Update pagination marker from latest list
      if (transformedConversations.length > 0) {
        const lastConv =
          transformedConversations[transformedConversations.length - 1];
        const lastTimestamp = lastConv.conversationData?.last_activity_at;
        if (lastTimestamp) {
          setLastConversationId(lastTimestamp.toString());
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sync conversations"
      );
    } finally {
      setIsSyncing(false);
      // Start 60s cooldown after sync action completes
      setCooldownRemaining(60);
    }
  }, [user?.workspace_id, conversationLimit]);

  // Load more conversations for infinite scroll
  const loadMoreConversations = useCallback(async () => {
    if (isLoadingMore || !hasMoreConversations) {
      //
      return;
    }

    //
    setIsLoadingMore(true);
    try {
      await fetchConversations(true);
      //
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMoreConversations, fetchConversations]);

  // Infinite scroll effect using multiple detection methods
  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = target;

      // Calculate how close we are to the bottom
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      //

      // Trigger load more when user scrolls to bottom (with 50px buffer)
      if (distanceFromBottom < 50 && hasMoreConversations && !isLoadingMore) {
        //
        loadMoreConversations();
      }
    };

    // Also check window scroll as fallback
    const handleWindowScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

      //

      if (distanceFromBottom < 100 && hasMoreConversations && !isLoadingMore) {
        //
        loadMoreConversations();
      }
    };

    // Try multiple approaches to find the scrollable container
    const findScrollContainer = () => {
      // Try different selectors in order of preference
      const selectors = [
        '[aria-label="Conversation list"]',
        ".conversation-list",
        '[data-testid="conversation-list"]',
        ".overflow-y-auto",
        '[role="listbox"]',
        ".space-y-2",
        ".flex.flex-col.space-y-2",
        'div[class*="overflow"]',
        'div[class*="scroll"]',
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          //
          return element;
        }
      }

      // If no specific container found, try to find any scrollable div
      const allDivs = document.querySelectorAll("div");
      for (const div of allDivs) {
        const style = window.getComputedStyle(div);
        if (style.overflowY === "auto" || style.overflowY === "scroll") {
          //
          return div;
        }
      }

      return null;
    };

    // Set up scroll listeners with retry mechanism
    const setupScrollListener = () => {
      const conversationList = findScrollContainer();
      const cleanupFunctions: (() => void)[] = [];

      // Always add window scroll listener as fallback
      window.addEventListener("scroll", handleWindowScroll, { passive: true });
      cleanupFunctions.push(() => {
        window.removeEventListener("scroll", handleWindowScroll);
      });

      if (conversationList) {
        //
        conversationList.addEventListener("scroll", handleScroll, {
          passive: true,
        });
        cleanupFunctions.push(() => {
          conversationList.removeEventListener("scroll", handleScroll);
        });
      } else {
        //
      }

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
      };
    };

    // Initial setup
    let cleanup = setupScrollListener();

    // Retry setup after a short delay in case DOM isn't ready
    const retryTimeout = setTimeout(() => {
      cleanup();
      cleanup = setupScrollListener();
    }, 1000);

    // Also retry after conversations are loaded
    const retryTimeout2 = setTimeout(() => {
      cleanup();
      cleanup = setupScrollListener();
    }, 3000);

    return () => {
      clearTimeout(retryTimeout);
      clearTimeout(retryTimeout2);
      cleanup();
    };
  }, [hasMoreConversations, isLoadingMore, loadMoreConversations]);

  // Reset pagination when filters change
  useEffect(() => {
    setHasMoreConversations(true);
    setLastConversationId(null);
    setConversations([]);
    fetchConversations();
  }, [selectedFilter, searchTerm, selectedTeam, selectedMember]);

  // LinkedIn API Functions
  const fetchLinkedInConversations = async (createdBefore?: string) => {
    try {
      // Get user ID from access token
      const userId = getUserIdFromToken();

      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      const response = await fetch(
        "/api/conversations/inbox/database/getUnifiedChatList",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: userId,
            team_id: user?.workspace_id,
            created_before: createdBefore,
          }),
        }
      );

      if (!response.ok) {
        toast.error(
          `Failed to fetch LinkedIn conversations: ${response.status}`
        );
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const fetchLinkedInMessages = async (
    conversationUrn: string,
    createdBefore?: string
  ) => {
    try {
      const userId = getUserIdFromToken();

      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      const response = await fetch("/api/conversations/inbox/linkedin/id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          conversationUrn,
          createdBefore,
          userId,
          teamId: user?.workspace_id,
        }),
      });

      if (!response.ok) {
        toast.error(`Failed to fetch LinkedIn messages: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const sendLinkedInMessage = async (
    message: string,
    conversationUrn: string,
    attachments: any[] = [],
    selectedUserId?: string
  ) => {
    try {
      const response = await fetch("/api/conversations/inbox/linkedin/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          message,
          conversationUrn,
          attachments,
          selectedUserId,
        }),
      });

      if (!response.ok) {
        toast.error(`Failed to send LinkedIn message: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const sendTypingIndicator = async (conversationUrn: string) => {
    try {
      const response = await fetch("/api/conversations/inbox/linkedin/typing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ conversationUrn }),
      });

      if (!response.ok) {
        // Silently ignore typing indicator failures

        return;
      }

      // No need to parse body; fire-and-forget
      return;
    } catch (error) {
      // Do not throw; avoid breaking typing UX

      return;
    }
  };

  const markMessageAsSeen = async (conversationUrn: string) => {
    try {
      const response = await fetch(
        "/api/conversations/inbox/linkedin/seenMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ conversationUrn }),
        }
      );

      if (!response.ok) {
        toast.error(`Failed to mark message as seen: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const fetchLinkedInProfile = async () => {
    try {
      // Get user ID from access token
      const userId = getUserIdFromToken();

      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      const response = await fetch(
        `/api/conversations/inbox/linkedin/fetchProfile?id=${userId}&team_id=${user?.workspace_id || ""}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error(`Failed to fetch LinkedIn profile: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const filterLinkedInMessages = async (action: string) => {
    try {
      const response = await fetch(
        "/api/conversations/inbox/linkedin/filterMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        toast.error(`Failed to filter LinkedIn messages: ${response.status}`);
        return;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const searchMessages = async (searchQuery: string) => {
    try {
      // Get user ID from access token
      const userId = getUserIdFromToken();

      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      const response = await fetch(
        "/api/conversations/inbox/database/searchMessage",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            search: searchQuery,
            id: userId, // Use user ID from token
            team_id: user?.workspace_id,
          }),
        }
      );

      if (!response.ok) {
        toast.error(`Failed to search messages: ${response.status}`);
        return;
      }

      const data = await response.json();

      // Transform search results (same structure as fetchConversations)
      const conversationsData = data.conversations || [];
      const transformedConversations = conversationsData.map((conv: any) => {
        const participant = conv.participants?.[0];
        const lastMessage = conv.last_message;

        const formatTime = (timestamp: number) => {
          const now = Date.now();
          const diff = now - timestamp;
          const minutes = Math.floor(diff / (1000 * 60));
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          if (minutes < 60) return `${minutes}m`;
          if (hours < 24) return `${hours}h`;
          return `${days}d`;
        };

        // Extract profile picture URL
        const profilePicUrl =
          participant?.profile_pic_url ||
          conv.last_message?.sender_profile?.profile_pic_url ||
          lastMessage?.sender?.profile_pic_url ||
          "";

        return {
          id: conv.conversation_urn_id || "",
          name: participant
            ? `${participant.first_name} ${participant.last_name}`.trim()
            : "Unknown",
          email: participant?.public_identifier
            ? `https://www.linkedin.com/in/${participant.public_identifier}`
            : "",
          lastMessage: lastMessage?.message_text || "",
          time: formatTime(conv.last_activity_at),
          unread: conv.unread_count > 0,
          avatar: participant
            ? `${participant.first_name?.[0] || ""}${participant.last_name?.[0] || ""}`.toUpperCase()
            : "U",
          profilePicUrl: profilePicUrl,
          isStarred: conv.is_starred || false,
          isOnline: false,
          company: "",
          companyRole: "",
          profile: participant,
          conversationData: conv,
        };
      });

      setConversations(transformedConversations);
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const fetchMemberProfile = async () => {
    try {
      // Get user ID from access token
      const userId = getUserIdFromToken();

      if (!userId) {
        toast.error("User ID could not be extracted from access token");
        return;
      }

      const response = await fetch(
        "/api/conversations/inbox/database/fetchMemberProfile",
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: userId, // Use current user's ID instead of memberId parameter
            team_id: user?.workspace_id,
          }),
        }
      );

      if (!response.ok) {
        toast.error(`Failed to fetch member profile: ${response.status}`);
        return;
      }

      const data = await response.json();
      setSelectedProfile(data.profile);
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const fetchLeadInformation = async (conversationId: string) => {
    try {
      //

      const response = await fetch(
        `/api/conversations/inbox/database/getLeadInformations?id=${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error(`Failed to fetch lead information: ${response.status}`);
        return;
      }

      const data = await response.json();
      //
      setLeadInformation(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch lead information"
      );
      setLeadInformation(null);
    } finally {
      setIsLoadingLeadInfo(false);
    }
  };

  const fetchLeadActivity = async (conversationId: string) => {
    try {
      //
      setIsLoadingActivity(true);

      const response = await fetch(
        `/api/conversations/inbox/database/getLeadActivity?id=${conversationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error(`Failed to fetch lead activity: ${response.status}`);
        return;
      }

      const data = await response.json();
      //
      setLeadActivity(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch lead activity"
      );
      setLeadActivity(null);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      //

      const response = await fetch(
        "/api/conversations/inbox/database/get-members",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        toast.error(`Failed to fetch team members: ${response.status}`);
        return;
      }

      const responseData = await response.json();
      //

      // Extract the actual array from the response
      const data = responseData.data || responseData;
      //

      // Transform API data to match our interface
      // NOTE: We include ALL members regardless of their LinkedIn connection status
      // This ensures that account information remains visible even when LinkedIn is disconnected
      const transformedMembers = Array.isArray(data)
        ? data.map((member: any) => ({
            id: member.id?.toString() || "",
            name:
              member.name ||
              member.first_name + " " + member.last_name ||
              "Unknown",
            team:
              member.team_name || member.team || member.role || "Unknown Team",
            team_id: member.team_id || member.teamId || null, // Preserve team ID
            status: member.status || "active",
            email: member.email || "",
            avatar: member.avatar || member.profile_pic_url || "",
            connection_status: member.connection_status || "UNKNOWN", // Preserve connection status
            integration_id: member.integration_id || null, // Track associated integration
          }))
        : [];

      setTeamMembers(transformedMembers);

      return transformedMembers;
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  // Fetch integrations to check if user has any connected LinkedIn accounts
  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/integration/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        setHasConnectedIntegration(false);
        return false;
      }

      const data = await response.json();
      const integrations = Array.isArray(data) ? data : data?.data || [];

      // Check if there's at least one connected LinkedIn integration
      // Note: API returns `type` not `platform` for the integration type
      const hasConnected = integrations.some(
        (integration: {
          connection_status?: string;
          type?: string;
          platform?: string;
        }) =>
          integration.connection_status === "CONNECTED" &&
          (integration.type === "LINKEDIN" ||
            integration.type === "linkedin" ||
            integration.platform === "LINKEDIN" ||
            integration.platform === "linkedin")
      );

      setHasConnectedIntegration(hasConnected);
      return hasConnected;
    } catch (error) {
      setHasConnectedIntegration(false);
      return false;
    }
  };

  // Fetch tags using CRM service
  const fetchTags = async () => {
    try {
      //

      // Check if workspace and organization are available
      if (!selectedWorkspace || !selectedOrganization) {
        return [];
      }

      // Get CRM access token from localStorage
      const crmAccessToken = localStorage.getItem("crm_access_token");

      if (!crmAccessToken) {
        return [];
      }

      // Get workspace and organization IDs from context (same pattern as LeadsList, CompaniesList)
      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const response = await tagService.getAllTags(
        workspaceId,
        organizationId,
        crmAccessToken
      );

      if (response.success && response.data) {
        //
        setAvailableTags(response.data);
        return response.data;
      } else {
        setAvailableTags([]);
        return [];
      }
    } catch (error) {
      setAvailableTags([]);
      return [];
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      //

      // Get user ID from access token
      const userId = getUserIdFromToken();

      if (!userId) {
        //
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        //
        // Fetch LinkedIn conversations using the unified API
        let linkedInData;
        try {
          linkedInData = await fetchLinkedInConversations();
          //
        } catch (error) {
          //
          // Use mock data when backend is not available
          linkedInData = {
            conversations: [
              {
                conversation_urn_id: "mock-conversation-1",
                participants: [
                  {
                    first_name: "John",
                    last_name: "Doe",
                    public_identifier: "john-doe",
                    headline: "Software Engineer",
                  },
                ],
                last_message: {
                  message_text: "Hello! How are you doing today?",
                },
                last_activity_at: Date.now() - 1000 * 60 * 30, // 30 minutes ago
                unread_count: 0,
                is_starred: false,
              },
            ],
            total: 1,
          };
        }

        // Transform LinkedIn conversations to match our interface
        const transformedConversations =
          linkedInData.conversations?.map((conv: any) => {
            const participant = conv.participants?.[0];
            const lastMessage = conv.last_message;

            // Format time from timestamp
            const formatTime = (timestamp: number) => {
              const now = Date.now();
              const diff = now - timestamp;
              const minutes = Math.floor(diff / (1000 * 60));
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const days = Math.floor(diff / (1000 * 60 * 60 * 24));

              if (minutes < 60) return `${minutes}m`;
              if (hours < 24) return `${hours}h`;
              return `${days}d`;
            };

            // Extract profile picture URL
            const profilePicUrl =
              participant?.profile_pic_url ||
              conv.last_message?.sender_profile?.profile_pic_url ||
              lastMessage?.sender?.profile_pic_url ||
              "";

            return {
              id: conv.conversation_urn_id || "",
              name: participant
                ? `${participant.first_name} ${participant.last_name}`.trim()
                : "Unknown",
              email: "",
              lastMessage: lastMessage?.message_text || conv.message_text || "",
              time: formatTime(conv.last_activity_at || conv.created_at),
              unread: conv.unread_count > 0,
              avatar: participant
                ? `${participant.first_name?.[0] || ""}${participant.last_name?.[0] || ""}`.toUpperCase()
                : "U",
              profilePicUrl: profilePicUrl,
              isStarred: conv.is_starred || false,
              isOnline: false, // API doesn't provide online status
              company: "",
              companyRole: "",
              profile: participant,
              conversationData: conv, // Store full conversation data
            };
          }) || [];

        //
        setConversations(transformedConversations);

        // Fetch team members from API
        //
        try {
          await fetchTeamMembers();
        } catch (error) {
          //
          // Set empty team members array to prevent UI issues
          setTeamMembers([]);
        }

        // Fetch integrations to check if user has connected LinkedIn accounts
        try {
          await fetchIntegrations();
        } catch (error) {
          setHasConnectedIntegration(false);
        }

        // Fetch tags from CRM service

        try {
          await fetchTags();
        } catch (error) {
          setAvailableTags([]);
        }

        // Fetch LinkedIn profile

        try {
          const linkedInProfileData = await fetchLinkedInProfile();
          setLinkedInProfile(linkedInProfileData);
        } catch (error) {
          // Set a default profile to prevent UI issues
          setLinkedInProfile({
            profile: {
              public_identifier: "user",
              first_name: "User",
              last_name: "Name",
            },
          });
        }

        // If we have conversations, select the first one and fetch its profile
        if (transformedConversations.length > 0) {
          const firstConversation = transformedConversations[0];
          setSelectedConversation(firstConversation.id);

          await fetchMemberProfile();

          // Check if contact exists for the first conversation
          const firstParticipant =
            firstConversation.profile || firstConversation.participants?.[0];
          if (firstParticipant) {
            const exists = await checkContactExists({
              urnId: firstParticipant.urn_id,
              publicId: firstParticipant.public_identifier,
              url: firstParticipant.linkedin_url,
            });

            setContactExists(exists);
          } else {
            setContactExists(false);
          }
        }

        setIsLoading(false);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to initialize data"
        );
        setIsLoading(false);
      }
    };

    // Add a small delay to ensure user context is loaded
    const timer = setTimeout(() => {
      initializeData();
    }, 100);

    return () => clearTimeout(timer);
  }, [user?.user_id]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Reset selected member when team changes
  useEffect(() => {
    setSelectedMember("all_members");
  }, [selectedTeam]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest("[data-team-dropdown]") &&
        !target.closest("[data-member-dropdown]")
      ) {
        setIsTeamDropdownOpen(false);
        setIsMemberDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (!searchTerm.trim()) {
      // If search is empty, fetch all LinkedIn conversations
      fetchLinkedInConversations()
        .then(linkedInData => {
          const transformedConversations =
            linkedInData.conversations?.map((conv: any) => {
              const participant = conv.participants?.[0];
              const lastMessage = conv.last_message;

              const formatTime = (timestamp: number) => {
                const now = Date.now();
                const diff = now - timestamp;
                const minutes = Math.floor(diff / (1000 * 60));
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));

                if (minutes < 60) return `${minutes}m`;
                if (hours < 24) return `${hours}h`;
                return `${days}d`;
              };

              // Extract profile picture URL
              const profilePicUrl =
                participant?.profile_pic_url ||
                conv.last_message?.sender_profile?.profile_pic_url ||
                lastMessage?.sender?.profile_pic_url ||
                "";

              return {
                id: conv.conversation_urn_id || "",
                name: participant
                  ? `${participant.first_name} ${participant.last_name}`.trim()
                  : "Unknown",
                email: "",
                lastMessage:
                  lastMessage?.message_text || conv.message_text || "",
                time: formatTime(conv.last_activity_at || conv.created_at),
                unread: conv.unread_count > 0,
                avatar: participant
                  ? `${participant.first_name?.[0] || ""}${participant.last_name?.[0] || ""}`.toUpperCase()
                  : "U",
                profilePicUrl: profilePicUrl,
                isStarred: conv.is_starred || false,
                isOnline: false,
                company: "",
                companyRole: "",
                profile: participant,
                conversationData: conv,
              };
            }) || [];
          setConversations(transformedConversations);
        })
        .catch(error => {});
      return;
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchMessages(searchTerm);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Check if contact exists when leadInformation changes
  useEffect(() => {
    const checkContact = async () => {
      // If we already know contact exists, don't allow later effects to overwrite it
      if (contactExists) {
        return;
      }

      if (leadInformation) {
        const exists = await checkContactExists({
          urnId: leadInformation.urn_id,
          publicId: leadInformation.public_identifier,
          url:
            leadInformation.linkedin_url ||
            leadInformation.profile_url ||
            leadInformation.linkedinProfile,
        });

        setContactExists(exists);
      } else {
        // Do not reset contactExists to false here to avoid flicker/override
      }
    };

    checkContact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally omitting checkContactExists and contactExists to prevent infinite loop
  }, [leadInformation, user, selectedWorkspace, selectedOrganization]);

  // Fetch tasks when Tasks tab is selected
  useEffect(() => {
    if (
      activeTab.startsWith("Tasks") &&
      user &&
      selectedWorkspace &&
      selectedOrganization
    ) {
      fetchTasks();
    }
  }, [
    activeTab,
    user,
    selectedWorkspace,
    selectedOrganization,
    contactId,
    contactExists,
  ]);

  // Notes: fetch when Notes tab is selected
  const fetchNotes = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;
    const token = localStorage.getItem("crm_access_token");
    if (!token) return;
    // Only load notes when we have a resolved contactId; otherwise show none
    if (!contactId) {
      setNotesList([]);
      return;
    }
    try {
      setIsLoadingNotes(true);
      const params = {
        workspaceId: selectedWorkspace.id,
        organizationId: selectedOrganization.id,
        ...(contactId ? { contactId } : {}),
      } as const;
      const resp = await notesService.getNotes(params, token);
      setNotesList(resp.data || []);
    } catch (e) {
    } finally {
      setIsLoadingNotes(false);
    }
  }, [user, selectedWorkspace, selectedOrganization, contactId]);

  useEffect(() => {
    if (
      activeTab.startsWith("Notes") &&
      user &&
      selectedWorkspace &&
      selectedOrganization
    ) {
      fetchNotes();
    }
  }, [activeTab, user, selectedWorkspace, selectedOrganization, fetchNotes]);

  // Handle conversation selection
  // Handle adding task from conversation data
  const handleAddTask = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) {
      setError("Missing required information to create task");
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("Authentication token not found");
      return;
    }

    if (!leadInformation) {
      setError(
        "No lead information available. Please select a conversation with contact details."
      );
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    if (!contactId) {
      setError("Contact not resolved yet. Please wait for CRM check.");
      return;
    }

    try {
      setIsCreatingTask(true);
      setError(null);
      setTaskCreated(false);

      // Check if task service is available

      // Create a task related to this conversation
      const taskData: CreateTaskRequest = {
        title: `Follow up with ${leadInformation.name || "LinkedIn Contact"}`,
        description: `Follow up on LinkedIn conversation with ${leadInformation.name || "contact"}${leadInformation.company ? ` from ${leadInformation.company}` : ""}${leadInformation.position ? ` (${leadInformation.position})` : ""}.`,
        status: "PENDING",
        priority: "MEDIUM",
        isAutomated: false,
        // Note: We don't have contactId yet since we're creating the lead separately
        // The task will be created without a specific contact association
      };

      // Use task service to create task
      const result = await taskService.createTaskForContact(
        contactId!,
        taskData,
        workspaceId,
        organizationId,
        token
      );

      if (result.success && result.data) {
        setTaskCreated(true);

        // Refresh tasks list
        await fetchTasks();

        // Reset success state after 3 seconds
        setTimeout(() => {
          setTaskCreated(false);
        }, 3000);
      } else {
        setError(result.error || "Failed to create task");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Fetch tasks using task service
  const fetchTasks = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) {
      return;
    }

    // Only fetch tasks if contact exists and we have a contactId
    if (!contactExists || !contactId) {
      setTaskList([]);
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return;
    }

    try {
      setIsLoadingTasks(true);
      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const result = await taskService.getTasksByContact(
        contactId,
        workspaceId,
        organizationId,
        token
      );

      if (result.success && result.data) {
        setTaskList(result.data);
      } else {
        setTaskList([]);
      }
    } catch (error) {
      setTaskList([]);
    } finally {
      setIsLoadingTasks(false);
    }
  }, [user, selectedWorkspace, selectedOrganization, contactExists, contactId]);

  // Handle task form submission
  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedWorkspace || !selectedOrganization) {
      setError("Missing required information to create task");
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("Authentication token not found");
      return;
    }

    if (!taskFormData.title.trim()) {
      setError("Task title is required");
      return;
    }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      setIsCreatingTask(true);
      setError(null);

      const taskData: CreateTaskRequest = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim(),
        status: "PENDING",
        priority: taskFormData.priority as "LOW" | "MEDIUM" | "HIGH",
        isAutomated: taskFormData.isAutomated,
      };

      // Prefer creating task scoped to the resolved contactId
      const result = contactId
        ? await taskService.createTaskForContact(
            contactId,
            taskData,
            workspaceId,
            organizationId,
            token
          )
        : await taskService.createTask(
            taskData,
            workspaceId,
            organizationId,
            token
          );

      if (result.success && result.data) {
        setTaskCreated(true);
        setShowTaskForm(false);
        setTaskFormData({
          title: "",
          description: "",
          priority: "MEDIUM",
          dueDate: "",
          isAutomated: false,
        });

        // Refresh tasks list
        await fetchTasks();

        // Reset success state after 3 seconds
        setTimeout(() => {
          setTaskCreated(false);
        }, 3000);
      } else {
        setError(result.error || "Failed to create task");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create task"
      );
    } finally {
      setIsCreatingTask(false);
    }
  };

  // Check if contact exists in CRM by trying multiple LinkedIn identifiers
  const checkContactExists = async (linkedinData: {
    urnId?: string;
    publicId?: string;
    url?: string;
  }) => {
    if (!user || !selectedWorkspace || !selectedOrganization) {
      return false;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      return false;
    }

    // Build candidates: URL -> URN -> Public ID -> extracted username (from URL)
    const extractUsername = (u?: string) => {
      if (!u) return undefined;
      try {
        const s = decodeURIComponent(u);
        const m = s.match(/linkedin\.com\/in\/([^/?#]+)/i);
        return m?.[1];
      } catch {
        return undefined;
      }
    };

    // Normalize LinkedIn URL to ensure consistent format
    const normalizeLinkedInUrl = (url?: string) => {
      if (!url) return undefined;
      try {
        let normalized = url.trim();

        // Remove trailing slashes
        normalized = normalized.replace(/\/+$/, "");

        // Ensure it starts with https://
        if (
          !normalized.startsWith("http://") &&
          !normalized.startsWith("https://")
        ) {
          normalized = "https://" + normalized;
        }

        // Convert http to https for LinkedIn
        if (normalized.startsWith("http://")) {
          normalized = normalized.replace("http://", "https://");
        }

        // Ensure it's a LinkedIn URL
        if (!normalized.includes("linkedin.com")) {
          return undefined;
        }

        return normalized;
      } catch {
        return undefined;
      }
    };

    const normalizedUrl = normalizeLinkedInUrl(linkedinData.url);

    const candidates = [
      normalizedUrl,
      linkedinData.url, // Also try original URL
      linkedinData.urnId,
      linkedinData.publicId,
      extractUsername(linkedinData.url),
      extractUsername(normalizedUrl),
    ].filter(
      (v): v is string => Boolean(v) && typeof v === "string" && v.length > 0
    );

    // Remove duplicates
    const uniqueCandidates = [...new Set(candidates)];

    if (uniqueCandidates.length === 0) {
      return false;
    }

    try {
      setIsCheckingContact(true);

      for (const candidate of uniqueCandidates) {
        try {
          const result = await contactService.getContact(
            candidate,
            selectedWorkspace.id,
            selectedOrganization.id,
            token
          );

          if (result.success && result.data) {
            // Persist contactId for downstream (Notes, etc.)
            if ((result.data as any)?.id) {
              setContactId((result.data as any).id as string);
            }
            return true;
          }
        } catch (e) {}
      }

      setContactId(null);
      return false;
    } catch (error) {
      return false;
    } finally {
      setIsCheckingContact(false);
    }
  };

  // Handle adding lead from conversation data (following InboxView pattern)
  const handleAddLead = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) {
      setError("Missing required information to create lead");
      return;
    }

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("Authentication token not found");
      return;
    }

    if (!leadInformation) {
      setError(
        "No lead information available. Please select a conversation with contact details."
      );
      return;
    }

    // Double-check if contact exists before creating (final safety check)

    const selectedConv = conversations.find(
      conv => conv.id === selectedConversation
    );
    const selectedParticipant =
      selectedConv?.profile || selectedConv?.participants?.[0];

    if (selectedParticipant) {
      const finalExists = await checkContactExists({
        urnId: selectedParticipant.urn_id || leadInformation.urn_id,
        publicId:
          selectedParticipant.public_identifier ||
          leadInformation.public_identifier,
        url:
          selectedParticipant.linkedin_url ||
          leadInformation.profile_url ||
          leadInformation.linkedinProfile,
      });

      if (finalExists) {
        setContactExists(true);
        setError(
          "Contact already exists in CRM. The page will refresh to show the correct state."
        );
        // Force a refresh of the contact state
        setTimeout(() => {
          setError(null);
        }, 3000);
        return;
      }
    }

    // Check if leadInformation is an error response (404, etc.)
    let actualLeadInformation = leadInformation;
    if (leadInformation.status_code && leadInformation.status_code !== 200) {
      // Try to get LinkedIn data from the selected conversation
      const selectedConv = conversations.find(
        conv => conv.id === selectedConversation
      );

      if (selectedConv && selectedConv.profile) {
        // Create a mock leadInformation object from conversation data
        const fallbackLeadInformation = {
          name:
            selectedConv.profile.first_name && selectedConv.profile.last_name
              ? `${selectedConv.profile.first_name} ${selectedConv.profile.last_name}`.trim()
              : selectedConv.profile.first_name ||
                selectedConv.profile.last_name ||
                "",
          email: selectedConv.profile.email || "",
          phone: selectedConv.profile.phone || "",
          company: selectedConv.profile.company || "",
          position: selectedConv.profile.position || "",
          headline: selectedConv.profile.headline || "",
          location: selectedConv.profile.location || "",
          linkedinProfile:
            selectedConv.profile.linkedin_url ||
            selectedConv.profile.profile_url ||
            "",
          profile_image_url: selectedConv.profile.profile_pic_url || "",
          urn_id: selectedConv.profile.urn_id || "",
          public_id: selectedConv.profile.public_id || "",
          connection_degree: selectedConv.profile.connection_degree || "",
          // Add any other available fields from the profile
          ...selectedConv.profile,
        };

        // Update the state with the fallback data
        setLeadInformation(fallbackLeadInformation);
        // Use the fallback data for the rest of the function
        actualLeadInformation = fallbackLeadInformation;
      } else {
        setError(
          "No contact information available. The selected conversation does not have profile data."
        );
        return;
      }
    }

    // Check if we have any basic information to work with
    // Based on the actual fields available in leadInformation
    // const hasBasicInfo = leadInformation.name ||
    //                     leadInformation.email ||
    //                     leadInformation.company ||
    //                     leadInformation.position ||
    //                     leadInformation.headline ||
    //                     leadInformation.phone ||
    //                     leadInformation.location ||
    //                     leadInformation.industry;

    // if (!hasBasicInfo) {
    //
    //
    //   setError('No contact information found in this conversation. Cannot create lead.');
    //   return;
    // }

    const workspaceId = selectedWorkspace.id;
    const organizationId = selectedOrganization.id;

    try {
      setIsCreatingLead(true);
      setError(null);
      setLeadCreated(false);

      // Extract and sanitize name from multiple possible sources
      const extractAndSanitizeName = (): string => {
        // Try multiple sources for the name based on actual available fields
        const possibleNames = [
          actualLeadInformation.name,
          actualLeadInformation.position, // Job title as fallback
          actualLeadInformation.headline, // LinkedIn headline as fallback
          actualLeadInformation.company, // Company name as fallback
          actualLeadInformation.location, // Location as fallback
          actualLeadInformation.linkedinProfile, // LinkedIn profile as fallback
        ].filter(Boolean); // Remove null/undefined values

        for (const name of possibleNames) {
          if (name && typeof name === "string") {
            // Remove special characters, numbers, and keep only letters and spaces
            const sanitized = name.replace(/[^a-zA-Z\s]/g, "").trim();
            // Remove multiple spaces and replace with single space
            const cleaned = sanitized.replace(/\s+/g, " ");

            // If we have a valid name with at least one letter, use it
            if (cleaned && /[a-zA-Z]/.test(cleaned)) {
              return cleaned;
            }
          }
        }

        // If no valid name found, try to extract from email
        if (actualLeadInformation.email) {
          const emailName = actualLeadInformation.email.split("@")[0];
          const sanitized = emailName.replace(/[^a-zA-Z\s]/g, "").trim();
          const cleaned = sanitized.replace(/\s+/g, " ");
          if (cleaned && /[a-zA-Z]/.test(cleaned)) {
            return cleaned;
          }
        }

        // Last resort: use a generic name with timestamp
        const timestamp = new Date().toLocaleTimeString();
        return `LinkedIn Contact ${timestamp}`;
      };

      // Prepare contact data from lead information - only include non-empty fields
      const contactData: Partial<{
        name: string;
        email: string;
        phoneNumber: string;
        whatsappNumber: string;
        linkedinUrl: string;
        twitterUrl: string;
        websiteUrl: string;
        jobTitle: string;
        status:
          | "LEAD"
          | "ACTIVE"
          | "INACTIVE"
          | "PROSPECT"
          | "CUSTOMER"
          | "LOST"
          | "WON"
          | "DEAD"
          | "ENGAGED"
          | "INTERESTED"
          | "WARM"
          | "CLOSED";
        source: string;
        city: string;
        companyName: string;
        customAttributes: Record<string, string>;
        enrichedData: Record<string, any>;
        workspaceId: string;
        organizationId: string;
        // LinkedIn specific fields
        linkedinUrnId?: string;
        linkedinPublicId?: string;
        linkedinLocation?: string;
        linkedinHeadline?: string;
        linkedinAbout?: string;
        linkedinJoined?: string;
        linkedinBirthday?: string;
        linkedinConnected?: string;
        linkedinAddress?: string;
        linkedinIsOpenToWork?: boolean;
        linkedinProfilePhoto?: string;
        linkedinProfileUpdated?: string;
        linkedinContactInfoUpdated?: string;
      }> = {
        name: extractAndSanitizeName(),
        status: "LEAD",
        source: "LinkedIn",
        workspaceId,
        organizationId,
        customAttributes: {
          conversationId: selectedConversation || "",
          linkedinProfile:
            actualLeadInformation?.linkedinProfile ||
            actualLeadInformation?.linkedin ||
            actualLeadInformation?.profile_url ||
            "",
          lastMessage: actualLeadInformation?.lastMessage || "",
          originalName: actualLeadInformation?.name || "", // Keep original name in custom attributes
          allPossibleNames: JSON.stringify(
            [
              actualLeadInformation?.name,
              actualLeadInformation?.position,
              actualLeadInformation?.headline,
              actualLeadInformation?.company,
              actualLeadInformation?.location,
            ].filter(Boolean)
          ),
          // Additional LinkedIn profile data - try multiple possible field names
          linkedinUrnId:
            actualLeadInformation?.urn_id ||
            actualLeadInformation?.linkedinUrnId ||
            actualLeadInformation?.profile?.urn_id ||
            "",
          linkedinPublicId:
            actualLeadInformation?.public_id ||
            actualLeadInformation?.linkedinPublicId ||
            actualLeadInformation?.profile?.public_id ||
            "",
          linkedinConnectionDegree:
            actualLeadInformation?.connection_degree ||
            actualLeadInformation?.profile?.connection_degree ||
            "",
          linkedinProfileUrl:
            actualLeadInformation?.profile_url ||
            actualLeadInformation?.linkedinProfile ||
            actualLeadInformation?.linkedin ||
            actualLeadInformation?.profile?.profile_url ||
            "",
          linkedinProfileImage:
            actualLeadInformation?.profile_image_url ||
            actualLeadInformation?.linkedinProfilePhoto ||
            actualLeadInformation?.profile?.profile_image_url ||
            "",
          linkedinIndustry:
            actualLeadInformation?.industry ||
            actualLeadInformation?.basic_details?.industry ||
            actualLeadInformation?.profile?.basic_details?.industry ||
            "",
          linkedinCurrentTitle:
            actualLeadInformation?.basic_details?.jobDetails?.currentTitle ||
            actualLeadInformation?.position ||
            actualLeadInformation?.profile?.basic_details?.jobDetails
              ?.currentTitle ||
            "",
          linkedinCurrentCompany:
            actualLeadInformation?.basic_details?.jobDetails?.currentCompany ||
            actualLeadInformation?.company ||
            actualLeadInformation?.profile?.basic_details?.jobDetails
              ?.currentCompany ||
            "",
          linkedinIsPremium:
            actualLeadInformation?.basic_details?.isPremium ||
            actualLeadInformation?.profile?.basic_details?.isPremium
              ? "true"
              : "false",
          linkedinIsOpenProfile:
            actualLeadInformation?.basic_details?.isOpenProfile ||
            actualLeadInformation?.profile?.basic_details?.isOpenProfile
              ? "true"
              : "false",
          linkedinIsOpenToWork:
            actualLeadInformation?.basic_details?.jobDetails?.isOpenToWork ||
            actualLeadInformation?.profile?.basic_details?.jobDetails
              ?.isOpenToWork
              ? "true"
              : "false",
          linkedinReactionType:
            actualLeadInformation?.basic_details?.jobDetails?.reactionType ||
            actualLeadInformation?.profile?.basic_details?.jobDetails
              ?.reactionType ||
            "",
          linkedinInOtherCampaign:
            actualLeadInformation?.basic_details?.isInOtherCampaign ||
            actualLeadInformation?.profile?.basic_details?.isInOtherCampaign
              ? "true"
              : "false",
        },
        enrichedData: {
          // Store enriched LinkedIn profile data
          linkedinProfile: {
            urn_id:
              actualLeadInformation?.urn_id ||
              actualLeadInformation?.linkedinUrnId ||
              actualLeadInformation?.profile?.urn_id,
            public_id:
              actualLeadInformation?.public_id ||
              actualLeadInformation?.linkedinPublicId ||
              actualLeadInformation?.profile?.public_id,
            name: actualLeadInformation?.name,
            headline: actualLeadInformation?.headline,
            location: actualLeadInformation?.location,
            connection_degree:
              actualLeadInformation?.connection_degree ||
              actualLeadInformation?.profile?.connection_degree,
            profile_url:
              actualLeadInformation?.profile_url ||
              actualLeadInformation?.linkedinProfile ||
              actualLeadInformation?.linkedin ||
              actualLeadInformation?.profile?.profile_url,
            profile_image_url:
              actualLeadInformation?.profile_image_url ||
              actualLeadInformation?.linkedinProfilePhoto ||
              actualLeadInformation?.profile?.profile_image_url,
            basic_details:
              actualLeadInformation?.basic_details ||
              actualLeadInformation?.profile?.basic_details,
            enriched_profile:
              actualLeadInformation?.enriched_profile ||
              actualLeadInformation?.profile?.enriched_profile,
            last_enriched:
              actualLeadInformation?.last_enriched ||
              actualLeadInformation?.profile?.last_enriched,
          },
          conversationData: {
            conversationId: selectedConversation,
            lastMessage: actualLeadInformation?.lastMessage,
            messageCount: actualLeadInformation?.messageCount || 0,
          },
          // Store the raw leadInformation for debugging
          rawLeadInformation: actualLeadInformation,
        },
      };

      // Only add fields if they have valid values
      if (
        actualLeadInformation?.email &&
        actualLeadInformation.email.length >= 5
      ) {
        contactData.email = actualLeadInformation.email;
      }
      if (
        actualLeadInformation?.phone &&
        actualLeadInformation.phone.length >= 10
      ) {
        contactData.phoneNumber = actualLeadInformation.phone;
      }

      // LinkedIn URL mapping - try multiple possible field names
      const linkedinUrl =
        actualLeadInformation?.profile_url ||
        actualLeadInformation?.linkedinProfile ||
        actualLeadInformation?.linkedin ||
        actualLeadInformation?.linkedinUrl ||
        actualLeadInformation?.profile?.profile_url;
      if (linkedinUrl && linkedinUrl.length >= 5) {
        // Use the same normalization logic as checkContactExists
        const normalizeLinkedInUrl = (url: string) => {
          try {
            let normalized = url.trim();

            // Remove trailing slashes
            normalized = normalized.replace(/\/+$/, "");

            // Ensure it starts with https://
            if (
              !normalized.startsWith("http://") &&
              !normalized.startsWith("https://")
            ) {
              normalized = "https://" + normalized;
            }

            // Convert http to https for LinkedIn
            if (normalized.startsWith("http://")) {
              normalized = normalized.replace("http://", "https://");
            }

            return normalized;
          } catch {
            return url;
          }
        };

        const formattedUrl = normalizeLinkedInUrl(linkedinUrl);

        // Ensure it's a LinkedIn URL
        if (formattedUrl.includes("linkedin.com")) {
          contactData.linkedinUrl = formattedUrl;
        } else {
          // Still add it but log a warning
          contactData.linkedinUrl = formattedUrl;
        }
      }

      // LinkedIn specific fields mapping - try multiple possible field names
      const urnId =
        actualLeadInformation?.urn_id ||
        actualLeadInformation?.linkedinUrnId ||
        actualLeadInformation?.profile?.urn_id;
      if (urnId) {
        contactData.linkedinUrnId = urnId;
      }

      const publicId =
        actualLeadInformation?.public_id ||
        actualLeadInformation?.linkedinPublicId ||
        actualLeadInformation?.profile?.public_id;
      if (publicId) {
        contactData.linkedinPublicId = publicId;
      }

      const location =
        actualLeadInformation?.location ||
        actualLeadInformation?.profile?.location;
      if (location) {
        contactData.linkedinLocation = location;
        contactData.city = location; // Also set city
      }

      const headline =
        actualLeadInformation?.headline ||
        actualLeadInformation?.profile?.headline;
      if (headline) {
        contactData.linkedinHeadline = headline;
        contactData.jobTitle = headline; // Use headline as job title
      }

      if (
        actualLeadInformation?.position &&
        actualLeadInformation.position.length >= 1
      ) {
        contactData.jobTitle = actualLeadInformation.position; // Use position as job title if no headline
      }

      const company =
        actualLeadInformation?.company ||
        actualLeadInformation?.profile?.company;
      if (company && company.length > 0) {
        contactData.companyName = company;
      }

      // LinkedIn enriched profile data - try multiple possible field names
      const enrichedProfile =
        actualLeadInformation?.enriched_profile ||
        actualLeadInformation?.profile?.enriched_profile;
      if (enrichedProfile?.aboutThisProfile?.about) {
        contactData.linkedinAbout = enrichedProfile.aboutThisProfile.about;
      }
      if (enrichedProfile?.aboutThisProfile?.joined) {
        contactData.linkedinJoined = enrichedProfile.aboutThisProfile.joined;
      }
      if (enrichedProfile?.contactInfo?.birthday) {
        contactData.linkedinBirthday = enrichedProfile.contactInfo.birthday;
      }
      if (enrichedProfile?.contactInfo?.connected) {
        contactData.linkedinConnected = enrichedProfile.contactInfo.connected;
      }
      if (
        enrichedProfile?.contactInfo?.address &&
        enrichedProfile.contactInfo.address.length > 0
      ) {
        contactData.linkedinAddress = enrichedProfile.contactInfo.address[0];
      }
      if (enrichedProfile?.jobPreferences?.isOpenToWork !== undefined) {
        contactData.linkedinIsOpenToWork =
          enrichedProfile.jobPreferences.isOpenToWork;
      }

      // Profile photo mapping - try multiple sources
      const profilePhoto =
        actualLeadInformation?.profile_image_url ||
        actualLeadInformation?.linkedinProfilePhoto ||
        actualLeadInformation?.profile?.profile_image_url ||
        enrichedProfile?.aboutThisProfile?.profile_photo;
      if (profilePhoto) {
        contactData.linkedinProfilePhoto = profilePhoto;
      }

      // Set profile updated timestamps
      const now = new Date().toISOString();
      contactData.linkedinProfileUpdated = now;
      contactData.linkedinContactInfoUpdated = now;

      // Validate that we have a valid name before proceeding
      if (!contactData.name) {
        setError("Unable to extract a valid name from the conversation data");
        return;
      }

      // Additional validation: ensure name contains at least one letter
      if (!/[a-zA-Z]/.test(contactData.name)) {
        setError("Contact name must contain at least one letter");
        return;
      }

      const result = await contactService.createContact(
        workspaceId,
        organizationId,
        contactData,
        token
      );

      if (result.success && result.data) {
        setLeadCreated(true);

        // Reset success state after 3 seconds
        setTimeout(() => {
          setLeadCreated(false);
        }, 3000);
      } else {
        // Provide more specific error messages
        if (
          result.error?.includes("Name can only contain letters and spaces")
        ) {
          setError("Invalid name format. Please check the contact name.");
        } else {
          setError(result.error || "Failed to create lead");
        }
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create lead"
      );
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    // Set the selected conversation first
    setSelectedConversation(conversationId);

    // Reset lead and task creation state when selecting new conversation
    setLeadCreated(false);
    setTaskCreated(false);
    setError(null);

    // Reset contact state for new conversation
    setContactExists(false);
    setContactId(null);
    setTaskList([]);

    // Clear previous lead information and activity, set loading states
    setLeadInformation(null);
    setIsLoadingLeadInfo(true);
    setLeadActivity(null);
    setIsLoadingActivity(true);
    setIsLoadingMessages(true);

    // CRITICAL: Clear ALL messages immediately to prevent mixing
    setMessages({});

    try {
      // Get the selected conversation info first
      const selectedConv = conversations.find(
        conv => conv.id === conversationId
      );
      const selectedParticipant =
        selectedConv?.profile || selectedConv?.participants?.[0];
      const currentUserProfile = linkedInProfile?.profile;

      // Check if contact exists in CRM using conversation LinkedIn data
      if (selectedParticipant) {
        const exists = await checkContactExists({
          urnId: selectedParticipant.urn_id,
          publicId: selectedParticipant.public_identifier,
          url:
            selectedParticipant.linkedin_url || selectedParticipant.profile_url,
        });

        setContactExists(exists);
      } else {
        setContactExists(false);
      }

      // Fetch messages for ONLY this specific conversation
      const messagesData = await fetchLinkedInMessages(conversationId);

      // Extract messages from the API response
      let rawMessages = [];
      if (
        messagesData?.conversations &&
        Array.isArray(messagesData.conversations)
      ) {
        rawMessages = messagesData.conversations;
      } else if (
        messagesData?.messages &&
        Array.isArray(messagesData.messages)
      ) {
        rawMessages = messagesData.messages;
      } else if (Array.isArray(messagesData)) {
        rawMessages = messagesData;
      }

      // Filter messages to ensure they belong to this conversation
      const messagesForThisConversation = rawMessages.filter((msg: any) => {
        const msgConvId =
          msg.conversation_urn_id ||
          msg?.conversation?.urn_id ||
          msg?.conversation_id ||
          msg?.conversationUrn ||
          msg?.conversation_urn;

        const belongsToConversation = msgConvId === conversationId;

        if (!belongsToConversation) {
        }

        return belongsToConversation;
      });

      // Transform messages to our interface
      const transformedMessages = messagesForThisConversation.map(
        (msg: any) => {
          let senderName = "Unknown";
          let senderAvatar = "U";
          let isFromCurrentUser = false;

          if (msg.sender) {
            senderName =
              `${msg.sender.first_name || ""} ${msg.sender.last_name || ""}`.trim();
            senderAvatar =
              `${msg.sender.first_name?.[0] || ""}${msg.sender.last_name?.[0] || ""}`.toUpperCase();

            // Determine if message is from current user
            if (currentUserProfile) {
              // Method 1: Compare by public_identifier (most reliable)
              if (
                currentUserProfile.public_identifier &&
                msg.sender.public_identifier
              ) {
                isFromCurrentUser =
                  currentUserProfile.public_identifier ===
                  msg.sender.public_identifier;
              }

              // Method 2: Compare by URN ID
              if (
                !isFromCurrentUser &&
                currentUserProfile.urn_id &&
                msg.sender.urn_id
              ) {
                isFromCurrentUser =
                  currentUserProfile.urn_id === msg.sender.urn_id;
              }

              // Method 3: Compare by full name
              if (
                !isFromCurrentUser &&
                currentUserProfile.first_name &&
                currentUserProfile.last_name
              ) {
                const currentUserFullName =
                  `${currentUserProfile.first_name} ${currentUserProfile.last_name}`
                    .trim()
                    .toLowerCase();
                const senderFullName = senderName.toLowerCase();
                isFromCurrentUser = currentUserFullName === senderFullName;
              }
            }

            // Method 4: If sender matches participant, it's NOT current user
            if (!isFromCurrentUser && selectedParticipant) {
              const participantName =
                `${selectedParticipant.first_name || ""} ${selectedParticipant.last_name || ""}`.trim();
              const senderMatchesParticipant =
                senderName.toLowerCase() === participantName.toLowerCase();
              isFromCurrentUser = !senderMatchesParticipant;
            }
          }

          return {
            id:
              msg.id || msg.message_id || Date.now().toString() + Math.random(),
            sender: senderName,
            message: msg.message_text || msg.text || msg.content || "",
            time: formatMessageTime(msg.created_at || msg.timestamp),
            timestamp: msg.created_at || msg.timestamp,
            isFromCurrentUser: isFromCurrentUser,
            avatar: senderAvatar,
            profilePicUrl:
              msg.sender?.profile_pic_url ||
              msg.sender_profile?.profile_pic_url ||
              "",
            attachments: msg.attachments || [],
            reactions: msg.reaction_summaries || msg.reactions || [],
            conversationId: conversationId, // Store conversation ID for verification
          };
        }
      );

      // Final filtering: Only show messages from current user and selected participant
      let filteredMessages = [];

      if (selectedParticipant && currentUserProfile) {
        const participantName =
          `${selectedParticipant.first_name || ""} ${selectedParticipant.last_name || ""}`.trim();
        const currentUserName =
          `${currentUserProfile.first_name || ""} ${currentUserProfile.last_name || ""}`.trim();

        filteredMessages = transformedMessages.filter((msg: any) => {
          const senderName = msg.sender?.trim();

          // Include messages from current user
          if (msg.isFromCurrentUser) {
            return true;
          }

          // Include messages from selected participant
          const isFromSelectedPerson =
            senderName.toLowerCase() === participantName.toLowerCase();

          if (isFromSelectedPerson) {
          } else {
          }

          return isFromSelectedPerson;
        });
      } else {
        filteredMessages = transformedMessages;
      }

      // CRITICAL: Set ONLY messages for this conversation
      setMessages({
        [conversationId]: filteredMessages,
      });

      // Ensure the latest message is visible after conversation switch
      setTimeout(() => {
        scrollToBottom();
      }, 100);

      setTimeout(() => {
        scrollToBottom();
      }, 300);

      setTimeout(() => {
        scrollToBottom();
      }, 500);

      // Mark messages as seen
      await markMessageAsSeen(conversationId);

      // Fetch profile for current user
      await fetchMemberProfile();

      // Fetch lead information and activity for the selected conversation
      await Promise.all([
        fetchLeadInformation(conversationId),
        fetchLeadActivity(conversationId),
      ]);

      // Check if contact exists in CRM after lead information is fetched
      // This will be handled by the useEffect below when leadInformation changes
    } catch (error) {
      // Set empty messages on error to prevent showing old messages
      setMessages({ [conversationId]: [] });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Helper function to format message time
  // Format time for display (just the time, like "12:19 PM")
  const formatMessageTime = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Format date separator (like "SEP 22" or "TODAY")
  const formatDateSeparator = (timestamp: number | string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Check if it's today
    if (messageDate.getTime() === today.getTime()) {
      return "TODAY";
    }

    // Check if it's yesterday
    if (messageDate.getTime() === yesterday.getTime()) {
      return "YESTERDAY";
    }

    // For older dates, show "MMM DD" in uppercase (e.g., "SEP 22")
    const month = date
      .toLocaleDateString("en-US", { month: "short" })
      .toUpperCase();
    const day = date.getDate();

    return `${month} ${day}`;
  };

  // Get date string for grouping
  const getMessageDateString = (timestamp: number | string) => {
    const date = new Date(timestamp);
    return date.toDateString();
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!selectedConversation) return;

    const messageText = newMessage.trim();
    const currentAttachments = [...attachments];

    // Optimistic UI: Update state immediately
    const tempId = Date.now().toString();
    const optimisticMsg = {
      id: tempId,
      sender: "You",
      message: messageText,
      time: "now",
      timestamp: Date.now(),
      isFromCurrentUser: true,
      avatar: "Y",
      attachments:
        currentAttachments.length > 0
          ? currentAttachments.map(a => ({
              ...a,
              mediaType: a.type,
              reference: a.data || "",
            }))
          : undefined,
      status: "sending",
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [
        ...(prev[selectedConversation] || []),
        optimisticMsg,
      ],
    }));

    // Clear input
    setNewMessage("");
    setAttachments([]);

    // Scroll to bottom immediately
    setTimeout(scrollToBottom, 0);

    try {
      // Process attachments for upload
      const processedAttachments = currentAttachments.map(attachment => ({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        data: attachment.data, // Base64 data for MinIO upload
      }));

      // Send message using LinkedIn API with processed attachments
      const response = await sendLinkedInMessage(
        messageText,
        selectedConversation,
        processedAttachments,
        selectedUserId
      );

      // Success: Update status
      setMessages(prev => {
        const conversationMessages = prev[selectedConversation] || [];
        return {
          ...prev,
          [selectedConversation]: conversationMessages.map(msg =>
            msg.id === tempId
              ? {
                  ...msg,
                  status: "sent",
                  id: response?.id || response?.message_id || msg.id,
                }
              : msg
          ),
        };
      });
    } catch (error) {
      // Restore message and attachments on error
      setNewMessage(messageText);
      setAttachments(currentAttachments);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle sending voice message
  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!selectedConversation) {
      toast.error("No conversation selected");
      return;
    }

    // Find the conversation to get the integration_id
    const conversation = conversations.find(c => c.id === selectedConversation);
    const integrationId = conversation?.conversationData?.integration_id;

    if (!integrationId) {
      toast.error("Could not determine integration for this conversation");
      return;
    }

    // Optimistic UI: Add a temp voice message
    const tempId = `temp-voice-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      sender: "You",
      message: "[Voice Message]",
      time: "now",
      timestamp: Date.now(),
      isFromCurrentUser: true,
      avatar: "Y",
      status: "sending",
      isVoiceMessage: true,
      voiceUrl: URL.createObjectURL(audioBlob),
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [
        ...(prev[selectedConversation] || []),
        optimisticMsg,
      ],
    }));

    // Exit voice recording mode
    setIsRecordingVoice(false);

    // Scroll to bottom
    setTimeout(scrollToBottom, 0);

    try {
      const result = await sendVoiceMessage({
        audioBlob,
        conversationUrnId: selectedConversation,
        integrationId,
      });

      if (result.success) {
        // Update temp message to sent
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: prev[selectedConversation].map(msg =>
            msg.id === tempId
              ? {
                  ...msg,
                  status: "sent",
                  id: result.unipile_message_id || tempId,
                }
              : msg
          ),
        }));
        toast.success("Voice message sent");
      } else {
        // Remove temp message on error
        setMessages(prev => ({
          ...prev,
          [selectedConversation]: prev[selectedConversation].filter(
            msg => msg.id !== tempId
          ),
        }));
        toast.error(result.error || "Failed to send voice message");
      }
    } catch (error) {
      // Remove temp message on error
      setMessages(prev => ({
        ...prev,
        [selectedConversation]: prev[selectedConversation].filter(
          msg => msg.id !== tempId
        ),
      }));
      toast.error("Failed to send voice message");
    }
  };

  // Handle typing indicator
  const lastTypingSentAtRef = useRef<number>(0);

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (value.trim() && selectedConversation) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      // Throttle typing indicator (max once per 1500ms)
      const now = Date.now();
      if (now - lastTypingSentAtRef.current > 1500) {
        void sendTypingIndicator(selectedConversation);
        lastTypingSentAtRef.current = now;
      }

      // Set new timeout to stop typing indicator
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);

      setTypingTimeout(timeout);
      setIsTyping(true);
    } else {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      setIsTyping(false);
    }
  };

  // Handle key press for sending messages
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Ensure scroll to bottom when conversation changes
  useEffect(() => {
    if (displayedMessages.length > 0 && selectedConversation) {
      const id1 = setTimeout(() => scrollToBottom(), 200);
      const id2 = setTimeout(() => scrollToBottom(), 400);
      const id3 = setTimeout(() => scrollToBottom(), 600);

      return () => {
        clearTimeout(id1);
        clearTimeout(id2);
        clearTimeout(id3);
      };
    }
  }, [selectedConversation, scrollToBottom]);

  useEffect(() => {
    if (!isLoading && displayedMessages.length > 0) {
      const id = setTimeout(() => scrollToBottom(), 150);
      return () => clearTimeout(id);
    }
  }, [isLoading, displayedMessages.length, scrollToBottom]);

  // Additional effect specifically for when messages are loaded for a conversation
  useEffect(() => {
    if (
      selectedConversation &&
      messages[selectedConversation] &&
      messages[selectedConversation].length > 0
    ) {
      const id1 = setTimeout(() => scrollToBottom(), 150);
      const id2 = setTimeout(() => scrollToBottom(), 350);
      const id3 = setTimeout(() => scrollToBottom(), 550);

      return () => {
        clearTimeout(id1);
        clearTimeout(id2);
        clearTimeout(id3);
      };
    }
  }, [selectedConversation, messages, scrollToBottom]);

  // After initial page APIs stabilize, perform a single definitive contact check
  useEffect(() => {
    // Only proceed when initial loads are done and a conversation is selected
    if (
      isLoading ||
      isLoadingMessages ||
      !selectedConversation ||
      isCheckingContact
    ) {
      return;
    }
    // If already confirmed, skip
    if (contactExists) return;

    const selectedConv = conversations.find(c => c.id === selectedConversation);
    const p = selectedConv?.profile || selectedConv?.participants?.[0];
    if (!p) return;

    const urlCandidate =
      typeof p.public_identifier === "string" &&
      p.public_identifier.startsWith("http")
        ? p.public_identifier
        : p.linkedin_url || p.profile_url;
    const publicIdCandidate =
      typeof p.public_identifier === "string" &&
      !p.public_identifier.startsWith("http")
        ? p.public_identifier
        : undefined;

    const identifiers = {
      url: urlCandidate,
      urnId: p.urn_id,
      publicId: publicIdCandidate,
    } as { url?: string; urnId?: string; publicId?: string };

    if (!identifiers.url && !identifiers.urnId && !identifiers.publicId) return;

    void (async () => {
      const exists = await checkContactExists(identifiers);
      if (exists) setContactExists(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionally omitting checkContactExists, contactExists, and isCheckingContact to prevent infinite loop
  }, [isLoading, isLoadingMessages, selectedConversation, conversations]);

  // Force scroll to bottom whenever messages container is available and has content
  useEffect(() => {
    const forceScroll = () => {
      const el = messagesContainerRef.current;
      if (el && displayedMessages.length > 0) {
        // Force immediate scroll
        el.scrollTop = el.scrollHeight;
        // Also try scrollTo as backup
        el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
      }
    };

    // Try multiple times to ensure it works
    forceScroll();
    const id1 = setTimeout(forceScroll, 50);
    const id2 = setTimeout(forceScroll, 100);
    const id3 = setTimeout(forceScroll, 200);
    const id4 = setTimeout(forceScroll, 500);
    const id5 = setTimeout(forceScroll, 1000);

    return () => {
      clearTimeout(id1);
      clearTimeout(id2);
      clearTimeout(id3);
      clearTimeout(id4);
      clearTimeout(id5);
    };
  }, [displayedMessages.length, selectedConversation]);

  // Clean up messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      // Ensure we only have messages for the current conversation
      const currentConvMessages = messages[selectedConversation] || [];
      if (
        Object.keys(messages).length > 1 ||
        (Object.keys(messages).length === 1 && !messages[selectedConversation])
      ) {
        setMessages({
          [selectedConversation]: currentConvMessages,
        });
      }
    }
  }, [selectedConversation, messages]);

  // Additional scroll effect that triggers after messages are rendered in DOM
  useEffect(() => {
    if (displayedMessages.length > 0 && !isLoadingMessages) {
      // Use a longer delay to ensure DOM is fully rendered
      const scrollAfterRender = () => {
        const el = messagesContainerRef.current;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      };

      // Try after DOM updates
      setTimeout(scrollAfterRender, 100);
      setTimeout(scrollAfterRender, 300);
      setTimeout(scrollAfterRender, 600);
      setTimeout(scrollAfterRender, 1000);
    }
  }, [displayedMessages, isLoadingMessages]);

  // Use MutationObserver to detect DOM changes and scroll immediately
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el && displayedMessages.length > 0) {
      const observer = new MutationObserver(() => {
        // Scroll immediately when DOM changes
        el.scrollTop = el.scrollHeight;
      });

      observer.observe(el, {
        childList: true,
        subtree: true,
        attributes: true,
      });

      return () => observer.disconnect();
    }
  }, [displayedMessages.length, selectedConversation]);

  // Get notes and activities for the selected conversation (mock data for now)
  const currentNotes = selectedConversation
    ? notes[selectedConversation] || []
    : [];
  const currentActivities = selectedConversation
    ? activities[selectedConversation] || []
    : [];
  // Mock data for tasks (keeping for now)
  const tasks = [
    // {
    //   id: 1,
    //   title: "Follow up on proposal",
    //   status: "pending",
    //   dueDate: "Tomorrow",
    //   priority: "high",
    // },
    // {
    //   id: 2,
    //   title: "Schedule demo call",
    //   status: "in_progress",
    //   dueDate: "Next week",
    //   priority: "medium",
    // },
    // {
    //   id: 3,
    //   title: "Send case studies",
    //   status: "completed",
    //   dueDate: "Last week",
    //   priority: "low",
    // },
    // {
    //   id: 4,
    //   title: "Prepare custom quote",
    //   status: "pending",
    //   dueDate: "1/22/2024",
    //   priority: "high",
    // },
  ];

  // Filter options with dynamic counts
  const filterOptions = [
    {
      key: "all",
      label: "All Conversations",
      icon: Inbox,
      count: currentConversations.length,
    },
    {
      key: "unread",
      label: "Unread",
      icon: Mail,
      count: currentConversations.filter(c => c.unread).length,
    },
    {
      key: "starred",
      label: "Starred",
      icon: Star,
      count: currentConversations.filter(c => c.isStarred).length,
    },
    {
      key: "replies",
      label: "Replies",
      icon: MessageSquare,
      count: currentConversations.filter(
        c =>
          c.lastMessage.includes("Thanks") ||
          c.lastMessage.includes("interested") ||
          c.lastMessage.includes("love to learn") ||
          c.lastMessage.includes("sounds interesting") ||
          c.lastMessage.includes("demo") ||
          c.lastMessage.includes("pricing") ||
          c.lastMessage.includes("no") ||
          c.lastMessage.includes("not interested") ||
          c.lastMessage.includes("busy") ||
          c.lastMessage.includes("later") ||
          c.lastMessage.includes("Hello") ||
          c.lastMessage.includes("Hi") ||
          c.lastMessage.includes("Yes") ||
          c.lastMessage.includes("Sure") ||
          c.lastMessage.includes("Maybe") ||
          c.lastMessage.includes("When") ||
          c.lastMessage.includes("How") ||
          c.lastMessage.includes("What") ||
          c.lastMessage.includes("Can") ||
          c.lastMessage.includes("Would")
      ).length,
    },
    {
      key: "recent",
      label: "Recent",
      icon: Clock,
      count: currentConversations.filter(
        c => c.time.includes("m") || c.time.includes("h")
      ).length,
    },
    { key: "archived", label: "Archived", icon: Archive, count: 0 },
  ];

  const selectedConversationData = currentConversations.find(
    conversation => conversation.id === selectedConversation
  );

  // Determine the empty state context for the unified empty state component
  const emptyStateContext = (() => {
    // If filter is applied and no results, show filter empty state
    if (
      conversations.length > 0 &&
      filteredConversations.length === 0 &&
      selectedFilter !== "all"
    ) {
      return "filter-empty" as const;
    }

    // If no integrations connected (use state from /api/integration/list)
    // hasConnectedIntegration is null while loading, false if no integration, true if has integration
    if (hasConnectedIntegration === false) {
      return "no-integration" as const;
    }

    // If integration connected but no conversations (needs sync or truly empty)
    if (hasConnectedIntegration === true && conversations.length === 0) {
      // If we just loaded and there are no conversations, suggest sync
      return "needs-sync" as const;
    }

    // All conversations filtered out
    if (filteredConversations.length === 0) {
      return "no-conversations" as const;
    }

    return null; // Has conversations to show
  })();

  // Check if we should show the unified empty state (full-width)
  const showUnifiedEmptyState =
    emptyStateContext !== null &&
    emptyStateContext !== "filter-empty" &&
    conversations.length === 0;

  // Auto-select first conversation when conversations load or filter changes
  useEffect(() => {
    if (filteredConversations.length > 0) {
      // If no conversation is selected or selected conversation is not in filtered list
      if (
        !selectedConversation ||
        !filteredConversations.find(c => c.id === selectedConversation)
      ) {
        const firstConversation = filteredConversations[0];
        // Use handleConversationSelect which will fetch messages
        handleConversationSelect(firstConversation.id);
      }
    } else if (filteredConversations.length === 0) {
      // Clear selection if no conversations match the filter
      setSelectedConversation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredConversations.length, selectedFilter]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppLayout activePage="Conversations" className="!p-0">
          <style>{scrollbarHideStyles}</style>
          <div className="flex flex-col h-[83vh]">
            {error && (
              <div className="p-4 m-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-red-600">Error: {error}</p>
              </div>
            )}
            <div className="flex overflow-hidden flex-col flex-1 rounded-2xl border shadow-sm bg-background border-border lg:flex-row">
              {/* Left Panel - Filters Skeleton */}
              <Card className="flex flex-col flex-shrink-0 w-full rounded-none border-r lg:w-72 border-border lg:rounded-l-2xl">
                <CardHeader className="pb-4">
                  <Skeleton className="w-16 h-6" />
                </CardHeader>

                {/* Team Members Section Skeleton */}
                <CardContent className="px-4 py-4 border-b border-border">
                  <Skeleton className="mb-2 w-24 h-4" />
                  <div className="space-y-2">
                    <Skeleton className="w-full h-8" />
                    <Skeleton className="w-full h-8" />
                  </div>
                </CardContent>

                {/* Conversation Categories Skeleton */}
                <CardContent className="overflow-y-auto flex-1 px-4 py-4">
                  <Skeleton className="mb-2 w-28 h-4" />
                  <div className="space-y-1">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-2"
                      >
                        <div className="flex gap-2 items-center">
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="w-20 h-4" />
                        </div>
                        <Skeleton className="w-6 h-4" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Middle Panel - LinkedIn Conversations Skeleton */}
              <Card className="flex flex-col flex-shrink-0 w-full rounded-none border-r lg:w-100 border-border">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="w-16 h-6" />
                    <Skeleton className="w-20 h-5" />
                  </div>

                  {/* Search Bar Skeleton */}
                  <div className="relative mb-4">
                    <Skeleton className="w-full h-8" />
                  </div>

                  {/* Filter Bar Skeleton */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <Skeleton className="w-3 h-3" />
                      <Skeleton className="w-12 h-4" />
                    </div>
                    <Skeleton className="w-20 h-4" />
                  </div>
                </CardHeader>

                {/* Conversation List Skeleton */}
                <CardContent className="overflow-y-auto flex-1 p-0 scrollbar-hide">
                  <div className="space-y-0">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="p-3 w-full border-b border-border"
                      >
                        <div className="flex gap-2 items-start">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                              <Skeleton className="w-24 h-4" />
                              <Skeleton className="w-8 h-3" />
                            </div>
                            <Skeleton className="w-full h-3" />
                            <Skeleton className="w-3/4 h-3" />
                            <div className="flex gap-1 items-center">
                              <Skeleton className="w-3 h-3" />
                              <Skeleton className="w-3 h-3" />
                              <Skeleton className="w-4 h-3" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Right Panel - Active Chat Skeleton */}
              <Card className="flex flex-col flex-1 rounded-none">
                {/* Chat Header Skeleton */}
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-3 items-center">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Skeleton className="w-8 h-8" />
                      <Skeleton className="w-8 h-8" />
                      <Skeleton className="w-8 h-8" />
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Skeleton */}
                <CardContent
                  className="overflow-y-auto flex-1 scrollbar-hide"
                  style={{ height: "380px", maxHeight: "380px" }}
                >
                  <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
                      >
                        <div className="flex gap-2 max-w-[80%]">
                          <Skeleton className="w-6 h-6 rounded-full" />
                          <div className="space-y-1">
                            <div className="flex gap-2 items-center">
                              <Skeleton className="w-16 h-3" />
                              <Skeleton className="w-12 h-3" />
                            </div>
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-2/3 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Message Input Skeleton */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2 items-center">
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="flex-1 h-8" />
                    <Skeleton className="w-8 h-8" />
                    <Skeleton className="w-8 h-8" />
                  </div>
                </div>
              </Card>

              {/* Right Sidebar - Contact Information Skeleton */}
              <Card className="flex relative flex-col flex-shrink-0 w-full rounded-none border-l lg:w-110 border-border">
                {/* Profile Header Skeleton */}
                <CardHeader className="pb-4">
                  <div className="flex gap-4 items-center">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-5" />
                      <div className="flex gap-2">
                        <Skeleton className="w-16 h-7" />
                        <Skeleton className="w-20 h-7" />
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Tabs Skeleton */}
                <div className="flex-shrink-0 pr-16 border-b border-border">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex gap-2 items-center px-4 py-3 border-b-2 border-transparent"
                      >
                        <Skeleton className="w-4 h-4" />
                        <Skeleton className="w-16 h-4" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tab Content Skeleton */}
                <CardContent className="overflow-y-auto flex-1 pr-16 scrollbar-hide">
                  <div className="space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="w-20 h-4" />
                        <Skeleton className="w-full h-8" />
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Right Navigation Icons Skeleton */}
                <div className="flex absolute top-0 right-0 flex-col gap-1 p-2 h-full border-l bg-background border-border">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="w-8 h-8 rounded-md" />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </AppLayout>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppLayout activePage="Conversations" className="!p-0">
        <style>{scrollbarHideStyles}</style>
        <div className="flex flex-col h-[83vh]">
          {error && (
            <div className="p-4 m-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600">Error: {error}</p>
            </div>
          )}
          <div className="flex overflow-hidden flex-col flex-1 rounded-2xl border shadow-sm bg-background border-border lg:flex-row">
            {/* Left Panel - Filters */}
            <Card className="flex flex-col flex-shrink-0 w-full rounded-none border-r lg:w-72 border-border lg:rounded-l-2xl">
              {/* Team Members Section */}
              {teamMembers.length > 0 && (
                <>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-semibold">
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 py-4 border-b border-border">
                    <h3 className="mb-2 text-sm font-medium tracking-wider uppercase text-muted-foreground">
                      Workspace Members
                    </h3>
                    <div className="space-y-2">
                      {/* Team Dropdown - Searchable */}
                      <div className="relative" data-team-dropdown>
                        <button
                          type="button"
                          onClick={() => {
                            setIsTeamDropdownOpen(!isTeamDropdownOpen);
                            setIsMemberDropdownOpen(false);
                            setTeamSearchTerm("");
                          }}
                          className="flex justify-between items-center px-3 py-2 w-full text-sm rounded border border-input bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label="Select team"
                        >
                          <span>
                            {selectedTeam === "all_teams"
                              ? "All Workspaces"
                              : selectedTeam}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isTeamDropdownOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isTeamDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg border-border max-h-60 overflow-hidden">
                            <div className="p-2 border-b border-border">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 w-3 h-3 transform -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Search workspaces..."
                                  value={teamSearchTerm}
                                  onChange={e =>
                                    setTeamSearchTerm(e.target.value)
                                  }
                                  className="pl-7 h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeam("all_teams");
                                  setIsTeamDropdownOpen(false);
                                  setTeamSearchTerm("");
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                                  selectedTeam === "all_teams" &&
                                    "bg-primary/10 text-primary font-medium"
                                )}
                              >
                                All Workspaces
                              </button>
                              {Array.from(
                                new Set(teamMembers.map(member => member.team))
                              )
                                .filter(
                                  team =>
                                    team &&
                                    team !== "Unknown Team" &&
                                    (!teamSearchTerm ||
                                      team
                                        .toLowerCase()
                                        .includes(teamSearchTerm.toLowerCase()))
                                )
                                .sort((a, b) =>
                                  (a || "").localeCompare(b || "")
                                )
                                .map(team => (
                                  <button
                                    key={team}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTeam(team || "");
                                      setIsTeamDropdownOpen(false);
                                      setTeamSearchTerm("");
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                                      selectedTeam === team &&
                                        "bg-primary/10 text-primary font-medium"
                                    )}
                                  >
                                    {team}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Member Dropdown - Searchable */}
                      <div className="relative" data-member-dropdown>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMemberDropdownOpen(!isMemberDropdownOpen);
                            setIsTeamDropdownOpen(false);
                            setMemberSearchTerm("");
                          }}
                          className="flex justify-between items-center px-3 py-2 w-full text-sm rounded border border-input bg-background text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          aria-label="Select workspace member"
                        >
                          <span className="truncate">
                            {selectedMember === "all_members"
                              ? "All Members"
                              : teamMembers.find(m => m.id === selectedMember)
                                  ?.name || "All Members"}
                          </span>
                          <ChevronDown
                            className={cn(
                              "w-4 h-4 transition-transform flex-shrink-0",
                              isMemberDropdownOpen && "rotate-180"
                            )}
                          />
                        </button>
                        {isMemberDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg border-border max-h-60 overflow-hidden">
                            <div className="p-2 border-b border-border">
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 w-3 h-3 transform -translate-y-1/2 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Search members..."
                                  value={memberSearchTerm}
                                  onChange={e =>
                                    setMemberSearchTerm(e.target.value)
                                  }
                                  className="pl-7 h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedMember("all_members");
                                  setIsMemberDropdownOpen(false);
                                  setMemberSearchTerm("");
                                }}
                                className={cn(
                                  "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                                  selectedMember === "all_members" &&
                                    "bg-primary/10 text-primary font-medium"
                                )}
                              >
                                All Members
                              </button>
                              {teamMembers
                                .filter(
                                  member =>
                                    (selectedTeam === "all_teams" ||
                                      member.team === selectedTeam) &&
                                    (!memberSearchTerm ||
                                      member.name
                                        .toLowerCase()
                                        .includes(
                                          memberSearchTerm.toLowerCase()
                                        ) ||
                                      member.team
                                        ?.toLowerCase()
                                        .includes(
                                          memberSearchTerm.toLowerCase()
                                        ))
                                )
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map(member => (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedMember(member.id);
                                      setIsMemberDropdownOpen(false);
                                      setMemberSearchTerm("");
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                                      selectedMember === member.id &&
                                        "bg-primary/10 text-primary font-medium"
                                    )}
                                  >
                                    <div className="flex flex-col">
                                      <span className="truncate">
                                        {member.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {member.team ? `${member.team}` : ""}
                                        {member.connection_status ===
                                        "DISCONNECTED"
                                          ? " • Disconnected"
                                          : ""}
                                      </span>
                                    </div>
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </>
              )}

              {/* Conversation Categories */}
              <CardContent className="overflow-y-auto flex-1 px-4 py-4">
                <h3 className="mb-2 text-sm font-medium tracking-wider uppercase text-muted-foreground">
                  Conversations
                </h3>
                <div className="space-y-1">
                  {filterOptions.map(option => (
                    <Button
                      key={option.key}
                      variant={
                        selectedFilter === option.key ? "default" : "ghost"
                      }
                      size="sm"
                      onClick={() => setSelectedFilter(option.key)}
                      className="justify-between px-2 py-2 w-full h-auto"
                    >
                      <div className="flex gap-2 items-center">
                        <option.icon className="w-3 h-3" />
                        <span className="text-sm">{option.label}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {option.count}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
              {/* Sync Messages button at bottom of filter section */}
              <div className="px-4 pb-4">
                <Button
                  onClick={() => {
                    if (cooldownRemaining > 0) {
                      toast.error(`Please wait ${cooldownRemaining}s`);
                      return;
                    }
                    if (!isSyncing) {
                      void syncMessages();
                    }
                  }}
                  size="sm"
                  className="w-full"
                  disabled={isSyncing || cooldownRemaining > 0}
                >
                  {isSyncing ? (
                    <div className="flex gap-2 items-center">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Syncing...
                    </div>
                  ) : cooldownRemaining > 0 ? (
                    `Sync in ${cooldownRemaining}s`
                  ) : (
                    "Sync Messages"
                  )}
                </Button>
              </div>
            </Card>

            {/* Unified Empty State - Shows when no conversations at all */}
            {showUnifiedEmptyState && emptyStateContext && (
              <Card className="flex flex-col flex-1 rounded-none lg:rounded-r-2xl">
                <CardContent className="flex flex-1 items-center justify-center min-h-[500px]">
                  <EmptyInboxState
                    context={emptyStateContext}
                    onSyncMessages={() => {
                      if (cooldownRemaining > 0) {
                        toast.error(`Please wait ${cooldownRemaining}s`);
                        return;
                      }
                      if (!isSyncing) {
                        void syncMessages();
                      }
                    }}
                    onNavigateToIntegrations={() => router.push("/integration")}
                    onNavigateToCampaigns={() =>
                      router.push("/outreach/campaigns")
                    }
                    onClearFilter={() => setSelectedFilter("all")}
                    isSyncing={isSyncing}
                    cooldownRemaining={cooldownRemaining}
                    filterName={
                      filterOptions.find(f => f.key === selectedFilter)?.label
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Middle Panel - LinkedIn Conversations (only show when we have data) */}
            {!showUnifiedEmptyState && (
              <Card className="flex flex-col flex-shrink-0 w-full rounded-none border-r lg:w-100 border-border">
                <CardHeader className="pb-4">
                  {/* <div className="flex justify-between items-center mb-4">
                  <CardTitle className="text-xl font-bold">LinkedIn</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {filteredConversations.length} conversations
                  </Badge>
                </div> */}

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <Search className="absolute left-2 top-1/2 w-3 h-3 transform -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-7 pr-8 text-sm"
                      aria-label="Search conversations"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-2 top-1/2 w-4 h-4 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Filter Bar */}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-center">
                      <Filter className="w-3 h-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Filter
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {filterOptions.find(f => f.key === selectedFilter)?.label}
                    </span>
                  </div>
                </CardHeader>

                {/* Conversation List */}
                <CardContent
                  className="overflow-y-auto flex-1 p-0 max-h-96 scrollbar-hide lg:max-h-none"
                  role="list"
                  aria-label="Conversation list"
                  ref={conversationListRef}
                >
                  <div
                    style={{
                      height: `${conversationVirtualizer.getTotalSize()}px`,
                      width: "100%",
                      position: "relative",
                    }}
                  >
                    {conversationVirtualizer
                      .getVirtualItems()
                      .map(virtualItem => {
                        const conversation =
                          filteredConversations[virtualItem.index];
                        return (
                          <div
                            key={conversation.id}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: `${virtualItem.size}px`,
                              transform: `translateY(${virtualItem.start}px)`,
                            }}
                          >
                            <button
                              onClick={() =>
                                handleConversationSelect(conversation.id)
                              }
                              className={cn(
                                "w-full p-3 text-left border-b border-border transition-colors",
                                selectedConversation === conversation.id
                                  ? "bg-primary/10 border-r-2 border-primary"
                                  : "hover:bg-accent"
                              )}
                              role="button"
                              aria-label={`Conversation with ${conversation.name}`}
                              aria-pressed={
                                selectedConversation === conversation.id
                              }
                            >
                              <div className="flex gap-2 items-start">
                                <div className="relative">
                                  <Avatar className="w-8 h-8">
                                    {conversation.profilePicUrl ? (
                                      <AvatarImage
                                        src={conversation.profilePicUrl}
                                        alt={conversation.name}
                                        onError={e => {}}
                                      />
                                    ) : null}
                                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                      {conversation.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  {conversation.isOnline && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-background"></div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium truncate text-foreground">
                                      {conversation.name}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {conversation.time}
                                    </span>
                                  </div>
                                  <p className="mb-2 text-sm truncate text-muted-foreground">
                                    {conversation.lastMessage}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5">
                                      {conversation.isStarred && (
                                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                      )}
                                      <Zap className="w-3 h-3 text-primary" />
                                    </div>
                                    {conversation.unread && (
                                      <Badge className="flex justify-center items-center p-0 w-4 h-4 text-xs">
                                        1
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          </div>
                        );
                      })}
                  </div>

                  {/* Empty conversation list state - Filter empty only (full empty is handled by unified state) */}
                  {filteredConversations.length === 0 &&
                    !isLoadingMore &&
                    emptyStateContext === "filter-empty" && (
                      <EmptyInboxState
                        context="filter-empty"
                        onClearFilter={() => setSelectedFilter("all")}
                        filterName={
                          filterOptions.find(f => f.key === selectedFilter)
                            ?.label
                        }
                        className="py-8"
                      />
                    )}

                  {/* Infinite scroll loading indicator */}
                  {isLoadingMore && (
                    <div className="flex justify-center items-center p-4">
                      <div className="flex gap-2 items-center text-sm text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading more conversations...
                      </div>
                    </div>
                  )}

                  {/* Intersection Observer Sentinel */}
                  {hasMoreConversations && !isLoadingMore && (
                    <div
                      id="infinite-scroll-sentinel"
                      className="w-full h-1"
                      ref={el => {
                        if (el) {
                          const observer = new IntersectionObserver(
                            entries => {
                              entries.forEach(entry => {
                                if (
                                  entry.isIntersecting &&
                                  hasMoreConversations &&
                                  !isLoadingMore
                                ) {
                                  loadMoreConversations();
                                }
                              });
                            },
                            { threshold: 0.1 }
                          );
                          observer.observe(el);

                          // Cleanup observer when component unmounts
                          return () => observer.disconnect();
                        }
                      }}
                    />
                  )}

                  {/* Debug: Manual Load More Button (temporary) */}
                  {hasMoreConversations && !isLoadingMore && (
                    <div className="flex justify-center items-center p-2">
                      <button
                        onClick={() => {
                          //
                          loadMoreConversations();
                        }}
                        className="px-3 py-1 text-xs text-white rounded bg-white-500 hover:bg-wite-600"
                      >
                        Load More
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Right Panel - Active Chat (only show when we have data) */}
            {!showUnifiedEmptyState && (
              <Card className="flex flex-col flex-1 rounded-none">
                {selectedConversationData ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="pb-4">
                      {isLoadingMessages ? (
                        <div className="flex justify-between items-center">
                          <div className="flex gap-3 items-center">
                            <Skeleton className="w-8 h-8 rounded-full" />
                            <div className="space-y-1">
                              <Skeleton className="w-28 h-4" />
                              <Skeleton className="w-40 h-3" />
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                            <Skeleton className="w-8 h-8" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <div
                            className="flex gap-3 items-center cursor-pointer"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                          >
                            <Avatar className="w-8 h-8">
                              {selectedConversationData.profilePicUrl && (
                                <AvatarImage
                                  src={selectedConversationData.profilePicUrl}
                                  alt={selectedConversationData.name}
                                />
                              )}
                              <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                                {selectedConversationData.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-base font-semibold text-foreground">
                                {selectedConversationData.name}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {selectedConversationData.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              aria-label="Star conversation"
                            >
                              <Star className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              aria-label="Archive conversation"
                            >
                              <Folder className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              aria-label="Delete conversation"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardHeader>

                    {/* Messages - Scrollable Area with Fixed Height */}
                    <CardContent
                      className="overflow-y-auto flex-1 p-3 max-h-96 scrollbar-hide lg:max-h-none lg:p-4"
                      aria-label="Conversation messages"
                      aria-live="polite"
                      ref={messagesContainerRef as any}
                    >
                      {isLoadingMessages ? (
                        <div className="space-y-3">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                            >
                              <div className="px-4 py-3 max-w-xs text-sm rounded-2xl shadow-sm lg:max-w-md bg-muted">
                                <div className="flex gap-2 items-center mb-2">
                                  {i % 2 === 0 && (
                                    <Skeleton className="w-5 h-5 rounded-full" />
                                  )}
                                  <Skeleton className="w-16 h-3" />
                                  <Skeleton className="w-12 h-3" />
                                </div>
                                <Skeleton className="mb-2 w-48 h-4" />
                                <Skeleton className="w-36 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            height: `${messageVirtualizer.getTotalSize()}px`,
                            width: "100%",
                            position: "relative",
                          }}
                        >
                          {messageVirtualizer
                            .getVirtualItems()
                            .map(virtualItem => {
                              const message =
                                displayedMessages[virtualItem.index];
                              const index = virtualItem.index;

                              // For oldest-first ordering, put the date separator ABOVE the first message of the day
                              const isFirst = index === 0;
                              const prevIsDifferentDay =
                                !isFirst &&
                                getMessageDateString(message.timestamp) !==
                                  getMessageDateString(
                                    displayedMessages[index - 1].timestamp
                                  );
                              const showDateSeparatorBefore =
                                isFirst || prevIsDifferentDay;

                              return (
                                <div
                                  key={message.id}
                                  data-index={virtualItem.index}
                                  ref={messageVirtualizer.measureElement}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    transform: `translateY(${virtualItem.start}px)`,
                                    paddingBottom: "12px",
                                  }}
                                >
                                  {/* Date Separator (rendered above first message of each day) */}
                                  {showDateSeparatorBefore && (
                                    <div className="flex gap-3 items-center my-4">
                                      <div className="flex-1 h-px bg-border"></div>
                                      <span className="px-2 text-xs font-semibold uppercase text-muted-foreground">
                                        {formatDateSeparator(message.timestamp)}
                                      </span>
                                      <div className="flex-1 h-px bg-border"></div>
                                    </div>
                                  )}

                                  {/* Message */}
                                  <div
                                    className={`flex ${message.isFromCurrentUser ? "justify-end" : "justify-start"}`}
                                  >
                                    <div className="px-4 py-3 max-w-xs text-sm rounded-2xl shadow-sm lg:max-w-md bg-muted text-foreground">
                                      <div className="flex gap-2 items-center mb-2">
                                        {!message.isFromCurrentUser && (
                                          <Avatar className="w-5 h-5">
                                            {message.profilePicUrl && (
                                              <AvatarImage
                                                src={message.profilePicUrl}
                                                alt={message.sender}
                                              />
                                            )}
                                            <AvatarFallback className="text-xs font-medium">
                                              {message.avatar}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                        <span className="text-xs font-semibold text-foreground">
                                          {message.sender}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          {message.time}
                                          {message.status === "sending" && (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          )}
                                        </span>
                                      </div>
                                      {/* Voice Message */}
                                      {message.isVoiceMessage &&
                                      message.voiceUrl ? (
                                        <VoicePlayer
                                          audioUrl={message.voiceUrl}
                                        />
                                      ) : (
                                        <p className="leading-relaxed text-foreground">
                                          {message.message}
                                        </p>
                                      )}

                                      {/* Display Attachments */}
                                      {message.attachments &&
                                        message.attachments.length > 0 && (
                                          <div className="mt-2 space-y-2">
                                            {message.attachments.map(
                                              (
                                                attachment: any,
                                                index: number
                                              ) => (
                                                <div
                                                  key={index}
                                                  className="max-w-xs"
                                                >
                                                  {attachment.mediaType?.startsWith(
                                                    "image/"
                                                  ) ? (
                                                    <img
                                                      src={attachment.reference}
                                                      alt={
                                                        attachment.name ||
                                                        "Attachment"
                                                      }
                                                      className="max-w-full h-auto rounded-lg transition-opacity cursor-pointer hover:opacity-90"
                                                      onClick={() =>
                                                        window.open(
                                                          attachment.reference,
                                                          "_blank"
                                                        )
                                                      }
                                                    />
                                                  ) : attachment.mediaType?.startsWith(
                                                      "audio/"
                                                    ) ? (
                                                    /* Audio attachment - use VoicePlayer */
                                                    <VoicePlayer
                                                      audioUrl={
                                                        attachment.reference
                                                      }
                                                    />
                                                  ) : (
                                                    <div className="flex gap-2 items-center p-2 rounded-lg border bg-background text-foreground border-border">
                                                      <Paperclip className="w-4 h-4" />
                                                      <span className="text-xs truncate">
                                                        {attachment.name}
                                                      </span>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-0 w-6 h-6"
                                                        onClick={() =>
                                                          window.open(
                                                            attachment.reference,
                                                            "_blank"
                                                          )
                                                        }
                                                      >
                                                        <Download className="w-3 h-3" />
                                                      </Button>
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}

                                      {/* Display Reactions */}
                                      {message.reactions &&
                                        message.reactions.length > 0 && (
                                          <div className="flex gap-1 mt-2">
                                            {message.reactions.map(
                                              (
                                                reaction: any,
                                                index: number
                                              ) => (
                                                <span
                                                  key={index}
                                                  className="px-2 py-1 text-xs rounded-full border bg-background border-border"
                                                >
                                                  {reaction.emoji}{" "}
                                                  {reaction.count > 1 &&
                                                    reaction.count}
                                                </span>
                                              )
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </CardContent>

                    {/* Message Input - Always Visible at Bottom */}
                    <CardContent className="flex-shrink-0 p-3 border-t border-border lg:p-4">
                      <div className="flex gap-2 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          aria-label="Attach file"
                          onClick={() => {
                            // Handle file attachment - support all media types
                            const input = document.createElement("input");
                            input.type = "file";
                            input.multiple = true;
                            // Accept all common file types
                            input.accept = [
                              "image/*",
                              "video/*",
                              "audio/*",
                              "application/pdf",
                              "application/msword",
                              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                              "application/vnd.ms-excel",
                              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                              "text/plain",
                              "text/csv",
                              "application/json",
                              "application/zip",
                              "application/x-rar-compressed",
                              "application/x-7z-compressed",
                            ].join(",");

                            input.onchange = e => {
                              const files = (e.target as HTMLInputElement)
                                .files;
                              if (!files || files.length === 0) return;

                              const fileArray = Array.from(files);
                              const errors: string[] = [];

                              // Check max file count
                              if (
                                attachments.length + fileArray.length >
                                MAX_FILES
                              ) {
                                errors.push(
                                  `Maximum ${MAX_FILES} files allowed per message`
                                );
                                setAttachmentErrors(errors);
                                return;
                              }

                              // Calculate total size
                              const currentTotalSize = attachments.reduce(
                                (sum, att) => sum + att.size,
                                0
                              );
                              let newTotalSize = currentTotalSize;

                              const validFiles: File[] = [];

                              for (const file of fileArray) {
                                // Check individual file size
                                if (file.size > MAX_FILE_SIZE) {
                                  errors.push(
                                    `"${file.name}" exceeds ${formatFileSize(MAX_FILE_SIZE)} limit`
                                  );
                                  continue;
                                }

                                // Check total size
                                if (newTotalSize + file.size > MAX_TOTAL_SIZE) {
                                  errors.push(
                                    `Total size would exceed ${formatFileSize(MAX_TOTAL_SIZE)} limit`
                                  );
                                  break;
                                }

                                // Check file type
                                const allowedTypes = [
                                  "image/gif",
                                  "image/jpeg",
                                  "image/jpg",
                                  "image/png",
                                  "image/webp",
                                  "image/svg+xml",
                                  "image/bmp",
                                  "video/mp4",
                                  "video/mpeg",
                                  "video/quicktime",
                                  "video/x-msvideo",
                                  "video/webm",
                                  "audio/mpeg",
                                  "audio/mp3",
                                  "audio/wav",
                                  "audio/ogg",
                                  "audio/webm",
                                  "audio/aac",
                                  "application/pdf",
                                  "application/msword",
                                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                                  "application/vnd.ms-excel",
                                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                                  "application/vnd.ms-powerpoint",
                                  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                                  "text/plain",
                                  "text/csv",
                                  "application/json",
                                  "application/zip",
                                  "application/x-rar-compressed",
                                  "application/x-7z-compressed",
                                ];

                                if (
                                  file.type &&
                                  !allowedTypes.includes(
                                    file.type.toLowerCase()
                                  )
                                ) {
                                  errors.push(
                                    `"${file.name}" has an unsupported file type`
                                  );
                                  continue;
                                }

                                newTotalSize += file.size;
                                validFiles.push(file);
                              }

                              if (errors.length > 0) {
                                setAttachmentErrors(errors);
                                // Clear errors after 5 seconds
                                setTimeout(() => setAttachmentErrors([]), 5000);
                              }

                              if (validFiles.length === 0) return;

                              // Process valid files
                              validFiles.forEach(file => {
                                const reader = new FileReader();
                                reader.onload = e => {
                                  const attachment = {
                                    name: file.name,
                                    type:
                                      file.type || "application/octet-stream",
                                    size: file.size,
                                    data: e.target?.result,
                                    file: file,
                                  };
                                  setAttachments(prev => [...prev, attachment]);
                                };
                                reader.onerror = () => {
                                  const newErrors = [
                                    `Failed to read file "${file.name}"`,
                                  ];
                                  setAttachmentErrors(newErrors);
                                  setTimeout(
                                    () => setAttachmentErrors([]),
                                    5000
                                  );
                                };
                                reader.readAsDataURL(file);
                              });
                            };

                            input.click();
                          }}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <div className="relative flex-1">
                          <Textarea
                            rows={1}
                            placeholder="Type your message..."
                            className="pr-8 text-sm rounded-lg w-full resize-none overflow-y-auto min-h-[40px] max-h-[144px]"
                            aria-label="Type your message"
                            value={newMessage}
                            onChange={e => handleTyping(e.target.value)}
                            onInput={e => {
                              const el = e.currentTarget;
                              el.style.height = "auto";
                              // Calculate height for 6 rows (24px per row)
                              const maxHeight = 24 * 6;
                              el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
                            }}
                            onKeyDown={handleKeyPress}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-6 w-6"
                            aria-label="Add emoji"
                          >
                            <Smile className="w-3 h-3" />
                          </Button>
                        </div>
                        {/* Mic button for voice recording */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 rounded-full hover:bg-red-100 hover:text-red-600"
                          aria-label="Record voice message"
                          onClick={() => setIsRecordingVoice(true)}
                          disabled={isUploading || isSendingVoice}
                        >
                          <Mic className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          className="w-8 h-8 rounded-full"
                          aria-label="Send message"
                          onClick={handleSendMessage}
                          disabled={
                            (!newMessage.trim() && attachments.length === 0) ||
                            isUploading
                          }
                        >
                          {isUploading ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {/* Voice Recorder */}
                      {isRecordingVoice && (
                        <div className="mt-2">
                          <VoiceRecorder
                            onSend={handleSendVoiceMessage}
                            onCancel={() => setIsRecordingVoice(false)}
                          />
                        </div>
                      )}

                      {/* Attachment errors */}
                      {attachmentErrors.length > 0 && (
                        <div className="p-3 mt-2 rounded-lg border bg-destructive/10 border-destructive/20">
                          <div className="flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="mb-1 text-xs font-medium text-destructive">
                                File upload errors:
                              </p>
                              <ul className="text-xs text-destructive/90 space-y-0.5 list-disc list-inside">
                                {attachmentErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-5 h-5 hover:bg-destructive/20"
                              onClick={() => setAttachmentErrors([])}
                              aria-label="Close errors"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Attachments display */}
                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>
                              • Max {MAX_FILES} files • Max{" "}
                              {formatFileSize(MAX_FILE_SIZE)} per file • Max{" "}
                              {formatFileSize(MAX_TOTAL_SIZE)} total
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex gap-2 items-center px-3 py-2 max-w-xs text-xs rounded-lg border transition-colors bg-muted border-border hover:bg-muted/80"
                              >
                                {getFileIcon(attachment.type, attachment.name)}
                                <span
                                  className="flex-1 truncate"
                                  title={attachment.name}
                                >
                                  {attachment.name}
                                </span>
                                <span className="text-xs whitespace-nowrap text-muted-foreground">
                                  {formatFileSize(attachment.size)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="flex-shrink-0 w-5 h-5 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => {
                                    setAttachments(prev =>
                                      prev.filter((_, i) => i !== index)
                                    );
                                  }}
                                  aria-label={`Remove ${attachment.name}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Typing...
                        </div>
                      )}

                      {/* Upload indicator */}
                      {isUploading && (
                        <div className="flex gap-2 items-center mt-1 text-xs text-muted-foreground">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {attachments.length > 0
                            ? "Uploading files..."
                            : "Sending message..."}
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="flex flex-1 justify-center items-center">
                    {/* Select a conversation prompt - shown when conversations exist but none selected */}
                    <div className="text-center">
                      <div className="mx-auto w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                        <MessageCircle className="w-7 h-7 text-muted-foreground" />
                      </div>
                      <h3 className="mb-2 text-base font-medium text-foreground">
                        Select a conversation
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Right Sidebar - Contact Information */}
            {!showUnifiedEmptyState && selectedConversationData && (
              <Card className="flex relative flex-col flex-shrink-0 w-full rounded-none border-l lg:w-110 border-border">
                {/* Profile Header */}
                <CardHeader className="pb-4">
                  {isLoadingLeadInfo ? (
                    <div className="flex gap-4 items-center">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="space-y-2 w-full max-w-[220px]">
                        <Skeleton className="w-40 h-5" />
                        <div className="flex gap-2">
                          <Skeleton className="w-16 h-7" />
                          <Skeleton className="w-20 h-7" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-center">
                      {/* Avatar */}
                      <Avatar className="w-12 h-12">
                        {(leadInformation?.profile_pic_url ||
                          selectedConversationData.profilePicUrl) && (
                          <AvatarImage
                            src={
                              leadInformation?.profile_pic_url ||
                              selectedConversationData.profilePicUrl
                            }
                            alt={
                              leadInformation?.name ||
                              selectedConversationData.name
                            }
                          />
                        )}
                        <AvatarFallback className="text-sm bg-primary text-primary-foreground">
                          {(
                            leadInformation?.name ||
                            selectedConversationData.name
                          )
                            ?.charAt(0)
                            ?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Name + Buttons */}
                      <div className="flex flex-col">
                        <h3 className="mb-2 text-base font-bold text-foreground">
                          {leadInformation?.name ||
                            selectedConversationData.name}
                        </h3>
                        {leadInformation?.headline && (
                          <p className="mb-2 text-sm text-muted-foreground">
                            {leadInformation.headline}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="px-3 h-7 text-sm"
                            onClick={handleAddTask}
                            disabled={isCreatingTask || !leadInformation}
                          >
                            {isCreatingTask ? (
                              <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                            ) : taskCreated ? (
                              <CheckCircle2 className="mr-1 w-3 h-3 text-green-600" />
                            ) : (
                              <Zap className="mr-1 w-3 h-3" />
                            )}
                            {isCreatingTask
                              ? "Adding..."
                              : taskCreated
                                ? "Added!"
                                : "Task"}
                          </Button>
                          {!contactExists && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3 h-7 text-sm"
                              onClick={() => {
                                handleAddLead();
                              }}
                              disabled={
                                isCreatingLead ||
                                !leadInformation ||
                                isCheckingContact
                              }
                            >
                              {isCreatingLead ? (
                                <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                              ) : leadCreated ? (
                                <CheckCircle2 className="mr-1 w-3 h-3 text-green-600" />
                              ) : isCheckingContact ? (
                                <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="mr-1 w-3 h-3" />
                              )}
                              {isCreatingLead
                                ? "Adding..."
                                : leadCreated
                                  ? "Added!"
                                  : isCheckingContact
                                    ? "Checking..."
                                    : "Add leads"}
                            </Button>
                          )}
                          {contactExists && (
                            <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Contact exists in CRM</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>

                {/* Tabs */}
                <div
                  className="flex-shrink-0 pr-16 border-b border-border"
                  role="tablist"
                  aria-label="Contact information tabs"
                >
                  <div className="flex overflow-x-auto gap-1 scrollbar-hide">
                    {[
                      {
                        key: "Informations",
                        label: "Informations",
                        icon: Info,
                      },
                      { key: "Activity", label: "Activity", icon: Activity },
                      {
                        key: `Tasks (${tasks.length})`,
                        label: `Tasks (${tasks.length})`,
                        icon: CheckSquare,
                      },
                      {
                        key: "Engagement",
                        label: "Engagement",
                        icon: BarChart3,
                      },
                      {
                        key: `Notes (${currentNotes.length})`,
                        label: `Notes (${currentNotes.length})`,
                        icon: StickyNote,
                      },
                    ].map(tab => (
                      <Button
                        key={tab.key}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                          "flex-shrink-0 px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium border-b-2 transition-colors whitespace-nowrap rounded-none flex items-center gap-2",
                          activeTab === tab.key
                            ? "border-primary text-primary dark:text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground dark:hover:text-foreground"
                        )}
                        role="tab"
                        aria-selected={activeTab === tab.key}
                        aria-controls={`tabpanel-${tab.key.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <tab.icon className="w-3 h-3" />
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                </div>
                {/* Tab Content */}
                <CardContent
                  className="overflow-y-auto flex-1 pr-16 scrollbar-hide"
                  role="tabpanel"
                  aria-label={`${activeTab} content`}
                >
                  {activeTab === "Informations" && (
                    <div className="space-y-3">
                      {isLoadingLeadInfo ? (
                        <div className="space-y-4">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                              <Skeleton className="w-24 h-4" />
                              <Skeleton className="w-full h-8" />
                            </div>
                          ))}
                        </div>
                      ) : leadInformation ? (
                        <>
                          {/* Connection Degree */}
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Relation
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {leadInformation.connection_degree || "N/A"}
                            </Badge>
                          </div>

                          {/* Lists */}
                          {/* <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Lists
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3 h-7 text-sm"
                            >
                              <List className="mr-1 w-3 h-3" />
                              Add to list
                            </Button>
                          </div> */}

                          {/* Tags */}
                          {/* <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Tags
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="px-3 h-7 text-sm"
                              onClick={() => setIsTagModalOpen(true)}
                            >
                              <Tag className="mr-1 w-3 h-3" />
                              Select tags
                            </Button>
                          </div> */}

                          {/* Lead Tags Display */}
                          {/* {leadInformation.tags &&
                            leadInformation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {leadInformation.tags.map(
                                  (tag: any, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="default"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  )
                                )}
                              </div>
                            )} */}

                          {/* Selected Tags Display */}
                          {/* {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedTags.map(tagId => {
                                const tag = availableTags.find(
                                  (t: any) => t.id === tagId
                                );
                                return tag ? (
                                  <Badge
                                    key={tag.id}
                                    variant="default"
                                    className="flex gap-1 items-center text-xs"
                                  >
                                    {tag.name}
                                    <X
                                      className="w-3 h-3 cursor-pointer hover:text-destructive"
                                      onClick={e => {
                                        e.stopPropagation();
                                        setSelectedTags(prev =>
                                          prev.filter(id => id !== tagId)
                                        );
                                      }}
                                    />
                                  </Badge>
                                ) : null;
                              })}
                            </div>
                          )} */}

                          {/* Owner */}
                          {/* <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Owner
                            </span>
                            <div className="flex gap-2 items-center px-2 py-1 rounded bg-muted">
                              <Avatar className="w-4 h-4 rounded-full" />
                              <span className="text-xs text-muted-foreground">
                                {user?.name || "Current User"}
                              </span>
                            </div>
                          </div> */}

                          {/* Value */}
                          {/* <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Value
                            </span>
                            <div className="flex relative items-center">
                              <span className="absolute left-3 text-sm text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                placeholder="0"
                                defaultValue="0"
                                className="pr-3 pl-7 w-32 h-8 text-sm"
                              />
                            </div>
                          </div> */}

                          {/* Email Section */}
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                EMAIL
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="email"
                                value={leadInformation.email || ""}
                                readOnly
                                className="flex-1 text-sm"
                                placeholder="No email available"
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                className="px-3 h-7 text-sm"
                                disabled={!leadInformation.email}
                              >
                                <RefreshCw className="mr-1 w-3 h-3" />
                                Enrich
                              </Button>
                            </div>
                          </div>

                          {/* Company Section */}
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <Building className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                COMPANY
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={leadInformation.company || ""}
                                readOnly
                                className="flex-1 text-sm"
                                placeholder="No company information"
                              />
                              {/* <Button
                                variant="secondary"
                                size="sm"
                                className="p-0 w-7 h-7"
                                disabled={!leadInformation.company}
                              >
                                <Plus className="w-3 h-3" />
                              </Button> */}
                            </div>
                          </div>

                          {/* Position/Role Section */}
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                POSITION
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <Input
                                type="text"
                                value={leadInformation.position || ""}
                                readOnly
                                className="flex-1 text-sm"
                                placeholder="No position information"
                              />
                            </div>
                          </div>

                          {/* Industry Section */}
                          {leadInformation.industry && (
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  INDUSTRY
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  value={leadInformation.industry}
                                  readOnly
                                  className="flex-1 text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {/* Location Section */}
                          {leadInformation.location && (
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <Building className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  LOCATION
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="text"
                                  value={leadInformation.location}
                                  readOnly
                                  className="flex-1 text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {/* Phone Section */}
                          {leadInformation.phone && (
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  PHONE
                                </span>
                              </div>
                              <div className="flex gap-2 items-center">
                                <Input
                                  type="tel"
                                  value={leadInformation.phone}
                                  readOnly
                                  className="flex-1 text-sm"
                                />
                              </div>
                            </div>
                          )}

                          {/* Skills Section */}
                          {leadInformation.skills &&
                            leadInformation.skills.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex gap-2 items-center">
                                  <Tag className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">
                                    SKILLS
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {leadInformation.skills.map(
                                    (skill: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {skill}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Languages Section */}
                          {leadInformation.languages &&
                            leadInformation.languages.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex gap-2 items-center">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium text-foreground">
                                    LANGUAGES
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {leadInformation.languages.map(
                                    (language: string, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {language}
                                      </Badge>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Note Section */}
                          {leadInformation.note && (
                            <div className="space-y-2">
                              <div className="flex gap-2 items-center">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  NOTE
                                </span>
                              </div>
                              <div className="p-2 text-sm rounded bg-muted text-foreground">
                                {leadInformation.note}
                              </div>
                            </div>
                          )}

                          {/* Connection Status */}
                          <div className="space-y-2">
                            <div className="flex gap-2 items-center">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                              <span className="text-sm font-medium text-foreground">
                                STATUS
                              </span>
                            </div>
                            <div className="flex gap-2 items-center">
                              <div
                                className={cn(
                                  "flex items-center gap-2 px-2 py-1 rounded",
                                  leadInformation.connected_on
                                    ? "bg-green-900/20 text-green-400"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    leadInformation.connected_on
                                      ? "bg-green-500"
                                      : "bg-muted-foreground"
                                  )}
                                ></div>
                                <span className="text-sm">
                                  {leadInformation.connected_on
                                    ? "Connected"
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col justify-center items-center py-8 text-center">
                          <Info className="mb-2 w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No lead information available
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "Activity" && (
                    <div className="space-y-3">
                      {isLoadingActivity ? (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className="flex gap-3 items-start p-3 rounded-lg border bg-muted/50 border-border"
                            >
                              <div className="flex-shrink-0">
                                <Skeleton className="w-8 h-8 rounded-full" />
                              </div>
                              <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex justify-between items-center">
                                  <Skeleton className="w-40 h-4" />
                                  <Skeleton className="w-20 h-3" />
                                </div>
                                <Skeleton className="w-3/4 h-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : leadActivity ? (
                        <div className="space-y-4">
                          {/* Activity Header */}
                          <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium text-foreground">
                              Recent Activity
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {Array.isArray(leadActivity)
                                ? leadActivity.length
                                : 0}{" "}
                              activities
                            </Badge>
                          </div>

                          {/* Activity List */}
                          {Array.isArray(leadActivity) &&
                          leadActivity.length > 0 ? (
                            <div className="space-y-3">
                              {leadActivity.map(
                                (activity: any, index: number) => {
                                  // Get appropriate icon based on description
                                  const getActivityIcon = (
                                    description: string
                                  ) => {
                                    const desc = description.toLowerCase();
                                    if (
                                      desc.includes("message") ||
                                      desc.includes("chat") ||
                                      desc.includes("reply")
                                    ) {
                                      return (
                                        <MessageCircle className="w-4 h-4 text-blue-500" />
                                      );
                                    } else if (
                                      desc.includes("email") ||
                                      desc.includes("sent") ||
                                      desc.includes("received")
                                    ) {
                                      return (
                                        <Mail className="w-4 h-4 text-green-500" />
                                      );
                                    } else if (
                                      desc.includes("call") ||
                                      desc.includes("phone") ||
                                      desc.includes("voice")
                                    ) {
                                      return (
                                        <User className="w-4 h-4 text-purple-500" />
                                      );
                                    } else if (
                                      desc.includes("meeting") ||
                                      desc.includes("schedule") ||
                                      desc.includes("appointment")
                                    ) {
                                      return (
                                        <Clock className="w-4 h-4 text-orange-500" />
                                      );
                                    } else if (
                                      desc.includes("task") ||
                                      desc.includes("todo") ||
                                      desc.includes("completed")
                                    ) {
                                      return (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      );
                                    } else if (
                                      desc.includes("note") ||
                                      desc.includes("comment") ||
                                      desc.includes("remark")
                                    ) {
                                      return (
                                        <StickyNote className="w-4 h-4 text-yellow-500" />
                                      );
                                    } else if (
                                      desc.includes("file") ||
                                      desc.includes("document") ||
                                      desc.includes("attachment")
                                    ) {
                                      return (
                                        <FileText className="w-4 h-4 text-gray-500" />
                                      );
                                    } else if (
                                      desc.includes("login") ||
                                      desc.includes("access") ||
                                      desc.includes("visit")
                                    ) {
                                      return (
                                        <Activity className="w-4 h-4 text-indigo-500" />
                                      );
                                    } else {
                                      return (
                                        <Activity className="w-4 h-4 text-primary" />
                                      );
                                    }
                                  };

                                  // Format date and time from created_at
                                  const formatDateTime = (
                                    createdAt: string | number
                                  ) => {
                                    try {
                                      let date;

                                      if (createdAt) {
                                        date = new Date(createdAt);
                                      } else {
                                        // If no created_at, use current time
                                        date = new Date();
                                      }

                                      // Check if date is valid
                                      if (isNaN(date.getTime())) {
                                        // If invalid date, use current time
                                        date = new Date();
                                      }

                                      // Always return formatted date and time in UTC to match API
                                      return date.toLocaleString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                        timeZone: "UTC",
                                      });
                                    } catch (error) {
                                      // Fallback to current time (UTC)
                                      return new Date().toLocaleString(
                                        "en-US",
                                        {
                                          month: "short",
                                          day: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                          timeZone: "UTC",
                                        }
                                      );
                                    }
                                  };

                                  // Debug log to see the activity data structure

                                  return (
                                    <div
                                      key={index}
                                      className="flex gap-3 items-start p-3 rounded-lg border bg-muted/50 border-border"
                                    >
                                      <div className="flex flex-shrink-0 justify-center items-center w-8 h-8 rounded-full bg-muted">
                                        {getActivityIcon(
                                          activity.description || ""
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                          <p className="pt-2 text-sm text-foreground">
                                            {activity.description || "Activity"}
                                          </p>
                                          <span className="text-xs text-muted-foreground">
                                            {formatDateTime(activity.createdAt)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col justify-center items-center py-8 text-center">
                              <Activity className="mb-2 w-8 h-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No activity data available
                              </p>
                            </div>
                          )}

                          {/* Activity Summary */}
                          {/* {leadActivity && typeof leadActivity === 'object' && !Array.isArray(leadActivity) && (
                            <div className="space-y-3">
                              {Object.entries(leadActivity).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex justify-between items-center">
                                  <span className="text-sm capitalize text-muted-foreground">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm font-medium text-foreground">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )} */}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center py-8 text-center">
                          <Activity className="mb-2 w-8 h-8 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            No activity data available
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "Engagement" && (
                    <div className="flex flex-col justify-center items-center py-12 text-center">
                      <BarChart3 className="mb-4 w-12 h-12 text-muted-foreground" />
                      <h3 className="mb-2 text-lg font-semibold text-foreground">
                        Coming Soon
                      </h3>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        Engagement metrics will be available soon. Stay tuned!
                      </p>
                    </div>
                  )}

                  {activeTab.startsWith("Tasks") && (
                    <div className="space-y-4">
                      {/* Task Header */}
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-foreground">
                          Tasks
                        </h3>
                        <div className="flex gap-2 items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-3 h-8 text-sm"
                            disabled={!contactExists}
                          >
                            <Filter className="mr-1 w-3 h-3" />
                            Filter
                          </Button>
                          <Button
                            size="sm"
                            className="px-3 h-8 text-sm"
                            onClick={() => setShowTaskForm(true)}
                            disabled={!contactExists}
                            title={
                              !contactExists
                                ? "Contact must exist in CRM to add tasks"
                                : "Add a new task"
                            }
                          >
                            <Plus className="mr-1 w-3 h-3" />
                            Add Task
                          </Button>
                        </div>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 w-4 h-4 transform -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder={
                            contactExists
                              ? "Search tasks..."
                              : "Contact must exist in CRM to view tasks"
                          }
                          value={taskSearchTerm}
                          onChange={e => setTaskSearchTerm(e.target.value)}
                          className="pl-10 h-9"
                          disabled={!contactExists}
                        />
                      </div>

                      {/* Task Form */}
                      {showTaskForm && (
                        <Card className="border border-border">
                          <CardContent className="p-4">
                            <form
                              onSubmit={handleTaskFormSubmit}
                              className="space-y-4"
                            >
                              {/* Title Field */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  Title *
                                </label>
                                <Input
                                  placeholder="Enter task title"
                                  value={taskFormData.title}
                                  onChange={e =>
                                    setTaskFormData(prev => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  className="h-9"
                                  required
                                />
                              </div>

                              {/* Description Field */}
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  Description
                                </label>
                                <Textarea
                                  placeholder="Enter task description"
                                  value={taskFormData.description}
                                  onChange={e =>
                                    setTaskFormData(prev => ({
                                      ...prev,
                                      description: e.target.value,
                                    }))
                                  }
                                  className="min-h-[80px] resize-none"
                                />
                              </div>

                              {/* Priority and Due Date Row */}
                              <div className="grid grid-cols-2 gap-4">
                                {/* Priority Field */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">
                                    Priority
                                  </label>
                                  <Select
                                    value={taskFormData.priority}
                                    onValueChange={value =>
                                      setTaskFormData(prev => ({
                                        ...prev,
                                        priority: value,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="LOW">Low</SelectItem>
                                      <SelectItem value="MEDIUM">
                                        Medium
                                      </SelectItem>
                                      <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Due Date Field */}
                                <div className="space-y-2">
                                  <label className="text-sm font-medium text-foreground">
                                    Due Date
                                  </label>
                                  <Input
                                    type="date"
                                    value={taskFormData.dueDate}
                                    onChange={e =>
                                      setTaskFormData(prev => ({
                                        ...prev,
                                        dueDate: e.target.value,
                                      }))
                                    }
                                    className="h-9"
                                  />
                                </div>
                              </div>

                              {/* Automated Task Checkbox */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="automated"
                                  checked={taskFormData.isAutomated}
                                  onChange={e =>
                                    setTaskFormData(prev => ({
                                      ...prev,
                                      isAutomated: e.target.checked,
                                    }))
                                  }
                                  className="rounded border-border"
                                />
                                <label
                                  htmlFor="automated"
                                  className="flex gap-2 items-center text-sm font-medium text-foreground"
                                >
                                  <Zap className="w-3 h-3" />
                                  Automated Task
                                </label>
                              </div>

                              {/* Form Actions */}
                              <div className="flex gap-2 items-center pt-2">
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={isCreatingTask}
                                  className="px-4 h-9"
                                >
                                  {isCreatingTask ? (
                                    <Loader2 className="mr-1 w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-1 w-3 h-3" />
                                  )}
                                  {isCreatingTask
                                    ? "Creating..."
                                    : "Create Task"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setShowTaskForm(false)}
                                  className="px-4 h-9"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      {/* Task List */}
                      {isLoadingTasks ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg border bg-muted/50 border-border"
                            >
                              <div className="flex gap-3 items-start">
                                <Skeleton className="mt-1 w-4 h-4 rounded" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="w-3/4 h-4" />
                                  <Skeleton className="w-1/2 h-3" />
                                </div>
                                <Skeleton className="w-16 h-6 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : taskList.length > 0 ? (
                        <div className="space-y-3">
                          {taskList
                            .filter(
                              task =>
                                taskSearchTerm === "" ||
                                task.title
                                  ?.toLowerCase()
                                  .includes(taskSearchTerm.toLowerCase()) ||
                                task.description
                                  ?.toLowerCase()
                                  .includes(taskSearchTerm.toLowerCase())
                            )
                            .map((task, index) => (
                              <div
                                key={task.id || index}
                                className="p-3 rounded-lg border bg-muted/50 border-border"
                              >
                                <div className="flex gap-3 items-start">
                                  <input
                                    type="checkbox"
                                    className="mt-1 rounded border-border"
                                    checked={task.status === "COMPLETED"}
                                    readOnly
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="mb-1 text-sm font-medium text-foreground">
                                      {task.title}
                                    </h4>
                                    {task.description && (
                                      <p className="mb-2 text-xs text-muted-foreground line-clamp-2">
                                        {task.description}
                                      </p>
                                    )}
                                    <div className="flex gap-2 items-center text-xs text-muted-foreground">
                                      <Badge
                                        variant={
                                          task.priority === "HIGH"
                                            ? "destructive"
                                            : task.priority === "MEDIUM"
                                              ? "default"
                                              : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {task.priority}
                                      </Badge>
                                      {task.dueDate && (
                                        <span className="flex gap-1 items-center">
                                          <Calendar className="w-3 h-3" />
                                          {new Date(
                                            task.dueDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                      {task.isAutomated && (
                                        <span className="flex gap-1 items-center">
                                          <Zap className="w-3 h-3" />
                                          Automated
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    variant={
                                      task.status === "COMPLETED"
                                        ? "default"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {task.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center py-12 text-center">
                          <div className="flex justify-center items-center mb-4 w-16 h-16 rounded-lg bg-muted">
                            {contactExists ? (
                              <CheckSquare2 className="w-8 h-8 text-muted-foreground" />
                            ) : (
                              <AlertCircle className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <h3 className="mb-2 text-lg font-semibold text-foreground">
                            {contactExists
                              ? "No tasks yet"
                              : "Contact not found in CRM"}
                          </h3>
                          <p className="mb-4 text-sm text-muted-foreground">
                            {contactExists
                              ? "Create your first task to get started"
                              : "This contact must exist in your CRM to view and manage tasks"}
                          </p>
                          {contactExists ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowTaskForm(true)}
                              className="px-3 h-8 text-sm"
                            >
                              <Plus className="mr-1 w-3 h-3" />
                              Add first task
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActiveTab("Informations")}
                              className="px-3 h-8 text-sm"
                            >
                              <User className="mr-1 w-3 h-3" />
                              Add to CRM first
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab.startsWith("Notes") && (
                    <div className="space-y-4">
                      {/* Notes Header */}
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search notes..."
                              value={notesSearchTerm}
                              onChange={e => setNotesSearchTerm(e.target.value)}
                              className="pl-10 h-9"
                            />
                          </div>
                          <Button
                            size="sm"
                            className="px-3 h-9 text-sm"
                            onClick={() => {
                              setNoteForm({
                                id: undefined,
                                title: "",
                                content: "",
                              });
                              setIsCreatingNote(true);
                            }}
                          >
                            <Plus className="mr-1 w-3 h-3" />
                            New Note
                          </Button>
                        </div>
                      </div>

                      {/* Create/Edit Note Form */}
                      {isCreatingNote && (
                        <Card className="border border-border">
                          <CardContent className="p-4 space-y-3">
                            <Input
                              placeholder="Title (optional)"
                              value={noteForm.title}
                              onChange={e =>
                                setNoteForm(prev => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                              className="h-9"
                            />
                            <Textarea
                              placeholder="Write your note..."
                              value={noteForm.content}
                              onChange={e =>
                                setNoteForm(prev => ({
                                  ...prev,
                                  content: e.target.value,
                                }))
                              }
                              className="min-h-[120px] resize-none"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={!noteForm.content.trim()}
                                onClick={async () => {
                                  const token =
                                    localStorage.getItem("crm_access_token");
                                  if (
                                    !token ||
                                    !selectedWorkspace ||
                                    !selectedOrganization
                                  )
                                    return;
                                  // Creating notes requires exactly one of contactId/companyId/dealId
                                  if (!noteForm.id && !contactId) {
                                    return;
                                  }
                                  try {
                                    const params = {
                                      workspaceId: selectedWorkspace.id,
                                      organizationId: selectedOrganization.id,
                                    } as const;
                                    if (noteForm.id) {
                                      await notesService.updateNote(
                                        noteForm.id,
                                        {
                                          title: noteForm.title || undefined,
                                          content: noteForm.content,
                                        },
                                        params,
                                        token
                                      );
                                    } else {
                                      await notesService.createNote(
                                        {
                                          title: noteForm.title || undefined,
                                          content: noteForm.content,
                                          contactId: contactId || undefined,
                                        },
                                        params,
                                        token
                                      );
                                    }
                                    setIsCreatingNote(false);
                                    setNoteForm({
                                      id: undefined,
                                      title: "",
                                      content: "",
                                    });
                                    await fetchNotes();
                                  } catch (e) {}
                                }}
                              >
                                {noteForm.id ? "Update" : "Save"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setIsCreatingNote(false);
                                  setNoteForm({
                                    id: undefined,
                                    title: "",
                                    content: "",
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Notes List */}
                      {isLoadingNotes ? (
                        <div className="space-y-3">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg border bg-muted/50 border-border"
                            >
                              <div className="space-y-2">
                                <Skeleton className="w-1/3 h-4" />
                                <Skeleton className="w-2/3 h-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {notesList
                            .filter(
                              n =>
                                notesSearchTerm === "" ||
                                (n.title || "")
                                  .toLowerCase()
                                  .includes(notesSearchTerm.toLowerCase()) ||
                                (n.content || "")
                                  .toLowerCase()
                                  .includes(notesSearchTerm.toLowerCase())
                            )
                            .map(note => (
                              <div
                                key={note.id}
                                className="p-3 rounded-lg border bg-muted/30 border-border"
                              >
                                <div className="flex gap-2 justify-between items-start">
                                  <div className="min-w-0">
                                    {note.title && (
                                      <h4 className="mb-1 text-sm font-medium truncate text-foreground">
                                        {note.title}
                                      </h4>
                                    )}
                                    <p className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
                                      {note.content}
                                    </p>
                                    <div className="mt-2 text-[11px] text-muted-foreground">
                                      {new Date(
                                        note.updatedAt || note.createdAt
                                      ).toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-7 h-7"
                                      onClick={() => {
                                        setNoteForm({
                                          id: note.id,
                                          title: note.title || "",
                                          content: note.content || "",
                                        });
                                        setIsCreatingNote(true);
                                      }}
                                    >
                                      <FileText className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-7 h-7"
                                      onClick={async () => {
                                        const token =
                                          localStorage.getItem(
                                            "crm_access_token"
                                          );
                                        if (
                                          !token ||
                                          !selectedWorkspace ||
                                          !selectedOrganization
                                        )
                                          return;
                                        try {
                                          const params = {
                                            workspaceId: selectedWorkspace.id,
                                            organizationId:
                                              selectedOrganization.id,
                                          } as const;
                                          await notesService.deleteNote(
                                            note.id,
                                            params,
                                            token
                                          );
                                          await fetchNotes();
                                        } catch (e) {}
                                      }}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          {notesList.length === 0 && (
                            <div className="flex flex-col justify-center items-center py-8 text-center">
                              <StickyNote className="mb-2 w-8 h-8 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground">
                                No notes yet
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                {/* Right Navigation Icons - Inside Contact Information Panel */}
                <div className="flex absolute top-0 right-0 flex-col gap-1 p-2 h-full border-l bg-background border-border">
                  <button
                    onClick={() => setActiveTab("Informations")}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out ${
                      activeTab === "Informations"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 hover:shadow-md"
                    }`}
                    title="Informations"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("Activity")}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out ${
                      activeTab === "Activity"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 hover:shadow-md"
                    }`}
                    title="Activity"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab(`Tasks (${tasks.length})`)}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out ${
                      activeTab === `Tasks (${tasks.length})`
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 hover:shadow-md"
                    }`}
                    title="Tasks"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab("Engagement")}
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out ${
                      activeTab === "Engagement"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 hover:shadow-md"
                    }`}
                    title="Engagement"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      setActiveTab(`Notes (${currentNotes.length})`)
                    }
                    className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-200 ease-in-out ${
                      activeTab === `Notes (${currentNotes.length})`
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent hover:scale-110 hover:shadow-md"
                    }`}
                    title="Notes"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </AppLayout>

      {/* Tags Selection Modal */}
      <Dialog
        open={isTagModalOpen}
        onOpenChange={open => {
          setIsTagModalOpen(open);
          if (!open) {
            setTagSearchTerm(""); // Reset search when closing
          }
        }}
      >
        <DialogContent className="max-w-[200px] p-0 gap-0 rounded-md">
          <DialogHeader className="px-3 py-2.5">
            <DialogTitle className="text-sm font-medium text-foreground">
              Add Tags
            </DialogTitle>
          </DialogHeader>

          {/* Search Bar */}
          <div className="p-2.5">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={tagSearchTerm}
                onChange={e => setTagSearchTerm(e.target.value)}
                className="pr-2 pl-7 h-7 text-xs rounded-sm border-border"
              />
            </div>
          </div>

          {/* Tags List */}
          <div className="max-h-[240px] overflow-y-auto">
            {availableTags.length > 0 ? (
              availableTags
                .filter((tag: any) =>
                  tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
                )
                .map((tag: any) => (
                  <div
                    key={tag.id}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors hover:bg-accent/50",
                      selectedTags.includes(tag.id) && "bg-accent/30"
                    )}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tag.id)
                          ? prev.filter(id => id !== tag.id)
                          : [...prev, tag.id]
                      );
                    }}
                  >
                    <Tag className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="flex-1 text-xs leading-none text-foreground">
                      {tag.name}
                    </span>
                    {selectedTags.includes(tag.id) && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                ))
            ) : tagSearchTerm ? (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">No tags found</p>
              </div>
            ) : (
              <div className="px-3 py-6 text-center">
                <Tag className="w-5 h-5 text-muted-foreground mx-auto mb-1.5" />
                <p className="text-xs text-muted-foreground">
                  No tags available
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InboxPage;

// Disable static generation to prevent useWorkspace context error during build
export const getServerSideProps = () => ({ props: {} });
