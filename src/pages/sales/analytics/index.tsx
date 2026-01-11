/**
 * ANALYTICS PAGE
 * ==============
 * CRM metrics, reports, and insights.
 */

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService } from "@/services/crmApi";
import { useCounts } from "@/hooks/sales-hooks";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Linkedin,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

interface DealStats {
  totalDeals: number;
  openDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalValue: number;
  wonValue: number;
  winRate: number;
  avgDealValue: number;
}

interface ContactStats {
  totalContacts: number;
  fromOutreach: number;
  customers: number;
  prospects: number;
  conversionRate: number;
}

// Mock deals data for analytics
const MOCK_DEALS = [
  { id: "d1", title: "Enterprise SaaS", value: 125000, stage: "negotiation", status: "OPEN", probability: 75 },
  { id: "d2", title: "Cloud Migration", value: 85000, stage: "proposal", status: "OPEN", probability: 60 },
  { id: "d3", title: "Support Contract", value: 45000, stage: "won", status: "WON", probability: 100 },
  { id: "d4", title: "Marketing Platform", value: 65000, stage: "qualified", status: "OPEN", probability: 40 },
  { id: "d5", title: "Analytics Suite", value: 95000, stage: "negotiation", status: "OPEN", probability: 80 },
  { id: "d6", title: "Security Package", value: 55000, stage: "proposal", status: "OPEN", probability: 55 },
  { id: "d7", title: "Mobile App Dev", value: 150000, stage: "lead", status: "OPEN", probability: 20 },
  { id: "d8", title: "CRM Integration", value: 35000, stage: "lost", status: "LOST", probability: 0 },
  { id: "d9", title: "AI Consulting", value: 200000, stage: "qualified", status: "OPEN", probability: 50 },
  { id: "d10", title: "Infrastructure", value: 75000, stage: "won", status: "WON", probability: 100 },
  { id: "d11", title: "DevOps Transform", value: 88000, stage: "lead", status: "OPEN", probability: 25 },
  { id: "d12", title: "Security Audit", value: 42000, stage: "proposal", status: "OPEN", probability: 65 },
];

// Mock contacts data for analytics
const MOCK_CONTACTS = [
  { id: "1", name: "Sarah Johnson", status: "PROSPECT", source: "LINKEDIN_OUTREACH", linkedinUrnId: "urn:li:1" },
  { id: "2", name: "Michael Chen", status: "CUSTOMER", source: "LINKEDIN_OUTREACH", linkedinUrnId: "urn:li:2" },
  { id: "3", name: "Emily Davis", status: "LEAD", source: "WEBSITE" },
  { id: "4", name: "James Wilson", status: "LEAD", source: "MANUAL" },
  { id: "5", name: "Lisa Martinez", status: "CUSTOMER", source: "LINKEDIN_OUTREACH", linkedinUrnId: "urn:li:3" },
  { id: "6", name: "Robert Taylor", status: "PROSPECT", source: "IMPORT" },
  { id: "7", name: "Amanda Brown", status: "CUSTOMER", source: "LINKEDIN_OUTREACH", linkedinUrnId: "urn:li:4" },
  { id: "8", name: "David Kim", status: "LEAD", source: "WEBSITE" },
];

