import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { usePathname } from "next/navigation";
import MarkdownEditor from "./MarkdownEditor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus,
  Search,
  MoreHorizontal,
  Calendar,
  User,
  Circle,
  AlertCircle,
  Star,
  Edit,
  Trash2,
  Eye,
  List,
  Grid,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  ArrowUpDown,
  X,
  GripVertical,
  Zap,
  AlertTriangle,
  ChevronDown,
  Building,
  Save,
  Loader2,
  Check,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle as AlertTriangleIcon,
  ArrowUp,
  Minus,
} from "lucide-react";
import taskService from "../../services/sales-services/taskService";
import contactService from "../../services/sales-services/contactService";
import companyService from "../../services/sales-services/companyService";
import {
  TaskWithRelations,
  Contact,
  Company,
  FilterState,
} from "../../types/sales-types";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import NestedFilterDropdown from "./NestedFilterDropdown";
import SearchSuggestions from "./SearchSuggestions";
import { useSearchSuggestions } from "../../hooks/sales-hooks/useSearchSuggestions";

interface TaskTableColumn {
  key: keyof TaskWithRelations;
  label: string;
  sortable: boolean;
  visible: boolean;
  width: string;
  filterable?: boolean;
}

interface TaskColumn {
  id: string;
  title: string;
  status: TaskWithRelations["status"];
  color: string;
  count: number;
}

interface TaskFilterState {
  search: string;
  status: string[];
  priority: string[];
  assignee: string[];
  contact: string[];
  company: string[];
  dateRange: {
    start?: Date;
    end?: Date;
    selectedOption?: string;
  };
  isAutomated?: boolean;
}

