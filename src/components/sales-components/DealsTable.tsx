import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  X,
  Settings,
  ArrowUpDown,
  DollarSign,
  AlertCircle,
  Download,
  Upload,
  Building2,
  Calendar,
  User,
  Trash2,
} from "lucide-react";

import { Deal, FilterState } from "../../types/sales-types";
import DealDetailPanel from "./DealDetailPanel";
import ColumnSelector from "./ColumnSelector";
import NestedFilterDropdown from "./NestedFilterDropdown";
import ImportExportModal from "./ImportExportModal";
import SearchSuggestions from "./SearchSuggestions";
import { useSearchSuggestions } from "../../hooks/sales-hooks/useSearchSuggestions";
import dealService from "../../services/sales-services/dealService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCountsContext } from "../../contexts/sales-contexts/CountsContext";
import {
  getLocalStorage,
  setLocalStorage,
} from "../../utils/sales-utils/storage";

// Type for deal table column keys
type DealColumnKey =
  | keyof Deal
  | "checkbox"
  | "actions"
  | "lastInteraction"
  | "website"
  | "location"
  | "revenue"
  | "employees"
  | "company"
  | "contact"
  | "owner"
  | "value"
  | "probability"
  | "expectedCloseDate"
  | "actualCloseDate";

// Extend TableColumn interface for Deal-specific usage
interface DealTableColumn {
  key: DealColumnKey;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

const DealsTable: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<"import" | "export">(
    "import"
  );
  const [tagPopupData, setTagPopupData] = useState<{
    dealId: string;
    tags: string[];
    position: { x: number; y: number };
  } | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const [maxScrollPosition, setMaxScrollPosition] = useState(0);
  const [tableRef, setTableRef] = useState<HTMLDivElement | null>(null);

  const { decrementCount } = useCountsContext();

  // Fetch deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      if (!user || !selectedOrganization || !selectedWorkspace) return;

      try {
        setLoading(true);
        setError(null);

        const token = getLocalStorage("crm_access_token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const workspaceId = selectedWorkspace?.id;
        const organizationId = selectedOrganization?.id;

        if (!workspaceId || !organizationId) {
          setError("Workspace or organization not found");
          return;
        }

        const response = await dealService.getDeals(
          workspaceId,
          organizationId,
          token
        );

        if (response.success && response.data) {
          setDeals(response.data);
        } else {
          setError(response.error || "Failed to fetch deals");
        }
      } catch (err) {
        setError("Failed to fetch deals");
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, [user, selectedOrganization, selectedWorkspace]);

  // Close tag popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagPopupData && !(event.target as Element).closest(".tag-popup")) {
        setTagPopupData(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [tagPopupData]);

  const handleCreateDeal = async (dealData: Partial<Deal>) => {
    if (!user || !selectedOrganization || !selectedWorkspace) return;

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const response = await dealService.createDeal(
        workspaceId,
        organizationId,
        dealData,
        token
      );

      if (response.success && response.data) {
        setDeals(prev => [response.data!, ...prev]);
        setShowAddForm(false);
      } else {
        setError(response.error || "Failed to create deal");
      }
    } catch (err) {
      setError("Failed to create deal");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return;

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const workspaceId = selectedWorkspace?.id;
      const organizationId = selectedOrganization?.id;

      // Validate that all selected deals exist
      const invalidDealIds = selectedDeals.filter(
        dealId => !deals.find(deal => deal.id === dealId)
      );

      if (invalidDealIds.length > 0) {
        setError("Some selected deals no longer exist");
        return;
      }

      if (!workspaceId || !organizationId) {
        setError("Workspace or organization not found");
        return;
      }

      const response = await dealService.bulkDeleteDeals(
        selectedDeals,
        workspaceId,
        organizationId,
        token
      );

      if (response.success) {
        // Update counts for deleted deals
        selectedDeals.forEach(dealId => {
          const deletedDeal = deals.find(d => d.id === dealId);
          if (deletedDeal) {
            decrementCount("deals", "total");
            if (deletedDeal.status === "OPEN") {
              decrementCount("deals", "open");
            } else if (deletedDeal.status === "WON") {
              decrementCount("deals", "won");
            } else if (deletedDeal.status === "LOST") {
              decrementCount("deals", "lost");
            } else if (deletedDeal.status === "PAUSED") {
              decrementCount("deals", "paused");
            }
          }
        });

        // Remove deleted deals from the list
        setDeals(prev => prev.filter(deal => !selectedDeals.includes(deal.id)));
        setSelectedDeals([]);
        setShowBulkDeleteModal(false);
      } else {
        setError(response.error || "Failed to delete deals");
      }
    } catch (err) {
      setError("Failed to delete deals");
    }
  };

