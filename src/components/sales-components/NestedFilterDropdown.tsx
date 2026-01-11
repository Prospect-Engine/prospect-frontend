import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  Filter,
  X,
  Target,
  Users,
  Zap,
  Tag,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Search,
  Clock,
  Building2,
  CheckCircle,
  XCircle,
  MinusCircle,
  Eye,
  Thermometer,
} from "lucide-react";
import { FilterState } from "../../types/sales-types";

interface NestedFilterDropdownProps {
  filters: FilterState;
  onUpdateFilters: (filters: FilterState) => void;
  entityType: "leads" | "companies" | "deals" | "tasks";
  // Real data from API responses
  availableTags?: string[];
  availableOwners?: string[];
  availableStatuses?: string[];
  availablePriorities?: string[];
  availableAssignees?: string[];
  availableContacts?: string[];
  availableCompanies?: string[];
  availableIndustries?: string[];
  availableSources?: string[];
  availableLeadTypes?: string[];
  availableLeadScores?: number[];
  availableCompanySizes?: string[];
  availableRevenues?: string[];
  availableDealValues?: number[];
  availableProbabilities?: number[];
  availableTaskStatuses?: string[];
  availableTaskPriorities?: string[];
  availableDueDates?: string[];
}

interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
  subOptions?: FilterOption[];
}

