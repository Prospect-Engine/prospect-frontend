"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  Search,
  Calendar,
  ExternalLink,
  Info,
  CalendarIcon,
  ChevronRight,
} from "lucide-react";
import dayjs from "dayjs";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { LeadDetailModal } from "@/components/modal/lead-detail-modal";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";

// Types for API response
interface Person {
  name: string;
  profile_url: string;
  profile_pic_url: string;
  headline: string;
  position: string;
  company: string;
  email: string;
  location: string;
  phone: string;
}

interface ActivityItem {
  id: string;
  leadId: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  description: string;
  createdAt: string;
  person: Person;
}

interface ActivityResponse {
  activity: ActivityItem[];
  page: number;
  limit: number;
  total: number;
}

const getActivityBadgeVariant = (activityType: string) => {
  switch (activityType) {
    case "PROFILE_IGNORED":
      return "destructive";
    case "CONNECTED":
    case "CONNECTED_BY_EMAIL":
      return "default";
    case "MESSAGE_REPLY":
      return "secondary";
    case "MESSAGE_SENT":
    case "INMAIL_SENT":
      return "outline";
    case "CONNECTION_REQUEST_SENT":
      return "secondary";
    case "PROFILE_VERIFIED":
      return "outline";
    case "FOLLOWED":
    case "ENDORSED_SKILL":
    case "LIKED_POST":
    case "PROFILE_VIEWED":
      return "outline";
    case "SEQUENCE_FINISHED":
      return "secondary";
    default:
      return "outline";
  }
};

