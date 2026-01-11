"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Send,
  X,
  Trash2,
  CheckCircle,
  XCircle,
  Minus,
  MessageSquare,
  Tag,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  Smile,
  Calendar as CalendarIcon,
  Star,
  Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { apiCall } from "@/lib/apiCall";
import dayjs from "dayjs";

interface Prospect {
  id: string;
  prospectName: string;
  email: string;
  company: string;
  campaign: string;
  campaignId: string;
  replySnippet: string;
  fullReply: string;
  sentiment: string;
  assignedMember: string;
  memberTeam: string;
  assignedMemberID: string;
  conversationurn: string;
  dateReceived: string;
  tags: string[];
  replyType: string;
}

interface ApiResponse {
  data: Prospect[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Metadata {
  campaigns: Array<{
    id: string;
    name: string;
    replyCount: number;
  }>;
  teams: Array<{
    id: string;
    name: string;
    replyCount: number;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    email: string;
    replyCount: number;
  }>;
  dateRanges: {
    today: number;
    yesterday: number;
    this_week: number;
    this_month: number;
    this_year: number;
  };
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  replyTypeDistribution: {
    initial_response: number;
    question: number;
    objection: number;
    follow_up: number;
  };
  totalReplies: number;
  unreadReplies: number;
  assignedToMe: number;
}

interface ReplyFilters {
  page?: number;
  limit?: number;
  order_by?: string;
  sort_type?: "asc" | "desc";
  search?: string;
  campaigns?: string[];
  teams?: string[];
  team_members?: string[];
  time_filter?: string;
  from_date?: string;
  to_date?: string;
  time_zone?: string;
}

const RepliesPage = () => {
  const [selectedCampaign, setSelectedCampaign] = useState("all_campaigns");
  const [selectedSentiment, setSelectedSentiment] = useState("all_sentiments");
  const [selectedTeam, setSelectedTeam] = useState("all_teams");
  const [selectedTeamMember, setSelectedTeamMember] = useState("all_members");
  const [selectedDateRange, setSelectedDateRange] = useState("All");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: new Date(),
  });
  const [customButtonClicked, setCustomButtonClicked] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  // const [selectedReply, setSelectedReply] = useState<string | null>(null)
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [replies, setReplies] = useState<Prospect[]>([]);
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [metadataCache, setMetadataCache] = useState<{
    data: Metadata | null;
    timestamp: number;
  }>({ data: null, timestamp: 0 });

  // Use refs to track component lifecycle for search handling
  const isInitialMountRef = useRef(true);
  const hasInitialLoadRef = useRef(false);

