"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import LeadsView from "@/components/leads/LeadsView";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import {
  Search,
  Calendar,
  Users,
  MessageSquare,
  Trash2,
  Zap,
  Linkedin,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  Eye,
  Target,
} from "lucide-react";

interface LeadSource {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  active: boolean;
}

interface LeadList {
  id: string;
  name: string;
  description: string;
  url: string;
  status: "in_progress" | "completed" | "failed";
  leadsCount: number;
  createdAt: string;
  lastUpdated: string;
}

interface ApiScrapeItem {
  id: string;
  name: string;
  url: string;
  description: string;
  type: string;
  user_id: string;
  tenant_id: string;
  state: {
    error?: string;
    stats?: {
      totalErrors?: number;
      totalRetries?: number;
      memoryUsageMb?: number;
      processingTimeMs?: number;
      avgPassSuccessRate?: number;
      finalMemoryUsageMb?: number;
      avgBatchSuccessRate?: number;
    };
    status: "processing" | "completed" | "failed";
    endTime?: string;
    startTime?: string;
    savedLeads?: number;
    sourceType?: string;
    totalLeads?: number;
    lastUpdated?: string;
    passHistory?: any[];
    fetchedLeads?: number;
    lastPosition?: number;
    totalAttempts?: number;
    currentAttempt?: number;
    currentPosition?: number;
    paginationLimit?: number;
    completedAttempts?: number;
    currentSavedCount?: number;
    incompleteBatches?: any[];
    maxFetchableLeads?: number;
    overallSuccessRate?: number;
    totalLinkedInLeads?: number;
  };
  created_at: string;
  updated_at: string;
}