export default function ActivityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [userActivityData, setUserActivityData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaginationLoading, setIsPaginationLoading] = useState(false);
  const [activityData, setActivityData] = useState<ActivityItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Date filter state for custom date picker
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [showCustomDatePicker, setShowCustomDatePicker] =
    useState<boolean>(false);

  // Fetch activity data from API
  const fetchActivityData = useCallback(
    async (
      page: number = 1,
      limit: number = rowsPerPage,
      isPagination: boolean = false
    ) => {
      try {
        if (isPagination) {
          setIsPaginationLoading(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        // Build filter string
        let filterString = "";
        const filters = [];

        if (activityFilter !== "all") {
          filters.push(`activity_type=${activityFilter}`);
        }

        // Add date filters if custom date range is selected
        if (fromDate && toDate) {
          filters.push(`time_filter=custom`);
          filters.push(`from_date=${encodeURIComponent(fromDate)}`);
          filters.push(`to_date=${encodeURIComponent(toDate)}`);
          filters.push(`time_zone=${encodeURIComponent("Asia/Dhaka")}`);
        }

        if (filters.length > 0) {
          filterString = filters.join("&");
        }

        const response = await fetch("/api/analytics/activity/getList", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            page,
            limit,
            orderBy: "created_at",
            sortType: "desc",
            filter: filterString || undefined,
          }),
        });

        if (!response.ok) {
          toast.error("Failed to fetch activity data");
          return;
        }

        const data: ActivityResponse = await response.json();
        setActivityData(data.activity);
        setCurrentPage(data.page);
        // Use the limit parameter passed to the function, not data.limit from response
        setTotalPages(Math.ceil(data.total / limit));
        setTotalItems(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (isPagination) {
          setIsPaginationLoading(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [activityFilter, rowsPerPage, fromDate, toDate]
  );

  // Refetch when filters or rowsPerPage change
  useEffect(() => {
    if (isInitialMount.current) {
      // Initial mount - use full loading
      isInitialMount.current = false;
      fetchActivityData(1, rowsPerPage, false);
    } else {
      // Subsequent changes - use pagination loading (subtle)
      setCurrentPage(1); // Reset to first page when filters or rowsPerPage change
      fetchActivityData(1, rowsPerPage, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityFilter, fromDate, toDate, rowsPerPage]);

  // Helper function to get activity type from description
  const getActivityType = (description: string): string => {
    const desc = description.toLowerCase();
    if (desc.includes("profile has been ignored")) return "PROFILE_IGNORED";
    if (desc.includes("connected")) return "CONNECTED";
    if (desc.includes("message replied")) return "MESSAGE_REPLY";
    if (desc.includes("message has been sent")) return "MESSAGE_SENT";
    if (desc.includes("connection request has been sent"))
      return "CONNECTION_REQUEST_SENT";
    if (desc.includes("profile has been verified")) return "PROFILE_VERIFIED";
    if (desc.includes("inmail sent")) return "INMAIL_SENT";
    if (desc.includes("followed")) return "FOLLOWED";
    if (desc.includes("endorsed skill")) return "ENDORSED_SKILL";
    if (desc.includes("like post")) return "LIKED_POST";
    if (desc.includes("profile viewed")) return "PROFILE_VIEWED";
    if (desc.includes("connected by email")) return "CONNECTED_BY_EMAIL";
    if (desc.includes("sequence finished")) return "SEQUENCE_FINISHED";
    return "OTHER";
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Filter data based on search and filters
  const filteredData = activityData
    .filter(item => {
      const matchesSearch = item.person.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const activityType = getActivityType(item.description);
      const matchesActivity =
        activityFilter === "all" || activityType === activityFilter;
      const matchesCampaign =
        campaignFilter === "all" || item.campaignName === campaignFilter;

      return matchesSearch && matchesActivity && matchesCampaign;
    })
    .sort((a, b) => {
      // Sort by date (latest to oldest), then by time (latest to oldest)
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);

      // First compare by date (YYYY-MM-DD)
      const dateOnlyA = new Date(
        dateA.getFullYear(),
        dateA.getMonth(),
        dateA.getDate()
      );
      const dateOnlyB = new Date(
        dateB.getFullYear(),
        dateB.getMonth(),
        dateB.getDate()
      );

      if (dateOnlyA.getTime() !== dateOnlyB.getTime()) {
        return dateOnlyB.getTime() - dateOnlyA.getTime(); // Latest date first
      }

      // If same date, sort by time (latest time first)
      return dateB.getTime() - dateA.getTime();
    });

  const handleLeadDetailClick = async (lead: any) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
    setIsLoadingDetails(true);
    setUserActivityData(null);

    try {
      const response = await fetch("/api/analytics/activity/getUserActivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          lead_id: lead.leadId,
          campaign_id: lead.campaignId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserActivityData(data);
      } else {
      }
    } catch (error) {
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
    // Fetch with new rows per page
    fetchActivityData(1, newRowsPerPage, true); // true indicates this is pagination
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchActivityData(page, rowsPerPage, true);
  };

  // Handle custom date range selection
  const handleCustomDateChange = (
    date: Date | undefined,
    type: "from" | "to"
  ) => {
    if (type === "from") {
      setFromDate(date ? dayjs(date).startOf("day").toISOString() : "");
    } else {
      setToDate(date ? dayjs(date).endOf("day").toISOString() : "");
    }
  };

  // Handle Custom Date button click (toggle visibility)
  const handleCustomDateButtonClick = () => {
    setShowCustomDatePicker(!showCustomDatePicker);
    // Reset dates when hiding the picker
    if (showCustomDatePicker) {
      setFromDate("");
      setToDate("");
    }
  };

  return (
    <AuthGuard>
      <AppLayout activePage="Analytics">
        <TooltipProvider>
          <div className="min-h-screen bg-background rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-sm">
            {/* Filters */}
            <div className="container mx-auto px-6 py-6 ">
              {isLoading ? (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <Skeleton className="h-10 w-full md:w-[280px]" />
                    <Skeleton className="h-10 w-full md:w-[200px]" />
                    <Skeleton className="h-10 w-full md:w-[200px]" />
                  </div>
                  <Skeleton className="h-10 w-full md:w-32" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search lead"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-9 w-full md:w-[280px]"
                      />
                    </div>

                    {/* Activity Type Filter */}
                    <Select
                      value={activityFilter}
                      onValueChange={setActivityFilter}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select Activity Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        <SelectItem value="PROFILE_VERIFIED">
                          Profile Verified
                        </SelectItem>
                        <SelectItem value="CONNECTION_REQUEST_SENT">
                          Connection Request Sent
                        </SelectItem>
                        <SelectItem value="CONNECTED">Connected</SelectItem>
                        <SelectItem value="MESSAGE_SENT">
                          Message Sent
                        </SelectItem>
                        <SelectItem value="MESSAGE_REPLY">
                          Message Reply
                        </SelectItem>
                        <SelectItem value="INMAIL_SENT">InMail Sent</SelectItem>
                        <SelectItem value="FOLLOWED">Followed</SelectItem>
                        <SelectItem value="ENDORSED_SKILL">
                          Endorsed Skill
                        </SelectItem>
                        <SelectItem value="LIKED_POST">Liked Post</SelectItem>
                        <SelectItem value="PROFILE_VIEWED">
                          Profile Viewed
                        </SelectItem>
                        <SelectItem value="CONNECTED_BY_EMAIL">
                          Connected by Email
                        </SelectItem>
                        <SelectItem value="SEQUENCE_FINISHED">
                          Sequence Finished
                        </SelectItem>
                        <SelectItem value="PROFILE_IGNORED">
                          Profile Ignored
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Campaign Filter */}
                    <Select
                      value={campaignFilter}
                      onValueChange={setCampaignFilter}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Select Campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Campaigns</SelectItem>
                        {Array.from(
                          new Set(activityData.map(item => item.campaignName))
                        ).map(campaign => (
                          <SelectItem key={campaign} value={campaign}>
                            {campaign}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Custom Date Button or Date Picker */}
                  {!showCustomDatePicker ? (
                    <Button
                      variant="outline"
                      className="w-full md:w-auto bg-transparent"
                      onClick={handleCustomDateButtonClick}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      CUSTOM DATE
                    </Button>
                  ) : (
                    <div className="flex items-center space-x-3 bg-card/40 backdrop-blur-sm ">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal rounded-xl border-border/30 hover:border-border/50 focus:border-border/70 transition-all duration-200 text-sm bg-card/60 backdrop-blur-sm",
                              !fromDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {fromDate
                              ? format(new Date(fromDate), "MMM dd")
                              : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-card/80 backdrop-blur-2xl border border-border/20 rounded-2xl"
                          align="start"
                        >
                          <CalendarComponent
                            mode="single"
                            selected={fromDate ? new Date(fromDate) : undefined}
                            onSelect={date =>
                              handleCustomDateChange(date, "from")
                            }
                            disabled={date =>
                              toDate ? date > new Date(toDate) : false
                            }
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>

                      <ChevronRight className="h-4 w-4 text-muted-foreground" />

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[140px] justify-start text-left font-normal rounded-xl border-border hover:border-border focus:border-border transition-all duration-200 text-sm bg-card/80",
                              !toDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {toDate
                              ? format(new Date(toDate), "MMM dd")
                              : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl"
                          align="start"
                        >
                          <CalendarComponent
                            mode="single"
                            selected={toDate ? new Date(toDate) : undefined}
                            onSelect={date =>
                              handleCustomDateChange(date, "to")
                            }
                            disabled={date =>
                              fromDate ? date < new Date(fromDate) : false
                            }
                            className="rounded-2xl"
                          />
                        </PopoverContent>
                      </Popover>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl font-medium transition-all duration-200 text-sm backdrop-blur-sm text-muted-foreground hover:text-foreground"
                        onClick={handleCustomDateButtonClick}
                      >
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="container mx-auto px-6 pb-6">
                <Card className="border-0 shadow-sm border-red-200 bg-red-50">
                  <div className="p-6 text-center">
                    <p className="text-red-600 font-medium">
                      Error loading activity data
                    </p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() =>
                        fetchActivityData(currentPage, rowsPerPage)
                      }
                    >
                      Try Again
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Activity Table */}
            <div className="container mx-auto px-6 pb-6">
              <Card className="rounded-2xl border border-border/20 shadow-sm relative">
                {isPaginationLoading && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Loading...</span>
                    </div>
                  </div>
                )}
                <Table>
                  <TableHeader>
                    {isLoading ? (
                      <TableRow className="border-b">
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-12" />
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-16" />
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-20" />
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-12" />
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-12" />
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          <Skeleton className="h-4 w-4" />
                        </TableHead>
                      </TableRow>
                    ) : (
                      <TableRow className="border-b">
                        <TableHead className="font-medium text-muted-foreground">
                          Name
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          Activity
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          Campaign
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          Date
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          Time
                        </TableHead>
                        <TableHead className="font-medium text-muted-foreground">
                          Details
                        </TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {isLoading
                      ? // Show skeleton rows only for initial loading
                        [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                          <TableRow
                            key={i}
                            className="border-b border-border/50"
                          >
                            <TableCell className="py-4">
                              <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="w-4 h-4 rounded" />
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <Skeleton className="h-4 w-40" />
                            </TableCell>
                            <TableCell className="py-4">
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            <TableCell className="py-4">
                              <Skeleton className="h-4 w-16" />
                            </TableCell>
                            <TableCell className="py-4">
                              <Skeleton className="w-8 h-8 rounded" />
                            </TableCell>
                          </TableRow>
                        ))
                      : filteredData.map(item => {
                          const activityType = getActivityType(
                            item.description
                          );
                          return (
                            <TableRow
                              key={item.id}
                              className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={
                                        item.person.profile_pic_url ||
                                        "/placeholder.svg"
                                      }
                                      alt={item.person.name}
                                    />
                                    <AvatarFallback className="text-xs">
                                      {item.person.name
                                        .split(" ")
                                        .map(n => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium text-foreground">
                                    {item.person.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={getActivityBadgeVariant(
                                      activityType
                                    )}
                                    className="font-normal"
                                  >
                                    {item.description}
                                  </Badge>
                                  {activityType === "PROFILE_IGNORED" && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="max-w-xs">
                                          Profile doesn&apos;t match target
                                          criteria
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <span className="text-primary font-medium hover:underline cursor-pointer">
                                  {item.campaignName}
                                </span>
                              </TableCell>
                              <TableCell className="py-4 text-muted-foreground">
                                {formatDate(item.createdAt)}
                              </TableCell>
                              <TableCell className="py-4 text-muted-foreground">
                                {formatTime(item.createdAt)}
                              </TableCell>
                              <TableCell className="py-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleLeadDetailClick(item)}
                                >
                                  <ExternalLink className="h-4 w-4 text-primary" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                  </TableBody>
                </Table>
              </Card>

              {/* Responsive Pagination */}
              <div className="mt-6">
                {isLoading ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-border/20">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="w-20 h-8 rounded" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="w-8 h-8 rounded" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={rowsPerPage}
                    totalItems={totalItems}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleRowsPerPageChange}
                    itemsPerPageOptions={[10, 25, 50]}
                    itemLabel="activities"
                    className="border-t border-border/20 bg-card/40 backdrop-blur-sm"
                  />
                )}
              </div>
            </div>

            {/* Detailed Lead Modal */}
            <LeadDetailModal
              lead={selectedLead}
              isOpen={isDetailModalOpen}
              onClose={() => setIsDetailModalOpen(false)}
              userActivityData={userActivityData}
              isLoadingDetails={isLoadingDetails}
            />
          </div>
        </TooltipProvider>
      </AppLayout>
    </AuthGuard>
  );
}
