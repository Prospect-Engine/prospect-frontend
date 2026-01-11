"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import { useRouter } from "next/router";
import LeadDetailsDialog from "./LeadDetailsDialog";
import { DetailedLeadData } from "@/types/lead-details";
// import CampaignCreationModal from "./CampaignCreationModal";
import {
  Search,
  Filter,
  Eye,
  MapPin,
  Building,
  X,
  Plus,
  Users,
  Target,
  ArrowLeft,
  ExternalLink,
  Copy,
  Hourglass,
  Star,
  CheckSquare,
  Square,
  Download,
  Lock,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Lead data interfaces based on the API response
interface Lead {
  id: string;
  pipeline_id: string;
  urn_id: string;
  name: string;
  headline: string;
  location: string;
  connection_degree: string;
  profile_url: string;
  profile_image_url: string;
  other_details: string;
  created_at: string;
  updated_at: string;
  profile_pic_url: string;
  has_enriched_profile: boolean;
  enrichedProfileData?: EnrichedProfile;
}

interface EnrichedProfile {
  integrationId: string;
  urn_id: string;
  public_id: string;
  aboutThisProfile: {
    name: string;
    joined: string;
    contact_information: string;
    profile_photo: string;
    Verifications: Array<{
      Identity: string;
    }>;
  };
  jobDetails?: {
    currentTitle: string;
    currentCompany: string;
    industry: string;
    reactionType: string;
  };
  contactInfo: {
    profile_public_id: string;
    websites: string[];
    phone: string[];
    address: string[];
    email: string[];
    IM: string[];
    birthday: string;
    connected: string;
  };
  jobPreferences: {
    name: string;
    isOpenToWork: boolean;
    jobTitles: string[];
    locationTypes: string[];
    locationsOnSite: string[];
    locationsRemote: string[];
    startDate: string;
    employmentTypes: string[];
  };
  aboutSection: {
    about: string;
  };
  posts: Array<{
    text: string;
  }>;
  featuredSection: Array<{
    type: string;
    links: Array<{
      url: string;
    }>;
    text?: string;
    title?: string;
    linkText?: string;
    mediaUrls?: string[];
  }>;
  recommendations: Array<{
    name: string;
    headLine: string;
    recommendationSource: string;
    text: string;
    recommenderUrn: string;
    publicIdentifier: string;
  }>;
  experience: Array<{
    position: string;
    duration: string;
    location?: string;
    company: string;
    url?: string;
    description: string;
    skills: string;
    positionHistory?: Array<{
      position: string;
      duration: string;
    }>;
  }>;
  companies: Array<{
    url: string;
    data: {
      companyName: string;
      headline: string;
      description: string;
      website?: string;
      founded?: string;
      specialities: string[];
      phoneNumber?: string;
      companySize: string;
      addresses: Array<{
        country: string;
        geographicArea: string;
        city: string;
        postalCode: string;
        line1: string;
        line2: string;
        description: string;
        headquarter: boolean;
      }>;
      industry: string;
    };
  }>;
  mutualContacts: {
    totalCount: number;
    accounts: Array<{
      name: string;
      headline: string;
      providesServices?: string;
      publicId: string;
      urn: string;
    }>;
  };
  leadLocation: {
    location: string;
  };
  fetchedAt: string;
}

interface ScrapeDetails {
  id: string;
  type: string;
  name: string;
  url: string;
  description: string;
  other_details: any;
  state: {
    stats: {
      coverage: string;
      passTimeMs: number;
      totalErrors: number;
      totalRetries: number;
      memoryUsageMb: number;
      leadsPerSecond: string;
      processingTime: number;
      avgPassSuccessRate: number;
      finalMemoryUsageMb: number;
      avgBatchSuccessRate: number;
      currentMemoryUsageMb: number;
      totalProcessingTimeSec: number;
      currentProcessingTimeMs: number;
    };
    status: "in_progress" | "completed" | "failed";
    endTime: string;
    progress: {
      coverage: string;
      percentage: number;
      totalPasses: number;
      currentBatch: number;
      totalBatches: number;
      completedPasses: number;
    };
    savedLeads: number;
    sourceType: string;
    totalLeads: number;
    lastUpdated: string;
    passHistory: any[];
    fetchedLeads: number;
    lastPosition: number;
    totalAttempts: number;
    currentAttempt: number;
    currentPosition: number;
    paginationLimit: number;
    completedAttempts: number;
    currentSavedCount: number;
    incompleteBatches: any[];
    maxFetchableLeads: number;
    currentPassMetrics: any;
    overallSuccessRate: number;
    totalLinkedInLeads: number;
  };
  user_id: string;
  // Support both legacy (tenant_id) and new (organization_id) field names
  tenant_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

interface LeadsViewProps {
  scrapeId: string;
  onBack: () => void;
}

// Local types for enrichment and campaigns
// (reserved) Enrichment job status shape. Not directly used yet, keep for reference.
// type EnrichmentJobStatus = {
//   job_id?: string;
//   processed?: number;
//   total?: number;
//   status?: string;
// };

interface QuotaData {
  remaining?: number;
  today_usage_count?: number;
  today_allocated_quota?: number;
  resets_at?: string;
  userId?: string;
  isPremium?: boolean;
  dailyLimit?: number;
  date?: string;
  plan?: string;
}

interface EnrichmentJobData {
  job_id: string;
  pipeline_id: string;
  total_leads: number;
  status: "processing" | "completed" | "failed" | "paused";
  started_at: string;
  processed?: number;
  enriched?: number;
  cached?: number;
  failed?: number;
  is_paused?: boolean;
  workflow_status?: string;
}

// Campaign interface based on analysis
interface Campaign {
  id: string;
  name: string;
  // Support both legacy (tenant_id) and new (organization_id) field names
  tenant_id?: string;
  organization_id?: string;
  status?: "DRAFT" | "ACTIVE";
  process_status?:
    | "PENDING"
    | "PROCESSING"
    | "PROCESSED"
    | "PAUSED"
    | "RECONNECTING";
  is_locked?: boolean;
  sequence_id?: string;
  skip_lead_conditions?: string[];
  target_leads_id?: string | null;
  target_leads_count?: number | null;
  work_calender_id?: string | null;
  integration_id?: string | null;
  launched_at?: Date | null;
  created_at?: Date;
  daily_engine_quota?: any | null;
  loading?: boolean | null;
  campaign_stats?: any | null;
  is_archived?: boolean;
}

export default function LeadsView({ scrapeId, onBack }: LeadsViewProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [scrapeDetails, setScrapeDetails] = useState<ScrapeDetails | null>(
    null
  );
  // Enrichment state
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichJobId, setEnrichJobId] = useState<string | null>(null);
  const [enrichmentJobData, setEnrichmentJobData] =
    useState<EnrichmentJobData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [titleFilter, setTitleFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [detailedLeadData, setDetailedLeadData] =
    useState<DetailedLeadData | null>(null);
  const [leadDetailsLoading, setLeadDetailsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  // Campaign state
  const [showCampaignsDialog, setShowCampaignsDialog] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignError, setCampaignError] = useState<string | null>(null);
  const [exportingCampaignId, setExportingCampaignId] = useState<string | null>(
    null
  );
  // Quota state
  const [quota, setQuota] = useState<QuotaData | null>(null);
  // Notifications
  const [notice, setNotice] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  // (reserved) Confirmations - not used yet
  // const [confirmNewCampaign, setConfirmNewCampaign] = useState(false);
  // const [confirmExistingCampaignId, setConfirmExistingCampaignId] = useState<string | null>(null);
  // Campaign UX

  // Poll scrape details while processing
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const resp = await fetch("/api/tools/scraper/getScrapeDetails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline_id: scrapeId }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setScrapeDetails(data);
        }
      } catch {
        // ignore transient errors
      }
    };

    // initial load
    fetchDetails();

    const timer = setInterval(() => {
      // keep polling until completed or failed
      if (
        scrapeDetails?.state?.status === "completed" ||
        scrapeDetails?.state?.status === "failed"
      ) {
        clearInterval(timer);
      } else {
        fetchDetails();
      }
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, [scrapeId, scrapeDetails?.state?.status]);

  // Poll leads while processing to reflect new arrivals
  useEffect(() => {
    if (scrapeDetails?.state?.status !== "in_progress") return;
    const fetchLeads = async () => {
      try {
        const resp = await fetch("/api/tools/scraper/getAllLeads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: scrapeId }),
        });
        if (resp.ok) {
          const data = await resp.json();
          if (Array.isArray(data)) setLeads(data);
        }
      } catch {}
    };
    fetchLeads();
    const timer = setInterval(fetchLeads, 7000);
    return () => {
      clearInterval(timer);
    };
  }, [scrapeDetails?.state?.status, scrapeId]);

  // Handle clicking outside filter dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(event.target as Node)
      ) {
        setShowFilterDropdown(false);
      }
    };

    if (showFilterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterDropdown]);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState({
    name: "",
    headline: "",
    location: "",
    profileUrl: "",
    connectionDegree: "",
    enrichedProfile: "all",
  });

  // Additional filter states
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [hasProfileImage, setHasProfileImage] = useState("all");
  const [connectionDegreeFilter, setConnectionDegreeFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Fetch leads and scrape details
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch scrape details
        const detailsResponse = await apiCall({
          url: "/api/tools/scraper/getScrapeDetails",
          method: "post",
          body: { pipeline_id: scrapeId },
          applyDefaultDomain: false,
        });

        if (detailsResponse.status === 200) {
          setScrapeDetails(detailsResponse.data);
        } else {
          setError(
            detailsResponse.data?.message || "Failed to fetch scrape details"
          );
        }

        // Fetch all leads
        const leadsResponse = await apiCall({
          url: "/api/tools/scraper/getAllLeads",
          method: "post",
          body: { id: scrapeId },
          applyDefaultDomain: false,
        });

        if (leadsResponse.status === 200 && Array.isArray(leadsResponse.data)) {
          setLeads(leadsResponse.data);
        } else {
          setError(leadsResponse.data?.message || "Failed to fetch leads");
        }
      } catch (err) {
        setError("An error occurred while fetching the data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [scrapeId]);

  // Fetch quota (for enrich display)
  const fetchQuota = async () => {
    try {
      const resp = await fetch("/api/tools/enrich/quotaRefresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        setQuota({
          remaining: data?.remaining ?? data?.data?.remaining,
          today_usage_count:
            data?.today_usage_count ?? data?.data?.today_usage_count,
          today_allocated_quota:
            data?.today_allocated_quota ?? data?.data?.today_allocated_quota,
          resets_at: data?.resets_at ?? data?.data?.resets_at,
          userId: data?.userId ?? data?.data?.userId,
          isPremium: data?.isPremium ?? data?.data?.isPremium,
          dailyLimit: data?.dailyLimit ?? data?.data?.dailyLimit,
          date: data?.date ?? data?.data?.date,
          plan: data?.plan ?? data?.data?.plan,
        });
        return data;
      }
    } catch (error) {}
    return null;
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  const refreshQuota = useCallback(async () => {
    return await fetchQuota();
  }, []);

  // Enhanced frontend filtering with comprehensive search and sorting
  const filteredLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      // Enhanced basic search - search across multiple fields
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        debouncedSearchTerm === "" ||
        lead.name.toLowerCase().includes(searchLower) ||
        lead.headline.toLowerCase().includes(searchLower) ||
        lead.location.toLowerCase().includes(searchLower) ||
        lead.connection_degree.toLowerCase().includes(searchLower) ||
        lead.profile_url.toLowerCase().includes(searchLower) ||
        // Search in enriched profile data if available
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const enrichedProfile = otherDetails.enrichedProfile;
            if (enrichedProfile) {
              return (
                (enrichedProfile.jobDetails?.currentCompany || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.jobDetails?.currentTitle || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.aboutSection?.about || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.contactInfo?.websites || []).some(
                  (website: string) =>
                    website.toLowerCase().includes(searchLower)
                ) ||
                (enrichedProfile.experience || []).some(
                  (exp: any) =>
                    (exp.position || "").toLowerCase().includes(searchLower) ||
                    (exp.company || "").toLowerCase().includes(searchLower)
                )
              );
            }
          } catch {
            // Ignore JSON parse errors
          }
          return false;
        })();

      // Basic filters with improved matching
      const matchesLocation =
        locationFilter === "all" ||
        lead.location.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesCompany =
        companyFilter === "all" ||
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const currentCompany =
              otherDetails.enrichedProfile?.jobDetails?.currentCompany;
            return (
              currentCompany &&
              currentCompany.toLowerCase().includes(companyFilter.toLowerCase())
            );
          } catch {
            return lead.headline
              .toLowerCase()
              .includes(companyFilter.toLowerCase());
          }
        })();

      const matchesTitle =
        titleFilter === "all" ||
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const currentTitle =
              otherDetails.enrichedProfile?.jobDetails?.currentTitle;
            return (
              currentTitle &&
              currentTitle.toLowerCase().includes(titleFilter.toLowerCase())
            );
          } catch {
            return lead.headline
              .toLowerCase()
              .includes(titleFilter.toLowerCase());
          }
        })();

      // Advanced filters with enhanced matching
      const matchesAdvancedName =
        !advancedFilters.name ||
        lead.name.toLowerCase().includes(advancedFilters.name.toLowerCase());

      const matchesAdvancedHeadline =
        !advancedFilters.headline ||
        lead.headline
          .toLowerCase()
          .includes(advancedFilters.headline.toLowerCase());

      const matchesAdvancedLocation =
        !advancedFilters.location ||
        lead.location
          .toLowerCase()
          .includes(advancedFilters.location.toLowerCase());

      const matchesAdvancedProfileUrl =
        !advancedFilters.profileUrl ||
        lead.profile_url
          .toLowerCase()
          .includes(advancedFilters.profileUrl.toLowerCase());

      const matchesAdvancedConnectionDegree =
        !advancedFilters.connectionDegree ||
        lead.connection_degree
          .toLowerCase()
          .includes(advancedFilters.connectionDegree.toLowerCase());

      const matchesEnrichedProfile =
        advancedFilters.enrichedProfile === "all" ||
        (advancedFilters.enrichedProfile === "enriched" &&
          lead.has_enriched_profile) ||
        (advancedFilters.enrichedProfile === "notEnriched" &&
          !lead.has_enriched_profile);

      // Additional filters
      const matchesDateRange =
        (!dateRange.start ||
          new Date(lead.created_at) >= new Date(dateRange.start)) &&
        (!dateRange.end ||
          new Date(lead.created_at) <= new Date(dateRange.end));

      const matchesProfileImage =
        hasProfileImage === "all" ||
        (hasProfileImage === "hasImage" &&
          (lead.profile_image_url || lead.profile_pic_url)) ||
        (hasProfileImage === "noImage" &&
          !lead.profile_image_url &&
          !lead.profile_pic_url);

      const matchesConnectionDegree =
        connectionDegreeFilter === "all" ||
        lead.connection_degree
          .toLowerCase()
          .includes(connectionDegreeFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCompany &&
        matchesTitle &&
        matchesAdvancedName &&
        matchesAdvancedHeadline &&
        matchesAdvancedLocation &&
        matchesAdvancedProfileUrl &&
        matchesAdvancedConnectionDegree &&
        matchesEnrichedProfile &&
        matchesDateRange &&
        matchesProfileImage &&
        matchesConnectionDegree
      );
    });

    // Enhanced sorting options
    const sortedFiltered = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "headline":
          comparison = a.headline.localeCompare(b.headline);
          break;
        case "location":
          comparison = a.location.localeCompare(b.location);
          break;
        case "created_at":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "updated_at":
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case "connection_degree":
          comparison = a.connection_degree.localeCompare(b.connection_degree);
          break;
        case "enriched":
          comparison =
            (a.has_enriched_profile ? 1 : 0) - (b.has_enriched_profile ? 1 : 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedFiltered.slice(startIndex, endIndex);
  }, [
    leads,
    debouncedSearchTerm,
    locationFilter,
    companyFilter,
    titleFilter,
    advancedFilters,
    currentPage,
    sortBy,
    sortOrder,
    dateRange,
    hasProfileImage,
    connectionDegreeFilter,
    itemsPerPage,
  ]);

  // Pagination calculations
  const totalFilteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Enhanced basic search - search across multiple fields
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        debouncedSearchTerm === "" ||
        lead.name.toLowerCase().includes(searchLower) ||
        lead.headline.toLowerCase().includes(searchLower) ||
        lead.location.toLowerCase().includes(searchLower) ||
        lead.connection_degree.toLowerCase().includes(searchLower) ||
        lead.profile_url.toLowerCase().includes(searchLower) ||
        // Search in enriched profile data if available
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const enrichedProfile = otherDetails.enrichedProfile;
            if (enrichedProfile) {
              return (
                (enrichedProfile.jobDetails?.currentCompany || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.jobDetails?.currentTitle || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.aboutSection?.about || "")
                  .toLowerCase()
                  .includes(searchLower) ||
                (enrichedProfile.contactInfo?.websites || []).some(
                  (website: string) =>
                    website.toLowerCase().includes(searchLower)
                ) ||
                (enrichedProfile.experience || []).some(
                  (exp: any) =>
                    (exp.position || "").toLowerCase().includes(searchLower) ||
                    (exp.company || "").toLowerCase().includes(searchLower)
                )
              );
            }
          } catch {
            // Ignore JSON parse errors
          }
          return false;
        })();

      // Basic filters with improved matching
      const matchesLocation =
        locationFilter === "all" ||
        lead.location.toLowerCase().includes(locationFilter.toLowerCase());

      const matchesCompany =
        companyFilter === "all" ||
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const currentCompany =
              otherDetails.enrichedProfile?.jobDetails?.currentCompany;
            return (
              currentCompany &&
              currentCompany.toLowerCase().includes(companyFilter.toLowerCase())
            );
          } catch {
            return lead.headline
              .toLowerCase()
              .includes(companyFilter.toLowerCase());
          }
        })();

      const matchesTitle =
        titleFilter === "all" ||
        (() => {
          try {
            const otherDetails = JSON.parse(lead.other_details || "{}");
            const currentTitle =
              otherDetails.enrichedProfile?.jobDetails?.currentTitle;
            return (
              currentTitle &&
              currentTitle.toLowerCase().includes(titleFilter.toLowerCase())
            );
          } catch {
            return lead.headline
              .toLowerCase()
              .includes(titleFilter.toLowerCase());
          }
        })();

      // Advanced filters with enhanced matching
      const matchesAdvancedName =
        !advancedFilters.name ||
        lead.name.toLowerCase().includes(advancedFilters.name.toLowerCase());

      const matchesAdvancedHeadline =
        !advancedFilters.headline ||
        lead.headline
          .toLowerCase()
          .includes(advancedFilters.headline.toLowerCase());

      const matchesAdvancedLocation =
        !advancedFilters.location ||
        lead.location
          .toLowerCase()
          .includes(advancedFilters.location.toLowerCase());

      const matchesAdvancedProfileUrl =
        !advancedFilters.profileUrl ||
        lead.profile_url
          .toLowerCase()
          .includes(advancedFilters.profileUrl.toLowerCase());

      const matchesAdvancedConnectionDegree =
        !advancedFilters.connectionDegree ||
        lead.connection_degree
          .toLowerCase()
          .includes(advancedFilters.connectionDegree.toLowerCase());

      const matchesEnrichedProfile =
        advancedFilters.enrichedProfile === "all" ||
        (advancedFilters.enrichedProfile === "enriched" &&
          lead.has_enriched_profile) ||
        (advancedFilters.enrichedProfile === "notEnriched" &&
          !lead.has_enriched_profile);

      // Additional filters
      const matchesDateRange =
        (!dateRange.start ||
          new Date(lead.created_at) >= new Date(dateRange.start)) &&
        (!dateRange.end ||
          new Date(lead.created_at) <= new Date(dateRange.end));

      const matchesProfileImage =
        hasProfileImage === "all" ||
        (hasProfileImage === "hasImage" &&
          (lead.profile_image_url || lead.profile_pic_url)) ||
        (hasProfileImage === "noImage" &&
          !lead.profile_image_url &&
          !lead.profile_pic_url);

      const matchesConnectionDegree =
        connectionDegreeFilter === "all" ||
        lead.connection_degree
          .toLowerCase()
          .includes(connectionDegreeFilter.toLowerCase());

      return (
        matchesSearch &&
        matchesLocation &&
        matchesCompany &&
        matchesTitle &&
        matchesAdvancedName &&
        matchesAdvancedHeadline &&
        matchesAdvancedLocation &&
        matchesAdvancedProfileUrl &&
        matchesAdvancedConnectionDegree &&
        matchesEnrichedProfile &&
        matchesDateRange &&
        matchesProfileImage &&
        matchesConnectionDegree
      );
    }).length;
  }, [
    leads,
    debouncedSearchTerm,
    locationFilter,
    companyFilter,
    titleFilter,
    advancedFilters,
    dateRange,
    hasProfileImage,
    connectionDegreeFilter,
  ]);

  const totalPages = Math.ceil(totalFilteredLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFilteredLeads);

  // Enhanced unique filters that extract data from both basic and enriched profile data
  const uniqueLocations = useMemo(() => {
    const locations = leads.map(lead => lead.location).filter(Boolean);
    return Array.from(new Set(locations)).sort();
  }, [leads]);

  // Get unique companies for filter - from both headline and enriched data
  const uniqueCompanies = useMemo(() => {
    const companies = leads
      .map(lead => {
        try {
          const otherDetails = JSON.parse(lead.other_details || "{}");
          const enrichedCompany =
            otherDetails.enrichedProfile?.jobDetails?.currentCompany;
          if (enrichedCompany) return enrichedCompany;
        } catch {
          // Ignore JSON parse errors
        }
        // Fallback to extracting company from headline
        const headline = lead.headline;
        if (headline && headline.includes(" at ")) {
          return headline.split(" at ")[1]?.trim();
        }
        return null;
      })
      .filter(Boolean);
    return Array.from(new Set(companies)).sort();
  }, [leads]);

  // Get unique titles for filter - from both headline and enriched data
  const uniqueTitles = useMemo(() => {
    const titles = leads
      .map(lead => {
        try {
          const otherDetails = JSON.parse(lead.other_details || "{}");
          const enrichedTitle =
            otherDetails.enrichedProfile?.jobDetails?.currentTitle;
          if (enrichedTitle) return enrichedTitle;
        } catch {
          // Ignore JSON parse errors
        }
        // Fallback to extracting title from headline
        const headline = lead.headline;
        if (headline && headline.includes(" at ")) {
          return headline.split(" at ")[0]?.trim();
        }
        return headline;
      })
      .filter(Boolean);
    return Array.from(new Set(titles)).sort();
  }, [leads]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    locationFilter,
    companyFilter,
    titleFilter,
    advancedFilters,
    sortBy,
    sortOrder,
    dateRange,
    hasProfileImage,
    connectionDegreeFilter,
  ]);

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    }
  };

  const handleViewLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setDetailedLeadData(null); // Reset detailed data
    setIsLeadModalOpen(true);

    if (lead.urn_id) {
      setLeadDetailsLoading(true);
      try {
        const response = await apiCall({
          url: "/api/tools/scraper/getLeadDetails",
          method: "post",
          body: {
            pipelineId: lead.pipeline_id,
            urn_id: lead.urn_id,
          },
          applyDefaultDomain: false,
        });

        if (response.status === 200) {
          setDetailedLeadData(response.data);
        } else {
          setError("Failed to fetch lead details");
        }
      } catch (error) {
        setError("An error occurred while fetching lead details");
      } finally {
        setLeadDetailsLoading(false);
      }
    }
  };

  const handleCloseLeadDetailsDialog = () => {
    setIsLeadModalOpen(false);
    setSelectedLead(null);
    setDetailedLeadData(null);
    setLeadDetailsLoading(false);
  };

  const handleExportLeads = async () => {
    //
    try {
      setIsExporting(true);
      const selectedIds =
        selectedLeads.size > 0 ? Array.from(selectedLeads) : null;
      //

      // Use direct fetch for CSV response to avoid JSON parsing
      const response = await fetch("/api/tools/export/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scrapeId,
          selectedLeadIds: selectedIds,
          exportType: "csv",
        }),
      });

      //

      if (response.ok) {
        // Get the CSV data as text
        const csvData = await response.text();
        //

        // Create blob and download
        const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        //
      } else {
        const errorData = await response.text();

        setError("Failed to export leads");
      }
    } catch (err) {
      setError("An error occurred while exporting leads");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEnrichLeads = async () => {
    try {
      if (isEnriching) return;
      setIsEnriching(true);
      setError(null);
      setNotice(null);

      // Collect urn_ids from selected or all leads
      const targetLeadIds =
        selectedLeads.size > 0
          ? Array.from(selectedLeads)
          : leads.map(l => l.id);
      const idToUrn = new Map(leads.map(l => [l.id, l.urn_id] as const));
      const urn_ids = targetLeadIds
        .map(id => idToUrn.get(id))
        .filter(Boolean) as string[];

      if (urn_ids.length === 0) {
        setNotice({ type: "error", message: "No valid leads found to enrich" });
        setIsEnriching(false);
        return;
      }

      // Check quota before starting
      const quotaData = await fetchQuota();
      if (
        quotaData &&
        quotaData.remaining !== undefined &&
        urn_ids.length > quotaData.remaining
      ) {
        setNotice({
          type: "error",
          message: `Not enough quota! You need ${urn_ids.length} leads but only have ${quotaData.remaining} remaining. Quota resets at ${new Date(quotaData.resets_at).toLocaleString()}`,
        });
        setIsEnriching(false);
        return;
      }

      // Handle large batches by splitting into chunks of 100
      const batchSize = 100;
      const batches = [];
      for (let i = 0; i < urn_ids.length; i += batchSize) {
        batches.push(urn_ids.slice(i, i + batchSize));
      }

      // Start with first batch
      const firstBatch = batches[0];
      const resp = await fetch("/api/tools/enrich/batchEnrichLeads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipelineId: scrapeId,
          urn_ids: firstBatch,
          job_name: `Pipeline ${scrapeId}`,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();

        setNotice({ type: "error", message: "Failed to start enrichment" });
        setIsEnriching(false);
        return;
      }

      const data = await resp.json();
      if (data?.success && data?.job_id) {
        const jobData: EnrichmentJobData = {
          job_id: String(data.job_id),
          pipeline_id: data.pipeline_id,
          total_leads: data.total_leads,
          status: data.status,
          started_at: data.started_at,
          processed: 0,
          enriched: 0,
          cached: 0,
          failed: 0,
        };

        setEnrichJobId(String(data.job_id));
        setEnrichmentJobData(jobData);

        // Persist job data
        try {
          localStorage.setItem(
            `enrichment_job_${scrapeId}`,
            JSON.stringify(jobData)
          );
        } catch {}

        // Add remaining batches if any
        if (batches.length > 1) {
          for (let i = 1; i < batches.length; i++) {
            try {
              await fetch("/api/tools/enrich/batchEnrichEditUrns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  job_id: data.job_id,
                  urn_ids: batches[i],
                  action: "add",
                }),
              });
              // Add delay between batches
              if (i < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            } catch (error) {}
          }
        }

        // Refresh quota after starting
        await refreshQuota();
        setNotice({
          type: "success",
          message: `Enrichment started for ${urn_ids.length} leads${batches.length > 1 ? ` (${batches.length} batches)` : ""}`,
        });
      } else {
        setNotice({
          type: "error",
          message: data?.error || "Failed to start enrichment",
        });
        setIsEnriching(false);
      }
    } catch (e) {
      setNotice({
        type: "error",
        message: "An error occurred while starting enrichment",
      });
      setIsEnriching(false);
    }
  };

  // Poll enrichment job status
  useEffect(() => {
    // Restore persisted job if exists
    const restoreJob = () => {
      try {
        const raw = localStorage.getItem(`enrichment_job_${scrapeId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.job_id && !enrichJobId) {
            setEnrichJobId(String(parsed.job_id));
            setEnrichmentJobData(parsed);
            setIsEnriching(
              parsed.status === "processing" || parsed.status === "paused"
            );
          }
        }
      } catch (error) {}
    };

    restoreJob();
  }, [scrapeId, enrichJobId]);

  useEffect(() => {
    if (!enrichJobId) return;

    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    const pollStatus = async () => {
      try {
        const resp = await fetch("/api/tools/enrich/batchEnrichStatus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ job_id: enrichJobId }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (!mounted) return;

          const updatedJobData: EnrichmentJobData = {
            job_id: enrichJobId,
            pipeline_id: enrichmentJobData?.pipeline_id || scrapeId,
            total_leads:
              data?.progress?.total ||
              data?.total_urns ||
              enrichmentJobData?.total_leads ||
              0,
            status: data?.status || "processing",
            started_at:
              enrichmentJobData?.started_at || new Date().toISOString(),
            processed: data?.progress?.processed || data?.processed || 0,
            enriched: data?.progress?.enriched || data?.enriched || 0,
            cached: data?.progress?.cached || data?.cached || 0,
            failed: data?.progress?.failed || data?.failed || 0,
            is_paused: data?.is_paused || false,
            workflow_status: data?.workflow_status,
          };

          setEnrichmentJobData(updatedJobData);

          // Persist updated data
          try {
            localStorage.setItem(
              `enrichment_job_${scrapeId}`,
              JSON.stringify(updatedJobData)
            );
          } catch {}

          // Handle completion
          if (data?.status === "completed" || data?.status === "failed") {
            setIsEnriching(false);
            setEnrichJobId(null);

            // Clean up localStorage
            try {
              localStorage.removeItem(`enrichment_job_${scrapeId}`);
            } catch {}

            // Refresh quota and leads
            await refreshQuota();

            // Refresh leads to show enriched status
            try {
              const leadsResponse = await apiCall({
                url: "/api/tools/scraper/getAllLeads",
                method: "post",
                body: { id: scrapeId },
                applyDefaultDomain: false,
              });
              if (
                leadsResponse.status === 200 &&
                Array.isArray(leadsResponse.data)
              ) {
                setLeads(leadsResponse.data);
              }
            } catch (error) {}

            // Show completion message
            if (data?.status === "completed") {
              const processed = updatedJobData.processed || 0;
              const enriched = updatedJobData.enriched || 0;
              const cached = updatedJobData.cached || 0;
              const failed = updatedJobData.failed || 0;

              setNotice({
                type: "success",
                message: `Enrichment completed! Processed: ${processed}, Enriched: ${enriched}, Cached: ${cached}, Failed: ${failed}`,
              });
            } else {
              setNotice({
                type: "error",
                message: "Enrichment failed. Please try again.",
              });
            }

            // Clear interval
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        }
      } catch (error) {}
    };

    // Initial poll
    pollStatus();

    // Set up interval for ongoing polling
    intervalId = setInterval(pollStatus, 3000); // Poll every 3 seconds

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    enrichJobId,
    scrapeId,
    enrichmentJobData?.pipeline_id,
    enrichmentJobData?.started_at,
    enrichmentJobData?.total_leads,
    refreshQuota,
  ]);

  const handlePauseEnrichment = async () => {
    if (!enrichJobId) return;
    try {
      const resp = await fetch("/api/tools/enrich/batchEnrichPause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: enrichJobId }),
      });

      if (resp.ok) {
        setNotice({ type: "success", message: "Enrichment paused." });
        // Update local state
        if (enrichmentJobData) {
          const updatedData = {
            ...enrichmentJobData,
            status: "paused" as const,
          };
          setEnrichmentJobData(updatedData);
          try {
            localStorage.setItem(
              `enrichment_job_${scrapeId}`,
              JSON.stringify(updatedData)
            );
          } catch {}
        }
      } else {
        setNotice({ type: "error", message: "Failed to pause enrichment." });
      }
    } catch (error) {
      setNotice({ type: "error", message: "Failed to pause enrichment." });
    }
  };

  const handleResumeEnrichment = async () => {
    if (!enrichJobId) return;
    try {
      const resp = await fetch("/api/tools/enrich/batchEnrichResume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: enrichJobId }),
      });

      if (resp.ok) {
        setNotice({ type: "success", message: "Enrichment resumed." });
        // Update local state
        if (enrichmentJobData) {
          const updatedData = {
            ...enrichmentJobData,
            status: "processing" as const,
          };
          setEnrichmentJobData(updatedData);
          try {
            localStorage.setItem(
              `enrichment_job_${scrapeId}`,
              JSON.stringify(updatedData)
            );
          } catch {}
        }
      } else {
        setNotice({ type: "error", message: "Failed to resume enrichment." });
      }
    } catch (error) {
      setNotice({ type: "error", message: "Failed to resume enrichment." });
    }
  };

  const handleStopEnrichment = async () => {
    if (!enrichJobId) return;
    try {
      const resp = await fetch("/api/tools/enrich/batchEnrichStop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: enrichJobId }),
      });

      if (resp.ok) {
        setIsEnriching(false);
        setEnrichJobId(null);
        setEnrichmentJobData(null);

        // Clean up localStorage
        try {
          localStorage.removeItem(`enrichment_job_${scrapeId}`);
        } catch {}

        setNotice({ type: "success", message: "Enrichment stopped." });
        await refreshQuota();
      } else {
        setNotice({ type: "error", message: "Failed to stop enrichment." });
      }
    } catch (error) {
      setNotice({ type: "error", message: "Failed to stop enrichment." });
    }
  };

  const handleResetAdvancedFilters = () => {
    setAdvancedFilters({
      name: "",
      headline: "",
      location: "",
      profileUrl: "",
      connectionDegree: "",
      enrichedProfile: "all",
    });
    // Also reset basic filters
    setSearchTerm("");
    setLocationFilter("all");
    setCompanyFilter("all");
    setTitleFilter("all");
    // Reset additional filters
    setSortBy("name");
    setSortOrder("asc");
    setDateRange({ start: "", end: "" });
    setHasProfileImage("all");
    setConnectionDegreeFilter("all");
    // Reset pagination
    setCurrentPage(1);
  };

  // Pagination functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleCreateNewCampaign = async () => {
    try {
      setError(null);
      setNotice(null);

      const targetLeadIds =
        selectedLeads.size > 0
          ? Array.from(selectedLeads)
          : leads.map(l => l.id);
      const idToUrn = new Map(leads.map(l => [l.id, l.urn_id] as const));
      const lead_urns = targetLeadIds
        .map(id => idToUrn.get(id))
        .filter(Boolean) as string[];
      if (lead_urns.length === 0) return;

      const initResp = await fetch("/api/outreach/campaign/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!initResp.ok) {
        const txt = await initResp.text();

        setError("Failed to initialize campaign");
        return;
      }
      const initData = await initResp.json();
      const virtualCampaignId =
        initData?.id ||
        initData?.campaign_id ||
        initData?.data?.id ||
        initData?.data?.campaign_id;
      if (!virtualCampaignId) {
        setError("Failed to initialize campaign");
        return;
      }

      const addResp = await fetch("/api/outreach/campaign/addLead3A", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: virtualCampaignId,
          payload: { lead_ids: lead_urns },
        }),
      });
      if (!addResp.ok) {
        const txt = await addResp.text();

        setError("Failed to attach selected leads to campaign");
        return;
      }

      router.push(
        `/outreach/campaigns/${virtualCampaignId}/create?step=integration`
      );
    } catch (e) {
      setError("An error occurred while creating campaign");
    }
  };

  const handleAddToExistingCampaign = async () => {
    try {
      setCampaignError(null);
      setIsLoadingCampaigns(true);
      setShowCampaignsDialog(true);

      const resp = await fetch("/api/tools/campaigns/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: 1,
          limit: 100, // Get more campaigns at once
          orderBy: "id",
          sortType: "desc",
          filter: "",
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();

        setCampaignError("Failed to load campaigns");
        setIsLoadingCampaigns(false);
        return;
      }

      const data = await resp.json();
      if (data?.data && Array.isArray(data.data)) {
        setCampaigns(data.data);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      setCampaignError("Failed to load campaigns");
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleExportToExistingCampaign = async (campaignId: string) => {
    try {
      setExportingCampaignId(campaignId);
      setError(null);
      setNotice(null);

      // Get fresh leads before export
      const targetLeadIds =
        selectedLeads.size > 0
          ? Array.from(selectedLeads)
          : leads.map(l => l.id);
      const idToUrn = new Map(leads.map(l => [l.id, l.urn_id] as const));
      const lead_urns = targetLeadIds
        .map(id => idToUrn.get(id))
        .filter(Boolean) as string[];

      if (!lead_urns || lead_urns.length === 0) {
        setNotice({ type: "error", message: "No leads available to export" });
        setExportingCampaignId(null);
        return;
      }

      const resp = await fetch("/api/tools/campaigns/exportToExisting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          lead_ids: lead_urns,
          pipelineId: scrapeId,
        }),
      });

      if (!resp.ok) {
        const txt = await resp.text();

        setNotice({ type: "error", message: "Failed to export leads" });
        setExportingCampaignId(null);
        return;
      }

      const data = await resp.json();
      if (data?.success !== false) {
        setShowCampaignsDialog(false);
        setNotice({ type: "success", message: "Leads exported successfully!" });

        // Redirect to campaign page after delay
        setTimeout(() => {
          router.push(`/outreach/campaigns/${campaignId}/edit?step=leads`);
        }, 2300);
      } else {
        setNotice({
          type: "error",
          message: data?.message || "Failed to export leads",
        });
      }
    } catch (error) {
      setNotice({ type: "error", message: "Export failed" });
    } finally {
      setExportingCampaignId(null);
    }
  };

  const getEnrichedProfile = (lead: Lead): EnrichedProfile | null => {
    try {
      const otherDetails = JSON.parse(lead.other_details || "{}");
      return otherDetails.enrichedProfile || null;
    } catch {
      return null;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Utility function to get filter statistics
  const getFilterStats = useMemo(() => {
    const totalLeads = leads.length;
    const filteredCount = totalFilteredLeads;
    const activeFiltersCount = [
      searchTerm,
      locationFilter !== "all" && locationFilter,
      companyFilter !== "all" && companyFilter,
      titleFilter !== "all" && titleFilter,
      advancedFilters.name,
      advancedFilters.headline,
      advancedFilters.location,
      advancedFilters.profileUrl,
      advancedFilters.connectionDegree,
      advancedFilters.enrichedProfile !== "all" &&
        advancedFilters.enrichedProfile,
      dateRange.start,
      dateRange.end,
      hasProfileImage !== "all" && hasProfileImage,
      connectionDegreeFilter !== "all" && connectionDegreeFilter,
    ].filter(Boolean).length;

    return {
      totalLeads,
      filteredCount,
      activeFiltersCount,
      isFiltered: activeFiltersCount > 0,
      filterPercentage:
        totalLeads > 0 ? Math.round((filteredCount / totalLeads) * 100) : 0,
    };
  }, [
    leads.length,
    totalFilteredLeads,
    searchTerm,
    locationFilter,
    companyFilter,
    titleFilter,
    advancedFilters,
    dateRange,
    hasProfileImage,
    connectionDegreeFilter,
  ]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-48 h-8" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <Skeleton className="w-32 h-6" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-full h-10" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Skeleton className="w-48 h-6" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="w-full h-20" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="w-8 h-8 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Leads View</h1>
        </div>
        <Card>
          <CardContent className="py-16">
            <div className="space-y-6 text-center">
              <div className="flex justify-center items-center mx-auto w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl dark:from-red-800 dark:to-red-700">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  Error Loading Leads
                </h3>
                <p className="mx-auto max-w-md text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Actions Bar */}
        <div className="flex justify-between items-center space-x-4 mb-6">
          <div className="flex flex-1 items-center space-x-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="w-8 h-8 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>

            {/* Title and Count */}
            <div className="flex items-center space-x-4">
              {/* Title and basic stats */}
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {scrapeDetails?.name || "Leads"}
                </h1>
                <span className="text-muted-foreground">
                  {getFilterStats.filteredCount} of {getFilterStats.totalLeads}{" "}
                  leads
                  {getFilterStats.isFiltered && (
                    <span className="ml-1 text-blue-600">
                      ({getFilterStats.filterPercentage}% shown)
                    </span>
                  )}
                </span>
              </div>

              {/* Scrape details */}
              {scrapeDetails && (
                <div className="flex items-center space-x-3 text-sm">
                  <span className="flex items-center space-x-1">
                    <span className="font-medium text-muted-foreground">
                      Type:
                    </span>
                    <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900/20 dark:text-blue-200">
                      {scrapeDetails.type}
                    </span>
                  </span>
                  {scrapeDetails.state?.status && (
                    <span className="flex items-center space-x-1">
                      <span className="font-medium text-muted-foreground">
                        Status:
                      </span>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-md text-xs font-medium",
                          scrapeDetails.state.status === "completed" &&
                            "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                          scrapeDetails.state.status === "in_progress" &&
                            "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200",
                          scrapeDetails.state.status === "failed" &&
                            "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                        )}
                      >
                        {scrapeDetails.state.status === "in_progress" &&
                          "In Progress"}
                        {scrapeDetails.state.status === "completed" &&
                          "Completed"}
                        {scrapeDetails.state.status === "failed" && "Failed"}
                        {!scrapeDetails.state.status && "Unknown"}
                      </span>
                    </span>
                  )}
                  {scrapeDetails.url && (
                    <a
                      href={scrapeDetails.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-blue-600 transition-colors hover:text-blue-800"
                    >
                      <span className="font-medium">Source:</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Active filters with dropdown */}
              {getFilterStats.activeFiltersCount > 0 && (
                <div
                  ref={filterDropdownRef}
                  className="relative flex items-center space-x-2"
                >
                  <button
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                    className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md dark:bg-blue-900/20 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <span>
                      {getFilterStats.activeFiltersCount} filter
                      {getFilterStats.activeFiltersCount !== 1 ? "s" : ""}{" "}
                      active
                    </span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showFilterDropdown ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Filter chips dropdown */}
                  {showFilterDropdown && (
                    <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 z-10 min-w-64">
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const activeFilters = [
                            {
                              key: "search",
                              label: `Search: "${searchTerm}"`,
                              value: searchTerm,
                              onRemove: () => setSearchTerm(""),
                            },
                            {
                              key: "location",
                              label: `Location: ${locationFilter}`,
                              value: locationFilter !== "all",
                              onRemove: () => setLocationFilter("all"),
                            },
                            {
                              key: "company",
                              label: `Company: ${companyFilter}`,
                              value: companyFilter !== "all",
                              onRemove: () => setCompanyFilter("all"),
                            },
                            {
                              key: "title",
                              label: `Title: ${titleFilter}`,
                              value: titleFilter !== "all",
                              onRemove: () => setTitleFilter("all"),
                            },
                            {
                              key: "name",
                              label: `Name: "${advancedFilters.name}"`,
                              value: advancedFilters.name,
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  name: "",
                                })),
                            },
                            {
                              key: "headline",
                              label: `Headline: "${advancedFilters.headline}"`,
                              value: advancedFilters.headline,
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  headline: "",
                                })),
                            },
                            {
                              key: "location_adv",
                              label: `Location: "${advancedFilters.location}"`,
                              value: advancedFilters.location,
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  location: "",
                                })),
                            },
                            {
                              key: "profileUrl",
                              label: `Profile URL: "${advancedFilters.profileUrl}"`,
                              value: advancedFilters.profileUrl,
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  profileUrl: "",
                                })),
                            },
                            {
                              key: "connectionDegree",
                              label: `Connection: "${advancedFilters.connectionDegree}"`,
                              value: advancedFilters.connectionDegree,
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  connectionDegree: "",
                                })),
                            },
                            {
                              key: "enriched",
                              label: `Enriched: ${advancedFilters.enrichedProfile}`,
                              value: advancedFilters.enrichedProfile !== "all",
                              onRemove: () =>
                                setAdvancedFilters(prev => ({
                                  ...prev,
                                  enrichedProfile: "all",
                                })),
                            },
                            {
                              key: "dateStart",
                              label: `From: ${dateRange.start}`,
                              value: dateRange.start,
                              onRemove: () =>
                                setDateRange(prev => ({ ...prev, start: "" })),
                            },
                            {
                              key: "dateEnd",
                              label: `To: ${dateRange.end}`,
                              value: dateRange.end,
                              onRemove: () =>
                                setDateRange(prev => ({ ...prev, end: "" })),
                            },
                            {
                              key: "profileImage",
                              label: `Image: ${hasProfileImage}`,
                              value: hasProfileImage !== "all",
                              onRemove: () => setHasProfileImage("all"),
                            },
                            {
                              key: "connectionDegreeFilter",
                              label: `Connection: ${connectionDegreeFilter}`,
                              value: connectionDegreeFilter !== "all",
                              onRemove: () => setConnectionDegreeFilter("all"),
                            },
                          ].filter(filter => filter.value);

                          return activeFilters.map(filter => (
                            <div
                              key={filter.key}
                              className="inline-flex items-center px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-md dark:bg-blue-900/20 dark:text-blue-200"
                            >
                              <span>{filter.label}</span>
                              <button
                                onClick={filter.onRemove}
                                className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEnrichLeads}
              className="px-4 h-10 rounded-xl"
              disabled={
                isEnriching ||
                (!!quota &&
                  quota.remaining !== undefined &&
                  quota.remaining <= 0)
              }
              title={
                quota?.resets_at
                  ? `Resets at ${new Date(quota.resets_at).toLocaleString()}`
                  : undefined
              }
            >
              {isEnriching ? (
                <>
                  <div className="mr-2 w-4 h-4 rounded-full border-2 animate-spin border-muted-foreground border-t-transparent" />
                  ENRICHING...
                </>
              ) : (
                <>
                  <Lock className="mr-2 w-4 h-4" />
                  {`ENRICH LEADS${selectedLeads.size > 0 ? ` (${selectedLeads.size})` : ""}${quota?.remaining !== undefined ? ` • ${quota.remaining} LEFT` : ""}`}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLeads}
              className="px-4 h-10 rounded-xl"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <div className="mr-2 w-4 h-4 rounded-full border-2 animate-spin border-muted-foreground border-t-transparent" />
                  EXPORTING...
                </>
              ) : (
                <>
                  <Download className="mr-2 w-4 h-4" />
                  EXPORT ({selectedLeads.size > 0
                    ? selectedLeads.size
                    : "All"}{" "}
                  leads)
                </>
              )}
            </Button>

            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="px-4 h-10 text-white bg-gray-500 rounded-xl hover:bg-gray-600"
                >
                  <MoreHorizontal className="mr-2 w-4 h-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {/* Select All Checkbox */}
                <div className="px-2 py-1.5 border-b border-border/20">
                  <div
                    className="flex items-center space-x-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5"
                    onClick={handleSelectAll}
                  >
                    {selectedLeads.size === leads.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium">
                      Select All ({leads.length})
                    </span>
                  </div>
                </div>

                {/* Campaign Actions */}
                <DropdownMenuItem
                  onClick={handleAddToExistingCampaign}
                  disabled={selectedLeads.size === 0}
                  className="cursor-pointer"
                >
                  <Target className="mr-2 w-4 h-4" />
                  Existing Campaign (
                  {selectedLeads.size > 0 ? selectedLeads.size : "All"})
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleCreateNewCampaign}
                  disabled={selectedLeads.size === 0}
                  className="cursor-pointer"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  New Campaign (
                  {selectedLeads.size > 0 ? selectedLeads.size : "All"})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
          <Card className="rounded-2xl border backdrop-blur-2xl bg-card/60 border-border/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg font-semibold text-foreground">
                <Filter className="w-5 h-5 text-gray-600" />
                <span>Filters & Search</span>
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Search and filter leads with advanced options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Search */}
              <div className="space-y-1">
                <Label className="text-xs font-medium text-muted-foreground">
                  Search
                </Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 w-3 h-3 transform -translate-y-1/2 text-muted-foreground" />
                  {isSearching && (
                    <div className="absolute right-2 top-1/2 w-3 h-3 transform -translate-y-1/2">
                      <div className="w-3 h-3 rounded-full border-2 animate-spin border-muted-foreground border-t-transparent" />
                    </div>
                  )}
                  <Input
                    placeholder="Search leads..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm rounded-lg"
                  />
                </div>
              </div>

              {/* Quick Filters - Compact Grid */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-1 text-xs font-medium text-muted-foreground">
                    QUICK
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Location Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Location
                    </Label>
                    <Select
                      value={locationFilter}
                      onValueChange={setLocationFilter}
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All locations</SelectItem>
                        {uniqueLocations.map(location => (
                          <SelectItem
                            key={location}
                            value={location}
                            className="truncate"
                          >
                            <span className="truncate" title={location}>
                              {location}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Company Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Company
                    </Label>
                    <Select
                      value={companyFilter}
                      onValueChange={setCompanyFilter}
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue placeholder="All companies" />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All companies</SelectItem>
                        {uniqueCompanies.map(company => (
                          <SelectItem
                            key={company}
                            value={company}
                            className="truncate"
                          >
                            <span className="truncate" title={company}>
                              {company}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Job Title
                    </Label>
                    <Select value={titleFilter} onValueChange={setTitleFilter}>
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue placeholder="All titles" />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All titles</SelectItem>
                        {uniqueTitles.map(title => (
                          <SelectItem
                            key={title}
                            value={title}
                            className="truncate"
                          >
                            <span className="truncate" title={title}>
                              {title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Advanced Filters - Compact */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-1 text-xs font-medium text-muted-foreground">
                    ADVANCED
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Name Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Name
                    </Label>
                    <Input
                      placeholder="Enter name..."
                      value={advancedFilters.name}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="h-8 text-sm rounded-lg"
                    />
                  </div>

                  {/* Headline Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Headline
                    </Label>
                    <Input
                      placeholder="Enter headline..."
                      value={advancedFilters.headline}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          headline: e.target.value,
                        }))
                      }
                      className="h-8 text-sm rounded-lg"
                    />
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Location
                    </Label>
                    <Input
                      placeholder="Enter location..."
                      value={advancedFilters.location}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      className="h-8 text-sm rounded-lg"
                    />
                  </div>

                  {/* Profile URL Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Profile URL
                    </Label>
                    <Input
                      placeholder="Enter profile URL..."
                      value={advancedFilters.profileUrl}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          profileUrl: e.target.value,
                        }))
                      }
                      className="h-8 text-sm rounded-lg"
                    />
                  </div>

                  {/* Connection Degree Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Connection Degree
                    </Label>
                    <Input
                      placeholder="Enter connection degree..."
                      value={advancedFilters.connectionDegree}
                      onChange={e =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          connectionDegree: e.target.value,
                        }))
                      }
                      className="h-8 text-sm rounded-lg"
                    />
                  </div>

                  {/* Enriched Profile */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Enriched Profile
                    </Label>
                    <Select
                      value={advancedFilters.enrichedProfile}
                      onValueChange={value =>
                        setAdvancedFilters(prev => ({
                          ...prev,
                          enrichedProfile: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All Profiles</SelectItem>
                        <SelectItem value="enriched">
                          Enriched Profiles
                        </SelectItem>
                        <SelectItem value="notEnriched">
                          Not Enriched Profiles
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sorting Options */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-1 text-xs font-medium text-muted-foreground">
                    SORTING
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Sort By
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="headline">Headline</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="created_at">Created Date</SelectItem>
                        <SelectItem value="updated_at">Updated Date</SelectItem>
                        <SelectItem value="connection_degree">
                          Connection Degree
                        </SelectItem>
                        <SelectItem value="enriched">
                          Enriched Status
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Order
                    </Label>
                    <Select
                      value={sortOrder}
                      onValueChange={(value: "asc" | "desc") =>
                        setSortOrder(value)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="asc">Ascending</SelectItem>
                        <SelectItem value="desc">Descending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="px-1 text-xs font-medium text-muted-foreground">
                    ADDITIONAL
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Date Range */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Created Date Range
                    </Label>
                    <div className="grid grid-cols-2 gap-1">
                      <Input
                        type="date"
                        placeholder="Start Date"
                        value={dateRange.start}
                        onChange={e =>
                          setDateRange(prev => ({
                            ...prev,
                            start: e.target.value,
                          }))
                        }
                        className="h-8 text-sm rounded-lg"
                      />
                      <Input
                        type="date"
                        placeholder="End Date"
                        value={dateRange.end}
                        onChange={e =>
                          setDateRange(prev => ({
                            ...prev,
                            end: e.target.value,
                          }))
                        }
                        className="h-8 text-sm rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Profile Image Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Profile Image
                    </Label>
                    <Select
                      value={hasProfileImage}
                      onValueChange={setHasProfileImage}
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="hasImage">Has Image</SelectItem>
                        <SelectItem value="noImage">No Image</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Connection Degree Filter */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Connection Degree
                    </Label>
                    <Select
                      value={connectionDegreeFilter}
                      onValueChange={setConnectionDegreeFilter}
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="1st">1st Degree</SelectItem>
                        <SelectItem value="2nd">2nd Degree</SelectItem>
                        <SelectItem value="3rd">3rd Degree</SelectItem>
                        <SelectItem value="out of network">
                          Out of Network
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Reset All Filters */}
              <Button
                variant="outline"
                onClick={handleResetAdvancedFilters}
                className="w-full h-8 text-sm text-blue-600 rounded-lg border-blue-200 hover:bg-blue-50"
              >
                RESET ALL FILTERS
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Leads List */}
        <div className="lg:col-span-3">
          {/* Pipeline Status Cards - moved into right column */}
          {scrapeDetails && (
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Pipeline Information Card - 50% width */}
              <Card className="lg:col-span-1 rounded-xl border border-border/20 bg-card/60">
                <CardHeader className="py-1">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    Pipeline Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Name:
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        {scrapeDetails.name} ({scrapeDetails.type})
                      </span>
                    </div>
                    {scrapeDetails.url && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          URL:
                        </span>
                        <span className="text-sm text-foreground truncate max-w-48">
                          {scrapeDetails.url.length > 50
                            ? `${scrapeDetails.url.substring(0, 50)}...`
                            : scrapeDetails.url}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              scrapeDetails.url || ""
                            )
                          }
                          className="h-6 w-6 p-0"
                          title="Copy URL"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Status:
                      </span>
                      {scrapeDetails.state?.status === "in_progress" ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200">
                          <Hourglass className="w-3 h-3 animate-spin" />
                          <span>In Progress</span>
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "px-2 py-1 rounded-md text-xs font-medium",
                            scrapeDetails.state?.status === "completed" &&
                              "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200",
                            scrapeDetails.state?.status === "failed" &&
                              "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                          )}
                        >
                          {scrapeDetails.state?.status || "Unknown"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Leads:
                      </span>
                      <span className="text-sm text-foreground font-medium">
                        {getFilterStats.totalLeads}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card - 50% width */}
              <Card className="lg:col-span-1 rounded-xl border border-border/20 bg-card/60">
                <CardHeader className="py-1">
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center justify-center space-x-2 text-center">
                    {scrapeDetails.state?.status === "in_progress" && (
                      <>
                        <Hourglass className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Processing pipeline...</span>
                      </>
                    )}
                    {scrapeDetails.state?.status === "failed" && (
                      <>
                        <div className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <X className="w-2.5 h-2.5 text-red-600" />
                        </div>
                        <span>Pipeline Failed</span>
                      </>
                    )}
                    {scrapeDetails.state?.status === "completed" && (
                      <>
                        <div className="w-4 h-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                          <CheckSquare className="w-2.5 h-2.5 text-green-600" />
                        </div>
                        <span>Pipeline Completed</span>
                      </>
                    )}
                    {!scrapeDetails.state?.status && (
                      <>
                        <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800" />
                        <span>Pipeline Status</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-center pt-0">
                  {scrapeDetails.state?.status === "in_progress" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Extracting leads:{" "}
                        {scrapeDetails.state?.fetchedLeads || 0} of{" "}
                        {scrapeDetails.state?.totalLeads || 0} leads
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-foreground font-medium">
                            {String(
                              Math.min(
                                100,
                                Math.round(
                                  ((scrapeDetails.state?.fetchedLeads || 0) /
                                    (scrapeDetails.state?.totalLeads || 1)) *
                                    100
                                )
                              )
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((scrapeDetails.state?.fetchedLeads || 0) /
                                    (scrapeDetails.state?.totalLeads || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        {typeof scrapeDetails.state?.stats?.processingTime ===
                          "number" && (
                          <p className="text-xs text-muted-foreground">
                            Estimated time remaining: ~
                            {(() => {
                              const fetched =
                                scrapeDetails.state?.fetchedLeads || 0;
                              const total =
                                scrapeDetails.state?.totalLeads || 0;
                              if (!fetched || !total || fetched >= total)
                                return "-- minutes";
                              const elapsedMs =
                                scrapeDetails.state?.stats?.processingTime || 0;
                              const perLead = elapsedMs / fetched;
                              const remainingMs = perLead * (total - fetched);
                              return `${Math.max(1, Math.round(remainingMs / 60000))} minutes`;
                            })()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {scrapeDetails.state?.status === "failed" && (
                    <div className="space-y-3">
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Pipeline processing has encountered an error.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getFilterStats.totalLeads} leads were extracted before
                        the failure.
                      </p>
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Please check the URL or contact support if the issue
                        persists.
                      </p>
                    </div>
                  )}
                  {scrapeDetails.state?.status === "completed" && (
                    <div className="space-y-3">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Pipeline has been successfully processed.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getFilterStats.totalLeads} leads were extracted
                        successfully.
                      </p>
                    </div>
                  )}
                  {!scrapeDetails.state?.status && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Pipeline status is unknown.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="rounded-2xl border backdrop-blur-2xl bg-card/60 border-border/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                {/* <div>
                  <CardTitle className="flex items-center space-x-2 text-xl font-semibold text-foreground">
                    <Users className="w-6 h-6 text-green-500" />
                    <span>Leads ({filteredLeads.length})</span>
                    {selectedLeads.size > 0 && (
                      <span className="px-2 py-1 text-sm font-normal text-blue-600 bg-blue-100 rounded-md dark:bg-blue-900/20">
                        {selectedLeads.size} selected
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {selectedLeads.size > 0 
                      ? `${selectedLeads.size} leads selected for campaign creation`
                      : "Select leads to create campaigns"
                    }
                  </CardDescription>
                </div> */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-8"
                  >
                    {selectedLeads.size === leads.length ? (
                      <>
                        <CheckSquare className="mr-1 w-4 h-4" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="mr-1 w-4 h-4" />
                        Select All
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLeads.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 bg-gradient-to-br rounded-3xl from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                    <Search className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    No leads found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your filters to see more results
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLeads.map(lead => {
                    const enrichedProfile = getEnrichedProfile(lead);
                    const isSelected = selectedLeads.has(lead.id);

                    return (
                      <div
                        key={lead.id}
                        className={cn(
                          "flex items-center p-4 space-x-4 rounded-2xl border transition-all duration-200 cursor-pointer",
                          isSelected
                            ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                            : "bg-white/30 dark:bg-gray-800/70 border-border/20 hover:bg-white/50 dark:hover:bg-gray-700"
                        )}
                        onClick={() => handleSelectLead(lead.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleSelectLead(lead.id)}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />

                        <Avatar className="w-12 h-12">
                          <AvatarImage
                            src={lead.profile_image_url || lead.profile_pic_url}
                          />
                          <AvatarFallback className="text-gray-700 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 dark:text-gray-300">
                            {getInitials(lead.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold truncate text-foreground">
                              {lead.name}
                            </h4>
                            {enrichedProfile && (
                              <Badge variant="secondary" className="text-xs">
                                <Star className="mr-1 w-3 h-3" />
                                Enriched
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm truncate text-muted-foreground">
                            {lead.headline}
                          </p>
                          <div className="flex items-center mt-1 space-x-4">
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{lead.location}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{lead.connection_degree}</span>
                            </div>
                            {enrichedProfile?.jobDetails?.currentCompany && (
                              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                <Building className="w-3 h-3" />
                                <span className="truncate">
                                  {enrichedProfile.jobDetails.currentCompany}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              handleViewLead(lead);
                            }}
                            className="w-8 h-8 rounded-lg"
                          >
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation();
                              window.open(lead.profile_url, "_blank");
                            }}
                            className="w-8 h-8 rounded-lg"
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between py-6 border-t border-border/20">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>
                          Showing {startIndex + 1} to {endIndex} of{" "}
                          {totalFilteredLeads} leads
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPage}
                          disabled={currentPage === 1}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center space-x-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
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
                                  variant={
                                    currentPage === pageNum
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => goToPage(pageNum)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            }
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className="h-8 w-8 p-0"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Lead Detail Modal */}
      <LeadDetailsDialog
        open={isLeadModalOpen}
        selectedLead={selectedLead}
        detailedLeadData={detailedLeadData}
        leadDetailsLoading={leadDetailsLoading}
        onClose={handleCloseLeadDetailsDialog}
        onRefreshData={() => {
          // Refresh leads data if needed
          const fetchData = async () => {
            try {
              const leadsResponse = await apiCall({
                url: "/api/tools/scraper/getAllLeads",
                method: "post",
                body: { id: scrapeId },
                applyDefaultDomain: false,
              });
              if (
                leadsResponse.status === 200 &&
                Array.isArray(leadsResponse.data)
              ) {
                setLeads(leadsResponse.data);
              }
            } catch (error) {}
          };
          fetchData();
        }}
      />

      {/* Campaign Selection Modal */}
      <Dialog open={showCampaignsDialog} onOpenChange={setShowCampaignsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Existing Campaign List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Campaign List */}
            {isLoadingCampaigns ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : campaignError ? (
              <div className="text-center py-8">
                <div className="text-red-600 mb-2">{campaignError}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddToExistingCampaign}
                >
                  Try Again
                </Button>
              </div>
            ) : campaigns.length > 0 ? (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {campaign.name || ""}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleExportToExistingCampaign(campaign.id)
                      }
                      disabled={!!exportingCampaignId}
                      className="ml-4"
                    >
                      {exportingCampaignId === campaign.id ? (
                        <>
                          <div className="mr-2 w-4 h-4 rounded-full border-2 animate-spin border-muted-foreground border-t-transparent" />
                          Exporting...
                        </>
                      ) : (
                        "Import"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-muted-foreground mb-4">
                  No existing campaigns found.
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCampaignsDialog(false)}
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Enrichment Progress */}
      {isEnriching && enrichmentJobData && (
        <div className="fixed bottom-4 right-4 px-4 py-3 rounded-xl shadow-lg border border-border/20 bg-card/90 backdrop-blur-2xl max-w-md">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 animate-spin border-muted-foreground border-t-transparent" />
                <span className="text-sm font-medium text-foreground">
                  {enrichmentJobData.status === "processing"
                    ? "Enriching Leads"
                    : enrichmentJobData.status === "paused"
                      ? "Enrichment Paused"
                      : "Enrichment Status"}
                </span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2"
                onClick={handleStopEnrichment}
              >
                Stop
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {enrichmentJobData.processed || 0} /{" "}
                  {enrichmentJobData.total_leads}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.round(((enrichmentJobData.processed || 0) / enrichmentJobData.total_leads) * 100))}%`,
                  }}
                />
              </div>
              <div className="text-xs text-center text-muted-foreground">
                {Math.round(
                  ((enrichmentJobData.processed || 0) /
                    enrichmentJobData.total_leads) *
                    100
                )}
                %
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Enriched:</span>
                <span className="text-green-600 font-medium">
                  {enrichmentJobData.enriched || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cached:</span>
                <span className="text-blue-600 font-medium">
                  {enrichmentJobData.cached || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed:</span>
                <span className="text-red-600 font-medium">
                  {enrichmentJobData.failed || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed:</span>
                <span className="text-foreground font-medium">
                  {enrichmentJobData.processed || 0}
                </span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              {enrichmentJobData.status === "processing" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1"
                  onClick={handlePauseEnrichment}
                >
                  Pause
                </Button>
              ) : enrichmentJobData.status === "paused" ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1"
                  onClick={handleResumeEnrichment}
                >
                  Resume
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Notifications */}
      {notice && (
        <div
          className={cn(
            "fixed bottom-4 left-4 px-4 py-2 rounded-lg shadow border",
            notice.type === "success" &&
              "bg-green-50 border-green-200 text-green-700",
            notice.type === "error" && "bg-red-50 border-red-200 text-red-700",
            notice.type === "info" && "bg-blue-50 border-blue-200 text-blue-700"
          )}
        >
          {notice.message}
        </div>
      )}
    </>
  );
}