  // Table columns configuration
  const [columns, setColumns] = useState<DealTableColumn[]>(() => {
    // Load saved column configuration from localStorage
    const savedColumns = getLocalStorage("dealsTableColumns");
    if (savedColumns) {
      try {
        return JSON.parse(savedColumns);
      } catch (error) {}
    }

    // Default column configuration
    return [
      {
        key: "checkbox",
        label: "",
        sortable: false,
        visible: true,
        width: "50px",
      },
      {
        key: "title",
        label: "Title",
        sortable: true,
        visible: true,
        width: "300px",
      },
      {
        key: "company",
        label: "Company",
        sortable: true,
        visible: true,
        width: "200px",
      },
      {
        key: "contact",
        label: "Contact",
        sortable: true,
        visible: true,
        width: "200px",
      },
      {
        key: "value",
        label: "Value",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "probability",
        label: "Probability",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "expectedCloseDate",
        label: "Expected Close",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "owner",
        label: "Owner",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "createdAt",
        label: "Created",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "actions",
        label: "Actions",
        sortable: false,
        visible: true,
        width: "100px",
      },
    ];
  });

  // Filter and sort state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    tags: [],
    owner: [],
    connection: [],
    valueRange: [],
    dateRange: {},
  });

  const [sort, setSort] = useState<{
    field: keyof Deal;
    direction: "asc" | "desc";
  }>({
    field: "createdAt",
    direction: "desc",
  });

  // Search suggestions
  const searchSuggestions = useSearchSuggestions(
    filters.search,
    deals,
    "deals"
  );

  // Extract real data from deals for filters
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    deals.forEach(deal => {
      deal.tags?.forEach(tag => {
        if (typeof tag === "string") {
          tagSet.add(tag);
        } else if (tag && typeof tag === "object" && tag.name) {
          tagSet.add(tag.name);
        }
      });
    });
    return Array.from(tagSet).sort();
  }, [deals]);

  const availableOwners = useMemo(() => {
    const ownerSet = new Set<string>();
    deals.forEach(deal => {
      if (deal.owner?.name) {
        ownerSet.add(deal.owner.name);
      }
    });
    return Array.from(ownerSet).sort();
  }, [deals]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    deals.forEach(deal => {
      if (deal.status) {
        statusSet.add(deal.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [deals]);

  const availableContacts = useMemo(() => {
    const contactSet = new Set<string>();
    deals.forEach(deal => {
      if (deal.contact?.name) {
        contactSet.add(deal.contact.name);
      }
    });
    return Array.from(contactSet).sort();
  }, [deals]);

  const availableCompanies = useMemo(() => {
    const companySet = new Set<string>();
    deals.forEach(deal => {
      if (deal.company?.name) {
        companySet.add(deal.company.name);
      }
    });
    return Array.from(companySet).sort();
  }, [deals]);

  const availableDealValues = useMemo(() => {
    const valueSet = new Set<number>();
    deals.forEach(deal => {
      if (deal.value !== undefined && deal.value !== null) {
        valueSet.add(deal.value);
      }
    });
    return Array.from(valueSet).sort((a, b) => a - b);
  }, [deals]);

  const availableProbabilities = useMemo(() => {
    const probSet = new Set<number>();
    deals.forEach(deal => {
      if (deal.probability !== undefined && deal.probability !== null) {
        probSet.add(deal.probability);
      }
    });
    return Array.from(probSet).sort((a, b) => a - b);
  }, [deals]);

  const availableDueDates = useMemo(() => {
    const dateSet = new Set<string>();
    deals.forEach(deal => {
      if (deal.expectedCloseDate) {
        dateSet.add(deal.expectedCloseDate);
      }
    });
    return Array.from(dateSet).sort();
  }, [deals]);

  const handleSort = (field: DealColumnKey) => {
    setSort(prev => ({
      field: field as keyof Deal,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectDeal = (dealId: string) => {
    setSelectedDeals(prev =>
      prev.includes(dealId)
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    setSelectedDeals(
      selectedDeals.length === paginatedDeals.length
        ? []
        : paginatedDeals.map(deal => deal.id)
    );
  };

  const handleSelectAllInTable = () => {
    setSelectedDeals(
      selectedDeals.length === filteredAndSortedDeals.length
        ? []
        : filteredAndSortedDeals.map(deal => deal.id)
    );
  };

  // Save columns configuration to localStorage
  const saveColumnsToStorage = (updatedColumns: DealTableColumn[]) => {
    try {
      setLocalStorage("dealsTableColumns", JSON.stringify(updatedColumns));
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

  const renderCellContent = (deal: Deal, column: DealTableColumn) => {
    switch (column.key) {
      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={selectedDeals.includes(deal.id)}
            onChange={() => handleSelectDeal(deal.id)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        );

      case "title":
        return (
          <div className="flex items-center">
            <div className="flex justify-center items-center mr-3 w-8 h-8 bg-blue-100 rounded-full">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {deal.title}
              </div>
              {deal.description && (
                <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400 truncate">
                  {deal.description}
                </div>
              )}
            </div>
          </div>
        );

      case "company":
        return deal.company ? (
          <div className="flex items-center">
            <Building2 className="mr-2 w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {deal.company.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "contact":
        return deal.contact ? (
          <div className="flex items-center">
            <User className="mr-2 w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {deal.contact.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "value":
        return deal.value ? (
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: deal.currency || "USD",
            }).format(deal.value)}
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "probability":
        return (
          <div className="flex items-center">
            <div className="mr-2 w-16 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${deal.probability || 0}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-900 dark:text-white">
              {deal.probability || 0}%
            </span>
          </div>
        );

      case "status": {
        const statusColors = {
          OPEN: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
          WON: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
          LOST: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
          PAUSED:
            "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
        };
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[deal.status]}`}
          >
            {deal.status}
          </span>
        );
      }

      case "expectedCloseDate":
        return deal.expectedCloseDate ? (
          <div className="flex items-center">
            <Calendar className="mr-2 w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {new Date(deal.expectedCloseDate).toLocaleDateString()}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "owner":
        return deal.owner ? (
          <div className="flex items-center">
            <User className="mr-2 w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {deal.owner.name}
            </span>
          </div>
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "createdAt":
        return (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(deal.createdAt).toLocaleDateString()}
          </span>
        );

      default:
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {deal[column.key as keyof Deal] as string}
          </span>
        );
    }
  };

  // Filter and sort deals
  const filteredAndSortedDeals = useMemo(() => {
    //
    const filtered = deals.filter(deal => {
      const matchesSearch =
        !filters.search ||
        deal.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        deal.description
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        deal.company?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        deal.contact?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        deal.owner?.name
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        deal.status?.toLowerCase().includes(filters.search.toLowerCase()) ||
        // Include tags
        deal.tags?.some(tag => {
          const tagName = typeof tag === "string" ? tag : tag.name;
          return tagName?.toLowerCase().includes(filters.search.toLowerCase());
        }) ||
        // Include value and probability as strings
        (deal.value && deal.value.toString().includes(filters.search)) ||
        (deal.probability &&
          deal.probability.toString().includes(filters.search));

      const matchesStatus =
        filters.status.length === 0 || filters.status.includes(deal.status);

      const matchesOwner =
        filters.owner.length === 0 ||
        (deal.owner?.name && filters.owner.includes(deal.owner.name));

      const matchesTags =
        filters.tags.length === 0 ||
        deal.tags?.some(tag => {
          const tagName = typeof tag === "string" ? tag : tag.name;
          return filters.tags.includes(tagName);
        });

      const matchesValueRange =
        !filters.valueRange ||
        filters.valueRange.length === 0 ||
        filters.valueRange.some(range => {
          if (!deal.value) return range === "no-value";
          // Convert to number in case it comes as string from API
          const value =
            typeof deal.value === "string"
              ? parseFloat(deal.value)
              : deal.value;
          let matches = false;
          switch (range) {
            case "under_1k":
              matches = value < 1000;
              break;
            case "1k_5k":
              matches = value >= 1000 && value < 5000;
              break;
            case "5k_10k":
              matches = value >= 5000 && value < 10000;
              break;
            case "10k_25k":
              matches = value >= 10000 && value < 25000;
              break;
            case "25k_plus":
              matches = value >= 25000;
              break;
            case "no-value":
              matches = false;
              break;
            default:
              matches = true;
              break;
          }
          if (filters.valueRange && filters.valueRange.length > 0) {
            //
          }
          return matches;
        });

      const matchesDateRange = (() => {
        // If no date range filter is set, include all deals
        if (!filters.dateRange.selectedOption) return true;

        // If deal has no expectedCloseDate, exclude it when date filter is applied
        if (!deal.expectedCloseDate) return false;

        const dealDate = new Date(deal.expectedCloseDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // End of today

        switch (filters.dateRange.selectedOption) {
          case "today": {
            const startOfToday = new Date(today);
            startOfToday.setHours(0, 0, 0, 0);
            return dealDate >= startOfToday && dealDate <= today;
          }

          case "yesterday": {
            const startOfYesterday = new Date(
              today.getTime() - 24 * 60 * 60 * 1000
            );
            startOfYesterday.setHours(0, 0, 0, 0);
            const endOfYesterday = new Date(startOfYesterday);
            endOfYesterday.setHours(23, 59, 59, 999);
            return dealDate >= startOfYesterday && dealDate <= endOfYesterday;
          }

          case "this_week": {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            return dealDate >= startOfWeek && dealDate <= today;
          }

          case "last_week": {
            const startOfLastWeek = new Date(today);
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
            startOfLastWeek.setHours(0, 0, 0, 0);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            endOfLastWeek.setHours(23, 59, 59, 999);
            return dealDate >= startOfLastWeek && dealDate <= endOfLastWeek;
          }

          case "this_month": {
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            return dealDate >= startOfMonth && dealDate <= today;
          }

          case "last_month": {
            const startOfLastMonth = new Date(
              today.getFullYear(),
              today.getMonth() - 1,
              1
            );
            const endOfLastMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              0
            );
            endOfLastMonth.setHours(23, 59, 59, 999);
            return dealDate >= startOfLastMonth && dealDate <= endOfLastMonth;
          }

          default:
            return true;
        }
      })();

      if (filters.dateRange.selectedOption) {
        //
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesOwner &&
        matchesTags &&
        matchesValueRange &&
        matchesDateRange
      );
    });

    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sort.direction === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [deals, filters, sort]);

  const totalPages = Math.ceil(filteredAndSortedDeals.length / pageSize);
  const paginatedDeals = filteredAndSortedDeals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const visibleColumns = useMemo(() => {
    const visible = columns.filter(col => col.visible);
    //
    return visible;
  }, [columns]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Deals
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Error loading deals
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Retry
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
              >
                <Plus className="mr-2 w-4 h-4" />
                Add Deal
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="px-6 py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 w-12 h-12 text-red-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Failed to load deals
            </h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {error}
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <p>Please check:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Your internet connection</li>
                <li>That the backend server is running</li>
                <li>That you have the correct permissions</li>
                <li>That the workspace and organization are selected</li>
              </ul>
            </div>
            <div className="mt-6 space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => setError(null)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Deals
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAndSortedDeals.length} deals found
              {selectedDeals.length > 0 &&
                ` (${selectedDeals.length} selected)`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                setImportExportMode("import");
                setShowImportExportModal(true);
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="mr-2 w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => {
                setImportExportMode("export");
                setShowImportExportModal(true);
              }}
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="mr-2 w-4 h-4" />
              Export
            </button>
            {selectedDeals.length > 0 && (
              <>
                <button
                  onClick={handleSelectAllInTable}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium leading-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    selectedDeals.length === filteredAndSortedDeals.length
                      ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 focus:ring-red-500 dark:focus:ring-red-400"
                      : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:ring-blue-500 dark:focus:ring-blue-400"
                  }`}
                >
                  {selectedDeals.length === filteredAndSortedDeals.length
                    ? `Unselect All (${filteredAndSortedDeals.length})`
                    : `Select All (${filteredAndSortedDeals.length})`}
                </button>
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white bg-red-600 rounded-md border border-transparent hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete Selected ({selectedDeals.length})
                </button>
              </>
            )}
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Deal
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          {/* Left: Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals..."
              value={filters.search}
              onChange={e => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="block py-2 pr-3 pl-10 w-full leading-5 text-gray-900 dark:text-white placeholder-gray-500 bg-white dark:bg-gray-800 dark:placeholder-gray-400 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
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
                    | "tag"
                    | "jobTitle";
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
              entityType="deals"
            />
          </div>
          {/* Right: Filters & Columns */}
          <div className="flex gap-3 items-center">
            <NestedFilterDropdown
              filters={filters}
              onUpdateFilters={setFilters}
              entityType="deals"
              availableTags={availableTags}
              availableOwners={availableOwners}
              availableStatuses={availableStatuses}
              availableContacts={availableContacts}
              availableCompanies={availableCompanies}
              availableDealValues={availableDealValues}
              availableProbabilities={availableProbabilities}
              availableDueDates={availableDueDates}
            />
            <button
              onClick={() => setShowColumnSelector(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="mr-2 w-4 h-4" />
              Columns
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.status.length > 0 ||
        filters.tags.length > 0 ||
        filters.owner.length > 0 ||
        (filters.valueRange?.length ?? 0) > 0 ||
        filters.dateRange.selectedOption) && (
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Active filters:
            </span>

            {/* Status filters */}
            {filters.status.map(status => (
              <span
                key={status}
                className="inline-flex items-center px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full"
              >
                Status:{" "}
                {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
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
                className="inline-flex items-center px-2 py-1 text-xs text-purple-800 bg-purple-100 rounded-full"
              >
                Tag: {tag}
                <button
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      tags: prev.tags.filter(t => t !== tag),
                    }))
                  }
                  className="ml-1 hover:text-purple-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Owner filters */}
            {filters.owner.map(owner => (
              <span
                key={owner}
                className="inline-flex items-center px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full"
              >
                Owner: {owner}
                <button
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      owner: prev.owner.filter(o => o !== owner),
                    }))
                  }
                  className="ml-1 hover:text-green-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Value Range filters */}
            {filters.valueRange?.map(range => {
              const rangeLabel =
                {
                  under_1k: "Under $1K",
                  "1k_5k": "$1K - $5K",
                  "5k_10k": "$5K - $10K",
                  "10k_25k": "$10K - $25K",
                  "25k_plus": "$25K+",
                  "no-value": "No Value Set",
                }[range] || range;

              return (
                <span
                  key={range}
                  className="inline-flex items-center px-2 py-1 text-xs text-orange-800 bg-orange-100 rounded-full"
                >
                  Value: {rangeLabel}
                  <button
                    onClick={() =>
                      setFilters(prev => ({
                        ...prev,
                        valueRange:
                          prev.valueRange?.filter(r => r !== range) ?? [],
                      }))
                    }
                    className="ml-1 hover:text-orange-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            {/* Date Range filters */}
            {filters.dateRange.selectedOption && (
              <span className="inline-flex items-center px-2 py-1 text-xs text-indigo-800 bg-indigo-100 rounded-full">
                Date:{" "}
                {(() => {
                  const dateLabels = {
                    today: "Today",
                    yesterday: "Yesterday",
                    this_week: "This Week",
                    last_week: "Last Week",
                    this_month: "This Month",
                    last_month: "Last Month",
                    custom: "Custom Range",
                  };
                  return (
                    dateLabels[
                      filters.dateRange
                        .selectedOption as keyof typeof dateLabels
                    ] || filters.dateRange.selectedOption
                  );
                })()}
                <button
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      dateRange: {},
                    }))
                  }
                  className="ml-1 hover:text-indigo-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All button */}
            <button
              onClick={() =>
                setFilters({
                  search: filters.search,
                  status: [],
                  tags: [],
                  owner: [],
                  valueRange: [],
                  dateRange: {},
                  connection: [],
                })
              }
              className="inline-flex items-center px-2 py-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
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
          Showing {paginatedDeals.length} of {filteredAndSortedDeals.length}{" "}
          deals
          {selectedDeals.length > 0 && ` (${selectedDeals.length} selected)`}
        </div>
        <div className="flex gap-4 items-center">
          {selectedDeals.length > 0 && (
            <>
              <button
                onClick={handleSelectAllInTable}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium leading-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedDeals.length === filteredAndSortedDeals.length
                    ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 focus:ring-red-500 dark:focus:ring-red-400"
                    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:ring-blue-500 dark:focus:ring-blue-400"
                }`}
              >
                {selectedDeals.length === filteredAndSortedDeals.length
                  ? `Unselect All (${filteredAndSortedDeals.length})`
                  : `Select All (${filteredAndSortedDeals.length})`}
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 transition-colors hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected ({selectedDeals.length})</span>
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
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
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
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronsRight className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
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
              tableScrollPosition >= maxScrollPosition && maxScrollPosition > 0
            }
            className={`p-2 rounded-full shadow-lg transition-all ${
              tableScrollPosition >= maxScrollPosition && maxScrollPosition > 0
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
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="sticky left-0 z-20 px-4 py-3 w-12 text-left align-top bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={
                      selectedDeals.length === paginatedDeals.length &&
                      paginatedDeals.length > 0
                    }
                    ref={input => {
                      if (input) {
                        input.indeterminate =
                          selectedDeals.length > 0 &&
                          selectedDeals.length < paginatedDeals.length;
                      }
                    }}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="sticky left-12 z-20 px-6 py-3 w-80 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase align-top bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-1">
                    <span>Title</span>
                    <button
                      onClick={() => handleSort("title")}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>
                </th>
                {visibleColumns
                  .filter(
                    col =>
                      col.key !== "title" &&
                      col.key !== "checkbox" &&
                      col.key !== "actions"
                  )
                  .map(column => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase align-top whitespace-nowrap border-b border-gray-200 dark:border-gray-700"
                      style={{ width: column.width }}
                      onClick={() =>
                        column.sortable &&
                        handleSort(column.key as DealColumnKey)
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.label}</span>
                        {column.sortable && (
                          <button
                            onClick={() =>
                              handleSort(column.key as DealColumnKey)
                            }
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <ArrowUpDown className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                <th className="sticky right-0 z-20 px-6 py-3 w-32 text-xs font-medium tracking-wider text-right text-gray-500 dark:text-gray-400 uppercase align-top whitespace-nowrap bg-white dark:bg-gray-800">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDeals.map((deal, idx) => (
                <tr
                  key={deal.id}
                  className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}`}
                  onClick={() => setSelectedDeal(deal)}
                >
                  {/* Selection column */}
                  <td className="sticky left-0 z-10 px-4 py-4 w-12 align-top bg-inherit">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={selectedDeals.includes(deal.id)}
                      onChange={() => handleSelectDeal(deal.id)}
                    />
                  </td>
                  {/* Title column */}
                  <td className="sticky left-12 z-10 px-6 py-4 w-80 align-top bg-inherit">
                    <div className="flex items-center space-x-2 w-full">
                      <div className="flex justify-center items-center mr-3 w-8 h-8 bg-blue-100 rounded-full">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {deal.title}
                        </div>
                        {deal.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {deal.description.length > 50
                              ? `${deal.description.substring(0, 50)}...`
                              : deal.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Other columns */}
                  {visibleColumns
                    .filter(
                      col =>
                        col.key !== "title" &&
                        col.key !== "checkbox" &&
                        col.key !== "actions"
                    )
                    .map(column => (
                      <td
                        key={column.key}
                        className="px-6 py-4 align-top whitespace-nowrap"
                      >
                        {renderCellContent(deal, column)}
                      </td>
                    ))}
                  {/* Actions column */}
                  <td className="sticky right-0 z-10 px-6 py-4 w-32 text-sm font-medium text-right align-top whitespace-nowrap bg-inherit">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedDeal(deal);
                        }}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="View details"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {filteredAndSortedDeals.length === 0 && !loading && (
        <div className="py-12 text-center">
          <DollarSign className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No deals found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filters.search ||
            filters.status.length > 0 ||
            filters.owner.length > 0
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first deal."}
          </p>
          {!filters.search &&
            filters.status.length === 0 &&
            filters.owner.length === 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
                >
                  <Plus className="mr-2 w-4 h-4" />
                  Add Deal
                </button>
              </div>
            )}
        </div>
      )}

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdate={updatedDeal => {
            setDeals(prev =>
              prev.map(deal =>
                deal.id === updatedDeal.id ? updatedDeal : deal
              )
            );
          }}
        />
      )}

      {/* Column Selector */}
      {showColumnSelector && (
        <ColumnSelector
          columns={columns}
          onClose={() => setShowColumnSelector(false)}
          onUpdateColumns={updatedColumns => {
            //
            setColumns(updatedColumns as DealTableColumn[]);
            saveColumnsToStorage(updatedColumns as DealTableColumn[]);
            setShowColumnSelector(false);
          }}
        />
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="overflow-y-auto fixed inset-0 z-50 w-full h-full bg-black/50">
          <div className="relative top-20 p-5 mx-auto w-96 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="mt-3 text-center">
              <AlertCircle className="mx-auto mb-4 w-12 h-12 text-red-500" />
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Delete Deals
              </h3>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Are you sure you want to delete {selectedDeals.length} deals?
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-300 dark:bg-gray-600 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete {selectedDeals.length} Deals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add New Deal
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
              Only the title field is required. All other fields are optional
              and can be updated later.
            </p>
            {error && (
              <div className="p-4 mb-4 bg-red-50 rounded-md border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();

                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const description = formData.get("description") as string;
                const value = formData.get("value") as string;
                const probability = formData.get("probability") as string;
                const expectedCloseDate = formData.get(
                  "expectedCloseDate"
                ) as string;

                if (!title.trim()) {
                  setError("Deal title is required.");
                  return;
                }

                const dealData: Partial<Deal> = {
                  title: title.trim(),
                  description: description.trim() || undefined,
                  value: value ? parseFloat(value) : undefined,
                  probability: probability ? parseInt(probability) : undefined,
                  expectedCloseDate: expectedCloseDate
                    ? new Date(expectedCloseDate).toISOString()
                    : undefined,
                  status: "OPEN" as const,
                  currency: "USD",
                };
                handleCreateDeal(dealData);
              }}
            >
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal title"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Value
                  </label>
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="0.01"
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Probability (%)
                  </label>
                  <input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Expected Close Date
                </label>
                <input
                  name="expectedCloseDate"
                  type="date"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
                >
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <ImportExportModal
          isOpen={showImportExportModal}
          onClose={() => {
            setShowImportExportModal(false);
            //
          }}
          mode={importExportMode}
          entityType="deals"
          onSuccess={() => {
            //
            // Refresh the deals list
            const fetchDeals = async () => {
              if (!user || !selectedOrganization || !selectedWorkspace) return;

              try {
                const token = getLocalStorage("crm_access_token");
                if (!token) return;

                const workspaceId = selectedWorkspace.id;
                const organizationId = selectedOrganization.id;

                const response = await dealService.getDeals(
                  workspaceId,
                  organizationId,
                  token
                );

                if (response.success && response.data) {
                  const convertedDeals = response.data.map(deal => ({
                    ...deal,
                    currency: deal.currency || "USD",
                    probability: deal.probability || 0,
                    status: deal.status || "OPEN",
                  }));
                  setDeals(convertedDeals);
                }
              } catch (err) {}
            };

            fetchDeals();
          }}
        />
      )}
    </div>
  );
};

export default DealsTable;
