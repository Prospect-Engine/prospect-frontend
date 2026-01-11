import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  X,
  Edit,
  Building,
  Globe,
  User,
  Plus,
  MessageSquare,
  FileText,
  Calendar,
  Activity,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Tag,
  Percent,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Zap,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from "lucide-react";
import { Deal } from "../../types/sales-types";
import dealService from "../../services/sales-services/dealService";
import {
  tagService,
  Tag as TagInterface,
} from "../../services/sales-services/tagService";
import companyService from "../../services/sales-services/companyService";
import contactService from "../../services/sales-services/contactService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import NotesSection from "./NotesSection";
import TaskSection from "./TaskSection";
import ActivitiesSection from "./ActivitiesSection";

// Deal status enum
const DEAL_STATUSES: Deal["status"][] = ["OPEN", "WON", "LOST", "PAUSED"];

interface DealDetailPanelProps {
  deal: Deal;
  onClose: () => void;
  onUpdate: (deal: Deal) => void;
  onRefreshList?: () => void;
}

const DealDetailPanel: React.FC<DealDetailPanelProps> = ({
  deal,
  onClose,
  onUpdate,
  onRefreshList,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentDeal, setCurrentDeal] = useState<Deal>(deal);
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { user } = useAuth();

  // Update currentDeal when deal prop changes
  useEffect(() => {
    setCurrentDeal(deal);
  }, [deal]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "activities" | "contacts" | "messages" | "notes" | "tasks"
  >("overview");
  const panelRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Tab scroll states
  const [tabScrollPosition, setTabScrollPosition] = useState(0);
  const [maxTabScrollPosition, setMaxTabScrollPosition] = useState(0);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Tag management states
  const [availableTags, setAvailableTags] = useState<TagInterface[]>([]);
  const [filteredTags, setFilteredTags] = useState<TagInterface[]>([]);
  const [tagSearchTerm, setTagSearchTerm] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [assigningTag, setAssigningTag] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);

  // Searchable dropdown states
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [ownerSearchTerm, setOwnerSearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [availableOwners, setAvailableOwners] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [filteredOwners, setFilteredOwners] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [availableContacts, setAvailableContacts] = useState<
    Array<{ id: string; name: string; email?: string; phoneNumber?: string }>
  >([]);
  const [filteredContacts, setFilteredContacts] = useState<
    Array<{ id: string; name: string; email?: string; phoneNumber?: string }>
  >([]);
  const [availableCompanies, setAvailableCompanies] = useState<
    Array<{ id: string; name: string; industry?: string }>
  >([]);
  const [filteredCompanies, setFilteredCompanies] = useState<
    Array<{ id: string; name: string; industry?: string }>
  >([]);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Handle smooth close animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match the CSS animation duration
  }, [onClose]);

  // Tab scroll functions
  const scrollTabsLeft = () => {
    if (tabScrollRef.current) {
      const scrollAmount = 200; // Scroll by 200px
      const newPosition = Math.max(0, tabScrollPosition - scrollAmount);
      tabScrollRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
      setTabScrollPosition(newPosition);
    }
  };

  const scrollTabsRight = () => {
    if (tabScrollRef.current) {
      const scrollAmount = 200; // Scroll by 200px
      const newPosition = Math.min(
        maxTabScrollPosition,
        tabScrollPosition + scrollAmount
      );
      tabScrollRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });
      setTabScrollPosition(newPosition);
    }
  };

  const handleTabScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    setTabScrollPosition(target.scrollLeft);
    setMaxTabScrollPosition(target.scrollWidth - target.clientWidth);
  };

  // Handle outside click to close panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }

      // Close dropdowns when clicking outside dropdown containers
      const target = event.target as Element;
      const isOwnerDropdown = target.closest(".owner-dropdown-container");
      const isCompanyDropdown = target.closest(".company-dropdown-container");
      const isContactDropdown = target.closest(".contact-dropdown-container");

      if (!isOwnerDropdown) {
        setShowOwnerDropdown(false);
      }
      if (!isCompanyDropdown) {
        setShowCompanyDropdown(false);
      }
      if (!isContactDropdown) {
        setShowContactDropdown(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [
    onClose,
    handleClose,
    showOwnerDropdown,
    showContactDropdown,
    showCompanyDropdown,
  ]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "WON":
        return "bg-green-50 text-green-700 border-green-200";
      case "LOST":
        return "bg-red-50 text-red-700 border-red-200";
      case "PAUSED":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (status: Deal["status"]) => {
    switch (status) {
      case "OPEN":
        return <Play className="w-4 h-4" />;
      case "WON":
        return <CheckCircle className="w-4 h-4" />;
      case "LOST":
        return <XCircle className="w-4 h-4" />;
      case "PAUSED":
        return <Pause className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  // Load available tags
  const loadAvailableTags = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setLoadingTags(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await tagService.getAllTags(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setAvailableTags(response.data);
        setFilteredTags(response.data);
      } else {
        setError(response.error || "Failed to load tags");
      }
    } catch (err) {
      setError("Failed to load tags");
    } finally {
      setLoadingTags(false);
    }
  }, [user, selectedWorkspace, selectedOrganization]);

  // Assign tag to deal
  const handleAssignTag = async (tagId: string) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setAssigningTag(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await dealService.addTagToDeal(
        deal.id,
        tagId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        setSuccess("Tag assigned successfully");
        setShowTagDropdown(false);
        onUpdate(response.data);

        // Refresh the deals list to update the table view
        if (onRefreshList) {
          onRefreshList();
        }
      } else {
        setError(response.error || "Failed to assign tag");
      }
    } catch (err) {
      setError("Failed to assign tag");
    } finally {
      setAssigningTag(false);
    }
  };

  // Remove tag from deal
  const handleRemoveTag = async (tagId: string) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setRemovingTag(tagId);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await dealService.removeTagFromDeal(
        deal.id,
        tagId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        setSuccess("Tag removed successfully");
        onUpdate(response.data);

        // Refresh the deals list to update the table view
        if (onRefreshList) {
          onRefreshList();
        }
      } else {
        setError(response.error || "Failed to remove tag");
      }
    } catch (err) {
      setError("Failed to remove tag");
    } finally {
      setRemovingTag(null);
    }
  };

  // Load tags on component mount
  useEffect(() => {
    loadAvailableTags();
  }, [user, selectedWorkspace, selectedOrganization, loadAvailableTags]);

  // Refresh deal data from server
  const refreshDealData = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.getDeal(
        deal.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        onUpdate(response.data);
      }
    } catch (err) {}
  };

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showTagDropdown &&
        !(event.target as Element).closest(".tag-dropdown-container")
      ) {
        setShowTagDropdown(false);
        setTagSearchTerm("");
        setFilteredTags(availableTags);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTagDropdown, availableTags]);

  const TabButton = ({
    id,
    label,
    icon: Icon,
    count,
  }: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }) => (
    <button
      data-tab-id={id}
      onClick={() => {
        setActiveTab(
          id as
            | "overview"
            | "activities"
            | "contacts"
            | "messages"
            | "notes"
            | "tasks"
        );
        // Scroll the selected tab into view
        setTimeout(() => scrollTabIntoView(id), 100);
      }}
      className={`flex items-center gap-1.5 flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
        activeTab === id
          ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {count !== undefined && count > 0 && (
        <span
          className={`ml-1 px-1 py-0.5 text-xs rounded-full ${
            activeTab === id
              ? "bg-blue-200 text-blue-800"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );

  // Navigation configuration with icons
  const navigationConfig = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: FileText, count: undefined },
      {
        id: "activities",
        label: "Activities",
        icon: Activity,
        count: deal.activities?.length || 0,
      },
      {
        id: "contacts",
        label: "Contacts",
        icon: User,
        count: deal.contact ? 1 : 0,
      },
      { id: "messages", label: "Messages", icon: MessageSquare, count: 0 },
      {
        id: "notes",
        label: "Notes",
        icon: FileText,
        count: deal.notes?.length || 0,
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: CheckSquare,
        count: deal.tasks?.length || 0,
      },
    ],
    [
      deal.activities?.length,
      deal.contact,
      deal.notes?.length,
      deal.tasks?.length,
    ]
  );

  // Calculate max scroll position on mount and when content changes
  useEffect(() => {
    const calculateMaxScroll = () => {
      if (tabScrollRef.current) {
        const maxScroll =
          tabScrollRef.current.scrollWidth - tabScrollRef.current.clientWidth;
        setMaxTabScrollPosition(maxScroll);
      }
    };

    // Calculate immediately
    calculateMaxScroll();

    // Also calculate after a short delay to ensure content is rendered
    const timer = setTimeout(calculateMaxScroll, 100);

    return () => clearTimeout(timer);
  }, [navigationConfig]); // Recalculate when navigation config changes

  // Function to scroll tab into view
  const scrollTabIntoView = (tabId: string) => {
    if (tabScrollRef.current) {
      const tabElements = tabScrollRef.current.querySelectorAll("button");
      const targetTab = Array.from(tabElements).find(
        button => button.getAttribute("data-tab-id") === tabId
      );

      if (targetTab) {
        const container = tabScrollRef.current;
        const tabRect = targetTab.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate if tab is outside viewport
        const isOutsideLeft = tabRect.left < containerRect.left;
        const isOutsideRight = tabRect.right > containerRect.right;

        if (isOutsideLeft) {
          // Scroll to show the tab on the left side
          const scrollLeft =
            container.scrollLeft + (tabRect.left - containerRect.left) - 20;
          container.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          });
        } else if (isOutsideRight) {
          // Scroll to show the tab on the right side
          const scrollLeft =
            container.scrollLeft + (tabRect.right - containerRect.right) + 20;
          container.scrollTo({
            left: scrollLeft,
            behavior: "smooth",
          });
        }
      }
    }
  };

  // Ensure selected tab is always visible
  useEffect(() => {
    if (activeTab && tabScrollRef.current) {
      setTimeout(() => scrollTabIntoView(activeTab), 100);
    }
  }, [activeTab]);

  const InfoRow = ({
    icon,
    label,
    value,
    href,
    isEditable = false,
    onSave,
    dropdownOptions,
    inputType = "text",
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | null | undefined;
    href?: string;
    isEditable?: boolean;
    onSave?: (value: string) => Promise<void>;
    dropdownOptions?: { value: string; label: string }[];
    inputType?: "text" | "date" | "number" | "email";
  }) => {
    const [isEditingField, setIsEditingField] = useState(false);
    const [fieldValue, setFieldValue] = useState(value || "");
    const [isSaving, setIsSaving] = useState(false);

    // Convert date value for date input
    const getInputValue = () => {
      if (inputType === "date" && value) {
        try {
          // Convert ISO date to YYYY-MM-DD format for date input
          return new Date(value).toISOString().split("T")[0];
        } catch {
          return "";
        }
      }
      return value || "";
    };

    const handleSave = async () => {
      if (onSave && fieldValue !== getInputValue()) {
        setIsSaving(true);
        try {
          // For date inputs, convert back to ISO string
          const saveValue =
            inputType === "date"
              ? new Date(fieldValue).toISOString()
              : fieldValue;
          await onSave(saveValue);
          setIsEditingField(false);
        } catch (error) {
        } finally {
          setIsSaving(false);
        }
      } else {
        setIsEditingField(false);
      }
    };

    const handleCancel = () => {
      setFieldValue(getInputValue());
      setIsEditingField(false);
    };

    const startEditing = () => {
      setFieldValue(getInputValue());
      setIsEditingField(true);
    };

    return (
      <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50">
        <div className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-700 mb-0.5">
            {label}
          </div>
          {isEditingField ? (
            <div className="space-y-2">
              {dropdownOptions ? (
                <select
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                  className="px-2 py-1 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSaving}
                >
                  <option value="">Select {label.toLowerCase()}</option>
                  {dropdownOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={inputType}
                  value={fieldValue}
                  onChange={e => setFieldValue(e.target.value)}
                  className="px-2 py-1 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${label.toLowerCase()}`}
                  disabled={isSaving}
                />
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center px-2 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? (
                    <div className="mr-1 w-3 h-3 rounded-full border border-white animate-spin border-t-transparent" />
                  ) : (
                    <CheckCircle2 className="mr-1 w-3 h-3" />
                  )}
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : value ? (
            <div className="flex justify-between items-center">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 group/link"
                >
                  <span className="break-all">{value}</span>
                  <ExternalLink className="flex-shrink-0 w-3 h-3 opacity-0 transition-opacity duration-200 group-hover/link:opacity-100" />
                </a>
              ) : (
                <div className="text-xs text-gray-900 break-words">{value}</div>
              )}
              {isEditable && onSave && (
                <button
                  onClick={startEditing}
                  className="p-1 ml-2 text-gray-400 rounded transition-colors hover:text-gray-600"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div className="text-xs italic text-gray-400">Not provided</div>
              {isEditable && onSave && (
                <button
                  onClick={startEditing}
                  className="p-1 ml-2 text-gray-400 rounded transition-colors hover:text-gray-600"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Field update handlers
  const handleUpdateTitle = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { title: value },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Title updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update title");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update title");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateDescription = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { description: value },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Description updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update description");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update description");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateValue = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { value: parseFloat(value) },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Value updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update value");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update value");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateProbability = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const numericValue = parseInt(value);
      if (isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
        setError("Please enter a valid percentage (0-100)");
        return;
      }

      const response = await dealService.updateDeal(
        deal.id,
        { probability: numericValue },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Probability updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update probability");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update probability");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateStatus = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const updateData: { status: Deal["status"]; actualCloseDate?: string } = {
        status: value as Deal["status"],
      };

      if (value === "WON" || value === "LOST") {
        updateData.actualCloseDate = new Date().toISOString();
      }

      const response = await dealService.updateDealStatus(
        deal.id,
        updateData,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Status updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update status");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update status");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateExpectedCloseDate = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { expectedCloseDate: new Date(value).toISOString() },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Expected close date updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update expected close date");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update expected close date");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateActualCloseDate = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { actualCloseDate: new Date(value).toISOString() },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Actual close date updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update actual close date");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update actual close date");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateCurrency = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { currency: value },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Currency updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update currency");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update currency");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateOwner = async (ownerId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { ownerId },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Owner updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update owner");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update owner");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateCompany = async (companyId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { companyId },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Company updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update company");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update company");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateContact = async (contactId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await dealService.updateDeal(
        deal.id,
        { contactId },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setCurrentDeal(response.data);
        onUpdate(response.data);
        setSuccess("Contact updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update contact");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update contact");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Fetch available owners for dropdown
  const fetchAvailableOwners = async () => {
    if (!selectedWorkspace || !selectedOrganization) {
      return;
    }

    try {
      setLoadingOwners(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        return;
      }

      // Fetch real workspace members from the user's workspace data
      const currentWorkspace = user?.workspaces?.find(
        ws => ws.id === selectedWorkspace.id
      );
      const currentOrg = user?.organizations?.find(
        org => org.id === selectedOrganization.id
      );

      let workspaceMembers: Array<{ id: string; name: string; email: string }> =
        [];

      if (currentWorkspace?.members) {
        workspaceMembers = currentWorkspace.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
        }));
      } else if (currentOrg?.members) {
        // Fallback to organization members if workspace members not available
        workspaceMembers = currentOrg.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
        }));
      }

      setAvailableOwners(workspaceMembers);
      setFilteredOwners(workspaceMembers);
    } catch (error) {
    } finally {
      setLoadingOwners(false);
    }
  };

  // Fetch available contacts for dropdown
  const fetchAvailableContacts = async () => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      setLoadingContacts(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      // Fetch real contacts from the backend
      const response = await contactService.getContacts(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        const contacts = response.data.map(contact => ({
          id: contact.id,
          name: contact.name || "Unnamed Contact",
          email: contact.email || undefined,
          phoneNumber: contact.phoneNumber || undefined,
        }));
        setAvailableContacts(contacts);
        setFilteredContacts(contacts);
      } else {
      }
    } catch (error) {
    } finally {
      setLoadingContacts(false);
    }
  };

  // Fetch available companies for dropdown
  const fetchAvailableCompanies = async () => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      setLoadingCompanies(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      // Fetch real companies from the backend
      const response = await companyService.getCompanies(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        const companies = response.data.map(company => ({
          id: company.id,
          name: company.name,
          industry: company.industry || undefined,
        }));
        setAvailableCompanies(companies);
        setFilteredCompanies(companies);
      } else {
      }
    } catch (error) {
    } finally {
      setLoadingCompanies(false);
    }
  };

  return (
    <div
      className={`flex fixed inset-0 z-50 justify-end items-center backdrop-blur-sm transition-all duration-300 ease-in-out ${
        isClosing ? "/0" : "/20"
      }`}
      style={{
        animation: isClosing
          ? "fadeOut 0.3s ease-in-out forwards"
          : "fadeIn 0.3s ease-in-out forwards",
      }}
    >
      <div
        ref={panelRef}
        className={`flex overflow-hidden flex-col h-full bg-white shadow-xl transition-all duration-300 ease-in-out transform ${
          isClosing ? "translate-x-full" : "translate-x-0"
        }`}
        style={{
          width: "430px",
          maxWidth: "430px",
          animation: isClosing
            ? "slideOutToRight 0.3s ease-in-out forwards"
            : "slideInFromRight 0.3s ease-in-out forwards",
        }}
      >
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="relative flex-shrink-0">
              <div className="flex justify-center items-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold leading-tight text-gray-900 break-words">
                {currentDeal.title || "Untitled Deal"}
              </h2>
              <div className="flex flex-wrap gap-1 items-center mt-1 text-xs text-gray-600">
                {currentDeal.value && (
                  <span className="font-medium text-green-600 break-words">
                    {formatCurrency(currentDeal.value, currentDeal.currency)}
                  </span>
                )}
                {currentDeal.probability && currentDeal.value && (
                  <span className="text-gray-400">•</span>
                )}
                {currentDeal.probability && (
                  <span className="break-words">
                    {currentDeal.probability}% probability
                  </span>
                )}
              </div>

              {/* Deal Status */}
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                  {getStatusIcon(deal.status)}
                  <span className="text-xs font-medium text-blue-800">
                    Status: {currentDeal.status}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-gray-400 rounded transition-colors hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(currentDeal.status)}`}
            >
              {currentDeal.status}
            </span>
          </div>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border-b border-red-200">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-2 text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">{success}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            {/* Left gradient fade */}
            <div className="absolute top-0 left-0 z-10 w-4 h-full bg-gradient-to-r from-white to-transparent pointer-events-none" />
            {/* Right gradient fade */}
            <div className="absolute top-0 right-0 z-10 w-4 h-full bg-gradient-to-l from-white to-transparent pointer-events-none" />

            {/* Scroll buttons */}
            {tabScrollPosition > 0 && (
              <button
                onClick={scrollTabsLeft}
                className="absolute left-0 top-1/2 z-20 p-1 text-white bg-blue-600 rounded-full shadow-lg transition-all transform -translate-y-1/2 hover:bg-blue-700"
                title="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            {maxTabScrollPosition > 0 && (
              <button
                onClick={scrollTabsRight}
                className="absolute right-0 top-1/2 z-20 p-1 text-white bg-blue-600 rounded-full shadow-lg transition-all transform -translate-y-1/2 hover:bg-blue-700"
                title="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div
              ref={tabScrollRef}
              onScroll={handleTabScroll}
              className="flex overflow-x-auto space-x-1 scrollbar-hide scroll-smooth"
            >
              <div className="flex px-4 space-x-1 min-w-max">
                {navigationConfig.map(tab => (
                  <TabButton key={tab.id} {...tab} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex overflow-hidden flex-1">
          {/* Main Content */}
          <div className="overflow-y-auto flex-1">
            {activeTab === "overview" && (
              <div
                className="overflow-y-auto p-4 space-y-4 max-h-full"
                data-tab="overview"
              >
                {/* Deal Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Deal Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="Title"
                      value={currentDeal.title}
                      isEditable={true}
                      onSave={handleUpdateTitle}
                    />
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="Description"
                      value={currentDeal.description}
                      isEditable={true}
                      onSave={handleUpdateDescription}
                    />
                    <InfoRow
                      icon={<DollarSign className="w-4 h-4" />}
                      label="Value"
                      value={
                        currentDeal.value
                          ? formatCurrency(
                              currentDeal.value,
                              currentDeal.currency
                            )
                          : undefined
                      }
                      isEditable={true}
                      onSave={handleUpdateValue}
                    />
                    <InfoRow
                      icon={<Percent className="w-4 h-4" />}
                      label="Probability"
                      value={
                        currentDeal.probability
                          ? `${currentDeal.probability}%`
                          : undefined
                      }
                      isEditable={true}
                      onSave={handleUpdateProbability}
                    />
                    <InfoRow
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      label="Status"
                      value={currentDeal.status}
                      isEditable={true}
                      onSave={handleUpdateStatus}
                      dropdownOptions={DEAL_STATUSES.map(status => ({
                        value: status,
                        label:
                          status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase(),
                      }))}
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4" />}
                      label="Expected Close Date"
                      value={
                        currentDeal.expectedCloseDate
                          ? formatDate(currentDeal.expectedCloseDate)
                          : undefined
                      }
                      isEditable={true}
                      onSave={handleUpdateExpectedCloseDate}
                      inputType="date"
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4" />}
                      label="Actual Close Date"
                      value={
                        currentDeal.actualCloseDate
                          ? formatDate(currentDeal.actualCloseDate)
                          : undefined
                      }
                      isEditable={true}
                      onSave={handleUpdateActualCloseDate}
                      inputType="date"
                    />
                    <InfoRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Currency"
                      value={currentDeal.currency}
                      isEditable={true}
                      onSave={handleUpdateCurrency}
                      dropdownOptions={[
                        { value: "USD", label: "USD - US Dollar" },
                        { value: "EUR", label: "EUR - Euro" },
                        { value: "GBP", label: "GBP - British Pound" },
                        { value: "CAD", label: "CAD - Canadian Dollar" },
                        { value: "AUD", label: "AUD - Australian Dollar" },
                        { value: "JPY", label: "JPY - Japanese Yen" },
                        { value: "CHF", label: "CHF - Swiss Franc" },
                        { value: "CNY", label: "CNY - Chinese Yuan" },
                        { value: "INR", label: "INR - Indian Rupee" },
                        { value: "BRL", label: "BRL - Brazilian Real" },
                      ]}
                    />
                    {/* Owner */}
                    <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50">
                      <div className="text-gray-400 mt-0.5 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Owner
                        </div>
                        <div className="mb-2">
                          {currentDeal.owner ? (
                            <div className="flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded border border-blue-200 w-fit">
                              <span className="font-medium">
                                {currentDeal.owner.name}
                              </span>
                              <span className="ml-2 text-blue-500">•</span>
                              <span className="ml-2">
                                {currentDeal.owner.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              No owner assigned
                            </span>
                          )}
                        </div>

                        {/* Add Owner Section */}
                        <div className="relative owner-dropdown-container">
                          <button
                            onClick={() => {
                              if (!showOwnerDropdown) {
                                setOwnerSearchTerm("");
                                fetchAvailableOwners();
                              }
                              setShowOwnerDropdown(!showOwnerDropdown);
                            }}
                            disabled={loadingOwners}
                            className="flex gap-2 items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                            {loadingOwners ? "Loading..." : "Change Owner"}
                          </button>

                          {/* Owner Dropdown */}
                          <div
                            className={`absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-hidden transition-all duration-200 ease-in-out ${
                              showOwnerDropdown
                                ? "opacity-100 transform scale-100 translate-y-0"
                                : "opacity-0 transform scale-95 translate-y-2 pointer-events-none"
                            }`}
                            style={{
                              display: showOwnerDropdown ? "block" : "none",
                            }}
                          >
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search owners..."
                                value={ownerSearchTerm}
                                className="px-2 py-1 w-full text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onChange={e => {
                                  const searchTerm = e.target.value;
                                  setOwnerSearchTerm(searchTerm);
                                  const filtered = availableOwners.filter(
                                    owner =>
                                      owner.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) ||
                                      owner.email
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase())
                                  );
                                  setFilteredOwners(filtered);
                                }}
                              />
                            </div>

                            {/* Owners List */}
                            <div className="overflow-y-auto max-h-36">
                              {loadingOwners ? (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  Loading...
                                </div>
                              ) : filteredOwners.length > 0 ? (
                                filteredOwners.map(owner => {
                                  const isSelected =
                                    currentDeal.owner?.id === owner.id;

                                  return (
                                    <button
                                      key={owner.id}
                                      onClick={() => {
                                        //
                                        if (!isSelected) {
                                          //
                                          handleUpdateOwner(owner.id);
                                        }
                                        setShowOwnerDropdown(false);
                                        setOwnerSearchTerm("");
                                      }}
                                      disabled={isSelected}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${
                                        isSelected
                                          ? "text-gray-400 bg-gray-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                          {owner.name}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-green-500" />
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {owner.email}
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  {ownerSearchTerm
                                    ? "No owners found"
                                    : "No owners available"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Company */}
                    <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50">
                      <div className="text-gray-400 mt-0.5 flex-shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Company
                        </div>
                        <div className="mb-2">
                          {currentDeal.company ? (
                            <div className="flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded border border-blue-200 w-fit">
                              <span className="font-medium">
                                {currentDeal.company.name}
                              </span>
                              {currentDeal.company.industry && (
                                <>
                                  <span className="ml-2 text-blue-500">•</span>
                                  <span className="ml-2">
                                    {currentDeal.company.industry}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              No company assigned
                            </span>
                          )}
                        </div>

                        {/* Add Company Section */}
                        <div className="relative company-dropdown-container">
                          <button
                            onClick={() => {
                              if (!showCompanyDropdown) {
                                setCompanySearchTerm("");
                                fetchAvailableCompanies();
                              }
                              setShowCompanyDropdown(!showCompanyDropdown);
                            }}
                            disabled={loadingCompanies}
                            className="flex gap-2 items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                            {loadingCompanies ? "Loading..." : "Change Company"}
                          </button>

                          {/* Company Dropdown */}
                          <div
                            className={`absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-hidden transition-all duration-200 ease-in-out ${
                              showCompanyDropdown
                                ? "opacity-100 transform scale-100 translate-y-0"
                                : "opacity-0 transform scale-95 translate-y-2 pointer-events-none"
                            }`}
                          >
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search companies..."
                                value={companySearchTerm}
                                className="px-2 py-1 w-full text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onChange={e => {
                                  const searchTerm = e.target.value;
                                  setCompanySearchTerm(searchTerm);
                                  const filtered = availableCompanies.filter(
                                    company =>
                                      company.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) ||
                                      (company.industry &&
                                        company.industry
                                          .toLowerCase()
                                          .includes(searchTerm.toLowerCase()))
                                  );
                                  setFilteredCompanies(filtered);
                                }}
                              />
                            </div>

                            {/* Companies List */}
                            <div className="overflow-y-auto max-h-36">
                              {loadingCompanies ? (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  Loading...
                                </div>
                              ) : filteredCompanies.length > 0 ? (
                                filteredCompanies.map(company => {
                                  const isSelected =
                                    currentDeal.company?.id === company.id;

                                  return (
                                    <button
                                      key={company.id}
                                      onClick={() => {
                                        //
                                        if (!isSelected) {
                                          //
                                          handleUpdateCompany(company.id);
                                        }
                                        setShowCompanyDropdown(false);
                                        setCompanySearchTerm("");
                                      }}
                                      disabled={isSelected}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${
                                        isSelected
                                          ? "text-gray-400 bg-gray-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                          {company.name}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-green-500" />
                                        )}
                                      </div>
                                      {company.industry && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                          {company.industry}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  {companySearchTerm
                                    ? "No companies found"
                                    : "No companies available"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50">
                      <div className="text-gray-400 mt-0.5 flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Contact
                        </div>
                        <div className="mb-2">
                          {currentDeal.contact ? (
                            <div className="flex items-center px-2 py-1 text-xs text-blue-700 bg-blue-50 rounded border border-blue-200 w-fit">
                              <span className="font-medium">
                                {currentDeal.contact.name}
                              </span>
                              {currentDeal.contact.email && (
                                <>
                                  <span className="ml-2 text-blue-500">•</span>
                                  <span className="ml-2">
                                    {currentDeal.contact.email}
                                  </span>
                                </>
                              )}
                              {currentDeal.contact.phoneNumber && (
                                <>
                                  <span className="ml-2 text-blue-500">•</span>
                                  <span className="ml-2">
                                    {currentDeal.contact.phoneNumber}
                                  </span>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">
                              No contact assigned
                            </span>
                          )}
                        </div>

                        {/* Add Contact Section */}
                        <div className="relative contact-dropdown-container">
                          <button
                            onClick={() => {
                              if (!showContactDropdown) {
                                setContactSearchTerm("");
                                fetchAvailableContacts();
                              }
                              setShowContactDropdown(!showContactDropdown);
                            }}
                            disabled={loadingContacts}
                            className="flex gap-2 items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                            {loadingContacts ? "Loading..." : "Change Contact"}
                          </button>

                          {/* Contact Dropdown */}
                          <div
                            className={`absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-hidden transition-all duration-200 ease-in-out ${
                              showContactDropdown
                                ? "opacity-100 transform scale-100 translate-y-0"
                                : "opacity-0 transform scale-95 translate-y-2 pointer-events-none"
                            }`}
                          >
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search contacts..."
                                value={contactSearchTerm}
                                className="px-2 py-1 w-full text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onChange={e => {
                                  const searchTerm = e.target.value;
                                  setContactSearchTerm(searchTerm);
                                  const filtered = availableContacts.filter(
                                    contact =>
                                      contact.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) ||
                                      (contact.email &&
                                        contact.email
                                          .toLowerCase()
                                          .includes(
                                            searchTerm.toLowerCase()
                                          )) ||
                                      (contact.phoneNumber &&
                                        contact.phoneNumber
                                          .toLowerCase()
                                          .includes(searchTerm.toLowerCase()))
                                  );
                                  setFilteredContacts(filtered);
                                }}
                              />
                            </div>

                            {/* Contacts List */}
                            <div className="overflow-y-auto max-h-36">
                              {loadingContacts ? (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  Loading...
                                </div>
                              ) : filteredContacts.length > 0 ? (
                                filteredContacts.map(contact => {
                                  const isSelected =
                                    currentDeal.contact?.id === contact.id;

                                  return (
                                    <button
                                      key={contact.id}
                                      onClick={() => {
                                        //
                                        if (!isSelected) {
                                          //
                                          handleUpdateContact(contact.id);
                                        }
                                        setShowContactDropdown(false);
                                        setContactSearchTerm("");
                                      }}
                                      disabled={isSelected}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${
                                        isSelected
                                          ? "text-gray-400 bg-gray-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <span className="font-medium">
                                          {contact.name}
                                        </span>
                                        {isSelected && (
                                          <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-green-500" />
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {contact.email && contact.phoneNumber
                                          ? `${contact.email} • ${contact.phoneNumber}`
                                          : contact.email ||
                                            contact.phoneNumber}
                                      </div>
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  {contactSearchTerm
                                    ? "No contacts found"
                                    : "No contacts available"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Entities */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Associated Entities
                  </h3>
                  <div className="space-y-1">
                    {deal.company && (
                      <InfoRow
                        icon={<Building className="w-4 h-4" />}
                        label="Company"
                        value={deal.company.name}
                      />
                    )}
                    {deal.contact && (
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="Contact"
                        value={deal.contact.name}
                      />
                    )}
                    {deal.owner && (
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="Owner"
                        value={deal.owner.name}
                      />
                    )}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Tags
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-start px-2 py-2 -mx-2 space-x-3 rounded-md transition-colors duration-150 group hover:bg-gray-50">
                      <div className="text-gray-400 mt-0.5 flex-shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-xs font-medium text-gray-700">
                          Tags
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {currentDeal.tags && currentDeal.tags.length > 0 ? (
                            currentDeal.tags.map((tag, index) => {
                              const tagName =
                                typeof tag === "string" ? tag : tag.name;
                              const tagId =
                                typeof tag === "string" ? tag : tag.id;

                              return (
                                <div
                                  key={index}
                                  className="flex items-center px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 w-fit justify-self-start"
                                >
                                  <span className="p-1">{tagName}</span>
                                  <button
                                    onClick={() => handleRemoveTag(tagId)}
                                    disabled={removingTag === tagId}
                                    className="flex-shrink-0 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                  >
                                    {removingTag === tagId ? (
                                      <div className="w-3 h-3 rounded-full border border-blue-500 animate-spin border-t-transparent" />
                                    ) : (
                                      <X className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-500">
                              No tags assigned
                            </span>
                          )}
                        </div>

                        {/* Add Tag Section */}
                        <div className="relative tag-dropdown-container">
                          <button
                            onClick={() => {
                              if (!showTagDropdown) {
                                setTagSearchTerm("");
                                setFilteredTags(availableTags);
                              }
                              setShowTagDropdown(!showTagDropdown);
                            }}
                            disabled={loadingTags || assigningTag}
                            className="flex gap-2 items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {assigningTag ? (
                              <div className="w-3 h-3 rounded-full border border-blue-600 animate-spin border-t-transparent" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            {loadingTags
                              ? "Loading..."
                              : assigningTag
                                ? "Adding..."
                                : "Add Tag"}
                          </button>

                          {/* Tag Dropdown */}
                          <div
                            className={`absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-48 overflow-hidden transition-all duration-200 ease-in-out ${
                              showTagDropdown
                                ? "opacity-100 transform scale-100 translate-y-0"
                                : "opacity-0 transform scale-95 translate-y-2 pointer-events-none"
                            }`}
                          >
                            {/* Search Input */}
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                placeholder="Search tags..."
                                value={tagSearchTerm}
                                className="px-2 py-1 w-full text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                onChange={e => {
                                  const searchTerm = e.target.value;
                                  setTagSearchTerm(searchTerm);
                                  const filtered = availableTags.filter(
                                    tag =>
                                      tag.name
                                        .toLowerCase()
                                        .includes(searchTerm.toLowerCase()) ||
                                      (tag.description &&
                                        tag.description
                                          .toLowerCase()
                                          .includes(searchTerm.toLowerCase()))
                                  );
                                  setFilteredTags(filtered);
                                }}
                              />
                            </div>

                            {/* Tags List */}
                            <div className="overflow-y-auto max-h-36">
                              {(tagSearchTerm ? filteredTags : availableTags)
                                .length > 0 ? (
                                (tagSearchTerm
                                  ? filteredTags
                                  : availableTags
                                ).map(tag => {
                                  const isAssigned = currentDeal.tags?.some(
                                    dealTag => {
                                      const dealTagId =
                                        typeof dealTag === "string"
                                          ? dealTag
                                          : dealTag.id;
                                      return dealTagId === tag.id;
                                    }
                                  );

                                  return (
                                    <button
                                      key={tag.id}
                                      onClick={() => {
                                        if (!isAssigned) {
                                          handleAssignTag(tag.id);
                                        }
                                      }}
                                      disabled={isAssigned || assigningTag}
                                      className={`w-full px-3 py-2 text-left text-xs hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap ${
                                        isAssigned
                                          ? "text-gray-400 bg-gray-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center">
                                        <div className="flex gap-2 items-center">
                                          <Zap className="w-3 h-3 text-purple-600" />
                                          <span className="font-medium">
                                            {tag.name}
                                          </span>
                                        </div>
                                        {isAssigned && (
                                          <CheckCircle2 className="flex-shrink-0 w-3 h-3 text-green-500" />
                                        )}
                                      </div>
                                      {tag.description && (
                                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                          {tag.description}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-500">
                                  {tagSearchTerm
                                    ? "No tags found"
                                    : "No tags available"}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "activities" && (
              <div className="p-4" data-tab="activities">
                <ActivitiesSection
                  entityId={currentDeal.id}
                  entityType="deal"
                  onRefresh={refreshDealData}
                />
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="p-4" data-tab="contacts">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Contacts
                  </h3>
                  <button className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                    <Plus className="mr-1 w-3 h-3" />
                    Add Contact
                  </button>
                </div>

                {currentDeal.contact ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-1 space-x-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">
                              Primary Contact
                            </span>
                          </div>
                          <h4 className="mb-1 text-sm font-medium text-gray-900">
                            {currentDeal.contact.name}
                          </h4>
                          {currentDeal.contact.email && (
                            <p className="text-sm text-gray-600">
                              {currentDeal.contact.email}
                            </p>
                          )}
                          {currentDeal.contact.phoneNumber && (
                            <p className="text-sm text-gray-600">
                              {currentDeal.contact.phoneNumber}
                            </p>
                          )}
                          {currentDeal.contact.jobTitle && (
                            <p className="text-xs text-gray-500">
                              {currentDeal.contact.jobTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <User className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      No contacts associated yet
                    </p>
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700">
                      Add first contact
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="p-4" data-tab="messages">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Messages
                  </h3>
                  <button className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
                    <Plus className="mr-1 w-3 h-3" />
                    Send Message
                  </button>
                </div>

                <div className="py-8 text-center">
                  <MessageSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <button className="mt-2 text-xs text-blue-600 hover:text-blue-700">
                    Send first message
                  </button>
                </div>
              </div>
            )}

            {activeTab === "notes" && (
              <div data-tab="notes">
                <NotesSection
                  entityId={currentDeal.id}
                  entityType="deal"
                  onRefresh={refreshDealData}
                />
              </div>
            )}

            {activeTab === "tasks" && (
              <div data-tab="tasks">
                <TaskSection
                  entityId={currentDeal.id}
                  entityType="deal"
                  entityName={currentDeal.title || "Deal"}
                  onRefresh={refreshDealData}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar Navigation */}
          <div className="flex flex-col items-center py-4 space-y-2 w-16 bg-gray-50 border-l border-gray-200">
            {navigationConfig.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(
                      tab.id as
                        | "overview"
                        | "activities"
                        | "contacts"
                        | "messages"
                        | "notes"
                        | "tasks"
                    );
                    // Smooth scroll to the tab content
                    const tabContent = document.querySelector(
                      `[data-tab="${tab.id}"]`
                    );
                    if (tabContent) {
                      tabContent.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4" />
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      className={`absolute -top-1 -right-1 w-4 h-4 text-xs rounded-full flex items-center justify-center ${
                        activeTab === tab.id
                          ? "bg-blue-200 text-blue-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPanel;
