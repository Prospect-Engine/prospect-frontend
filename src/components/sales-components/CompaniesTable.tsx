import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import toastService from "@/services/sales-services/toastService";
import {
  Plus,
  ArrowUpDown,
  Filter,
  MoreHorizontal,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Search,
  X,
  Settings,
  DollarSign,
  MapPin,
  AlertCircle,
  Download,
  Upload,
  Building2,
  MinusCircle,
  Target,
  Eye,
  Thermometer,
  XCircle,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Zap,
} from "lucide-react";
// Company status and size enums
const COMPANY_STATUSES: Company["status"][] = [
  "ACTIVE",
  "INACTIVE",
  "PROSPECT",
  "CUSTOMER",
  "LOST",
  "WON",
  "DEAD",
  "LEAD",
  "ENGAGED",
  "INTERESTED",
  "WARM",
  "CLOSED",
];
const COMPANY_SIZES: NonNullable<Company["size"]>[] = [
  "STARTUP",
  "SMALL",
  "MEDIUM",
  "LARGE",
  "ENTERPRISE",
];
import { Company, FilterState, SortState, Lead } from "../../types/sales-types";
import CompanyDetailPanel from "./CompanyDetailPanel";
import ColumnSelector from "./ColumnSelector";
import NestedFilterDropdown from "./NestedFilterDropdown";
import ImportExportModal from "./ImportExportModal";
import SearchSuggestions from "./SearchSuggestions";
import { useSearchSuggestions } from "../../hooks/sales-hooks/useSearchSuggestions";
import companyService from "../../services/sales-services/companyService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCountsContext } from "../../contexts/sales-contexts/CountsContext";
import {
  getLocalStorage,
  setLocalStorage,
} from "../../utils/sales-utils/storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import tagService from "../../services/sales-services/tagService";

// Type for company table column keys
type CompanyColumnKey =
  | keyof Company
  | "checkbox"
  | "actions"
  | "lastInteraction"
  | "website"
  | "location"
  | "revenue"
  | "employees"
  | "phone";

// Extend TableColumn interface for Company-specific usage
interface CompanyTableColumn {
  key: CompanyColumnKey;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return <CheckCircle2 className="w-3 h-3 text-green-600" />;
    case "inactive":
      return <MinusCircle className="w-3 h-3 text-gray-500" />;
    case "prospect":
      return <Target className="w-3 h-3 text-blue-600" />;
    case "customer":
      return <CheckCircle2 className="w-3 h-3 text-green-600" />;
    case "lost":
      return <XCircle className="w-3 h-3 text-red-600" />;
    case "won":
      return <CheckCircle2 className="w-3 h-3 text-green-600" />;
    case "dead":
      return <MinusCircle className="w-3 h-3 text-gray-500" />;
    case "lead":
      return <Target className="w-3 h-3 text-yellow-600" />;
    case "engaged":
      return <MessageCircle className="w-3 h-3 text-purple-600" />;
    case "interested":
      return <Eye className="w-3 h-3 text-indigo-600" />;
    case "warm":
      return <Thermometer className="w-3 h-3 text-orange-600" />;
    case "closed":
      return <XCircle className="w-3 h-3 text-gray-500" />;
    default:
      return <Target className="w-3 h-3 text-blue-600" />;
  }
}

