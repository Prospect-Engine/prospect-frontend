/**
 * PIPELINE PAGE
 * =============
 * Kanban board view for deal management.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService } from "@/services/crmApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import {
  Plus,
  DollarSign,
  Users,
  Building2,
  Loader2,
  GripVertical,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  List,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  contact?: { id: string; name: string };
  company?: { id: string; name: string };
  createdAt: string;
}

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
    contact: { id: "5", name: "Lisa Martinez" },
    company: { id: "c5", name: "Growth.io" },
    createdAt: new Date().toISOString(),
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
    contact: { id: "1", name: "Sarah Johnson" },
    company: { id: "c1", name: "TechCorp Inc." },
    createdAt: new Date().toISOString(),
  },
  {
    id: "d11",
    title: "DevOps Transformation",
    value: 88000,
    currency: "USD",
    stage: "lead",
    status: "OPEN",
    probability: 25,
    expectedCloseDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "8", name: "David Kim" },
    company: { id: "c8", name: "Cloud Services Inc" },
    createdAt: new Date().toISOString(),
  },
  {
    id: "d12",
    title: "Cybersecurity Audit",
    value: 42000,
    currency: "USD",
    stage: "proposal",
    status: "OPEN",
    probability: 65,
    expectedCloseDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(),
    contact: { id: "7", name: "Amanda Brown" },
    company: { id: "c7", name: "FinTech.io" },
    createdAt: new Date().toISOString(),
  },
];

// Pipeline stages configuration
const stages = [
  {
    id: "lead",
    label: "Lead",
    color: "bg-gray-500",
    bgColor: "bg-gray-50 dark:bg-gray-900/50",
    icon: Target,
  },
  {
    id: "qualified",
    label: "Qualified",
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/50",
    icon: CheckCircle,
  },
  {
    id: "proposal",
    label: "Proposal",
    color: "bg-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/50",
    icon: TrendingUp,
  },
  {
    id: "negotiation",
    label: "Negotiation",
    color: "bg-orange-500",
    bgColor: "bg-orange-50 dark:bg-orange-900/50",
    icon: Clock,
  },
  {
    id: "won",
    label: "Won",
    color: "bg-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/50",
    icon: CheckCircle,
  },
  {
    id: "lost",
    label: "Lost",
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/50",
    icon: XCircle,
  },
];

export default function PipelinePage() {
  const router = useRouter();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingDeal, setMovingDeal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch deals
  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, status } = await CrmApiService.getDeals();

      if (status >= 200 && status < 300 && Array.isArray(data) && data.length > 0) {
        setDeals(data);
      } else {
        // Use mock data when API returns empty
        setDeals(MOCK_DEALS);
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
      // Use mock data on error
      setDeals(MOCK_DEALS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  // Get deals by stage
  const getDealsByStage = (stageId: string) => {
    return deals.filter((deal) => deal.stage === stageId);
  };

  // Calculate stage totals
  const getStageTotal = (stageId: string) => {
    return getDealsByStage(stageId).reduce((sum, deal) => sum + (deal.value || 0), 0);
  };

  // Format currency
  const formatCurrency = (value: number, compact = false) => {
    if (compact) {
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(0)}K`;
      }
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Move deal to new stage
  const moveDealToStage = async (dealId: string, newStage: string) => {
    setMovingDeal(dealId);
    try {
      const { status } = await CrmApiService.updateDeal(dealId, { stage: newStage });

      if (status >= 200 && status < 300) {
        // Update local state
        setDeals((prev) =>
          prev.map((deal) =>
            deal.id === dealId ? { ...deal, stage: newStage } : deal
          )
        );
        ShowShortMessage("Deal moved successfully", "success");
      }
    } catch (error) {
      ShowShortMessage("Failed to move deal", "error");
    } finally {
      setMovingDeal(null);
    }
  };

  // Delete deal
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;

    setDeleting(id);
    try {
      const { status } = await CrmApiService.deleteDeal(id);
      if (status >= 200 && status < 300) {
        ShowShortMessage("Deal deleted successfully", "success");
        setDeals((prev) => prev.filter((deal) => deal.id !== id));
      }
    } catch (error) {
      ShowShortMessage("Failed to delete deal", "error");
    } finally {
      setDeleting(null);
    }
  };

  // Total pipeline value
  const totalPipelineValue = deals
    .filter((d) => d.status !== "LOST")
    .reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Pipeline">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
              <p className="text-muted-foreground mt-1">
                Total pipeline value:{" "}
                <span className="font-semibold text-green-600">
                  {formatCurrency(totalPipelineValue)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push("/sales/deals")}
              >
                <List className="h-4 w-4 mr-2" />
                List View
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

          {/* Kanban Board */}
          {loading ? (
            <div className="grid grid-cols-6 gap-4">
              {stages.map((stage) => (
                <Card key={stage.id} className="rounded-2xl">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
              {stages.map((stage) => {
                const stageDeals = getDealsByStage(stage.id);
                const stageTotal = getStageTotal(stage.id);
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    className={cn(
                      "min-w-[280px] rounded-2xl border border-border/20",
                      stage.bgColor
                    )}
                  >
                    {/* Stage Header */}
                    <div className="p-4 border-b border-border/10">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("h-3 w-3 rounded-full", stage.color)} />
                          <span className="font-semibold text-foreground">
                            {stage.label}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {stageDeals.length}
                          </Badge>
                        </div>
                        <StageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(stageTotal, true)}
                      </p>
                    </div>

                    {/* Deals */}
                    <div className="p-3 space-y-3 min-h-[200px]">
                      {stageDeals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No deals
                        </div>
                      ) : (
                        stageDeals.map((deal) => (
                          <Card
                            key={deal.id}
                            className={cn(
                              "bg-white dark:bg-[#2c2c2e] rounded-xl border border-border/20 cursor-pointer hover:shadow-md transition-all",
                              movingDeal === deal.id && "opacity-50"
                            )}
                            onClick={() => router.push(`/sales/deals/${deal.id}`)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-foreground text-sm line-clamp-1">
                                  {deal.title}
                                </h4>
                                <DropdownMenu>
                                  <DropdownMenuTrigger
                                    asChild
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <MoreHorizontal className="h-3.5 w-3.5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="rounded-xl"
                                  >
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/sales/deals/${deal.id}`);
                                      }}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(`/sales/deals/${deal.id}/edit`);
                                      }}
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {/* Move to stage options */}
                                    {stages
                                      .filter((s) => s.id !== deal.stage)
                                      .map((targetStage) => (
                                        <DropdownMenuItem
                                          key={targetStage.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            moveDealToStage(deal.id, targetStage.id);
                                          }}
                                          disabled={movingDeal === deal.id}
                                        >
                                          <div
                                            className={cn(
                                              "h-3 w-3 rounded-full mr-2",
                                              targetStage.color
                                            )}
                                          />
                                          Move to {targetStage.label}
                                        </DropdownMenuItem>
                                      ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(deal.id);
                                      }}
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
                              </div>

                              {/* Deal Value */}
                              <p className="text-lg font-bold text-green-600 mb-2">
                                {formatCurrency(deal.value || 0)}
                              </p>

                              {/* Contact/Company */}
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {deal.contact && (
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    <span className="truncate">{deal.contact.name}</span>
                                  </div>
                                )}
                                {deal.company && (
                                  <div className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    <span className="truncate">{deal.company.name}</span>
                                  </div>
                                )}
                              </div>

                              {/* Expected Close */}
                              {deal.expectedCloseDate && (
                                <div className="mt-2 pt-2 border-t border-border/10 text-xs text-muted-foreground">
                                  Close:{" "}
                                  {new Date(deal.expectedCloseDate).toLocaleDateString()}
                                </div>
                              )}

                              {/* Probability */}
                              {deal.probability !== undefined && (
                                <div className="mt-2 flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[#3b82f6] rounded-full"
                                      style={{ width: `${deal.probability}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {deal.probability}%
                                  </span>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))
                      )}

                      {/* Add Deal Button */}
                      <Button
                        variant="ghost"
                        className="w-full h-10 border border-dashed border-border/30 rounded-xl text-muted-foreground hover:text-foreground hover:border-border/50"
                        onClick={() =>
                          router.push(`/sales/deals/new?stage=${stage.id}`)
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Deal
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