export default function AnalyticsPage() {
  const { counts, loading: countsLoading } = useCounts();
  const [loading, setLoading] = useState(true);
  const [dealStats, setDealStats] = useState<DealStats>({
    totalDeals: 0,
    openDeals: 0,
    wonDeals: 0,
    lostDeals: 0,
    totalValue: 0,
    wonValue: 0,
    winRate: 0,
    avgDealValue: 0,
  });
  const [contactStats, setContactStats] = useState<ContactStats>({
    totalContacts: 0,
    fromOutreach: 0,
    customers: 0,
    prospects: 0,
    conversionRate: 0,
  });
  const [dealsByStage, setDealsByStage] = useState<any[]>([]);
  const [dealsByMonth, setDealsByMonth] = useState<any[]>([]);

  // Helper to process deals data
  const processDeals = (deals: any[]) => {
    const openDeals = deals.filter((d: any) => d.status === "OPEN");
    const wonDeals = deals.filter((d: any) => d.status === "WON");
    const lostDeals = deals.filter((d: any) => d.status === "LOST");
    const totalValue = deals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    const wonValue = wonDeals.reduce((sum: number, d: any) => sum + (d.value || 0), 0);
    const closedDeals = wonDeals.length + lostDeals.length;
    const winRate = closedDeals > 0 ? (wonDeals.length / closedDeals) * 100 : 0;
    const avgDealValue = deals.length > 0 ? totalValue / deals.length : 0;

    setDealStats({
      totalDeals: deals.length,
      openDeals: openDeals.length,
      wonDeals: wonDeals.length,
      lostDeals: lostDeals.length,
      totalValue,
      wonValue,
      winRate,
      avgDealValue,
    });

    // Deals by stage for pie chart
    const stageMap: Record<string, number> = {};
    deals.forEach((deal: any) => {
      const stage = deal.stage || "lead";
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });
    setDealsByStage(
      Object.entries(stageMap).map(([name, value]) => ({ name, value }))
    );

    // Deals by month for line chart
    setDealsByMonth([
      { month: "Jan", deals: 12, value: 45000 },
      { month: "Feb", deals: 19, value: 72000 },
      { month: "Mar", deals: 15, value: 58000 },
      { month: "Apr", deals: 22, value: 89000 },
      { month: "May", deals: 28, value: 112000 },
      { month: "Jun", deals: 24, value: 95000 },
    ]);
  };

  // Helper to process contacts data
  const processContacts = (contacts: any[]) => {
    const fromOutreach = contacts.filter(
      (c: any) => c.source === "LINKEDIN_OUTREACH" || c.linkedinUrnId
    );
    const customers = contacts.filter((c: any) => c.status === "CUSTOMER");
    const prospects = contacts.filter(
      (c: any) => c.status === "PROSPECT" || c.status === "LEAD"
    );
    const conversionRate =
      contacts.length > 0 ? (customers.length / contacts.length) * 100 : 0;

    setContactStats({
      totalContacts: contacts.length,
      fromOutreach: fromOutreach.length,
      customers: customers.length,
      prospects: prospects.length,
      conversionRate,
    });
  };

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Fetch deals
        const { data: deals, status: dealsStatus } = await CrmApiService.getDeals();
        const dealsData = (dealsStatus >= 200 && dealsStatus < 300 && Array.isArray(deals) && deals.length > 0)
          ? deals
          : MOCK_DEALS;
        processDeals(dealsData);

        // Fetch contacts
        const { data: contacts, status: contactsStatus } = await CrmApiService.getContacts();
        const contactsData = (contactsStatus >= 200 && contactsStatus < 300 && Array.isArray(contacts) && contacts.length > 0)
          ? contacts
          : MOCK_CONTACTS;
        processContacts(contactsData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
        // Use mock data on error
        processDeals(MOCK_DEALS);
        processContacts(MOCK_CONTACTS);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Format currency
  const formatCurrency = (value: number, compact = false) => {
    if (compact) {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Pie chart colors
  const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#ef4444"];

  // Stage colors for bar chart
  const stageColors: Record<string, string> = {
    lead: "#6b7280",
    qualified: "#3b82f6",
    proposal: "#8b5cf6",
    negotiation: "#f97316",
    won: "#22c55e",
    lost: "#ef4444",
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Analytics">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your CRM performance and metrics
            </p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Leads */}
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-16" /> : contactStats.totalContacts}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </div>
              </CardContent>
            </Card>

            {/* Pipeline Value */}
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-green-50 dark:bg-green-500/10">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +8%
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      formatCurrency(dealStats.totalValue, true)
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Pipeline Value</p>
                </div>
              </CardContent>
            </Card>

            {/* Win Rate */}
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +5%
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      `${dealStats.winRate.toFixed(0)}%`
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
              </CardContent>
            </Card>

            {/* Deals Won */}
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Badge className="bg-green-100 text-green-700 text-xs">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    +3
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? <Skeleton className="h-8 w-16" /> : dealStats.wonDeals}
                  </p>
                  <p className="text-sm text-muted-foreground">Deals Won</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Deals by Stage */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-[#3b82f6]" />
                  Deals by Stage
                </CardTitle>
                <CardDescription>Distribution across pipeline stages</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Skeleton className="h-48 w-48 rounded-full" />
                  </div>
                ) : dealsByStage.length === 0 ? (
                  <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                    No deal data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={dealsByStage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {dealsByStage.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={stageColors[entry.name] || COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Revenue Trend */}
            <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#3b82f6]" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly deal value over time</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-[250px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dealsByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis
                        stroke="#9ca3af"
                        tickFormatter={(value) => formatCurrency(value, true)}
                      />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "12px",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        fill="url(#colorValue)"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Outreach Conversion */}
          <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Linkedin className="h-5 w-5 text-[#0077b5]" />
                Outreach Conversion
              </CardTitle>
              <CardDescription>
                Leads from LinkedIn Outreach and their conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* From Outreach */}
                <div className="text-center p-4 bg-[#0077b5]/5 rounded-xl">
                  <p className="text-3xl font-bold text-[#0077b5]">
                    {loading ? <Skeleton className="h-9 w-16 mx-auto" /> : contactStats.fromOutreach}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">From Outreach</p>
                </div>

                {/* Prospects */}
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600">
                    {loading ? <Skeleton className="h-9 w-16 mx-auto" /> : contactStats.prospects}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Prospects</p>
                </div>

                {/* Customers */}
                <div className="text-center p-4 bg-green-50 dark:bg-green-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">
                    {loading ? <Skeleton className="h-9 w-16 mx-auto" /> : contactStats.customers}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Customers</p>
                </div>

                {/* Conversion Rate */}
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600">
                    {loading ? (
                      <Skeleton className="h-9 w-16 mx-auto" />
                    ) : (
                      `${contactStats.conversionRate.toFixed(1)}%`
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Lead to Customer Funnel</span>
                </div>
                <Progress
                  value={contactStats.conversionRate}
                  className="h-3"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {loading ? <Skeleton className="h-6 w-12" /> : dealStats.openDeals}
                    </p>
                    <p className="text-sm text-muted-foreground">Open Deals</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {loading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        formatCurrency(dealStats.avgDealValue, true)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Deal Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {loading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : (
                        formatCurrency(dealStats.wonValue, true)
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">Revenue Won</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircle className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-xl font-bold text-foreground">
                      {loading ? <Skeleton className="h-6 w-12" /> : dealStats.lostDeals}
                    </p>
                    <p className="text-sm text-muted-foreground">Deals Lost</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