const NestedFilterDropdown: React.FC<NestedFilterDropdownProps> = ({
  filters,
  onUpdateFilters,
  entityType,
  availableTags = [],
  availableOwners = [],
  availableStatuses = [],
  availablePriorities = [],
  availableAssignees = [],
  availableContacts = [],
  availableCompanies = [],
  availableIndustries = [],
  availableSources = [],
  availableLeadTypes = [],
  availableLeadScores = [],
  availableCompanySizes = [],
  availableRevenues = [],
  availableDealValues = [],
  availableProbabilities = [],
  availableTaskStatuses = [],
  availableTaskPriorities = [],
  availableDueDates = [],
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [openAlignRight, setOpenAlignRight] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = (filters[key] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    onUpdateFilters({ ...filters, [key]: newArray });
  };

  const getFilterCount = (key: keyof FilterState) => {
    return (filters[key] as string[])?.length || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "inactive":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "prospect":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "customer":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "lost":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "won":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "dead":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "lead":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "engaged":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "interested":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "warm":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "closed":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "hot":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "warm":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "cold":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
    }
  };

  const getConnectionColor = (connection: string) => {
    switch (connection.toLowerCase()) {
      case "good":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      case "none":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600";
    }
  };

  // Entity-specific filter configurations
  const getFilterOptions = (): Record<string, FilterOption[]> => {
    const baseOptions = {
      status: availableStatuses.map(status => {
        let icon;

        switch (status.toLowerCase()) {
          case "active":
            icon = (
              <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "inactive":
            icon = <MinusCircle className="w-3 h-3 text-gray-500" />;
            break;
          case "prospect":
            icon = (
              <Target className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "customer":
            icon = (
              <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "lost":
            icon = (
              <XCircle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "won":
            icon = (
              <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "dead":
            icon = <MinusCircle className="w-3 h-3 text-gray-500" />;
            break;
          case "lead":
            icon = (
              <Target className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "engaged":
            icon = (
              <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "interested":
            icon = <Eye className="w-3 h-3 text-indigo-600" />;
            break;
          case "warm":
            icon = (
              <Thermometer className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
            break;
          case "closed":
            icon = <MinusCircle className="w-3 h-3 text-gray-500" />;
            break;
          default:
            icon = (
              <Target className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            );
        }

        return {
          value: status,
          label:
            status === "IN_PROGRESS"
              ? "In Progress"
              : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
          color: getStatusColor(status),
          icon: icon,
        };
      }),
      owner: [...new Set(availableOwners)].map(owner => ({
        value: owner,
        label: owner,
        color:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
        icon: <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      tags: [...new Set(availableTags)].map(tag => ({
        value: tag,
        label: tag,
        color:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
        icon: <Zap className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      priority: availablePriorities.map(priority => ({
        value: priority,
        label:
          priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase(),
        color: getPriorityColor(priority.toLowerCase()),
        icon: <Star className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      assignee: availableAssignees.map(assignee => ({
        value: assignee,
        label: assignee,
        color:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
        icon: <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      contact: availableContacts.map(contact => ({
        value: contact,
        label: contact,
        color:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
        icon: <Users className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      company: availableCompanies.map(company => ({
        value: company,
        label: company,
        color:
          "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
        icon: <Target className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
      })),
      dateRange: [
        {
          value: "today",
          label: "Today",
          icon: (
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ),
        },
        {
          value: "yesterday",
          label: "Yesterday",
          icon: <Clock className="w-3 h-3 text-gray-600" />,
        },
        {
          value: "this_week",
          label: "This Week",
          icon: (
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ),
        },
        {
          value: "last_week",
          label: "Last Week",
          icon: (
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ),
        },
        {
          value: "this_month",
          label: "This Month",
          icon: (
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ),
        },
        {
          value: "last_month",
          label: "Last Month",
          icon: (
            <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
          ),
        },
        {
          value: "custom",
          label: "Custom Range",
          icon: <Calendar className="w-3 h-3 text-indigo-600" />,
        },
      ],
    };

    // Entity-specific options
    switch (entityType) {
      case "leads":
        return {
          ...baseOptions,
          industry: availableIndustries.map(industry => ({
            value: industry,
            label: industry,
            color: "bg-indigo-100 text-indigo-800 border-indigo-300",
            icon: <Building2 className="w-3 h-3 text-indigo-600" />,
          })),
          source: availableSources.map(source => ({
            value: source,
            label: source,
            color: "bg-cyan-100 text-cyan-800 border-cyan-300",
            icon: <Target className="w-3 h-3 text-cyan-600" />,
          })),
          leadType: availableLeadTypes.map(leadType => ({
            value: leadType,
            label:
              leadType.charAt(0).toUpperCase() +
              leadType.slice(1).toLowerCase(),
            color: getPriorityColor(leadType.toLowerCase()),
            icon: (
              <Thermometer className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          leadScore: availableLeadScores.map(score => ({
            value: score.toString(),
            label: `Score ${score}`,
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          connection: [
            {
              value: "good",
              label: "Good",
              color: getConnectionColor("good"),
              icon: (
                <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
            {
              value: "none",
              label: "None",
              color: getConnectionColor("none"),
              icon: <Zap className="w-3 h-3 text-gray-500" />,
            },
          ],
        };

      case "companies":
        return {
          ...baseOptions,
          industry: availableIndustries.map(industry => ({
            value: industry,
            label: industry,
            color: "bg-indigo-100 text-indigo-800 border-indigo-300",
            icon: <Building2 className="w-3 h-3 text-indigo-600" />,
          })),
          source: availableSources.map(source => ({
            value: source,
            label: source,
            color: "bg-cyan-100 text-cyan-800 border-cyan-300",
            icon: <Target className="w-3 h-3 text-cyan-600" />,
          })),
          size: availableCompanySizes.map(size => ({
            value: size,
            label: size.charAt(0).toUpperCase() + size.slice(1).toLowerCase(),
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <Building2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          revenue: availableRevenues.map(revenue => ({
            value: revenue,
            label: revenue,
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          leadScore: availableLeadScores.map(score => ({
            value: score.toString(),
            label: `Score ${score}`,
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
        };

      case "deals":
        return {
          ...baseOptions,
          valueRange: [
            {
              value: "under_1k",
              label: "Under $1K",
              icon: (
                <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
            {
              value: "1k_5k",
              label: "$1K - $5K",
              icon: (
                <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
            {
              value: "5k_10k",
              label: "$5K - $10K",
              icon: (
                <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
            {
              value: "10k_25k",
              label: "$10K - $25K",
              icon: (
                <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
            {
              value: "25k_plus",
              label: "$25K+",
              icon: (
                <DollarSign className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              ),
            },
          ],
          probability: availableProbabilities.map(prob => ({
            value: prob.toString(),
            label: `${prob}%`,
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <TrendingUp className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          expectedCloseDate: availableDueDates.map(date => ({
            value: date,
            label: new Date(date).toLocaleDateString(),
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
        };

      case "tasks":
        return {
          ...baseOptions,
          taskStatus: availableTaskStatuses.map(status => ({
            value: status,
            label:
              status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
            color: getStatusColor(status),
            icon: (
              <CheckCircle className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
          taskPriority: availableTaskPriorities.map(priority => ({
            value: priority,
            label:
              priority.charAt(0).toUpperCase() +
              priority.slice(1).toLowerCase(),
            color: getPriorityColor(priority.toLowerCase()),
            icon: <Star className="w-3 h-3 text-gray-600 dark:text-gray-400" />,
          })),
          dueDate: availableDueDates.map(date => ({
            value: date,
            label: new Date(date).toLocaleDateString(),
            color:
              "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600",
            icon: (
              <Calendar className="w-3 h-3 text-gray-600 dark:text-gray-400" />
            ),
          })),
        };

      default:
        return baseOptions;
    }
  };

  const filterOptions = getFilterOptions();

  const handleDateRangeSelect = (value: string) => {
    // Check if this value is already selected (like value range)
    const isCurrentlySelected =
      filters.dateRange && filters.dateRange.selectedOption === value;

    const newFilters = {
      ...filters,
      dateRange: isCurrentlySelected ? {} : { selectedOption: value }, // Toggle: clear if selected, set if not
    };

    onUpdateFilters(newFilters);
  };

  const handleValueRangeSelect = (value: string) => {
    // Check if this value is already selected
    const isCurrentlySelected =
      filters.valueRange && filters.valueRange.includes(value);

    const newFilters = {
      ...filters,
      valueRange: isCurrentlySelected ? [] : [value], // Toggle: clear if selected, set if not
    };

    onUpdateFilters(newFilters);
  };

  const clearFilter = (key: keyof FilterState) => {
    onUpdateFilters({
      ...filters,
      [key]: key === "dateRange" ? {} : [],
    });
  };

  const clearAllFilters = () => {
    const baseFilters = {
      search: filters.search,
      status: [],
      tags: [],
      owner: [],
      priority: [],
      dateRange: {},
    };

    // Add entity-specific filters to clear
    switch (entityType) {
      case "leads":
        onUpdateFilters({
          ...baseFilters,
          connection: [],
          industry: [],
          source: [],
          leadType: [],
          leadScore: [],
        });
        break;
      case "companies":
        onUpdateFilters({
          ...baseFilters,
          industry: [],
          source: [],
          size: [],
          revenue: [],
          leadScore: [],
        });
        break;
      case "deals":
        onUpdateFilters({
          ...baseFilters,
          valueRange: [],
          probability: [],
          expectedCloseDate: [],
          contact: [],
          company: [],
        });
        break;
      case "tasks":
        onUpdateFilters({
          ...baseFilters,
          assignee: [],
          contact: [],
          company: [],
          taskStatus: [],
          taskPriority: [],
          dueDate: [],
        });
        break;
      default:
        onUpdateFilters(baseFilters);
    }
  };

  const filterOptionsBySearch = (
    options: FilterOption[],
    searchTerm: string
  ): FilterOption[] => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(
      option =>
        option.label.toLowerCase().includes(term) ||
        option.value.toLowerCase().includes(term)
    );
  };

  const renderDropdown = (filterKey: string, options: FilterOption[]) => {
    const isOpen = openDropdown === filterKey;
    const count = getFilterCount(filterKey as keyof FilterState);

    // Handle different filter types
    const isDateRange = filterKey === "dateRange";
    const isValueRange = filterKey === "valueRange";
    const selectedValues =
      isDateRange || isValueRange
        ? [] // Date and value ranges don't use array selection
        : (filters[filterKey as keyof FilterState] as string[]) || [];

    // Helper function to check if a date range option is selected
    const isDateRangeSelected = (optionValue: string) => {
      return (
        filters.dateRange && filters.dateRange.selectedOption === optionValue
      );
    };

    // Helper function to check if a value range option is selected
    const isValueRangeSelected = (optionValue: string) => {
      return filters.valueRange && filters.valueRange.includes(optionValue);
    };

    return (
      <div
        className="relative"
        key={filterKey}
        ref={el => {
          triggerRefs.current[filterKey] = el;
        }}
      >
        <button
          onClick={() => {
            if (isOpen) {
              setOpenDropdown(null);
              // Clear search term when closing dropdown
              setSearchTerms(prev => ({ ...prev, [filterKey]: "" }));
            } else {
              const el = triggerRefs.current[filterKey];
              if (el) {
                const rect = el.getBoundingClientRect();
                const menuWidth = 256; // Tailwind w-64
                const padding = 8; // viewport padding
                const overflowRight =
                  rect.left + menuWidth > window.innerWidth - padding;
                setOpenAlignRight(overflowRight);
              }
              setOpenDropdown(filterKey);
            }
          }}
          className={`flex items-center px-3 py-1.5 space-x-2 text-xs font-medium rounded-full border-2 transition-all duration-200 ${
            count > 0
              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 shadow-md scale-105"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          }`}
        >
          <Filter className="w-3 h-3" />
          <span className="capitalize">
            {filterKey.replace(/([A-Z])/g, " $1").trim()}
          </span>
          {count > 0 && (
            <span className="bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded-full text-xs font-semibold">
              {count}
            </span>
          )}
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute ${openAlignRight ? "right-0" : "left-0"} top-full z-50 mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg`}
          >
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {filterKey.replace(/([A-Z])/g, " $1").trim()}
                </span>
                {count > 0 && (
                  <button
                    onClick={() => clearFilter(filterKey as keyof FilterState)}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${filterKey
                    .replace(/([A-Z])/g, " $1")
                    .trim()
                    .toLowerCase()}...`}
                  value={searchTerms[filterKey] || ""}
                  onChange={e =>
                    setSearchTerms(prev => ({
                      ...prev,
                      [filterKey]: e.target.value,
                    }))
                  }
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto max-h-48">
              {(() => {
                const filteredOptions = filterOptionsBySearch(
                  options,
                  searchTerms[filterKey] || ""
                );
                if (filteredOptions.length === 0) {
                  return (
                    <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
                      No{" "}
                      {filterKey
                        .replace(/([A-Z])/g, " $1")
                        .trim()
                        .toLowerCase()}{" "}
                      found
                    </div>
                  );
                }
                return filteredOptions.map(option => (
                  <div key={option.value} className="relative">
                    <button
                      onClick={() => {
                        if (filterKey === "dateRange") {
                          handleDateRangeSelect(option.value);
                        } else if (filterKey === "valueRange") {
                          handleValueRangeSelect(option.value);
                        } else {
                          toggleArrayFilter(
                            filterKey as keyof FilterState,
                            option.value
                          );
                        }
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                        isDateRange
                          ? isDateRangeSelected(option.value)
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 dark:text-gray-300"
                          : isValueRange
                            ? isValueRangeSelected(option.value)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 dark:text-gray-300"
                            : selectedValues.includes(option.value)
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {option.icon}
                        <span>{option.label}</span>
                        {isDateRange
                          ? isDateRangeSelected(option.value) && (
                              <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                            )
                          : isValueRange
                            ? isValueRangeSelected(option.value) && (
                                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                              )
                            : selectedValues.includes(option.value) && (
                                <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                              )}
                      </div>
                    </button>

                    {/* Sub-options for nested filters */}
                    {option.subOptions && (
                      <div className="ml-4 border-l border-gray-200 dark:border-gray-700">
                        {option.subOptions.map(subOption => (
                          <button
                            key={subOption.value}
                            onClick={() =>
                              toggleArrayFilter(
                                filterKey as keyof FilterState,
                                subOption.value
                              )
                            }
                            className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ${
                              selectedValues.includes(subOption.value)
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {subOption.icon}
                              <span>{subOption.label}</span>
                              {selectedValues.includes(subOption.value) && (
                                <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    if (key === "search") return false;
    if (key === "dateRange") return Object.keys(filters.dateRange).length > 0;

    const value = filters[key as keyof FilterState];
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return false;
  });

  return (
    <div ref={dropdownRef} className="flex items-center space-x-2">
      {/* Common Filters */}
      {filterOptions.status.length > 0 &&
        renderDropdown("status", filterOptions.status)}
      {filterOptions.owner.length > 0 &&
        renderDropdown("owner", filterOptions.owner)}
      {filterOptions.tags.length > 0 &&
        renderDropdown("tags", filterOptions.tags)}
      {filterOptions.priority.length > 0 &&
        renderDropdown("priority", filterOptions.priority)}

      {/* Entity-specific filters */}
      {entityType === "leads" && (
        <>
          {filterOptions.industry?.length > 0 &&
            renderDropdown("industry", filterOptions.industry)}
          {filterOptions.source?.length > 0 &&
            renderDropdown("source", filterOptions.source)}
          {filterOptions.leadType?.length > 0 &&
            renderDropdown("leadType", filterOptions.leadType)}
          {filterOptions.leadScore?.length > 0 &&
            renderDropdown("leadScore", filterOptions.leadScore)}
          {/* Connection filter is not required for leads */}
        </>
      )}

      {entityType === "companies" && (
        <>
          {filterOptions.industry?.length > 0 &&
            renderDropdown("industry", filterOptions.industry)}
          {filterOptions.source?.length > 0 &&
            renderDropdown("source", filterOptions.source)}
          {filterOptions.size?.length > 0 &&
            renderDropdown("size", filterOptions.size)}
          {/* {filterOptions.revenue?.length > 0 &&
            renderDropdown('revenue', filterOptions.revenue)} */}
          {/* {filterOptions.leadScore?.length > 0 &&
            renderDropdown('leadScore', filterOptions.leadScore)} */}
        </>
      )}

      {entityType === "deals" && (
        <>
          {filterOptions.valueRange?.length > 0 &&
            renderDropdown("valueRange", filterOptions.valueRange)}
          {filterOptions.probability?.length > 0 &&
            renderDropdown("probability", filterOptions.probability)}
          {filterOptions.expectedCloseDate?.length > 0 &&
            renderDropdown(
              "expectedCloseDate",
              filterOptions.expectedCloseDate
            )}
          {filterOptions.contact?.length > 0 &&
            renderDropdown("contact", filterOptions.contact)}
          {filterOptions.company?.length > 0 &&
            renderDropdown("company", filterOptions.company)}
        </>
      )}

      {entityType === "tasks" && (
        <>
          {filterOptions.taskStatus?.length > 0 &&
            renderDropdown("taskStatus", filterOptions.taskStatus)}
          {filterOptions.taskPriority?.length > 0 &&
            renderDropdown("taskPriority", filterOptions.taskPriority)}
          {filterOptions.assignee?.length > 0 &&
            renderDropdown("assignee", filterOptions.assignee)}
          {filterOptions.contact?.length > 0 &&
            renderDropdown("contact", filterOptions.contact)}
          {filterOptions.company?.length > 0 &&
            renderDropdown("company", filterOptions.company)}
          {filterOptions.dueDate?.length > 0 &&
            renderDropdown("dueDate", filterOptions.dueDate)}
        </>
      )}

      {/* Date Range Filter - exclude for leads and companies */}
      {/* {entityType !== 'leads' &&
        entityType !== 'companies' &&
        renderDropdown('dateRange', filterOptions.dateRange)} */}

      {/* Clear All Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="flex items-center px-2 py-1.5 space-x-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
        >
          <X className="w-3 h-3" />
          <span>Clear All</span>
        </button>
      )}
    </div>
  );
};

export default NestedFilterDropdown;
