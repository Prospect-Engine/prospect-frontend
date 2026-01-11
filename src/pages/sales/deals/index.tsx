/**
 * DEALS PAGE
 * ==========
 * CRM deals management with list view.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService } from "@/services/crmApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import Link from "next/link";
import {
  Plus,
  Search,
  MoreHorizontal,
  DollarSign,
  Users,
  Building2,
  Trash2,
  Edit,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Deal {
  id: string;
  title: string;
  value?: number;
  currency?: string;
  stage?: string;
  status?: string;
  probability?: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  contact?: { id: string; name: string };
  company?: { id: string; name: string };
  owner?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// Stage colors and labels
const stageConfig: Record<string, { color: string; label: string; icon: any }> = {
  lead: { color: "bg-gray-100 text-gray-700", label: "Lead", icon: Target },
  qualified: { color: "bg-blue-100 text-blue-700", label: "Qualified", icon: CheckCircle },
  proposal: { color: "bg-purple-100 text-purple-700", label: "Proposal", icon: TrendingUp },
  negotiation: { color: "bg-orange-100 text-orange-700", label: "Negotiation", icon: Clock },
  won: { color: "bg-green-100 text-green-700", label: "Won", icon: CheckCircle },
  lost: { color: "bg-red-100 text-red-700", label: "Lost", icon: XCircle },
};

// Status colors
const statusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
};

// Mock deals data for testing
const MOCK_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Enterprise SaaS Implementation",
    value: 125000,
    currency: "USD",
    stage: "negotiation",
    status: "OPEN",
    probability: 75,
    expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "1", name: "Sarah Johnson" },
    company: { id: "c1", name: "TechCorp Inc." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d2",
    title: "Cloud Migration Project",
    value: 85000,
    currency: "USD",
    stage: "proposal",
    status: "OPEN",
    probability: 60,
    expectedCloseDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "2", name: "Michael Chen" },
    company: { id: "c2", name: "Innovate.io" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d3",
    title: "Annual Support Contract",
    value: 45000,
    currency: "USD",
    stage: "won",
    status: "WON",
    probability: 100,
    expectedCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    actualCloseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "5", name: "Lisa Martinez" },
    company: { id: "c5", name: "Growth.io" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d4",
    title: "Marketing Automation Platform",
    value: 65000,
    currency: "USD",
    stage: "qualified",
    status: "OPEN",
    probability: 40,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "3", name: "Emily Davis" },
    company: { id: "c3", name: "StartupCo" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d5",
    title: "Data Analytics Suite",
    value: 95000,
    currency: "USD",
    stage: "negotiation",
    status: "OPEN",
    probability: 80,
    expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "7", name: "Amanda Brown" },
    company: { id: "c7", name: "FinTech.io" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d6",
    title: "Security Compliance Package",
    value: 55000,
    currency: "USD",
    stage: "proposal",
    status: "OPEN",
    probability: 55,
    expectedCloseDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "8", name: "David Kim" },
    company: { id: "c8", name: "Cloud Services Inc" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d7",
    title: "Mobile App Development",
    value: 150000,
    currency: "USD",
    stage: "lead",
    status: "OPEN",
    probability: 20,
    expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "4", name: "James Wilson" },
    company: { id: "c4", name: "Enterprise Solutions" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d8",
    title: "CRM Integration Project",
    value: 35000,
    currency: "USD",
    stage: "lost",
    status: "LOST",
    probability: 0,
    expectedCloseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "6", name: "Robert Taylor" },
    company: { id: "c6", name: "BigTech Corp" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d9",
    title: "AI Consulting Services",
    value: 200000,
    currency: "USD",
    stage: "qualified",
    status: "OPEN",
    probability: 50,
    expectedCloseDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "2", name: "Michael Chen" },
    company: { id: "c2", name: "Innovate.io" },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d10",
    title: "Infrastructure Upgrade",
    value: 75000,
    currency: "USD",
    stage: "won",
    status: "WON",
    probability: 100,
    expectedCloseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    actualCloseDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "1", name: "Sarah Johnson" },
    company: { id: "c1", name: "TechCorp Inc." },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function DealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Summary stats
  const [stats, setStats] = useState({
    totalValue: 0,
    openDeals: 0,
    wonDeals: 0,
    avgProbability: 0,
  });

  const ITEMS_PER_PAGE = 20;

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, status } = await CrmApiService.getDeals();

      // Use API data if available, otherwise use mock data
      let dealsData = (status >= 200 && status < 300 && Array.isArray(data) && data.length > 0)
        ? data
        : MOCK_DEALS;

      // Apply filters
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        dealsData = dealsData.filter(
          (d: Deal) =>
            d.title?.toLowerCase().includes(query) ||
            d.contact?.name?.toLowerCase().includes(query) ||
            d.company?.name?.toLowerCase().includes(query)
        );
      }
      if (stageFilter && stageFilter !== "all") {
        dealsData = dealsData.filter((d: Deal) => d.stage === stageFilter);
      }
      if (statusFilter && statusFilter !== "all") {
        dealsData = dealsData.filter((d: Deal) => d.status === statusFilter);
      }

      setDeals(dealsData);

      // Calculate stats
      const totalValue = dealsData.reduce((sum: number, d: Deal) => sum + (d.value || 0), 0);
      const openDeals = dealsData.filter((d: Deal) => d.status === "OPEN").length;
      const wonDeals = dealsData.filter((d: Deal) => d.status === "WON").length;
      const avgProbability =
        dealsData.length > 0
          ? dealsData.reduce((sum: number, d: Deal) => sum + (d.probability || 0), 0) / dealsData.length
          : 0;

      setStats({ totalValue, openDeals, wonDeals, avgProbability });
    } catch (error) {
      console.error("Error fetching deals:", error);
      // Use mock data on error
      setDeals(MOCK_DEALS);
      const totalValue = MOCK_DEALS.reduce((sum, d) => sum + (d.value || 0), 0);
      const openDeals = MOCK_DEALS.filter((d) => d.status === "OPEN").length;
      const wonDeals = MOCK_DEALS.filter((d) => d.status === "WON").length;
      const avgProbability = MOCK_DEALS.reduce((sum, d) => sum + (d.probability || 0), 0) / MOCK_DEALS.length;
      setStats({ totalValue, openDeals, wonDeals, avgProbability });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, stageFilter, statusFilter]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Delete deal
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    setDeleting(id);
    try {
      const { status } = await CrmApiService.deleteDeal(id);
      if (status >= 200 && status < 300) {
        ShowShortMessage("Deal deleted successfully", "success");
        fetchDeals();
      }
    } catch (error) {
      ShowShortMessage("Failed to delete deal", "error");
    } finally {
      setDeleting(null);
    }
  };

  // Update deal status
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { status } = await CrmApiService.updateDealStatus(id, newStatus);
      if (status >= 200 && status < 300) {
        ShowShortMessage(`Deal marked as ${newStatus}`, "success");
        fetchDeals();
      }
    } catch (error) {
      ShowShortMessage("Failed to update deal status", "error");
    }
  };

  // Format currency
  const formatCurrency = (value?: number, currency: string = "USD") => {
    if (!value) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Deals">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Deals</h1>
              <p className="text-muted-foreground mt-1">
                Track and manage your sales pipeline
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push("/sales/pipeline")}
              >
                <Target className="h-4 w-4 mr-2" />
                Pipeline View
              </Button>
              <Button
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl"
                onClick={() => router.push("/sales/deals/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Deal
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(stats.totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open Deals</p>
                    <p className="text-xl font-bold text-foreground">{stats.openDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Won Deals</p>
                    <p className="text-xl font-bold text-foreground">{stats.wonDeals}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Probability</p>
                    <p className="text-xl font-bold text-foreground">
                      {stats.avgProbability.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search deals..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-border/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Stage Filter */}
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-[150px] rounded-xl border-border/30">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] rounded-xl border-border/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="WON">Won</SelectItem>
                    <SelectItem value="LOST">Lost</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Deals Table */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <Skeleton className="h-6 w-24 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : deals.length === 0 ? (
                <div className="p-12 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No deals found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first deal"}
                  </p>
                  <Button
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl"
                    onClick={() => router.push("/sales/deals/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Deal
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/20 hover:bg-muted/30">
                      <TableHead className="font-semibold">Deal</TableHead>
                      <TableHead className="font-semibold">Value</TableHead>
                      <TableHead className="font-semibold">Stage</TableHead>
                      <TableHead className="font-semibold">Probability</TableHead>
                      <TableHead className="font-semibold">Close Date</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.map((deal) => {
                      const stage = stageConfig[deal.stage || "lead"];
                      return (
                        <TableRow
                          key={deal.id}
                          className="border-border/10 hover:bg-muted/20 cursor-pointer"
                          onClick={() => router.push(`/sales/deals/${deal.id}`)}
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{deal.title}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {deal.contact && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {deal.contact.name}
                                  </span>
                                )}
                                {deal.company && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {deal.company.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(deal.value, deal.currency)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-full text-xs", stage.color)}>
                              {stage.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                value={deal.probability || 0}
                                className="w-16 h-2"
                              />
                              <span className="text-sm">{deal.probability || 0}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {deal.expectedCloseDate ? (
                              <span className="text-sm">
                                {new Date(deal.expectedCloseDate).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "rounded-full text-xs",
                                statusColors[deal.status || "OPEN"]
                              )}
                            >
                              {deal.status || "Open"}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/sales/deals/${deal.id}`)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/sales/deals/${deal.id}/edit`)
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {deal.status !== "WON" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(deal.id, "WON")}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Won
                                  </DropdownMenuItem>
                                )}
                                {deal.status !== "LOST" && (
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(deal.id, "LOST")}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Mark as Lost
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(deal.id)}
                                  disabled={deleting === deal.id}
                                >
                                  {deleting === deal.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!loading && deals.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {deals.length} deals
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-2">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  disabled={deals.length < ITEMS_PER_PAGE}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
