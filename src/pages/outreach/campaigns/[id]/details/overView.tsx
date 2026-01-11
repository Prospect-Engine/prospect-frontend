"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Pencil,
  Copy,
  Trash2,
  Linkedin,
  Clock,
  Info,
  Users,
  RefreshCw,
  MessageSquare,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Briefcase,
  Building,
  MapPin,
  X,
  Calendar as CalendarIcon,
  Download,
} from "lucide-react";
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import getNode from "@/components/template/nodes/node";
import getTimer from "@/components/template/nodes/timer";
import { ErrorNodesProvider } from "@/components/template/ErrorNodesContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface CampaignDetails {
  id: string;
  name: string;
  status: string;
  process_status: string;
  target_leads_count: number;
  campaign_stats: {
    total_leads: number;
    active_leads: number;
    ignored_leads: number;
    passed_all_steps: number;
    passed_all_steps_percentage: number;
    pending_to_connect: number;
    pending_to_connect_percentage: number;
    paused: number;
    paused_percentage: number;
    completed_sequence_lead_count: number;
    profile_verified_count: number;
  } | null;
  sequence_steps: Array<{
    id: string;
    step_number: number;
    step_type: string;
    step_name: string;
    leads_passed: number;
    delay_hours: number;
    actions: Array<{
      type: string;
      count: number;
    }>;
  }>;
  progress_percentage: number;
  lead_source: string;
  diagram?: {
    nodes: Node[];
    edges: Edge[];
  } | null;
}

