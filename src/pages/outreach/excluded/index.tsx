import { useState, useEffect, useCallback } from "react";
import NextImage from "next/image";
import { apiCall } from "@/lib/apiCall";
import config from "@/configs/outreach";
import isSuccessful from "@/lib/status";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  Search,
  Download,
  Settings,
  ChevronDown,
  Filter,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  ChevronUp,
  ChevronDown as ChevronDownIcon,
  Linkedin,
  MessageSquare,
  X,
  Star,
  Activity,
  DollarSign,
  StickyNote,
  CheckSquare,
  ClipboardList,
} from "lucide-react";

export default function InvitationsPage() {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeFilters, setActiveFilters] = useState<{
    [key: string]: string[];
  }>({});
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
  const [isLeadDetailModalOpen, setIsLeadDetailModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [modalActiveTab, setModalActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [excludedConnections, setExcludedConnections] = useState<any[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [filteredOptions, setFilteredOptions] = useState<{
    [key: string]: string[];
  }>({});
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"CONNECTION" | "LEADS">(
    "CONNECTION"
  );
  const [visibleColumns, setVisibleColumns] = useState<{
    [key: string]: boolean;
  }>({
    id: false,
    name: true,
    position: true,
    campaign: true,
    industry: true,
    company: true,
    location: true,
    tag: false,
    note: false,
    actions: true,
  });

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "id",
    "name",
    "position",
    "campaign",
    "industry",
    "company",
    "location",
    "tag",
    "note",
    "actions",
  ]);

  const [leadToggles, setLeadToggles] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Simulate loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // Skeleton row component that matches the actual table structure
  const SkeletonRow = () => (
    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-gray-200 dark:border-gray-700">
      <TableCell className="text-gray-900 dark:text-white">
        <Skeleton className="h-4 w-4 rounded" />
      </TableCell>
      {columnOrder.map(columnKey => {
        const column = columns.find(col => col.key === columnKey);
        if (!column || !visibleColumns[columnKey]) return null;

        return (
          <TableCell
            key={columnKey}
            className={`text-gray-900 dark:text-white ${
              columnKey === "actions"
                ? "min-w-[120px] w-[120px]"
                : columnKey === "name"
                  ? "w-[200px]"
                  : columnKey === "jobTitle"
                    ? "w-[150px]"
                    : columnKey === "industry"
                      ? "w-[120px]"
                      : columnKey === "company"
                        ? "w-[150px]"
                        : columnKey === "location"
                          ? "w-[120px]"
                          : columnKey === "connectedOn"
                            ? "w-[180px]"
                            : columnKey === "tag"
                              ? "w-[100px]"
                              : columnKey === "note"
                                ? "w-[100px]"
                                : "w-[100px]"
            }`}
          >
            {columnKey === "name" ? (
              <div className="flex items-center space-x-3">
                <Skeleton className="w-8 h-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ) : columnKey === "jobTitle" ? (
              <Skeleton className="h-4 w-28" />
            ) : columnKey === "industry" ? (
              <Skeleton className="h-4 w-24" />
            ) : columnKey === "company" ? (
              <Skeleton className="h-4 w-32" />
            ) : columnKey === "location" ? (
              <Skeleton className="h-4 w-28" />
            ) : columnKey === "connectedOn" ? (
              <Skeleton className="h-4 w-36" />
            ) : columnKey === "tag" ? (
              <div className="flex items-center space-x-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ) : columnKey === "note" ? (
              <Skeleton className="h-4 w-20" />
            ) : columnKey === "actions" ? (
              <div className="flex items-center space-x-3 min-w-[120px]">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ) : (
              <Skeleton className="h-4 w-16" />
            )}
          </TableCell>
        );
      })}
    </TableRow>
  );

  // Fetch excluded connections from API
  const fetchExcludedConnections = useCallback(async () => {
    try {
      setIsLoading(true);

      // Build filter string from active filters
      const filterParams = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, values]) => {
        if (values && values.length > 0) {
          filterParams.append(key.toLowerCase(), values.join(","));
        }
      });
      const filterString = filterParams.toString();

      const { data, status } = await apiCall({
        url: config.getExcludedList,
        applyDefaultDomain: false,
        method: "post",
        body: {
          page: currentPage,
          limit: itemsPerPage,
          orderBy: "id",
          sortType: "desc",
          filter: filterString || null,
          search: searchQuery || null,
          type: activeTab === "CONNECTION" ? "connection" : "lead",
        },
      });

      if (isSuccessful(status)) {
        // Map the API response to match the expected frontend structure
        const mappedConnections = (data?.data || data || []).map(
          (connection: any) => ({
            id: connection.id || "-",
            name: connection.name,
            email: connection.email,
            company: connection.company || "-",
            jobTitle: connection.position || connection.headline || "-",
            industry: connection.industry || "-",
            campaign: connection.campaigns?.[0]?.name || "-",
            source: "LinkedIn", // Default source
            leadType: "Connection",
            leadScore: "Unknown",
            cityCountry: connection.location || "-",
            owner: "Me", // Default owner
            status: connection.is_excluded ? "Excluded" : "Active",
            priority: "Medium",
            connection: "Connected",
            profileImage: connection.profile_pic_url,
            profileUrl: connection.profile_url,
            headline: connection.headline || "-",
            connectedOn: connection.connected_on,
            tags: connection.tags || [],
            notes: connection.note || "-",
            is_excluded: connection.is_excluded || false,
            // Add other fields as needed
            firstName: connection.name?.split(" ")[0] || "",
            lastName: connection.name?.split(" ").slice(1).join(" ") || "",
            tagCount: connection.tags?.length || 0,
          })
        );
        setExcludedConnections(mappedConnections);
        setServerTotal(data?.total ?? mappedConnections.length);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, activeTab, activeFilters, searchQuery]);

  // Load excluded connections on component mount and when page/tab changes
  useEffect(() => {
    fetchExcludedConnections();
  }, [
    currentPage,
    itemsPerPage,
    activeTab,
    activeFilters,
    searchQuery,
    fetchExcludedConnections,
  ]);

  // Initialize toggle states when excluded connections are loaded
  useEffect(() => {
    const initialToggles: { [key: string]: boolean } = {};
    excludedConnections.forEach(connection => {
      initialToggles[connection.id] = connection.is_excluded || false;
    });
    setLeadToggles(initialToggles);
  }, [excludedConnections]);

  const leads = excludedConnections;

  // Update connection function (same as connections page)
  const updateConnection = async (
    rowId: string,
    updateObject: { note?: string; tag_id?: string; is_excluded?: boolean }
  ) => {
    const { status } = await apiCall({
      url: config.updateConnection,
      method: "post",
      body: { id: rowId, ...updateObject },
      applyDefaultDomain: false,
    });
    if (!isSuccessful(status)) return;
  };

  // Handle toggle change for excluded connections
  const handleToggleChange = async (leadId: string) => {
    // Find the connection to get its current is_excluded state
    const connection = excludedConnections.find(conn => conn.id === leadId);
    const currentExcludedState = connection?.is_excluded || false;
    const nextValue = !currentExcludedState;

    setLeadToggles(prev => ({
      ...prev,
      [leadId]: nextValue,
    }));

    try {
      await updateConnection(leadId, { is_excluded: nextValue });

      if (nextValue) {
        // If toggling up (excluding), just update the is_excluded property
        setExcludedConnections(prev =>
          prev.map(connection =>
            connection.id === leadId
              ? { ...connection, is_excluded: nextValue }
              : connection
          )
        );
        ShowShortMessage("Connection excluded successfully", "success");
      } else {
        // If toggling down (including), remove the connection from excluded list
        setExcludedConnections(prev =>
          prev.filter(connection => connection.id !== leadId)
        );
        // Update server total count
        setServerTotal(prev => Math.max(0, prev - 1));
        ShowShortMessage("Connection removed from excluded list", "success");
      }
    } catch (error) {
      // Revert the toggle on error
      setLeadToggles(prev => ({
        ...prev,
        [leadId]: !nextValue,
      }));

      ShowShortMessage("Failed to update connection", "error");
    }
  };

  // Reset filters when switching tabs
  useEffect(() => {
    setActiveFilters({});
    setGlobalSearchTerm("");
  }, [activeTab]);

  // Main filters for the filter bar (8 filters as per image)
  const mainFilters = [
    {
      label: "Owner",
      options: [...new Set(leads.map(lead => lead?.owner).filter(Boolean))],
    },
    {
      label: "Industry",
      options: [...new Set(leads.map(lead => lead?.industry).filter(Boolean))],
    },
    {
      label: "Source",
      options: [...new Set(leads.map(lead => lead?.source).filter(Boolean))],
    },
    {
      label: "Job Title",
      options: [...new Set(leads.map(lead => lead.jobTitle))],
    },
    {
      label: "Company",
      options: [...new Set(leads.map(lead => lead.company))],
    },
    {
      label: "Position",
      options: [...new Set(leads.map(lead => lead.jobTitle))],
    },
    {
      label: "Country",
      options: [...new Set(leads.map(lead => lead.cityCountry))],
    },
  ];

  // Additional filters for the More Filters modal (empty since all filters are now main filters)
  const moreFilters: Array<{ label: string; options: string[] }> = [];

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(lead => lead.id));
    }
  };

  const handleFilterChange = (filterLabel: string, option: string) => {
    setActiveFilters(prev => {
      const currentOptions = prev[filterLabel] || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(opt => opt !== option)
        : [...currentOptions, option];

      const updated = { ...prev };
      if (newOptions.length > 0) {
        updated[filterLabel] = newOptions;
      } else {
        delete updated[filterLabel];
      }
      return updated;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setGlobalSearchTerm("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    const filterCount = Object.values(activeFilters).filter(
      filters => filters && filters.length > 0
    ).length;
    const searchCount = searchQuery ? 1 : 0;
    return filterCount + searchCount;
  };

  const handleSearchChange = (filterLabel: string, searchTerm: string) => {
    setSearchTerms(prev => ({ ...prev, [filterLabel]: searchTerm }));

    // Filter options based on search term
    const filter = [...mainFilters, ...moreFilters].find(
      f => f.label === filterLabel
    );
    if (filter) {
      const filtered = filter.options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(prev => ({ ...prev, [filterLabel]: filtered }));
    }
  };

  const handleGlobalSearch = (searchTerm: string) => {
    setGlobalSearchTerm(searchTerm);
    setSearchQuery(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Filter leads based on global search and active filters
  const getFilteredLeads = () => {
    let filtered = leads;

    // Apply global search
    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(lead => {
        // Search in name (exact match or partial match)
        const name = lead.name?.toLowerCase() || "";
        if (name.includes(searchTerm)) {
          return true;
        }

        // Search in email (exact match or partial match)
        const email = lead.email?.toLowerCase() || "";
        if (email.includes(searchTerm)) {
          return true;
        }

        // Search in company (exact match or partial match)
        const company = lead.company?.toLowerCase() || "";
        if (company.includes(searchTerm)) {
          return true;
        }

        // Search in job title (exact match or partial match)
        const jobTitle = lead.jobTitle?.toLowerCase() || "";
        if (jobTitle.includes(searchTerm)) {
          return true;
        }

        // Search in industry (exact match or partial match)
        const industry = lead.industry?.toLowerCase() || "";
        if (industry.includes(searchTerm)) {
          return true;
        }

        // Search in location (exact match or partial match)
        const location = lead.cityCountry?.toLowerCase() || "";
        if (location.includes(searchTerm)) {
          return true;
        }

        return false;
      });
    }

    // Apply active filters
    Object.entries(activeFilters).forEach(([filterLabel, selectedOptions]) => {
      if (selectedOptions.length > 0) {
        filtered = filtered.filter(lead => {
          switch (filterLabel) {
            case "Status":
              return selectedOptions.includes(lead.status);
            case "Priority":
              return selectedOptions.includes(lead.priority);
            case "Industry":
              return selectedOptions.includes(lead.industry);
            case "Source":
              return selectedOptions.includes(lead.source);
            case "Lead Type":
              return selectedOptions.includes(lead.leadType);
            case "Lead Score":
              return selectedOptions.includes(lead.leadScore);
            case "Owner":
              return selectedOptions.includes(lead.owner);
            case "Campaign":
              return selectedOptions.includes(lead.campaign);
            case "Company":
              return selectedOptions.includes(lead.company);
            case "Position":
              return selectedOptions.includes(lead.jobTitle);
            case "Country":
              return selectedOptions.includes(lead.cityCountry);
            case "Connection":
              return selectedOptions.includes(lead.connection);
            case "Tags":
              return selectedOptions.some(tag =>
                lead.tags.some((leadTag: any) => leadTag.name === tag)
              );
            default:
              return true;
          }
        });
      }
    });

    return filtered;
  };

  // const handleOptionSelect = (filterLabel: string, option: string) => {
  //   handleFilterChange(filterLabel, option);
  //   // Clear search after selection
  //   setSearchTerms(prev => ({ ...prev, [filterLabel]: "" }));
  //   setFilteredOptions(prev => ({ ...prev, [filterLabel]: [] }));
  // };

  const handleSelectAllFilter = (filterLabel: string) => {
    const filter = [...mainFilters, ...moreFilters].find(
      f => f.label === filterLabel
    );
    if (filter) {
      setActiveFilters(prev => ({
        ...prev,
        [filterLabel]: filter.options,
      }));
    }
  };

  const handleClearAllFilter = (filterLabel: string) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      delete updated[filterLabel];
      return updated;
    });
  };

  const columns = [
    { key: "id", label: "ID", required: false },
    { key: "name", label: "Name", required: true },
    { key: "industry", label: "Industry", required: false },
    { key: "company", label: "Company", required: false },
    { key: "jobTitle", label: "Job Title", required: false },
    { key: "location", label: "Location", required: false },
    { key: "connectedOn", label: "Connected On", required: false },
    { key: "tag", label: "Tag", required: false },
    { key: "note", label: "Note", required: false },
    { key: "status", label: "Status", required: false },
    { key: "priority", label: "Priority", required: false },
    { key: "source", label: "Source", required: false },
    { key: "leadType", label: "Lead Type", required: false },
    { key: "leadScore", label: "Lead Score", required: false },
    { key: "owner", label: "Owner", required: false },
    { key: "lastInteraction", label: "Last Interaction", required: false },
    { key: "connection", label: "Connection", required: false },
    { key: "dealValue", label: "Deal Value", required: false },
    { key: "expectedCloseDate", label: "Expected Close", required: false },
    { key: "probability", label: "Probability", required: false },
    { key: "actions", label: "Actions", required: true },
  ];

  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData("text/plain"));

    if (dragIndex !== dropIndex) {
      const newOrder = [...columnOrder];
      const draggedItem = newOrder[dragIndex];
      newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, draggedItem);
      setColumnOrder(newOrder);
    }
  };

  const moveColumn = (index: number, direction: "up" | "down") => {
    const newOrder = [...columnOrder];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newOrder.length) {
      [newOrder[index], newOrder[newIndex]] = [
        newOrder[newIndex],
        newOrder[index],
      ];
      setColumnOrder(newOrder);
    }
  };

  const showAllColumns = () => {
    const allVisible = columns.reduce(
      (acc, col) => {
        acc[col.key] = true;
        return acc;
      },
      {} as { [key: string]: boolean }
    );
    setVisibleColumns(allVisible);
  };

  const resetColumns = () => {
    setVisibleColumns({
      id: false,
      name: true,
      jobTitle: true,
      campaign: true,
      industry: true,
      company: true,
      position: true,
      location: false,
      tag: false,
      note: false,
      actions: true,
    });
  };

  const handleOpenLeadDetail = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailModalOpen(true);
    setModalActiveTab("overview");
  };

  // Get filtered leads (applies to the current page data returned by the server)
  const filteredLeads = getFilteredLeads();
  // Since the server already paginates, the current page's rows are simply the filtered results
  const currentLeads = filteredLeads;

  // Total items/pages come from the server so the paginator can jump across pages
  const totalItems = serverTotal || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <AuthGuard>
      <AppLayout activePage="Outreach" className="!p-0">
        <div className="flex flex-col h-full">
          {/* 
          Three Main Sections:
          1. Top Navigation (handled by AppLayout/Navigation component)
          2. Content Header (search bar and action buttons)
          3. Main Content Area (leads table and data)
        */}

          {/* Section 3: Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/30 dark:border-gray-700/30 rounded-2xl shadow-sm relative">
            <div className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
              {/* Table Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ">
                {/* Tab Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Excluded
                    </h1>
                  </div>

                  <div className="flex items-center space-x-3">
                    {["CONNECTION", "LEADS"].map(tab => (
                      <Button
                        key={tab}
                        variant={activeTab === tab ? "default" : "ghost"}
                        size="sm"
                        onClick={() =>
                          setActiveTab(tab as "CONNECTION" | "LEADS")
                        }
                        className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-sm hover:shadow-md ${
                          activeTab === tab
                            ? "bg-primary/90 hover:bg-primary/80 text-primary-foreground backdrop-blur-sm shadow-md"
                            : "text-muted-foreground hover:text-foreground hover:bg-card/40 backdrop-blur-sm"
                        }`}
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Search and Filters */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="relative w-80">
                      <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                      <Input
                        placeholder="Search Excluded..."
                        value={globalSearchTerm}
                        onChange={e => handleGlobalSearch(e.target.value)}
                        className="block py-2 pr-10 pl-10 w-full leading-5 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {globalSearchTerm && (
                        <button
                          onClick={() => handleGlobalSearch("")}
                          className="absolute right-3 top-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    {(globalSearchTerm || getActiveFilterCount() > 0) && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {filteredLeads.length} of {leads.length}{" "}
                        {activeTab.toLowerCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 items-center">
                    <div className="flex items-center gap-2">
                      {/* Main Filters */}
                      {mainFilters.map(filter => (
                        <DropdownMenu key={filter.label}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex items-center px-1 py-0.5 space-x-0.5 text-xs font-medium rounded-full border-2 transition-all duration-200 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                                activeFilters[filter.label]
                                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                                  : ""
                              }`}
                            >
                              <Filter className="w-2.5 h-2.5" />
                              <span className="capitalize text-xs">
                                {filter.label}
                              </span>
                              {activeFilters[filter.label] && (
                                <Badge
                                  variant="secondary"
                                  className="h-3 px-0.5 text-xs"
                                >
                                  {activeFilters[filter.label].length}
                                </Badge>
                              )}
                              <ChevronDown className="w-2.5 h-2.5 transition-transform duration-200" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="absolute left-0 top-full z-50 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                  {filter.label}
                                  {activeFilters[filter.label] && (
                                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                                      ({activeFilters[filter.label].length}{" "}
                                      selected)
                                    </span>
                                  )}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleSelectAllFilter(filter.label)
                                    }
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleClearAllFilter(filter.label)
                                    }
                                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium"
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 w-2 h-3 text-gray-400 dark:text-gray-500 transform -translate-y-1/2" />
                                <Input
                                  placeholder={`Search ${filter.label.toLowerCase()}...`}
                                  value={searchTerms[filter.label] || ""}
                                  onChange={e =>
                                    handleSearchChange(
                                      filter.label,
                                      e.target.value
                                    )
                                  }
                                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {searchTerms[filter.label] && (
                                  <button
                                    onClick={() =>
                                      handleSearchChange(filter.label, "")
                                    }
                                    className="absolute right-3 top-1/2 w-3 h-3 text-gray-400 dark:text-gray-500 transform -translate-y-1/2 hover:text-gray-600 dark:hover:text-gray-300"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="overflow-y-auto max-h-48">
                              <div className="relative">
                                {(() => {
                                  const optionsToShow =
                                    searchTerms[filter.label] &&
                                    filteredOptions[filter.label]
                                      ? filteredOptions[filter.label]
                                      : filter.options;

                                  if (optionsToShow.length === 0) {
                                    return (
                                      <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No {filter.label.toLowerCase()} found
                                      </div>
                                    );
                                  }

                                  return optionsToShow.map(option => (
                                    <button
                                      key={option}
                                      onClick={() =>
                                        handleFilterChange(filter.label, option)
                                      }
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 text-gray-700 dark:text-gray-300"
                                    >
                                      <div className="flex items-center space-x-2">
                                        {filter.label === "Status" ? (
                                          activeFilters[filter.label]?.includes(
                                            option
                                          ) ? (
                                            <svg
                                              xmlns="http://www.w3.org/2000/svg"
                                              width="24"
                                              height="24"
                                              viewBox="0 0 24 24"
                                              fill="none"
                                              stroke="currentColor"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              className="lucide lucide-check-circle w-3 h-3 text-green-600"
                                            >
                                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                              <path d="m9 11 3 3L22 4"></path>
                                            </svg>
                                          ) : (
                                            <div className="w-3 h-3"></div>
                                          )
                                        ) : filter.label === "Owner" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-users w-3 h-3 text-blue-600"
                                          >
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                            <circle
                                              cx="9"
                                              cy="7"
                                              r="4"
                                            ></circle>
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                          </svg>
                                        ) : filter.label === "Tags" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-zap w-3 h-3 text-purple-600"
                                          >
                                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                                          </svg>
                                        ) : filter.label === "Priority" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-star w-3 h-3 text-red-600"
                                          >
                                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                          </svg>
                                        ) : filter.label === "Industry" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-building2 w-3 h-3 text-indigo-600"
                                          >
                                            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"></path>
                                            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"></path>
                                            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"></path>
                                            <path d="M10 6h4"></path>
                                            <path d="M10 10h4"></path>
                                            <path d="M10 14h4"></path>
                                            <path d="M10 18h4"></path>
                                          </svg>
                                        ) : filter.label === "Source" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-target w-3 h-3 text-cyan-600"
                                          >
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="10"
                                            ></circle>
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="6"
                                            ></circle>
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="2"
                                            ></circle>
                                          </svg>
                                        ) : filter.label === "Lead Type" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-thermometer w-3 h-3 text-orange-600"
                                          >
                                            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                                          </svg>
                                        ) : filter.label === "Lead Score" ? (
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-thermometer w-3 h-3 text-orange-600"
                                          >
                                            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                                          </svg>
                                        ) : (
                                          <div className="w-5 h-5 bg-purple-100 rounded flex items-center justify-center">
                                            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                          </div>
                                        )}
                                        <span>{option}</span>
                                      </div>
                                    </button>
                                  ));
                                })()}
                              </div>
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ))}

                      {/* {filter.label === "Lead Score" ? (
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                                      <Input
                                        placeholder="Search lead score..."
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      {filter.options.map(option => (
                                        <button
                                          key={option}
                                          onClick={() =>
                                            handleFilterChange(
                                              filter.label,
                                              option
                                            )
                                          }
                                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 text-gray-700 rounded-md"
                                        >
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-thermometer w-4 h-4 text-orange-600"
                                          >
                                            <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
                                          </svg>
                                          <span>{option}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                ) : filter.label === "Company" ? (
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                                      <Input
                                        placeholder="Search companies..."
                                        value={searchTerms[filter.label] || ""}
                                        onChange={e =>
                                          handleSearchChange(
                                            filter.label,
                                            e.target.value
                                          )
                                        }
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    {searchTerms[filter.label] &&
                                      filteredOptions[filter.label] &&
                                      filteredOptions[filter.label].length >
                                        0 && (
                                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white">
                                          {filteredOptions[filter.label].map(
                                            option => (
                                              <button
                                                key={option}
                                                onClick={() =>
                                                  handleOptionSelect(
                                                    filter.label,
                                                    option
                                                  )
                                                }
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 text-gray-700"
                                              >
                                                {option}
                                              </button>
                                            )
                                          )}
                                        </div>
                                      )}
                                    {activeFilters[filter.label] &&
                                      activeFilters[filter.label].length >
                                        0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {activeFilters[filter.label].map(
                                            company => (
                                              <div
                                                key={company}
                                                className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
                                              >
                                                <span>{company}</span>
                                                <button
                                                  onClick={() =>
                                                    handleFilterChange(
                                                      filter.label,
                                                      company
                                                    )
                                                  }
                                                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="relative">
                                      <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                                      <Input
                                        placeholder={`Search ${filter.label.toLowerCase()}...`}
                                        value={searchTerms[filter.label] || ""}
                                        onChange={e =>
                                          handleSearchChange(
                                            filter.label,
                                            e.target.value
                                          )
                                        }
                                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      />
                                    </div>
                                    {searchTerms[filter.label] &&
                                      filteredOptions[filter.label] &&
                                      filteredOptions[filter.label].length >
                                        0 && (
                                        <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md bg-white">
                                          {filteredOptions[filter.label].map(
                                            option => (
                                              <button
                                                key={option}
                                                onClick={() =>
                                                  handleOptionSelect(
                                                    filter.label,
                                                    option
                                                  )
                                                }
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors duration-150 text-gray-700"
                                              >
                                                {option}
                                              </button>
                                            )
                                          )}
                                        </div>
                                      )}
                                    {activeFilters[filter.label] &&
                                      activeFilters[filter.label].length >
                                        0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {activeFilters[filter.label].map(
                                            item => (
                                              <div
                                                key={item}
                                                className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full text-xs"
                                              >
                                                <span>{item}</span>
                                                <button
                                                  onClick={() =>
                                                    handleFilterChange(
                                                      filter.label,
                                                      item
                                                    )
                                                  }
                                                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </div>
                                            )
                                          )}
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              onClick={() => {
                                moreFilters.forEach(filter => {
                                  if (activeFilters[filter.label]) {
                                    setActiveFilters(prev => {
                                      const updated = { ...prev };
                                      delete updated[filter.label];
                                      return updated;
                                    });
                                  }
                                });
                              }}
                            >
                              Clear All
                            </Button>
                            <Button
                              onClick={() => setIsMoreFiltersModalOpen(false)}
                            >
                              Apply Filters
                            </Button>
                          </div>
                        */}

                      {/* Advanced Columns Modal */}
                      <Dialog
                        open={isColumnsModalOpen}
                        onOpenChange={setIsColumnsModalOpen}
                      >
                        <DialogContent
                          className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden transition-all duration-300 ease-in-out transform opacity-100 scale-100 translate-y-0 p-0"
                          style={{
                            position: "fixed",
                            top: "50%",
                            right: "20px",
                            transform: "translateY(-50%)",
                            margin: 0,
                          }}
                        >
                          <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Customize Columns
                            </h3>
                          </div>

                          <div className="p-4">
                            <div className="p-2 mb-3 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="text-xs text-blue-700">
                                <strong>Note:</strong> Checkbox, Title, and
                                Actions columns are fixed and cannot be
                                reordered.
                              </p>
                              <p className="mt-1 text-xs text-blue-600">
                                Drag columns to reorder or use the up/down
                                arrows.
                              </p>
                              <p className="mt-1 text-xs text-green-600">
                                ✓ Settings are automatically saved and will
                                persist across page reloads.
                              </p>
                            </div>

                            <div className="overflow-y-auto space-y-2 max-h-96">
                              {columnOrder.map((columnKey, index) => {
                                const column = columns.find(
                                  col => col.key === columnKey
                                );
                                if (!column) return null;

                                const isVisible = visibleColumns[columnKey];
                                const isFirst = index === 0;
                                const isLast = index === columnOrder.length - 1;

                                return (
                                  <div
                                    key={columnKey}
                                    draggable={!column.required}
                                    onDragStart={e => handleDragStart(e, index)}
                                    onDragOver={handleDragOver}
                                    onDrop={e => handleDrop(e, index)}
                                    className={`flex items-center p-2 space-x-3 rounded-lg border transition-all duration-200 ease-in-out ${
                                      column.required
                                        ? "cursor-default"
                                        : "cursor-move"
                                    } border-gray-200 hover:bg-gray-50`}
                                  >
                                    <div
                                      className={
                                        column.required
                                          ? "cursor-default"
                                          : "cursor-move"
                                      }
                                    >
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>

                                    <button
                                      className="flex flex-1 items-center space-x-2 text-left"
                                      onClick={() =>
                                        !column.required &&
                                        handleColumnToggle(columnKey)
                                      }
                                    >
                                      {isVisible ? (
                                        <Eye className="w-4 h-4 text-green-600 transition-all duration-200 ease-in-out" />
                                      ) : (
                                        <EyeOff className="w-4 h-4 text-gray-400 transition-all duration-200 ease-in-out" />
                                      )}
                                      <span
                                        className={`text-sm transition-all duration-200 ease-in-out ${
                                          isVisible
                                            ? "text-gray-900"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {column.label}
                                      </span>
                                    </button>

                                    <div className="flex items-center space-x-1">
                                      <button
                                        disabled={isFirst || column.required}
                                        onClick={() => moveColumn(index, "up")}
                                        className="p-1 rounded transition-colors duration-200 hover:bg-gray-200 disabled:opacity-50"
                                      >
                                        <ChevronUp className="w-4 h-4" />
                                      </button>
                                      <button
                                        disabled={isLast || column.required}
                                        onClick={() =>
                                          moveColumn(index, "down")
                                        }
                                        className="p-1 rounded transition-colors duration-200 hover:bg-gray-200 disabled:opacity-50"
                                      >
                                        <ChevronDownIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-between items-center p-4 border-t border-gray-200">
                            <div className="flex items-center space-x-3">
                              <button
                                className="text-sm text-blue-600 hover:text-blue-800"
                                onClick={showAllColumns}
                              >
                                Show All
                              </button>
                              <button
                                className="text-sm text-red-600 hover:text-red-800"
                                onClick={resetColumns}
                              >
                                Reset to Default
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                className="px-4 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
                                onClick={() => setIsColumnsModalOpen(false)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-4 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
                                onClick={() => setIsColumnsModalOpen(false)}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Clear Filters */}
                      {getActiveFilterCount() > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllFilters}
                          className="text-gray-500 hover:text-gray-700 h-8 px-2 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      )}

                      {/* Export and Columns Buttons */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsColumnsModalOpen(true)}
                        className="flex items-center px-2 py-1 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        Columns
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-x-auto overflow-y-auto scrollbar-hide">
                  {filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                      <Search className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        No leads found
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {globalSearchTerm
                          ? `No leads match "${globalSearchTerm}"`
                          : "No leads match your current filters"}
                      </p>
                      {(globalSearchTerm || getActiveFilterCount() > 0) && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setGlobalSearchTerm("");
                            setActiveFilters({});
                          }}
                          className="text-sm"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table className="min-w-full table-fixed">
                      <TableHeader className="bg-gray-50 dark:bg-gray-800">
                        <TableRow className="border-gray-200 dark:border-gray-700">
                          <TableHead className="w-12 text-gray-900 dark:text-white">
                            <Checkbox
                              checked={selectedLeads.length === leads.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </TableHead>
                          {columnOrder.map(columnKey => {
                            const column = columns.find(
                              col => col.key === columnKey
                            );
                            if (!column || !visibleColumns[columnKey])
                              return null;
                            return (
                              <TableHead
                                key={columnKey}
                                className={`text-gray-900 dark:text-white ${
                                  columnKey === "actions"
                                    ? "min-w-[120px] w-[120px]"
                                    : columnKey === "name"
                                      ? "w-[200px]"
                                      : columnKey === "jobTitle"
                                        ? "w-[150px]"
                                        : columnKey === "industry"
                                          ? "w-[120px]"
                                          : columnKey === "company"
                                            ? "w-[150px]"
                                            : columnKey === "location"
                                              ? "w-[120px]"
                                              : columnKey === "connectedOn"
                                                ? "w-[180px]"
                                                : columnKey === "tag"
                                                  ? "w-[100px]"
                                                  : columnKey === "note"
                                                    ? "w-[100px]"
                                                    : "w-[100px]"
                                }`}
                              >
                                {column.label.toUpperCase()}
                              </TableHead>
                            );
                          })}
                        </TableRow>
                      </TableHeader>
                      <TableBody className="bg-white dark:bg-gray-900">
                        {isLoading ? (
                          <>
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                            <SkeletonRow />
                          </>
                        ) : (
                          currentLeads.map(lead => (
                            <TableRow
                              key={lead.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-gray-200 dark:border-gray-700"
                            >
                              <TableCell className="text-gray-900 dark:text-white">
                                <Checkbox
                                  checked={selectedLeads.includes(lead.id)}
                                  onCheckedChange={() =>
                                    handleSelectLead(lead.id)
                                  }
                                />
                              </TableCell>
                              {columnOrder.map(columnKey => {
                                const column = columns.find(
                                  col => col.key === columnKey
                                );
                                if (!column || !visibleColumns[columnKey])
                                  return null;

                                return (
                                  <TableCell
                                    key={columnKey}
                                    className={`text-gray-900 dark:text-white ${
                                      columnKey === "actions"
                                        ? "min-w-[120px] w-[120px]"
                                        : columnKey === "name"
                                          ? "w-[200px]"
                                          : columnKey === "jobTitle"
                                            ? "w-[150px]"
                                            : columnKey === "industry"
                                              ? "w-[120px]"
                                              : columnKey === "company"
                                                ? "w-[150px]"
                                                : columnKey === "location"
                                                  ? "w-[120px]"
                                                  : columnKey === "connectedOn"
                                                    ? "w-[180px]"
                                                    : columnKey === "tag"
                                                      ? "w-[100px]"
                                                      : columnKey === "note"
                                                        ? "w-[100px]"
                                                        : "w-[100px]"
                                    }`}
                                  >
                                    {columnKey === "id" ? (
                                      lead.id
                                    ) : columnKey === "name" ? (
                                      <div className="flex items-center space-x-3">
                                        <div className="relative flex-shrink-0">
                                          {lead.profileImage ? (
                                            <NextImage
                                              src={lead.profileImage}
                                              alt={lead.name}
                                              width={32}
                                              height={32}
                                              className="w-8 h-8 rounded-full shadow-sm object-cover"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                              {lead.firstName.charAt(0)}
                                              {lead.lastName.charAt(0)}
                                            </div>
                                          )}
                                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 dark:text-white">
                                            {lead.name}
                                          </p>
                                          <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {lead.email}
                                          </p>
                                        </div>
                                      </div>
                                    ) : columnKey === "jobTitle" ? (
                                      lead.jobTitle
                                    ) : columnKey === "campaign" ? (
                                      lead.campaign
                                    ) : columnKey === "industry" ? (
                                      lead.industry
                                    ) : columnKey === "company" ? (
                                      lead.company
                                    ) : columnKey === "position" ? (
                                      lead.jobTitle
                                    ) : columnKey === "location" ? (
                                      lead.cityCountry
                                    ) : columnKey === "tag" ? (
                                      <div className="flex items-center space-x-1">
                                        {lead.tags
                                          .slice(0, 2)
                                          .map((tag: any, index: number) => (
                                            <Badge
                                              key={index}
                                              className={`text-xs ${tag.color}`}
                                            >
                                              {tag.name}
                                            </Badge>
                                          ))}
                                        {lead.tagCount > 2 && (
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            +{lead.tagCount - 2} more
                                          </Badge>
                                        )}
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs"
                                        >
                                          + Add
                                        </Button>
                                      </div>
                                    ) : columnKey === "note" ? (
                                      "-"
                                    ) : columnKey === "actions" ? (
                                      <div className="flex items-center space-x-2">
                                        {/* View Details Button */}
                                        <button
                                          onClick={() =>
                                            handleOpenLeadDetail(lead)
                                          }
                                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                                          title="View Details"
                                        >
                                          <Eye className="w-4 h-4 text-gray-600" />
                                        </button>

                                        {/* LinkedIn Icon - Always shown */}
                                        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                          <div className="w-6 h-6 bg-gray-600 dark:bg-gray-700 rounded flex items-center justify-center">
                                            <Linkedin className="w-4 h-4 text-white" />
                                          </div>
                                        </button>

                                        {/* Toggle Switch */}
                                        <button
                                          onClick={() =>
                                            handleToggleChange(lead.id)
                                          }
                                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                            lead.is_excluded ||
                                            leadToggles[lead.id]
                                              ? "bg-blue-600"
                                              : "bg-gray-200"
                                          }`}
                                          title={
                                            lead.is_excluded ||
                                            leadToggles[lead.id]
                                              ? "Excluded"
                                              : "Include"
                                          }
                                        >
                                          <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                              lead.is_excluded ||
                                              leadToggles[lead.id]
                                                ? "translate-x-4"
                                                : "translate-x-0.5"
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    ) : (
                                      "-"
                                    )}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                itemsPerPageOptions={[10, 25, 50]}
                itemLabel="leads"
              />
            </div>
          </div>
        </div>

        {/* Lead Detail Modal */}
        {isLeadDetailModalOpen && (
          <div className="fixed inset-0 z-50">
            {/* White backdrop with blur effect */}
            <div
              className="absolute inset-0 bg-white/20 backdrop-blur-lg transition-opacity duration-300"
              onClick={() => setIsLeadDetailModalOpen(false)}
              style={{
                animation: "fadeInBackdrop 0.3s ease-out",
                backdropFilter: "blur(8px)",
              }}
            />

            {/* Modal Content */}
            <div
              className="absolute top-0 right-0 bg-white rounded-lg shadow-xl w-[430px] max-w-[430px] h-full overflow-hidden transition-all duration-300 ease-in-out transform"
              style={{
                animation: "slideInFromRight 0.3s ease-out",
              }}
            >
              {selectedLead && (
                <div className="flex overflow-hidden flex-col h-full">
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                    <div className="flex items-start space-x-3">
                      <div className="relative flex-shrink-0">
                        {selectedLead.profileImage ? (
                          <NextImage
                            src={selectedLead.profileImage}
                            alt={selectedLead.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                            {selectedLead.firstName?.charAt(0) ||
                              selectedLead.name?.charAt(0) ||
                              "?"}
                            {selectedLead.lastName?.charAt(0) || ""}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold leading-tight text-gray-900 break-words">
                          {selectedLead.name}
                        </h2>
                        <div className="flex flex-wrap gap-1 items-center mt-1 text-xs text-gray-600">
                          <span className="break-words">
                            {selectedLead.jobTitle || "CEO"}
                          </span>
                        </div>
                        <div className="flex items-center mt-2 space-x-2">
                          <div className="flex items-center space-x-1.5 px-2 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                            <Star className="w-3 h-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-800">
                              Lead Score: 80
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        className="flex-shrink-0 p-1 text-gray-400 rounded transition-colors hover:text-gray-600"
                        onClick={() => setIsLeadDetailModalOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-green-50 text-green-700 border-green-200">
                        ACTIVE
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full border bg-red-50 text-red-700 border-red-200">
                        HOT
                      </span>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <div className="absolute top-0 left-0 z-10 w-4 h-full bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                      <div className="absolute top-0 right-0 z-10 w-4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                      <button
                        className="absolute right-0 top-1/2 z-20 p-1 text-white bg-gray-900 dark:bg-gray-700 rounded-full shadow-lg transition-all transform -translate-y-1/2 hover:bg-gray-800 dark:hover:bg-gray-600"
                        title="Scroll right"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="flex overflow-x-auto space-x-1 scrollbar-hide scroll-smooth">
                        <div className="flex px-4 space-x-1 min-w-max">
                          {[
                            {
                              id: "overview",
                              label: "Overview",
                              icon: ClipboardList,
                            },
                            {
                              id: "activities",
                              label: "Activities",
                              icon: Activity,
                            },
                            { id: "deals", label: "Deals", icon: DollarSign },
                            {
                              id: "messages",
                              label: "Messages",
                              icon: MessageSquare,
                            },
                            {
                              id: "notes",
                              label: "Notes",
                              icon: StickyNote,
                              badge: 15,
                            },
                            { id: "tasks", label: "Tasks", icon: CheckSquare },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setModalActiveTab(tab.id)}
                              className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                                modalActiveTab === tab.id
                                  ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                              }`}
                            >
                              <tab.icon className="w-3.5 h-3.5" />
                              <span>{tab.label}</span>
                              {tab.badge && (
                                <span className="ml-1 px-1 py-0.5 text-xs rounded-full font-medium bg-gray-200 text-gray-600">
                                  {tab.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex overflow-hidden flex-1">
                    <div className="overflow-y-auto flex-1 hide-scrollbar">
                      {modalActiveTab === "overview" && (
                        <div className="p-4 space-y-4">
                          {/* Contact Information */}
                          <div>
                            <h3 className="mb-3 text-sm font-medium text-gray-900">
                              Contact Information
                            </h3>
                            <div className="space-y-1">
                              {[
                                {
                                  icon: "User",
                                  label: "Name",
                                  value: selectedLead.name || "Not provided",
                                },
                                {
                                  icon: "AtSign",
                                  label: "Email",
                                  value: selectedLead.email || "Not provided",
                                },
                                {
                                  icon: "Phone",
                                  label: "Phone",
                                  value: "Not provided",
                                },
                                {
                                  icon: "MessageSquare",
                                  label: "WhatsApp",
                                  value: "Not provided",
                                },
                                {
                                  icon: "Briefcase",
                                  label: "Job Title",
                                  value:
                                    selectedLead.jobTitle || "Not provided",
                                },
                                {
                                  icon: "Building2",
                                  label: "Company",
                                  value: selectedLead.company || "Not provided",
                                },
                              ].map((field, index) => (
                                <div
                                  key={index}
                                  className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50"
                                >
                                  <div className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                                      {field.label}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="text-xs text-gray-900 break-words">
                                        {field.value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Lead Information */}
                          <div>
                            <h3 className="mb-3 text-sm font-medium text-gray-900">
                              Lead Information
                            </h3>
                            <div className="space-y-1">
                              {[
                                {
                                  icon: "CheckCircle2",
                                  label: "Status",
                                  value: selectedLead.is_excluded
                                    ? "EXCLUDED"
                                    : "ACTIVE",
                                },
                                {
                                  icon: "Star",
                                  label: "Priority",
                                  value: "MEDIUM",
                                },
                                {
                                  icon: "Target",
                                  label: "Source",
                                  value: "LinkedIn",
                                },
                                {
                                  icon: "Briefcase",
                                  label: "Industry",
                                  value:
                                    selectedLead.industry || "Not provided",
                                },
                                {
                                  icon: "MapPin",
                                  label: "Location",
                                  value:
                                    selectedLead.cityCountry || "Not provided",
                                },
                                {
                                  icon: "Calendar",
                                  label: "Connected On",
                                  value: selectedLead.connectedOn
                                    ? new Date(
                                        selectedLead.connectedOn
                                      ).toLocaleDateString()
                                    : "Not provided",
                                },
                              ].map((field, index) => (
                                <div
                                  key={index}
                                  className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50"
                                >
                                  <div className="text-gray-400 mt-0.5 flex-shrink-0 w-4 h-4" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-medium text-gray-700 mb-0.5">
                                      {field.label}
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <div className="text-xs text-gray-900 break-words">
                                        {field.value}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Other tabs content */}
                      {modalActiveTab !== "overview" && (
                        <div className="p-4">
                          <div className="flex justify-center items-center py-8">
                            <div className="text-gray-500 text-sm">
                              {modalActiveTab.charAt(0).toUpperCase() +
                                modalActiveTab.slice(1)}{" "}
                              content coming soon...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  );
}
