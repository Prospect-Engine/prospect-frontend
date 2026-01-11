"use client";

import React, { useState, useEffect, useRef } from "react";
import toastService from "@/services/sales-services/toastService";
import {
  analyticsService,
  ComprehensiveAnalytics,
} from "../../services/sales-services/analyticsService";
import { useWorkspace } from "@/hooks/sales-hooks/useWorkspace";
import {
  Users,
  Building2,
  DollarSign,
  Activity,
  CheckSquare,
  GitBranch,
  MessageSquare,
  Mail,
  FileText,
  Settings,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Award,
  CheckCircle,
  AlertCircle,
  Layers,
  Send,
  Eye,
  MousePointer,
  Play,
  Link,
  AlertTriangle,
} from "lucide-react";

interface AnalyticsProps {
  className?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ className = "" }) => {
  const { selectedWorkspace } = useWorkspace();
  const [analyticsData, setAnalyticsData] =
    useState<ComprehensiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMetrics, setShowMetrics] = useState(false);
  const [tabDirection, setTabDirection] = useState<"left" | "right">("right");
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const prevTabRef = useRef(activeTab);

  const tabs = [
    { id: "overview", name: "Overview", icon: BarChart3 },
    { id: "contacts", name: "Contacts", icon: Users },
    { id: "companies", name: "Companies", icon: Building2 },
    { id: "deals", name: "Deals", icon: DollarSign },
    { id: "activities", name: "Activities", icon: Activity },
    { id: "tasks", name: "Tasks", icon: CheckSquare },
    { id: "pipelines", name: "Pipelines", icon: GitBranch },
    { id: "messages", name: "Messages", icon: MessageSquare },
    { id: "campaigns", name: "Campaigns", icon: Mail },
    { id: "notes", name: "Notes", icon: FileText },
    { id: "integrations", name: "Integrations", icon: Settings },
  ];

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedWorkspace?.id) return;

      try {
        setLoading(true);
        setError(null);

        // Get the authentication token
        const token = localStorage.getItem("crm_access_token");
        if (!token) {
          toastService.error("Authentication token not found");
          setError("Authentication token not found");
          return;
        }

        const data = await analyticsService.getComprehensiveAnalytics(
          selectedWorkspace.id,
          selectedWorkspace.organizationId,
          token
        );
        setAnalyticsData(data);
        // Trigger metrics animation after data loads
        setTimeout(() => setShowMetrics(true), 100);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch analytics data"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedWorkspace?.id, selectedWorkspace?.organizationId]);

  // Handle tab direction for smooth transitions
  const handleTabChange = (newTab: string) => {
    const tabIndex = tabs.findIndex(tab => tab.id === newTab);
    const prevTabIndex = tabs.findIndex(tab => tab.id === prevTabRef.current);

    setTabDirection(tabIndex > prevTabIndex ? "right" : "left");
    setActiveTab(newTab);
    prevTabRef.current = newTab;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (rate: number) => {
    if (rate > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
      case "won":
      case "completed":
      case "connected":
        return "text-green-600 bg-green-50";
      case "pending":
      case "open":
        return "text-yellow-600 bg-yellow-50";
      case "inactive":
      case "lost":
      case "draft":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "hot":
        return "text-red-600 bg-red-50";
      case "medium":
      case "warm":
        return "text-yellow-600 bg-yellow-50";
      case "low":
      case "cold":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-blue-500 animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center">
          <AlertCircle className="mx-auto w-8 h-8 text-red-500" />
          <p className="mt-2 text-red-600">Error loading analytics</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className={`flex justify-center items-center h-64 ${className}`}>
        <div className="text-center">
          <BarChart3 className="mx-auto w-8 h-8 text-gray-400" />
          <p className="mt-2 text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const { overview } = analyticsData;

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Comprehensive insights into your sales performance
        </p>
      </div>

      {/* Overview Cards with Smooth Animations */}
      {activeTab === "overview" && (
        <div
          className={`grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-4 transition-all duration-700 ease-out ${
            showMetrics
              ? "opacity-100 transform translate-y-0"
              : "opacity-0 transform translate-y-4"
          }`}
        >
          <div className="p-6 bg-white rounded-lg shadow transition-all duration-500 ease-out transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Contacts
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(overview.totalContacts)}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow transition-all duration-500 ease-out transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(overview.totalDeals)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow transition-all duration-500 ease-out transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(overview.totalValue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg shadow transition-all duration-500 ease-out transform hover:scale-105">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPercentage(overview.overallWinRate)}
                </p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation with Smooth Transitions */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto -mb-px space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-300 ease-in-out transform hover:scale-105 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content with Smooth Slide Transitions */}
      <div className="overflow-hidden relative space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Performance Metrics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Task Completion Rate
                      </span>
                      <span className="text-sm font-medium">
                        {formatPercentage(overview.overallTaskCompletionRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Message Open Rate
                      </span>
                      <span className="text-sm font-medium">
                        {formatPercentage(overview.overallMessageOpenRate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Campaign Open Rate
                      </span>
                      <span className="text-sm font-medium">
                        {formatPercentage(overview.overallCampaignOpenRate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Entity Counts
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Companies</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalCompanies)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Activities</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalActivities)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tasks</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalTasks)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    Communication
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Messages</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalMessages)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Campaigns</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalCampaigns)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Notes</span>
                      <span className="text-sm font-medium">
                        {formatNumber(overview.totalNotes)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity Tables */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Recent Contacts */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Contacts
                    </h3>
                  </div>
                  <div className="p-6">
                    {analyticsData.contacts.recentContacts
                      .slice(0, 5)
                      .map(contact => (
                        <div
                          key={contact.id}
                          className="flex justify-between items-center py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {contact.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(contact.leadType)}`}
                          >
                            {contact.leadType}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Deals */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recent Deals
                    </h3>
                  </div>
                  <div className="p-6">
                    {analyticsData.deals.recentDeals.slice(0, 5).map(deal => (
                      <div
                        key={deal.id}
                        className="flex justify-between items-center py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {deal.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(deal.value)}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(deal.status)}`}
                        >
                          {deal.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {activeTab === "contacts" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Contacts
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.contacts.summary.total)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.contacts.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.contacts.summary.growthRate > 0 ? "+" : ""}
                      {formatPercentage(
                        analyticsData.contacts.summary.growthRate
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.contacts.summary.active)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.contacts.summary.thisMonth)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        LinkedIn
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.contacts.linkedInData.totalWithLinkedIn
                        )}
                      </p>
                    </div>
                    <Award className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Distribution Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Lead Types */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Lead Types
                    </h3>
                  </div>
                  <div className="p-6">
                    {analyticsData.contacts.leadTypes.map((item, index) => (
                      <div
                        key={`lead-type-${item.type}-${index}`}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="text-sm text-gray-600">
                          {item.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">
                            {item.count}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({formatPercentage(item.percentage)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Distribution */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Status Distribution
                    </h3>
                  </div>
                  <div className="p-6">
                    {analyticsData.contacts.statusDistribution.map(
                      (item, index) => (
                        <div
                          key={`status-${item.status}-${index}`}
                          className="flex justify-between items-center py-2"
                        >
                          <span className="text-sm text-gray-600">
                            {item.status}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {item.count}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({formatPercentage(item.percentage)})
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Top Contacts Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Contacts by Lead Score
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Lead Score
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Last Contacted
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.contacts.topContacts.map(contact => (
                        <tr key={contact.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {contact.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {contact.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {contact.leadScore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(contact.status)}`}
                            >
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {contact.lastContactedAt
                              ? new Date(
                                  contact.lastContactedAt
                                ).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Companies Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Companies
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.companies.summary.total)}
                      </p>
                    </div>
                    <Building2 className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.companies.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.companies.summary.growthRate > 0
                        ? "+"
                        : ""}
                      {formatPercentage(
                        analyticsData.companies.summary.growthRate
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Companies
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.companies.summary.active)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.companies.summary.thisMonth
                        )}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Last Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.companies.summary.lastMonth
                        )}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Industry Distribution */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Industry Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.companies.industryDistribution.map(
                      (industry, index) => (
                        <div
                          key={`industry-${industry.industry}-${index}`}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {industry.industry}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${industry.percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-sm text-right text-gray-600">
                              {formatPercentage(industry.percentage)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Top Companies */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Companies
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Industry
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Lead Score
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.companies.topCompanies.map(company => (
                        <tr key={company.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {company.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {company.industry}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {company.leadScore}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(company.status)}`}
                            >
                              {company.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === "deals" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Deals Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Deals
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.deals.summary.total)}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.deals.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.deals.summary.growthRate > 0 ? "+" : ""}
                      {formatPercentage(analyticsData.deals.summary.growthRate)}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(analyticsData.deals.summary.totalValue)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Win Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(analyticsData.deals.summary.winRate)}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Deal Value
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(
                          analyticsData.deals.summary.averageValue
                        )}
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Deal Status Distribution */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deal Status Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.deals.statusDistribution.map(
                      (status, index) => (
                        <div
                          key={`deal-status-${status.status}-${index}`}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {status.status}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-green-600 rounded-full"
                                style={{ width: `${status.percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-sm text-right text-gray-600">
                              {formatPercentage(status.percentage)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Top Deals */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Deals
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Value
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Probability
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Expected Close
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.deals.topDeals.map(deal => (
                        <tr key={deal.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {deal.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                            {formatCurrency(deal.value)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {formatPercentage(deal.probability)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(deal.status)}`}
                            >
                              {deal.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {deal.expectedCloseDate
                              ? new Date(
                                  deal.expectedCloseDate
                                ).toLocaleDateString()
                              : "Not set"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === "activities" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Activities Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Activities
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.activities.summary.total)}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.activities.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.activities.summary.growthRate > 0
                        ? "+"
                        : ""}
                      {formatPercentage(
                        analyticsData.activities.summary.growthRate
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.activities.summary.thisMonth
                        )}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Last Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.activities.summary.lastMonth
                        )}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Success Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.activities.typeDistribution.find(
                            t => t.type === "SUCCESSFUL"
                          )?.percentage || 0
                        )}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Activity Distribution Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Activity Types */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Activity Types
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {analyticsData.activities.typeDistribution.map(
                        (type, index) => (
                          <div
                            key={`activity-type-${type.type}-${index}`}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {type.type}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-blue-600 rounded-full"
                                  style={{ width: `${type.percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-12 text-sm text-right text-gray-600">
                                {formatPercentage(type.percentage)}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Activity Outcomes */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Activity Outcomes
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {analyticsData.activities.outcomeDistribution.map(
                        (outcome, index) => (
                          <div
                            key={`activity-outcome-${outcome.outcome}-${index}`}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {outcome.outcome}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-32 h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-green-600 rounded-full"
                                  style={{ width: `${outcome.percentage}%` }}
                                ></div>
                              </div>
                              <span className="w-12 text-sm text-right text-gray-600">
                                {formatPercentage(outcome.percentage)}
                              </span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activities Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Activities
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Outcome
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.activities.recentActivities.map(
                        activity => (
                          <tr key={activity.id}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {activity.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.type)}`}
                              >
                                {activity.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activity.outcome)}`}
                              >
                                {activity.outcome}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {new Date(
                                activity.createdAt
                              ).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === "tasks" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Tasks Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Tasks
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.tasks.summary.total)}
                      </p>
                    </div>
                    <CheckSquare className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.tasks.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.tasks.summary.growthRate > 0 ? "+" : ""}
                      {formatPercentage(analyticsData.tasks.summary.growthRate)}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.tasks.summary.completed)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Pending
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.tasks.summary.pending)}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Completion Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.tasks.summary.completionRate
                        )}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              {/* Task Status Distribution */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Task Status Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.tasks.statusDistribution.map(
                      (status, index) => (
                        <div
                          key={`task-status-${status.status}-${index}`}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {status.status}
                          </span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full">
                              <div
                                className="h-2 bg-blue-600 rounded-full"
                                style={{ width: `${status.percentage}%` }}
                              ></div>
                            </div>
                            <span className="w-12 text-sm text-right text-gray-600">
                              {formatPercentage(status.percentage)}
                            </span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Tasks Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Tasks
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Priority
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Due Date
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.tasks.recentTasks.map(task => (
                        <tr key={task.id}>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                            {task.title}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}
                            >
                              {task.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}
                            >
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString()
                              : "Not set"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(task.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pipelines Tab */}
        {activeTab === "pipelines" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Pipeline Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Pipelines
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.pipelines.summary.totalPipelines
                        )}
                      </p>
                    </div>
                    <GitBranch className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Pipelines
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.pipelines.summary.activePipelines
                        )}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Stages
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.pipelines.summary.totalStages
                        )}
                      </p>
                    </div>
                    <Layers className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Conversion
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.pipelines.conversionRates[0]
                            ?.conversionRate || 0
                        )}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
              </div>

              {/* Pipeline Distribution */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Pipeline Distribution
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.pipelines.pipelineDistribution.map(
                      pipeline => (
                        <div
                          key={pipeline.pipelineId}
                          className="flex justify-between items-center"
                        >
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {pipeline.pipelineName}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {pipeline.stageCount} stages, {pipeline.dealCount}{" "}
                              deals
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(pipeline.totalValue)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {pipeline.dealCount} deals
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Messages Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Messages
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.messages.summary.total)}
                      </p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Sent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.messages.summary.sent)}
                      </p>
                    </div>
                    <Send className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Open Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.messages.summary.openRate
                        )}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Click Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.messages.summary.clickRate
                        )}
                      </p>
                    </div>
                    <MousePointer className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Channel Performance */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Channel Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Sent
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Opened
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Clicked
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Open Rate
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Click Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.messages.channelPerformance.map(
                        channel => (
                          <tr key={channel.channel}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {channel.channel}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatNumber(channel.sent)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatNumber(channel.opened)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatNumber(channel.clicked)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPercentage(channel.openRate)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPercentage(channel.clickRate)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Campaigns Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Campaigns
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.campaigns.summary.total)}
                      </p>
                    </div>
                    <Mail className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Campaigns
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.campaigns.summary.active)}
                      </p>
                    </div>
                    <Play className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Open Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.campaigns.summary.averageOpenRate
                        )}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Click Rate
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(
                          analyticsData.campaigns.summary.averageClickRate
                        )}
                      </p>
                    </div>
                    <MousePointer className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Campaign Performance */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Campaign Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Sent
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Open Rate
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Click Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.campaigns.performanceMetrics.map(
                        campaign => (
                          <tr key={campaign.campaignId}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {campaign.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {campaign.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded-full">
                                Active
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatNumber(campaign.sent)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPercentage(campaign.openRate)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatPercentage(campaign.clickRate)}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Notes Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Notes
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.notes.summary.total)}
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex items-center mt-2">
                    {getGrowthIcon(analyticsData.notes.summary.growthRate)}
                    <span className="ml-1 text-sm text-gray-600">
                      {analyticsData.notes.summary.growthRate > 0 ? "+" : ""}
                      {formatPercentage(analyticsData.notes.summary.growthRate)}
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        This Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.notes.summary.thisMonth)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Last Month
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.notes.summary.lastMonth)}
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg per Entity
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.notes.entityDistribution.length
                        )}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Entity Distribution */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notes by Entity Type
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {analyticsData.notes.entityDistribution.map(entity => (
                      <div
                        key={entity.entity}
                        className="flex justify-between items-center"
                      >
                        <span className="text-sm font-medium text-gray-700">
                          {entity.entity}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full">
                            <div
                              className="h-2 bg-blue-600 rounded-full"
                              style={{ width: `${entity.percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-12 text-sm text-right text-gray-600">
                            {formatPercentage(entity.percentage)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === "integrations" && (
          <div
            className={`transition-all duration-500 ease-in-out transform ${
              tabDirection === "right"
                ? "animate-slide-in-right"
                : "animate-slide-in-left"
            }`}
            style={{
              animation:
                tabDirection === "right"
                  ? "slide-in-right 0.5s ease-in-out"
                  : "slide-in-left 0.5s ease-in-out",
            }}
          >
            <div className="space-y-6">
              {/* Integrations Summary Cards */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Integrations
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analyticsData.integrations.summary.total)}
                      </p>
                    </div>
                    <Settings className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.integrations.summary.active
                        )}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Connected
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.integrations.summary.connected
                        )}
                      </p>
                    </div>
                    <Link className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="p-6 bg-white rounded-lg shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Error Count
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(
                          analyticsData.integrations.summary.errorCount
                        )}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Integration Usage Stats */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Integration Usage
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Integration
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Usage Count
                        </th>
                        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                          Last Used
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {analyticsData.integrations.usageStats.map(
                        integration => (
                          <tr key={integration.integrationId}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                              {integration.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {integration.type}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {formatNumber(integration.usageCount)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                              {integration.lastUsedAt
                                ? new Date(
                                    integration.lastUsedAt
                                  ).toLocaleDateString()
                                : "Never"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs can be implemented similarly */}
        {activeTab !== "overview" &&
          activeTab !== "contacts" &&
          activeTab !== "companies" &&
          activeTab !== "deals" &&
          activeTab !== "activities" &&
          activeTab !== "tasks" &&
          activeTab !== "pipelines" &&
          activeTab !== "messages" &&
          activeTab !== "campaigns" &&
          activeTab !== "notes" &&
          activeTab !== "integrations" && (
            <div className="p-6 bg-white rounded-lg shadow">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  Coming Soon
                </h3>
                <p className="text-gray-600">
                  Detailed analytics for {activeTab} will be available soon.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Analytics;
