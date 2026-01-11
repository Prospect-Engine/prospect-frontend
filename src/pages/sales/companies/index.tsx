/**
 * COMPANIES PAGE
 * ==============
 * CRM company management with advanced search and filters.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import {
  Plus,
  Search,
  MoreHorizontal,
  Globe,
  Building2,
  Users,
  Trash2,
  Edit,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  DollarSign,
  SlidersHorizontal,
  RefreshCw,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Mock companies API (to be replaced with actual API)
interface Company {
  id: string;
  name: string;
  industry?: string;
  website?: string;
  size?: string;
  location?: string;
  phone?: string;
  email?: string;
  status?: string;
  revenue?: number;
  employees?: number;
  contactsCount?: number;
  dealsCount?: number;
  createdAt: string;
}

// Status colors
const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PROSPECT: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-purple-100 text-purple-700",
  PARTNER: "bg-orange-100 text-orange-700",
  INACTIVE: "bg-gray-100 text-gray-700",
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Basic filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [sizeFilter, setSizeFilter] = useState<string>("all");

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [revenueFilter, setRevenueFilter] = useState<string>("all");
  const [employeesFilter, setEmployeesFilter] = useState<string>("all");
  const [hasWebsiteFilter, setHasWebsiteFilter] = useState<string>("all");
  const [hasContactsFilter, setHasContactsFilter] = useState<string>("all");
  const [hasDealsFilter, setHasDealsFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState("");

  const ITEMS_PER_PAGE = 20;

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (industryFilter !== "all") count++;
    if (sizeFilter !== "all") count++;
    if (revenueFilter !== "all") count++;
    if (employeesFilter !== "all") count++;
    if (hasWebsiteFilter !== "all") count++;
    if (hasContactsFilter !== "all") count++;
    if (hasDealsFilter !== "all") count++;
    if (locationFilter) count++;
    return count;
  }, [statusFilter, industryFilter, sizeFilter, revenueFilter, employeesFilter, hasWebsiteFilter, hasContactsFilter, hasDealsFilter, locationFilter]);

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setIndustryFilter("all");
    setSizeFilter("all");
    setRevenueFilter("all");
    setEmployeesFilter("all");
    setHasWebsiteFilter("all");
    setHasContactsFilter("all");
    setHasDealsFilter("all");
    setLocationFilter("");
    setShowAdvancedFilters(false);
  };

  // Mock data
  const mockCompanies: Company[] = [
    {
      id: "1",
      name: "TechCorp Inc.",
      industry: "Technology",
      website: "https://techcorp.com",
      size: "201-500",
      location: "San Francisco, CA",
      status: "CUSTOMER",
      revenue: 25000000,
      employees: 350,
      contactsCount: 18,
      dealsCount: 5,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      name: "Innovate.io",
      industry: "Software",
      website: "https://innovate.io",
      size: "51-200",
      location: "Austin, TX",
      status: "CUSTOMER",
      revenue: 12000000,
      employees: 120,
      contactsCount: 8,
      dealsCount: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      name: "StartupCo",
      industry: "Technology",
      website: "https://startup.co",
      size: "11-50",
      location: "Boston, MA",
      status: "PROSPECT",
      revenue: 2500000,
      employees: 35,
      contactsCount: 4,
      dealsCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: "4",
      name: "Enterprise Solutions",
      industry: "Consulting",
      website: "https://enterprise-solutions.com",
      size: "501-1000",
      location: "Chicago, IL",
      status: "PARTNER",
      revenue: 50000000,
      employees: 650,
      contactsCount: 25,
      dealsCount: 8,
      createdAt: new Date().toISOString(),
    },
    {
      id: "5",
      name: "Growth.io",
      industry: "Marketing",
      website: "https://growth.io",
      size: "11-50",
      location: "Los Angeles, CA",
      status: "PROSPECT",
      revenue: 3000000,
      employees: 28,
      contactsCount: 6,
      dealsCount: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "6",
      name: "BigTech Corp",
      industry: "Technology",
      website: "https://bigtech.com",
      size: "1000+",
      location: "Seattle, WA",
      status: "CUSTOMER",
      revenue: 150000000,
      employees: 2500,
      contactsCount: 45,
      dealsCount: 12,
      createdAt: new Date().toISOString(),
    },
    {
      id: "7",
      name: "FinTech.io",
      industry: "Finance",
      website: "https://fintech.io",
      size: "51-200",
      location: "New York, NY",
      status: "CUSTOMER",
      revenue: 18000000,
      employees: 85,
      contactsCount: 12,
      dealsCount: 4,
      createdAt: new Date().toISOString(),
    },
    {
      id: "8",
      name: "Cloud Services Inc",
      industry: "Technology",
      website: "https://cloudservices.com",
      size: "201-500",
      location: "Denver, CO",
      status: "PROSPECT",
      revenue: 8000000,
      employees: 220,
      contactsCount: 9,
      dealsCount: 2,
      createdAt: new Date().toISOString(),
    },
    {
      id: "9",
      name: "HealthTech Solutions",
      industry: "Healthcare",
      website: "https://healthtech.com",
      size: "51-200",
      location: "Miami, FL",
      status: "ACTIVE",
      revenue: 15000000,
      employees: 180,
      contactsCount: 14,
      dealsCount: 3,
      createdAt: new Date().toISOString(),
    },
    {
      id: "10",
      name: "RetailPro",
      industry: "Retail",
      website: "https://retailpro.com",
      size: "201-500",
      location: "Dallas, TX",
      status: "INACTIVE",
      revenue: 22000000,
      employees: 310,
      contactsCount: 7,
      dealsCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: "11",
      name: "DataDriven Analytics",
      industry: "Technology",
      website: "",
      size: "1-10",
      location: "Portland, OR",
      status: "PROSPECT",
      revenue: 500000,
      employees: 8,
      contactsCount: 2,
      dealsCount: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "12",
      name: "MediaMax",
      industry: "Marketing",
      size: "51-200",
      location: "Atlanta, GA",
      status: "ACTIVE",
      revenue: 7500000,
      employees: 95,
      contactsCount: 0,
      dealsCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];

  // Fetch companies (placeholder - replace with actual API)
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual CrmApiService.getCompanies()
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCompanies(mockCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      ShowShortMessage("Failed to load companies", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Filter companies based on all filters
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Search filter
      const matchesSearch = searchQuery === "" ||
        company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.website?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || company.status === statusFilter;

      // Industry filter
      const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;

      // Size filter
      const matchesSize = sizeFilter === "all" || company.size === sizeFilter;

      // Revenue filter
      const matchesRevenue = (() => {
        if (revenueFilter === "all") return true;
        const revenue = company.revenue ?? 0;
        switch (revenueFilter) {
          case "under1m": return revenue < 1000000;
          case "1m-10m": return revenue >= 1000000 && revenue < 10000000;
          case "10m-50m": return revenue >= 10000000 && revenue < 50000000;
          case "50m-100m": return revenue >= 50000000 && revenue < 100000000;
          case "over100m": return revenue >= 100000000;
          default: return true;
        }
      })();

      // Employees filter
      const matchesEmployees = (() => {
        if (employeesFilter === "all") return true;
        const employees = company.employees ?? 0;
        switch (employeesFilter) {
          case "under50": return employees < 50;
          case "50-200": return employees >= 50 && employees < 200;
          case "200-500": return employees >= 200 && employees < 500;
          case "500-1000": return employees >= 500 && employees < 1000;
          case "over1000": return employees >= 1000;
          default: return true;
        }
      })();

      // Has website filter
      const matchesHasWebsite = (() => {
        if (hasWebsiteFilter === "all") return true;
        const hasWebsite = !!company.website;
        return hasWebsiteFilter === "yes" ? hasWebsite : !hasWebsite;
      })();

      // Has contacts filter
      const matchesHasContacts = (() => {
        if (hasContactsFilter === "all") return true;
        const hasContacts = (company.contactsCount ?? 0) > 0;
        return hasContactsFilter === "yes" ? hasContacts : !hasContacts;
      })();

      // Has deals filter
      const matchesHasDeals = (() => {
        if (hasDealsFilter === "all") return true;
        const hasDeals = (company.dealsCount ?? 0) > 0;
        return hasDealsFilter === "yes" ? hasDeals : !hasDeals;
      })();

      // Location filter
      const matchesLocation = locationFilter === "" ||
        company.location?.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesIndustry && matchesSize &&
        matchesRevenue && matchesEmployees && matchesHasWebsite &&
        matchesHasContacts && matchesHasDeals && matchesLocation;
    });
  }, [companies, searchQuery, statusFilter, industryFilter, sizeFilter, revenueFilter, employeesFilter, hasWebsiteFilter, hasContactsFilter, hasDealsFilter, locationFilter]);

  // Delete company
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return;

    setDeleting(id);
    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      ShowShortMessage("Company deleted successfully", "success");
      fetchCompanies();
    } catch (error) {
      ShowShortMessage("Failed to delete company", "error");
    } finally {
      setDeleting(null);
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedCompanies((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCompanies.length === filteredCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredCompanies.map((c) => c.id));
    }
  };

  // Format revenue
  const formatRevenue = (revenue?: number) => {
    if (!revenue) return "-";
    if (revenue >= 1000000) {
      return `$${(revenue / 1000000).toFixed(1)}M`;
    }
    if (revenue >= 1000) {
      return `$${(revenue / 1000).toFixed(0)}K`;
    }
    return `$${revenue}`;
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Companies">
        <div className="space-y-4">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-foreground">Companies</h1>
              <span className="text-sm text-muted-foreground">
                {filteredCompanies.length} of {companies.length} results
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-8 px-3"
                onClick={fetchCompanies}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-8 px-3"
                onClick={() => ShowShortMessage("Export not implemented", "info")}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg h-8 px-3"
                onClick={() => router.push("/sales/companies/new")}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-xl">
            <CardContent className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search companies, industry, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-border/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-border/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                    <SelectItem value="PARTNER">Partner</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                {/* Industry Filter */}
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-border/30">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                  </SelectContent>
                </Select>

                {/* Size Filter */}
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg border-border/30">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="1-10">1-10</SelectItem>
                    <SelectItem value="11-50">11-50</SelectItem>
                    <SelectItem value="51-200">51-200</SelectItem>
                    <SelectItem value="201-500">201-500</SelectItem>
                    <SelectItem value="501-1000">501-1000</SelectItem>
                    <SelectItem value="1000+">1000+</SelectItem>
                  </SelectContent>
                </Select>

                {/* Advanced Filters Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "rounded-lg h-8 px-3 text-xs",
                    showAdvancedFilters && "bg-[#3b82f6]/10 border-[#3b82f6]/30"
                  )}
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge className="ml-1 h-4 px-1 text-[10px] bg-[#3b82f6] text-white">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                {/* Clear Filters */}
                {(activeFilterCount > 0 || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={clearAllFilters}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </Button>
                )}

                {/* Bulk Actions */}
                {selectedCompanies.length > 0 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <Badge variant="secondary" className="rounded-lg text-xs h-6">
                      {selectedCompanies.length} selected
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="rounded-lg h-8 text-xs"
                      onClick={() => {
                        if (confirm(`Delete ${selectedCompanies.length} companies?`)) {
                          ShowShortMessage("Bulk delete not implemented", "info");
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-lg h-8 text-xs"
                      onClick={() => setSelectedCompanies([])}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>

              {/* Advanced Filters Panel */}
              {showAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {/* Revenue Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Revenue
                      </label>
                      <Select value={revenueFilter} onValueChange={setRevenueFilter}>
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Revenue</SelectItem>
                          <SelectItem value="under1m">Under $1M</SelectItem>
                          <SelectItem value="1m-10m">$1M - $10M</SelectItem>
                          <SelectItem value="10m-50m">$10M - $50M</SelectItem>
                          <SelectItem value="50m-100m">$50M - $100M</SelectItem>
                          <SelectItem value="over100m">Over $100M</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Employees Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Employees
                      </label>
                      <Select value={employeesFilter} onValueChange={setEmployeesFilter}>
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any Size</SelectItem>
                          <SelectItem value="under50">Under 50</SelectItem>
                          <SelectItem value="50-200">50 - 200</SelectItem>
                          <SelectItem value="200-500">200 - 500</SelectItem>
                          <SelectItem value="500-1000">500 - 1000</SelectItem>
                          <SelectItem value="over1000">Over 1000</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Website Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Has Website
                      </label>
                      <Select value={hasWebsiteFilter} onValueChange={setHasWebsiteFilter}>
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Contacts Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Has Contacts
                      </label>
                      <Select value={hasContactsFilter} onValueChange={setHasContactsFilter}>
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Has Deals Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Has Deals
                      </label>
                      <Select value={hasDealsFilter} onValueChange={setHasDealsFilter}>
                        <SelectTrigger className="h-8 text-xs rounded-lg border-border/30">
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                        Location
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="City, State..."
                          value={locationFilter}
                          onChange={(e) => setLocationFilter(e.target.value)}
                          className="w-full h-8 px-2 text-xs rounded-lg border border-border/30 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                        />
                        {locationFilter && (
                          <button
                            onClick={() => setLocationFilter("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Companies Table */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-xl overflow-hidden">
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
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No companies found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || activeFilterCount > 0
                      ? "Try adjusting your search or filters"
                      : "Get started by adding your first company"}
                  </p>
                  {(searchQuery || activeFilterCount > 0) ? (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={clearAllFilters}
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-xl"
                      onClick={() => router.push("/sales/companies/new")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Company
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Table Header */}
                  <div className="grid grid-cols-[40px_minmax(200px,1.5fr)_minmax(120px,1fr)_minmax(140px,1fr)_80px_80px_80px_100px_100px_50px] gap-3 px-6 py-3 bg-muted/30 border-b border-border/20 text-sm font-medium text-muted-foreground">
                    <div className="flex items-center">
                      <Checkbox
                        checked={selectedCompanies.length === filteredCompanies.length && filteredCompanies.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </div>
                    <div>Company</div>
                    <div>Location</div>
                    <div>Website</div>
                    <div className="text-center">Size</div>
                    <div className="text-center">Contacts</div>
                    <div className="text-center">Deals</div>
                    <div className="text-right">Revenue</div>
                    <div>Status</div>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  <div className="divide-y divide-border/10">
                    {filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className={cn(
                          "grid grid-cols-[40px_minmax(200px,1.5fr)_minmax(120px,1fr)_minmax(140px,1fr)_80px_80px_80px_100px_100px_50px] gap-3 px-6 py-4 items-center hover:bg-muted/20 transition-colors cursor-pointer",
                          selectedCompanies.includes(company.id) && "bg-muted/10"
                        )}
                        onClick={() => router.push(`/sales/companies/${company.id}`)}
                      >
                        {/* Checkbox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCompanies.includes(company.id)}
                            onCheckedChange={() => toggleSelect(company.id)}
                          />
                        </div>

                        {/* Company Name & Industry */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-5 w-5 text-[#3b82f6]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground truncate">
                              {company.name}
                            </div>
                            {company.industry && (
                              <p className="text-xs text-muted-foreground truncate">
                                {company.industry}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Location */}
                        <div className="text-sm text-muted-foreground truncate" onClick={(e) => e.stopPropagation()}>
                          {company.location ? (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{company.location}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </div>

                        {/* Website */}
                        <div className="text-sm truncate" onClick={(e) => e.stopPropagation()}>
                          {company.website ? (
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-muted-foreground hover:text-[#3b82f6]"
                            >
                              <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                              <span className="truncate">{company.website.replace(/^https?:\/\//, "")}</span>
                            </a>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </div>

                        {/* Size */}
                        <div className="text-sm text-center text-muted-foreground">
                          {company.size || "-"}
                        </div>

                        {/* Contacts Count */}
                        <div className="text-sm text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{company.contactsCount || 0}</span>
                          </div>
                        </div>

                        {/* Deals Count */}
                        <div className="text-sm text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-1 text-muted-foreground">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{company.dealsCount || 0}</span>
                          </div>
                        </div>

                        {/* Revenue */}
                        <div className="text-sm text-right font-medium">
                          {company.revenue ? (
                            <span className="text-green-600">{formatRevenue(company.revenue)}</span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </div>

                        {/* Status */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <Badge
                            className={cn(
                              "rounded-full text-xs",
                              statusColors[company.status || "PROSPECT"]
                            )}
                          >
                            {company.status || "Prospect"}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl">
                              <DropdownMenuItem
                                onClick={() => router.push(`/sales/companies/${company.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/sales/companies/${company.id}/edit`)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {company.website && (
                                <DropdownMenuItem
                                  onClick={() => window.open(company.website, "_blank")}
                                >
                                  <Globe className="h-4 w-4 mr-2" />
                                  Website
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(company.id)}
                                disabled={deleting === company.id}
                              >
                                {deleting === company.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between px-6 py-3 border-t border-border/20">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredCompanies.length} of {companies.length} companies
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground px-2">
                        Page {page}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg h-8"
                        disabled={filteredCompanies.length < ITEMS_PER_PAGE}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