const CompaniesTable: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id;
  const organizationId = selectedOrganization?.id;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("crm_access_token")
      : undefined;

  const [companies, setCompanies] = useState<Company[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<"import" | "export">(
    "import"
  );
  const [tagPopupData, setTagPopupData] = useState<{
    companyId: string;
    tags: string[];
    position: { x: number; y: number };
  } | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [tagOptions, setTagOptions] = useState<
    Array<{ id?: string; name: string; color?: string }>
  >([]);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [statusDropdownData, setStatusDropdownData] = useState<{
    companyId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [sizeDropdownData, setSizeDropdownData] = useState<{
    companyId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [sizeSearchTerm, setSizeSearchTerm] = useState("");
  const [tagAddDropdownData, setTagAddDropdownData] = useState<{
    companyId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [tagAddSearchTerm, setTagAddSearchTerm] = useState("");
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const [maxScrollPosition, setMaxScrollPosition] = useState(0);
  const [tableRef, setTableRef] = useState<HTMLDivElement | null>(null);

  // Utility function to calculate dynamic dropdown positioning
  const calculateDropdownPosition = (
    triggerRect: DOMRect,
    dropdownHeight: number = 300, // Estimated dropdown height
    dropdownWidth: number = 250 // Estimated dropdown width
  ) => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let x = triggerRect.left;
    let y = triggerRect.bottom + 5; // Default: below the trigger

    // Check if dropdown would go below viewport
    if (y + dropdownHeight > viewportHeight) {
      // Position above the trigger
      y = triggerRect.top - dropdownHeight - 5;
    }

    // Check if dropdown would go outside viewport horizontally
    if (x + dropdownWidth > viewportWidth) {
      x = viewportWidth - dropdownWidth - 10;
    }

    // Ensure minimum position
    x = Math.max(10, x);
    y = Math.max(10, y);

    return { x, y };
  };

  const { decrementCount } = useCountsContext();

  // Fetch tag options for dropdown
  useEffect(() => {
    const fetchTagOptions = async () => {
      if (!workspaceId || !organizationId || !token) return;
      try {
        const response = await tagService.getAllTags(
          workspaceId,
          organizationId,
          token
        );
        if (response.success && response.data) {
          setTagOptions(response.data);
        } else {
          setTagOptions([]);
        }
      } catch (error) {
        setTagOptions([]);
      }
    };
    fetchTagOptions();
  }, [workspaceId, organizationId, token]);

  // Filter tag options based on search term
  const filteredTagOptions = useMemo(() => {
    if (!tagSearchTerm.trim()) return tagOptions;
    return tagOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
    );
  }, [tagOptions, tagSearchTerm]);

  // Filter status options based on search term
  const filteredStatusOptions = useMemo(() => {
    if (!statusSearchTerm.trim()) return COMPANY_STATUSES;
    return COMPANY_STATUSES.filter(status =>
      status.toLowerCase().includes(statusSearchTerm.toLowerCase())
    );
  }, [statusSearchTerm]);

  // Filter size options based on search term
  const filteredSizeOptions = useMemo(() => {
    if (!sizeSearchTerm.trim()) return COMPANY_SIZES;
    return COMPANY_SIZES.filter(size =>
      size.toLowerCase().includes(sizeSearchTerm.toLowerCase())
    );
  }, [sizeSearchTerm]);

  // Filter tag add options based on search term and exclude already selected tags
  const filteredTagAddOptions = useMemo(() => {
    if (!tagAddSearchTerm.trim()) return tagOptions;
    return tagOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagAddSearchTerm.toLowerCase())
    );
  }, [tagOptions, tagAddSearchTerm]);

  // Get current company tags for comparison
  const getCurrentCompanyTags = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company?.tags) return [];

    // Normalize tags to always return tag names as strings
    return company.tags
      .map(tag => {
        if (typeof tag === "string") {
          return tag;
        } else if (tag && typeof tag === "object") {
          // Handle nested structure: tag.tag.name
          if (
            "tag" in tag &&
            tag.tag &&
            typeof tag.tag === "object" &&
            "name" in tag.tag
          ) {
            return (tag.tag as { name: string }).name;
          }
          // Handle direct tag structure: tag.name
          if ("name" in tag && tag.name) {
            return (tag as { name: string }).name;
          }
        }
        return "";
      })
      .filter(tag => tag !== "");
  };

  // Fetch companies from API
  useEffect(() => {
    const fetchCompanies = async () => {
      if (!user || !selectedOrganization || !selectedWorkspace) return;

      setLoading(true);
      setError(null);

      try {
        const token = getLocalStorage("crm_access_token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        // Get workspace and organization IDs from context and ensure they are strings
        const workspaceId = String(selectedWorkspace.id);
        const organizationId = String(selectedOrganization.id);

        // Validate UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(workspaceId) || !uuidRegex.test(organizationId)) {
          setError("Invalid workspace or organization ID format");
          setLoading(false);
          return;
        }

        const response = await companyService.getCompanies(
          workspaceId,
          organizationId,
          token
        );

        if (response.success && response.data) {
          // Keep original tag structure for CompanyDetailPanel
          const convertedCompanies = response.data.map(company => ({
            ...company,
            tags: company.tags || [],
          }));

          setCompanies(convertedCompanies);
        } else {
          setError(response.error || "Failed to fetch companies");
        }
      } catch {
        setError("Failed to fetch companies");
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user, selectedOrganization, selectedWorkspace]);

  // Handle clicking outside tag popup to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagPopupData && !(event.target as Element).closest(".tag-popup")) {
        setTagPopupData(null);
      }
    };

    if (tagPopupData) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [tagPopupData]);

  // Remove unused helper functions
  // const mapCompanyStatusToStatus = (status: string): Company['status'] => {
  //   switch (status) {
  //     case 'ACTIVE':
  //       return 'ACTIVE';
  //     case 'INACTIVE':
  //       return 'INACTIVE';
  //     case 'PROSPECT':
  //       return 'PROSPECT';
  //     case 'CUSTOMER':
  //       return 'CUSTOMER';
  //     case 'PARTNER':
  //       return 'PARTNER';
  //     default:
  //       return 'INACTIVE';
  //   }
  // };

  // const mapCompanyTypeToSize = (companyType: string): Company['size'] => {
  //   switch (companyType) {
  //     case 'ENTERPRISE':
  //       return 'ENTERPRISE';
  //     case 'MID_MARKET':
  //       return 'LARGE';
  //     case 'SMALL_BUSINESS':
  //       return 'MEDIUM';
  //     default:
  //       return 'SMALL';
  //   }
  // };

  // const mapActivityType = (type: string): Activity['type'] => {
  //   switch (type) {
  //     case 'EMAIL':
  //       return 'email';
  //     case 'CALL':
  //       return 'call';
  //     case 'MEETING':
  //       return 'meeting';
  //     case 'NOTE':
  //       return 'note';
  //     case 'TASK':
  //       return 'task';
  //     default:
  //       return 'note';
  //   }
  // };

  // Extract real data from companies for filters
  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    companies.forEach(company => {
      if (company.tags && Array.isArray(company.tags)) {
        company.tags.forEach(tag => {
          if (tag && typeof tag === "string") {
            allTags.add(tag);
          } else if (tag && typeof tag === "object") {
            // Handle nested tag structure: tag.tag.name
            if (
              tag.tag &&
              typeof tag.tag === "object" &&
              "name" in tag.tag &&
              typeof tag.tag.name === "string"
            ) {
              allTags.add(tag.tag.name);
            }
            // Handle direct tag structure: tag.name
            else if ("name" in tag && typeof tag.name === "string") {
              allTags.add(tag.name);
            }
          }
        });
      }
    });
    const sortedTags = Array.from(allTags).sort();

    return sortedTags;
  }, [companies]);

  const availableOwners = useMemo(() => {
    const ownerSet = new Set<string>();
    companies.forEach(company => {
      if (company.owner?.name) {
        ownerSet.add(company.owner.name);
      }
    });
    return Array.from(ownerSet).sort();
  }, [companies]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    companies.forEach(company => {
      if (company.status) {
        statusSet.add(company.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [companies]);

  const availablePriorities = useMemo(() => {
    const prioritySet = new Set<string>();
    companies.forEach(company => {
      if (company.priority) {
        prioritySet.add(company.priority);
      }
    });
    return Array.from(prioritySet).sort();
  }, [companies]);

  const availableIndustries = useMemo(() => {
    const industrySet = new Set<string>();
    companies.forEach(company => {
      if (company.industry) {
        industrySet.add(company.industry);
      }
    });
    return Array.from(industrySet).sort();
  }, [companies]);

  const availableSources = useMemo(() => {
    const sourceSet = new Set<string>();
    companies.forEach(company => {
      if (company.source) {
        sourceSet.add(company.source);
      }
    });
    return Array.from(sourceSet).sort();
  }, [companies]);

  const availableCompanySizes = useMemo(() => {
    const sizeSet = new Set<string>();
    companies.forEach(company => {
      if (company.size) {
        sizeSet.add(company.size);
      }
    });
    return Array.from(sizeSet).sort();
  }, [companies]);

  const availableRevenues = useMemo(() => {
    const revenueSet = new Set<string>();
    companies.forEach(company => {
      if (company.revenue) {
        revenueSet.add(company.revenue);
      }
    });
    return Array.from(revenueSet).sort();
  }, [companies]);

  const availableLeadScores = useMemo(() => {
    const scoreSet = new Set<number>();
    companies.forEach(company => {
      if (company.leadScore !== undefined && company.leadScore !== null) {
        scoreSet.add(company.leadScore);
      }
    });
    return Array.from(scoreSet).sort((a, b) => a - b);
  }, [companies]);

  const handleCreateCompany = async (companyData: Partial<Company>) => {
    if (!selectedWorkspace || !selectedOrganization) {
      setError(
        "Please select a workspace and organization before creating a company."
      );
      return;
    }

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await companyService.createCompany(
        selectedWorkspace.id,
        selectedOrganization.id,
        companyData,
        token
      );

      if (response.success && response.data) {
        setCompanies(prev => [response.data as Company, ...prev]);
        setShowAddForm(false);
        setError(null);
        toastService.success("Company created successfully");
      } else {
        toastService.error(response.error || "Failed to create company");
        setError(response.error || "Failed to create company");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create company"
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;

    // Set force and deleteRelated to always be true
    const force = true;
    const deleteRelated = true;

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      if (!selectedOrganization || !selectedWorkspace) {
        setError("No organization or workspace selected");
        return;
      }

      const workspaceId = String(selectedWorkspace.id);
      const organizationId = String(selectedOrganization.id);

      // Validate UUID format for company IDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidCompanyIds = selectedCompanies.filter(
        id => !uuidRegex.test(id)
      );
      if (invalidCompanyIds.length > 0) {
        setError(`Invalid company ID format: ${invalidCompanyIds.join(", ")}`);
        return;
      }

      // Validate UUID format for workspace and organization
      if (!uuidRegex.test(workspaceId) || !uuidRegex.test(organizationId)) {
        setError("Invalid workspace or organization ID format");
        return;
      }

      const response = await companyService.bulkDeleteCompanies(
        selectedCompanies,
        workspaceId,
        organizationId,
        token,
        force,
        deleteRelated
      );

      if (response.success) {
        // Update counts for deleted companies
        selectedCompanies.forEach(companyId => {
          const deletedCompany = companies.find(c => c.id === companyId);
          if (deletedCompany) {
            decrementCount("companies", "total");
            if (deletedCompany.status === "ACTIVE") {
              decrementCount("companies", "active");
            } else if (deletedCompany.status === "PROSPECT") {
              decrementCount("companies", "prospects");
            } else if (deletedCompany.status === "CUSTOMER") {
              decrementCount("companies", "customers");
            } else if (deletedCompany.status === "LOST") {
              decrementCount("companies", "partners");
            }
          }
        });

        // Remove deleted companies from the list
        setCompanies(prev =>
          prev.filter(company => !selectedCompanies.includes(company.id))
        );
        setSelectedCompanies([]);
        setShowBulkDeleteModal(false);
      } else {
        setError(response.error || "Failed to delete companies");
      }
    } catch {
      setError("Failed to delete companies");
    }
  };

  // Table columns configuration
  const [columns, setColumns] = useState<CompanyTableColumn[]>(() => {
    // Load saved column configuration from localStorage
    const savedColumns = getLocalStorage("companiesTableColumns");
    if (savedColumns) {
      try {
        return JSON.parse(savedColumns);
      } catch (error) {}
    }

    // Default column configuration
    return [
      {
        key: "checkbox" as keyof Lead | "actions" | "checkbox",
        label: "",
        sortable: false,
        visible: true,
        width: "50px",
      },
      {
        key: "name" as keyof Lead | "actions" | "checkbox",
        label: "Companies",
        sortable: true,
        visible: true,
        width: "250px",
      },
      {
        key: "status" as keyof Lead | "actions" | "checkbox",
        label: "Status",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "tags" as keyof Lead | "actions" | "checkbox",
        label: "Tags",
        sortable: false,
        visible: true,
        width: "150px",
      },
      {
        key: "actions" as keyof Lead | "actions" | "checkbox",
        label: "Links",
        sortable: false,
        visible: true,
        width: "120px",
      },
      {
        key: "owner" as keyof Lead | "actions" | "checkbox",
        label: "Owners",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "lastInteraction" as keyof Lead | "actions" | "checkbox",
        label: "Last interaction",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "size" as keyof Lead | "actions" | "checkbox",
        label: "Size",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "industry" as keyof Lead | "actions" | "checkbox",
        label: "Industry",
        sortable: true,
        visible: true,
        width: "100px",
      },
      {
        key: "email" as keyof Lead | "actions" | "checkbox",
        label: "Email",
        sortable: true,
        visible: false,
        width: "200px",
      },
      {
        key: "phone" as keyof Lead | "actions" | "checkbox",
        label: "Phone",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "website" as keyof Lead | "actions" | "checkbox",
        label: "Website",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "location" as keyof Lead | "actions" | "checkbox",
        label: "Location",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "revenue" as keyof Lead | "actions" | "checkbox",
        label: "Revenue",
        sortable: true,
        visible: false,
        width: "120px",
      },
      {
        key: "employees" as keyof Lead | "actions" | "checkbox",
        label: "Employees",
        sortable: true,
        visible: false,
        width: "120px",
      },
      {
        key: "createdAt" as keyof Lead | "actions" | "checkbox",
        label: "Created",
        sortable: true,
        visible: false,
        width: "120px",
      },
    ];
  });

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    tags: [],
    owner: [],
    connection: [],
    dateRange: {},
  });

  const [sort, setSort] = useState<SortState>({
    field: "createdAt",
    direction: "desc",
  });

  // Search suggestions
  const searchSuggestions = useSearchSuggestions(
    filters.search,
    companies,
    "companies"
  );

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    const filtered = companies.filter(company => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          company.name || "",
          company.domain || "",
          company.industry || "",
          company.websiteUrl || "",
          company.description || "",
          company.status || "",
          company.size || "",
          company.revenue || "",
          company.owner?.name || "",
          // Include tags
          ...(company.tags || []).map(tag => {
            if (typeof tag === "string") return tag;
            if (tag && typeof tag === "object") {
              if (
                tag.tag &&
                typeof tag.tag === "object" &&
                (tag.tag as Record<string, unknown>).name
              )
                return (tag.tag as Record<string, unknown>).name as string;
              if ((tag as Record<string, unknown>).name)
                return (tag as Record<string, unknown>).name as string;
            }
            return "";
          }),
        ];
        if (
          !searchableFields.some(
            field =>
              field &&
              typeof field === "string" &&
              field.toLowerCase().includes(searchTerm)
          )
        ) {
          return false;
        }
      }

      // Status filter
      if (
        filters.status.length > 0 &&
        !filters.status.includes(company.status)
      ) {
        return false;
      }

      // Tags filter
      if (
        filters.tags.length > 0 &&
        !filters.tags.some(tag =>
          (company.tags || []).some(companyTag => {
            if (typeof companyTag === "string") {
              return companyTag === tag;
            }
            if (typeof companyTag === "object" && companyTag) {
              // Handle nested tag structure: tag.tag.name
              if (
                companyTag.tag &&
                typeof companyTag.tag === "object" &&
                "name" in companyTag.tag &&
                typeof companyTag.tag.name === "string"
              ) {
                return companyTag.tag.name === tag;
              }
              // Handle direct tag structure: tag.name
              if ("name" in companyTag && typeof companyTag.name === "string") {
                return companyTag.name === tag;
              }
            }
            return false;
          })
        )
      ) {
        return false;
      }

      // Owner filter
      if (
        filters.owner.length > 0 &&
        !filters.owner.includes(company.owner?.name || "")
      ) {
        return false;
      }

      // Size filter (replacing connection filter)
      if (
        filters.connection?.length &&
        filters.connection.length > 0 &&
        !filters.connection.includes(company.size || "")
      ) {
        return false;
      }

      // Date range filter
      if (
        filters.dateRange.start &&
        new Date(company.createdAt) < filters.dateRange.start
      ) {
        return false;
      }
      if (
        filters.dateRange.end &&
        new Date(company.createdAt) > filters.dateRange.end
      ) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      const aValue = (a as unknown as Record<string, unknown>)[sort.field];
      const bValue = (b as unknown as Record<string, unknown>)[sort.field];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sort.direction === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [companies, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCompanies.length / pageSize);
  const paginatedCompanies = filteredAndSortedCompanies.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: CompanyColumnKey) => {
    setSort(prev => ({
      field: field as keyof Lead,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectCompany = (companyId: string) => {
    setSelectedCompanies(prev =>
      prev.includes(companyId)
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleSelectAll = () => {
    setSelectedCompanies(
      selectedCompanies.length === paginatedCompanies.length
        ? []
        : paginatedCompanies.map(company => company.id)
    );
  };

  const handleSelectAllInTable = () => {
    setSelectedCompanies(
      selectedCompanies.length === filteredAndSortedCompanies.length
        ? []
        : filteredAndSortedCompanies.map(company => company.id)
    );
  };

  // Save columns configuration to localStorage
  const saveColumnsToStorage = (updatedColumns: CompanyTableColumn[]) => {
    try {
      setLocalStorage("companiesTableColumns", JSON.stringify(updatedColumns));
    } catch (error) {}
  };

  const scrollTableLeft = () => {
    if (tableRef) {
      const scrollAmount = 400; // Approximate width of 2 columns
      tableRef.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      setTableScrollPosition(Math.max(0, tableScrollPosition - scrollAmount));
    }
  };

  const scrollTableRight = () => {
    if (tableRef) {
      const scrollAmount = 400; // Approximate width of 2 columns
      tableRef.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTableScrollPosition(tableScrollPosition + scrollAmount);
    }
  };

  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const scrollWidth = e.currentTarget.scrollWidth;
    const clientWidth = e.currentTarget.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    setTableScrollPosition(scrollLeft);
    setMaxScrollPosition(maxScroll);
  };

  const updateCompanyStatus = async (
    companyId: string,
    status: Company["status"]
  ) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Optimistically update the UI
      setCompanies(prev =>
        prev.map(company =>
          company.id === companyId ? { ...company, status } : company
        )
      );

      // Call the API to update the status
      const response = await companyService.updateCompany(
        companyId,
        { status },
        token,
        String(selectedWorkspace.id)
      );

      if (!response.success) {
        // Revert the optimistic update if the API call failed
        setCompanies(prev =>
          prev.map(company =>
            company.id === companyId
              ? { ...company, status: company.status }
              : company
          )
        );
        setError(response.error || "Failed to update company status");
      }
    } catch {
      setError("Failed to update company status");
    }
  };

  const addTagToCompany = async (companyId: string, tagName: string) => {
    if (!workspaceId || !organizationId || !token) return;
    try {
      const tag = tagOptions.find(t => t.name === tagName);
      if (!tag || !tag.id) return;
      const response = await tagService.assignTag(
        {
          tagId: tag.id,
          entityId: companyId,
          entityType: "company",
          organizationId,
          workspaceId,
        },
        token
      );
      if (response.success) {
        setCompanies(prev =>
          prev.map(company =>
            company.id === companyId
              ? {
                  ...company,
                  tags: [...(company.tags || []), { name: tagName }],
                }
              : company
          )
        );
        setTagAddDropdownData(null);
      }
    } catch {}
  };

  const updateCompanySize = async (
    companyId: string,
    size: Company["size"]
  ) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Optimistically update the UI
      setCompanies(prev =>
        prev.map(company =>
          company.id === companyId ? { ...company, size } : company
        )
      );

      // Call the API to update the size
      const response = await companyService.updateCompany(
        companyId,
        { size },
        token,
        String(selectedWorkspace.id)
      );

      if (!response.success) {
        // Revert the optimistic update if the API call failed
        setCompanies(prev =>
          prev.map(company =>
            company.id === companyId
              ? { ...company, size: company.size }
              : company
          )
        );
        setError(response.error || "Failed to update company size");
      }
    } catch {
      setError("Failed to update company size");
    }
  };

  // Removed unused getStatusBadge function

  const getTagBadge = (tag: string) => {
    // Handle undefined, null, or empty tags
    if (!tag || typeof tag !== "string") {
      return null;
    }

    const tagColors = [
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
      "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    ];

    const colorIndex = tag.length % tagColors.length;
    return (
      <span
        className={`inline-flex gap-1 items-center px-2 py-1 text-xs font-medium rounded-full ${tagColors[colorIndex]}`}
      >
        <Zap className="w-3 h-3" />
        {tag}
      </span>
    );
  };

  // Removed unused getPriorityBadge function

  const renderCellContent = (company: Company, column: CompanyTableColumn) => {
    switch (column.key) {
      case "status":
        return (
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const position = calculateDropdownPosition(rect);
                setStatusDropdownData({
                  companyId: company.id,
                  position,
                });
                setStatusSearchTerm("");
              }}
              className="text-sm bg-transparent border-none transition-colors cursor-pointer focus:outline-none hover:text-blue-600"
            >
              {company.status ? (
                <span className="inline-flex gap-1 items-center px-2 py-1 text-xs font-medium rounded-full">
                  {getStatusIcon(company.status)}
                  {company.status.charAt(0).toUpperCase() +
                    company.status.slice(1).toLowerCase()}
                </span>
              ) : (
                <span className="text-gray-400">Select status</span>
              )}
            </button>
          </div>
        );

      case "tags":
        return (
          <div className="relative">
            {company.tags && company.tags.length > 0 ? (
              <div className="flex gap-1 items-center">
                {/* Show first 2 tags */}
                {company.tags.slice(0, 2).map((tag, index) => {
                  let tagName: string | undefined;
                  if (typeof tag === "string") {
                    tagName = tag;
                  } else if (tag && typeof tag === "object") {
                    // Handle nested structure: tag.tag.name
                    if (
                      "tag" in tag &&
                      tag.tag &&
                      typeof tag.tag === "object" &&
                      "name" in tag.tag
                    ) {
                      tagName = (tag.tag as { name: string }).name;
                    } else if ("name" in tag && tag.name) {
                      tagName = (tag as { name: string }).name;
                    }
                  }
                  const tagBadge = tagName ? getTagBadge(tagName) : null;
                  return tagBadge ? <div key={index}>{tagBadge}</div> : null;
                })}

                {/* Show +X more indicator if there are more than 2 tags */}
                {company.tags.length > 2 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const position = calculateDropdownPosition(rect);
                      setTagPopupData({
                        companyId: company.id,
                        tags: company.tags.map(tag => {
                          if (typeof tag === "string") {
                            return tag;
                          } else if (tag && typeof tag === "object") {
                            // Handle nested structure: tag.tag.name
                            if (
                              "tag" in tag &&
                              tag.tag &&
                              typeof tag.tag === "object" &&
                              "name" in tag.tag
                            ) {
                              return (tag.tag as { name: string }).name;
                            } else if ("name" in tag && tag.name) {
                              return (tag as { name: string }).name;
                            }
                          }
                          return "";
                        }),
                        position,
                      });
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-full transition-colors duration-200 hover:bg-gray-200"
                  >
                    +{company.tags.length - 2}
                  </button>
                )}

                {/* Add tag button when there are existing tags */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const position = calculateDropdownPosition(rect);
                    setTagAddDropdownData({
                      companyId: company.id,
                      position,
                    });
                    setTagAddSearchTerm("");
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full transition-colors duration-200 hover:bg-blue-100"
                >
                  <Plus className="mr-1 w-3 h-3" />
                  Add
                </button>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-400">Not tagged</span>
                <button
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const position = calculateDropdownPosition(rect);
                    setTagAddDropdownData({
                      companyId: company.id,
                      position,
                    });
                    setTagAddSearchTerm("");
                  }}
                >
                  Add tags
                </button>
              </div>
            )}
          </div>
        );

      case "actions":
        return (
          <div className="flex items-center space-x-2">
            <button
              className={`p-1 rounded transition-colors ${company.websiteUrl ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={company.websiteUrl ? "Visit website" : "No website"}
              onClick={e => {
                e.stopPropagation();
                if (company.websiteUrl) {
                  window.open(company.websiteUrl, "_blank");
                }
              }}
              disabled={!company.websiteUrl}
            >
              <svg
                className={`w-4 h-4 ${company.websiteUrl ? "text-blue-600 hover:text-blue-700" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </button>
            <button
              className={`p-1 rounded transition-colors ${company.linkedinUrl ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                company.linkedinUrl
                  ? "View LinkedIn profile"
                  : "No LinkedIn profile"
              }
              onClick={e => {
                e.stopPropagation();
                if (company.linkedinUrl) {
                  window.open(company.linkedinUrl, "_blank");
                }
              }}
              disabled={!company.linkedinUrl}
            >
              <svg
                className={`w-4 h-4 ${company.linkedinUrl ? "text-blue-600 hover:text-blue-700" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              className={`p-1 rounded transition-colors ${company.twitterUrl ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                company.twitterUrl
                  ? "View Twitter profile"
                  : "No Twitter profile"
              }
              onClick={e => {
                e.stopPropagation();
                if (company.twitterUrl) {
                  window.open(company.twitterUrl, "_blank");
                }
              }}
              disabled={!company.twitterUrl}
            >
              <svg
                className={`w-4 h-4 ${company.twitterUrl ? "text-blue-400 hover:text-blue-500" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 4.908 4.908 0 01-6.102 4.53 4.942 4.942 0 01-1.766-.07 6.979 6.979 0 005.3 2.5 9.96 9.96 0 01-6.1 2.1c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
            <button
              className={`p-1 rounded transition-colors ${company.whatsappNumber ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                company.whatsappNumber
                  ? `WhatsApp ${company.name}`
                  : "No WhatsApp number"
              }
              onClick={e => {
                e.stopPropagation();
                if (company.whatsappNumber) {
                  window.open(
                    `https://wa.me/${company.whatsappNumber}`,
                    "_blank"
                  );
                }
              }}
              disabled={!company.whatsappNumber}
            >
              <svg
                className={`w-4 h-4 ${company.whatsappNumber ? "text-green-500 hover:text-green-600" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
            </button>
          </div>
        );

      case "owner":
        return (
          <div className="flex items-center space-x-2">
            <img
              src={
                company.owner?.avatar ||
                "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=20&h=20&dpr=2"
              }
              alt="Owner"
              className="w-5 h-5 rounded-full"
            />
            <span className="text-sm text-gray-900 dark:text-white truncate">
              {company.owner?.name || "Unassigned"}
            </span>
          </div>
        );

      case "lastInteraction":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {company.lastEnrichedAt
              ? new Date(company.lastEnrichedAt).toLocaleDateString()
              : "Never"}
          </span>
        );

      case "size" as keyof Lead | "actions" | "checkbox":
        return (
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const position = calculateDropdownPosition(rect);
                setSizeDropdownData({
                  companyId: company.id,
                  position,
                });
                setSizeSearchTerm("");
              }}
              className="text-sm bg-transparent border-none transition-colors cursor-pointer focus:outline-none hover:text-blue-600"
            >
              {company.size ? (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full">
                  {company.size.charAt(0).toUpperCase() +
                    company.size.slice(1).toLowerCase()}
                </span>
              ) : (
                <span className="text-gray-400">Select size</span>
              )}
            </button>
          </div>
        );

      case "industry":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {company.industry || "-"}
          </span>
        );

      case "email":
        return (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {company.domain || "-"}
            </span>
          </div>
        );

      case "phone":
        return (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {company.phoneNumber || "-"}
            </span>
          </div>
        );

      case "website":
        return (
          <div className="flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            <span className="text-sm text-gray-900 dark:text-white">
              {company.websiteUrl || "-"}
            </span>
          </div>
        );

      case "location":
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {company.city || company.state || company.country || "-"}
            </span>
          </div>
        );

      case "revenue" as keyof Lead | "actions" | "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {company.revenue ? `$${company.revenue.toLocaleString()}` : "-"}
            </span>
          </div>
        );

      case "employees" as keyof Lead | "actions" | "checkbox":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {company.leadScore || "-"}
          </span>
        );

      case "createdAt":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {new Date(company.createdAt).toLocaleDateString()}
          </span>
        );

      default:
        return null;
    }
  };

  const visibleColumns = useMemo(() => {
    const visible = columns.filter(col => col.visible);
    return visible;
  }, [columns]);

  // Show error state
  if (error) {
    // Check if it's a user deactivation error
    const isUserDeactivationError =
      error.includes("User not found or inactive") ||
      error.includes("User not found") ||
      error.includes("inactive");

    // Check if it's a permission error
    const isPermissionError =
      error.includes("permission") ||
      error.includes("Permission") ||
      error.includes("Insufficient") ||
      error.includes("Required:") ||
      error.includes("Forbidden") ||
      (error.includes("Unauthorized") && !isUserDeactivationError);

    if (isUserDeactivationError) {
      // Show table structure with user deactivation warning
      return (
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  LISTS
                </h1>
                <button className="p-1 rounded hover:bg-gray-100" disabled>
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="flex justify-center items-center w-6 h-6 bg-gray-500 dark:bg-gray-600 rounded-full">
                      <span className="text-xs font-medium text-white">0</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Deactivated
                  </span>
                </div>
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-400 dark:bg-gray-600 rounded-md cursor-not-allowed"
                >
                  Add Company
                </button>
              </div>
            </div>
          </div>

          {/* Filters - disabled */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="py-2 pr-4 pl-10 w-64 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                    disabled
                  />
                </div>
                <button
                  className="flex items-center px-3 py-2 space-x-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                  disabled
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Filter</span>
                </button>
                <button
                  className="flex items-center px-3 py-2 space-x-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                  disabled
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Columns</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing 0 of 0 leads
              </span>
            </div>
          </div>

          {/* Table with User Deactivation Warning */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      disabled
                    />
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Links
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Owners
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Last interaction
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Connection
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Lead
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-orange-600">
                        <AlertCircle className="mx-auto w-12 h-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        Account Deactivated
                      </h3>
                      <p className="mb-4 max-w-md text-gray-600 dark:text-gray-400">
                        Your account has been deactivated in this organization.
                        You can still access other organizations where you are
                        active.
                      </p>
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Switch to another organization from the sidebar to
                          continue working.
                        </p>
                        {user?.organizations &&
                          user.organizations.length > 1 && (
                            <div className="p-4 mt-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="mb-2 text-sm font-medium text-blue-900">
                                Available Organizations:
                              </h4>
                              <div className="space-y-1">
                                {user.organizations
                                  .filter(
                                    org => org.id !== selectedOrganization?.id
                                  )
                                  .map(org => (
                                    <div
                                      key={org.id}
                                      className="text-sm text-blue-700"
                                    >
                                      • {org.name}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (isPermissionError) {
      // Show table structure with permission warning
      return (
        <div className="flex-1 bg-gray-50 dark:bg-gray-900">
          {/* Header */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  LISTS
                </h1>
                <button className="p-1 rounded hover:bg-gray-100" disabled>
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <div className="flex justify-center items-center w-6 h-6 bg-gray-500 dark:bg-gray-600 rounded-full">
                      <span className="text-xs font-medium text-white">0</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    No access
                  </span>
                </div>
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-400 dark:bg-gray-600 rounded-md cursor-not-allowed"
                >
                  Add Company
                </button>
              </div>
            </div>
          </div>

          {/* Filters - disabled */}
          <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    className="py-2 pr-4 pl-10 w-64 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                    disabled
                  />
                </div>
                <button
                  className="flex items-center px-3 py-2 space-x-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                  disabled
                >
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Filter</span>
                </button>
                <button
                  className="flex items-center px-3 py-2 space-x-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-300"
                  disabled
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-400">Columns</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="px-6 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing 0 of 0 leads
              </span>
            </div>
          </div>

          {/* Table with Permission Warning */}
          <div className="overflow-x-auto bg-white dark:bg-gray-800">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      disabled
                    />
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Leads
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Links
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Owners
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Last interaction
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Connection
                  </th>
                  <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase">
                    Lead
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mb-4 text-yellow-600">
                        <AlertCircle className="mx-auto w-12 h-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        Insufficient Permissions
                      </h3>
                      <p className="mb-4 max-w-md text-gray-600 dark:text-gray-400">
                        You dont have permission to view leads in this
                        workspace.
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Contact your workspace administrator to request the
                        necessary permissions.
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    // For non-permission errors, show the original error page
    return (
      <div className="flex flex-1 justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-red-600">
            <AlertCircle className="mx-auto w-12 h-12" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
            Error loading leads
          </h3>
          <p className="mb-4 text-gray-600 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Helper function for sort icons
  const getSortIcon = (columnKey: string) => {
    if (sort.field !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sort.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    ) : (
      <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
    );
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Companies
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage your companies and organizations
            </CardDescription>
          </div>

          {/* Workspace Warning */}
          {(!selectedWorkspace || !selectedWorkspace.id) && (
            <div className="flex items-center px-3 py-1 space-x-2 bg-orange-50 dark:bg-orange-900/30 rounded-md border border-orange-200 dark:border-orange-700">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-orange-700 dark:text-orange-300">
                Please select a workspace
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setImportExportMode("import");
                setShowImportExportModal(true);
              }}
              variant="outline"
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={() => {
                setImportExportMode("export");
                setShowImportExportModal(true);
              }}
              variant="outline"
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => setShowColumnSelector(true)}
              variant="outline"
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl"
            >
              <Settings className="w-4 h-4 mr-2" />
              Columns
            </Button>
            {selectedCompanies.length > 0 && (
              <>
                <Button
                  onClick={handleSelectAllInTable}
                  variant="outline"
                  className={`rounded-xl ${
                    selectedCompanies.length ===
                    filteredAndSortedCompanies.length
                      ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100"
                      : "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  {selectedCompanies.length ===
                  filteredAndSortedCompanies.length
                    ? `Unselect All (${filteredAndSortedCompanies.length})`
                    : `Select All (${filteredAndSortedCompanies.length})`}
                </Button>
                <Button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedCompanies.length})
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowAddForm(true)}
              disabled={!selectedWorkspace || !selectedWorkspace.id}
              className={`rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm ${
                selectedWorkspace && selectedWorkspace.id
                  ? "bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
                  : "bg-gray-300 text-gray-400 cursor-not-allowed"
              }`}
              title={
                !selectedWorkspace || !selectedWorkspace.id
                  ? "Please select a workspace first"
                  : "Add new company"
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Search and Filters */}
          <div className="px-6 pb-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <Input
                  placeholder="Search companies..."
                  value={filters.search}
                  onChange={e => {
                    setFilters(prev => ({ ...prev, search: e.target.value }));
                    setShowSearchSuggestions(true);
                  }}
                  onFocus={() => setShowSearchSuggestions(true)}
                  className="pl-10 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <SearchSuggestions
                  searchTerm={filters.search}
                  suggestions={
                    searchSuggestions as unknown as {
                      id: string;
                      type:
                        | "status"
                        | "owner"
                        | "company"
                        | "industry"
                        | "source"
                        | "name"
                        | "email"
                        | "jobTitle"
                        | "tag";
                      value: string;
                      label: string;
                    }[]
                  }
                  isOpen={showSearchSuggestions}
                  onClose={() => setShowSearchSuggestions(false)}
                  onSuggestionSelect={suggestion => {
                    setFilters(prev => ({ ...prev, search: suggestion.value }));
                    setShowSearchSuggestions(false);
                  }}
                  entityType="companies"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <NestedFilterDropdown
                  filters={filters}
                  onUpdateFilters={setFilters}
                  entityType="companies"
                  availableTags={availableTags}
                  availableOwners={availableOwners}
                  availableStatuses={availableStatuses}
                  availablePriorities={availablePriorities}
                  availableIndustries={availableIndustries}
                  availableSources={availableSources}
                  availableCompanySizes={availableCompanySizes}
                  availableRevenues={availableRevenues}
                  availableLeadScores={availableLeadScores}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.status.length > 0 ||
            filters.tags.length > 0 ||
            filters.owner.length > 0 ||
            (filters.connection?.length || 0) > 0) && (
            <div className="px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 rounded-xl mx-6">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active filters:
                </span>
                {/* Status filters */}
                {filters.status.map(status => (
                  <span
                    key={status}
                    className="inline-flex items-center px-2 py-1 text-xs text-blue-800 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/50 rounded-full"
                  >
                    Status:{" "}
                    {status.charAt(0).toUpperCase() +
                      status.slice(1).toLowerCase()}
                    <button
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          status: prev.status.filter(s => s !== status),
                        }))
                      }
                      className="ml-1 hover:text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Tag filters */}
                {filters.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs text-purple-800 dark:text-purple-200 bg-purple-100 dark:bg-purple-900/50 rounded-full"
                  >
                    Tag: {tag}
                    <button
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tag),
                        }))
                      }
                      className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Owner filters */}
                {filters.owner.map(owner => (
                  <span
                    key={owner}
                    className="inline-flex items-center px-2 py-1 text-xs text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/50 rounded-full"
                  >
                    Owner: {owner}
                    <button
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          owner: prev.owner.filter(o => o !== owner),
                        }))
                      }
                      className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Connection filters */}
                {filters.connection?.map(connection => (
                  <span
                    key={connection}
                    className="inline-flex items-center px-2 py-1 text-xs text-orange-800 dark:text-orange-200 bg-orange-100 dark:bg-orange-900/50 rounded-full"
                  >
                    Size: {connection}
                    <button
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          connection: prev.connection?.filter(
                            c => c !== connection
                          ),
                        }))
                      }
                      className="ml-1 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Clear All button */}
                <button
                  onClick={() =>
                    setFilters({
                      search: filters.search,
                      status: [],
                      tags: [],
                      owner: [],
                      connection: [],
                      valueRange: [],
                      dateRange: {},
                    })
                  }
                  className="inline-flex items-center px-2 py-1 text-xs text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Clear All
                  <X className="ml-1 w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Results Summary and Pagination Controls ABOVE the table */}
          <div className="flex flex-col gap-2 px-6 py-3 border-b border-gray-200 dark:border-gray-700 md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginatedCompanies.length} of{" "}
              {filteredAndSortedCompanies.length} companies
              {selectedCompanies.length > 0 &&
                ` (${selectedCompanies.length} selected)`}
            </div>
            <div className="flex gap-4 items-center">
              {selectedCompanies.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAllInTable}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium leading-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedCompanies.length ===
                      filteredAndSortedCompanies.length
                        ? "text-red-600 bg-red-50 border-red-200 hover:bg-red-100 focus:ring-red-500"
                        : "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 focus:ring-blue-500"
                    }`}
                  >
                    {selectedCompanies.length ===
                    filteredAndSortedCompanies.length
                      ? `Unselect All (${filteredAndSortedCompanies.length})`
                      : `Select All (${filteredAndSortedCompanies.length})`}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected ({selectedCompanies.length})</span>
                  </button>
                </>
              )}
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Rows per page:
                </span>
                <select
                  value={pageSize}
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="px-2 py-1 text-sm rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {[10, 20, 50, 100].map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Table with Navigation */}
          <div className="relative">
            {/* Navigation Buttons */}
            <div className="absolute top-0 left-96 z-30 transform -translate-y-1/2">
              <button
                onClick={scrollTableLeft}
                disabled={tableScrollPosition <= 0}
                className={`p-2 rounded-full shadow-lg transition-all ${
                  tableScrollPosition <= 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title="Scroll left by 2 columns"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-0 right-32 z-30 transform -translate-y-1/2">
              <button
                onClick={scrollTableRight}
                disabled={
                  tableScrollPosition >= maxScrollPosition &&
                  maxScrollPosition > 0
                }
                className={`p-2 rounded-full shadow-lg transition-all ${
                  tableScrollPosition >= maxScrollPosition &&
                  maxScrollPosition > 0
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title="Scroll right by 2 columns"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Table Container */}
            <div
              ref={setTableRef}
              className="overflow-x-auto overflow-y-auto flex-1"
              onScroll={handleTableScroll}
            >
              <table className="w-full min-w-max">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr className="border-b border-gray-100/50 dark:border-gray-700/50">
                    <th className="sticky left-0 z-20 px-4 py-3 w-12 text-left align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 dark:border-gray-600"
                        checked={
                          selectedCompanies.length ===
                            paginatedCompanies.length &&
                          paginatedCompanies.length > 0
                        }
                        ref={input => {
                          if (input) {
                            input.indeterminate =
                              selectedCompanies.length > 0 &&
                              selectedCompanies.length <
                                paginatedCompanies.length;
                          }
                        }}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="sticky left-12 z-20 px-6 py-3 w-80 text-left align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                      <button
                        onClick={() => handleSort("name" as CompanyColumnKey)}
                        className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                      >
                        <span>Companies</span>
                        {getSortIcon("name")}
                      </button>
                    </th>
                    {visibleColumns
                      .filter(
                        col =>
                          col.key !== "name" &&
                          col.key !== "checkbox" &&
                          col.key !== "actions"
                      )
                      .map(column => (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-left align-top whitespace-nowrap"
                          style={{ width: column.width }}
                        >
                          {column.sortable ? (
                            <button
                              onClick={() =>
                                handleSort(column.key as CompanyColumnKey)
                              }
                              className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider hover:text-gray-900 dark:hover:text-white"
                            >
                              <span>{column.label}</span>
                              {getSortIcon(column.key)}
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                              {column.label}
                            </span>
                          )}
                        </th>
                      ))}
                    <th className="sticky right-0 z-20 px-6 py-3 w-32 text-right align-top whitespace-nowrap bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 3}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Loading companies...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedCompanies.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 3}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="mx-auto mb-4 w-12 h-12 text-gray-400">
                            <Building2 className="w-12 h-12" />
                          </div>
                          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            No companies found
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedWorkspace && selectedWorkspace.id
                              ? "Get started by creating your first company."
                              : "Please select a workspace to view companies."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCompanies.map(company => (
                      <tr
                        key={company.id}
                        className="border-b border-gray-100/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedCompany(company)}
                      >
                        {/* Selection column */}
                        <td className="sticky left-0 z-10 px-4 py-4 w-12 align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 dark:border-gray-600"
                            checked={selectedCompanies.includes(company.id)}
                            onChange={() => handleSelectCompany(company.id)}
                          />
                        </td>
                        {/* Name column */}
                        <td className="sticky left-12 z-10 px-6 py-4 w-80 align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <div className="flex items-center space-x-2 w-full">
                            <div className="flex justify-center items-center mr-3 w-8 h-8 bg-blue-100 rounded-full">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {company.name}
                              </div>
                              {company.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {company.description.length > 50
                                    ? `${company.description.substring(0, 50)}...`
                                    : company.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Other columns */}
                        {visibleColumns
                          .filter(
                            col =>
                              col.key !== "name" &&
                              col.key !== "checkbox" &&
                              col.key !== "actions"
                          )
                          .map(column => (
                            <td
                              key={column.key}
                              className="px-6 py-4 align-top whitespace-nowrap"
                            >
                              {renderCellContent(company, column)}
                            </td>
                          ))}
                        {/* Actions column */}
                        <td className="sticky right-0 z-10 px-6 py-4 w-32 text-sm font-medium text-right align-top whitespace-nowrap bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <div className="flex justify-end items-center space-x-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedCompany(company);
                              }}
                              className="p-1 rounded hover:bg-gray-100"
                              title="View details"
                            >
                              <MoreHorizontal className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Column Selector */}
      {showColumnSelector && (
        <ColumnSelector
          columns={columns}
          onClose={() => setShowColumnSelector(false)}
          onUpdateColumns={updatedColumns => {
            //
            setColumns(updatedColumns as CompanyTableColumn[]);
            saveColumnsToStorage(updatedColumns as CompanyTableColumn[]);
            setShowColumnSelector(false);
          }}
        />
      )}

      {/* Company Detail Panel */}
      {selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onUpdate={updatedCompany => {
            setCompanies(prev =>
              prev.map(company =>
                company.id === updatedCompany.id ? updatedCompany : company
              )
            );
            setSelectedCompany(updatedCompany);
          }}
          onRefreshList={() => {
            // Trigger a refresh of the companies list
            const fetchCompanies = async () => {
              if (!user || !selectedOrganization || !selectedWorkspace) return;

              try {
                const token = getLocalStorage("crm_access_token");
                if (!token) return;

                const response = await companyService.getCompanies(
                  String(selectedWorkspace.id),
                  String(selectedOrganization.id),
                  token
                );

                if (response.success && response.data) {
                  const convertedCompanies = response.data.map(company => ({
                    ...company,
                    tags: company.tags || [],
                  }));
                  setCompanies(convertedCompanies);
                }
              } catch {
                // Silent error handling
              }
            };
            fetchCompanies();
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddForm &&
        ReactDOM.createPortal(
          <div
            className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out"
            onClick={() => {
              setShowAddForm(false);
              setError(null);
            }}
          >
            <div
              className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Company
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Only the name field is required. All other fields are optional
                and can be updated later.
              </p>
              {error && (
                <div className="p-4 mb-4 bg-red-50 rounded-md border border-red-200">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();

                  // Check if workspace is selected
                  if (!selectedWorkspace || !selectedWorkspace.id) {
                    setError(
                      "Please select a workspace before creating a company."
                    );
                    return;
                  }

                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;

                  if (!name.trim()) {
                    setError("Company name is required.");
                    return;
                  }

                  const companyData: Partial<Company> = {
                    name: name.trim(),
                    status: "ACTIVE" as const,
                    workspaceId: selectedWorkspace.id,
                  };
                  handleCreateCompany(companyData);
                }}
              >
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="flex mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Add Company
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Confirm Bulk Delete
            </h3>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Are you sure you want to delete {selectedCompanies.length}{" "}
              selected leads? This action cannot be undone.
            </p>
            <div className="p-3 mb-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This will force delete all selected
                contacts and their related data (activities, notes, tasks,
                deals).
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-700 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700"
              >
                Delete {selectedCompanies.length} Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Popup */}
      {tagPopupData && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setTagPopupData(null)}
        >
          <div
            className="absolute p-3 max-w-xs bg-white rounded-lg border border-gray-200 shadow-lg tag-popup"
            style={{
              left: `${tagPopupData.position.x}px`,
              top: `${tagPopupData.position.y}px`,
              animation: "tagPopupAppear 0.2s ease-out forwards",
              zIndex: 9999,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Manage Tags
              </h4>
              <button
                onClick={() => setTagPopupData(null)}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagSearchTerm}
                  onChange={e => setTagSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Current Tags */}
            <div className="mb-3">
              <h5 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                Current Tags
              </h5>
              <div className="flex flex-wrap gap-1">
                {tagPopupData.tags.map((tag, index) => {
                  const tagBadge = getTagBadge(tag);
                  return tagBadge ? <div key={index}>{tagBadge}</div> : null;
                })}
                {tagPopupData.tags.length === 0 && (
                  <span className="text-xs text-gray-400">
                    No tags assigned
                  </span>
                )}
              </div>
            </div>

            {/* Available Tags */}
            <div>
              <h5 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                Available Tags
              </h5>
              <div className="overflow-y-auto max-h-32">
                {filteredTagOptions.length > 0 ? (
                  <div className="space-y-1">
                    {filteredTagOptions.map(tag => {
                      const currentTags = getCurrentCompanyTags(
                        tagPopupData.companyId
                      );
                      const isAlreadySelected = currentTags.includes(tag.name);

                      return (
                        <button
                          key={tag.id || tag.name}
                          onClick={() => {
                            if (!isAlreadySelected) {
                              addTagToCompany(tagPopupData.companyId, tag.name);
                            }
                          }}
                          disabled={isAlreadySelected}
                          className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
                            isAlreadySelected
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <Zap className="w-3 h-3 text-purple-600" />
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">
                    {tagSearchTerm ? "No tags found" : "No tags available"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Dropdown */}
      {statusDropdownData && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setStatusDropdownData(null)}
        >
          <div
            className="absolute p-3 max-w-xs bg-white rounded-lg border border-gray-200 shadow-lg searchable-dropdown-enter"
            style={{
              left: `${statusDropdownData.position.x}px`,
              top: `${statusDropdownData.position.y}px`,
              zIndex: 9999,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Select Status
              </h4>
              <button
                onClick={() => setStatusDropdownData(null)}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search status..."
                  value={statusSearchTerm}
                  onChange={e => setStatusSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Status Options */}
            <div className="overflow-y-auto max-h-48">
              {filteredStatusOptions.length > 0 ? (
                <div className="space-y-1">
                  {filteredStatusOptions.map(status => {
                    const isSelected =
                      companies.find(c => c.id === statusDropdownData.companyId)
                        ?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          if (!isSelected)
                            updateCompanyStatus(
                              statusDropdownData.companyId,
                              status
                            );
                          setStatusDropdownData(null);
                        }}
                        disabled={isSelected}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
                          isSelected
                            ? "text-gray-400 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {getStatusIcon(status)}
                        {status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-gray-400">
                  {statusSearchTerm ? "No status found" : "No status available"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Size Dropdown */}
      {sizeDropdownData && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setSizeDropdownData(null)}
        >
          <div
            className="absolute p-3 max-w-xs bg-white rounded-lg border border-gray-200 shadow-lg searchable-dropdown-enter"
            style={{
              left: `${sizeDropdownData.position.x}px`,
              top: `${sizeDropdownData.position.y}px`,
              zIndex: 9999,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Select Size
              </h4>
              <button
                onClick={() => setSizeDropdownData(null)}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search size..."
                  value={sizeSearchTerm}
                  onChange={e => setSizeSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Size Options */}
            <div className="overflow-y-auto max-h-48">
              {filteredSizeOptions.length > 0 ? (
                <div className="space-y-1">
                  {filteredSizeOptions.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        updateCompanySize(sizeDropdownData.companyId, size);
                        setSizeDropdownData(null);
                      }}
                      className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    >
                      {size.charAt(0).toUpperCase() +
                        size.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-400">
                  {sizeSearchTerm ? "No size found" : "No size available"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tag Add Dropdown */}
      {tagAddDropdownData && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setTagAddDropdownData(null)}
        >
          <div
            className="absolute p-3 max-w-xs bg-white rounded-lg border border-gray-200 shadow-lg searchable-dropdown-enter"
            style={{
              left: `${tagAddDropdownData.position.x}px`,
              top: `${tagAddDropdownData.position.y}px`,
              zIndex: 9999,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                Add Tags
              </h4>
              <button
                onClick={() => setTagAddDropdownData(null)}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={tagAddSearchTerm}
                  onChange={e => setTagAddSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Available Tags */}
            <div className="overflow-y-auto max-h-48">
              {filteredTagAddOptions.length > 0 ? (
                <div className="space-y-1">
                  {filteredTagAddOptions.map(tag => {
                    const currentTags = getCurrentCompanyTags(
                      tagAddDropdownData.companyId
                    );
                    const isAlreadySelected = currentTags.includes(tag.name);

                    return (
                      <button
                        key={tag.id || tag.name}
                        onClick={() => {
                          if (!isAlreadySelected) {
                            addTagToCompany(
                              tagAddDropdownData.companyId,
                              tag.name
                            );
                          }
                        }}
                        disabled={isAlreadySelected}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
                          isAlreadySelected
                            ? "text-gray-400 cursor-not-allowed bg-gray-50"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Zap className="w-3 h-3 text-purple-600" />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-gray-400">
                  {tagAddSearchTerm ? "No tags found" : "No tags available"}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <ImportExportModal
          isOpen={showImportExportModal}
          mode={importExportMode}
          entityType="companies"
          onClose={() => {
            //
            setShowImportExportModal(false);
          }}
          onSuccess={() => {
            //
            setShowImportExportModal(false);
            // Refresh the companies list
            const fetchCompanies = async () => {
              if (!user || !selectedOrganization || !selectedWorkspace) return;

              setLoading(true);
              try {
                const token = getLocalStorage("crm_access_token");
                if (!token) return;

                const response = await companyService.getCompanies(
                  String(selectedWorkspace.id),
                  String(selectedOrganization.id),
                  token
                );

                if (response.success && response.data) {
                  const convertedCompanies = response.data.map(company => ({
                    ...company,
                    tags: company.tags || [],
                  }));
                  setCompanies(convertedCompanies);
                }
              } catch {
                // Silent error handling
              } finally {
                setLoading(false);
              }
            };
            fetchCompanies();
          }}
        />
      )}
    </div>
  );
};

export default CompaniesTable;
