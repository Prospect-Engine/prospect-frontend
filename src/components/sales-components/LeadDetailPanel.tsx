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
  Calendar,
  Star,
  Activity,
  TrendingUp,
  ExternalLink,
  Target,
  Briefcase,
  AtSign,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Tag,
  Zap,
  MapPin,
  FileText,
  Link,
  Image,
  Gift,
  ChevronLeft,
  ChevronRight,
  // New icons for dual navigation
  ClipboardList,
  MessageCircle,
  StickyNote,
  CheckSquare,
} from "lucide-react";
import { Contact } from "../../types/sales-types";
import {
  contactService,
  CONTACT_STATUSES,
} from "../../services/sales-services/contactService";
import {
  tagService,
  Tag as TagInterface,
  TagAssignment,
} from "../../services/sales-services/tagService";
import whatsappService from "../../services/sales-services/whatsappService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import NotesSection from "./NotesSection";
import TaskSection from "./TaskSection";
import ActivitiesSection from "./ActivitiesSection";
import DealsSection from "./DealsSection";

interface LeadDetailPanelProps {
  lead: Contact;
  onClose: () => void;
  onUpdate: (lead: Contact) => void;
}

const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({
  lead,
  onClose,
  onUpdate,
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
  const [tagAssignments, setTagAssignments] = useState<Record<string, string>>(
    {}
  ); // tagName -> assignmentId

  // LinkedIn Complex Fields States
  const [linkedinExperience, setLinkedinExperience] = useState<any[]>([]);
  const [linkedinSkills, setLinkedinSkills] = useState<any[]>([]);
  const [linkedinJobPreferences, setLinkedinJobPreferences] = useState<any[]>(
    []
  );
  const [loadingLinkedInData, setLoadingLinkedInData] = useState(false);
  const [showLinkedInExperienceInput, setShowLinkedInExperienceInput] =
    useState(false);
  const [showLinkedInSkillInput, setShowLinkedInSkillInput] = useState(false);
  const [showLinkedInJobPreferenceInput, setShowLinkedInJobPreferenceInput] =
    useState(false);
  const [editingLinkedInItem, setEditingLinkedInItem] = useState<{
    type: "experience" | "skill" | "jobPreference";
    id: string;
    data: any;
  } | null>(null);

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

  const getLeadTypeColor = (leadType: string) => {
    switch (leadType) {
      case "HOT":
        return "bg-red-50 text-red-700 border-red-200";
      case "WARM":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "COLD":
        return "bg-blue-50 text-blue-700 border-blue-200";
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
          entityId: lead.id,
          entityType: "contact",
          workspaceId: selectedWorkspace.id,
          organizationId: selectedOrganization.id,
        },
        token
      );

      if (response.success) {
        setSuccess("Tag assigned successfully");
        setShowTagDropdown(false);
        // Refresh the lead data from server to get the latest tag assignments
        await refreshLeadData();
      } else {
        setError(response.error || "Failed to assign tag");
      }
    } catch (err) {
      setError("Failed to assign tag");
    } finally {
      setAssigningTag(false);
    }
  };

  // Remove tag from contact
  const handleRemoveTag = async (assignmentId: string) => {
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
        // Refresh the lead data from server to get the latest tag assignments
        await refreshLeadData();
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

  // Load tag assignments for this contact
  const loadTagAssignments = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization || !lead.id)
      return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await tagService.executeTagOperation(
        {
          operation: "get_tag_assignments",
          workspaceId: selectedWorkspace.id,
          organizationId: selectedOrganization.id,
          entityId: lead.id,
          entityType: "contact",
        },
        token
      );

      if (response.success && response.data) {
        const assignments: Record<string, string> = {};

        // Filter assignments for this specific contact
        const contactAssignments = response.data.filter(
          (assignment: any) =>
            assignment.tag && assignment.tag.name && assignment.id
        );

        contactAssignments.forEach((assignment: any) => {
          if (assignment.tag && assignment.tag.name && assignment.id) {
            assignments[assignment.tag.name] = assignment.id;
          }
        });

        setTagAssignments(assignments);
      } else {
      }
    } catch (err) {}
  }, [user, selectedWorkspace, selectedOrganization, lead.id]);

  // Load tag assignments when component mounts or lead changes
  useEffect(() => {
    loadTagAssignments();
  }, [loadTagAssignments]);

  // Debug: Log lead tags structure
  useEffect(() => {
    if (lead.tags && lead.tags.length > 0) {
    }
  }, [lead.tags]);

  // Debug: Log tag assignments
  useEffect(() => {
    if (Object.keys(tagAssignments).length > 0) {
    }
  }, [tagAssignments]);

  // Refresh lead data from server
  const refreshLeadData = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.getContacts(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        const updatedLead = response.data.find(
          (contact: Contact) => contact.id === lead.id
        );
        if (updatedLead) {
          onUpdate(updatedLead);
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
        count: lead.activities?.length || 0,
      },
      {
        id: "deals",
        label: "Deals",
        icon: DollarSign,
        count: lead.deals?.length || 0,
      },
      {
        id: "messages",
        label: "Messages",
        icon: MessageCircle,
        count: lead.messages?.length || 0,
      },
      {
        id: "notes",
        label: "Notes",
        icon: StickyNote,
        count: lead.notes?.length || 0,
      },
      {
        id: "tasks",
        label: "Tasks",
        icon: CheckSquare,
        count: lead.tasks?.length || 0,
      },
    ],
    [
      lead.activities?.length,
      lead.deals?.length,
      lead.messages?.length,
      lead.notes?.length,
      lead.tasks?.length,
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

  // Load LinkedIn complex data when component mounts
  useEffect(() => {
    const loadLinkedInData = async () => {
      if (!selectedWorkspace || !selectedOrganization || !user) return;

      setLoadingLinkedInData(true);
      try {
        const token = localStorage.getItem("crm_access_token");
        if (!token) return;

        // Load LinkedIn Experience
        const experienceResponse = await contactService.getLinkedInExperience(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (experienceResponse.success && experienceResponse.data) {
          setLinkedinExperience(experienceResponse.data);
        }

        // Load LinkedIn Skills
        const skillsResponse = await contactService.getLinkedInSkills(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (skillsResponse.success && skillsResponse.data) {
          setLinkedinSkills(skillsResponse.data);
        }

        // Load LinkedIn Job Preferences
        const jobPrefResponse = await contactService.getLinkedInJobPreferences(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (jobPrefResponse.success && jobPrefResponse.data) {
          setLinkedinJobPreferences(jobPrefResponse.data);
        }
      } catch (error) {
      } finally {
        setLoadingLinkedInData(false);
      }
    };

    loadLinkedInData();
  }, [lead.id, selectedWorkspace, selectedOrganization, user]);

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
      <Icon className="w-3.5 h-3.5" />
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
      const updatedLead = await contactService.updateName(
        lead.id,
        selectedWorkspace.id,
        { name: value }
      );
      onUpdate(updatedLead);
      setSuccess("Name updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update name");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateEmail = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateEmail(
        lead.id,
        selectedWorkspace.id,
        { email: value }
      );
      onUpdate(updatedLead);
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
      const updatedLead = await contactService.updatePhoneNumber(
        lead.id,
        selectedWorkspace.id,
        { phoneNumber: value }
      );
      onUpdate(updatedLead);
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
      const updatedLead = await contactService.updateWhatsappNumber(
        lead.id,
        selectedWorkspace.id,
        { whatsappNumber: value }
      );
      onUpdate(updatedLead);
      setSuccess("WhatsApp number updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update WhatsApp number");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinUrl(
        lead.id,
        selectedWorkspace.id,
        { linkedinUrl: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn URL updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateTwitterUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateTwitterUrl(
        lead.id,
        selectedWorkspace.id,
        { twitterUrl: value }
      );
      onUpdate(updatedLead);
      setSuccess("Twitter URL updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update Twitter URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateWebsiteUrl = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateWebsiteUrl(
        lead.id,
        selectedWorkspace.id,
        { websiteUrl: value }
      );
      onUpdate(updatedLead);
      setSuccess("Website URL updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update website URL");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateJobTitle = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateJobTitle(
        lead.id,
        selectedWorkspace.id,
        { jobTitle: value }
      );
      onUpdate(updatedLead);
      setSuccess("Job title updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update job title");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateStatus = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateStatus(
        lead.id,
        selectedWorkspace.id,
        { status: value as Contact["status"] }
      );
      onUpdate(updatedLead);
      setSuccess("Status updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update status");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdatePriority = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updatePriority(
        lead.id,
        selectedWorkspace.id,
        { priority: value as Contact["priority"] }
      );
      onUpdate(updatedLead);
      setSuccess("Priority updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update priority");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateIndustry = async (value: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const updatedLead = await contactService.updateContact(
        lead.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        { industry: value },
        localStorage.getItem("crm_access_token") || ""
      );
      if (updatedLead.success && updatedLead.data) {
        onUpdate(updatedLead.data);
        setSuccess("Industry updated successfully");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch {
      setError("Failed to update industry");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLeadType = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLeadType(
        lead.id,
        selectedWorkspace.id,
        { leadType: value as Contact["leadType"] }
      );
      onUpdate(updatedLead);
      setSuccess("Lead type updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update lead type");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLeadScore = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLeadScore(
        lead.id,
        selectedWorkspace.id,
        { leadScore: parseInt(value) }
      );
      onUpdate(updatedLead);
      setSuccess("Lead score updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update lead score");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdatePreferredChannel = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updatePreferredChannel(
        lead.id,
        selectedWorkspace.id,
        { preferredChannel: value as Contact["preferredChannel"] }
      );
      onUpdate(updatedLead);
      setSuccess("Preferred channel updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update preferred channel");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateSource = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateSource(
        lead.id,
        selectedWorkspace.id,
        { source: value }
      );
      onUpdate(updatedLead);
      setSuccess("Source updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update source");
      setTimeout(() => setError(null), 3000);
    }
  };

  // LinkedIn field update handlers
  const handleUpdateLinkedinUrnId = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinUrnId(
        lead.id,
        selectedWorkspace.id,
        { linkedinUrnId: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn URN ID updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn URN ID");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinPublicId = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinPublicId(
        lead.id,
        selectedWorkspace.id,
        { linkedinPublicId: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn public ID updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn public ID");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinLocation = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinLocation(
        lead.id,
        selectedWorkspace.id,
        { linkedinLocation: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn location updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn location");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinHeadline = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinHeadline(
        lead.id,
        selectedWorkspace.id,
        { linkedinHeadline: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn headline updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn headline");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinAbout = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinAbout(
        lead.id,
        selectedWorkspace.id,
        { linkedinAbout: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn about updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn about");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinJoined = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinJoined(
        lead.id,
        selectedWorkspace.id,
        { linkedinJoined: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn joined date updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn joined date");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinBirthday = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinBirthday(
        lead.id,
        selectedWorkspace.id,
        { linkedinBirthday: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn birthday updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn birthday");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinConnected = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinConnected(
        lead.id,
        selectedWorkspace.id,
        { linkedinConnected: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn connected date updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn connected date");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinAddress = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinAddress(
        lead.id,
        selectedWorkspace.id,
        { linkedinAddress: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn address updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn address");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinIsOpenToWork = async (value: boolean) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinIsOpenToWork(
        lead.id,
        selectedWorkspace.id,
        { linkedinIsOpenToWork: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn open to work status updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn open to work status");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinProfilePhoto = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinProfilePhoto(
        lead.id,
        selectedWorkspace.id,
        { linkedinProfilePhoto: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn profile photo updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn profile photo");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinProfileUpdated = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinProfileUpdated(
        lead.id,
        selectedWorkspace.id,
        { linkedinProfileUpdated: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn profile updated date updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn profile updated date");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleUpdateLinkedinContactInfoUpdated = async (value: string) => {
    if (!selectedWorkspace) return;

    try {
      const updatedLead = await contactService.updateLinkedinContactInfoUpdated(
        lead.id,
        selectedWorkspace.id,
        { linkedinContactInfoUpdated: value }
      );
      onUpdate(updatedLead);
      setSuccess("LinkedIn contact info updated date updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Failed to update LinkedIn contact info updated date");
      setTimeout(() => setError(null), 3000);
    }
  };

  // LinkedIn Complex Field Handlers
  const handleCreateLinkedInExperience = async (data: any) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.createLinkedInExperience(
        lead.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn experience added successfully");
        // Reload LinkedIn data
        const experienceResponse = await contactService.getLinkedInExperience(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (experienceResponse.success && experienceResponse.data) {
          setLinkedinExperience(experienceResponse.data);
        }
        setShowLinkedInExperienceInput(false);
      } else {
        setError(response.error || "Failed to add LinkedIn experience");
      }
    } catch (error) {
      setError("Failed to add LinkedIn experience");
    }
  };

  const handleUpdateLinkedInExperience = async (
    experienceId: string,
    data: any
  ) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.updateLinkedInExperience(
        lead.id,
        experienceId,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn experience updated successfully");
        // Reload LinkedIn data
        const experienceResponse = await contactService.getLinkedInExperience(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (experienceResponse.success && experienceResponse.data) {
          setLinkedinExperience(experienceResponse.data);
        }
        setEditingLinkedInItem(null);
      } else {
        setError(response.error || "Failed to update LinkedIn experience");
      }
    } catch (error) {
      setError("Failed to update LinkedIn experience");
    }
  };

  const handleDeleteLinkedInExperience = async (experienceId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.deleteLinkedInExperience(
        lead.id,
        experienceId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn experience deleted successfully");
        // Reload LinkedIn data
        const experienceResponse = await contactService.getLinkedInExperience(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (experienceResponse.success && experienceResponse.data) {
          setLinkedinExperience(experienceResponse.data);
        }
      } else {
        setError(response.error || "Failed to delete LinkedIn experience");
      }
    } catch (error) {
      setError("Failed to delete LinkedIn experience");
    }
  };

  const handleCreateLinkedInSkill = async (data: any) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.createLinkedInSkill(
        lead.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn skill added successfully");
        // Reload LinkedIn data
        const skillsResponse = await contactService.getLinkedInSkills(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (skillsResponse.success && skillsResponse.data) {
          setLinkedinSkills(skillsResponse.data);
        }
        setShowLinkedInSkillInput(false);
      } else {
        setError(response.error || "Failed to add LinkedIn skill");
      }
    } catch (error) {
      setError("Failed to add LinkedIn skill");
    }
  };

  const handleUpdateLinkedInSkill = async (skillId: string, data: any) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.updateLinkedInSkill(
        lead.id,
        skillId,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn skill updated successfully");
        // Reload LinkedIn data
        const skillsResponse = await contactService.getLinkedInSkills(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (skillsResponse.success && skillsResponse.data) {
          setLinkedinSkills(skillsResponse.data);
        }
        setEditingLinkedInItem(null);
      } else {
        setError(response.error || "Failed to update LinkedIn skill");
      }
    } catch (error) {
      setError("Failed to update LinkedIn skill");
    }
  };

  const handleDeleteLinkedInSkill = async (skillId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.deleteLinkedInSkill(
        lead.id,
        skillId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn skill deleted successfully");
        // Reload LinkedIn data
        const skillsResponse = await contactService.getLinkedInSkills(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (skillsResponse.success && skillsResponse.data) {
          setLinkedinSkills(skillsResponse.data);
        }
      } else {
        setError(response.error || "Failed to delete LinkedIn skill");
      }
    } catch (error) {
      setError("Failed to delete LinkedIn skill");
    }
  };

  const handleCreateLinkedInJobPreference = async (data: any) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.createLinkedInJobPreference(
        lead.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn job preference added successfully");
        // Reload LinkedIn data
        const jobPrefResponse = await contactService.getLinkedInJobPreferences(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (jobPrefResponse.success && jobPrefResponse.data) {
          setLinkedinJobPreferences(jobPrefResponse.data);
        }
        setShowLinkedInJobPreferenceInput(false);
      } else {
        setError(response.error || "Failed to add LinkedIn job preference");
      }
    } catch (error) {
      setError("Failed to add LinkedIn job preference");
    }
  };

  const handleUpdateLinkedInJobPreference = async (
    jobPrefId: string,
    data: any
  ) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.updateLinkedInJobPreference(
        lead.id,
        jobPrefId,
        selectedWorkspace.id,
        selectedOrganization.id,
        data,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn job preference updated successfully");
        // Reload LinkedIn data
        const jobPrefResponse = await contactService.getLinkedInJobPreferences(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (jobPrefResponse.success && jobPrefResponse.data) {
          setLinkedinJobPreferences(jobPrefResponse.data);
        }
        setEditingLinkedInItem(null);
      } else {
        setError(response.error || "Failed to update LinkedIn job preference");
      }
    } catch (error) {
      setError("Failed to update LinkedIn job preference");
    }
  };

  const handleDeleteLinkedInJobPreference = async (jobPrefId: string) => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await contactService.deleteLinkedInJobPreference(
        lead.id,
        jobPrefId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setSuccess("LinkedIn job preference deleted successfully");
        // Reload LinkedIn data
        const jobPrefResponse = await contactService.getLinkedInJobPreferences(
          lead.id,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
        if (jobPrefResponse.success && jobPrefResponse.data) {
          setLinkedinJobPreferences(jobPrefResponse.data);
        }
      } else {
        setError(response.error || "Failed to delete LinkedIn job preference");
      }
    } catch (error) {
      setError("Failed to delete LinkedIn job preference");
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
                  lead.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.name || "Contact")}&background=6366f1&color=ffffff&size=40&bold=true`
                }
                alt={lead.name || "Contact"}
                className="w-10 h-10 rounded-lg shadow-sm"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold leading-tight text-gray-900 break-words">
                {lead.name || "Unnamed Contact"}
              </h2>
              <div className="flex flex-wrap gap-1 items-center mt-1 text-xs text-gray-600">
                {lead.jobTitle && (
                  <span className="break-words">{lead.jobTitle}</span>
                )}
                {lead.company && lead.jobTitle && (
                  <span className="text-gray-400">•</span>
                )}
                {lead.company && (
                  <span className="break-words">
                    {lead.company.name as string}
                  </span>
                )}
              </div>

              {/* Lead Score */}
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-yellow-50 rounded-md border border-yellow-200">
                  <Star className="w-3 h-3 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">
                    Lead Score: {lead.leadScore}
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

          {/* Status and Type Badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(lead.status)}`}
            >
              {lead.status}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getLeadTypeColor(lead.leadType)}`}
            >
              {lead.leadType}
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
                {navigationConfig.map(nav => (
                  <TabButton
                    key={nav.id}
                    id={nav.id}
                    label={nav.label}
                    icon={nav.icon}
                    count={nav.count}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content with Right Sidebar */}
        <div className="flex overflow-hidden flex-1">
          {/* Main Content */}
          <div className="overflow-y-auto flex-1">
            {activeTab === "overview" && (
              <div className="p-4 space-y-4" data-tab="overview">
                {/* Contact Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Contact Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<User className="w-4 h-4" />}
                      label="Name"
                      value={lead.name}
                      isEditable={true}
                      onSave={handleUpdateName}
                    />
                    <InfoRow
                      icon={<AtSign className="w-4 h-4" />}
                      label="Email"
                      value={lead.email}
                      isEditable={true}
                      onSave={handleUpdateEmail}
                    />
                    <InfoRow
                      icon={<Phone className="w-4 h-4" />}
                      label="Phone"
                      value={lead.phoneNumber}
                      isEditable={true}
                      onSave={handleUpdatePhoneNumber}
                    />
                    <InfoRow
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="WhatsApp"
                      value={lead.whatsappNumber}
                      isEditable={true}
                      onSave={handleUpdateWhatsappNumber}
                    />
                    <InfoRow
                      icon={<Briefcase className="w-4 h-4" />}
                      label="Job Title"
                      value={lead.jobTitle}
                      isEditable={true}
                      onSave={handleUpdateJobTitle}
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
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn"
                      value={lead.linkedinUrl}
                      href={lead.linkedinUrl || undefined}
                      isEditable={true}
                      onSave={handleUpdateLinkedinUrl}
                    />
                    <InfoRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Twitter"
                      value={lead.twitterUrl}
                      isEditable={true}
                      onSave={handleUpdateTwitterUrl}
                    />
                    <InfoRow
                      icon={<Globe className="w-4 h-4" />}
                      label="Website"
                      value={lead.websiteUrl}
                      href={lead.websiteUrl || undefined}
                      isEditable={true}
                      onSave={handleUpdateWebsiteUrl}
                    />
                  </div>
                </div>

                {/* Company Information */}
                {lead.company && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900">
                      Company
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<Building className="w-4 h-4" />}
                        label="Company"
                        value={lead.company.name as string}
                      />
                    </div>
                  </div>
                )}

                {/* Lead Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    Lead Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      label="Status"
                      value={lead.status}
                      isEditable={true}
                      onSave={handleUpdateStatus}
                      dropdownOptions={CONTACT_STATUSES.map(status => ({
                        value: status,
                        label:
                          status.charAt(0).toUpperCase() +
                          status.slice(1).toLowerCase(),
                      }))}
                    />
                    <InfoRow
                      icon={<Star className="w-4 h-4" />}
                      label="Priority"
                      value={lead.priority}
                      isEditable={true}
                      onSave={handleUpdatePriority}
                      dropdownOptions={[
                        { value: "HOT", label: "Hot" },
                        { value: "WARM", label: "Warm" },
                        { value: "COLD", label: "Cold" },
                      ]}
                    />
                    <InfoRow
                      icon={<Target className="w-4 h-4" />}
                      label="Source"
                      value={lead.source}
                      isEditable={true}
                      onSave={handleUpdateSource}
                    />
                    <InfoRow
                      icon={<Briefcase className="w-4 h-4" />}
                      label="Industry"
                      value={lead.industry}
                      isEditable={true}
                      onSave={handleUpdateIndustry}
                    />
                    <InfoRow
                      icon={<TrendingUp className="w-4 h-4" />}
                      label="Lead Type"
                      value={lead.leadType}
                      isEditable={true}
                      onSave={handleUpdateLeadType}
                      dropdownOptions={[
                        { value: "COLD", label: "Cold" },
                        { value: "WARM", label: "Warm" },
                        { value: "HOT", label: "Hot" },
                      ]}
                    />
                    <InfoRow
                      icon={<Star className="w-4 h-4" />}
                      label="Lead Score"
                      value={lead.leadScore.toString()}
                      isEditable={true}
                      onSave={handleUpdateLeadScore}
                    />
                    <InfoRow
                      icon={<MessageSquare className="w-4 h-4" />}
                      label="Preferred Channel"
                      value={lead.preferredChannel}
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
                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Last Contacted"
                      value={
                        lead.lastContactedAt
                          ? formatDate(lead.lastContactedAt)
                          : "Never"
                      }
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4" />}
                      label="Next Follow-up"
                      value={
                        lead.nextFollowUpAt
                          ? formatDate(lead.nextFollowUpAt)
                          : "Not scheduled"
                      }
                    />
                  </div>
                </div>

                {/* LinkedIn Information */}
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-900">
                    LinkedIn Information
                  </h3>
                  <div className="space-y-1">
                    <InfoRow
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn URN ID"
                      value={lead.linkedinUrnId}
                      isEditable={true}
                      onSave={handleUpdateLinkedinUrnId}
                    />
                    <InfoRow
                      icon={<Linkedin className="w-4 h-4" />}
                      label="LinkedIn Public ID"
                      value={lead.linkedinPublicId}
                      isEditable={true}
                      onSave={handleUpdateLinkedinPublicId}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="LinkedIn Location"
                      value={lead.linkedinLocation}
                      isEditable={true}
                      onSave={handleUpdateLinkedinLocation}
                    />
                    <InfoRow
                      icon={<Briefcase className="w-4 h-4" />}
                      label="LinkedIn Headline"
                      value={lead.linkedinHeadline}
                      isEditable={true}
                      onSave={handleUpdateLinkedinHeadline}
                    />
                    <InfoRow
                      icon={<FileText className="w-4 h-4" />}
                      label="LinkedIn About"
                      value={lead.linkedinAbout}
                      isEditable={true}
                      onSave={handleUpdateLinkedinAbout}
                    />
                    <InfoRow
                      icon={<Calendar className="w-4 h-4" />}
                      label="LinkedIn Joined"
                      value={lead.linkedinJoined}
                      isEditable={true}
                      onSave={handleUpdateLinkedinJoined}
                    />
                    <InfoRow
                      icon={<Gift className="w-4 h-4" />}
                      label="LinkedIn Birthday"
                      value={lead.linkedinBirthday}
                      isEditable={true}
                      onSave={handleUpdateLinkedinBirthday}
                    />
                    <InfoRow
                      icon={<Link className="w-4 h-4" />}
                      label="LinkedIn Connected"
                      value={lead.linkedinConnected}
                      isEditable={true}
                      onSave={handleUpdateLinkedinConnected}
                    />
                    <InfoRow
                      icon={<MapPin className="w-4 h-4" />}
                      label="LinkedIn Address"
                      value={lead.linkedinAddress}
                      isEditable={true}
                      onSave={handleUpdateLinkedinAddress}
                    />
                    <InfoRow
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      label="Open to Work"
                      value={lead.linkedinIsOpenToWork ? "Yes" : "No"}
                      isEditable={true}
                      onSave={value =>
                        handleUpdateLinkedinIsOpenToWork(value === "Yes")
                      }
                      dropdownOptions={[
                        { value: "Yes", label: "Yes" },
                        { value: "No", label: "No" },
                      ]}
                    />
                    <InfoRow
                      icon={<Image className="w-4 h-4" />}
                      label="LinkedIn Profile Photo"
                      value={lead.linkedinProfilePhoto}
                      href={lead.linkedinProfilePhoto || undefined}
                      isEditable={true}
                      onSave={handleUpdateLinkedinProfilePhoto}
                    />
                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Profile Updated"
                      value={lead.linkedinProfileUpdated}
                      isEditable={true}
                      onSave={handleUpdateLinkedinProfileUpdated}
                    />
                    <InfoRow
                      icon={<Clock className="w-4 h-4" />}
                      label="Contact Info Updated"
                      value={lead.linkedinContactInfoUpdated}
                      isEditable={true}
                      onSave={handleUpdateLinkedinContactInfoUpdated}
                    />
                  </div>
                </div>

                {/* LinkedIn Experience */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      LinkedIn Experience
                    </h3>
                    <button
                      onClick={() => setShowLinkedInExperienceInput(true)}
                      className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-blue-600 rounded-md transition-colors duration-150 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Experience
                    </button>
                  </div>

                  {/* Add Experience Input */}
                  {showLinkedInExperienceInput && (
                    <div className="p-3 mb-4 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-blue-900">
                          Add New Experience
                        </h4>
                        <button
                          onClick={() => setShowLinkedInExperienceInput(false)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <form
                        onSubmit={async e => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);

                          // Build data object and filter out empty strings
                          const rawData = {
                            position: formData.get("position") as string,
                            company: formData.get("company") as string,
                            duration: formData.get("duration") as string,
                            location: formData.get("location") as string,
                            description: formData.get("description") as string,
                            skills: formData.get("skills") as string,
                            url: formData.get("url") as string,
                          };

                          // Filter out empty strings and convert to null for optional fields
                          const data = Object.fromEntries(
                            Object.entries(rawData).map(([key, value]) => {
                              if (value === "" && key !== "position") {
                                return [key, null];
                              }
                              return [key, value];
                            })
                          );

                          await handleCreateLinkedInExperience(data);
                          setShowLinkedInExperienceInput(false);
                          if (e.currentTarget) {
                            e.currentTarget.reset();
                          }
                        }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="position"
                            placeholder="Position *"
                            required
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="company"
                            placeholder="Company"
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="duration"
                            placeholder="Duration"
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="skills"
                            placeholder="Skills"
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="url"
                            name="url"
                            placeholder="URL"
                            className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <textarea
                          name="description"
                          placeholder="Description"
                          rows={2}
                          className="px-2 py-1 mt-2 w-full text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Add Experience
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShowLinkedInExperienceInput(false)
                            }
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
                    {loadingLinkedInData ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="w-4 h-4 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                      </div>
                    ) : linkedinExperience.length > 0 ? (
                      linkedinExperience.map(experience => (
                        <div
                          key={experience.id}
                          className="p-3 bg-gray-50 rounded-md border border-gray-200"
                        >
                          {editingLinkedInItem?.type === "experience" &&
                          editingLinkedInItem.id === experience.id ? (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-medium text-gray-900">
                                  Edit Experience
                                </h4>
                                <button
                                  onClick={() => setEditingLinkedInItem(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <form
                                onSubmit={async e => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.currentTarget
                                  );

                                  // Build data object and filter out empty strings
                                  const rawData = {
                                    position: formData.get(
                                      "position"
                                    ) as string,
                                    company: formData.get("company") as string,
                                    duration: formData.get(
                                      "duration"
                                    ) as string,
                                    location: formData.get(
                                      "location"
                                    ) as string,
                                    description: formData.get(
                                      "description"
                                    ) as string,
                                    skills: formData.get("skills") as string,
                                    url: formData.get("url") as string,
                                  };

                                  // Filter out empty strings and convert to null for optional fields
                                  const data = Object.fromEntries(
                                    Object.entries(rawData).map(
                                      ([key, value]) => {
                                        if (
                                          value === "" &&
                                          key !== "position"
                                        ) {
                                          return [key, null];
                                        }
                                        return [key, value];
                                      }
                                    )
                                  );

                                  await handleUpdateLinkedInExperience(
                                    experience.id,
                                    data
                                  );
                                  setEditingLinkedInItem(null);
                                }}
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    name="position"
                                    defaultValue={experience.position}
                                    placeholder="Position *"
                                    required
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    name="company"
                                    defaultValue={experience.company || ""}
                                    placeholder="Company"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    name="duration"
                                    defaultValue={experience.duration || ""}
                                    placeholder="Duration"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    name="location"
                                    defaultValue={experience.location || ""}
                                    placeholder="Location"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    name="skills"
                                    defaultValue={experience.skills || ""}
                                    placeholder="Skills"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                  <input
                                    type="url"
                                    name="url"
                                    defaultValue={experience.url || ""}
                                    placeholder="URL"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                                <textarea
                                  name="description"
                                  defaultValue={experience.description || ""}
                                  placeholder="Description"
                                  rows={2}
                                  className="px-2 py-1 mt-2 w-full text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    type="submit"
                                    className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                                  >
                                    Update Experience
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLinkedInItem(null)}
                                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {experience.position}
                                </div>
                                {experience.company && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    {experience.company}
                                  </div>
                                )}
                                {experience.duration && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    {experience.duration}
                                  </div>
                                )}
                                {experience.location && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    📍 {experience.location}
                                  </div>
                                )}
                                {experience.description && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    {experience.description}
                                  </div>
                                )}
                                {experience.skills && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    🛠️ {experience.skills}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 items-center ml-2">
                                <button
                                  onClick={() =>
                                    setEditingLinkedInItem({
                                      type: "experience",
                                      id: experience.id,
                                      data: experience,
                                    })
                                  }
                                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteLinkedInExperience(
                                      experience.id
                                    )
                                  }
                                  className="p-1 text-gray-400 transition-colors hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-xs text-center text-gray-500">
                        No experience entries found
                      </div>
                    )}
                  </div>
                </div>

                {/* LinkedIn Skills */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      LinkedIn Skills
                    </h3>
                    <button
                      onClick={() => setShowLinkedInSkillInput(true)}
                      className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-blue-600 rounded-md transition-colors duration-150 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Skill
                    </button>
                  </div>

                  {/* Add Skill Input */}
                  {showLinkedInSkillInput && (
                    <div className="p-3 mb-4 bg-blue-50 rounded-md border border-blue-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-blue-900">
                          Add New Skill
                        </h4>
                        <button
                          onClick={() => setShowLinkedInSkillInput(false)}
                          className="text-blue-400 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <form
                        onSubmit={async e => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const data = {
                            skillName: formData.get("skillName") as string,
                          };
                          await handleCreateLinkedInSkill(data);
                          setShowLinkedInSkillInput(false);
                          e.currentTarget.reset();
                        }}
                      >
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="skillName"
                            placeholder="Skill Name *"
                            required
                            className="flex-1 px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Add Skill
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowLinkedInSkillInput(false)}
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
                    {loadingLinkedInData ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="w-4 h-4 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                      </div>
                    ) : linkedinSkills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {linkedinSkills.map(skill => (
                          <div
                            key={skill.id}
                            className="flex gap-2 items-center px-3 py-2 text-blue-700 bg-blue-50 rounded-full border border-blue-200"
                          >
                            {editingLinkedInItem?.type === "skill" &&
                            editingLinkedInItem.id === skill.id ? (
                              <form
                                onSubmit={async e => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.currentTarget
                                  );
                                  const data = {
                                    skillName: formData.get(
                                      "skillName"
                                    ) as string,
                                  };
                                  await handleUpdateLinkedInSkill(
                                    skill.id,
                                    data
                                  );
                                  setEditingLinkedInItem(null);
                                }}
                                className="flex gap-2 items-center"
                              >
                                <input
                                  type="text"
                                  name="skillName"
                                  defaultValue={skill.skillName}
                                  placeholder="Skill Name *"
                                  required
                                  className="px-2 py-1 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="submit"
                                  className="p-0.5 text-blue-600 hover:text-blue-800"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingLinkedInItem(null)}
                                  className="p-0.5 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </form>
                            ) : (
                              <>
                                <span className="text-xs font-medium">
                                  {skill.skillName}
                                </span>
                                <div className="flex gap-1 items-center">
                                  <button
                                    onClick={() =>
                                      setEditingLinkedInItem({
                                        type: "skill",
                                        id: skill.id,
                                        data: skill,
                                      })
                                    }
                                    className="p-0.5 text-blue-400 hover:text-blue-600 transition-colors"
                                  >
                                    <Edit className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteLinkedInSkill(skill.id)
                                    }
                                    className="p-0.5 text-blue-400 hover:text-red-600 transition-colors"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-xs text-center text-gray-500">
                        No skills found
                      </div>
                    )}
                  </div>
                </div>

                {/* LinkedIn Job Preferences */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      LinkedIn Job Preferences
                    </h3>
                    <button
                      onClick={() => setShowLinkedInJobPreferenceInput(true)}
                      className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-blue-600 rounded-md transition-colors duration-150 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Plus className="w-3 h-3" />
                      Add Preference
                    </button>
                  </div>

                  {/* Add Job Preference Input */}
                  {showLinkedInJobPreferenceInput && (
                    <div className="p-3 mb-4 bg-green-50 rounded-md border border-green-200">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-medium text-green-900">
                          Add New Job Preference
                        </h4>
                        <button
                          onClick={() =>
                            setShowLinkedInJobPreferenceInput(false)
                          }
                          className="text-green-400 hover:text-green-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <form
                        onSubmit={async e => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);

                          // Build data object and filter out empty strings
                          const rawData = {
                            jobTitle: formData.get("jobTitle") as string,
                            locationType: formData.get(
                              "locationType"
                            ) as string,
                            location: formData.get("location") as string,
                            employmentType: formData.get(
                              "employmentType"
                            ) as string,
                          };

                          // Filter out empty strings and convert to null
                          const data = Object.fromEntries(
                            Object.entries(rawData).map(([key, value]) => {
                              if (value === "") {
                                return [key, null];
                              }
                              return [key, value];
                            })
                          );

                          await handleCreateLinkedInJobPreference(data);
                          setShowLinkedInJobPreferenceInput(false);
                          if (e.currentTarget) {
                            e.currentTarget.reset();
                          }
                        }}
                      >
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            name="jobTitle"
                            placeholder="Job Title"
                            className="px-2 py-1 text-xs rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <select
                            name="locationType"
                            className="px-2 py-1 text-xs rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="" disabled>
                              Select Location Type
                            </option>
                            <option value="On-site">On-site</option>
                            <option value="Remote">Remote</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                          <input
                            type="text"
                            name="location"
                            placeholder="Location"
                            className="px-2 py-1 text-xs rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <select
                            name="employmentType"
                            className="px-2 py-1 text-xs rounded border border-green-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                          >
                            <option value="" disabled>
                              Select Employment Type
                            </option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                            <option value="Freelance">Freelance</option>
                          </select>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                          >
                            Add Preference
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShowLinkedInJobPreferenceInput(false)
                            }
                            className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-2">
                    {loadingLinkedInData ? (
                      <div className="flex justify-center items-center py-4">
                        <div className="w-4 h-4 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                      </div>
                    ) : linkedinJobPreferences.length > 0 ? (
                      linkedinJobPreferences.map(jobPref => (
                        <div
                          key={jobPref.id}
                          className="p-3 bg-green-50 rounded-md border border-green-200"
                        >
                          {editingLinkedInItem?.type === "jobPreference" &&
                          editingLinkedInItem.id === jobPref.id ? (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-xs font-medium text-gray-900">
                                  Edit Job Preference
                                </h4>
                                <button
                                  onClick={() => setEditingLinkedInItem(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <form
                                onSubmit={async e => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.currentTarget
                                  );

                                  // Build data object and filter out empty strings
                                  const rawData = {
                                    jobTitle: formData.get(
                                      "jobTitle"
                                    ) as string,
                                    locationType: formData.get(
                                      "locationType"
                                    ) as string,
                                    location: formData.get(
                                      "location"
                                    ) as string,
                                    employmentType: formData.get(
                                      "employmentType"
                                    ) as string,
                                  };

                                  // Filter out empty strings and convert to null
                                  const data = Object.fromEntries(
                                    Object.entries(rawData).map(
                                      ([key, value]) => {
                                        if (value === "") {
                                          return [key, null];
                                        }
                                        return [key, value];
                                      }
                                    )
                                  );

                                  await handleUpdateLinkedInJobPreference(
                                    jobPref.id,
                                    data
                                  );
                                  setEditingLinkedInItem(null);
                                }}
                              >
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    name="jobTitle"
                                    defaultValue={jobPref.jobTitle || ""}
                                    placeholder="Job Title"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                  <select
                                    name="locationType"
                                    defaultValue={jobPref.locationType || ""}
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">
                                      Select Location Type
                                    </option>
                                    <option value="On-site">On-site</option>
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                  </select>
                                  <input
                                    type="text"
                                    name="location"
                                    defaultValue={jobPref.location || ""}
                                    placeholder="Location"
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  />
                                  <select
                                    name="employmentType"
                                    defaultValue={jobPref.employmentType || ""}
                                    className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                                  >
                                    <option value="">
                                      Select Employment Type
                                    </option>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Internship">
                                      Internship
                                    </option>
                                    <option value="Freelance">Freelance</option>
                                  </select>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    type="submit"
                                    className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700"
                                  >
                                    Update Preference
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLinkedInItem(null)}
                                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </form>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                {jobPref.jobTitle && (
                                  <div className="text-sm font-medium text-gray-900">
                                    {jobPref.jobTitle}
                                  </div>
                                )}
                                {jobPref.locationType && (
                                  <div className="mt-1 text-xs text-gray-600">
                                    📍 {jobPref.locationType}
                                  </div>
                                )}
                                {jobPref.location && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    📍 {jobPref.location}
                                  </div>
                                )}
                                {jobPref.employmentType && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    💼 {jobPref.employmentType}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1 items-center ml-2">
                                <button
                                  onClick={() =>
                                    setEditingLinkedInItem({
                                      type: "jobPreference",
                                      id: jobPref.id,
                                      data: jobPref,
                                    })
                                  }
                                  className="p-1 text-gray-400 transition-colors hover:text-gray-600"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteLinkedInJobPreference(
                                      jobPref.id
                                    )
                                  }
                                  className="p-1 text-gray-400 transition-colors hover:text-red-600"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-xs text-center text-gray-500">
                        No job preferences found
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner */}
                {lead.owner && (
                  <div>
                    <h3 className="mb-3 text-sm font-medium text-gray-900">
                      Owner
                    </h3>
                    <div className="space-y-1">
                      <InfoRow
                        icon={<User className="w-4 h-4" />}
                        label="Assigned To"
                        value={lead.owner.name}
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
                          {lead.tags && lead.tags.length > 0 ? (
                            lead.tags.map((tag, index) => {
                              // Handle the nested tag structure from API
                              let tagName: string | undefined,
                                assignmentId: string | undefined;

                              if (typeof tag === "string") {
                                // For string tags, we need to find the actual assignment ID
                                // The API is returning string tags, so we need to handle this
                                tagName = tag;
                                // Try to get assignment ID from loaded assignments
                                assignmentId = tagAssignments[tag];
                              } else if (tag && typeof tag === "object") {
                                // Handle nested structure: { id: assignmentId, tag: { id: tagId, name: tagName } }
                                const tagObj = tag as Record<string, unknown>;
                                if (
                                  tagObj.tag &&
                                  (tagObj.tag as Record<string, unknown>)
                                    .name &&
                                  tagObj.id
                                ) {
                                  tagName = (
                                    tagObj.tag as Record<string, unknown>
                                  ).name as string;
                                  assignmentId = tagObj.id as string; // This is the assignment ID
                                } else if (tagObj.name && tagObj.id) {
                                  tagName = tagObj.name as string;
                                  assignmentId = tagObj.id as string;
                                } else if (
                                  tagObj.tag &&
                                  (tagObj.tag as Record<string, unknown>).name
                                ) {
                                  // Fallback: if we have tag info but no assignment ID, use tag ID as assignment ID
                                  tagName = (
                                    tagObj.tag as Record<string, unknown>
                                  ).name as string;
                                  assignmentId =
                                    ((tagObj.tag as Record<string, unknown>)
                                      .id as string) || (tagObj.id as string);
                                } else if (tagObj.name) {
                                  // Fallback: if we have name but no assignment ID, use tag ID as assignment ID
                                  tagName = tagObj.name as string;
                                  assignmentId = tagObj.id as string;
                                } else if (
                                  tagObj.tag &&
                                  (tagObj.tag as Record<string, unknown>).id
                                ) {
                                  // Another fallback: if we have tag ID but no name, try to find name
                                  tagName =
                                    ((tagObj.tag as Record<string, unknown>)
                                      .name as string) || "Unknown Tag";
                                  assignmentId =
                                    (tagObj.id as string) ||
                                    ((tagObj.tag as Record<string, unknown>)
                                      .id as string);
                                } else if (tagObj.id) {
                                  // Last fallback: if we only have an ID, try to use it
                                  tagName =
                                    (tagObj.name as string) || "Unknown Tag";
                                  assignmentId = tagObj.id as string;
                                }
                              }

                              // Debug logging to see what we're getting
                              if (!tagName || !assignmentId) {
                                // Show a fallback tag without remove button
                                return (
                                  <div
                                    key={index}
                                    className="flex items-center px-1 py-0.5 bg-gray-50 text-gray-700 text-xs rounded-full border border-gray-200 w-fit justify-self-start"
                                  >
                                    <span className="p-1">
                                      {tagName || "Unknown Tag"}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={index}
                                  className="flex items-center px-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200 w-fit justify-self-start"
                                >
                                  <span className="p-1">{tagName}</span>
                                  {assignmentId && (
                                    <button
                                      onClick={() => {
                                        if (assignmentId) {
                                          handleRemoveTag(assignmentId);
                                        }
                                      }}
                                      disabled={
                                        !assignmentId ||
                                        removingTag === assignmentId
                                      }
                                      className="flex-shrink-0 text-blue-500 hover:text-blue-700 disabled:opacity-50"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
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
                            <Plus className="w-3 h-3" />
                            {loadingTags ? "Loading..." : "Add Tag"}
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
                                  const isAssigned = lead.tags?.some(
                                    leadTag => {
                                      let leadTagId;
                                      if (typeof leadTag === "string") {
                                        // For string tags, we need to find the actual tag ID
                                        // The API is returning string tags, so we need to handle this
                                        const matchingTag = availableTags.find(
                                          t => t.name === leadTag
                                        );
                                        leadTagId = matchingTag?.id;
                                      } else if (
                                        leadTag &&
                                        typeof leadTag === "object"
                                      ) {
                                        // Handle nested structure: { id: assignmentId, tag: { id: tagId, name: tagName } }
                                        const leadTagObj = leadTag as Record<
                                          string,
                                          unknown
                                        >;
                                        if (
                                          leadTagObj.tag &&
                                          (
                                            leadTagObj.tag as Record<
                                              string,
                                              unknown
                                            >
                                          ).id
                                        ) {
                                          leadTagId = (
                                            leadTagObj.tag as Record<
                                              string,
                                              unknown
                                            >
                                          ).id as string; // This is the actual tag ID
                                        } else if (leadTagObj.id) {
                                          // This might be the tag ID directly, try to use it
                                          leadTagId = leadTagObj.id as string;
                                        }
                                      }
                                      return leadTagId === tag.id;
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
                  entityId={lead.id}
                  entityType="contact"
                  onRefresh={refreshLeadData}
                />
              </div>
            )}

            {activeTab === "deals" && (
              <DealsSection entityId={lead.id} entityType="contact" />
            )}

            {activeTab === "messages" && (
              <div className="p-4" data-tab="messages">
                <WhatsAppMessagesSection lead={lead} />
              </div>
            )}

            {activeTab === "notes" && (
              <div className="p-4" data-tab="notes">
                <NotesSection
                  entityId={lead.id}
                  entityType="contact"
                  onRefresh={refreshLeadData}
                />
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="p-4" data-tab="tasks">
                <TaskSection
                  entityId={lead.id}
                  entityType="contact"
                  entityName={lead.name || "Lead"}
                  onRefresh={refreshLeadData}
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

// WhatsApp Messages Section Component
const WhatsAppMessagesSection: React.FC<{ lead: Contact }> = ({ lead }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null
  );
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load WhatsApp accounts
  useEffect(() => {
    const loadAccounts = async () => {
      if (!selectedOrganization?.id || !selectedWorkspace?.id) return;
      try {
        const res = await whatsappService.listAccounts({
          organizationId: selectedOrganization.id,
          workspaceId: selectedWorkspace.id,
        });
        setAccounts(res.accounts);
        if (res.accounts.length > 0) {
          setSelectedAccountId(res.accounts[0].id);
        }
      } catch (error) {}
    };
    loadAccounts();
  }, [selectedOrganization?.id, selectedWorkspace?.id]);

  // Function to format WhatsApp number for API
  const formatWhatsAppNumber = (phoneNumber: string): string => {
    // Remove all non-digit characters and ensure it starts with country code
    let cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, "");

    // If it starts with +, remove it
    if (cleaned.startsWith("+")) {
      cleaned = cleaned.substring(1);
    }

    // Add @c.us suffix
    return `${cleaned}@c.us`;
  };

  // Load messages for the lead's WhatsApp number
  useEffect(() => {
    const loadMessages = async () => {
      if (
        !lead.whatsappNumber ||
        !selectedAccountId ||
        !selectedOrganization?.id ||
        !selectedWorkspace?.id
      ) {
        setMessages([]);
        return;
      }

      try {
        setLoading(true);
        const formattedWhatsAppId = formatWhatsAppNumber(lead.whatsappNumber);

        const res = await whatsappService.getConversationMessages({
          accountId: selectedAccountId,
          whatsappId: formattedWhatsAppId,
          organizationId: selectedOrganization.id,
          workspaceId: selectedWorkspace.id,
          limit: 50,
          offset: 0,
        });

        const mappedMessages = (res.messages || []).map((m: any) => ({
          id: m.id,
          from: m.fromMe ? "Me" : lead.name || "Contact",
          content: m.content,
          timestamp: new Date(m.timestamp),
          fromMe: m.fromMe,
          status: m.status,
          messageType: m.messageType,
          media: m.media,
        }));

        setMessages(mappedMessages);
      } catch (error) {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [
    lead.whatsappNumber,
    selectedAccountId,
    selectedOrganization?.id,
    selectedWorkspace?.id,
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!lead.whatsappNumber) {
    return (
      <div className="py-8 text-center text-gray-500">
        <MessageCircle className="mx-auto mb-2 w-8 h-8 text-gray-400" />
        <p className="text-sm">No WhatsApp number found for this lead</p>
        <p className="text-xs text-gray-400 mt-1">
          Add a WhatsApp number to see messages here
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-8 text-center text-gray-500">
        <div className="animate-spin mx-auto mb-2 w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
        <p className="text-sm">Loading WhatsApp messages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            WhatsApp Messages
          </h3>
          <p className="text-sm text-gray-600">
            Messages with {lead.name || "Contact"} ({lead.whatsappNumber})
          </p>
        </div>
        {accounts.length > 1 && (
          <select
            value={selectedAccountId || ""}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.displayName ||
                  account.phoneNumber ||
                  account.remoteAccountId}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
        {messages.length > 0 ? (
          <div className="p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.fromMe
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div
                    className={`text-xs mt-1 ${
                      message.fromMe ? "text-blue-100" : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <MessageCircle className="mx-auto mb-2 w-8 h-8 text-gray-400" />
            <p className="text-sm">No messages found</p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation to see messages here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetailPanel;