// Custom Searchable Dropdown Component
interface SearchableDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
    icon?: React.ReactNode;
  }>;
  placeholder: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  error,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"top" | "bottom">(
    "top"
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Get selected option label
  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (!disabled) {
      if (!isOpen) {
        // Check available space when opening
        const rect = dropdownRef.current?.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (rect) {
          const spaceBelow = viewportHeight - rect.bottom;
          const spaceAbove = rect.top;

          // Always prefer top positioning unless there's significantly more space below
          if (spaceBelow > spaceAbove + 100) {
            setDropdownPosition("bottom");
          } else {
            setDropdownPosition("top");
          }
        }

        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`w-full p-2 text-left rounded-lg transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
          error ? "border-red-300" : "border-gray-300"
        } ${disabled ? "bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed" : "bg-gray-50 dark:bg-gray-700"}`}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {selectedOption?.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span
              className={`text-sm font-semibold ${selectedOption ? "text-gray-800" : "text-gray-500"}`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`overflow-hidden absolute z-[9999] w-full max-h-48 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-lg ${
            dropdownPosition === "top"
              ? "bottom-full mb-1 searchable-dropdown-enter-top"
              : "top-full mt-1 searchable-dropdown-enter"
          }`}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="py-1.5 pr-3 pl-10 w-full text-xs rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-36">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className={`w-full px-2 py-1.5 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors duration-150 ${
                    option.value === value
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300"
                  } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {option.icon && (
                        <span className="flex-shrink-0">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                    </div>
                    {option.value === value && (
                      <Check className="w-3 h-3 text-blue-600" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TasksBoard: React.FC = () => {
  const pathname = usePathname();

  // Load view mode from localStorage or default to 'kanban'
  const [viewMode, setViewMode] = useState<"kanban" | "table">(() => {
    if (typeof window !== "undefined") {
      const savedViewMode = localStorage.getItem("tasksViewMode");
      return (savedViewMode as "kanban" | "table") || "kanban";
    }
    return "kanban";
  });
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { user } = useAuth();

  const [filters, setFilters] = useState<TaskFilterState>({
    search: "",
    status: [],
    priority: [],
    assignee: [],
    contact: [],
    company: [],
    dateRange: {},
    isAutomated: undefined,
  });

  // Search suggestions
  const searchSuggestions = useSearchSuggestions(
    filters.search,
    tasks,
    "tasks"
  );

  // Debounced search state
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
      setIsSearching(false);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchValue]);

  // Update filters when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.getTasks(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        setError(response.error || "Failed to load tasks");
      }
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [user, selectedWorkspace, selectedOrganization]);

  // Load tasks on mount and when dependencies change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("tasksViewMode", viewMode);
    }
  }, [viewMode]);

  // Note: Navigation state handling removed for Next.js compatibility
  // Edit task functionality is available through direct task actions

  const [showFilters, setShowFilters] = useState(false);
  const [isFilterModalAnimating, setIsFilterModalAnimating] = useState(false);

  const [draggedTask, setDraggedTask] = useState<TaskWithRelations | null>(
    null
  );
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(
    null
  );

  // Enhanced task creation/editing state
  const [editingTask, setEditingTask] = useState<TaskWithRelations | null>(
    null
  );
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isModalAnimating, setIsModalAnimating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(
    null
  );
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Helper function to calculate days until due date
  const getDaysUntilDue = (dueDate: Date) => {
    const diff = dueDate.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };
  const [isTaskDetailAnimating, setIsTaskDetailAnimating] = useState(false);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleteModalAnimating, setIsDeleteModalAnimating] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithRelations | null>(
    null
  );

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    status: "PENDING" as
      | "PENDING"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED"
      | "OVERDUE",
    assigneeId: "",
    contactId: "",
    companyId: "",
    dueDate: "",
    isAutomated: false,
  });
  const [taskFormErrors, setTaskFormErrors] = useState<Record<string, string>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data for dropdowns
  const [availableMembers, setAvailableMembers] = useState<
    Array<{
      id: string;
      name: string;
      email: string;
      avatar?: string;
    }>
  >([]);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Table view state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] =
    useState<keyof TaskWithRelations>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleteModalAnimating, setIsBulkDeleteModalAnimating] =
    useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [tableScrollPosition, setTableScrollPosition] = useState(0);
  const [maxScrollPosition, setMaxScrollPosition] = useState(0);
  const [tableRef, setTableRef] = useState<HTMLDivElement | null>(null);

  // Status dropdown state
  const [statusDropdownData, setStatusDropdownData] = useState<{
    taskId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [statusSearchTerm, setStatusSearchTerm] = useState("");
  const [filteredStatusOptions, setFilteredStatusOptions] = useState([
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
    "OVERDUE",
  ]);

  // Calculate dropdown position
  const calculateDropdownPosition = (
    triggerRect: DOMRect,
    dropdownHeight: number = 300,
    dropdownWidth: number = 250
  ) => {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    let x = triggerRect.left;
    let y = triggerRect.bottom + 5;

    if (y + dropdownHeight > viewportHeight) {
      y = triggerRect.top - dropdownHeight - 5;
    }

    if (x + dropdownWidth > viewportWidth) {
      x = viewportWidth - dropdownWidth - 10;
    }

    x = Math.max(10, x);
    y = Math.max(10, y);

    return { x, y };
  };

  // Filter status options based on search term
  useEffect(() => {
    const filtered = [
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "OVERDUE",
    ].filter(status =>
      status.toLowerCase().includes(statusSearchTerm.toLowerCase())
    );
    setFilteredStatusOptions(filtered);
  }, [statusSearchTerm]);

  // Table columns configuration
  const [tableColumns] = useState<TaskTableColumn[]>([
    { key: "id", label: "ID", sortable: false, visible: false, width: "80px" },
    {
      key: "title",
      label: "Task",
      sortable: true,
      visible: true,
      width: "300px",
      filterable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      visible: true,
      width: "120px",
      filterable: true,
    },
    {
      key: "priority",
      label: "Priority",
      sortable: true,
      visible: true,
      width: "100px",
      filterable: true,
    },
    {
      key: "assigneeId",
      label: "Assignee",
      sortable: true,
      visible: true,
      width: "150px",
      filterable: true,
    },
    {
      key: "contactId",
      label: "Contact",
      sortable: true,
      visible: true,
      width: "150px",
      filterable: true,
    },
    {
      key: "companyId",
      label: "Company",
      sortable: true,
      visible: true,
      width: "150px",
      filterable: true,
    },
    {
      key: "dueDate",
      label: "Due Date",
      sortable: true,
      visible: true,
      width: "120px",
      filterable: true,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      visible: true,
      width: "120px",
      filterable: true,
    },
    {
      key: "isAutomated",
      label: "Automated",
      sortable: true,
      visible: true,
      width: "100px",
      filterable: true,
    },
  ]);

  const columns: TaskColumn[] = useMemo(
    () => [
      {
        id: "PENDING",
        title: "Pending",
        status: "PENDING",
        color: "bg-gray-100",
        count: 0,
      },
      {
        id: "IN_PROGRESS",
        title: "In Progress",
        status: "IN_PROGRESS",
        color: "bg-blue-100",
        count: 0,
      },
      {
        id: "COMPLETED",
        title: "Completed",
        status: "COMPLETED",
        color: "bg-green-100",
        count: 0,
      },
      {
        id: "CANCELLED",
        title: "Cancelled",
        status: "CANCELLED",
        color: "bg-red-100",
        count: 0,
      },
      {
        id: "OVERDUE",
        title: "Overdue",
        status: "OVERDUE",
        color: "bg-orange-100",
        count: 0,
      },
    ],
    []
  );

  const priorityColors = {
    LOW: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    MEDIUM: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    HIGH: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
    URGENT: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
  };

  const priorityIcons = {
    LOW: <Circle className="w-3 h-3" />,
    MEDIUM: <AlertCircle className="w-3 h-3" />,
    HIGH: <Star className="w-3 h-3" />,
    URGENT: <AlertTriangle className="w-3 h-3" />,
  };

  const datePresets = [
    { label: "Today", value: "today" },
    { label: "Tomorrow", value: "tomorrow" },
    { label: "This week", value: "this_week" },
    { label: "Next week", value: "next_week" },
    { label: "This month", value: "this_month" },
    { label: "Overdue", value: "overdue" },
    { label: "Due soon (3 days)", value: "due_soon" },
  ];

  // Memoize filter values to prevent unnecessary recalculations
  const memoizedFilters = useMemo(
    () => ({
      search: filters.search,
      status: filters.status,
      priority: filters.priority,
      assignee: filters.assignee,
      contact: filters.contact,
      company: filters.company,
      isAutomated: filters.isAutomated,
      dateRange: filters.dateRange,
    }),
    [filters]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (memoizedFilters.search) {
        const searchTerm = memoizedFilters.search.toLowerCase();
        const searchableFields = [
          task.title,
          task.description,
          task.assignee?.name,
          task.contact?.name,
          task.company?.name,
          task.status,
          task.priority,
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
        memoizedFilters.status?.length > 0 &&
        !memoizedFilters.status.includes(task.status)
      ) {
        return false;
      }

      // Priority filter
      if (
        memoizedFilters.priority?.length > 0 &&
        !memoizedFilters.priority.includes(task.priority)
      ) {
        return false;
      }

      // Assignee filter
      if (
        memoizedFilters.assignee?.length > 0 &&
        !memoizedFilters.assignee.includes(task.assignee?.name || "")
      ) {
        return false;
      }

      // Contact filter
      if (
        memoizedFilters.contact?.length > 0 &&
        !memoizedFilters.contact.includes(task.contact?.name || "")
      ) {
        return false;
      }

      // Company filter
      if (
        memoizedFilters.company?.length > 0 &&
        !memoizedFilters.company.includes(task.company?.name || "")
      ) {
        return false;
      }

      // Automation filter
      if (
        memoizedFilters.isAutomated !== undefined &&
        task.isAutomated !== memoizedFilters.isAutomated
      ) {
        return false;
      }

      // Date range filter (handles both custom date ranges and preset options)
      if (memoizedFilters.dateRange && task.dueDate) {
        const taskDate = new Date(task.dueDate);

        // Handle custom date range (start and end dates)
        if (
          memoizedFilters.dateRange.start &&
          taskDate < memoizedFilters.dateRange.start
        ) {
          return false;
        }
        if (
          memoizedFilters.dateRange.end &&
          taskDate > memoizedFilters.dateRange.end
        ) {
          return false;
        }

        // Handle preset date range options
        if (memoizedFilters.dateRange.selectedOption) {
          const days = getDaysUntilDue(taskDate);
          switch (memoizedFilters.dateRange.selectedOption) {
            case "today":
              if (days !== 0) return false;
              break;
            case "yesterday":
              if (days !== -1) return false;
              break;
            case "this_week":
              if (days < 0 || days > 7) return false;
              break;
            case "last_week":
              if (days < -7 || days > 0) return false;
              break;
            case "this_month":
              if (days < 0 || days > 30) return false;
              break;
            case "last_month":
              if (days < -30 || days > 0) return false;
              break;
            case "overdue":
              if (days >= 0) return false;
              break;
            case "due_soon":
              if (days < 0 || days > 3) return false;
              break;
          }
        }
      }

      return true;
    });
  }, [tasks, memoizedFilters]);

  const availableAssignees = useMemo(() => {
    const assignees = new Set<string>();
    tasks.forEach(task => {
      if (task.assignee?.name) {
        assignees.add(task.assignee.name);
      }
    });
    return Array.from(assignees).sort();
  }, [tasks]);

  const availableContactNames = useMemo(() => {
    const contacts = new Set<string>();
    tasks.forEach(task => {
      if (task.contact?.name) {
        contacts.add(task.contact.name);
      }
    });
    return Array.from(contacts).sort();
  }, [tasks]);

  const availableCompanyNames = useMemo(() => {
    const companies = new Set<string>();
    tasks.forEach(task => {
      if (task.company?.name) {
        companies.add(task.company.name);
      }
    });
    return Array.from(companies).sort();
  }, [tasks]);

  const availableTaskStatuses = useMemo(() => {
    const statusSet = new Set<string>();
    tasks.forEach(task => {
      if (task.status) {
        statusSet.add(task.status);
      }
    });
    return Array.from(statusSet).sort();
  }, [tasks]);

  const availableTaskPriorities = useMemo(() => {
    const prioritySet = new Set<string>();
    tasks.forEach(task => {
      if (task.priority) {
        prioritySet.add(task.priority);
      }
    });
    return Array.from(prioritySet).sort();
  }, [tasks]);

  const availableDueDates = useMemo(() => {
    const dateSet = new Set<string>();
    tasks.forEach(task => {
      if (task.dueDate) {
        dateSet.add(task.dueDate);
      }
    });
    return Array.from(dateSet).sort();
  }, [tasks]);

  const tasksByColumn = useMemo(() => {
    const grouped = columns.map(col => ({
      ...col,
      tasks: filteredTasks.filter(task => task.status === col.status),
    }));

    // Update counts
    grouped.forEach(col => (col.count = col.tasks.length));

    return grouped;
  }, [filteredTasks, columns]);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: TaskWithRelations["status"]
  ) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.updateTask(
        taskId,
        { status: newStatus },
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setTasks(prev =>
          prev.map(task => (task.id === taskId ? response.data! : task))
        );
      } else {
        setError(response.error || "Failed to update task status");
      }
    } catch (err) {
      setError("Failed to update task status");
    }
  };

  const openDeleteConfirmation = (task: TaskWithRelations) => {
    setTaskToDelete(task);
    setIsDeleteModalAnimating(true);
    setShowDeleteModal(true);
    setTimeout(() => {
      setIsDeleteModalAnimating(false);
    }, 10);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalAnimating(true);
    setTimeout(() => {
      setShowDeleteModal(false);
      setTaskToDelete(null);
      setIsDeleteModalAnimating(false);
    }, 200);
  };

  const openBulkDeleteModal = () => {
    if (selectedTasks.length === 0) return;
    setIsBulkDeleteModalAnimating(true);
    setShowBulkDeleteModal(true);
    setTimeout(() => {
      setIsBulkDeleteModalAnimating(false);
    }, 10);
  };

  const closeBulkDeleteModal = () => {
    setIsBulkDeleteModalAnimating(true);
    setTimeout(() => {
      setShowBulkDeleteModal(false);
      setIsBulkDeleteModalAnimating(false);
    }, 200);
  };

  const bulkDeleteTasks = async () => {
    if (
      !user ||
      !selectedWorkspace ||
      !selectedOrganization ||
      selectedTasks.length === 0
    )
      return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.bulkDeleteTasks(
        selectedTasks,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setTasks(prev => prev.filter(task => !selectedTasks.includes(task.id)));
        setSelectedTasks([]);
        setSuccessMessage(
          `${selectedTasks.length} task(s) deleted successfully!`
        );
        setTimeout(() => setSuccessMessage(null), 3000);
        closeBulkDeleteModal();
      } else {
        setError(response.error || "Failed to delete tasks");
      }
    } catch (err) {
      setError("Failed to delete tasks");
    }
  };

  const deleteTask = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization || !taskToDelete)
      return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.deleteTask(
        taskToDelete.id,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskToDelete.id));
        setSuccessMessage("Task deleted successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);

        // Close task detail panel if it's open
        if (isTaskDetailOpen && selectedTask?.id === taskToDelete.id) {
          closeTaskDetail();
        }

        closeDeleteModal();
      } else {
        setError(response.error || "Failed to delete task");
      }
    } catch (err) {
      setError("Failed to delete task");
    }
  };

  const getDueDateColor = (dueDate: Date) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return "text-red-600";
    if (days <= 1) return "text-orange-600";
    if (days <= 3) return "text-yellow-600";
    return "text-gray-600";
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: TaskWithRelations) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", task.id);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask) {
      updateTaskStatus(draggedTask.id, columnId as TaskWithRelations["status"]);
      setDraggedTask(null);
      setDraggedOverColumn(null);
    }
  };

  const updateFilter = useCallback(
    (
      key: keyof FilterState,
      value:
        | string
        | string[]
        | boolean
        | undefined
        | { start?: Date; end?: Date }
    ) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleArrayFilter = useCallback(
    (key: "status" | "priority" | "assignee", value: string) => {
      const currentArray = filters[key] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      updateFilter(key, newArray);
    },
    [filters, updateFilter]
  );

  // Enhanced task management functions
  const loadTaskModalData = useCallback(async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setIsLoadingData(true);
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("No authentication token found");
      return;
    }

    try {
      // Load members from current organization/workspace
      const currentOrg = user.organizations?.find(
        org => org.id === selectedOrganization.id
      );
      const currentWorkspace = currentOrg?.workspaces?.find(
        ws => ws.id === selectedWorkspace.id
      );

      // Combine members and deduplicate by ID
      const orgMembers = currentOrg?.members || [];
      const workspaceMembers = currentWorkspace?.members || [];

      // Create a Map to deduplicate members by ID
      const membersMap = new Map();

      // Add organization members first
      orgMembers.forEach(member => {
        membersMap.set(member.id, member);
      });

      // Add workspace members (will override if same ID exists)
      workspaceMembers.forEach(member => {
        membersMap.set(member.id, member);
      });

      // Convert back to array
      const uniqueMembers = Array.from(membersMap.values());

      // Members loaded successfully

      setAvailableMembers(uniqueMembers);

      // Load contacts
      const contactsResponse = await contactService.getContacts(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );
      if (contactsResponse.success && contactsResponse.data) {
        setAvailableContacts(contactsResponse.data);
      }

      // Load companies
      const companiesResponse = await companyService.getCompanies(
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );
      if (companiesResponse.success && companiesResponse.data) {
        setAvailableCompanies(companiesResponse.data);
      }
    } catch (err) {
      setError("Failed to load task data");
    } finally {
      setIsLoadingData(false);
    }
  }, [user, selectedWorkspace, selectedOrganization]);

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setTaskFormData({
      title: "",
      description: "",
      priority: "MEDIUM",
      status: "PENDING",
      assigneeId: "",
      contactId: "",
      companyId: "",
      dueDate: "",
      isAutomated: false,
    });
    setTaskFormErrors({});
    setIsModalAnimating(true);
    setShowTaskModal(true);
    loadTaskModalData();

    // Smooth transition
    setTimeout(() => {
      setIsModalAnimating(false);
    }, 10);
  };

  const openEditTaskModal = (task: TaskWithRelations) => {
    setEditingTask(task);
    setTaskFormData({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId || "",
      contactId: task.contactId || "",
      companyId: task.companyId || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      isAutomated: task.isAutomated,
    });
    setTaskFormErrors({});
    setIsModalAnimating(true);
    setShowTaskModal(true);
    loadTaskModalData();

    // Smooth transition
    setTimeout(() => {
      setIsModalAnimating(false);
    }, 10);
  };

  const closeTaskModal = () => {
    setIsModalAnimating(true);
    setTimeout(() => {
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskFormData({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "PENDING",
        assigneeId: "",
        contactId: "",
        companyId: "",
        dueDate: "",
        isAutomated: false,
      });
      setTaskFormErrors({});
      setIsModalAnimating(false);
    }, 200);
  };

  const openTaskDetail = (task: TaskWithRelations) => {
    // Clear any previous state to prevent debouncing
    setSuccessMessage(null);
    setError(null);

    setSelectedTask(task);
    setIsTaskDetailOpen(true);
    // Ensure smooth slide-in animation
    setIsTaskDetailAnimating(false);
  };

  const closeTaskDetail = () => {
    setIsTaskDetailAnimating(true);
    setTimeout(() => {
      setIsTaskDetailOpen(false);
      setSelectedTask(null);
      setIsTaskDetailAnimating(false);
      // Clear any related state to prevent debouncing
      setSuccessMessage(null);
      setError(null);
    }, 200);
  };

  const validateTaskForm = () => {
    const errors: Record<string, string> = {};

    // Validating form data

    // Title validation
    if (!taskFormData.title.trim()) {
      errors.title = "Title is required";
      // Title validation failed: empty title
    }

    // Contact/Company mutual exclusion validation
    if (taskFormData.contactId && taskFormData.companyId) {
      errors.contactId = "Cannot select both contact and company";
      errors.companyId = "Cannot select both contact and company";
      // Contact/Company validation failed: both selected
    }

    // Priority validation
    if (!taskFormData.priority) {
      errors.priority = "Priority is required";
      // Priority validation failed: no priority selected
    }

    // Status validation
    if (!taskFormData.status) {
      errors.status = "Status is required";
      // Status validation failed: no status selected
    }

    // Validation errors logged
    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaskFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form submission started

    if (!validateTaskForm()) {
      // Form validation failed
      return;
    }

    if (!user || !selectedWorkspace || !selectedOrganization) {
      // Missing user, workspace, or organization
      setError("Missing required context");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("No authentication token found");
      setIsSubmitting(false);
      return;
    }

    try {
      const taskData = {
        title: taskFormData.title.trim(),
        description: taskFormData.description.trim() || undefined,
        priority: taskFormData.priority,
        status: taskFormData.status,
        assigneeId: taskFormData.assigneeId || undefined,
        contactId: taskFormData.contactId || undefined,
        companyId: taskFormData.companyId || undefined,
        dueDate: taskFormData.dueDate
          ? new Date(taskFormData.dueDate).toISOString()
          : undefined,
        isAutomated: taskFormData.isAutomated,
      };

      // Prepared task data

      // Additional validation before sending
      if (!taskData.title || taskData.title.trim() === "") {
        setError("Title is required");
        setIsSubmitting(false);
        return;
      }

      // Validate enum values
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      const validStatuses = [
        "PENDING",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "OVERDUE",
      ];

      if (taskData.priority && !validPriorities.includes(taskData.priority)) {
        setError(`Invalid priority: ${taskData.priority}`);
        setIsSubmitting(false);
        return;
      }

      if (taskData.status && !validStatuses.includes(taskData.status)) {
        setError(`Invalid status: ${taskData.status}`);
        setIsSubmitting(false);
        return;
      }

      let response: any;
      if (editingTask) {
        // Updating existing task
        // Update existing task
        response = await taskService.updateTask(
          editingTask.id,
          taskData,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
      } else {
        // Creating new task
        // Create new task
        response = await taskService.createTask(
          taskData,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
      }

      // API response received

      if (response.success && response.data) {
        // Task saved successfully
        if (editingTask) {
          setTasks(prev =>
            prev.map(task =>
              task.id === editingTask.id ? response.data! : task
            )
          );
          setSuccessMessage("Task updated successfully!");
        } else {
          setTasks(prev => [response.data!, ...prev]);
          setSuccessMessage("Task created successfully!");
        }
        setTimeout(() => setSuccessMessage(null), 3000);
        closeTaskModal();
      } else {
        // Try to extract more detailed error information
        let errorMessage = response.error || "Failed to save task";
        if (response.data && typeof response.data === "object") {
          const errorData = response.data as unknown as Record<string, unknown>;
          if (errorData.message && typeof errorData.message === "string") {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error === "string") {
            errorMessage = errorData.error;
          }
        }

        setError(errorMessage);
      }
    } catch (err) {
      setError(
        `Failed to save task: ${err instanceof Error ? err.message : "Unknown error"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskFormChange = (field: string, value: string | boolean) => {
    setTaskFormData(prev => ({ ...prev, [field]: value }));

    // Clear related errors when user makes changes
    if (taskFormErrors[field]) {
      setTaskFormErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Handle mutual exclusion for contact/company
    if (field === "contactId") {
      if (value) {
        // If contact is selected, clear company
        setTaskFormData(prev => ({ ...prev, companyId: "" }));
      }
      // Clear company error when contact changes
      if (taskFormErrors.companyId) {
        setTaskFormErrors(prev => ({ ...prev, companyId: "" }));
      }
    }

    if (field === "companyId") {
      if (value) {
        // If company is selected, clear contact
        setTaskFormData(prev => ({ ...prev, contactId: "" }));
      }
      // Clear contact error when company changes
      if (taskFormErrors.contactId) {
        setTaskFormErrors(prev => ({ ...prev, contactId: "" }));
      }
    }
  };

  // Sorting and pagination logic
  const sortedAndFilteredTasks = useMemo(() => {
    const sorted = [...filteredTasks];

    // Sort tasks
    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return sorted;
  }, [filteredTasks, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedAndFilteredTasks.length / pageSize);
  const paginatedTasks = useMemo(() => {
    return sortedAndFilteredTasks.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [sortedAndFilteredTasks, currentPage, pageSize]);

  const handleSort = (field: keyof TaskWithRelations) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    setSelectedTasks(
      selectedTasks.length === paginatedTasks.length
        ? []
        : paginatedTasks.map(task => task.id)
    );
  };

  const handleSelectAllInTable = () => {
    setSelectedTasks(
      selectedTasks.length === sortedAndFilteredTasks.length
        ? []
        : sortedAndFilteredTasks.map(task => task.id)
    );
  };

  const visibleColumns = tableColumns.filter(col => col.visible);

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

  const TaskCard: React.FC<{ task: TaskWithRelations }> = ({ task }) => (
    <div
      draggable
      onDragStart={e => handleDragStart(e, task)}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 shadow-sm transition-all duration-200 cursor-move hover:shadow-md group"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {priorityIcons[task.priority]}
            <span className="ml-1 capitalize">{task.priority}</span>
          </span>
          {task.isAutomated && (
            <span className="flex gap-1 items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 rounded-full border border-purple-200">
              <Zap className="w-3 h-3" />
              AUTO
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={e => {
              e.stopPropagation();
              openTaskDetail(task);
            }}
            className="p-1 rounded hover:bg-gray-100"
            title="View details"
          >
            <Eye className="w-3 h-3 text-gray-400" />
          </button>
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <h3
        className="mb-2 font-medium text-gray-900 cursor-pointer line-clamp-2 hover:text-blue-600"
        onClick={() => openTaskDetail(task)}
      >
        {task.title.length > 50
          ? `${task.title.substring(0, 50)}...`
          : task.title}
      </h3>

      {task.contact && (
        <div className="flex items-center mb-3 space-x-1 text-sm text-gray-500 dark:text-gray-400">
          <User className="w-3 h-3" />
          <span>{task.contact.name}</span>
        </div>
      )}

      {task.company && (
        <div className="flex items-center mb-3 space-x-1 text-sm text-gray-500 dark:text-gray-400">
          <Building className="w-3 h-3" />
          <span>{task.company.name}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
          <User className="w-3 h-3" />
          <span>{task.assignee?.name || "Unassigned"}</span>
        </div>
        {task.dueDate && (
          <div
            className={`flex items-center space-x-1 text-sm ${getDueDateColor(new Date(task.dueDate))}`}
          >
            <Calendar className="w-3 h-3" />
            <span>{getDaysUntilDue(new Date(task.dueDate))}d</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCellContent = (
    task: TaskWithRelations,
    column: TaskTableColumn
  ) => {
    switch (column.key) {
      case "id":
        return (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {task.id}
          </span>
        );

      case "title":
        return (
          <div className="flex items-center space-x-3">
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {task.title.length > 50
                  ? `${task.title.substring(0, 50)}...`
                  : task.title}
              </div>
              {task.description && (
                <div className="text-sm text-gray-500 line-clamp-1">
                  {task.description.length > 50
                    ? `${task.description.substring(0, 50)}...`
                    : task.description}
                </div>
              )}
            </div>
          </div>
        );

      case "status":
        return (
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const position = calculateDropdownPosition(rect);
                setStatusDropdownData({
                  taskId: task.id,
                  position,
                });
                setStatusSearchTerm("");
              }}
              className="text-sm bg-transparent border-none transition-colors cursor-pointer focus:outline-none hover:text-blue-600"
            >
              {task.status ? (
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === "PENDING"
                      ? "bg-gray-100 text-gray-800"
                      : task.status === "IN_PROGRESS"
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        : task.status === "COMPLETED"
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          : task.status === "CANCELLED"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            : task.status === "OVERDUE"
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {task.status === "IN_PROGRESS"
                    ? "IN PROGRESS"
                    : task.status.replace("_", " ")}
                </span>
              ) : (
                <span className="text-gray-400">Select status</span>
              )}
            </button>
          </div>
        );

      case "priority":
        return (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
          >
            {priorityIcons[task.priority]}
            <span className="ml-1 capitalize">{task.priority}</span>
          </span>
        );

      case "assigneeId":
        return (
          <div className="flex items-center space-x-2">
            <div className="flex justify-center items-center w-6 h-6 bg-gray-300 rounded-full">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {task.assignee?.name
                  ? task.assignee.name
                      .split(" ")
                      .map(n => n[0])
                      .join("")
                  : "U"}
              </span>
            </div>
            <span className="text-sm text-gray-900 dark:text-white">
              {task.assignee?.name || "Unassigned"}
            </span>
          </div>
        );

      case "contactId":
        return task.contact ? (
          <span className="text-sm text-gray-900 dark:text-white">
            {task.contact.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );

      case "companyId":
        return task.company ? (
          <span className="text-sm text-gray-900 dark:text-white">
            {task.company.name}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );

      case "dueDate":
        return task.dueDate ? (
          <span
            className={`text-sm ${getDueDateColor(new Date(task.dueDate))}`}
          >
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        );

      case "createdAt":
        return (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        );

      case "isAutomated":
        return (
          <div className="flex justify-center items-center">
            {task.isAutomated ? (
              <Zap className="w-4 h-4 text-purple-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400" />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 w-8 h-8 text-red-500" />
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      {/* Success Message */}
      {successMessage && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200">
          <div className="flex items-center">
            <Check className="mr-2 w-5 h-5 text-green-600" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tasks
            </h1>
            <button
              onClick={openCreateTaskModal}
              className="inline-flex items-center rounded-xl px-6 py-2 font-medium transition-all duration-200 shadow-sm bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white hover:scale-105"
            >
              <Plus className="inline mr-2 w-4 h-4" />
              New Task
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center p-1 space-x-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "kanban"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          {/* Left: Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks..."
              value={searchValue}
              onChange={e => {
                setSearchValue(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              className="py-2 pr-4 pl-10 w-full text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
              key="search-input"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            )}
            <SearchSuggestions
              searchTerm={searchValue}
              suggestions={
                searchSuggestions as unknown as {
                  id: string;
                  type:
                    | "status"
                    | "company"
                    | "owner"
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
                setSearchValue(suggestion.value);
                setShowSearchSuggestions(false);
              }}
              entityType="tasks"
            />
          </div>

          {/* Right: Filters */}
          <div className="flex gap-3 items-center">
            <NestedFilterDropdown
              filters={filters as unknown as FilterState}
              onUpdateFilters={
                setFilters as unknown as (filters: FilterState) => void
              }
              entityType="tasks"
              availableStatuses={availableTaskStatuses}
              availablePriorities={availableTaskPriorities}
              availableAssignees={availableAssignees}
              availableContacts={availableContactNames}
              availableCompanies={availableCompanyNames}
              availableDueDates={availableDueDates}
            />
          </div>
        </div>

        {/* Selected Filters Display - Now positioned under the filters */}
        {Object.values(filters).some(
          value =>
            (Array.isArray(value) && value.length > 0) ||
            (typeof value === "string" && value !== "") ||
            (typeof value === "object" &&
              value !== null &&
              Object.keys(value).length > 0) ||
            (typeof value === "boolean" && value !== undefined)
        ) && (
          <div className="flex flex-wrap gap-2 px-4 py-2 mt-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Active Filters:
            </span>

            {/* Status Filters */}
            {filters.status.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.status.map(status => (
                  <span
                    key={status}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full"
                  >
                    Status: {status}
                    <button
                      onClick={() => {
                        const newStatuses = filters.status.filter(
                          s => s !== status
                        );
                        setFilters(prev => ({ ...prev, status: newStatuses }));
                      }}
                      className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Priority Filters */}
            {filters.priority.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.priority.map(priority => (
                  <span
                    key={priority}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full"
                  >
                    Priority: {priority}
                    <button
                      onClick={() => {
                        const newPriorities = filters.priority.filter(
                          p => p !== priority
                        );
                        setFilters(prev => ({
                          ...prev,
                          priority: newPriorities,
                        }));
                      }}
                      className="ml-1 hover:text-green-600 dark:hover:text-green-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Assignee Filters */}
            {filters.assignee.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.assignee.map(assignee => (
                  <span
                    key={assignee}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-full"
                  >
                    Assignee: {assignee}
                    <button
                      onClick={() => {
                        const newAssignees = filters.assignee.filter(
                          a => a !== assignee
                        );
                        setFilters(prev => ({
                          ...prev,
                          assignee: newAssignees,
                        }));
                      }}
                      className="ml-1 hover:text-purple-600 dark:hover:text-purple-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Contact Filters */}
            {filters.contact.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.contact.map(contact => (
                  <span
                    key={contact}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-orange-800 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 rounded-full"
                  >
                    Contact: {contact}
                    <button
                      onClick={() => {
                        const newContacts = filters.contact.filter(
                          c => c !== contact
                        );
                        setFilters(prev => ({ ...prev, contact: newContacts }));
                      }}
                      className="ml-1 hover:text-orange-600 dark:hover:text-orange-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Company Filters */}
            {filters.company.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {filters.company.map(company => (
                  <span
                    key={company}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-full"
                  >
                    Company: {company}
                    <button
                      onClick={() => {
                        const newCompanies = filters.company.filter(
                          c => c !== company
                        );
                        setFilters(prev => ({
                          ...prev,
                          company: newCompanies,
                        }));
                      }}
                      className="ml-1 hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Date Range Filter */}
            {filters.dateRange &&
              (filters.dateRange.start ||
                filters.dateRange.end ||
                filters.dateRange.selectedOption) && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                  Date:{" "}
                  {filters.dateRange.selectedOption
                    ? filters.dateRange.selectedOption
                        .replace("_", " ")
                        .replace(/\b\w/g, l => l.toUpperCase())
                    : `${filters.dateRange.start?.toLocaleDateString() || ""} - ${filters.dateRange.end?.toLocaleDateString() || ""}`}
                  <button
                    onClick={() => {
                      setFilters(prev => ({ ...prev, dateRange: {} }));
                    }}
                    className="ml-1 hover:text-yellow-600 dark:hover:text-yellow-400"
                  >
                    ×
                  </button>
                </span>
              )}

            {/* Automation Filter */}
            {filters.isAutomated !== undefined && (
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-full">
                Automated: {filters.isAutomated ? "Yes" : "No"}
                <button
                  onClick={() => {
                    setFilters(prev => ({ ...prev, isAutomated: undefined }));
                  }}
                  className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                >
                  ×
                </button>
              </span>
            )}

            {/* Clear All Filters Button */}
            <button
              onClick={() => {
                setFilters({
                  search: "",
                  status: [],
                  priority: [],
                  assignee: [],
                  contact: [],
                  company: [],
                  dateRange: {},
                  isAutomated: undefined,
                });
              }}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 rounded-full hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "kanban" ? (
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5 max-h-[100vh] overflow-y-auto">
            {tasksByColumn.map(column => (
              <div key={column.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {column.title}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 rounded-full">
                    {column.count}
                  </span>
                </div>
                <div
                  className={`space-y-3 min-h-[200px] p-2 rounded-lg transition-colors ${
                    draggedOverColumn === column.id
                      ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-200 dark:border-blue-700"
                      : ""
                  }`}
                  onDragOver={e => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, column.id)}
                >
                  {column.tasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex relative flex-col max-h-[100vh] overflow-y-auto bg-white dark:bg-gray-800">
          {/* Results Summary and Pagination Controls ABOVE the table */}
          <div className="flex flex-col gap-2 px-6 py-3 border-b border-gray-200 md:flex-row md:justify-between md:items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {paginatedTasks.length} of {sortedAndFilteredTasks.length}{" "}
              tasks
              {selectedTasks.length > 0 &&
                ` (${selectedTasks.length} selected)`}
            </div>
            <div className="flex gap-4 items-center">
              {selectedTasks.length > 0 && (
                <>
                  <button
                    onClick={handleSelectAllInTable}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium leading-4 rounded-md border focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      selectedTasks.length === sortedAndFilteredTasks.length
                        ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/40 focus:ring-red-500 dark:focus:ring-red-400"
                        : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:ring-blue-500 dark:focus:ring-blue-400"
                    }`}
                  >
                    {selectedTasks.length === sortedAndFilteredTasks.length
                      ? `Unselect All (${sortedAndFilteredTasks.length})`
                      : `Select All (${sortedAndFilteredTasks.length})`}
                  </button>
                  <button
                    onClick={openBulkDeleteModal}
                    className="flex items-center px-3 py-2 space-x-2 text-sm font-medium text-red-600 bg-red-50 rounded-md border border-red-200 transition-colors hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Selected ({selectedTasks.length})</span>
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
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="sticky left-0 z-20 px-4 py-3 w-12 text-left align-top bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={
                          selectedTasks.length === paginatedTasks.length &&
                          paginatedTasks.length > 0
                        }
                        ref={input => {
                          if (input) {
                            input.indeterminate =
                              selectedTasks.length > 0 &&
                              selectedTasks.length < paginatedTasks.length;
                          }
                        }}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="sticky left-12 z-20 px-6 py-3 w-80 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase align-top bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-1">
                        <span>Task</span>
                        <button
                          onClick={() => handleSort("title")}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <ArrowUpDown className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                    {visibleColumns
                      .filter(col => col.key !== "title")
                      .map(column => (
                        <th
                          key={column.key}
                          className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 dark:text-gray-400 uppercase align-top whitespace-nowrap border-b border-gray-200"
                          style={{ width: column.width }}
                        >
                          <div className="flex items-center space-x-1">
                            <span>{column.label}</span>
                            {column.sortable && (
                              <button
                                onClick={() => handleSort(column.key)}
                                className="p-1 rounded hover:bg-gray-200"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </th>
                      ))}
                    <th className="sticky right-0 z-20 px-6 py-3 w-32 text-xs font-medium tracking-wider text-right text-gray-500 dark:text-gray-400 uppercase align-top whitespace-nowrap bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTasks.map((task, idx) => (
                    <tr
                      key={task.id}
                      className={
                        idx % 2 === 0
                          ? "bg-white dark:bg-gray-800"
                          : "bg-gray-50 dark:bg-gray-700"
                      }
                    >
                      {/* Selection column */}
                      <td className="sticky left-0 z-10 px-4 py-4 w-12 align-top bg-inherit">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
                      {/* Task column */}
                      <td className="sticky left-12 z-10 px-6 py-4 w-80 align-top bg-inherit">
                        <div className="flex items-center space-x-2 w-full">
                          <div className="flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={() => openTaskDetail(task)}
                              className="text-sm font-medium text-left text-gray-900 dark:text-white truncate hover:underline"
                              title="View task details"
                            >
                              {task.title.length > 50
                                ? `${task.title.substring(0, 50)}...`
                                : task.title}
                            </button>
                            {task.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {task.description.length > 50
                                  ? `${task.description.substring(0, 50)}...`
                                  : task.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Other columns */}
                      {visibleColumns
                        .filter(col => col.key !== "title")
                        .map(column => (
                          <td
                            key={column.key}
                            className="px-6 py-4 align-top whitespace-nowrap"
                          >
                            {renderCellContent(task, column)}
                          </td>
                        ))}
                      <td className="sticky right-0 z-10 px-6 py-4 w-32 text-sm font-medium text-right align-top whitespace-nowrap bg-inherit">
                        <div className="flex justify-end items-center space-x-2">
                          <button
                            onClick={() => openTaskDetail(task)}
                            className="p-1 rounded hover:bg-gray-100"
                            title="View details"
                          >
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Edit task"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </button>
                          <button
                            onClick={() => openDeleteConfirmation(task)}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Delete task"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Popup */}
      {showFilters && (
        <div
          className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm transition-all duration-300 ease-in-out /50 animate-in fade-in"
          onClick={() => {
            setIsFilterModalAnimating(true);
            setTimeout(() => {
              setShowFilters(false);
              setIsFilterModalAnimating(false);
            }, 200);
          }}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg w-[400px] max-h-[500px] overflow-hidden transition-all duration-300 ease-in-out transform ${isFilterModalAnimating ? "filter-modal-exit" : "filter-modal-enter"}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                More Filters
              </h3>
              <button
                onClick={() => {
                  setIsFilterModalAnimating(true);
                  setTimeout(() => {
                    setShowFilters(false);
                    setIsFilterModalAnimating(false);
                  }, 200);
                }}
                className="p-2 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Categories */}
            <div className="p-6">
              <div className="space-y-5">
                {/* Status Filter */}
                <div className="filter-category">
                  <SearchableDropdown
                    value=""
                    onChange={value => {
                      if (value) {
                        toggleArrayFilter("status", value);
                      }
                    }}
                    options={columns.map(col => ({
                      value: col.status,
                      label: col.title,
                      icon:
                        col.status === "PENDING" ? (
                          <Clock className="w-3 h-3 text-gray-600" />
                        ) : col.status === "IN_PROGRESS" ? (
                          <Play className="w-3 h-3 text-blue-600" />
                        ) : col.status === "COMPLETED" ? (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        ) : col.status === "CANCELLED" ? (
                          <XCircle className="w-3 h-3 text-red-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-orange-600" />
                        ), // OVERDUE
                    }))}
                    placeholder="Status"
                    className="w-full"
                  />

                  {filters.status.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.status.map(status => {
                        const col = columns.find(c => c.status === status);
                        return col ? (
                          <span
                            key={status}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-200 dark:border-blue-700 shadow-sm"
                          >
                            {col.title}
                            <button
                              onClick={() =>
                                toggleArrayFilter("status", status)
                              }
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>

                {/* Priority Filter */}
                <div className="filter-category">
                  <SearchableDropdown
                    value=""
                    onChange={value => {
                      if (value) {
                        toggleArrayFilter("priority", value);
                      }
                    }}
                    options={Object.keys(priorityColors).map(priority => ({
                      value: priority,
                      label:
                        priority.charAt(0).toUpperCase() + priority.slice(1),
                      icon:
                        priority === "LOW" ? (
                          <Minus className="w-3 h-3 text-gray-600" />
                        ) : priority === "MEDIUM" ? (
                          <ArrowUp className="w-3 h-3 text-yellow-600" />
                        ) : priority === "HIGH" ? (
                          <ArrowUp className="w-3 h-3 text-orange-600" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        ), // URGENT
                    }))}
                    placeholder="Priority"
                    className="w-full"
                  />

                  {filters.priority.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.priority.map(priority => (
                        <span
                          key={priority}
                          className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-current shadow-sm ${priorityColors[priority as keyof typeof priorityColors]}`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          <button
                            onClick={() =>
                              toggleArrayFilter("priority", priority)
                            }
                            className="ml-1 hover:opacity-70"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Assignee Filter */}
                <div className="filter-category">
                  <SearchableDropdown
                    value=""
                    onChange={value => {
                      if (value) {
                        toggleArrayFilter("assignee", value);
                      }
                    }}
                    options={(() => {
                      // Get assignees from tasks data as fallback
                      const assignees = new Set<string>();
                      tasks.forEach(task => {
                        if (task.assignee?.name) {
                          assignees.add(task.assignee.name);
                        }
                      });
                      const taskAssignees = Array.from(assignees).sort();

                      // Combine with available members
                      const allAssignees = new Set([...taskAssignees]);
                      availableMembers.forEach(member => {
                        allAssignees.add(member.name);
                      });

                      return Array.from(allAssignees).map(assignee => ({
                        value: assignee,
                        label: assignee,
                        icon: <User className="w-3 h-3 text-green-600" />,
                      }));
                    })()}
                    placeholder="Assignee"
                    className="w-full"
                  />

                  {filters.assignee.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {filters.assignee.map(assignee => (
                        <span
                          key={assignee}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-green-50 text-green-800 border border-green-200 rounded-full shadow-sm"
                        >
                          {assignee}
                          <button
                            onClick={() =>
                              toggleArrayFilter("assignee", assignee)
                            }
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Due Date Filter */}
                <div className="filter-category">
                  <SearchableDropdown
                    value=""
                    onChange={value => {
                      if (value) {
                        updateFilter(
                          "dueDatePreset" as keyof FilterState,
                          value as string
                        );
                      }
                    }}
                    options={datePresets.map(preset => ({
                      value: preset.value,
                      label: preset.label,
                      icon:
                        preset.value === "today" ? (
                          <Calendar className="w-3 h-3 text-green-600" />
                        ) : preset.value === "tomorrow" ? (
                          <Calendar className="w-3 h-3 text-blue-600" />
                        ) : preset.value === "this_week" ? (
                          <Calendar className="w-3 h-3 text-purple-600" />
                        ) : preset.value === "next_week" ? (
                          <Calendar className="w-3 h-3 text-indigo-600" />
                        ) : preset.value === "this_month" ? (
                          <Calendar className="w-3 h-3 text-pink-600" />
                        ) : preset.value === "overdue" ? (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        ) : (
                          <Clock className="w-3 h-3 text-orange-600" />
                        ), // due_soon
                    }))}
                    placeholder="Due Date"
                    className="w-full"
                  />

                  {(filters as unknown as { dueDatePreset?: string })
                    .dueDatePreset && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(() => {
                        const selectedPreset = datePresets.find(
                          p =>
                            p.value ===
                            (filters as unknown as { dueDatePreset?: string })
                              .dueDatePreset
                        );
                        return selectedPreset ? (
                          <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-full shadow-sm">
                            {selectedPreset.label}
                            <button
                              onClick={() =>
                                updateFilter(
                                  "dueDatePreset" as keyof FilterState,
                                  undefined
                                )
                              }
                              className="ml-1 text-indigo-600 hover:text-indigo-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Type Filter */}
                <div className="filter-category">
                  <SearchableDropdown
                    value=""
                    onChange={value => {
                      if (value) {
                        updateFilter(
                          "isAutomated" as keyof FilterState,
                          value === "automated" ? true : undefined
                        );
                      }
                    }}
                    options={[
                      {
                        value: "automated",
                        label: "Automated",
                        icon: <Zap className="w-3 h-3 text-yellow-600" />,
                      },
                    ]}
                    placeholder="Type"
                    className="w-full"
                  />

                  {filters.isAutomated === true && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full shadow-sm">
                        Automated
                        <button
                          onClick={() =>
                            updateFilter(
                              "isAutomated" as keyof FilterState,
                              undefined
                            )
                          }
                          className="ml-1 text-yellow-600 hover:text-yellow-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsFilterModalAnimating(true);
                  setTimeout(() => {
                    setShowFilters(false);
                    setIsFilterModalAnimating(false);
                  }, 200);
                }}
                className="px-6 py-3 w-full text-sm font-semibold text-white bg-blue-600 rounded-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-md transform hover:scale-[1.02]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Task Creation/Editing Modal */}
      {showTaskModal && (
        <div
          className={`flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm transition-all duration-300 ease-in-out /50 ${
            isModalAnimating ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeTaskModal}
        >
          <div
            className={`mx-4 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${
              isModalAnimating ? "modal-exit" : "modal-enter"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingTask ? "Edit Task" : "Create New Task"}
              </h3>
              <button
                onClick={closeTaskModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isLoadingData ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Loading data...
                  </span>
                </div>
              ) : (
                <form onSubmit={handleTaskFormSubmit} className="space-y-6">
                  {/* Title */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={taskFormData.title}
                      onChange={e =>
                        handleTaskFormChange("title", e.target.value)
                      }
                      className={`px-3 py-2 w-full rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        taskFormErrors.title
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter task title"
                    />
                    {taskFormErrors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {taskFormErrors.title}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <MarkdownEditor
                      value={taskFormData.description}
                      onChange={value =>
                        handleTaskFormChange("description", value)
                      }
                      placeholder="Enter task description (supports markdown)"
                      className="w-full"
                    />
                  </div>

                  {/* Priority and Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <SearchableDropdown
                        value={taskFormData.priority}
                        onChange={value =>
                          handleTaskFormChange("priority", value)
                        }
                        options={[
                          {
                            value: "LOW",
                            label: "Low",
                            icon: <Minus className="w-4 h-4 text-gray-500" />,
                          },
                          {
                            value: "MEDIUM",
                            label: "Medium",
                            icon: (
                              <ArrowUp className="w-4 h-4 text-yellow-500" />
                            ),
                          },
                          {
                            value: "HIGH",
                            label: "High",
                            icon: (
                              <ArrowUp className="w-4 h-4 text-orange-500" />
                            ),
                          },
                          {
                            value: "URGENT",
                            label: "Urgent",
                            icon: (
                              <AlertTriangleIcon className="w-4 h-4 text-red-500" />
                            ),
                          },
                        ]}
                        placeholder="Select priority"
                        error={taskFormErrors.priority}
                      />
                      {taskFormErrors.priority && (
                        <p className="mt-1 text-sm text-red-600">
                          {taskFormErrors.priority}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <SearchableDropdown
                        value={taskFormData.status}
                        onChange={value =>
                          handleTaskFormChange("status", value)
                        }
                        options={columns.map(col => ({
                          value: col.status,
                          label: col.title,
                          icon:
                            col.status === "PENDING" ? (
                              <Clock className="w-4 h-4 text-gray-500" />
                            ) : col.status === "IN_PROGRESS" ? (
                              <Play className="w-4 h-4 text-blue-500" />
                            ) : col.status === "COMPLETED" ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : col.status === "CANCELLED" ? (
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : (
                              <AlertTriangleIcon className="w-4 h-4 text-orange-500" />
                            ), // OVERDUE
                        }))}
                        placeholder="Select status"
                        error={taskFormErrors.status}
                      />
                      {taskFormErrors.status && (
                        <p className="mt-1 text-sm text-red-600">
                          {taskFormErrors.status}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assignee
                    </label>
                    <SearchableDropdown
                      value={taskFormData.assigneeId}
                      onChange={value =>
                        handleTaskFormChange("assigneeId", value)
                      }
                      options={[
                        { value: "", label: "Select assignee" },
                        ...availableMembers.map(member => ({
                          value: member.id,
                          label: `${member.name} (${member.email})`,
                        })),
                      ]}
                      placeholder="Select assignee"
                    />
                  </div>

                  {/* Contact and Company - Mutually Exclusive */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Associate with (Select one)
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className={`p-3 rounded-lg border-2 transition-all ${
                          taskFormData.contactId
                            ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30"
                            : taskFormData.companyId
                              ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-50"
                              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          Contact {taskFormData.contactId && "✓"}
                        </label>
                        <SearchableDropdown
                          value={taskFormData.contactId}
                          onChange={value =>
                            handleTaskFormChange("contactId", value)
                          }
                          options={[
                            { value: "", label: "Select contact" },
                            ...availableContacts.map(contact => ({
                              value: contact.id,
                              label: `${contact.name}${contact.email ? ` (${contact.email})` : ""}`,
                            })),
                          ]}
                          placeholder="Select contact"
                          disabled={!!taskFormData.companyId}
                          error={taskFormErrors.contactId}
                        />
                        {taskFormErrors.contactId && (
                          <p className="mt-1 text-sm text-red-600">
                            {taskFormErrors.contactId}
                          </p>
                        )}
                      </div>
                      <div
                        className={`p-3 rounded-lg border-2 transition-all ${
                          taskFormData.companyId
                            ? "border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30"
                            : taskFormData.contactId
                              ? "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 opacity-50"
                              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                        }`}
                      >
                        <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                          Company {taskFormData.companyId && "✓"}
                        </label>
                        <SearchableDropdown
                          value={taskFormData.companyId}
                          onChange={value =>
                            handleTaskFormChange("companyId", value)
                          }
                          options={[
                            { value: "", label: "Select company" },
                            ...availableCompanies.map(company => ({
                              value: company.id,
                              label: `${company.name}${company.industry ? ` (${company.industry})` : ""}`,
                            })),
                          ]}
                          placeholder="Select company"
                          disabled={!!taskFormData.contactId}
                          error={taskFormErrors.companyId}
                        />
                        {taskFormErrors.companyId && (
                          <p className="mt-1 text-sm text-red-600">
                            {taskFormErrors.companyId}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      💡 You can associate the task with either a contact or a
                      company, but not both
                    </p>
                  </div>

                  {/* Due Date and Automation */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={taskFormData.dueDate}
                        onChange={e =>
                          handleTaskFormChange("dueDate", e.target.value)
                        }
                        className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="flex items-center mt-6">
                        <input
                          type="checkbox"
                          checked={taskFormData.isAutomated}
                          onChange={e =>
                            handleTaskFormChange(
                              "isAutomated",
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Automated Task
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end items-center pt-4 space-x-3">
                    <button
                      type="button"
                      onClick={closeTaskModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          {editingTask ? "Updating..." : "Creating..."}
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 w-4 h-4" />
                          {editingTask ? "Update Task" : "Create Task"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task Detail Panel */}
      {isTaskDetailOpen && selectedTask && (
        <div
          className="flex fixed inset-0 z-50 justify-end"
          onClick={closeTaskDetail}
        >
          <div
            className={`fixed inset-y-0 right-0 z-50 w-[700px] bg-white dark:bg-gray-800 border-l border-gray-200 shadow-2xl transform ${
              isTaskDetailAnimating ? "task-detail-exit" : "task-detail-enter"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Task Details
                </h3>
                <button
                  onClick={closeTaskDetail}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedTask.title}
                    </h2>
                    {selectedTask.description && (
                      <div className="mt-3">
                        <div className="mb-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg markdown-content">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedTask.description}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Status
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedTask.status === "PENDING"
                            ? "bg-gray-100 text-gray-800"
                            : selectedTask.status === "IN_PROGRESS"
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              : selectedTask.status === "COMPLETED"
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                : selectedTask.status === "CANCELLED"
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {selectedTask.status.replace("_", " ")}
                      </span>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Priority
                      </label>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[selectedTask.priority]}`}
                      >
                        {priorityIcons[selectedTask.priority]}
                        <span className="ml-1 capitalize">
                          {selectedTask.priority}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Assignee */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Assignee
                    </label>
                    {selectedTask.assignee ? (
                      <div className="flex items-center space-x-3">
                        <div className="flex justify-center items-center w-8 h-8 bg-gray-300 rounded-full">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedTask.assignee.name
                              ? selectedTask.assignee.name
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                              : "U"}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedTask.assignee.name}
                          </p>
                          {selectedTask.assignee.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedTask.assignee.email}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="italic text-gray-500 dark:text-gray-400">
                        Unassigned
                      </p>
                    )}
                  </div>

                  {/* Associated Contact/Company */}
                  {(selectedTask.contact || selectedTask.company) && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Associated
                      </label>
                      {selectedTask.contact && (
                        <div className="flex items-center p-3 space-x-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedTask.contact.name}
                            </p>
                            {selectedTask.contact.email && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedTask.contact.email}
                              </p>
                            )}
                            {selectedTask.contact.phoneNumber && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedTask.contact.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedTask.company && (
                        <div className="flex items-center p-3 space-x-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                          <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {selectedTask.company.name}
                            </p>
                            {selectedTask.company.industry && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedTask.company.industry}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Due Date */}
                  {selectedTask.dueDate && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Due Date
                      </label>
                      <div
                        className={`flex items-center space-x-2 ${getDueDateColor(new Date(selectedTask.dueDate))}`}
                      >
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">
                          {new Date(selectedTask.dueDate).toLocaleDateString()}
                        </span>
                        <span className="text-sm">
                          ({getDaysUntilDue(new Date(selectedTask.dueDate))}{" "}
                          days)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Completion Date */}
                  {selectedTask.completedAt && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Completed
                      </label>
                      <div className="flex items-center space-x-2 text-green-600">
                        <Calendar className="w-5 h-5" />
                        <span className="font-medium">
                          {new Date(
                            selectedTask.completedAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Automation */}
                  {selectedTask.isAutomated && (
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Automation
                      </label>
                      <div className="flex items-center p-3 space-x-2 bg-purple-50 rounded-lg">
                        <Zap className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-800">
                          Automated Task
                        </span>
                      </div>
                      {selectedTask.automationRule && (
                        <div className="p-3 mt-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Trigger:</span>{" "}
                            {selectedTask.automationRule.trigger as string}
                          </p>
                          {Boolean(selectedTask.automationRule.conditions) && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Conditions:</span>{" "}
                              {JSON.stringify(
                                selectedTask.automationRule.conditions
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Workspace and Organization */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Workspace
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedTask.workspace?.name}
                      </p>
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        Organization
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedTask.organization?.name}
                      </p>
                    </div>
                  </div>

                  {/* Created/Updated Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">Created:</span>
                      <p>
                        {new Date(selectedTask.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium">Updated:</span>
                      <p>
                        {new Date(selectedTask.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      openEditTaskModal(selectedTask);
                      closeTaskDetail();
                    }}
                    className="flex flex-1 justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    <Edit className="mr-2 w-4 h-4" />
                    Edit Task
                  </button>
                  <button
                    onClick={() => openDeleteConfirmation(selectedTask)}
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-white dark:bg-gray-800 rounded-md border border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && selectedTasks.length > 0 && (
        <div
          className={`flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm transition-all duration-300 ease-in-out /50 ${
            isBulkDeleteModalAnimating ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeBulkDeleteModal}
        >
          <div
            className={`mx-4 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${
              isBulkDeleteModalAnimating ? "modal-exit" : "modal-enter"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Tasks
              </h3>
              <button
                onClick={closeBulkDeleteModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4 space-x-3">
                <div className="flex justify-center items-center w-10 h-10 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Are you sure?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Tasks to delete:</span>{" "}
                  {selectedTasks.length} task(s)
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  This will permanently remove {selectedTasks.length} selected
                  task(s) from the system.
                </p>
              </div>
            </div>
            <div className="flex justify-end items-center p-6 space-x-3 border-t border-gray-200">
              <button
                onClick={closeBulkDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={bulkDeleteTasks}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete {selectedTasks.length} Task(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && taskToDelete && (
        <div
          className={`flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm transition-all duration-300 ease-in-out /50 ${
            isDeleteModalAnimating ? "opacity-0" : "opacity-100"
          }`}
          onClick={closeDeleteModal}
        >
          <div
            className={`mx-4 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden ${
              isDeleteModalAnimating ? "modal-exit" : "modal-enter"
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-shrink-0 justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Delete Task
              </h3>
              <button
                onClick={closeDeleteModal}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center mb-4 space-x-3">
                <div className="flex justify-center items-center w-10 h-10 bg-red-100 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Are you sure?
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Task:</span>{" "}
                  {taskToDelete.title}
                </p>
                {taskToDelete.assignee && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Assignee:</span>{" "}
                    {taskToDelete.assignee.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end items-center p-6 space-x-3 border-t border-gray-200">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteTask}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Delete Task
              </button>
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
            className="absolute p-3 max-w-xs bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg searchable-dropdown-enter"
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
                className="p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
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
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
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
                      tasks.find(t => t.id === statusDropdownData.taskId)
                        ?.status === status;
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          if (!isSelected)
                            updateTaskStatus(
                              statusDropdownData.taskId,
                              status as TaskWithRelations["status"]
                            );
                          setStatusDropdownData(null);
                        }}
                        disabled={isSelected}
                        className={`w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded transition-colors ${
                          isSelected
                            ? "text-gray-400 cursor-not-allowed bg-gray-50 dark:bg-gray-800"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {status === "IN_PROGRESS"
                          ? "IN PROGRESS"
                          : status.charAt(0).toUpperCase() +
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
    </div>
  );
};

export default TasksBoard;
