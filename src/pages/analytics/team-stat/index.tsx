"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/layout/AppLayout";
import {
  Search,
  Users,
  Filter,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckCircle,
  XCircle,
  Activity,
  MessageSquare,
  Mail,
  UserCheck,
  Heart,
  CheckCircle2,
  BarChart3,
  ArrowUpDown,
  Loader2,
} from "lucide-react";
import dayjs from "dayjs";
import {
  useWorkspaceStats,
  WorkspaceMember as TeamMember,
} from "@/hooks/useWorkspaceStats";
import { useAccounts } from "@/hooks/useWorkspaceAccounts";
import { useRouter } from "next/navigation";

// Helper function to get member status
const getMemberStatus = (member: TeamMember): string => {
  if (member.has_active_campaign) {
    return "Active Campaign";
  }
  return member.is_connected ? "Connected" : "Disconnected";
};

// Helper function to format last activity
const formatLastActivity = (lastActivity: string | null): string => {
  if (!lastActivity) return "Never";

  const now = dayjs();
  const activity = dayjs(lastActivity);
  const diff = now.diff(activity, "minute");

  if (diff < 60) return `${diff} mins ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)} hours ago`;
  if (diff < 10080) return `${Math.floor(diff / 1440)} days ago`;
  if (diff < 43800) return `${Math.floor(diff / 10080)} weeks ago`;
  return `${Math.floor(diff / 43800)} months ago`;
};

// Helper function to calculate success rate
const calculateSuccessRate = (connected: number, sent: number): number => {
  // Handle null, undefined, or NaN values
  const connectedNum = Number(connected) || 0;
  const sentNum = Number(sent) || 0;

  if (sentNum === 0 || isNaN(sentNum) || isNaN(connectedNum)) return 0;
  const rate = (connectedNum / sentNum) * 100;
  return isNaN(rate) ? 0 : Math.round(rate);
};

// Helper function to calculate response rate
const calculateResponseRate = (replies: number, sent: number): number => {
  // Handle null, undefined, or NaN values
  const repliesNum = Number(replies) || 0;
  const sentNum = Number(sent) || 0;

  if (sentNum === 0 || isNaN(sentNum) || isNaN(repliesNum)) return 0;
  const rate = (repliesNum / sentNum) * 100;
  return isNaN(rate) ? 0 : Math.round(rate);
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "Connected":
        return {
          variant: "default" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
        };
      case "Disconnected":
        return {
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
        };
      case "Active Campaign":
        return {
          variant: "secondary" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200",
          icon: Activity,
        };
      default:
        return { variant: "outline" as const, className: "", icon: Activity };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="w-3 h-3" />
      {status}
    </Badge>
  );
};