export default function CampaignOverviewPage() {
  const router = useRouter();
  const { id } = router.query;
  const [campaignDetails, setCampaignDetails] =
    useState<CampaignDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [leads, setLeads] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);
  const [isActivityDetailsModalOpen, setIsActivityDetailsModalOpen] =
    useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [dataSourceLoading, setDataSourceLoading] = useState(false);

  // Leads table state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [leadTypeFilter, setLeadTypeFilter] = useState("all");
  const [leadScoreFilter, setLeadScoreFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Activity table pagination state
  const [activityCurrentPage, setActivityCurrentPage] = useState(1);
  const [activityItemsPerPage, setActivityItemsPerPage] = useState(10);

  // Activity filters
  const [activitySearchQuery, setActivitySearchQuery] = useState("");
  const [activityTypeFilter, setActivityTypeFilter] = useState("all");
  const [showDateRange, setShowDateRange] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Custom showMenu function for read-only message display
  const showMessageModal = useCallback(
    (ref: any, node: any, menuType: string) => {
      if (menuType === "Configure" && node.data.value) {
        setSelectedNodeData(node.data);
        setIsMessageModalOpen(true);
      }
    },
    []
  );

  // Create node types for ReactFlow (read-only versions)
  const nodeTypes = useMemo(() => {
    // Dummy functions for read-only mode
    const dummyDispatch = () => {};
    const dummySetLeafToEnd = () => {};

    return {
      root: getNode({
        nodeType: "root",
        showMenu: showMessageModal,
        isDraft: false,
      }),
      leaf: getNode({
        nodeType: "leaf",
        showMenu: showMessageModal,
        isDraft: false,
        dispatch: dummyDispatch,
        currentNode: { current: null },
        anchorRef: { current: null },
        setLeafToEnd: dummySetLeafToEnd,
      }),
      unidirectional: getNode({
        nodeType: "unidirectional",
        showMenu: showMessageModal,
        isDraft: false,
        dispatch: dummyDispatch,
        anchorRef: { current: null },
        currentNode: { current: null },
      }),
      bidirectional: getNode({
        nodeType: "bidirectional",
        showMenu: showMessageModal,
        isDraft: false,
        dispatch: dummyDispatch,
        anchorRef: { current: null },
        currentNode: { current: null },
      }),
      timer: getTimer((node: any, menuType: string) => {
        if (menuType === "Timer" && node.data.value) {
          setSelectedNodeData(node.data);
          setIsMessageModalOpen(true);
        }
      }),
    };
  }, [showMessageModal]);

  // Load campaign details and sequence dynamically
  useEffect(() => {
    if (!id) return;
    let isCancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const [
          { data: detailsResp, status: detailsStatus },
          { data: sequenceResp, status: sequenceStatus },
        ] = await Promise.all([
          apiCall({
            url: `/api/outreach/campaign/campaignDetails/getDetails?camp_id=${id}`,
            method: "get",
            applyDefaultDomain: false,
          }),
          apiCall({
            url: `/api/outreach/campaign/campaignDetails/getSequence?camp_id=${id}`,
            method: "get",
            applyDefaultDomain: false,
          }),
        ]);

        if (isCancelled) return;

        // Check if API calls were successful
        if (!isSuccessful(detailsStatus)) {
          console.error("Failed to fetch campaign details:", {
            status: detailsStatus,
            response: detailsResp,
            camp_id: id,
          });
          setCampaignDetails(null);
          setLoading(false);
          return;
        }

        // Log successful response for debugging
        console.log("Campaign details response:", detailsResp);
        console.log("Sequence response:", sequenceResp);

        // Map API response to UI structure (based on actual API response)
        const name = detailsResp?.name || `Campaign ${id}`;
        const statsSrc = detailsResp?.campaign_stats || {};

        // Calculate progress percentage from completed vs total
        const totalLeads = detailsResp?.target_leads_count || 0;
        const completedLeads = statsSrc?.completed_sequence_lead_count || 0;
        const progress =
          totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0;

        // Calculate active leads (total - ignored - paused - completed)
        const activeLeads =
          totalLeads -
          (statsSrc?.ignored_count || 0) -
          (statsSrc?.pasued_lead_count || 0) -
          completedLeads;

        // Calculate pending to connect (awaiting + in_progress)
        const pendingToConnect =
          (statsSrc?.awaiting_lead_count || 0) +
          (statsSrc?.in_progress_lead_count || 0);
        const pendingToConnectPercentage =
          totalLeads > 0
            ? Math.round((pendingToConnect / totalLeads) * 100)
            : 0;

        // Handle sequence response - check if successful
        // Check for diagram structure first (like setSequence.ts uses)
        let diagram = null;
        let sequenceStepsRaw: any[] = [];

        if (isSuccessful(sequenceStatus)) {
          // Check for diagram structure (preferred format)
          diagram =
            sequenceResp?.diagram ||
            sequenceResp?.data?.diagram ||
            sequenceResp?.sequence?.diagram ||
            null;

          // If no diagram, try to get sequence array
          if (!diagram) {
            const possibleSteps =
              sequenceResp?.steps ||
              sequenceResp?.data?.steps ||
              sequenceResp?.sequence ||
              sequenceResp?.data?.sequence ||
              sequenceResp;

            // Ensure it's an array
            if (Array.isArray(possibleSteps)) {
              sequenceStepsRaw = possibleSteps;
            } else if (possibleSteps && typeof possibleSteps === "object") {
              sequenceStepsRaw =
                Object.values(possibleSteps).filter(Array.isArray)[0] || [];
            }
          }
        }

        // Convert to simple format for backward compatibility
        const sequence_steps = diagram?.nodes
          ? diagram.nodes
              .filter((n: any) => n.data?.command && n.data.command !== "NONE")
              .map((n: any, idx: number) => ({
                id: String(n?.id ?? idx + 1),
                step_number: idx + 1,
                step_type: n.data?.command || "",
                step_name: n.data?.value?.label || n.data?.label || "Step",
                leads_passed: 0,
                delay_hours: n.data?.value?.count || 0,
                actions: [],
              }))
          : Array.isArray(sequenceStepsRaw)
            ? sequenceStepsRaw.map((s, idx) => ({
                id: String(s?.id ?? idx + 1),
                step_number: s?.step_number ?? idx + 1,
                step_type: s?.type || s?.step_type || "",
                step_name: s?.name || s?.step_name || "",
                leads_passed: s?.leads_passed ?? 0,
                delay_hours: s?.delay_hours ?? s?.delay ?? 0,
                actions: (s?.actions || []).map((a: any) => ({
                  type: a?.type || a?.action_type || "",
                  count: a?.count ?? 1,
                })),
              }))
            : [];

        const next: CampaignDetails = {
          id: String(id),
          name,
          status: detailsResp?.status || "ACTIVE",
          process_status: detailsResp?.process_status || "PROCESSING",
          target_leads_count: detailsResp?.target_leads_count || 0,
          campaign_stats: {
            total_leads: totalLeads,
            active_leads: Math.max(0, activeLeads),
            ignored_leads: statsSrc?.ignored_count || 0,
            passed_all_steps: completedLeads,
            passed_all_steps_percentage:
              totalLeads > 0
                ? Math.round((completedLeads / totalLeads) * 100)
                : 0,
            pending_to_connect: pendingToConnect,
            pending_to_connect_percentage: pendingToConnectPercentage,
            paused: statsSrc?.pasued_lead_count || 0,
            paused_percentage:
              totalLeads > 0
                ? Math.round(
                    ((statsSrc?.pasued_lead_count || 0) / totalLeads) * 100
                  )
                : 0,
            completed_sequence_lead_count: completedLeads,
            profile_verified_count: statsSrc?.profile_verified_count || 0,
          },
          sequence_steps,
          progress_percentage: progress,
          lead_source: "CSV file", // Default based on target_leads_id
          diagram: diagram || null,
        };

        setCampaignDetails(next);
      } catch (err) {
        console.error("Error loading campaign details:", err);
        setCampaignDetails(null);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleEdit = () => {
    router.push(`/outreach/campaigns/${id}/edit?step=integration`);
  };

  const handleDuplicate = async () => {
    try {
      const { status } = await apiCall({
        url: "/api/outreach/campaign/duplicateCampaign",
        method: "post",
        applyDefaultDomain: false,
        body: { id },
        credentials: "include",
      });
      if (isSuccessful(status)) {
        router.push("/outreach/campaigns");
      }
    } catch (error) {
      console.error("Failed to duplicate campaign", error);
    }
  };

  const handleDelete = async () => {
    try {
      const { status } = await apiCall({
        url: "/api/outreach/campaign/deleteCampaign",
        method: "delete",
        applyDefaultDomain: false,
        body: { id },
        credentials: "include",
      });
      if (isSuccessful(status)) {
        router.push("/outreach/campaigns");
      }
    } catch (error) {
      console.error("Failed to delete campaign", error);
    }
  };

  // Fetch leads when leads tab is active
  useEffect(() => {
    if (activeTab === "leads" && id && !leadsLoading) {
      const fetchLeads = async () => {
        try {
          setLeadsLoading(true);
          setLeadsError(null);
          const { data, status } = await apiCall({
            url: `/api/outreach/campaign/campaignDetails/getLeads?campaigns=${id}`,
            method: "get",
            applyDefaultDomain: false,
          });
          if (isSuccessful(status)) {
            // The API returns: { data: [...], page, limit, total }
            const leadsList = Array.isArray(data?.data)
              ? data.data
              : Array.isArray(data)
                ? data
                : data?.leads || [];
            setLeads(leadsList);
          } else {
            setLeadsError("Failed to fetch leads");
            setLeads([]);
          }
        } catch (err) {
          console.error("Error fetching leads:", err);
          setLeadsError("Failed to fetch leads");
          setLeads([]);
        } finally {
          setLeadsLoading(false);
        }
      };
      fetchLeads();
    }
  }, [activeTab, id]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => {
        const name = (
          lead.full_name ||
          `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
          lead.name ||
          ""
        ).toLowerCase();
        const company = (lead.company || "").toLowerCase();
        const position = (
          lead.current_position ||
          lead.position ||
          ""
        ).toLowerCase();
        const headline = (lead.headline || "").toLowerCase();
        const email = (lead.email || lead.contact_email || "").toLowerCase();
        return (
          name.includes(query) ||
          company.includes(query) ||
          position.includes(query) ||
          headline.includes(query) ||
          email.includes(query)
        );
      });
    }

    // Status filter (placeholder - adjust based on actual data)
    if (statusFilter !== "all") {
      // filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "name":
          aValue = (
            a.full_name ||
            `${a.first_name || ""} ${a.last_name || ""}`.trim() ||
            a.name ||
            ""
          ).toLowerCase();
          bValue = (
            b.full_name ||
            `${b.first_name || ""} ${b.last_name || ""}`.trim() ||
            b.name ||
            ""
          ).toLowerCase();
          break;
        case "company":
          aValue = (a.company || "").toLowerCase();
          bValue = (b.company || "").toLowerCase();
          break;
        case "position":
          aValue = (a.current_position || a.position || "").toLowerCase();
          bValue = (b.current_position || b.position || "").toLowerCase();
          break;
        default:
          aValue = a[sortField] || "";
          bValue = b[sortField] || "";
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    leads,
    searchQuery,
    statusFilter,
    priorityFilter,
    sourceFilter,
    leadTypeFilter,
    leadScoreFilter,
    sortField,
    sortDirection,
  ]);

  // Download leads as CSV
  const handleDownloadLeads = useCallback(() => {
    const leadsToExport = filteredAndSortedLeads;

    // Define CSV headers
    const headers = [
      "Name",
      "Company",
      "Position",
      "Location",
      "Headline",
      "Email",
      "Phone",
      "Profile URL",
    ];

    // Convert leads to CSV rows
    const csvRows = [
      headers.join(","),
      ...leadsToExport.map((lead: any) => {
        const row = [
          `"${(lead.name || "").replace(/"/g, '""')}"`,
          `"${(lead.company || "").replace(/"/g, '""')}"`,
          `"${(lead.position || "").replace(/"/g, '""')}"`,
          `"${(lead.location || "").replace(/"/g, '""')}"`,
          `"${(lead.headline || "").replace(/"/g, '""')}"`,
          `"${(lead.email || "").replace(/"/g, '""')}"`,
          `"${(lead.phone || "").replace(/"/g, '""')}"`,
          `"${(lead.profile_url || "").replace(/"/g, '""')}"`,
        ];
        return row.join(",");
      }),
    ];

    // Create CSV content
    const csvContent = csvRows.join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads_${campaignDetails?.name || "campaign"}_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAndSortedLeads, campaignDetails]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / itemsPerPage);
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    // Search filter
    if (activitySearchQuery) {
      const query = activitySearchQuery.toLowerCase();
      filtered = filtered.filter((activity: any) => {
        const personName = (activity.person?.name || "").toLowerCase();
        const description = (
          activity.description ||
          activity.message ||
          ""
        ).toLowerCase();
        const type = (
          activity.type ||
          activity.activity_type ||
          ""
        ).toLowerCase();
        const campaignName = (activity.campaignName || "").toLowerCase();
        return (
          personName.includes(query) ||
          description.includes(query) ||
          type.includes(query) ||
          campaignName.includes(query)
        );
      });
    }

    // Activity type filter
    if (activityTypeFilter !== "all") {
      filtered = filtered.filter((activity: any) => {
        const description = (
          activity.description ||
          activity.message ||
          ""
        ).toLowerCase();
        const type = (
          activity.type ||
          activity.activity_type ||
          ""
        ).toLowerCase();
        const filterLower = activityTypeFilter.toLowerCase();

        // Map filter values to actual activity descriptions
        const filterMap: Record<string, string[]> = {
          "profile verified": ["profile has been verified", "profile verified"],
          "connection request sent": [
            "connection request has been sent",
            "connection request sent",
          ],
          connected: ["connected"],
          "message sent": ["message sent"],
          "message reply": ["message reply", "replied"],
          "inmail sent": ["inmail sent"],
          followed: ["followed"],
          "endorsed skill": ["endorsed skill", "endorsed"],
          "liked post": ["liked post", "liked"],
          "profile viewed": ["profile viewed", "viewed"],
          "connected by email": ["connected by email"],
          "sequence finished": ["sequence finished", "finished"],
          "profile ignored": ["profile ignored", "ignored"],
        };

        const matches = filterMap[filterLower] || [filterLower];
        return matches.some(
          match =>
            description.includes(match) ||
            type.includes(match) ||
            description === match ||
            type === match
        );
      });
    }

    // Date range filter
    if (startDate || endDate) {
      filtered = filtered.filter((activity: any) => {
        const activityDate =
          activity.createdAt || activity.created_at || activity.date;
        if (!activityDate) return false;
        const date = new Date(activityDate);
        if (startDate && date < startDate) return false;
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999); // Include the entire end date
          if (date > end) return false;
        }
        return true;
      });
    }

    return filtered;
  }, [activities, activitySearchQuery, activityTypeFilter, startDate, endDate]);

  // Activity pagination
  const activityTotalPages = Math.ceil(
    filteredActivities.length / activityItemsPerPage
  );
  const paginatedActivities = filteredActivities.slice(
    (activityCurrentPage - 1) * activityItemsPerPage,
    activityCurrentPage * activityItemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  // Fetch data source (lead type)
  useEffect(() => {
    if (id && !dataSourceLoading) {
      const fetchDataSource = async () => {
        try {
          setDataSourceLoading(true);
          const { data, status } = await apiCall({
            url: `/api/outreach/campaign/campaignDetails/getLeadType?camp_id=${id}`,
            method: "get",
            applyDefaultDomain: false,
          });
          if (isSuccessful(status)) {
            setDataSource(data?.data_source || null);
          }
        } catch (err) {
          console.error("Error fetching data source:", err);
        } finally {
          setDataSourceLoading(false);
        }
      };
      fetchDataSource();
    }
  }, [id]);

  // Fetch activities when activity tab is active
  useEffect(() => {
    if (activeTab === "activity" && id && !activitiesLoading) {
      const fetchActivities = async () => {
        try {
          setActivitiesLoading(true);
          setActivitiesError(null);
          const { data, status } = await apiCall({
            url: `/api/outreach/campaign/campaignDetails/getActivity?campaigns=${id}`,
            method: "get",
            applyDefaultDomain: false,
          });
          if (isSuccessful(status)) {
            // The API returns: { activity: [...], page, limit, total }
            const activitiesList = Array.isArray(data?.activity)
              ? data.activity
              : Array.isArray(data)
                ? data
                : data?.activities || data?.data || [];
            setActivities(activitiesList);
          } else {
            setActivitiesError("Failed to fetch activities");
            setActivities([]);
          }
        } catch (err) {
          console.error("Error fetching activities:", err);
          setActivitiesError("Failed to fetch activities");
          setActivities([]);
        } finally {
          setActivitiesLoading(false);
        }
      };
      fetchActivities();
    }
  }, [activeTab, id]);

  if (loading) {
    return (
      <AppLayout activePage="Campaign">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading campaign details...
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!campaignDetails) {
    return (
      <AppLayout activePage="Campaign">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">
              Campaign not found
            </p>
            <Button
              onClick={() => router.push("/outreach/campaigns")}
              variant="outline"
            >
              Back to Campaigns
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const stats = campaignDetails.campaign_stats;

  return (
    <AppLayout activePage="Campaign">
      <div className="space-y-6">
        {/* Header with Tabs aligned to the right */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                onClick={() => router.push("/outreach/campaigns")}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 h-8 px-3 text-sm font-medium"
              >
                <ChevronLeft className="h-4 w-4 " />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white truncate">
                {campaignDetails.name}
              </h1>
              {/* <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              </Button> */}
            </div>
            <div className="flex items-center gap-3">
              <TabsList className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-1 rounded-lg inline-flex h-auto">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 px-4 py-2 transition-colors"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="leads"
                  className="data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 px-4 py-2 transition-colors"
                >
                  Leads
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 data-[state=inactive]:text-gray-700 dark:data-[state=inactive]:text-gray-300 px-4 py-2 transition-colors"
                >
                  Activity
                </TabsTrigger>
              </TabsList>
              {/* <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDuplicate}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Duplicate"
                >
                  <Copy className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div> */}
            </div>
          </div>

          {/* Overview Tab Content */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Campaign Details */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Campaign Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Progress
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {campaignDetails.progress_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 dark:bg-green-400 rounded-full transition-all duration-300"
                        style={{
                          width: `${campaignDetails.progress_percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total Leads
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total number of leads in this campaign</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.total_leads.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Verified Lead Count
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Total number of verified leads</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.profile_verified_count.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Ignored Leads
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Leads that have been ignored</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.ignored_leads.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Passed all steps
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Leads that completed all sequence steps</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.passed_all_steps || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({stats?.passed_all_steps_percentage || 0}%)
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Pending to connect
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Leads waiting for connection request</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.pending_to_connect || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({stats?.pending_to_connect_percentage || 0}%)
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Paused
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Leads that are currently paused</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {stats?.paused || 0}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ({stats?.paused_percentage || 0}%)
                      </p>
                    </div>
                  </div>

                  {/* Data Source Section */}
                  {dataSource && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Linkedin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {dataSource === "CSV"
                            ? "LinkedIn URLs uploaded via CSV file"
                            : dataSource === "LINKEDIN"
                              ? "LinkedIn Search"
                              : dataSource === "SALES_NAVIGATOR"
                                ? "Sales Navigator"
                                : `Leads from ${dataSource}`}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 ml-12">
                        {dataSource === "CSV"
                          ? "Your leads are coming from the uploaded CSV file."
                          : dataSource === "LINKEDIN"
                            ? "Your leads are coming from LinkedIn search."
                            : dataSource === "SALES_NAVIGATOR"
                              ? "Your leads are coming from Sales Navigator."
                              : `Your leads are coming from ${dataSource}.`}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column - Demo Sequence Flow */}
              <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Sequence Flow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[560px] w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                    <ErrorNodesProvider>
                      <ReactFlow
                        nodes={campaignDetails.diagram?.nodes || []}
                        edges={campaignDetails.diagram?.edges || []}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-white dark:bg-gray-800"
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnDrag={true}
                        zoomOnScroll={true}
                        preventScrolling={false}
                      >
                        <Background color="transparent" gap={0} size={0} />
                        <Controls />
                      </ReactFlow>
                    </ErrorNodesProvider>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Leads Tab Content */}
          <TabsContent value="leads" className="mt-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                      Leads
                    </CardTitle>
                    <CardDescription>
                      View all verified leads in this campaign
                    </CardDescription>
                  </div>
                  {/* Search Bar */}
                  <div className="flex-1 max-w-md">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  </div>
                  {/* Download Button */}
                  <Button
                    onClick={handleDownloadLeads}
                    variant="outline"
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Table */}
                {leadsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Loading leads...
                      </p>
                    </div>
                  </div>
                ) : leadsError ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        {leadsError}
                      </p>
                      <Button
                        onClick={() => {
                          setLeads([]);
                          setLeadsLoading(false);
                        }}
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : filteredAndSortedLeads.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery
                          ? "No leads match your search"
                          : "No leads found in this campaign"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg hide-scrollbar"
                      style={{
                        maxWidth: "100%",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                          .hide-scrollbar::-webkit-scrollbar {
                            display: none;
                            width: 0;
                            height: 0;
                          }
                          .hide-scrollbar {
                            -ms-overflow-style: none;
                            scrollbar-width: none;
                          }
                        `,
                        }}
                      />
                      <Table className="min-w-full border-collapse">
                        <TableHeader>
                          <TableRow className="bg-gray-100 dark:bg-gray-800 border-0">
                            <TableHead
                              className="cursor-pointer text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700"
                              onClick={() => handleSort("name")}
                            >
                              <span className="flex items-center">
                                LEADS
                                <SortIcon field="name" />
                              </span>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700"
                              onClick={() => handleSort("company")}
                            >
                              <span className="flex items-center">
                                COMPANY
                                <SortIcon field="company" />
                              </span>
                            </TableHead>
                            <TableHead
                              className="cursor-pointer text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700"
                              onClick={() => handleSort("position")}
                            >
                              <span className="flex items-center">
                                POSITION
                                <SortIcon field="position" />
                              </span>
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              LOCATION
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              HEADLINE
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              EMAIL
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              PHONE
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedLeads.map((lead: any) => {
                            const leadName =
                              lead.full_name ||
                              `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
                              lead.name ||
                              "-";
                            const initials = leadName
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2);

                            return (
                              <TableRow
                                key={lead.id || lead.lead_id}
                                className="bg-white dark:bg-gray-900 border-0 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={
                                          lead.profile_pic_url ||
                                          lead.profile_picture ||
                                          lead.avatar
                                        }
                                        alt={leadName}
                                      />
                                      <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium">
                                        {initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <span className="cursor-help text-gray-700 dark:text-gray-300">
                                            {leadName}
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{leadName}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate max-w-[200px] cursor-help">
                                          {lead.company || "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{lead.company || "-"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate max-w-[200px] cursor-help">
                                          {lead.current_position ||
                                            lead.position ||
                                            "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {lead.current_position ||
                                            lead.position ||
                                            "-"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate max-w-[200px] cursor-help">
                                          {lead.location || "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{lead.location || "-"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0 max-w-xs">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate cursor-help">
                                          {lead.headline || "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-md">
                                        <p className="whitespace-pre-wrap break-words">
                                          {lead.headline || "-"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate max-w-[200px] cursor-help">
                                          {lead.email ||
                                            lead.contact_email ||
                                            "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {lead.email ||
                                            lead.contact_email ||
                                            "-"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate max-w-[150px] cursor-help">
                                          {lead.phone || "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{lead.phone || "-"}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Results Summary and Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      {/* Left: Rows per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Rows per page:
                        </span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={value => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Middle: Results Summary */}
                      {!leadsLoading && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {paginatedLeads.length} of{" "}
                          {filteredAndSortedLeads.length} leads
                        </div>
                      )}

                      {/* Right: Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(prev => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab Content */}
          <TabsContent value="activity" className="mt-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Activity ({filteredActivities.length})
                  </CardTitle>
                  <CardDescription>View campaign activity</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {/* Activity Filters */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                  {/* Search Input */}
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search lead"
                        value={activitySearchQuery}
                        onChange={e => {
                          setActivitySearchQuery(e.target.value);
                          setActivityCurrentPage(1);
                        }}
                        className="pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* All Activities Dropdown */}
                  <Select
                    value={activityTypeFilter}
                    onValueChange={value => {
                      setActivityTypeFilter(value);
                      setActivityCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                      <SelectValue placeholder="All Activities" />
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Activities</SelectItem>
                      <SelectItem value="Profile Verified">
                        Profile Verified
                      </SelectItem>
                      <SelectItem value="Connection Request Sent">
                        Connection Request Sent
                      </SelectItem>
                      <SelectItem value="Connected">Connected</SelectItem>
                      <SelectItem value="Message Sent">Message Sent</SelectItem>
                      <SelectItem value="Message Reply">
                        Message Reply
                      </SelectItem>
                      <SelectItem value="InMail Sent">InMail Sent</SelectItem>
                      <SelectItem value="Followed">Followed</SelectItem>
                      <SelectItem value="Endorsed Skill">
                        Endorsed Skill
                      </SelectItem>
                      <SelectItem value="Liked Post">Liked Post</SelectItem>
                      <SelectItem value="Profile Viewed">
                        Profile Viewed
                      </SelectItem>
                      <SelectItem value="Connected by Email">
                        Connected by Email
                      </SelectItem>
                      <SelectItem value="Sequence Finished">
                        Sequence Finished
                      </SelectItem>
                      <SelectItem value="Profile Ignored">
                        Profile Ignored
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom Date Button */}
                  <Popover open={showDateRange} onOpenChange={setShowDateRange}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 ${
                          startDate || endDate
                            ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white"
                            : ""
                        }`}
                      >
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        CUSTOM DATE
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <div className="flex items-center gap-3 p-4">
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                            Start date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-9"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {startDate ? (
                                  startDate.toLocaleDateString()
                                ) : (
                                  <span className="text-gray-500">
                                    Start date
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={startDate}
                                onSelect={date => {
                                  setStartDate(date);
                                  setActivityCurrentPage(1);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="pt-6">
                          <span className="text-gray-400 text-lg">&gt;</span>
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                            End date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal h-9"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {endDate ? (
                                  endDate.toLocaleDateString()
                                ) : (
                                  <span className="text-gray-500">
                                    End date
                                  </span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-auto p-0"
                              align="start"
                            >
                              <Calendar
                                mode="single"
                                selected={endDate}
                                onSelect={date => {
                                  setEndDate(date);
                                  setActivityCurrentPage(1);
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        {(startDate || endDate) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 mt-6"
                            onClick={() => {
                              setStartDate(undefined);
                              setEndDate(undefined);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                {activitiesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">
                        Loading activities...
                      </p>
                    </div>
                  </div>
                ) : activitiesError ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 mb-4">
                        {activitiesError}
                      </p>
                      <Button
                        onClick={() => {
                          setActivities([]);
                          setActivitiesLoading(false);
                        }}
                        variant="outline"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                ) : filteredActivities.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        No activities found for this campaign
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="overflow-x-auto bg-white dark:bg-gray-900 rounded-lg hide-scrollbar"
                      style={{
                        maxWidth: "100%",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      <style
                        dangerouslySetInnerHTML={{
                          __html: `
                            .hide-scrollbar::-webkit-scrollbar {
                              display: none;
                              width: 0;
                              height: 0;
                            }
                            .hide-scrollbar {
                              -ms-overflow-style: none;
                              scrollbar-width: none;
                            }
                          `,
                        }}
                      />
                      <Table className="min-w-full border-collapse">
                        <TableHeader>
                          <TableRow className="bg-gray-100 dark:bg-gray-800 border-0">
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              DATE
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              TYPE
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              PERSON
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              STATUS
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              DESCRIPTION
                            </TableHead>
                            <TableHead className="text-gray-700 dark:text-gray-300 font-semibold uppercase text-sm py-4 px-4 border-0 border-b border-gray-200 dark:border-gray-700">
                              DETAILS
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedActivities.map(
                            (activity: any, index: number) => (
                              <TableRow
                                key={
                                  activity.id || activity.activity_id || index
                                }
                                className="bg-white dark:bg-gray-900 border-0 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                              >
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  {activity.createdAt ||
                                  activity.created_at ||
                                  activity.date
                                    ? new Date(
                                        activity.createdAt ||
                                          activity.created_at ||
                                          activity.date
                                      ).toLocaleString()
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  {activity.type ||
                                    activity.activity_type ||
                                    "-"}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  {activity.person?.name ||
                                    activity.full_name ||
                                    activity.lead_name ||
                                    activity.lead?.full_name ||
                                    "-"}
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <span
                                    className={`px-2 py-1 rounded text-xs ${
                                      activity.campaignStatus === "active" ||
                                      activity.status === "success" ||
                                      activity.status === "completed"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : activity.campaignStatus ===
                                              "paused" ||
                                            activity.status === "failed" ||
                                            activity.status === "error"
                                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                    }`}
                                  >
                                    {activity.campaignStatus ||
                                      activity.status ||
                                      "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0 max-w-xs">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="block truncate cursor-help">
                                          {activity.description ||
                                            activity.message ||
                                            activity.details ||
                                            "-"}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-md">
                                        <p className="whitespace-pre-wrap break-words">
                                          {activity.description ||
                                            activity.message ||
                                            activity.details ||
                                            "-"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-gray-700 dark:text-gray-300 py-4 px-4 border-0">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedActivity(activity);
                                      setIsActivityDetailsModalOpen(true);
                                    }}
                                  >
                                    <ExternalLink className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Activity Pagination */}
                    <div className="flex items-center justify-between pt-4">
                      {/* Left: Rows per page */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Rows per page:
                        </span>
                        <Select
                          value={activityItemsPerPage.toString()}
                          onValueChange={value => {
                            setActivityItemsPerPage(Number(value));
                            setActivityCurrentPage(1);
                          }}
                        >
                          <SelectTrigger className="w-20 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Middle: Results Summary */}
                      {!activitiesLoading && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Showing {paginatedActivities.length} of{" "}
                          {filteredActivities.length} activities
                        </div>
                      )}

                      {/* Right: Pagination Controls */}
                      {activityTotalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {activityCurrentPage} of {activityTotalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActivityCurrentPage(1)}
                            disabled={activityCurrentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActivityCurrentPage(prev =>
                                Math.max(1, prev - 1)
                              )
                            }
                            disabled={activityCurrentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActivityCurrentPage(prev =>
                                Math.min(activityTotalPages, prev + 1)
                              )
                            }
                            disabled={
                              activityCurrentPage === activityTotalPages
                            }
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setActivityCurrentPage(activityTotalPages)
                            }
                            disabled={
                              activityCurrentPage === activityTotalPages
                            }
                            className="h-8 w-8 p-0"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Message Content Modal */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Message Content
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedNodeData?.value?.label || "Node Configuration"}
            </DialogDescription>
          </DialogHeader>

          {selectedNodeData && (
            <div className="space-y-6">
              {/* Subject */}
              {selectedNodeData.value?.subject && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subject
                  </Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedNodeData.value.subject}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Message */}
              {selectedNodeData.value?.message && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedNodeData.value.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Alternative Message */}
              {selectedNodeData.value?.alternativeMessage && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alternative Message
                  </Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
                      {selectedNodeData.value.alternativeMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* Timer Information */}
              {selectedNodeData.value?.count !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Delay
                  </Label>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Wait {selectedNodeData.value.count}{" "}
                      {selectedNodeData.value.unit?.toLowerCase() || "hours"}
                    </p>
                  </div>
                </div>
              )}

              {/* No content message */}
              {!selectedNodeData.value?.message &&
                !selectedNodeData.value?.subject &&
                !selectedNodeData.value?.alternativeMessage &&
                selectedNodeData.value?.count === undefined && (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      No message content configured for this node.
                    </p>
                  </div>
                )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => setIsMessageModalOpen(false)}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activity Details Modal */}
      <Dialog
        open={isActivityDetailsModalOpen}
        onOpenChange={setIsActivityDetailsModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          {selectedActivity && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={selectedActivity.person?.profile_pic_url}
                      alt={selectedActivity.person?.name}
                    />
                    <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-lg">
                      {selectedActivity.person?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "N/A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      {selectedActivity.person?.name || "-"}
                    </DialogTitle>
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Briefcase className="h-4 w-4" />
                        <span>{selectedActivity.person?.position || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Building className="h-4 w-4" />
                        <span>{selectedActivity.person?.company || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span>{selectedActivity.person?.location || "-"}</span>
                      </div>
                    </div>
                    {selectedActivity.person?.headline && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                        {selectedActivity.person.headline}
                      </p>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Current Position and Company Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Position
                      </Label>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedActivity.person?.position || "-"}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Company
                      </Label>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedActivity.person?.company || "-"}
                    </p>
                  </div>
                </div>

                {/* Campaign Section */}
                {selectedActivity.campaignName && (
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                        Campaign:{" "}
                      </span>
                      <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 ml-1">
                        {selectedActivity.campaignName}
                      </span>
                    </div>
                  </div>
                )}

                {/* Activity Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">
                      Activity
                    </Label>
                    <Label className="text-base font-semibold text-gray-900 dark:text-white">
                      Date
                    </Label>
                  </div>
                  <div className="space-y-2">
                    {activities
                      .filter(
                        (act: any) =>
                          act.person?.name === selectedActivity.person?.name ||
                          act.leadId === selectedActivity.leadId
                      )
                      .map((act: any, idx: number) => (
                        <div
                          key={act.id || idx}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                        >
                          <span className="text-sm text-gray-900 dark:text-white">
                            {act.description || act.message || act.type || "-"}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {act.createdAt || act.created_at || act.date
                              ? new Date(
                                  act.createdAt || act.created_at || act.date
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
