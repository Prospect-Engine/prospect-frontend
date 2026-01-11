"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";

// Define the selected day type
type SelectedDayType = {
  selected: string;
  from_date: string;
  to_date: string;
};
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useCounts } from "@/hooks/sales-hooks";
import {
  MessageCircle,
  Linkedin,
  TrendingUp,
  Send,
  CheckCircle,
  CalendarIcon,
  ChevronRight,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ArrowUpDown,
  Clock,
  Minus,
  MessageSquare,
  Settings,
  Users,
  Building2,
  DollarSign,
  ListTodo,
  Target,
  Briefcase,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<SelectedDayType>({
    selected: "Today",
    from_date: dayjs(new Date()).startOf("day").toISOString(),
    to_date: dayjs(new Date()).endOf("day").toISOString(),
  });
  const [viewMode] = useState<"grid" | "list">("grid");
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>([]);

  // CRM Data
  const { counts, loading: crmLoading } = useCounts();

  // Map UI filter values to API filter values
  const mapFilterToAPI = (filter: string): string => {
    const filterMap: Record<string, string> = {
      Today: "today",
      Yesterday: "yesterday",
      "This week": "this_week",
      "This month": "this_month",
      "This year": "this_year",
      Custom: "custom",
    };
    return filterMap[filter] || "today";
  };

  // Use the custom hook to fetch dashboard data with the selected filter
  // Only pass a valid filter to the hook - if custom is selected without dates, use 'today' as fallback
  const getValidFilter = useCallback(() => {
    if (
      selectedDay.selected === "Custom" &&
      (!selectedDay.from_date || !selectedDay.to_date)
    ) {
      return "today"; // Use today as fallback when custom is selected but no dates are chosen
    }
    return mapFilterToAPI(selectedDay.selected);
  }, [selectedDay]);

  // Memoize the filter to prevent unnecessary re-renders
  const validFilter = useMemo(() => getValidFilter(), [getValidFilter]);

  const {
    stats,
    activities,
    replies,
    campaigns,
    error,
    refetch,
    updateFilter,
    statsLoading,
    activitiesLoading,
    repliesLoading,
    campaignsLoading,
  } = useDashboardData(validFilter);

  const dateFilters = [
    "Today",
    "Yesterday",
    "This week",
    "This month",
    "This year",
    "Custom",
  ];

  // Map API stats to dashboard format
  const getSummaryStats = () => {
    const statsMap = stats.reduce(
      (acc, stat) => {
        acc[stat.activity_type] = stat.count;
        return acc;
      },
      {} as Record<string, number>
    );

    return [
      {
        label: "Invites Sent",
        value: statsMap.CONNECTION_REQUEST_SENT || 0,
        change: 0, // You can calculate this based on previous period
        percentage: "0.00%",
        icon: Send,
        trend: "neutral",
      },
      {
        label: "Accepted",
        value: statsMap.CONNECTED || 0,
        change: 0,
        percentage: "0.00%",
        icon: CheckCircle,
        trend: "neutral",
      },
      {
        label: "Messages Sent",
        value: statsMap.MESSAGE_SENT || 0,
        change: 0,
        percentage: "0.00%",
        icon: MessageSquare,
        trend: "neutral",
      },
      {
        label: "Inmails Sent",
        value: statsMap.MESSAGE_SENT || 0, // Assuming this is the same as messages
        change: 0,
        percentage: "0.00%",
        icon: MessageSquare,
        trend: "neutral",
      },
      {
        label: "Liked Post",
        value: 0, // Not in the API response, keeping as 0
        change: 0,
        percentage: "0.00%",
        icon: MessageSquare,
        trend: "neutral",
      },
      {
        label: "Replies",
        value: statsMap.MESSAGE_REPLY || 0,
        change: 0,
        percentage: "0.00%",
        icon: MessageCircle,
        trend: "neutral",
      },
      {
        label: "Completed",
        value: statsMap.SEQUENCE_FINISHED || 0,
        change: 0,
        percentage: "0.00%",
        icon: CheckCircle,
        trend: "neutral",
      },
    ];
  };

  const summaryStats = getSummaryStats();

  // CRM Stats for the dashboard
  const crmStats = [
    {
      label: "Total Leads",
      value: counts?.leads?.total || 0,
      subLabel: `${counts?.leads?.customers || 0} active`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      href: "/sales/leads",
    },
    {
      label: "Companies",
      value: counts?.companies?.total || 0,
      subLabel: `${counts?.companies?.customers || 0} customers`,
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-500/10",
      href: "/sales/companies",
    },
    {
      label: "Open Deals",
      value: counts?.deals?.open || 0,
      subLabel: `${counts?.deals?.won || 0} won`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-500/10",
      href: "/sales/deals",
    },
    {
      label: "Pipeline",
      value: counts?.pipeline?.total || 0,
      subLabel: `${counts?.pipeline?.uniqueContacts || 0} contacts`,
      icon: Target,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-500/10",
      href: "/sales/pipeline",
    },
    {
      label: "Pending Tasks",
      value: counts?.tasks?.pending || 0,
      subLabel: `${counts?.tasks?.overdue || 0} overdue`,
      icon: ListTodo,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-500/10",
      href: "/sales/tasks",
    },
  ];

  // Format campaigns data from API
  const getFormattedCampaigns = () => {
    return campaigns.map(campaign => {
      const stats = campaign.campaign_stats;
      const totalLeads = campaign.target_leads_count || 0;
      const invitesSent = stats?.invite_send_count || 0;
      const connected = stats?.lead_connected_count || 0;
      const messagesSent = stats?.message_send_count || 0;
      const replies = stats?.message_reply_count || 0;
      const inmailSent = stats?.inemail_send_count || 0;
      const followed = stats?.follow_count || 0;
      const liked = stats?.like_post_count || 0;
      const completed = stats?.completed_sequence_lead_count || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.process_status,
        totalLeads,
        invitesSent,
        connected,
        messagesSent,
        replies,
        inmailSent,
        followed,
        liked,
        completed,
        connectionRate:
          invitesSent > 0
            ? `${((connected / invitesSent) * 100).toFixed(1)}%`
            : "0%",
        replyRate:
          messagesSent > 0
            ? `${((replies / messagesSent) * 100).toFixed(1)}%`
            : "0%",
        engagement:
          totalLeads > 0
            ? parseFloat(
                (((connected + replies + liked) / totalLeads) * 100).toFixed(1)
              )
            : 0,
      };
    });
  };

  const runningCampaigns = getFormattedCampaigns();

  // Format replies data - sort by received date (latest first) and limit to 5
  const formattedReplies = replies
    .sort(
      (a, b) =>
        new Date(b.received_on).getTime() - new Date(a.received_on).getTime()
    )
    .slice(0, 5)
    .map(reply => ({
      name: reply.name || "Unknown User",
      reply: reply.last_reply || "No reply available",
      campaign: reply.campaign || "Unknown Campaign",
      time: format(new Date(reply.received_on), "HH:mm"),
      avatar: reply.name
        ? reply.name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
        : "U",
      profilePic: null, // API doesn't provide profile picture URLs
      profileUrl: reply.profile_url,
      conversationUrl: reply.conversation_url,
    }));

  // Format activities data - sort by creation date (latest first) and limit to 5
  const formattedActivities = activities
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
    .map(activity => ({
      name: activity.person?.name || "Unknown User",
      activity: activity.description || "No activity description",
      campaign: activity.campaignName || "Unknown Campaign",
      avatar: activity.person?.name
        ? activity.person.name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
        : "U",
      profilePic: activity.person?.profile_pic_url || null,
      type: activity.description?.toLowerCase().includes("verified")
        ? "verified"
        : activity.description?.toLowerCase().includes("message")
          ? "message"
          : "ignored",
    }));

  // Handle filter changes and refetch data
  useEffect(() => {
    if (selectedDay.selected !== "Custom") {
      // Reset custom dates when not using custom filter
      setSelectedDay(prev => ({
        ...prev,
        from_date: dayjs(new Date()).startOf("day").toISOString(),
        to_date: dayjs(new Date()).endOf("day").toISOString(),
      }));
    }
    // You can add filter logic here to pass to the API
    // refetch(); // Commented out to prevent infinite loop
  }, [selectedDay.selected]);

  const handleFilterChange = (filter: string) => {
    setSelectedDay(prev => ({
      ...prev,
      selected: filter,
    }));

    // Only trigger API calls if it's not a custom filter
    if (filter !== "Custom") {
      // Use a small delay to prevent rapid API calls and ensure smooth UI updates
      setTimeout(() => {
        updateFilter("time_filter", mapFilterToAPI(filter));
      }, 50);
    }
    // For custom filter, don't trigger any API calls - only show the date picker
    // API calls will only happen when Apply button is clicked
  };

  // Handle custom date range selection (no automatic API calls)
  const handleCustomDateChange = (
    date: Date | undefined,
    type: "from" | "to"
  ) => {
    if (type === "from") {
      setSelectedDay(prev => ({
        ...prev,
        from_date: date
          ? dayjs(date).startOf("day").toISOString()
          : prev.from_date,
      }));
    } else {
      setSelectedDay(prev => ({
        ...prev,
        to_date: date ? dayjs(date).endOf("day").toISOString() : prev.to_date,
      }));
    }
    // No automatic API calls - only update the state
  };

  // Handle Apply button click for custom date range
  const handleApplyCustomDate = () => {
    // Validate that both dates are selected
    if (!selectedDay.from_date || !selectedDay.to_date) {
      return;
    }

    // Validate that start date is not after end date
    if (dayjs(selectedDay.from_date).isAfter(dayjs(selectedDay.to_date))) {
      return;
    }

    // Trigger API calls with custom date range using a small delay for smooth UI updates
    setTimeout(() => {
      updateFilter("time_filter", "custom");
      updateFilter("start_date", selectedDay.from_date); // Already in ISO format
      updateFilter("end_date", selectedDay.to_date); // Already in ISO format
    }, 50);
  };

  const toggleWidget = (widgetId: string) => {
    setHiddenWidgets(prev =>
      prev.includes(widgetId)
        ? prev.filter(id => id !== widgetId)
        : [...prev, widgetId]
    );
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="w-3 h-3 text-emerald-500" />;
      case "down":
        return <ArrowDownRight className="w-3 h-3 text-red-500" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "Verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Message":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Ignored":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Analytics">
        {error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CRM Overview Stats */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">CRM Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {crmLoading
                  ? [1, 2, 3, 4, 5].map(i => (
                      <Card
                        key={i}
                        className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Skeleton className="w-10 h-10 rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : crmStats.map((stat, index) => (
                      <Card
                        key={index}
                        className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer group"
                        onClick={() => router.push(stat.href)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className={cn("p-2.5 rounded-xl", stat.bgColor)}>
                              <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-foreground">
                              {stat.value.toLocaleString()}
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {stat.label}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {stat.subLabel}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
              </div>
            </div>

            {/* Outreach Statistics */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Outreach Performance</h2>
            <div
              className={cn(
                "transition-all duration-500",
                viewMode === "grid"
                  ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4"
                  : "flex flex-wrap gap-4"
              )}
            >
              {statsLoading
                ? // Show skeleton loading for stats
                  [1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Card
                      key={i}
                      className="bg-card/70 backdrop-blur-xl border-0 rounded-2xl"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Skeleton className="w-8 h-8 rounded-xl" />
                          <Skeleton className="w-6 h-4 rounded" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-8 w-12" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                : summaryStats.map((stat, index) => (
                    <Card
                      key={index}
                      className={cn(
                        "bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 group before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none relative overflow-hidden",
                        hiddenWidgets.includes(`stat-${index}`) &&
                          "opacity-50 scale-95"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2 bg-card/40 backdrop-blur-sm rounded-xl">
                            <stat.icon className="w-4 h-4 text-foreground" />
                          </div>
                          <div className="flex items-center space-x-1">
                            {getTrendIcon(stat.trend)}
                            <span
                              className={cn(
                                "text-xs font-medium",
                                stat.trend === "up" && "text-emerald-600",
                                stat.trend === "down" && "text-red-600",
                                stat.trend === "neutral" &&
                                  "text-muted-foreground"
                              )}
                            >
                              {stat.change !== 0 &&
                                (stat.change > 0 ? "+" : "")}
                              {stat.change}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {stat.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat.percentage}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
            </div>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-card/60 backdrop-blur-2xl rounded-2xl border border-border/20  min-h-[72px] before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none relative overflow-hidden">
              <div className="flex items-center space-x-2 mr-4">
                <Filter className="w-4 h-4 text-muted-foreground" />
              </div>

              {dateFilters.map(filter => (
                <Button
                  key={filter}
                  variant={
                    selectedDay.selected === filter ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => handleFilterChange(filter)}
                  className={cn(
                    "px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm shadow-sm hover:shadow-md",
                    selectedDay.selected === filter
                      ? "bg-primary/90 hover:bg-primary/80 text-primary-foreground backdrop-blur-sm shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40 backdrop-blur-sm"
                  )}
                >
                  {filter}
                </Button>
              ))}

              {/* Custom Date Range Picker */}
              {selectedDay.selected === "Custom" && (
                <div className="flex items-center space-x-3 ml-4 bg-card/40 backdrop-blur-sm rounded-xl border border-border/20">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[160px] justify-start text-left font-normal rounded-xl border-border/30 hover:border-border/50 focus:border-border/70 transition-all duration-200 text-sm bg-card/60 backdrop-blur-sm",
                          !selectedDay.from_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {selectedDay.from_date
                          ? format(new Date(selectedDay.from_date), "MMM dd")
                          : "Start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-card/80 backdrop-blur-2xl border border-border/20 rounded-2xl before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          selectedDay.from_date
                            ? new Date(selectedDay.from_date)
                            : undefined
                        }
                        onSelect={date => handleCustomDateChange(date, "from")}
                        disabled={date =>
                          selectedDay.to_date
                            ? date > new Date(selectedDay.to_date)
                            : false
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
                          "w-[160px] justify-start text-left font-normal rounded-xl border-border hover:border-border focus:border-border transition-all duration-200 text-sm bg-card/80",
                          !selectedDay.to_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {selectedDay.to_date
                          ? format(new Date(selectedDay.to_date), "MMM dd")
                          : "End date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          selectedDay.to_date
                            ? new Date(selectedDay.to_date)
                            : undefined
                        }
                        onSelect={date => handleCustomDateChange(date, "to")}
                        disabled={date =>
                          selectedDay.from_date
                            ? date < new Date(selectedDay.from_date)
                            : false
                        }
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>

                  <Button
                    size="sm"
                    className={cn(
                      " rounded-xl font-medium transition-all duration-200 text-sm backdrop-blur-sm",
                      selectedDay.from_date && selectedDay.to_date
                        ? "bg-primary/90 hover:bg-primary/80 text-primary-foreground  hover:scale-105 backdrop-blur-sm"
                        : "bg-card/40 text-muted-foreground cursor-not-allowed backdrop-blur-sm"
                    )}
                    disabled={!selectedDay.from_date || !selectedDay.to_date}
                    onClick={handleApplyCustomDate}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Running Campaigns Card */}
            {!hiddenWidgets.includes("campaigns") && (
              <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 hover:scale-110before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                      Running Campaigns
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Active campaign performance overview
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleWidget("campaigns")}
                      className="text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200"
                    >
                      <EyeOff className="w-4 h-4" />
                    </Button> */}
                    <Button
                      className="bg-primary/90 hover:bg-primary/80 text-primary-foreground rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                      onClick={() => router.push("/outreach/campaigns")}
                    >
                      View All Campaigns
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/20 hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm">
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              CAMPAIGN
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          {/* <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              STATUS
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead> */}
                          {/* <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              LAST ACTIVITY
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead> */}
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              LEADS
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              CONNECTIONS
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              MESSAGES
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              INMAIL SENT
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              FOLLOWED
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              LIKED
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              COMPLETED
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                          <TableHead className="font-semibold text-foreground cursor-pointer hover:text-foreground transition-colors">
                            <div className="flex items-center gap-2">
                              ENGAGE
                              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {campaignsLoading
                          ? // Show skeleton rows for campaigns table
                            [1, 2, 3].map(i => (
                              <TableRow key={i} className="border-border/50">
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <Skeleton className="w-32 h-4" />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                                <TableCell>
                                  <Skeleton className="w-12 h-4" />
                                </TableCell>
                              </TableRow>
                            ))
                          : runningCampaigns.map((campaign, index) => (
                              <TableRow
                                key={index}
                                className="border-border/50 hover:bg-muted/50 transition-colors duration-200"
                              >
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    {/* <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700">
                                  <AvatarFallback className="bg-muted text-foreground text-sm font-medium">
                                    {campaign.owner.avatar}
                                  </AvatarFallback>
                                </Avatar> */}
                                    <div>
                                      <p className="font-medium text-foreground text-sm">
                                        {campaign.name}
                                      </p>
                                      {campaign.status === "PROCESSING" && (
                                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full px-3 py-1 font-medium">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Running
                                        </Badge>
                                      )}
                                      {campaign.status === "PAUSED" && (
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 rounded-full px-3 py-1 font-medium">
                                          <Clock className="w-3 h-3 mr-1" />
                                          Paused
                                        </Badge>
                                      )}
                                      {campaign.status === "PROCESSED" && (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1 font-medium">
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                          Completed
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                {/* <TableCell>
                              <div className="flex items-center gap-2">
                                {campaign.status === "Running" && (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 rounded-full px-3 py-1 font-medium">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {campaign.status}
                                  </Badge>
                                )}
                                {campaign.status === "Paused" && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 rounded-full px-3 py-1 font-medium">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {campaign.status}
                                  </Badge>
                                )}
                                {campaign.status === "Completed" && (
                                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1 font-medium">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {campaign.status}
                                  </Badge>
                                )}
                              </div>
                            </TableCell> */}
                                {/* <TableCell>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-foreground text-sm">{campaign.lastActivity}</span>
                              </div>
                            </TableCell> */}
                                <TableCell className="text-foreground font-medium">
                                  {campaign.totalLeads}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-foreground text-sm">
                                        + {campaign.invitesSent} sent
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                      <span className="text-foreground text-sm">
                                        {campaign.connected} connected
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                      {campaign.connectionRate} success
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                      <span className="text-foreground text-sm">
                                        {campaign.messagesSent} sent
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                        <span className="text-primary-foreground text-xs">
                                          💬
                                        </span>
                                      </div>
                                      <span className="text-foreground text-sm">
                                        {campaign.replies} replies
                                      </span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                      {campaign.replyRate} responded
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-foreground">
                                  {campaign.inmailSent}
                                </TableCell>
                                <TableCell className="text-foreground">
                                  {campaign.followed}
                                </TableCell>
                                <TableCell className="text-foreground">
                                  {campaign.liked}
                                </TableCell>
                                <TableCell className="text-foreground">
                                  {campaign.completed}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${Math.min(campaign.engagement * 5, 100)}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-foreground text-sm font-medium">
                                      {campaign.engagement}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Replies and Activities Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Replies Card */}
              {!hiddenWidgets.includes("replies") && (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 hover:scale-110before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        Recent Replies
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Last 5 message responses (latest first)
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidget("replies")}
                        className="text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button> */}
                      <Button className="bg-primary/90 hover:bg-primary/80 text-primary-foreground rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {repliesLoading
                        ? // Show skeleton loading for replies
                          [1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-border/20"
                            >
                              <div className="flex items-center space-x-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </div>
                          ))
                        : formattedReplies.map((reply, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 group cursor-pointer border border-border/20"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700">
                                  <AvatarFallback className="bg-card/40 text-foreground text-sm font-medium backdrop-blur-sm">
                                    {reply.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-foreground text-sm">
                                    <a
                                      href={reply.profileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="hover:text-primary transition-colors duration-200"
                                    >
                                      {reply.name}
                                    </a>
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    {reply.reply}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {reply.campaign}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className="text-xs text-muted-foreground font-medium">
                                  {reply.time}
                                </span>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() =>
                                      window.open(
                                        reply.conversationUrl,
                                        "_blank"
                                      )
                                    }
                                  >
                                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 rounded-lg"
                                    onClick={() =>
                                      window.open(reply.profileUrl, "_blank")
                                    }
                                  >
                                    <Linkedin className="w-4 h-4 text-muted-foreground" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Activities Card */}
              {!hiddenWidgets.includes("activities") && (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 hover:scale-110before:absolute before:inset-0 before:bg-gradient-to-br before:from-card/10 before:to-transparent before:rounded-2xl before:pointer-events-none relative overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        Recent Activities
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Last 5 system activities (latest first)
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWidget("activities")}
                        className="text-muted-foreground hover:text-foreground rounded-xl transition-all duration-200"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button> */}
                      <Button
                        className="bg-primary/90 hover:bg-primary/80 text-primary-foreground rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                        onClick={() => router.push("/analytics/activity")}
                      >
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {activitiesLoading
                        ? // Show skeleton loading for activities
                          [1, 2, 3, 4, 5].map(i => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-border/20"
                            >
                              <div className="flex items-center space-x-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-24" />
                                </div>
                              </div>
                              <div className="text-right space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </div>
                          ))
                        : formattedActivities.map((activity, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl hover:bg-white/50 dark:hover:bg-gray-700/50 transition-all duration-200 group cursor-pointer border border-border/20"
                            >
                              <div className="flex items-center space-x-3">
                                <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-700">
                                  {activity.profilePic && (
                                    <AvatarImage
                                      src={activity.profilePic}
                                      alt={activity.name}
                                      className="object-cover"
                                    />
                                  )}
                                  <AvatarFallback className="bg-card/40 text-foreground text-sm font-medium backdrop-blur-sm">
                                    {activity.avatar}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-foreground text-sm">
                                    {activity.name}
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    {activity.activity}
                                  </p>
                                  <p className="text-muted-foreground text-xs">
                                    {activity.campaign}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={cn(
                                    "rounded-full px-2 py-1 text-xs font-medium",
                                    getActivityColor(activity.type)
                                  )}
                                >
                                  {activity.type}
                                </Badge>
                                <TrendingUp className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </div>
                            </div>
                          ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Floating Action Button */}
            {/* <div className="fixed bottom-6 right-6 z-50">
              <Button
                size="lg"
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary/80 text-primary-foreground  hover:scale-110transition-all duration-300 hover:scale-110"
              >
                <Plus className="w-6 h-6" />
              </Button>
            </div> */}

            {/* Widget Customization Panel */}
            {/* <div className="fixed bottom-6 left-6 z-40">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-card/80 backdrop-blur-xl border-border/20  hover:scale-110rounded-xl transition-all duration-200"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Customize
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64 bg-card/95 backdrop-blur-xl border-border/20 rounded-2xl"
                  align="start"
                >
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">
                      Widget Visibility
                    </h4>
                    {[
                      { id: "campaigns", label: "Running Campaigns" },
                      { id: "replies", label: "Recent Replies" },
                      { id: "activities", label: "Recent Activities" },
                    ].map(widget => (
                      <div
                        key={widget.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-foreground">
                          {widget.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWidget(widget.id)}
                          className="h-8 w-8 rounded-lg"
                        >
                          {hiddenWidgets.includes(widget.id) ? (
                            <EyeOff className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Eye className="w-4 h-4 text-foreground" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div> */}
          </div>
        )}
      </AppLayout>
    </AuthGuard>
  );
}

// Enhanced Skeleton Components
// // function DashboardSkeleton() {
//   return (
//     <div className="space-y-6">
//       {/* Summary Statistics Skeleton */}
//       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
//         {[1, 2, 3, 4, 5, 6, 7].map(i => (
//           <Card
//             key={i}
//             className="bg-card/70 backdrop-blur-xl border-0 rounded-2xl"
//           >
//             <CardContent className="p-4">
//               <div className="flex items-center justify-between mb-3">
//                 <Skeleton className="w-8 h-8 rounded-xl" />
//                 <Skeleton className="w-6 h-4 rounded" />
//               </div>
//               <div className="space-y-2">
//                 <Skeleton className="h-8 w-12" />
//                 <Skeleton className="h-4 w-16" />
//                 <Skeleton className="h-3 w-12" />
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//
//       {/* Date Filters Skeleton */}
//       <div className="flex flex-wrap items-center gap-3 p-4 bg-card/70 backdrop-blur-xl rounded-2xl border border-border/20 ">
//         <Skeleton className="w-4 h-4 rounded" />
//         {[1, 2, 3, 4, 5, 6].map(i => (
//           <Skeleton key={i} className="h-9 w-20 rounded-xl" />
//         ))}
//       </div>
//
//       {/* Running Campaigns Skeleton */}
//       <Card className="bg-card/70 backdrop-blur-xl border-0 rounded-2xl">
//         <CardHeader className="flex flex-row items-center justify-between pb-4">
//           <div>
//             <Skeleton className="h-6 w-48 mb-2" />
//             <Skeleton className="h-4 w-64" />
//           </div>
//           <Skeleton className="h-10 w-32 rounded-xl" />
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-4">
//             <div className="flex space-x-4 pb-2 border-b border-border/50">
//               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
//                 <Skeleton key={i} className="h-4 w-16" />
//               ))}
//             </div>
//             <div className="flex space-x-4 py-3">
//               {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
//                 <Skeleton key={i} className="h-4 w-12" />
//               ))}
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//
//       {/* Replies and Activities Skeleton */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {[1, 2].map(i => (
//           <Card
//             key={i}
//             className="bg-card/70 backdrop-blur-xl border-0 rounded-2xl"
//           >
//             <CardHeader className="flex flex-row items-center justify-between pb-4">
//               <div>
//                 <Skeleton className="h-6 w-32 mb-2" />
//                 <Skeleton className="h-4 w-40" />
//               </div>
//               <Skeleton className="h-10 w-24 rounded-xl" />
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-3">
//                 {[1, 2, 3, 4].map(j => (
//                   <div
//                     key={j}
//                     className="flex items-center justify-between p-4 bg-muted/80 rounded-2xl"
//                   >
//                     <div className="flex items-center space-x-3">
//                       <Skeleton className="w-10 h-10 rounded-full" />
//                       <div>
//                         <Skeleton className="h-4 w-24 mb-1" />
//                         <Skeleton className="h-3 w-32 mb-1" />
//                         <Skeleton className="h-3 w-20" />
//                       </div>
//                     </div>
//                     <div className="flex items-center space-x-2">
//                       <Skeleton className="h-3 w-8" />
//                       <Skeleton className="w-4 h-4 rounded" />
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// // }
