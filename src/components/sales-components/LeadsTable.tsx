import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Search,
  X,
  Settings,
  DollarSign,
  Building,
  MapPin,
  AlertCircle,
  Download,
  Upload,
  User,
  MinusCircle,
  Target,
  Eye,
  Thermometer,
  XCircle,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Zap,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { CONTACT_STATUSES } from "../../services/sales-services/contactService";
import { Lead, FilterState, SortState, Contact } from "../../types/sales-types";
import SearchSuggestions from "./SearchSuggestions";
import { useSearchSuggestions } from "../../hooks/sales-hooks/useSearchSuggestions";
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

// Type for lead table column keys
type LeadColumnKey =
  | keyof Lead
  | "checkbox"
  | "actions"
  | "lastInteraction"
  | "website"
  | "location"
  | "revenue"
  | "employees"
  | "company"
  | "owner"
  | "connection"
  | "leadScore";

// Extend TableColumn interface for Lead-specific usage
interface LeadTableColumn {
  key: LeadColumnKey;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}
import LeadDetailPanel from "./LeadDetailPanel";
import ColumnSelector from "./ColumnSelector";
import NestedFilterDropdown from "./NestedFilterDropdown";
import ImportExportModal from "./ImportExportModal";
import contactService from "../../services/sales-services/contactService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCountsContext } from "../../contexts/sales-contexts/CountsContext";
import tagService from "../../services/sales-services/tagService";

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

