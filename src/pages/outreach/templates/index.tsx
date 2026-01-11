"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import getNode from "@/components/template/nodes/node";
import getTimer from "@/components/template/nodes/timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/common/navigation";
import { TemplatesService } from "@/services/templatesService";
import { Template, TemplateFilters } from "@/types/templates";
import {
  Plus,
  Search,
  Eye,
  MessageSquare,
  Clock,
  FileText,
  Settings,
  RefreshCw,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Type definitions - using imported types from templates.ts

// Demo template for UI consistency when no real data is available
const demoTemplate: Template = {
  id: "demo-template",
  name: "Pay per appointment offer",
  sequence_type: "LINKEDIN",
  status: "active",
  created_at: "2025-07-22T10:41:40.655Z",
  updated_at: "2025-07-22T10:41:40.655Z",
  usage_count: 1247,
  success_rate: 23.4,
  sequence: [
    {
      id: 1,
      type: "MESSAGE",
      name: "Send Message",
      data: {
        message_template:
          "Hey {{first_name}},\n\nWe're trying something new — no upfront fees. You only pay after we set a qualified meeting you're happy with.\n\nSound good? Let me know and we'll kick things off ASAP.",
        alternative_message:
          "Hey,\n\nWe're trying something new — no upfront fees. You only pay after we set a qualified meeting you're happy with.\n\nSound good? Let me know and we'll kick things off ASAP.",
      },
    },
    {
      id: 2,
      type: "DELAY",
      name: "Delay",
      data: {
        delay_unit: "HR",
        delay_value: 0,
      },
    },
    {
      id: 4,
      type: "END",
      name: "End of the sequence",
      data: {
        message_template: "",
        alternative_message: "",
      },
    },
  ],
  tags: ["sales", "appointment", "linkedin"],
  description:
    "A high-converting template for setting up paid appointments with no upfront fees.",
  diagram: {},
};

const statusOptions = [
  {
    value: "active",
    label: "Active",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200",
  },
  {
    value: "draft",
    label: "Draft",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900 dark:hover:text-yellow-200",
  },
  {
    value: "paused",
    label: "Paused",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900 dark:hover:text-orange-200",
  },
  {
    value: "archived",
    label: "Archived",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-900 dark:hover:text-gray-200",
  },
];

export default function TemplatesPage() {
  // const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters: TemplateFilters = {
        page: currentPage,
        limit: itemsPerPage,
        order_by: sortBy,
        sort_type: sortOrder as "asc" | "desc",
      };

      const response = await TemplatesService.getTemplates(filters);

      // Transform API data to match UI expectations
      const transformedTemplates = response.templates.map(template => ({
        ...template,
        status: template.status || "active",
      }));

      setTemplates(transformedTemplates);
      setFilteredTemplates(transformedTemplates);
      setTotalPages(response.totalPages);
      setTotalTemplates(response.total);
    } catch (err) {
      setError("Failed to load templates. Please try again.");
      // Use demo template for UI consistency
      setTemplates([demoTemplate]);
      setFilteredTemplates([demoTemplate]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder]);

  // Fetch templates on component mount and when filters change
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Client-side filtering for search, type, and status
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        template => template.status === selectedStatus
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedStatus]);

  // Server-side pagination - use templates directly from API
  const paginatedTemplates = templates;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus]);

  const handleCreateTemplate = () => {
    window.location.href = "/outreach/templates/create";
  };

  // Removed edit functionality

  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setIsPreviewModalOpen(true);
  };

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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find(s => s.value === status);
    return (
      statusConfig || {
        label: status,
        color:
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-gray-900 dark:hover:text-gray-200",
      }
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSequencePreview = (sequence: any[]) => {
    const messageSteps = sequence.filter(step => step.type === "MESSAGE");
    return messageSteps.length > 0
      ? (messageSteps[0].data?.message_template?.substring(0, 100) ||
          "No message content") + "..."
      : "No message content";
  };

  const getSequenceComplexity = (sequence: any[]) => {
    const stepCount = sequence.length;
    if (stepCount <= 3)
      return {
        label: "Simple",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200",
      };
    if (stepCount <= 6)
      return {
        label: "Medium",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-100 hover:text-yellow-800 dark:hover:bg-yellow-900 dark:hover:text-yellow-200",
      };
    return {
      label: "Complex",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-orange-100 hover:text-orange-800 dark:hover:bg-orange-900 dark:hover:text-orange-200",
    };
  };

  const getSequenceStepsCount = (sequence: any[]) => {
    return sequence.length;
  };

  // Convert template diagram to ReactFlow nodes and edges for visualization
  const convertTemplateToFlow = useCallback((template: Template) => {
    // Use the diagram data if available, otherwise create a simple flow from sequence
    if (template.diagram && template.diagram.nodes && template.diagram.edges) {
      return {
        nodes: template.diagram.nodes,
        edges: template.diagram.edges,
      };
    }

    // Fallback: create nodes from sequence data
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add start node
    nodes.push({
      id: "start",
      type: "root",
      position: { x: 250, y: 50 },
      data: {
        command: "NONE",
        value: null,
      },
    });

    let yPosition = 150;
    let previousNodeId = "start";

    template.sequence.forEach((step, index) => {
      const nodeId = `step-${index}`;

      // Determine node type and data based on step
      let nodeType = "unidirectional";
      let command = "MESSAGE";
      let value = null;

      switch (step.type) {
        case "INVITE":
        case "INVITE_BY_EMAIL":
          command = "INVITE";
          value = {
            label: step.name,
            message: step.data?.message_template || "",
            alternativeMessage: step.data?.alternative_message || "",
          };
          break;
        case "MESSAGE":
        case "INEMAIL":
          command = "MESSAGE";
          value = {
            label: step.name,
            message: step.data?.message_template || "",
            alternativeMessage: step.data?.alternative_message || "",
            subject: step.data?.subject || "",
          };
          break;
        case "DELAY":
          command = "DELAY";
          value = {
            count: step.data?.delay_value || 0,
            unit: step.data?.delay_unit || "Hours",
            label: step.name,
          };
          nodeType = "timer";
          break;
        case "END":
          command = "END";
          value = { label: step.name };
          nodeType = "leaf";
          break;
        default:
          command = "MESSAGE";
          value = {
            label: step.name,
            message: step.data?.message_template || "",
            alternativeMessage: step.data?.alternative_message || "",
          };
      }

      // Create node
      nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 250, y: yPosition },
        data: {
          command,
          value,
        },
      });

      // Create edge from previous node
      edges.push({
        id: `edge-${previousNodeId}-${nodeId}`,
        source: previousNodeId,
        target: nodeId,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#475569",
        },
        style: {
          stroke: "#475569",
          strokeWidth: 3,
        },
      });

      previousNodeId = nodeId;
      yPosition += 120;
    });

    return { nodes, edges };
  }, []);

  // Create node types for ReactFlow (read-only versions with message modal)
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

  // Removed select/import/export functionality

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <div className="sticky top-0 z-50 p-4">
        <Navigation activePage="Templates" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {/* Filters and Search */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statusOptions.map(status => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Created</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleCreateTemplate}
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border-red-200 dark:border-red-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTemplates}
                  className="ml-auto text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden relative"
              >
                {/* Top Action Bar Skeleton */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </div>

                <CardHeader className="pb-4 pt-6">
                  <div className="flex items-start gap-3">
                    {/* Icon Skeleton */}
                    <div className="flex-shrink-0">
                      <Skeleton className="h-6 w-6" />
                    </div>

                    {/* Title and Status Skeleton */}
                    <div className="flex-1 min-w-0">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 pb-4">
                  {/* Sequence Information Skeleton */}
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  </div>

                  {/* Message Preview Skeleton */}
                  <div className="mb-4">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start gap-2 mb-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>

                  {/* Footer Skeleton */}
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Templates Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedTemplates.map(template => {
              const statusConfig = getStatusBadge(template.status || "active");

              return (
                <Card
                  key={template.id}
                  className={cn(
                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group overflow-hidden relative"
                  )}
                >
                  {/* Top Action Bar */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Card Header with Icon and Status */}
                  <CardHeader className="pb-4 pt-6">
                    <div className="flex items-start gap-3">
                      {/* Large Icon */}
                      <div className="flex-shrink-0">
                        <span className="text-lg">💼</span>
                      </div>

                      {/* Title and Status */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors mb-2 line-clamp-2 leading-tight">
                          {template.name}
                        </CardTitle>
                        <Badge
                          className={cn(
                            "text-xs font-medium",
                            statusConfig.color
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 pb-4">
                    {/* Sequence Information */}
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getSequenceStepsCount(template.sequence)} steps
                          </span>
                        </div>
                        <Badge
                          className={cn(
                            "text-xs font-medium",
                            getSequenceComplexity(template.sequence).color
                          )}
                        >
                          {getSequenceComplexity(template.sequence).label}
                        </Badge>
                      </div>
                    </div>

                    {/* Sequence Flow Preview */}
                    <div className="mb-4 h-[180px] w-full rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800 relative">
                      <ReactFlow
                        nodes={convertTemplateToFlow(template).nodes}
                        edges={convertTemplateToFlow(template).edges}
                        nodeTypes={nodeTypes}
                        fitView
                        className="bg-white dark:bg-gray-800"
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnDrag={false}
                        zoomOnScroll={false}
                        preventScrolling={true}
                        minZoom={0.2}
                        maxZoom={0.8}
                        defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
                      >
                        <Background color="transparent" gap={0} size={0} />
                      </ReactFlow>
                    </div>

                    {/* Message Preview */}
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                        <div className="flex items-start gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Preview
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">
                          {getSequencePreview(template.sequence)}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Created</span>
                        <span>{formatDate(template.created_at)}</span>
                      </div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-gray-600 dark:text-gray-300 font-medium">
                        LinkedIn
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalTemplates > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Show
              </span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={value =>
                  handleItemsPerPageChange(parseInt(value))
                }
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
              <span className="text-sm text-gray-600 dark:text-gray-300">
                per page
              </span>
            </div>

            {/* Pagination info */}
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalTemplates)} of{" "}
              {totalTemplates} templates
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
              >
                Previous
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={cn(
                        "w-8 h-8 p-0",
                        currentPage === pageNum
                          ? "bg-gray-900 hover:bg-gray-800 text-white"
                          : "bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                      )}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && totalTemplates === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery || selectedStatus !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Get started by creating your first template."}
              </p>
              <Button
                onClick={handleCreateTemplate}
                className="bg-gray-900 hover:bg-gray-800 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedTemplate ? "Edit Template" : "Create New Template"}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedTemplate
                ? "Update your template settings and content."
                : "Create a new outreach template for your campaigns."}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="sequence">Sequence</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    defaultValue={selectedTemplate?.name || ""}
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your template..."
                  defaultValue={selectedTemplate?.description || ""}
                  className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  defaultValue={selectedTemplate?.tags?.join(", ") || ""}
                  className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                />
              </div>
            </TabsContent>

            <TabsContent value="sequence" className="space-y-6 mt-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Sequence Builder
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Visual sequence builder coming soon. For now, you can create
                  basic templates.
                </p>
                <Button
                  variant="outline"
                  className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Sequence Builder
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedTemplate?.status || "draft"}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select defaultValue="normal">
                    <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-6 mt-6">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Template Preview
                </h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Message 1
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Hey {"{{first_name}}"},<br />
                      <br />
                      We&apos;re trying something new — no upfront fees. You
                      only pay after we set a qualified meeting you&apos;re
                      happy with.
                      <br />
                      <br />
                      Sound good? Let me know and we&apos;ll kick things off
                      ASAP.
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                        Delay
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Wait for response or timeout
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setIsCreateModalOpen(false)}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {selectedTemplate ? "Update Template" : "Create Template"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="!w-[47.5vw] !max-w-none !sm:max-w-none max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Template Preview
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTemplate && (
            <div className="space-y-6">
              {/* Template Info */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">💼</span>
                      <Badge
                        className={cn(
                          "text-xs",
                          getStatusBadge(selectedTemplate.status || "active")
                            .color
                        )}
                      >
                        {
                          getStatusBadge(selectedTemplate.status || "active")
                            .label
                        }
                      </Badge>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedTemplate.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedTemplate.sequence.length} steps
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-xs font-medium",
                          getSequenceComplexity(selectedTemplate.sequence).color
                        )}
                      >
                        {getSequenceComplexity(selectedTemplate.sequence).label}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Created {formatDate(selectedTemplate.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequence Visualization */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sequence Flow ({selectedTemplate.sequence.length} steps)
                </h4>
                <div
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden"
                  style={{ height: "600px" }}
                >
                  <ReactFlow
                    nodes={convertTemplateToFlow(selectedTemplate).nodes}
                    edges={convertTemplateToFlow(selectedTemplate).edges}
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
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <Button
              variant="outline"
              onClick={() => setIsPreviewModalOpen(false)}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}