export default function LeadScraper() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [scraperName, setScraperName] = useState("");
  const [scraperDescription, setScraperDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [leadLists, setLeadLists] = useState<LeadList[]>([]);
  const [activeSource, setActiveSource] = useState("linkedin-search");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingLeads, setViewingLeads] = useState<string | null>(null);

  // Function to map API response to LeadList format
  const mapApiResponseToLeadList = (apiItem: ApiScrapeItem): LeadList => {
    // Map backend status to frontend status
    const mapStatus = (
      backendStatus: string | undefined
    ): LeadList["status"] => {
      switch (backendStatus) {
        case "in_progress":
          return "in_progress";
        case "completed":
          return "completed";
        case "failed":
          return "failed";
        default:
          return "in_progress";
      }
    };

    return {
      id: apiItem.id,
      name: apiItem.name,
      description: apiItem.description || "",
      url: apiItem.url,
      status: mapStatus(apiItem.state?.status),
      leadsCount:
        apiItem.state?.savedLeads || apiItem.state?.currentSavedCount || 0,
      createdAt: apiItem.created_at,
      lastUpdated: apiItem.state?.lastUpdated || apiItem.updated_at,
    };
  };

  // Function to map activeSource to source_type
  const getSourceTypeFromActiveSource = (source: string) => {
    switch (source) {
      case "linkedin-search":
        return "SEARCH_URL";
      case "linkedin-sales-navigator":
        return "SALES_NAVIGATOR";
      case "linkedin-event":
        return "EVENT";
      case "linkedin-group":
        return "GROUP";
      case "linkedin-post":
        return "POST";
      default:
        return "SEARCH_URL";
    }
  };

  // Function to fetch scrape list from API
  const fetchScrapeList = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sourceType = getSourceTypeFromActiveSource(activeSource);

      const { data, status } = await apiCall({
        url: "/api/tools/scraper/getScrapeList",
        method: "post",
        body: {
          source_type: sourceType,
        },
        applyDefaultDomain: false,
      });

      if (status === 200 && Array.isArray(data)) {
        const mappedLeadLists = data.map(mapApiResponseToLeadList);
        setLeadLists(mappedLeadLists);
      } else {
        setError("Failed to fetch scrape list");
      }
    } catch (err) {
      setError("An error occurred while fetching the scrape list");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on component mount and when activeSource changes
  useEffect(() => {
    fetchScrapeList();
  }, [activeSource]);

  const leadSources: LeadSource[] = [
    {
      id: "linkedin-search",
      name: "LinkedIn Search",
      icon: Search,
      description: "Search for leads using LinkedIn's search filters",
      active: activeSource === "linkedin-search",
    },
    // {
    //   id: "linkedin-sales-navigator",
    //   name: "LinkedIn Sales Navigator",
    //   icon: Target,
    //   description: "Extract leads from LinkedIn Sales Navigator",
    //   active: activeSource === "linkedin-sales-navigator",
    // },
    {
      id: "linkedin-event",
      name: "LinkedIn Event",
      icon: Calendar,
      description: "Extract leads from LinkedIn events",
      active: activeSource === "linkedin-event",
    },
    {
      id: "linkedin-group",
      name: "LinkedIn Group",
      icon: Users,
      description: "Find leads in LinkedIn groups",
      active: activeSource === "linkedin-group",
    },
    {
      id: "linkedin-post",
      name: "LinkedIn Post",
      icon: MessageSquare,
      description: "Extract leads from LinkedIn posts",
      active: activeSource === "linkedin-post",
    },
  ];

  const handleGenerateLeads = async () => {
    if (!linkedinUrl || !scraperName) return;

    setIsGenerating(true);
    try {
      // Map activeSource to source_type enum used by backend
      const source_type = getSourceTypeFromActiveSource(activeSource);

      const resp = await fetch("/api/tools/scraper/createPipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scraperName,
          url: linkedinUrl,
          description: scraperDescription,
          source_type,
        }),
      });

      if (!resp.ok) {
        const msg = await resp.text();

        setError("Failed to create pipeline");
      } else {
        const data = await resp.json();

        // Optimistic add to list as in_progress
        const mapStatus = (
          backendStatus: string | undefined
        ): LeadList["status"] => {
          switch (backendStatus) {
            case "in_progress":
              return "in_progress";
            case "completed":
              return "completed";
            case "failed":
              return "failed";
            default:
              return "in_progress";
          }
        };

        const newLeadList: LeadList = {
          id: data?.id || data?.pipeline_id || Date.now().toString(),
          name: scraperName,
          description: scraperDescription,
          url: linkedinUrl,
          status: mapStatus(data?.state?.status),
          leadsCount: 0,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
        };
        setLeadLists(prev => [newLeadList, ...prev]);

        // Redirect to LeadsView if we have an id
        if (newLeadList.id) {
          setViewingLeads(newLeadList.id);
          return;
        }
      }
    } catch (e) {
      setError("An error occurred while creating the pipeline");
    } finally {
      setIsGenerating(false);
      // Keep form values; user can clear manually if desired
    }
  };

  const getStatusIcon = (status: LeadList["status"]) => {
    switch (status) {
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: LeadList["status"]) => {
    switch (status) {
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 rounded-full px-3 py-1 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 rounded-full px-3 py-1 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 rounded-full px-3 py-1 font-medium">
            <AlertCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  const LeadListsSkeleton = () => (
    <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Skeleton className="w-6 h-6 rounded" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-border/20"
            >
              <div className="flex items-center space-x-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <div className="flex items-center space-x-1">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="w-8 h-8 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // If viewing leads, show the LeadsView component
  if (viewingLeads) {
    return (
      <AuthGuard>
        <AppLayout activePage="Tools">
          <LeadsView
            scrapeId={viewingLeads}
            onBack={() => setViewingLeads(null)}
          />
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AppLayout activePage="Tools">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Lead Sources */}
            <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
              <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl h-fit">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <span>Lead Sources</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Choose your lead generation method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leadSources.map(source => (
                    <div
                      key={source.id}
                      onClick={() => setActiveSource(source.id)}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group",
                        source.active
                          ? "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                          source.active
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                        )}
                      >
                        <source.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-medium text-sm",
                            source.active
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-foreground"
                          )}
                        >
                          {source.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {source.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Lead Scraper Form */}
              <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-gray-600" />
                    <span>Create Lead Scraper Campaign</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Set up your LinkedIn lead generation campaign with
                    AI-powered extraction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* LinkedIn URL Input */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="linkedin-url"
                      className="text-sm font-medium text-foreground flex items-center space-x-2"
                    >
                      <Linkedin className="w-4 h-4 text-blue-600" />
                      <span>
                        {activeSource === "linkedin-search" &&
                          "LinkedIn Search URL *"}
                        {activeSource === "linkedin-sales-navigator" &&
                          "LinkedIn Sales Navigator URL *"}
                        {activeSource === "linkedin-event" &&
                          "LinkedIn Event URL *"}
                        {activeSource === "linkedin-group" &&
                          "LinkedIn Group URL *"}
                        {activeSource === "linkedin-post" &&
                          "LinkedIn Post URL *"}
                      </span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="linkedin-url"
                        type="url"
                        placeholder={
                          activeSource === "linkedin-search"
                            ? "https://www.linkedin.com/search/results/people/?..."
                            : activeSource === "linkedin-sales-navigator"
                              ? "https://www.linkedin.com/sales/search/people?..."
                              : activeSource === "linkedin-event"
                                ? "https://www.linkedin.com/events/..."
                                : activeSource === "linkedin-group"
                                  ? "https://www.linkedin.com/groups/..."
                                  : "https://www.linkedin.com/posts/..."
                        }
                        value={linkedinUrl}
                        onChange={e => setLinkedinUrl(e.target.value)}
                        className="pr-12 h-12 text-base rounded-xl border-border/30 focus:border-gray-500 focus:ring-gray-500/20"
                      />
                      {linkedinUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLinkedinUrl("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-muted"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {activeSource === "linkedin-search" &&
                        "Paste your LinkedIn search URL to extract leads from the results"}
                      {activeSource === "linkedin-sales-navigator" &&
                        "Paste your LinkedIn Sales Navigator URL to extract high-quality leads with advanced filters"}
                      {activeSource === "linkedin-event" &&
                        "Paste your LinkedIn event URL to extract attendees and participants"}
                      {activeSource === "linkedin-group" &&
                        "Paste your LinkedIn group URL to extract group members"}
                      {activeSource === "linkedin-post" &&
                        "Paste your LinkedIn post URL to extract engaged users"}
                    </p>
                  </div>

                  {/* Campaign Details Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Campaign Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="scraper-name"
                        className="text-sm font-medium text-foreground"
                      >
                        Campaign Name *
                      </Label>
                      <Input
                        id="scraper-name"
                        placeholder="E.g., Marketing Managers Q2 2025"
                        value={scraperName}
                        onChange={e => setScraperName(e.target.value)}
                        className="h-12 text-base rounded-xl border-border/30 focus:border-gray-500 focus:ring-gray-500/20"
                      />
                    </div>

                    {/* Campaign Description */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="scraper-description"
                        className="text-sm font-medium text-foreground"
                      >
                        Description
                      </Label>
                      <Input
                        id="scraper-description"
                        placeholder="Add notes about this lead generation campaign..."
                        value={scraperDescription}
                        onChange={e => setScraperDescription(e.target.value)}
                        className="h-12 text-base rounded-xl border-border/30 focus:border-gray-500 focus:ring-gray-500/20"
                      />
                    </div>
                  </div>

                  {/* Generate Button Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {activeSource === "linkedin-search" &&
                            "Ready to generate LinkedIn leads?"}
                          {activeSource === "linkedin-sales-navigator" &&
                            "Ready to extract Sales Navigator leads?"}
                          {activeSource === "linkedin-event" &&
                            "Ready to extract event attendees?"}
                          {activeSource === "linkedin-group" &&
                            "Ready to extract group members?"}
                          {activeSource === "linkedin-post" &&
                            "Ready to extract post engagers?"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {activeSource === "linkedin-search" &&
                            "Our AI will analyze the provided LinkedIn URL and extract leads based on the search criteria. This process may take a few minutes."}
                          {activeSource === "linkedin-sales-navigator" &&
                            "Our AI will analyze your LinkedIn Sales Navigator search link and extract high-quality leads with advanced targeting. This process may take a few minutes."}
                          {activeSource === "linkedin-event" &&
                            "Our AI will analyze the LinkedIn event and extract attendees and participants. This process may take a few minutes."}
                          {activeSource === "linkedin-group" &&
                            "Our AI will analyze the LinkedIn group and extract active members. This process may take a few minutes."}
                          {activeSource === "linkedin-post" &&
                            "Our AI will analyze the LinkedIn post and extract engaged users. This process may take a few minutes."}
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateLeads}
                        disabled={!linkedinUrl || !scraperName || isGenerating}
                        className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isGenerating ? (
                          <>
                            <Clock className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            {activeSource === "linkedin-search" &&
                              "Generate LinkedIn Leads"}
                            {activeSource === "linkedin-sales-navigator" &&
                              "Extract Sales Navigator Leads"}
                            {activeSource === "linkedin-event" &&
                              "Extract Event Attendees"}
                            {activeSource === "linkedin-group" &&
                              "Extract Group Members"}
                            {activeSource === "linkedin-post" &&
                              "Extract Post Engagers"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lead Lists */}
              {isLoading ? (
                <LeadListsSkeleton />
              ) : error ? (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardContent className="py-16">
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-800 dark:to-red-700 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          Error Loading Lead Lists
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          {error}
                        </p>
                        <Button
                          onClick={fetchScrapeList}
                          variant="outline"
                          className="mt-4"
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : leadLists.length > 0 ? (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-foreground flex items-center space-x-2">
                          <Users className="w-6 h-6 text-green-500" />
                          <span>Lead Lists</span>
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                          Your generated lead lists and their status
                        </CardDescription>
                      </div>
                      <Button
                        onClick={fetchScrapeList}
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        Refresh
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leadLists.map(list => (
                        <div
                          key={list.id}
                          className="flex items-center justify-between p-4 bg-white/30 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-border/20 hover:bg-white/50 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-800 dark:to-indigo-800 rounded-xl flex items-center justify-center">
                              {getStatusIcon(list.status)}
                            </div>
                            <div>
                              <h4 className="font-medium text-foreground">
                                {list.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {list.description}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {list.leadsCount} leads
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Created{" "}
                                  {new Date(
                                    list.createdAt
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStatusBadge(list.status)}
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingLeads(list.id)}
                                className="h-8 w-8 rounded-lg"
                                title="View leads"
                              >
                                <Eye className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 rounded-lg"
                                title="Download leads"
                              >
                                <Download className="w-4 h-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Empty State */
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardContent className="py-16">
                    <div className="text-center space-y-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-3xl flex items-center justify-center mx-auto">
                        <Zap className="w-10 h-10 text-gray-600" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-foreground">
                          No Lead Lists Yet
                        </h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                          Create your first lead list by entering a LinkedIn URL
                          above and clicking &quot;Generate LinkedIn Leads&quot;
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
