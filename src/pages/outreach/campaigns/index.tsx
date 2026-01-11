"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/router";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";

// Types
interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  process_status:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "PROCESSED"
    | "FAILED";
  is_locked: boolean;
  sequence_id: string | null;
  skip_lead_conditions: string[];
  target_leads_id: string[];
  target_leads_count: number;
  campaign_stats: {
    id: string;
    campaign_id: string;
    invite_send_count: number;
    lead_connected_count: number;
    inemail_send_count: number;
    message_send_count: number;
    message_reply_count: number;
    in_progress_lead_count: number;
    awaiting_lead_count: number;
    completed_sequence_lead_count: number;
    paused_lead_count: number;
    fail_count: number;
    black_listed_count: number;
    follow_count: number;
    endorse_count: number;
    like_post_count: number;
    profile_verified_count: number;
    profile_viewed_count: number;
    ignored_count: number;
    withdrawn_count: number;
  } | null;
  work_calender_id: string | null;
  daily_engine_quota: {
    like_limit: number;
    inmail_limit: number;
    message_limit: number;
    profile_view_limit: number;
    skill_endorse_limit: number;
    decision_check_limit: number;
    profile_follow_limit: number;
    connection_request_limit: number;
    connection_by_email_limit: number;
  } | null;
  launched_at: string | null;
  created_at: string;
  is_archived: boolean;
  loading?: boolean;
}
import { Button } from "@/components/ui/button";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import AppLayout from "@/components/layout/AppLayout";
import {
  Search,
  Plus,
  Filter,
  CheckCircle,
  Clock,
  MessageSquare,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ChevronDown as ChevronDownIcon,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Mail,
  Users,
  Megaphone,
  Building,
  Twitter,
  Grid3X3,
  MoreVertical,
  UserPlus,
  Pencil,
  Calendar,
  Settings,
  Copy,
  Trash2,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";

export default function CampaignsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const initCampaign = useCallback(async () => {
    try {
      const { data: campaign, status } = await apiCall({
        url: "/api/outreach/campaign/init",
        method: "post",
        applyDefaultDomain: false,
      });

      if (isSuccessful(status) && campaign) {
        // Normalize backend response id field with proper type checking
        interface CampaignResponse {
          id?: string;
          campaign_id?: string;
          data?: {
            id?: string;
            campaign_id?: string;
          };
        }

        const response = campaign as CampaignResponse;
        const campaignId =
          response.id ||
          response.campaign_id ||
          response.data?.id ||
          response.data?.campaign_id;

        if (!campaignId) {
          setError("Failed to create campaign: No campaign ID returned");
          ShowShortMessage("Failed to create campaign", "error");
          return;
        }

        router.push(
          {
            pathname: `/outreach/campaigns/${campaignId}/create`,
            query: { step: "integration" },
          },
          undefined,
          { shallow: true }
        );
      } else {
        setError("Failed to initialize campaign");
        ShowShortMessage("Failed to create campaign", "error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create campaign. Please try again.";
      setError(errorMessage);
      ShowShortMessage("Failed to create campaign", "error");
    }
  }, [router]);

  const handleCreateLinkedInCampaign = () => {
    initCampaign();
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build filter string based on status filter
      let filterString = "";
      if (statusFilter === "ARCHIVED") {
        filterString = "is_archived=true";
      } else if (statusFilter !== "All") {
        // For other status filters, exclude archived campaigns
        filterString = "is_archived=false";
      }

      // Map sort column to API field
      const orderByMap: Record<string, string> = {
        name: "name",
        status: "status",
        verifiedLeads: "profile_verified_count",
        connected: "lead_connected_count",
        messagesSent: "message_send_count",
        inmailSent: "inemail_send_count",
        followed: "follow_count",
        liked: "like_post_count",
        completed: "completed_sequence_lead_count",
        engagement: "lead_connected_count",
      };

      const orderBy =
        sortColumn && orderByMap[sortColumn]
          ? orderByMap[sortColumn]
          : "created_at";

      const { data, status } = await apiCall({
        url: "/api/outreach/campaign/list",
        method: "post",
        applyDefaultDomain: false,
        body: {
          page: currentPage,
          limit: pageSize,
          orderBy: orderBy,
          sortType: sortDirection,
          filter: filterString,
        },
        credentials: "include",
      });

      if (isSuccessful(status) && data) {
        setCampaigns(data.campaigns || []);
        // Calculate total pages if total count is provided
        // The API should return the total count from the backend
        if (data.total !== undefined && data.total !== null && data.total > 0) {
          setTotalCampaigns(data.total);
          setTotalPages(Math.ceil(data.total / pageSize));
        } else {
          // Fallback: estimate based on current data
          // If we got a full page, there might be more pages
          const hasMore = (data.campaigns?.length || 0) === pageSize;
          if (hasMore) {
            // Estimate: at least (currentPage * pageSize) + 1
            const estimatedTotal = currentPage * pageSize + 1;
            setTotalCampaigns(estimatedTotal);
            setTotalPages(currentPage + 1);
          } else {
            // This is likely the last page
            const estimatedTotal =
              (currentPage - 1) * pageSize + (data.campaigns?.length || 0);
            setTotalCampaigns(estimatedTotal);
            setTotalPages(currentPage);
          }
        }
      } else {
        setError("Failed to fetch campaigns");
        setCampaigns([]);
        setTotalPages(1);
        setTotalCampaigns(0);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch campaigns. Please try again.";
      setError(errorMessage);
      setCampaigns([]);
      setTotalPages(1);
      setTotalCampaigns(0);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, currentPage, sortColumn, sortDirection, pageSize]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Reset to page 1 when filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, pageSize]);

  // When search term changes, reset to page 1
  useEffect(() => {
    if (searchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    // Don't allow status changes for archived campaigns
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign?.is_archived) return;

    try {
      let apiUrl = "";

      if (newStatus === "PAUSED") {
        apiUrl = "/api/outreach/campaign/pauseCampaign";
      } else if (newStatus === "ACTIVE") {
        apiUrl = "/api/outreach/campaign/continueCampaign";
      } else {
        // For other status changes, just update locally
        setCampaigns(prevCampaigns =>
          prevCampaigns.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: newStatus as Campaign["status"] }
              : campaign
          )
        );
        return;
      }

      const { status } = await apiCall({
        url: apiUrl,
        method: "post",
        applyDefaultDomain: false,
        body: { id: campaignId },
        credentials: "include",
      });

      if (isSuccessful(status)) {
        // Refresh the campaigns list to get updated data
        await fetchCampaigns();
        ShowShortMessage("Campaign status updated", "success");
      } else {
        const errorMsg = "Failed to update campaign status";
        setError(errorMsg);
        ShowShortMessage(errorMsg, "error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update campaign status. Please try again.";
      setError(errorMessage);
      ShowShortMessage(errorMessage, "error");
    }
  };

  const toggleRunPause = async (campaign: Campaign) => {
    // Do nothing for draft, archived, or finished campaigns
    const isFinished =
      campaign.process_status === "COMPLETED" ||
      campaign.process_status === "PROCESSED";
    if (campaign.status === "DRAFT" || campaign.is_archived || isFinished)
      return;

    try {
      // set loading on this row
      setCampaigns(prev =>
        prev.map(c => (c.id === campaign.id ? { ...c, loading: true } : c))
      );
      // If currently running (PROCESSING), pause; otherwise continue (run)
      if (campaign.process_status === "PROCESSING") {
        const { status } = await apiCall({
          url: "/api/outreach/campaign/pauseCampaign",
          method: "post",
          applyDefaultDomain: false,
          body: { id: campaign.id },
          credentials: "include",
        });
        if (isSuccessful(status)) {
          setCampaigns(prev =>
            prev.map(c =>
              c.id === campaign.id ? { ...c, process_status: "PENDING" } : c
            )
          );
          ShowShortMessage("Campaign paused", "success");
        } else {
          ShowShortMessage("Failed to pause campaign", "error");
        }
      } else {
        const { status } = await apiCall({
          url: "/api/outreach/campaign/continueCampaign",
          method: "post",
          applyDefaultDomain: false,
          body: { id: campaign.id },
          credentials: "include",
        });
        if (isSuccessful(status)) {
          setCampaigns(prev =>
            prev.map(c =>
              c.id === campaign.id ? { ...c, process_status: "PROCESSING" } : c
            )
          );
          ShowShortMessage("Campaign running", "success");
        } else {
          ShowShortMessage("Failed to run campaign", "error");
        }
      }
    } catch (error) {
      ShowShortMessage("Action failed. Please try again.", "error");
    } finally {
      // unset loading
      setCampaigns(prev =>
        prev.map(c => (c.id === campaign.id ? { ...c, loading: false } : c))
      );
    }
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    try {
      const { status } = await apiCall({
        url: "/api/outreach/campaign/deleteCampaign",
        method: "delete",
        applyDefaultDomain: false,
        body: { id: campaignId },
        credentials: "include",
      });

      if (isSuccessful(status)) {
        // Remove the campaign from the list
        setCampaigns(prevCampaigns =>
          prevCampaigns.filter(campaign => campaign.id !== campaignId)
        );
        ShowShortMessage("Campaign archived successfully", "success");
        // Refresh to update counts
        await fetchCampaigns();
      } else {
        const errorMsg = "Failed to archive campaign";
        setError(errorMsg);
        ShowShortMessage(errorMsg, "error");
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to archive campaign. Please try again.";
      setError(errorMessage);
      ShowShortMessage(errorMessage, "error");
    }
  };

  const getStatusConfig = (status: string, processStatus?: string) => {
    // Normalize to four states: Draft, Running, Finished, Paused
    if (status === "DRAFT") {
      return {
        bgColor: "bg-gray-50 dark:bg-gray-800",
        borderColor: "border-gray-200 dark:border-gray-700",
        textColor: "text-gray-600 dark:text-gray-300",
        icon: (
          <MoreHorizontal className="w-3 h-3 text-gray-900 dark:text-white" />
        ),
        displayText: "Draft",
      };
    }
    if (processStatus === "PROCESSING") {
      return {
        bgColor: "bg-white dark:bg-gray-900",
        borderColor: "border-white dark:border-gray-900",
        textColor: "text-gray-900 dark:text-white",
        icon: <Pause className="w-3 h-3 text-gray-900 dark:text-white" />,
        displayText: "Running",
      };
    }
    if (processStatus === "PROCESSED") {
      return {
        bgColor: "bg-white dark:bg-gray-900",
        borderColor: "border-white dark:border-gray-900",
        textColor: "text-gray-900 dark:text-white",
        icon: <CheckCircle className="w-3 h-3 text-gray-900 dark:text-white" />,
        displayText: "Finished",
      };
    }
    return {
      bgColor: "bg-white dark:bg-gray-900",
      borderColor: "border-white dark:border-gray-900",
      textColor: "text-gray-900 dark:text-white",
      icon: <Play className="w-3 h-3 text-gray-900 dark:text-white" />,
      displayText: "Paused",
    };
  };

  const StatusButton = ({ campaign }: { campaign: Campaign }) => {
    const config = getStatusConfig(campaign.status, campaign.process_status);

    // Different container shapes for different statuses
    const getContainerShape = (status: string, processStatus?: string) => {
      // All statuses use circular shape for consistency
      return "rounded-lg";
    };

    const isFinished =
      campaign.process_status === "COMPLETED" ||
      campaign.process_status === "PROCESSED";

    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        onClick={e => {
          e.stopPropagation();
          toggleRunPause(campaign);
        }}
        disabled={
          campaign.status === "DRAFT" ||
          campaign.loading ||
          campaign.is_archived ||
          isFinished
        }
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 ${config.bgColor} border ${config.borderColor} ${getContainerShape(campaign.status, campaign.process_status)} flex items-center justify-center shadow-sm hover:shadow-md transition-shadow`}
          >
            {campaign.loading ? (
              <span className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
            ) : (
              config.icon
            )}
          </div>
          <span className={`${config.textColor} text-sm font-medium`}>
            {config.displayText}
          </span>
        </div>
      </Button>
    );
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-gray-600" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600" />
    );
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.tenant_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.id.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;

    if (statusFilter === "ARCHIVED") {
      // For archived filter, check is_archived field
      matchesStatus = campaign.is_archived === true;
    } else if (statusFilter === "All") {
      // For "All", show all campaigns (no status filtering)
      matchesStatus = true;
    } else if (statusFilter === "ACTIVE") {
      // Active filter: show only RUNNING campaigns (process_status === "PROCESSING")
      matchesStatus =
        campaign.process_status === "PROCESSING" && !campaign.is_archived;
    } else if (statusFilter === "PAUSED") {
      // Paused filter: show only PAUSED campaigns (not processing and not draft)
      matchesStatus =
        campaign.process_status !== "PROCESSING" &&
        campaign.status !== "DRAFT" &&
        !campaign.is_archived;
    } else {
      // For other status filters (DRAFT, COMPLETED), check status field and exclude archived
      matchesStatus = campaign.status === statusFilter && !campaign.is_archived;
    }

    return matchesSearch && matchesStatus;
  });

  // Client-side sorting as fallback (when API doesn't support the sort field)
  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    if (!sortColumn) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortColumn) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "status":
        aValue = a.status;
        bValue = b.status;
        break;
      case "verifiedLeads":
        aValue = a.campaign_stats?.profile_verified_count || 0;
        bValue = b.campaign_stats?.profile_verified_count || 0;
        break;
      case "connected":
        aValue = a.campaign_stats?.lead_connected_count || 0;
        bValue = b.campaign_stats?.lead_connected_count || 0;
        break;
      case "messagesSent":
        aValue = a.campaign_stats?.message_send_count || 0;
        bValue = b.campaign_stats?.message_send_count || 0;
        break;
      case "inmailSent":
        aValue = a.campaign_stats?.inemail_send_count || 0;
        bValue = b.campaign_stats?.inemail_send_count || 0;
        break;
      case "followed":
        aValue = a.campaign_stats?.follow_count || 0;
        bValue = b.campaign_stats?.follow_count || 0;
        break;
      case "liked":
        aValue = a.campaign_stats?.like_post_count || 0;
        bValue = b.campaign_stats?.like_post_count || 0;
        break;
      case "completed":
        aValue = a.campaign_stats?.completed_sequence_lead_count || 0;
        bValue = b.campaign_stats?.completed_sequence_lead_count || 0;
        break;
      case "engagement":
        aValue = a.campaign_stats?.lead_connected_count || 0;
        bValue = b.campaign_stats?.lead_connected_count || 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <AppLayout activePage="Campaign">
      {/* Campaigns Table */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Running Campaigns
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Active and completed outreach campaigns
            </CardDescription>
          </div>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base md:text-sm min-h-[44px]"
                aria-label="Search campaigns by name, tenant ID, or campaign ID"
              />
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl min-h-[44px]"
                    aria-label="Filter campaigns by status"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/50 rounded-xl shadow-lg">
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("All")}
                    className={`cursor-pointer ${statusFilter === "All" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    All
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("DRAFT")}
                    className={`cursor-pointer ${statusFilter === "DRAFT" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("ACTIVE")}
                    className={`cursor-pointer ${statusFilter === "ACTIVE" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    Active
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("PAUSED")}
                    className={`cursor-pointer ${statusFilter === "PAUSED" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    Paused
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("COMPLETED")}
                    className={`cursor-pointer ${statusFilter === "COMPLETED" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setStatusFilter("ARCHIVED")}
                    className={`cursor-pointer ${statusFilter === "ARCHIVED" ? "bg-purple-50 text-purple-700" : ""}`}
                  >
                    Archived
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 shadow-sm min-h-[44px] focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-300"
                    aria-label="Create new campaign"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Campaign
                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/20 dark:border-gray-700/50 rounded-xl shadow-lg">
                  <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    LINKEDIN
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={handleCreateLinkedInCampaign}
                  >
                    <Linkedin className="w-4 h-4 mr-3 text-blue-600" />
                    LinkedIn Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <div className="w-4 h-4 mr-3 flex items-center justify-center">
                      <Mail className="w-3 h-3 text-blue-600" />
                    </div>
                    InMail Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Users className="w-4 h-4 mr-3 text-blue-600" />
                    Group Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Megaphone className="w-4 h-4 mr-3 text-blue-600" />
                    Event Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Building className="w-4 h-4 mr-3 text-blue-600" />
                    Company Campaign
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    OTHER
                  </DropdownMenuLabel>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Mail className="w-4 h-4 mr-3 text-blue-600" />
                    Email Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Twitter className="w-4 h-4 mr-3 text-blue-600" />X
                    (Twitter) Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <MessageSquare className="w-4 h-4 mr-3 text-blue-600" />
                    WhatsApp Campaign
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    disabled
                    className="cursor-not-allowed opacity-60"
                  >
                    <Grid3X3 className="w-4 h-4 mr-3 text-blue-600" />
                    Multi-channel Campaign
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Loading campaigns...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-red-500 dark:text-red-400 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                  <Button
                    onClick={fetchCampaigns}
                    variant="outline"
                    className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-4">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No campaigns found
                  </p>
                  <Button
                    onClick={handleCreateLinkedInCampaign}
                    className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Campaign
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        CAMPAIGN
                        {getSortIcon("name")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        STATUS
                        {getSortIcon("status")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("verifiedLeads")}
                    >
                      <div className="flex items-center gap-2">
                        VERIFIED
                        {getSortIcon("verifiedLeads")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("connected")}
                    >
                      <div className="flex items-center gap-2">
                        CONNECTIONS
                        {getSortIcon("connected")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("messagesSent")}
                    >
                      <div className="flex items-center gap-2">
                        MESSAGES
                        {getSortIcon("messagesSent")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("inmailSent")}
                    >
                      <div className="flex items-center gap-2">
                        INMAIL SENT
                        {getSortIcon("inmailSent")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("followed")}
                    >
                      <div className="flex items-center gap-2">
                        FOLLOWED
                        {getSortIcon("followed")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("liked")}
                    >
                      <div className="flex items-center gap-2">
                        LIKED
                        {getSortIcon("liked")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("completed")}
                    >
                      <div className="flex items-center gap-2">
                        COMPLETED
                        {getSortIcon("completed")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                      onClick={() => handleSort("engagement")}
                    >
                      <div className="flex items-center gap-2">
                        ENGAGE
                        {getSortIcon("engagement")}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCampaigns.map(campaign => (
                    <TableRow
                      key={campaign.id}
                      className="border-gray-100/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                    >
                      <TableCell
                        className="cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                        onClick={() =>
                          router.push(
                            `/outreach/campaigns/${campaign.id}/details/overView`
                          )
                        }
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-11 w-11 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-gray-400"
                                  onClick={e => e.stopPropagation()}
                                  aria-label="Campaign actions menu"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                className="w-48"
                              >
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(
                                      `/outreach/campaigns/${campaign.id}/edit?step=integration`
                                    );
                                  }}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Update Integrations
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(
                                      `/outreach/campaigns/${campaign.id}/edit?step=lead`
                                    );
                                  }}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Add More Leads
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(
                                      `/outreach/campaigns/${campaign.id}/edit?step=sequence`
                                    );
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Sequence
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(
                                      `/outreach/campaigns/${campaign.id}/edit?step=schedule`
                                    );
                                  }}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Edit Schedule
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={e => {
                                    e.stopPropagation();
                                    router.push(
                                      `/outreach/campaigns/${campaign.id}/edit?step=quota`
                                    );
                                  }}
                                >
                                  <Settings className="mr-2 h-4 w-4" />
                                  Edit Configuration
                                </DropdownMenuItem>
                                {/* <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={async e => {
                                    e.stopPropagation();
                                    try {
                                      const { status } = await apiCall({
                                        url: "/api/outreach/campaign/duplicateCampaign",
                                        method: "post",
                                        applyDefaultDomain: false,
                                        body: { id: campaign.id },
                                        credentials: "include",
                                      });
                                      if (isSuccessful(status)) {
                                        await fetchCampaigns();
                                      } else {
                                        setError(
                                          "Failed to duplicate campaign"
                                        );
                                      }
                                    } catch (err) {
                                      setError(
                                        "Failed to duplicate campaign. Please try again."
                                      );
                                    }
                                  }}
                                >
                                  <Copy className="mr-2 h-4 w-4" />
                                  Duplicate
                                </DropdownMenuItem> */}
                                <DropdownMenuSeparator />
                                {campaign.is_archived ? null : (
                                  <DropdownMenuItem
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleDeleteCampaign(campaign.id);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Archive
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {/* <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                              {campaign.owner.avatar}
                            </AvatarFallback>
                          </Avatar> */}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-base leading-6">
                                {campaign.name || "Unnamed Campaign"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm leading-5 mt-1">
                                Total Leads: {campaign.target_leads_count}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-sm leading-5 mt-1">
                                Launched On:{" "}
                                {campaign.launched_at
                                  ? new Date(
                                      campaign.launched_at
                                    ).toLocaleDateString()
                                  : "Not launched"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusButton campaign={campaign} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                            {campaign.campaign_stats?.profile_verified_count ||
                              0}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            verified
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {campaign.campaign_stats?.invite_send_count || 0}{" "}
                              sent
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {campaign.campaign_stats?.lead_connected_count ||
                                0}{" "}
                              connected
                            </span>
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {campaign.campaign_stats?.lead_connected_count &&
                            campaign.campaign_stats?.invite_send_count
                              ? `${Math.round((campaign.campaign_stats.lead_connected_count / campaign.campaign_stats.invite_send_count) * 100)}%`
                              : "0%"}{" "}
                            success
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {campaign.campaign_stats?.message_send_count || 0}{" "}
                              sent
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">💬</span>
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">
                              {campaign.campaign_stats?.message_reply_count ||
                                0}{" "}
                              replies
                            </span>
                          </div>
                          <span className="text-gray-600 dark:text-gray-400 text-xs">
                            {campaign.campaign_stats?.message_reply_count &&
                            campaign.campaign_stats?.message_send_count
                              ? `${Math.round((campaign.campaign_stats.message_reply_count / campaign.campaign_stats.message_send_count) * 100)}%`
                              : "0%"}{" "}
                            responded
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {campaign.campaign_stats?.inemail_send_count || 0}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {campaign.campaign_stats?.follow_count || 0}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {campaign.campaign_stats?.like_post_count || 0}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-white">
                        {campaign.campaign_stats
                          ?.completed_sequence_lead_count || 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min((campaign.campaign_stats?.lead_connected_count || 0) * 2, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                            {Math.min(
                              (campaign.campaign_stats?.lead_connected_count ||
                                0) * 2,
                              100
                            )}
                            %
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {/* Pagination Footer - Always Visible */}
            {!loading && !error && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                {campaigns.length > 0 && totalPages > 0 ? (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={pageSize}
                    totalItems={
                      searchTerm
                        ? filteredCampaigns.length
                        : totalCampaigns || campaigns.length
                    }
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={setPageSize}
                    itemsPerPageOptions={[10, 20, 50]}
                    itemLabel={searchTerm ? "results" : "campaigns"}
                  />
                ) : (
                  <div className="flex items-center justify-between py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No campaigns
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        Rows per page:
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-16"
                          >
                            {pageSize}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => setPageSize(10)}>
                            10
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPageSize(20)}>
                            20
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setPageSize(50)}>
                            50
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