const LeadsTable: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id;
  const organizationId = selectedOrganization?.id;
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("crm_access_token")
      : undefined;
  const [leads, setLeads] = useState<Contact[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Contact | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<"import" | "export">(
    "import"
  );
  const [tagPopupData, setTagPopupData] = useState<{
    leadId: string;
    tags: string[];
    position: { x: number; y: number };
  } | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [tagOptions, setTagOptions] = useState<
    Array<{ id?: string; name: string; color?: string }>
  >([]);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [statusDropdownData, setStatusDropdownData] = useState<{
    leadId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [tagAddDropdownData, setTagAddDropdownData] = useState<{
    leadId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [tagAddSearchTerm, setTagAddSearchTerm] = useState("");
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const [maxScrollPosition, setMaxScrollPosition] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showCreateContactModal, setShowCreateContactModal] = useState(false);

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
      if (!selectedWorkspace?.id || !selectedOrganization?.id) return;
      try {
        const token = getLocalStorage("crm_access_token");
        if (!token) return;

        const response = await tagService.getAllTags(
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (response.success && response.data) {
          setTagOptions(response.data);
        } else {
          setTagOptions([]);
        }
      } catch {
        setTagOptions([]);
      }
    };
    fetchTagOptions();
  }, [selectedWorkspace, selectedOrganization]);

  // Filter tag options based on search term
  const filteredTagOptions = useMemo(() => {
    if (!tagSearchTerm.trim()) return tagOptions;
    return tagOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
    );
  }, [tagOptions, tagSearchTerm]);

  // Filter status options based on search term
  const filteredStatusOptions = useMemo(() => {
    if (!statusSearchTerm.trim()) return CONTACT_STATUSES;
    return CONTACT_STATUSES.filter(status =>
      status.toLowerCase().includes(statusSearchTerm.toLowerCase())
    );
  }, [statusSearchTerm]);

  // Filter tag add options based on search term and exclude already selected tags
  const filteredTagAddOptions = useMemo(() => {
    if (!tagAddSearchTerm.trim()) return tagOptions;
    return tagOptions.filter(tag =>
      tag.name.toLowerCase().includes(tagAddSearchTerm.toLowerCase())
    );
  }, [tagOptions, tagAddSearchTerm]);

  // Get current lead tags for comparison
  const getCurrentLeadTags = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    return lead?.tags || [];
  };

  // Fetch contacts from API
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user || !selectedOrganization || !selectedWorkspace) return;

      setLoading(true);

      try {
        const token = getLocalStorage("crm_access_token");
        if (!token) {
          setError("No authentication token found");
          setLoading(false);
          return;
        }

        // Get workspace and organization IDs from context
        const workspaceId = selectedWorkspace.id;
        const organizationId = selectedOrganization.id;

        // Validate UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(workspaceId) || !uuidRegex.test(organizationId)) {
          setError("Invalid workspace or organization ID format");
          setLoading(false);
          return;
        }

        const response = await contactService.getContacts(
          workspaceId,
          organizationId,
          token
        );

        if (response.success && response.data) {
          // Convert contacts to proper format with tag names
          const convertedContacts = response.data.map(contact => ({
            ...contact,
            tags:
              contact.tags
                ?.map(tag => {
                  if (typeof tag === "string") {
                    return tag;
                  }
                  if (tag && typeof tag === "object") {
                    // Handle nested tag structure: tag.tag.name
                    if (tag.tag && (tag.tag as Record<string, unknown>).name) {
                      return (tag.tag as Record<string, unknown>)
                        .name as string;
                    }
                    // Handle direct tag structure: tag.name
                    if (tag.name) {
                      return tag.name;
                    }
                  }
                  return null;
                })
                .filter(tag => tag !== null) || [],
          }));

          setLeads(convertedContacts as unknown as Contact[]);
        } else {
          setError(response.error || "Failed to fetch contacts");
        }
      } catch (err) {
        setError("Failed to fetch contacts");
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
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

  // Extract real data from leads for filters
  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    leads.forEach(lead => {
      if (lead.tags && Array.isArray(lead.tags)) {
        lead.tags.forEach(tag => {
          if (tag && typeof tag === "string") {
            allTags.add(tag);
          }
        });
      }
    });
    const sortedTags = Array.from(allTags).sort();

    return sortedTags;
  }, [leads]);

  const availableOwners = useMemo(() => {
    const ownerSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.owner?.name) {
        ownerSet.add(lead.owner.name);
      }
    });
    return Array.from(ownerSet).sort();
  }, [leads]);

  const availableStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.status) {
        statusSet.add(lead.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [leads]);

  const availablePriorities = useMemo(() => {
    const prioritySet = new Set<string>();
    leads.forEach(lead => {
      if (lead.priority) {
        prioritySet.add(lead.priority);
      }
    });
    return Array.from(prioritySet).sort();
  }, [leads]);

  const availableIndustries = useMemo(() => {
    const industrySet = new Set<string>();
    leads.forEach(lead => {
      if (lead.industry) {
        industrySet.add(lead.industry);
      }
    });
    return Array.from(industrySet).sort();
  }, [leads]);

  const availableSources = useMemo(() => {
    const sourceSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.source) {
        sourceSet.add(lead.source);
      }
    });
    return Array.from(sourceSet).sort();
  }, [leads]);

  const availableLeadTypes = useMemo(() => {
    const leadTypeSet = new Set<string>();
    leads.forEach(lead => {
      if (lead.leadType) {
        leadTypeSet.add(lead.leadType);
      }
    });
    return Array.from(leadTypeSet).sort();
  }, [leads]);

  const availableLeadScores = useMemo(() => {
    const scoreSet = new Set<number>();
    leads.forEach(lead => {
      if (lead.leadScore !== undefined && lead.leadScore !== null) {
        scoreSet.add(lead.leadScore);
      }
    });
    return Array.from(scoreSet).sort((a, b) => a - b);
  }, [leads]);

  const handleCreateContact = async (contactData: Partial<Contact>) => {
    if (!selectedWorkspace || !selectedOrganization) {
      setError(
        "Please select a workspace and organization before creating a contact."
      );
      return;
    }

    try {
      const token = getLocalStorage("crm_access_token");
      if (!token) {
        setError("Authentication token not found. Please log in again.");
        return;
      }

      const response = await contactService.createContact(
        selectedWorkspace.id,
        selectedOrganization.id,
        contactData,
        token
      );

      if (response.success && response.data) {
        setLeads(prev => [response.data!, ...prev]);
        setShowCreateContactModal(false);
        setError(null);
        toastService.success("Contact created successfully");
      } else {
        toastService.error(response.error || "Failed to create contact");
        setError(response.error || "Failed to create contact");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create contact"
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeads.length === 0) return;

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

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      // Validate UUID format for contact IDs
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const invalidContactIds = Array.from(selectedLeads).filter(
        id => !uuidRegex.test(id)
      );
      if (invalidContactIds.length > 0) {
        setError(`Invalid contact ID format: ${invalidContactIds.join(", ")}`);
        return;
      }

      // Validate UUID format for workspace and organization
      if (!uuidRegex.test(workspaceId) || !uuidRegex.test(organizationId)) {
        setError("Invalid workspace or organization ID format");
        return;
      }

      const response = await contactService.bulkDeleteContacts(
        Array.from(selectedLeads),
        workspaceId,
        organizationId,
        token,
        force,
        deleteRelated
      );

      if (response.success) {
        // Update counts for deleted contacts
        selectedLeads.forEach(contactId => {
          const deletedContact = leads.find(c => c.id === contactId);
          if (deletedContact) {
            decrementCount("leads", "total");
            if (deletedContact.status === "ACTIVE") {
              decrementCount("leads", "customers");
            } else if (deletedContact.status === "INACTIVE") {
              decrementCount("leads", "prospects");
            }
            if (deletedContact.leadType === "HOT") {
              decrementCount("leads", "partnerships");
            } else if (deletedContact.leadType === "WARM") {
              decrementCount("leads", "network");
            }
          }
        });

        // Remove deleted leads from the list
        setLeads(prev => prev.filter(lead => !selectedLeads.includes(lead.id)));
        setSelectedLeads([]);
        setShowBulkDeleteModal(false);
      } else {
        setError(response.error || "Failed to delete contacts");
      }
    } catch (err) {
      setError("Failed to delete contacts");
    }
  };

  // Table columns configuration
  const [columns, setColumns] = useState<LeadTableColumn[]>(() => {
    // Load saved column configuration from localStorage
    const savedColumns = getLocalStorage("leadsTableColumns");
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
        key: "name",
        label: "Leads",
        sortable: true,
        visible: true,
        width: "250px",
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "tags",
        label: "Tags",
        sortable: false,
        visible: true,
        width: "150px",
      },
      {
        key: "actions",
        label: "Links",
        sortable: false,
        visible: true,
        width: "120px",
      },
      {
        key: "owner",
        label: "Owners",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "lastInteraction",
        label: "Last interaction",
        sortable: true,
        visible: true,
        width: "150px",
      },
      {
        key: "connection",
        label: "Connection",
        sortable: true,
        visible: true,
        width: "120px",
      },
      {
        key: "leadScore",
        label: "Lead",
        sortable: true,
        visible: true,
        width: "100px",
      },
      {
        key: "company",
        label: "Company",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "email",
        label: "Email",
        sortable: true,
        visible: false,
        width: "200px",
      },
      {
        key: "phone",
        label: "Phone",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "industry",
        label: "Industry",
        sortable: true,
        visible: false,
        width: "120px",
      },
      {
        key: "location",
        label: "Location",
        sortable: true,
        visible: false,
        width: "150px",
      },
      {
        key: "dealValue",
        label: "Deal Value",
        sortable: true,
        visible: false,
        width: "120px",
      },
      {
        key: "source",
        label: "Source",
        sortable: true,
        visible: false,
        width: "120px",
      },
      {
        key: "priority",
        label: "Priority",
        sortable: true,
        visible: false,
        width: "100px",
      },
      {
        key: "createdAt",
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
    leads,
    "leads"
  );

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    const filtered = leads.filter(lead => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableFields = [
          lead.name,
          lead.email,
          lead.company?.name,
          lead.jobTitle,
          lead.notes,
          lead.industry,
          lead.source,
          lead.leadType,
          lead.status,
          lead.owner?.name,
          // Include tags
          ...(lead.tags || []).map(tag => {
            if (typeof tag === "string") return tag;
            if (tag && typeof tag === "object") {
              if (tag.tag && (tag.tag as Record<string, unknown>).name)
                return (tag.tag as Record<string, unknown>).name as string;
              if (tag.name) return tag.name;
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
      if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
        return false;
      }

      // Tags filter
      if (
        filters.tags.length > 0 &&
        !filters.tags.some(tag =>
          (lead.tags || []).some(leadTag => {
            if (typeof leadTag === "string") {
              return leadTag === tag;
            }
            if (leadTag && typeof leadTag === "object") {
              if (
                leadTag.tag &&
                (leadTag.tag as Record<string, unknown>).name
              ) {
                return (
                  ((leadTag.tag as Record<string, unknown>).name as string) ===
                  tag
                );
              }
              if (leadTag.name) {
                return leadTag.name === tag;
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
        !filters.owner.includes(lead.owner?.name)
      ) {
        return false;
      }

      // Connection filter - use leadScore for connection
      if (
        (filters.connection?.length || 0) > 0 &&
        !filters.connection?.some(connection => {
          const isGoodConnection = lead.leadScore > 50;
          return (
            (connection === "good" && isGoodConnection) ||
            (connection === "none" && !isGoodConnection)
          );
        })
      ) {
        return false;
      }

      // Date range filter
      if (
        filters.dateRange.start &&
        new Date(lead.createdAt) < filters.dateRange.start
      ) {
        return false;
      }
      if (
        filters.dateRange.end &&
        new Date(lead.createdAt) > filters.dateRange.end
      ) {
        return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number | Date | undefined;
      let bValue: string | number | Date | undefined;

      // Handle different field types
      switch (sort.field) {
        case "name":
          aValue = a.name || "";
          bValue = b.name || "";
          break;
        case "email":
          aValue = a.email || "";
          bValue = b.email || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case "company":
          aValue = (a.company?.name as string) || "";
          bValue = (b.company?.name as string) || "";
          break;
        case "owner":
          aValue = a.owner?.name;
          bValue = b.owner?.name;
          break;
        default:
          aValue =
            (a[sort.field as keyof Contact] as string | number | Date) || "";
          bValue =
            (b[sort.field as keyof Contact] as string | number | Date) || "";
      }

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sort.direction === "desc" ? -comparison : comparison;
    });

    return filtered;
  }, [leads, filters, sort]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize);
  const paginatedLeads = filteredAndSortedLeads.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: keyof Lead) => {
    setSort(prev => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleSelectAll = () => {
    setSelectedLeads(
      selectedLeads.length === paginatedLeads.length
        ? []
        : paginatedLeads.map(lead => lead.id)
    );
  };

  const handleSelectAllInTable = () => {
    setSelectedLeads(
      selectedLeads.length === filteredAndSortedLeads.length
        ? []
        : filteredAndSortedLeads.map(lead => lead.id)
    );
  };

  // Save columns configuration to localStorage
  const saveColumnsToStorage = (updatedColumns: LeadTableColumn[]) => {
    try {
      setLocalStorage("leadsTableColumns", JSON.stringify(updatedColumns));
    } catch (error) {}
  };

  const scrollTableLeft = () => {
    if (tableRef.current) {
      const scrollAmount = 400; // Approximate width of 2 columns
      tableRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      setTableScrollPosition(Math.max(0, tableScrollPosition - scrollAmount));
    }
  };

  const scrollTableRight = () => {
    if (tableRef.current) {
      const scrollAmount = 400; // Approximate width of 2 columns
      tableRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
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

  const addTagToLead = async (leadId: string, tagName: string) => {
    if (!selectedWorkspace?.id || !selectedOrganization?.id) return;
    try {
      const tag = tagOptions.find(t => t.name === tagName);
      if (!tag || !tag.id) return;

      const token = getLocalStorage("crm_access_token");
      if (!token) return;

      const response = await tagService.assignTag(
        {
          tagId: tag.id,
          entityId: leadId,
          entityType: "contact",
          organizationId: selectedOrganization.id,
          workspaceId: selectedWorkspace.id,
        },
        token
      );
      if (response.success) {
        setLeads(prev =>
          prev.map(lead =>
            lead.id === leadId
              ? { ...lead, tags: [...(lead.tags || []), { name: tagName }] }
              : lead
          )
        );
        setTagAddDropdownData(null);
      }
    } catch {}
  };

  const updateContactStatus = async (
    contactId: string,
    status: Contact["status"]
  ) => {
    if (!selectedWorkspace?.id || !selectedOrganization?.id) return;

    try {
      // Optimistic update
      setLeads(prev =>
        prev.map(lead => (lead.id === contactId ? { ...lead, status } : lead))
      );

      const updatedContact = await contactService.updateStatus(
        contactId,
        selectedWorkspace.id,
        { status }
      );

      // Update with server response
      setLeads(prev =>
        prev.map(lead => (lead.id === contactId ? updatedContact : lead))
      );
    } catch (error) {
      // Revert optimistic update on error
      setLeads(prev =>
        prev.map(lead =>
          lead.id === contactId ? { ...lead, status: lead.status } : lead
        )
      );
    }
  };

  const getStatusBadge = (status: Lead["status"]) => {
    const statusConfig = {
      interested: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Interested",
      },
      engaged: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Engaged",
      },
      agency: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Agency",
      },
      startup: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Startup",
      },
      "scale-up": {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Scale Up",
      },
      good: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "Good",
      },
      none: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
        label: "None",
      },
    };

    const config = statusConfig[status] || statusConfig.none;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
      },
      medium: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
      },
      low: {
        bg: "bg-gray-100 dark:bg-gray-700",
        text: "text-gray-800 dark:text-gray-200",
      },
    };

    const config =
      priorityConfig[priority as keyof typeof priorityConfig] ||
      priorityConfig.low;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} capitalize`}
      >
        {priority}
      </span>
    );
  };

  const renderCellContent = (lead: Contact, column: LeadTableColumn) => {
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
                  leadId: lead.id,
                  position,
                });
                setStatusSearchTerm("");
              }}
              className="text-sm bg-transparent border-none transition-colors cursor-pointer focus:outline-none hover:text-blue-600 dark:hover:text-blue-400"
            >
              {lead.status ? (
                <span className="inline-flex gap-1 items-center px-2 py-1 text-xs font-medium rounded-full">
                  {getStatusIcon(lead.status)}
                  {lead.status.charAt(0).toUpperCase() +
                    lead.status.slice(1).toLowerCase()}
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
            {lead.tags && lead.tags.length > 0 ? (
              <div className="flex gap-1 items-center">
                {/* Show first 2 tags */}
                {lead.tags.slice(0, 2).map((tag, index) => {
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
                {lead.tags.length > 2 && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const position = calculateDropdownPosition(rect);
                      setTagPopupData({
                        leadId: lead.id,
                        tags: lead.tags.map(tag => {
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
                    +{lead.tags.length - 2}
                  </button>
                )}

                {/* Add tag button when there are existing tags */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    const position = calculateDropdownPosition(rect);
                    setTagAddDropdownData({
                      leadId: lead.id,
                      position,
                    });
                    setTagAddSearchTerm("");
                  }}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-full transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600"
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
                      leadId: lead.id,
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
              className={`p-1 rounded transition-colors ${lead.phoneNumber ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={lead.phoneNumber ? `Call ${lead.name}` : "No phone number"}
              onClick={e => {
                e.stopPropagation();
                if (lead.phoneNumber) {
                  window.open(`tel:${lead.phoneNumber}`, "_self");
                }
              }}
              disabled={!lead.phoneNumber}
            >
              <Phone
                className={`w-4 h-4 ${lead.phoneNumber ? "text-blue-600 hover:text-blue-700" : "text-gray-300"}`}
              />
            </button>
            <button
              className={`p-1 rounded transition-colors ${lead.email ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={lead.email ? `Email ${lead.name}` : "No email address"}
              onClick={e => {
                e.stopPropagation();
                if (lead.email) {
                  window.open(`mailto:${lead.email}`, "_self");
                }
              }}
              disabled={!lead.email}
            >
              <Mail
                className={`w-4 h-4 ${lead.email ? "text-green-600 hover:text-green-700" : "text-gray-300"}`}
              />
            </button>
            <button
              className={`p-1 rounded transition-colors ${lead.whatsappNumber ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                lead.whatsappNumber
                  ? `WhatsApp ${lead.name}`
                  : "No WhatsApp number"
              }
              onClick={e => {
                e.stopPropagation();
                if (lead.whatsappNumber) {
                  window.open(`https://wa.me/${lead.whatsappNumber}`, "_blank");
                }
              }}
              disabled={!lead.whatsappNumber}
            >
              <svg
                className={`w-4 h-4 ${lead.whatsappNumber ? "text-green-500 hover:text-green-600 dark:hover:text-green-400" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
            </button>
            <button
              className={`p-1 rounded transition-colors ${lead.linkedinUrl ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                lead.linkedinUrl
                  ? "View LinkedIn profile"
                  : "No LinkedIn profile"
              }
              onClick={e => {
                e.stopPropagation();
                if (lead.linkedinUrl) {
                  window.open(lead.linkedinUrl, "_blank");
                }
              }}
              disabled={!lead.linkedinUrl}
            >
              <svg
                className={`w-4 h-4 ${lead.linkedinUrl ? "text-blue-600 hover:text-blue-700" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </button>
            <button
              className={`p-1 rounded transition-colors ${lead.twitterUrl ? "hover:bg-gray-100" : "cursor-not-allowed"}`}
              title={
                lead.twitterUrl ? "View Twitter profile" : "No Twitter profile"
              }
              onClick={e => {
                e.stopPropagation();
                if (lead.twitterUrl) {
                  window.open(lead.twitterUrl, "_blank");
                }
              }}
              disabled={!lead.twitterUrl}
            >
              <svg
                className={`w-4 h-4 ${lead.twitterUrl ? "text-blue-400 hover:text-blue-500" : "text-gray-300"}`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 4.908 4.908 0 01-6.102 4.53 4.942 4.942 0 01-1.766-.07 6.979 6.979 0 005.3 2.5 9.96 9.96 0 01-6.1 2.1c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
            </button>
          </div>
        );

      case "owner":
        return (
          <div className="flex items-center space-x-2">
            <img
              src={
                lead.owner?.avatar ||
                "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=20&h=20&dpr=2"
              }
              alt="Owner"
              className="w-5 h-5 rounded-full"
            />
            <span className="text-sm text-gray-900 dark:text-white truncate">
              {lead.owner?.name || "Unassigned"}
            </span>
          </div>
        );

      case "lastInteraction":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {lead.lastContactedAt
              ? new Date(lead.lastContactedAt).toLocaleDateString()
              : "Never"}
          </span>
        );

      case "connection":
        return (
          <span
            className={`text-sm ${lead.leadScore > 50 ? "text-green-600" : "text-gray-500"}`}
          >
            {lead.leadScore > 50 ? "Good" : "None"}
          </span>
        );

      case "leadScore":
        return getStatusBadge(lead.status as Lead["status"]);

      case "company":
        return (
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {((lead.company as Record<string, unknown>)?.name as string) ||
                "-"}
            </span>
          </div>
        );

      case "email":
        return (
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {lead.email}
            </span>
          </div>
        );

      case "phone":
        return (
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">
              {lead.phoneNumber || "-"}
            </span>
          </div>
        );

      case "industry":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {lead.industry || "-"}
          </span>
        );

      case "location":
        return (
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">-</span>
          </div>
        );

      case "dealValue":
        return (
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-900 dark:text-white">-</span>
          </div>
        );

      case "source":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {lead.source || "-"}
          </span>
        );

      case "priority":
        return lead.priority ? (
          getPriorityBadge(lead.priority)
        ) : (
          <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
        );

      case "createdAt":
        return (
          <span className="text-sm text-gray-900 dark:text-white">
            {new Date(lead.createdAt).toLocaleDateString()}
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

  // Sort icon helper function
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
                  Add Lead
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
                            <div className="p-4 mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
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
                  Add Lead
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
                        You don&apos;t have permission to view leads in this
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
            className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Leads
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Manage your leads and contacts
            </CardDescription>
          </div>

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
            {selectedLeads.length > 0 && (
              <>
                <Button
                  onClick={handleSelectAllInTable}
                  variant="outline"
                  className={`rounded-xl ${
                    selectedLeads.length === filteredAndSortedLeads.length
                      ? "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                      : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  {selectedLeads.length === filteredAndSortedLeads.length
                    ? `Unselect All (${filteredAndSortedLeads.length})`
                    : `Select All (${filteredAndSortedLeads.length})`}
                </Button>
                <Button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete ({selectedLeads.length})
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowCreateContactModal(true)}
              className="bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-xl px-6 py-2 font-medium transition-all duration-200 hover:scale-105 shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </CardHeader>

        {/* Search and Filters */}
        <div className="px-6 pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <Input
                placeholder="Search leads..."
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
                entityType="leads"
              />
            </div>
            {/* Right: Filters */}
            <div className="flex items-center gap-3">
              <NestedFilterDropdown
                filters={filters}
                onUpdateFilters={setFilters}
                entityType="leads"
                availableTags={availableTags}
                availableOwners={availableOwners}
                availableStatuses={availableStatuses}
                availablePriorities={availablePriorities}
                availableIndustries={availableIndustries}
                availableSources={availableSources}
                availableLeadTypes={availableLeadTypes}
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
          <div className="px-6 py-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 rounded-xl mx-6 mb-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active filters:
              </span>
              {/* Status filters */}
              {filters.status.map(status => (
                <span
                  key={status}
                  className="inline-flex items-center px-2 py-1 text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full"
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
                    className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {/* Tag filters */}
              {filters.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full"
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
                  className="inline-flex items-center px-2 py-1 text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full"
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
                  className="inline-flex items-center px-2 py-1 text-xs text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full"
                >
                  Connection: {connection}
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

        <CardContent className="px-0">
          {/* Results Summary and Pagination Controls ABOVE the table */}
          <div className="flex flex-col gap-2 px-6 py-3 border-b border-gray-200/50 dark:border-gray-700/50 md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginatedLeads.length} of {filteredAndSortedLeads.length}{" "}
              leads
              {selectedLeads.length > 0 &&
                ` (${selectedLeads.length} selected)`}
            </div>
            <div className="flex gap-4 items-center">
              {selectedLeads.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAllInTable}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium leading-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedLeads.length === filteredAndSortedLeads.length
                        ? "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-red-500"
                        : "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 focus:ring-blue-500"
                    }`}
                  >
                    {selectedLeads.length === filteredAndSortedLeads.length
                      ? `Unselect All (${filteredAndSortedLeads.length})`
                      : `Select All (${filteredAndSortedLeads.length})`}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 transition-colors hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected ({selectedLeads.length})</span>
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
                    : "bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
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
                    : "bg-gray-900 dark:bg-gray-700 text-white hover:bg-gray-800 dark:hover:bg-gray-600"
                }`}
                title="Scroll right by 2 columns"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Table Container */}
            <div
              ref={tableRef}
              className="overflow-x-auto overflow-y-auto flex-1"
              onScroll={handleTableScroll}
            >
              <table className="w-full min-w-max">
                <thead>
                  <tr className="border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <th className="sticky left-0 z-20 px-4 py-3 w-12 text-left align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={
                          selectedLeads.length === paginatedLeads.length &&
                          paginatedLeads.length > 0
                        }
                        ref={input => {
                          if (input) {
                            input.indeterminate =
                              selectedLeads.length > 0 &&
                              selectedLeads.length < paginatedLeads.length;
                          }
                        }}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="sticky left-12 z-20 px-6 py-3 w-80 font-semibold text-gray-700 dark:text-gray-300 text-left align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors">
                      <div
                        className="flex items-center gap-2 uppercase text-xs tracking-wider"
                        onClick={() => handleSort("name" as keyof Lead)}
                      >
                        <span>Leads</span>
                        {getSortIcon("name")}
                      </div>
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
                          className="px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 text-left align-top whitespace-nowrap border-b border-gray-200/50 dark:border-gray-700/50 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors"
                          style={{ width: column.width }}
                          onClick={() =>
                            column.sortable &&
                            handleSort(column.key as keyof Lead)
                          }
                        >
                          <div className="flex items-center gap-2 uppercase text-xs tracking-wider">
                            <span>{column.label}</span>
                            {column.sortable && getSortIcon(column.key)}
                          </div>
                        </th>
                      ))}
                    <th className="sticky right-0 z-20 px-6 py-3 w-32 font-semibold text-gray-700 dark:text-gray-300 text-right align-top whitespace-nowrap bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 uppercase text-xs tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 dark:bg-gray-800/50">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 3}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Loading leads...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={visibleColumns.length + 3}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <div className="mx-auto mb-4 w-12 h-12 text-gray-400">
                            <User className="w-12 h-12" />
                          </div>
                          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            No leads found
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {selectedWorkspace && selectedWorkspace.id
                              ? "Get started by creating your first lead."
                              : "Please select a workspace to view leads."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead, idx) => (
                      <tr
                        key={lead.id}
                        className="border-gray-100/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors duration-200"
                      >
                        {/* Selection column */}
                        <td className="sticky left-0 z-10 px-4 py-4 w-12 align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => handleSelectLead(lead.id)}
                          />
                        </td>
                        {/* Name column */}
                        <td className="sticky left-12 z-10 px-6 py-4 w-80 align-top bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <div className="flex items-center space-x-2 w-full">
                            <div className="flex justify-center items-center mr-3 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => setSelectedLead(lead)}
                              >
                                {lead.name}
                              </div>
                              {lead.email && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {lead.email}
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
                              {renderCellContent(lead, column)}
                            </td>
                          ))}
                        {/* Actions column */}
                        <td className="sticky right-0 z-10 px-6 py-4 w-32 text-sm font-medium text-right align-top whitespace-nowrap bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl">
                          <div className="flex justify-end items-center space-x-2">
                            <button
                              onClick={() => setSelectedLead(lead)}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
            setColumns(updatedColumns as unknown as LeadTableColumn[]);
            saveColumnsToStorage(
              updatedColumns as unknown as LeadTableColumn[]
            );
            setShowColumnSelector(false);
          }}
        />
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={updatedLead => {
            setLeads(prev =>
              prev.map(lead =>
                lead.id === updatedLead.id ? updatedLead : lead
              )
            );
            setSelectedLead(updatedLead);
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showCreateContactModal &&
        ReactDOM.createPortal(
          <div
            className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out"
            onClick={() => {
              setShowCreateContactModal(false);
              setError(null);
            }}
          >
            <div
              className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add New Contact
                </h3>
                <button
                  onClick={() => {
                    setShowCreateContactModal(false);
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
                <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
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
                      "Please select a workspace before creating a contact."
                    );
                    return;
                  }

                  const formData = new FormData(e.currentTarget);
                  const name = formData.get("name") as string;

                  if (!name.trim()) {
                    setError("Contact name is required.");
                    return;
                  }

                  const contactData: Partial<Contact> = {
                    name: name.trim(),
                    workspaceId: selectedWorkspace.id,
                    leadType: "COLD",
                    status: "ACTIVE",
                    preferredChannel: "EMAIL",
                  };
                  handleCreateContact(contactData);
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
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="flex mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateContactModal(false);
                      setError(null);
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    Add Contact
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
              Are you sure you want to delete {selectedLeads.length} selected
              leads? This action cannot be undone.
            </p>
            <div className="p-3 mb-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
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
                Delete {selectedLeads.length} Leads
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
            className="absolute p-3 max-w-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg tag-popup"
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
                      const currentTags = getCurrentLeadTags(
                        tagPopupData.leadId
                      );
                      const isAlreadySelected = currentTags.some(
                        t =>
                          (typeof t === "string" && t === tag.name) ||
                          (typeof t === "object" && t.name === tag.name)
                      );

                      return (
                        <button
                          key={tag.id || tag.name}
                          onClick={() => {
                            if (!isAlreadySelected) {
                              addTagToLead(tagPopupData.leadId, tag.name);
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
            className="absolute p-3 max-w-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg searchable-dropdown-enter"
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
                      leads.find(l => l.id === statusDropdownData.leadId)
                        ?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          if (!isSelected)
                            updateContactStatus(
                              statusDropdownData.leadId,
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

      {/* Tag Add Dropdown */}
      {tagAddDropdownData && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setTagAddDropdownData(null)}
        >
          <div
            className="absolute p-3 max-w-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg searchable-dropdown-enter"
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
                    const currentTags = getCurrentLeadTags(
                      tagAddDropdownData.leadId
                    );
                    const isAlreadySelected = currentTags.some(
                      t =>
                        (typeof t === "string" && t === tag.name) ||
                        (typeof t === "object" && t.name === tag.name)
                    );

                    return (
                      <button
                        key={tag.id || tag.name}
                        onClick={() => {
                          if (!isAlreadySelected) {
                            addTagToLead(tagAddDropdownData.leadId, tag.name);
                          }
                        }}
                        disabled={isAlreadySelected}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors whitespace-nowrap ${
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
          entityType="leads"
          onClose={() => {
            setShowImportExportModal(false);
          }}
          onSuccess={() => {
            setShowImportExportModal(false);
            // Refresh the leads list
            const fetchContacts = async () => {
              if (!user || !selectedOrganization || !selectedWorkspace) return;

              setLoading(true);
              try {
                const token = getLocalStorage("crm_access_token");
                if (!token) return;

                const response = await contactService.getContacts(
                  selectedWorkspace.id,
                  selectedOrganization.id,
                  token
                );

                if (response.success && response.data) {
                  const convertedContacts = response.data.map(contact => ({
                    ...contact,
                    tags:
                      contact.tags
                        ?.map(tag => {
                          if (typeof tag === "string") {
                            return tag;
                          }
                          if (tag && typeof tag === "object") {
                            if (
                              tag.tag &&
                              (tag.tag as Record<string, unknown>).name
                            ) {
                              return (tag.tag as Record<string, unknown>)
                                .name as string;
                            }
                            if (tag.name) {
                              return tag.name;
                            }
                          }
                          return null;
                        })
                        .filter(tag => tag !== null) || [],
                  }));
                  setLeads(convertedContacts as unknown as Contact[]);
                }
              } catch (error) {
              } finally {
                setLoading(false);
              }
            };
            fetchContacts();
          }}
        />
      )}
    </div>
  );
};

export default LeadsTable;
