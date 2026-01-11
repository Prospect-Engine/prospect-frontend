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
  Phone,
  Building,
  Globe,
  Linkedin,
  User,
  Clock,
  Plus,
  MessageSquare,
  FileText,
  Star,
  Activity,
  TrendingUp,
  ExternalLink,
  Target,
  AtSign,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Tag,
  MapPin,
  Image as ImageIcon,
  Twitter,
  Mail,
  Zap,
  ChevronLeft,
  ChevronRight,
  // New icons for dual navigation
  ClipboardList,
  MessageCircle,
  StickyNote,
  CheckSquare,
} from "lucide-react";
import { Company } from "../../types/sales-types";
import companyService from "../../services/sales-services/companyService";
import {
  tagService,
  Tag as TagInterface,
} from "../../services/sales-services/tagService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import NotesSection from "./NotesSection";
import TaskSection from "./TaskSection";
import ActivitiesSection from "./ActivitiesSection";
import DealsSection from "../../components/sales-components/DealsSection";

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

interface CompanyDetailPanelProps {
  company: Company;
  onClose: () => void;
  onUpdate: (company: Company) => void;
  onRefreshList?: () => void;
}

const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({
  company,
  onClose,
  onUpdate,
  onRefreshList,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "overview" | "activities" | "deals" | "messages" | "notes" | "tasks"
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
  }, [onClose, handleClose]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Never";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700 border-green-200";
      case "INACTIVE":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "PROSPECT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "CUSTOMER":
        return "bg-green-50 text-green-700 border-green-200";
      case "LOST":
        return "bg-red-50 text-red-700 border-red-200";
      case "WON":
        return "bg-green-50 text-green-700 border-green-200";
      case "DEAD":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "LEAD":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "ENGAGED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "INTERESTED":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "WARM":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "CLOSED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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

  // Assign tag to contact
  const handleAssignTag = async (tagId: string) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setAssigningTag(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await tagService.assignTag(
        {
          tagId,
          entityId: company.id,
          entityType: "company",
          workspaceId: selectedWorkspace.id,
          organizationId: selectedOrganization.id,
        },
        token
      );

      if (response.success) {
        setSuccess("Tag assigned successfully");
        setShowTagDropdown(false);

        // Find the assigned tag details
        const assignedTag = availableTags.find(tag => tag.id === tagId);
        if (assignedTag) {
          // Optimistically update the UI by adding the new tag
          const newTagAssignment = {
            id:
              ((response as unknown as Record<string, unknown>)
                ?.id as string) || `temp-${Date.now()}`, // Use response ID or temp ID
            tag: {
              id: tagId,
              name: assignedTag.name,
              description: assignedTag.description,
            },
          };

          const updatedCompany = {
            ...company,
            tags: [...(company.tags || []), newTagAssignment],
          };

          // Update the parent component immediately
          onUpdate(updatedCompany);
        }

        // Refresh the companies list to update the table view
        if (onRefreshList) {
          onRefreshList();
        }

        // Also refresh from server to ensure consistency
        await refreshCompanyData();
      } else {
        setError(response.error || "Failed to assign tag");
      }
    } catch (err) {
      setError("Failed to assign tag");
    } finally {
      setAssigningTag(false);
    }
  };

  // Remove tag from company
  const handleRemoveTag = async (assignmentId: string | undefined) => {
    if (!assignmentId) return;
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setRemovingTag(assignmentId);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Use deleteTagAssignment instead of unassignTag for better accuracy
      const response = await tagService.deleteTagAssignment(
        assignmentId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setSuccess("Tag removed successfully");

        // Optimistically update the UI by filtering out the removed tag
        const updatedCompany = {
          ...company,
          tags:
            company.tags?.filter(tag => {
              if (typeof tag === "string") return true; // Keep string tags for now
              if (tag && typeof tag === "object" && "id" in tag) {
                return (tag as { id: string }).id !== assignmentId;
              }
              return true;
            }) || [],
        };

        // Update the parent component immediately
        onUpdate(updatedCompany);

        // Refresh the companies list to update the table view
        if (onRefreshList) {
          onRefreshList();
        }

        // Also refresh from server to ensure consistency
        await refreshCompanyData();
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

  // Refresh company data from server
  const refreshCompanyData = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.getCompanies(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        const updatedCompany = response.data.find(
          (c: Company) => c.id === company.id
        );
        if (updatedCompany) {
          onUpdate(updatedCompany);
        }
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

  // Navigation configuration with icons
  const navigationConfig = useMemo(
    () => [
      {
        id: "overview",
        label: "Overview",
        icon: ClipboardList,
        count: undefined,
      },
      {
        id: "activities",
        label: "Activities",
        icon: Activity,
        count: company.activities?.length || 0,
      },
      {
        id: "deals",
        label: "Deals",
        icon: DollarSign,
        count: company.deals?.length || 0,
      },
      {
        id: "messages",
        label: "Messages",
        icon: MessageCircle,
        count: company.messages?.length || 0,
      },
      {
        id: "notes",
        label: "Notes",
        icon: StickyNote,
        count: company.notes?.length || 0,
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: CheckSquare,
        count: company.tasks?.length || 0,
      },
    ],
    [
      company.activities?.length,
      company.deals?.length,
      company.messages?.length,
      company.notes?.length,
      company.tasks?.length,
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

  // Ensure selected tab is always visible
  useEffect(() => {
    if (activeTab && tabScrollRef.current) {
      setTimeout(() => scrollTabIntoView(activeTab), 100);
    }
  }, [activeTab]);

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

  const TabButton = ({
    id,
    label,
    count,
  }: {
    id: string;
    label: string;
    count?: number;
  }) => (
    <button
      data-tab-id={id}
      onClick={() => {
        setActiveTab(
          id as
            | "overview"
            | "activities"
            | "deals"
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
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={`ml-1 px-1 py-0.5 text-xs rounded-full font-medium ${
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

  const SidebarIcon = ({
    id,
    icon: Icon,
    count,
    isActive,
  }: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    isActive: boolean;
  }) => (
    <button
      onClick={() => {
        setActiveTab(
          id as
            | "overview"
            | "activities"
            | "deals"
            | "messages"
            | "notes"
            | "tasks"
        );
        // Smooth scroll to the corresponding tab in the main content
        const tabElement = document.querySelector(`[data-tab="${id}"]`);
        if (tabElement) {
          tabElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }}
      className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 group ${
        isActive
          ? "text-blue-700 bg-blue-100 border-2 border-blue-300 shadow-sm"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
      title={navigationConfig.find(nav => nav.id === id)?.label}
    >
      <Icon
        className={`w-4 h-4 transition-all duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`}
      />
      {count !== undefined && count > 0 && (
        <span
          className={`absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold rounded-full ${
            isActive ? "text-white bg-blue-600" : "text-white bg-red-500"
          }`}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );

  const InfoRow = ({
    icon,
    label,
    value,
    href,
    isEditable = false,
    onSave,
    dropdownOptions,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | null | undefined;
    href?: string;
    isEditable?: boolean;
    onSave?: (value: string) => Promise<void>;
    dropdownOptions?: { value: string; label: string }[];
  }) => {
    const [isEditingField, setIsEditingField] = useState(false);
    const [fieldValue, setFieldValue] = useState(value || "");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
      if (onSave && fieldValue !== value) {
        setIsSaving(true);
        try {
          await onSave(fieldValue);
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
      setFieldValue(value || "");
      setIsEditingField(false);
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
                  type="text"
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
                  onClick={() => setIsEditingField(true)}
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
                  onClick={() => setIsEditingField(true)}
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
  const handleUpdateName = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { name: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Name updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update name");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update name");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Removed handleUpdateEmail and handleUpdatePhoneNumber as Company doesn't have these fields

  const handleUpdateWebsiteUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { websiteUrl: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Website URL updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update website URL");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update website URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateIndustry = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { industry: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Industry updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update industry");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update industry");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateSize = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { size: value as Company["size"] },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Size updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update size");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update size");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateDomain = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { domain: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Domain updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update domain");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update domain");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateRevenue = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { revenue: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Revenue updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update revenue");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update revenue");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateDescription = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { description: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
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

  const handleUpdateLinkedinUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { linkedinUrl: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("LinkedIn URL updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update LinkedIn URL");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update LinkedIn URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLogo = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { logo: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Logo URL updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update logo URL");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update logo URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateAddress = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { address: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Address updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update address");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update address");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateCity = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { city: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("City updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update city");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update city");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateState = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { state: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("State updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update state");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update state");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateCountry = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { country: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Country updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update country");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update country");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateZipCode = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { zipCode: value },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
        onUpdate(response.data);
        setSuccess("Zip code updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError("Failed to update zip code");
        setTimeout(() => setError(null), 3000);
      }
    } catch {
      setError("Failed to update zip code");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateStatus = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await companyService.updateCompany(
        company.id,
        { status: value as Company["status"] },
        token,
        selectedWorkspace?.id
      );

      if (response.success && response.data) {
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

  const handleUpdatePriority = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updatePriority(
        company.id,
        selectedWorkspace.id,
        { priority: value as Company["priority"] }
      );
      onUpdate(updatedCompany);
      setSuccess("Priority updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update priority");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateEmail = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "email",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("Email updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update email");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdatePhoneNumber = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "phoneNumber",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("Phone number updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update phone number");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateWhatsappNumber = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "whatsappNumber",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("WhatsApp number updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update WhatsApp number");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateTwitterUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "twitterUrl",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("Twitter URL updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update Twitter URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateSource = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "source",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("Source updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update source");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdatePreferredChannel = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedCompany = await companyService.updateCompanyField(
        company.id,
        selectedWorkspace.id,
        "preferredChannel",
        value
      );
      onUpdate(updatedCompany);
      setSuccess("Preferred channel updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update preferred channel");
      setTimeout(() => setError(null), 3000);
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
              <img
                src={
                  company.logo ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name || "Company")}&background=6366f1&color=ffffff&size=40&bold=true`
                }
                alt={company.name || "Company"}
                className="w-10 h-10 rounded-lg shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold leading-tight text-gray-900 break-words">
                {company.name || "Unnamed Company"}
              </h2>
              <div className="flex flex-wrap gap-1 items-center mt-1 text-xs text-gray-600">
                {company.industry && (
                  <span className="break-words">{company.industry}</span>
                )}
                {company.size && company.industry && (
                  <span className="text-gray-400">•</span>
                )}
                {company.size && (
                  <span className="break-words">{company.size}</span>
                )}
              </div>

              {/* Company Status */}
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-blue-50 rounded-md border border-blue-200">
                  <Building className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">
                    Status: {company.status}
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

          {/* Status and Size Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(company.status)}`}
            >
              {company.status}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(company.size || "")}`}
            >
              {company.size}
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
                <TabButton id="overview" label="Overview" />
                <TabButton
                  id="activities"
                  label="Activities"
                  count={company.activities?.length || 0}
                />
                <TabButton
                  id="deals"
                  label="Deals"
                  count={company.deals?.length || 0}
                />
                <TabButton
                  id="messages"
                  label="Messages"
                  count={company.messages?.length || 0}
                />
                <TabButton
                  id="notes"
                  label="Notes"
                  count={company.notes?.length || 0}
                />
                <TabButton
                  id="tasks"
                  label="Tasks"
                  count={company.tasks?.length || 0}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex overflow-hidden flex-1">
          {/* Main Content */}
          <div className="overflow-y-auto flex-1">
            {activeTab === "overview" && (
              <div className="p-4 space-y-4" data-tab="overview">
                {/* Company Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Company Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Name"
                      value={company.name}
                      isEditable={true}
                      onSave={handleUpdateName}
                    />
                    <InfoRow
                      icon={<AtSign className="w-4 h-4" />}
                      label="Domain"
                      value={company.domain}
                      isEditable={true}
                      onSave={handleUpdateDomain}
                    />
                    <InfoRow
                      icon={<Building className="w-4 h-4" />}
                      label="Industry"
                      value={company.industry}
                      isEditable={true}
                      onSave={handleUpdateIndustry}
                    />
                    <InfoRow
                      icon={<Target className="w-4 h-4" />}
                      label="Size"
                      value={company.size}
                      isEditable={true}
                      onSave={handleUpdateSize}
                      dropdownOptions={COMPANY_SIZES.map(size => ({
                        value: size,
                        label:
                          size.charAt(0).toUpperCase() +
                          size.slice(1).toLowerCase(),
                      }))}
                    />
                    <InfoRow
                      icon={<DollarSign className="w-4 h-4" />}
                      label="Revenue"
                      value={company.revenue || "-"}
                      isEditable={true}
                      onSave={handleUpdateRevenue}
                    />
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="Description"
                      value={company.description}
                      isEditable={true}
                      onSave={handleUpdateDescription}
                    />
                    <InfoRow
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      label="Status"
                      value={company.status}
                      isEditable={true}
                      onSave={handleUpdateStatus}
                      dropdownOptions={COMPANY_STATUSES.map(status => ({
                        value: status,
                        label:
                          status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase(),
                      }))}
                    />
                    <InfoRow
                      icon={<Star className="w-4 h-4" />}
                      label="Priority"
                      value={company.priority}
                      isEditable={true}
                      onSave={handleUpdatePriority}
                      dropdownOptions={[
                        { value: "HOT", label: "Hot" },
                        { value: "WARM", label: "Warm" },
                        { value: "COLD", label: "Cold" },
                      ]}
                    />
                    <InfoRow
                      icon={<Mail className="w-4 h-4" />}
                      label="Email"
                      value={company.email}
                      isEditable={true}
                      onSave={handleUpdateEmail}
                    />
                    <InfoRow
                      icon={<Phone className="w-4 h-4" />}
                      label="Phone Number"
                      value={company.phoneNumber}
                      isEditable={true}
                      onSave={handleUpdatePhoneNumber}
                    />
                    <InfoRow
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="WhatsApp"
                      value={company.whatsappNumber}
                      isEditable={true}
                      onSave={handleUpdateWhatsappNumber}
                    />
                    <InfoRow
                      icon={<Target className="w-4 h-4" />}
                      label="Source"
                      value={company.source}
                      isEditable={true}
                      onSave={handleUpdateSource}
                    />
                    <InfoRow
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="Preferred Channel"
                      value={company.preferredChannel}
                      isEditable={true}
                      onSave={handleUpdatePreferredChannel}
                      dropdownOptions={[
                        { value: "EMAIL", label: "Email" },
                        { value: "PHONE", label: "Phone" },
                        { value: "WHATSAPP", label: "WhatsApp" },
                        { value: "LINKEDIN", label: "LinkedIn" },
                        { value: "TWITTER", label: "Twitter" },
                        { value: "TELEGRAM", label: "Telegram" },
                        { value: "WEBSITE", label: "Website" },
                      ]}
                    />
                  </div>
                </div>

                {/* Social & Web */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Social & Web
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Website"
                      value={company.websiteUrl}
                      href={company.websiteUrl || undefined}
                      isEditable={true}
                      onSave={handleUpdateWebsiteUrl}
                    />
                    <InfoRow
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn"
                      value={company.linkedinUrl}
                      href={company.linkedinUrl || undefined}
                      isEditable={true}
                      onSave={handleUpdateLinkedinUrl}
                    />
                    <InfoRow
                      icon={<Twitter className="w-4 h-4" />}
                      label="Twitter"
                      value={company.twitterUrl}
                      href={company.twitterUrl || undefined}
                      isEditable={true}
                      onSave={handleUpdateTwitterUrl}
                    />
                    <InfoRow
                      icon={<ImageIcon className="w-4 h-4" />}
                      label="Logo URL"
                      value={company.logo}
                      isEditable={true}
                      onSave={handleUpdateLogo}
                    />
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Location Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="Address"
                      value={company.address}
                      isEditable={true}
                      onSave={handleUpdateAddress}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="City"
                      value={company.city}
                      isEditable={true}
                      onSave={handleUpdateCity}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="State"
                      value={company.state}
                      isEditable={true}
                      onSave={handleUpdateState}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="Country"
                      value={company.country}
                      isEditable={true}
                      onSave={handleUpdateCountry}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="Zip Code"
                      value={company.zipCode}
                      isEditable={true}
                      onSave={handleUpdateZipCode}
                    />
                  </div>
                </div>

                {/* Company Metrics */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Company Metrics
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="Lead Score"
                      value={company.leadScore?.toString() || "0"}
                    />
                    <InfoRow
                      icon={<Star className="w-4 h-4" />}
                      label="Enrichment Score"
                      value={company.enrichmentScore?.toString() || "0"}
                    />
                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Last Enriched"
                      value={
                        company.lastEnrichedAt
                          ? formatDate(company.lastEnrichedAt)
                          : "Never"
                      }
                    />
                  </div>
                </div>

                {/* Owner */}
                {company.owner && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900">
                      Owner
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="Assigned To"
                        value={company.owner.name}
                      />
                    </div>
                  </div>
                )}

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
                          {company.tags && company.tags.length > 0 ? (
                            company.tags.map((tag, index) => {
                              // Handle the nested tag structure from API
                              let tagName: string | undefined,
                                assignmentId: string | undefined;

                              if (typeof tag === "string") {
                                tagName = tag;
                                assignmentId = tag; // Use the string as assignment ID for now
                              } else if (tag && typeof tag === "object") {
                                // Handle nested structure: tag.tag.name and tag.id (assignment ID)
                                if (
                                  "tag" in tag &&
                                  tag.tag &&
                                  typeof tag.tag === "object" &&
                                  "name" in tag.tag
                                ) {
                                  tagName = (tag.tag as { name: string }).name;
                                  assignmentId = (tag as { id: string }).id; // This is the assignment ID
                                } else if ("name" in tag && tag.name) {
                                  tagName = (tag as { name: string }).name;
                                  assignmentId = (tag as { id: string }).id;
                                }
                              }

                              if (!tagName || !assignmentId) {
                                //

                                return null;
                              }

                              return (
                                <div
                                  key={index}
                                  className="flex items-center px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 w-fit justify-self-start"
                                >
                                  <span className="p-1">{tagName}</span>
                                  <button
                                    onClick={() =>
                                      handleRemoveTag(assignmentId)
                                    }
                                    disabled={removingTag === assignmentId}
                                    className="flex-shrink-0 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                  >
                                    {removingTag === assignmentId ? (
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
                                  const isAssigned = company.tags?.some(
                                    companyTag => {
                                      let companyTagId;
                                      if (typeof companyTag === "string") {
                                        // For string tags, we need to find the actual tag ID
                                        const matchingTag = availableTags.find(
                                          t => t.name === companyTag
                                        );
                                        companyTagId = matchingTag?.id;
                                      } else if (
                                        companyTag &&
                                        typeof companyTag === "object"
                                      ) {
                                        // Handle nested structure
                                        if (
                                          companyTag.tag &&
                                          (
                                            companyTag.tag as Record<
                                              string,
                                              unknown
                                            >
                                          ).id
                                        ) {
                                          companyTagId = (
                                            companyTag.tag as Record<
                                              string,
                                              unknown
                                            >
                                          ).id as string;
                                        } else if (companyTag.id) {
                                          companyTagId = companyTag.id;
                                        }
                                      }
                                      return companyTagId === tag.id;
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
                  entityId={company.id}
                  entityType="company"
                  onRefresh={refreshCompanyData}
                />
              </div>
            )}

            {activeTab === "deals" && (
              <DealsSection entityId={company.id} entityType="company" />
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

                {company.messages && company.messages.length > 0 ? (
                  <div className="space-y-3">
                    {company.messages.map((message, index) => (
                      <div
                        key={(message.id as string) || index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-1 space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  message.channel === "EMAIL"
                                    ? "bg-blue-500"
                                    : message.channel === "SMS"
                                      ? "bg-green-500"
                                      : message.channel === "WHATSAPP"
                                        ? "bg-green-600"
                                        : message.channel === "LINKEDIN"
                                          ? "bg-blue-600"
                                          : "bg-gray-500"
                                }`}
                              />
                              <span className="text-xs font-medium text-gray-700 uppercase">
                                {(message.channel as string) || "UNKNOWN"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {message.createdAt
                                  ? formatDate(message.createdAt as string)
                                  : "Unknown date"}
                              </span>
                            </div>
                            <h4 className="mb-1 text-sm font-medium text-gray-900">
                              {(message.subject as string) || "No Subject"}
                            </h4>
                            {Boolean(message.content) && (
                              <p className="text-xs text-gray-600 line-clamp-3">
                                {message.content as string}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <MessageSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <button className="mt-2 text-xs text-blue-600 hover:text-blue-700">
                      Send first message
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="p-4" data-tab="notes">
                <NotesSection
                  entityId={company.id}
                  entityType="company"
                  onRefresh={refreshCompanyData}
                />
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="p-4" data-tab="tasks">
                <TaskSection
                  entityId={company.id}
                  entityType="company"
                  entityName={company.name || "Company"}
                  onRefresh={refreshCompanyData}
                />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="p-2 space-y-2 w-16 bg-gray-50 border-l border-gray-200">
            {navigationConfig.map(nav => (
              <SidebarIcon
                key={nav.id}
                id={nav.id}
                icon={nav.icon}
                count={nav.count}
                isActive={activeTab === nav.id}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPanel;