  // New messaging state
  const [showMessageSidebar, setShowMessageSidebar] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(
    null
  );
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      timestamp: Date;
      isFromUser: boolean;
      avatar: string;
    }>
  >([]);

  // Send message state (similar to inbox)
  const [attachments, setAttachments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

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
      return <Paperclip className="w-4 h-4 flex-shrink-0" />;
    }

    // Videos
    if (fileType.startsWith("video/")) {
      return <Paperclip className="w-4 h-4 flex-shrink-0" />;
    }

    // Audio
    if (fileType.startsWith("audio/")) {
      return <Paperclip className="w-4 h-4 flex-shrink-0" />;
    }

    // Documents
    if (
      fileType.includes("pdf") ||
      fileType.includes("document") ||
      fileType.includes("msword") ||
      fileType.includes("text") ||
      lowerFileName.match(/\.(pdf|doc|docx|txt)$/)
    ) {
      return <Paperclip className="w-4 h-4 flex-shrink-0" />;
    }

    // Default
    return <Paperclip className="w-4 h-4 flex-shrink-0" />;
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Metadata cache TTL: 5 minutes
  const METADATA_CACHE_TTL = 5 * 60 * 1000;

  // Load metadata with caching
  const loadMetadata = async (): Promise<Metadata | null> => {
    try {
      const now = Date.now();

      // Check cache
      if (
        metadataCache.data &&
        now - metadataCache.timestamp < METADATA_CACHE_TTL
      ) {
        return metadataCache.data;
      }

      setIsLoadingMetadata(true);

      const response = await fetch("/api/conversations/replies/getMetadata", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect handled by apiCall
          return null;
        }
        if (response.status === 403) {
          setError("You do not have permission to view replies");
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Metadata = await response.json();

      // Update cache
      setMetadataCache({ data, timestamp: now });
      setMetadata(data);

      return data;
    } catch (error) {
      console.error("Error loading metadata:", error);
      setError("Failed to load filter options. Please try again.");
      return null;
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Load paginated replies with filters
  const loadReplies = async (filters: ReplyFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query string
      const params = new URLSearchParams();
      params.set("page", String(filters.page || pagination.page || 1));
      params.set("limit", String(filters.limit || pagination.limit || 20));
      params.set("order_by", filters.order_by || "received_on");
      params.set("sort_type", filters.sort_type || "desc");

      // Add search parameter if provided
      if (filters.search && filters.search.trim().length > 0) {
        params.set("search", filters.search.trim());
      }

      if (filters.campaigns && filters.campaigns.length > 0) {
        params.set("campaigns", filters.campaigns.join(","));
      }

      if (filters.teams && filters.teams.length > 0) {
        params.set("teams", filters.teams.join(","));
      }

      if (filters.team_members && filters.team_members.length > 0) {
        params.set("team_members", filters.team_members.join(","));
      }

      if (filters.time_filter) {
        params.set("time_filter", filters.time_filter);

        if (filters.time_filter === "custom") {
          if (filters.from_date) params.set("from_date", filters.from_date);
          if (filters.to_date) params.set("to_date", filters.to_date);
          if (filters.time_zone) params.set("time_zone", filters.time_zone);
        }
      }

      const response = await fetch(
        `/api/conversations/replies/getPaginatedReplies?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized - redirect handled by apiCall
          return;
        }
        if (response.status === 403) {
          setError("You do not have permission to view replies");
          return;
        }
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data: ApiResponse = await response.json();

      setReplies(data.data || []);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
        hasNext: data.hasNext,
        hasPrev: data.hasPrev,
      });
    } catch (err) {
      console.error("Error loading replies:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching replies"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Convert date range to API format
  const getTimeFilter = (): {
    time_filter: string;
    from_date?: string;
    to_date?: string;
  } => {
    if (selectedDateRange === "All") {
      return { time_filter: "" };
    }

    if (selectedDateRange === "Custom") {
      if (customDateRange.from && customDateRange.to) {
        return {
          time_filter: "custom",
          from_date: customDateRange.from.toISOString().split("T")[0],
          to_date: customDateRange.to.toISOString().split("T")[0],
        };
      }
      return { time_filter: "" };
    }

    // Map UI date ranges to API format
    const dateRangeMap: Record<string, string> = {
      Today: "today",
      Yesterday: "yesterday",
      "This week": "this_week",
      "This month": "this_month",
      "This year": "this_year",
    };

    return {
      time_filter: dateRangeMap[selectedDateRange] || "",
    };
  };

  // Build filters object for API
  const buildFilters = (): ReplyFilters => {
    const timeFilter = getTimeFilter();
    const filters: ReplyFilters = {
      page: currentPage,
      limit: rowsPerPage,
      order_by: "received_on",
      sort_type: "desc",
    };

    // Search filter
    if (searchTerm && searchTerm.trim().length > 0) {
      filters.search = searchTerm.trim();
    }

    // Campaign filter
    if (selectedCampaign !== "all_campaigns" && metadata) {
      const campaign = metadata.campaigns.find(
        c => c.id === selectedCampaign || c.name === selectedCampaign
      );
      if (campaign) {
        filters.campaigns = [campaign.id];
      }
    }

    // Team filter
    if (selectedTeam !== "all_teams") {
      filters.teams = [selectedTeam];
    }

    // Team member filter
    if (selectedTeamMember !== "all_members") {
      filters.team_members = [selectedTeamMember];
    }

    // Date filter
    if (timeFilter.time_filter) {
      filters.time_filter = timeFilter.time_filter;
      if (timeFilter.from_date) filters.from_date = timeFilter.from_date;
      if (timeFilter.to_date) filters.to_date = timeFilter.to_date;
    }

    return filters;
  };

  // Handle Apply button - applies all filters and search
  const handleApplyFilters = () => {
    const appliedPage = 1;
    setCurrentPage(appliedPage); // Reset to page 1 when applying filters
    const filters = {
      ...buildFilters(),
      page: appliedPage,
    };
    hasInitialLoadRef.current = true;
    loadReplies(filters);
  };

  // Handle Enter key in search input - applies filters
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleApplyFilters();
    }
  };

  // Load metadata on mount
  useEffect(() => {
    loadMetadata();
  }, []);

  // Load initial data on mount
  useEffect(() => {
    // Only load if metadata is available (or if we're not using campaign filter)
    if (!metadata && selectedCampaign !== "all_campaigns") {
      return; // Wait for metadata to load
    }

    // Initial load on mount only
    if (isInitialMountRef.current) {
      hasInitialLoadRef.current = true;
      loadReplies(buildFilters());
      isInitialMountRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metadata]);

  // Load replies when pagination changes (page or rows per page)
  useEffect(() => {
    // Only reload if not initial mount and filters have been applied at least once
    if (!isInitialMountRef.current && hasInitialLoadRef.current) {
      loadReplies(buildFilters());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage]);

  // Get filter options from metadata
  const campaigns = metadata?.campaigns || [];
  const uniqueTeams = metadata?.teams || [];
  const teamMembers = metadata?.teamMembers || [];

  // Use replies directly from API (search is now server-side)
  const currentReplies = replies;

  // Get sentiment badge
  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Positive
          </Badge>
        );
      case "negative":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
          >
            <XCircle className="w-3 h-3 mr-1" />
            Negative
          </Badge>
        );
      case "neutral":
        return (
          <Badge
            variant="secondary"
            className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
          >
            <Minus className="w-3 h-3 mr-1" />
            Neutral
          </Badge>
        );
      default:
        return null;
    }
  };

  // Export functionality
  const handleExport = () => {};

  // Handle send message action
  const handleSendMessage = async (reply: Prospect) => {
    setSelectedProspect(reply);
    setShowMessageSidebar(true);

    try {
      // Debug: Log the data being sent

      // Fetch conversation data from the API
      const response = await fetch("/api/conversations/replies/getReplyChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationUrn: reply.conversationurn,
          campaign_id: reply.campaignId,
        }),
      });

      if (response.ok) {
        const conversationData = await response.json();

        // Transform the API response into message format
        // This will depend on the actual structure of the API response
        if (conversationData && conversationData.messages) {
          const transformedMessages = conversationData.messages.map(
            (msg: any, index: number) => ({
              id: (index + 1).toString(),
              text: msg.content || msg.text || msg.message,
              timestamp: new Date(msg.timestamp || msg.created_at || msg.date),
              isFromUser: msg.sender === "user" || msg.isFromUser || false,
              avatar:
                msg.sender === "user"
                  ? "RH"
                  : reply.prospectName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join(""),
            })
          );
          setMessages(transformedMessages);
        } else {
          // Fallback to sample messages if API response doesn't have expected structure
          setMessages([
            {
              id: "1",
              text: `Hi ${reply.prospectName}! Thanks for your reply about ${reply.campaign}. I'd love to discuss this further.`,
              timestamp: new Date(Date.now() - 86400000), // 1 day ago
              isFromUser: true,
              avatar: "RH",
            },
            {
              id: "2",
              text: reply.fullReply,
              timestamp: new Date(Date.now() - 43200000), // 12 hours ago
              isFromUser: false,
              avatar: reply.prospectName
                .split(" ")
                .map((n: string) => n[0])
                .join(""),
            },
          ]);
        }
      } else {
        // Fallback to sample messages on error
        setMessages([
          {
            id: "1",
            text: `Hi ${reply.prospectName}! Thanks for your reply about ${reply.campaign}. I'd love to discuss this further.`,
            timestamp: new Date(Date.now() - 86400000), // 1 day ago
            isFromUser: true,
            avatar: "RH",
          },
          {
            id: "2",
            text: reply.fullReply,
            timestamp: new Date(Date.now() - 43200000), // 12 hours ago
            isFromUser: false,
            avatar: reply.prospectName
              .split(" ")
              .map((n: string) => n[0])
              .join(""),
          },
        ]);
      }
    } catch (error) {
      // Fallback to sample messages on error
      setMessages([
        {
          id: "1",
          text: `Hi ${reply.prospectName}! Thanks for your reply about ${reply.campaign}. I'd love to discuss this further.`,
          timestamp: new Date(Date.now() - 86400000), // 1 day ago
          isFromUser: true,
          avatar: "RH",
        },
        {
          id: "2",
          text: reply.fullReply,
          timestamp: new Date(Date.now() - 43200000), // 12 hours ago
          isFromUser: false,
          avatar: reply.prospectName
            .split(" ")
            .map((n: string) => n[0])
            .join(""),
        },
      ]);
    }
  };

  // Send LinkedIn message API function (similar to inbox)
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

  // Handle sending new message with API integration
  const handleSendNewMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    if (!selectedProspect) return;

    const messageTextContent = messageText.trim();
    const currentAttachments = [...attachments];

    try {
      setMessageText("");
      setIsUploading(true);

      // Process attachments for upload
      const processedAttachments = currentAttachments.map(attachment => ({
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        data: attachment.data, // Base64 data for MinIO upload
      }));

      // Send message using LinkedIn API with processed attachments
      await sendLinkedInMessage(
        messageTextContent,
        selectedProspect.conversationurn,
        processedAttachments,
        selectedProspect.assignedMemberID // Use assignedMemberID as selectedUserId
      );

      // Add message to local state immediately for better UX
      const newMsg = {
        id: Date.now().toString(),
        text: messageTextContent,
        timestamp: new Date(),
        isFromUser: true,
        avatar: "RH",
      };
      setMessages(prev => [...prev, newMsg]);

      // Clear attachments
      setAttachments([]);
    } catch (error) {
      // Restore message and attachments on error
      setMessageText(messageTextContent);
      setAttachments(currentAttachments);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle typing indicator
  const handleTyping = (value: string) => {
    setMessageText(value);

    if (value.trim() && selectedProspect) {
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
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
      handleSendNewMessage();
    }
  };

  // Handle action menu actions
  const handleActionClick = (replyId: string, action: "exclude" | "delete") => {
    if (action === "exclude") {
    } else if (action === "delete") {
    }
    setOpenActionMenu(null);
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Close message sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".message-sidebar-container")) {
        setShowMessageSidebar(false);
      }
      if (!target.closest(".action-menu-container")) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (isLoading) {
    return (
      <AuthGuard>
        <AppLayout activePage="Conversations" className="!p-0">
          <div className="flex flex-col h-[83vh]">
            <div className="flex-1 flex bg-background overflow-hidden rounded-2xl border border-border shadow-sm">
              {/* Left Sidebar Skeleton */}
              <Card className="w-64 border-r border-border flex flex-col flex-shrink-0 rounded-none lg:rounded-l-2xl">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-12" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Main Content Skeleton */}
              <Card className="flex-1 flex flex-col rounded-none">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-3">
                  <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-3 p-3 border border-border rounded"
                      >
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                        <Skeleton className="h-5 w-12" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout activePage="Conversations" className="!p-0">
        <style>{scrollbarHideStyles}</style>
        <div className="flex flex-col h-[83vh]">
          <div className="flex-1 flex bg-background overflow-hidden rounded-2xl border border-border shadow-sm">
            {/* Left Sidebar - Filters */}
            <Card className="w-64 border-r border-border flex flex-col flex-shrink-0 rounded-none lg:rounded-l-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Filters</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Campaign Filter */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Campaign
                  </label>
                  <select
                    value={selectedCampaign}
                    onChange={e => setSelectedCampaign(e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all_campaigns">All Campaigns</option>
                    {isLoadingMetadata ? (
                      <option disabled>Loading...</option>
                    ) : (
                      campaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name} ({campaign.replyCount})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Sentiment Filter
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Sentiment</label>
                  <select
                    value={selectedSentiment}
                    onChange={(e) => setSelectedSentiment(e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all_sentiments">All Sentiments</option>
                    <option value="positive">Positive</option>
                    <option value="negative">Negative</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div> */}

                {/* Team Filter */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Team
                  </label>
                  <select
                    value={selectedTeam}
                    onChange={e => setSelectedTeam(e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all_teams">All Teams</option>
                    {isLoadingMetadata ? (
                      <option disabled>Loading...</option>
                    ) : (
                      uniqueTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.replyCount})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Team Member Filter */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Team Member
                  </label>
                  <select
                    value={selectedTeamMember}
                    onChange={e => setSelectedTeamMember(e.target.value)}
                    className="w-full px-2 py-1.5 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="all_members">All Members</option>
                    {isLoadingMetadata ? (
                      <option disabled>Loading...</option>
                    ) : (
                      teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.replyCount})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Date Range Filter */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Date Range
                  </label>
                  <Popover
                    open={isDateDropdownOpen}
                    onOpenChange={setIsDateDropdownOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-7 text-xs px-2"
                      >
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {selectedDateRange === "All" && "All Time"}
                        {selectedDateRange === "Today" && "Today"}
                        {selectedDateRange === "Yesterday" && "Yesterday"}
                        {selectedDateRange === "This week" && "This week"}
                        {selectedDateRange === "This month" && "This month"}
                        {selectedDateRange === "This year" && "This year"}
                        {selectedDateRange === "Custom" && (
                          <div className="flex items-center">
                            {customDateRange.from && customDateRange.to ? (
                              <span>
                                {dayjs(customDateRange.from).format("MMM DD")} -{" "}
                                {dayjs(customDateRange.to).format("MMM DD")}
                              </span>
                            ) : (
                              <span>Custom Range</span>
                            )}
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        {/* Predefined Date Options */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700">
                            Quick Select
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant={
                                selectedDateRange === "All"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("All");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              All Time
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "Today"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("Today");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              Today
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "Yesterday"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("Yesterday");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              Yesterday
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "This week"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("This week");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              This week
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "This month"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("This month");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              This month
                            </Button>
                            <Button
                              variant={
                                selectedDateRange === "This year"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => {
                                setSelectedDateRange("This year");
                                setCustomButtonClicked(false);
                                setIsDateDropdownOpen(false);
                              }}
                              className="justify-start h-6 text-xs"
                            >
                              This year
                            </Button>
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="border-t border-gray-200"></div>

                        {/* Custom Date Range Picker */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700">
                            Custom Range
                          </div>

                          <div className="space-y-2">
                            <Calendar
                              mode="range"
                              selected={{
                                from: customDateRange.from,
                                to: customDateRange.to,
                              }}
                              onSelect={range => {
                                if (range) {
                                  setCustomDateRange({
                                    from: range.from,
                                    to: range.to,
                                  });
                                  setCustomButtonClicked(false); // Reset apply button state when dates change
                                }
                              }}
                              numberOfMonths={1}
                              className="rounded-md border"
                            />

                            {/* Apply Button */}
                            {customDateRange.from &&
                              customDateRange.to &&
                              !customButtonClicked && (
                                <Button
                                  size="sm"
                                  className="w-full px-3 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg"
                                  onClick={() => {
                                    // Set selectedDateRange to Custom first
                                    setSelectedDateRange("Custom");
                                    setCustomButtonClicked(true);
                                    setIsDateDropdownOpen(false);
                                  }}
                                >
                                  Apply Custom Range
                                </Button>
                              )}
                          </div>

                          {/* No Selection Indicator */}
                          {(!customDateRange.from || !customDateRange.to) && (
                            <div className="p-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                              <div className="flex items-center space-x-1">
                                <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                                <CalendarIcon className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-600 font-medium">
                                  No date range selected
                                </span>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                Select from and to dates above
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Search
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground z-10" />
                    <Input
                      type="text"
                      placeholder="Search replies..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      className="pl-7 text-xs h-8"
                    />
                  </div>
                </div>

                {/* Apply Filters Button */}
                <Button
                  onClick={handleApplyFilters}
                  className="w-full h-7"
                  size="sm"
                  disabled={isLoading}
                >
                  <Filter className="w-3 h-3 mr-1" />
                  <span className="text-xs">Apply Filters</span>
                </Button>

                {/* Export Button */}
                <Button onClick={handleExport} className="w-full h-7" size="sm">
                  <Download className="w-3 h-3 mr-1" />
                  <span className="text-xs">Export</span>
                </Button>

                {/* Reset Filters Button */}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampaign("all_campaigns");
                    setSelectedSentiment("all_sentiments");
                    setSelectedTeam("all_teams");
                    setSelectedTeamMember("all_members");
                    setSelectedDateRange("All");
                    setCustomDateRange({
                      from: new Date(),
                      to: new Date(),
                    });
                    setCustomButtonClicked(false);
                    setIsDateDropdownOpen(false);
                    setSearchTerm("");
                    setCurrentPage(1);
                    hasInitialLoadRef.current = true;
                    // Load replies without filters
                    loadReplies({
                      page: 1,
                      limit: rowsPerPage,
                      order_by: "received_on",
                      sort_type: "desc",
                      search: undefined,
                    });
                  }}
                  className="w-full h-7"
                  size="sm"
                >
                  <X className="w-3 h-3 mr-1" />
                  <span className="text-xs">Reset</span>
                </Button>
              </CardContent>
            </Card>

            {/* Main Content Area */}
            <Card className="flex-1 flex flex-col rounded-none">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Replies</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {currentReplies.length} of {pagination.total} replies
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto scrollbar-hide p-3 pt-0">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadReplies(buildFilters())}
                      className="mt-2"
                    >
                      Retry
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  {currentReplies.map(reply => (
                    <Card
                      key={reply.id}
                      className="p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {reply.prospectName
                                .split(" ")
                                .map(n => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="text-sm font-semibold text-foreground">
                                    {reply.prospectName}
                                  </h3>
                                  <span className="text-xs text-muted-foreground">
                                    •
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.company}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    •
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.campaign}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    •
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.assignedMember}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getSentimentBadge(reply.sentiment)}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSendMessage(reply)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Reply
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                >
                                  <Tag className="w-3 h-3 mr-1" />
                                  Tag
                                </Button>
                                <div className="relative action-menu-container">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      setOpenActionMenu(
                                        openActionMenu === reply.id
                                          ? null
                                          : reply.id
                                      )
                                    }
                                    className="h-6 w-6 p-0"
                                  >
                                    <MoreHorizontal className="w-3 h-3" />
                                  </Button>

                                  {/* Action Menu Dropdown */}
                                  {openActionMenu === reply.id && (
                                    <div className="absolute right-0 mt-1 w-28 bg-background rounded shadow-lg border border-border z-20">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleActionClick(reply.id, "exclude")
                                        }
                                        className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50 h-6 text-xs"
                                      >
                                        <X className="w-3 h-3 mr-1" />
                                        Exclude
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          handleActionClick(reply.id, "delete")
                                        }
                                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-6 text-xs"
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-1 flex justify-end">
                              <div className=" text-primary px-2 py-1 rounded-full text-xs font-medium">
                                {new Date(
                                  reply.dateReceived
                                ).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </div>
                            </div>
                            <div className="mt-1">
                              <p className="text-xs text-foreground leading-relaxed">
                                {reply.replySnippet}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>

              {/* Pagination */}
              <div className="flex items-center justify-between p-2 border-t border-border">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    Rows per page:
                  </span>
                  <select
                    value={rowsPerPage}
                    onChange={e => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-background border border-input rounded text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.max(1, currentPage - 1);
                      setCurrentPage(newPage);
                    }}
                    disabled={!pagination.hasPrev || isLoading}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>

                  <span className="text-xs text-muted-foreground px-2">
                    Page {pagination.page} of {pagination.totalPages || 1}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = Math.min(
                        pagination.totalPages || 1,
                        currentPage + 1
                      );
                      setCurrentPage(newPage);
                    }}
                    disabled={!pagination.hasNext || isLoading}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Message Sidebar */}
        {showMessageSidebar && selectedProspect && (
          <div className="fixed mr-7 mb-1 top-1/2 right-0 transform -translate-y-1/2 h-[70vh] w-96 bg-background border-l border-border z-40 shadow-2xl message-sidebar-container">
            <div className="h-full flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {selectedProspect.prospectName
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {selectedProspect.prospectName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedProspect.company}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Star conversation"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Archive conversation"
                    >
                      <Folder className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Close conversation"
                      onClick={() => setShowMessageSidebar(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages - Scrollable Area */}
              <div
                className="overflow-y-auto scrollbar-hide flex-1 p-3 lg:p-4"
                aria-label="Conversation messages"
                aria-live="polite"
              >
                <div className="space-y-3">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-xs ${
                          message.isFromUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <Avatar className="w-4 h-4">
                            <AvatarFallback className="text-xs font-medium">
                              {message.isFromUser ? "RH" : message.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">
                            {message.isFromUser
                              ? "You"
                              : selectedProspect.prospectName}
                          </span>
                          <span
                            className={`text-xs ${
                              message.isFromUser
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground/70"
                            }`}
                          >
                            {message.timestamp.toLocaleString()}
                          </span>
                        </div>
                        <p className="leading-relaxed">{message.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message Input - Always Visible at Bottom */}
              <div className="border-t border-border flex-shrink-0 p-3 lg:p-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
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
                        const files = (e.target as HTMLInputElement).files;
                        if (!files || files.length === 0) return;

                        const fileArray = Array.from(files);
                        const errors: string[] = [];

                        // Check max file count
                        if (attachments.length + fileArray.length > MAX_FILES) {
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
                            !allowedTypes.includes(file.type.toLowerCase())
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
                              type: file.type || "application/octet-stream",
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
                            setTimeout(() => setAttachmentErrors([]), 5000);
                          };
                          reader.readAsDataURL(file);
                        });
                      };

                      input.click();
                    }}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      type="text"
                      value={messageText}
                      onChange={e => handleTyping(e.target.value)}
                      placeholder="Type your message..."
                      className="pr-8 text-sm rounded-full"
                      aria-label="Type your message"
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
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    aria-label="Send message"
                    onClick={handleSendNewMessage}
                    disabled={
                      (!messageText.trim() && attachments.length === 0) ||
                      isUploading
                    }
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {/* Attachment errors */}
                {attachmentErrors.length > 0 && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-600 mb-1">
                          File upload errors:
                        </p>
                        <ul className="text-xs text-red-600/90 space-y-0.5 list-disc list-inside">
                          {attachmentErrors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-red-100"
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
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
                          className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-xs max-w-xs border border-border hover:bg-muted/80 transition-colors"
                        >
                          {getFileIcon(attachment.type, attachment.name)}
                          <span
                            className="truncate flex-1"
                            title={attachment.name}
                          >
                            {attachment.name}
                          </span>
                          <span className="text-muted-foreground text-xs whitespace-nowrap">
                            {formatFileSize(attachment.size)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 flex-shrink-0 hover:bg-red-100 hover:text-red-600"
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
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-3 h-3 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    {attachments.length > 0
                      ? "Uploading files..."
                      : "Sending message..."}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  );
};

export default RepliesPage;