// Progress bar component
const ProgressBar = ({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) => {
  // Ensure value is a valid number, default to 0 if NaN or invalid
  const validValue = isNaN(value) || value == null ? 0 : Number(value);
  const clampedValue = Math.max(0, Math.min(validValue, 100));

  return (
    <div
      className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ${className}`}
    >
      <div
        className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};

// Skeleton components for loading states
const KpiCardSkeleton = () => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-20" />
    </CardContent>
  </Card>
);

const FilterSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
    <div className="flex flex-wrap items-center gap-4">
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-[200px]" />
      <Skeleton className="h-10 w-32" />
    </div>
  </div>
);

const TableSkeleton = () => (
  <Card>
    <CardContent className="p-0">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: 10 }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-18" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-8" />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

// Sortable table header component
const SortableHeader = ({
  children,
  onSort,
  sortKey,
  currentSort,
}: {
  children: React.ReactNode;
  onSort: (key: string) => void;
  sortKey: string;
  currentSort: { key: string; direction: "asc" | "desc" } | null;
}) => {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        {isActive &&
          (direction === "asc" ? (
            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          ))}
      </div>
    </TableHead>
  );
};

export default function TeamStatisticsPage() {
  const router = useRouter();
  const [selectedDateRange, setSelectedDateRange] = useState("All");
  const [customDateRange, setCustomDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: new Date(),
    to: new Date(),
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [customButtonClicked, setCustomButtonClicked] = useState(false);
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);

  // Use the workspace stats hook
  const {
    members,
    totalMembers,
    currentPage,
    totalPages,
    loading,
    error,
    refetch,
    updateFilters,
    updateDateFilters,
    updateNonDateFilters,
    overallTotals,
    totalsLoading,
    totalsError,
    filters,
  } = useWorkspaceStats();
  const { workspaces: accountWorkspaces } = useAccounts();

  // Local state for UI controls
  const [searchInput, setSearchInput] = useState(filters.searchTerm || "");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedCampaign, setSelectedCampaign] = useState("All Campaigns");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  React.useEffect(() => {
    setSearchInput(filters.searchTerm || "");
  }, [filters.searchTerm]);

  // Update date filters (these trigger API calls)
  React.useEffect(() => {
    // Only auto-apply for predefined date ranges, not for custom dates
    if (selectedDateRange !== "Custom") {
      updateDateFilters({
        dateRange: selectedDateRange !== "All" ? selectedDateRange : undefined,
        customDateFrom: undefined,
        customDateTo: undefined,
      });
    }
  }, [selectedDateRange, updateDateFilters]);

  // Keep local rows-per-page in sync with server-driven filters without loops
  React.useEffect(() => {
    if (typeof filters?.limit === "number" && filters.limit !== itemsPerPage) {
      setItemsPerPage(filters.limit);
    }
  }, [filters?.limit]);

  // Use overall totals from the hook instead of calculating from current page
  const totals = overallTotals;

  const teamOptions = useMemo(() => {
    const seenNames = new Set<string>();
    const uniqueTeams: { id: string; label: string }[] = [];

    accountWorkspaces.forEach(account => {
      if (!account.id) return;

      const label = account.workspace_name || account.name || "Team";
      const canonicalName = label.trim().toLowerCase();

      if (seenNames.has(canonicalName)) {
        return;
      }

      seenNames.add(canonicalName);
      uniqueTeams.push({ id: account.id, label });
    });

    return uniqueTeams;
  }, [accountWorkspaces]);

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        const newDirection = prev.direction === "asc" ? "desc" : "asc";
        updateNonDateFilters(
          {
            orderBy: key,
            sortType: newDirection,
            page: 1,
          },
          { refreshTotals: false }
        );
        return { key, direction: newDirection };
      }
      updateNonDateFilters(
        {
          orderBy: key,
          sortType: "asc",
          page: 1,
        },
        { refreshTotals: false }
      );
      return { key, direction: "asc" };
    });
  };

  const handlePageChange = (page: number) => {
    updateNonDateFilters({ page }, { refreshTotals: false });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    updateNonDateFilters(
      { page: 1, limit: newItemsPerPage },
      { refreshTotals: false }
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const applySearch = () => {
    updateNonDateFilters(
      {
        searchTerm: searchInput || undefined,
        page: 1,
      },
      { refreshTotals: true }
    );
  };

  return (
    <AppLayout activePage="Analytics">
      <div className="space-y-6">
        {/* Search, Filters and Date Range - All in One Row */}
        {loading ? (
          <FilterSkeleton />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Search */}
              <div className="relative w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  placeholder="Search by name, email, or team..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      applySearch();
                    }
                  }}
                  className="pl-10 pr-12"
                  title="Search by member name, email address, or team name"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  onClick={applySearch}
                  aria-label="Apply search filters"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md shadow-sm"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {/* Team Filter */}
              <Select
                value={selectedTeam}
                onValueChange={value => {
                  setSelectedTeam(value);
                  updateNonDateFilters(
                    {
                      teamFilter: value !== "All Teams" ? value : undefined,
                      page: 1,
                    },
                    { refreshTotals: true }
                  );
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <Users className="w-6 h-6" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Teams">
                    <div className="flex items-center justify-between w-full">
                      <span>All Teams</span>
                    </div>
                  </SelectItem>
                  {teamOptions.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{team.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select
                value={selectedStatus}
                onValueChange={value => {
                  setSelectedStatus(value);
                  updateNonDateFilters(
                    {
                      statusFilter: value !== "All Status" ? value : undefined,
                      page: 1,
                    },
                    { refreshTotals: true }
                  );
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <Filter className="w-6 h-6" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="Connected">Connected</SelectItem>
                  <SelectItem value="Disconnected">Disconnected</SelectItem>
                  <SelectItem value="Active Campaign">
                    Active Campaign
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Campaign Filter */}
              <Select
                value={selectedCampaign}
                onValueChange={value => {
                  setSelectedCampaign(value);
                  updateNonDateFilters(
                    {
                      campaignFilter:
                        value !== "All Campaigns" ? value : undefined,
                      page: 1,
                    },
                    { refreshTotals: true }
                  );
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <Activity className="w-6 h-6" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Campaigns">All Campaigns</SelectItem>
                  <SelectItem value="Active">Active Campaign</SelectItem>
                  <SelectItem value="Inactive">No Active Campaign</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Range Filter Dropdown */}
              <Popover
                open={isDateDropdownOpen}
                onOpenChange={setIsDateDropdownOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[200px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
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
                  <div className="p-4 space-y-4">
                    {/* Predefined Date Options */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quick Select
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={
                            selectedDateRange === "All" ? "default" : "ghost"
                          }
                          size="sm"
                          onClick={() => {
                            setSelectedDateRange("All");
                            setCustomButtonClicked(false);
                            setIsDateDropdownOpen(false);
                          }}
                          className="justify-start"
                        >
                          All Time
                        </Button>
                        <Button
                          variant={
                            selectedDateRange === "Today" ? "default" : "ghost"
                          }
                          size="sm"
                          onClick={() => {
                            setSelectedDateRange("Today");
                            setCustomButtonClicked(false);
                            setIsDateDropdownOpen(false);
                          }}
                          className="justify-start"
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
                          className="justify-start"
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
                          className="justify-start"
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
                          className="justify-start"
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
                          className="justify-start"
                        >
                          This year
                        </Button>
                      </div>
                    </div>

                    {/* Separator */}
                    <div className="border-t border-gray-200 dark:border-gray-700"></div>

                    {/* Custom Date Range Picker */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Custom Range
                      </div>

                      <div className="space-y-3">
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
                              className="w-full px-4 py-2 text-sm font-medium bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg"
                              onClick={() => {
                                // Set selectedDateRange to Custom first
                                setSelectedDateRange("Custom");
                                // Trigger filter update with custom date range
                                updateDateFilters({
                                  dateRange: "Custom",
                                  customDateFrom: dayjs(
                                    customDateRange.from
                                  ).format("YYYY-MM-DD"),
                                  customDateTo: dayjs(
                                    customDateRange.to
                                  ).format("YYYY-MM-DD"),
                                });
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
                        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="h-3 w-3 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                            <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              No date range selected
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Select from and to dates above
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters Button */}
              <Button
                variant="outline"
                size="sm"
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm"
                onClick={() => {
                  // Reset UI state
                  setSearchInput("");
                  setSelectedTeam("All Teams");
                  setSelectedStatus("All Status");
                  setSelectedCampaign("All Campaigns");
                  setSelectedDateRange("All");
                  setCustomDateRange({
                    from: new Date(),
                    to: new Date(),
                  });
                  setCustomButtonClicked(false);
                  setIsDateDropdownOpen(false);
                  setSortConfig(null);
                  setItemsPerPage(10);

                  updateNonDateFilters(
                    {
                      searchTerm: undefined,
                      teamFilter: undefined,
                      statusFilter: undefined,
                      campaignFilter: undefined,
                      page: 1,
                      orderBy: "team_id",
                      sortType: "asc",
                      limit: 10,
                    },
                    { refreshTotals: true }
                  );

                  updateDateFilters({
                    dateRange: "All",
                    customDateFrom: undefined,
                    customDateTo: undefined,
                  });
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        {totalsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <XCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">
                Error loading totals: {totalsError}
              </span>
            </div>
          </div>
        )}
        {totalsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <KpiCardSkeleton key={i} />
            ))}
          </div>
        ) : totalMembers === 0 && !totalsError ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-400">0</div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Invites Sent
                </CardTitle>
                <UserPlus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isNaN(totals.totalInvites) ? (
                    "0"
                  ) : (
                    totals.totalInvites.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Lead Connected
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  20%
                </div> */}
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isNaN(totals.totalConnected) ? (
                    "0"
                  ) : (
                    totals.totalConnected.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Messages Sent
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isNaN(totals.totalMessagesSent) ? (
                    "0"
                  ) : (
                    totals.totalMessagesSent.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Messages Received
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                  10%
                </div> */}
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {totalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isNaN(totals.totalMessagesReceived) ? (
                    "0"
                  ) : (
                    totals.totalMessagesReceived.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Inmail Sent
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : isNaN(totals.totalInmailSent) ? (
                    "0"
                  ) : (
                    totals.totalInmailSent.toLocaleString()
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Data Table */}
        {loading ? (
          <TableSkeleton />
        ) : error ? (
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-600 mb-4">
                  <XCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-center">{error}</p>
                </div>
                <Button onClick={refetch} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="text-gray-500 mb-4">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Team Members Found
                  </h3>
                  <p className="text-center text-gray-500 max-w-md">
                    {searchInput ||
                    selectedTeam !== "All Teams" ||
                    selectedStatus !== "All Status"
                      ? "No team members match your current filters. Try adjusting your search criteria."
                      : "There are no team members to display. Team members will appear here once they are added to your organization."}
                  </p>
                </div>
                {(searchInput ||
                  selectedTeam !== "All Teams" ||
                  selectedStatus !== "All Status") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      setSelectedTeam("All Teams");
                      setSelectedStatus("All Status");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      sortKey="name"
                      onSort={handleSort}
                      currentSort={sortConfig}
                    >
                      MEMBER
                    </SortableHeader>
                    <SortableHeader
                      sortKey="status"
                      onSort={handleSort}
                      currentSort={sortConfig}
                    >
                      STATUS
                    </SortableHeader>
                    <TableHead>LAST ACTIVITY</TableHead>
                    <SortableHeader
                      sortKey="campaign_count"
                      onSort={handleSort}
                      currentSort={sortConfig}
                    >
                      CAMPAIGNS
                    </SortableHeader>
                    <SortableHeader
                      sortKey="lead_connected_count"
                      onSort={handleSort}
                      currentSort={sortConfig}
                    >
                      CONNECTIONS
                    </SortableHeader>
                    <SortableHeader
                      sortKey="message_reply_count"
                      onSort={handleSort}
                      currentSort={sortConfig}
                    >
                      MESSAGES
                    </SortableHeader>
                    <TableHead>INMAIL SENT</TableHead>
                    <TableHead>FOLLOWED</TableHead>
                    <TableHead>LIKED</TableHead>
                    <TableHead>COMPLETED</TableHead>
                    <TableHead>ENGAGE</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow
                      key={member.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        const url = `/analytics/team-stat/singleStatDetails?user_id=${encodeURIComponent(
                          member.user_id
                        )}&team_id=${encodeURIComponent(member.workspace_id || "")}&name=${encodeURIComponent(
                          member.name || ""
                        )}&email=${encodeURIComponent(member.email || "")}&team_name=${encodeURIComponent(
                          member.workspace_name || ""
                        )}`;
                        router.push(url);
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">
                              {member.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.email}
                            </div>
                            <div className="text-xs text-gray-400">
                              {member.workspace_name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={getMemberStatus(member)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-gray-400" />
                          {formatLastActivity(member.last_activity)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {member.campaign_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <UserPlus className="w-3 h-3 text-gray-400" />
                            <span>{member.invite_send_count} sent</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>{member.lead_connected_count} connected</span>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {calculateSuccessRate(
                              member.lead_connected_count,
                              member.invite_send_count
                            )}
                            % success
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{member.message_send_count} sent</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <MessageSquare className="w-3 h-3 text-green-500" />
                            <span>{member.message_reply_count} replies</span>
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {calculateResponseRate(
                              member.message_reply_count,
                              member.message_send_count
                            )}
                            % responded
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {member.inemail_send_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{member.follow_count}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Heart className="w-3 h-3 text-red-500" />
                          {member.like_post_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                          {member.completed_sequence_lead_count}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="text-sm font-medium">
                            {calculateResponseRate(
                              member.message_reply_count,
                              member.message_send_count
                            )}
                            %
                          </div>
                          <ProgressBar
                            value={calculateResponseRate(
                              member.message_reply_count,
                              member.message_send_count
                            )}
                            className="w-16"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {!loading && !error && members.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalMembers}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[10, 25, 50, 100]}
            itemLabel="members"
          />
        )}
      </div>
    </AppLayout>
  );
}
