import React, { useState, useEffect, useCallback } from "react";
import toastService from "@/services/sales-services/toastService";
import {
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Building,
  Play,
  Pause,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Zap,
} from "lucide-react";
import taskService, {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskQueryParams,
} from "../../services/sales-services/taskService";
import { TaskWithRelations } from "../../types/sales-types";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useAuth } from "../../hooks/sales-hooks/useAuth";

interface TaskSectionProps {
  entityId: string;
  entityType: "contact" | "company" | "deal";
  entityName: string;
  onRefresh?: () => void;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  entityId,
  entityType,
  onRefresh,
}) => {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterParams, setFilterParams] = useState<TaskQueryParams>({});
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "",
    isAutomated: false,
    automationRule: {
      trigger: "manual",
      conditions: { stage: "test" },
      actions: [{ type: "create_task", title: "Follow up" }],
    },
  });

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

      let response;
      if (entityType === "contact") {
        response = await taskService.getTasksByContact(
          entityId,
          selectedWorkspace.id,
          selectedOrganization.id,
          token,
          filterParams
        );
      } else if (entityType === "company") {
        response = await taskService.getTasksByCompany(
          entityId,
          selectedWorkspace.id,
          selectedOrganization.id,
          token,
          filterParams
        );
      } else if (entityType === "deal") {
        response = await taskService.getTasksByDeal(
          entityId,
          selectedWorkspace.id,
          selectedOrganization.id,
          token,
          filterParams
        );
      } else {
        toastService.error(`Unsupported entity type: ${entityType}`);
        setError(`Unsupported entity type: ${entityType}`);
        return;
      }

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
  }, [
    user,
    selectedWorkspace,
    selectedOrganization,
    entityId,
    entityType,
    filterParams,
  ]);

  // Load tasks on mount and when dependencies change
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(
    task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.description &&
        task.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Create task
  const handleCreateTask = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    if (!formData.title.trim()) {
      setError("Task title is required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      // Prepare task data - only include valid fields
      const taskData: CreateTaskRequest = {
        title: formData.title.trim(),
        priority: formData.priority,
        status: formData.status,
        isAutomated: formData.isAutomated,
      };

      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        taskData.description = formData.description.trim();
      }

      if (formData.dueDate && formData.dueDate.trim()) {
        // Convert datetime-local to ISO string
        const date = new Date(formData.dueDate);
        if (!isNaN(date.getTime())) {
          taskData.dueDate = date.toISOString();
        }
      }

      // Only include automation rule if task is automated and rule exists
      if (formData.isAutomated && formData.automationRule) {
        taskData.automationRule = formData.automationRule;
      }

      let response: any;
      if (entityType === "contact") {
        response = await taskService.createTaskForContact(
          entityId,
          taskData,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
      } else if (entityType === "company") {
        response = await taskService.createTaskForCompany(
          entityId,
          taskData,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
      } else if (entityType === "deal") {
        response = await taskService.createTaskForDeal(
          entityId,
          taskData,
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        );
      } else {
        toastService.error(`Unsupported entity type: ${entityType}`);
        setError(`Unsupported entity type: ${entityType}`);
        return;
      }

      if (response.success && response.data) {
        setTasks(prev => [response.data!, ...prev]);
        setSuccess("Task created successfully");
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          priority: "MEDIUM",
          status: "PENDING",
          dueDate: "",
          isAutomated: false,
          automationRule: {
            trigger: "manual",
            conditions: { stage: "test" },
            actions: [{ type: "create_task", title: "Follow up" }],
          },
        });
        onRefresh?.();
      } else {
        setError(response.error || "Failed to create task");
      }
    } catch (err) {
      setError("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  // Update task
  const handleUpdateTask = async (
    taskId: string,
    updateData: UpdateTaskRequest
  ) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.updateTask(
        taskId,
        updateData,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success && response.data) {
        setTasks(prev =>
          prev.map(task => (task.id === taskId ? response.data! : task))
        );
        setSuccess("Task updated successfully");
        onRefresh?.();
      } else {
        setError(response.error || "Failed to update task");
      }
    } catch (err) {
      setError("Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    if (!confirm("Are you sure you want to delete this task?")) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await taskService.deleteTask(
        taskId,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        setSuccess("Task deleted successfully");
        onRefresh?.();
      } else {
        setError(response.error || "Failed to delete task");
      }
    } catch (err) {
      // Check if it's a JSON parsing error (204 response)
      if (err instanceof Error && err.message.includes("JSON")) {
        // Task was likely deleted successfully, just update UI
        setTasks(prev => prev.filter(task => task.id !== taskId));
        setSelectedTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
        setSuccess("Task deleted successfully");
        onRefresh?.();
      } else {
        setError("Failed to delete task");
      }
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete tasks
  const handleBulkDelete = async () => {
    if (!user || !selectedWorkspace || !selectedOrganization) return;

    if (selectedTasks.size === 0) {
      setError("No tasks selected for deletion");
      return;
    }

    if (
      !confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)
    )
      return;

    setLoading(true);
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const taskIds = Array.from(selectedTasks);
      const response = await taskService.bulkDeleteTasks(
        taskIds,
        selectedWorkspace.id,
        selectedOrganization.id,
        token
      );

      if (response.success) {
        setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
        setSelectedTasks(new Set());
        setSuccess(`${selectedTasks.size} task(s) deleted successfully`);
        onRefresh?.();
      } else {
        setError(response.error || "Failed to delete tasks");
      }
    } catch (err) {
      // Check if it's a JSON parsing error (204 response)
      if (err instanceof Error && err.message.includes("JSON")) {
        // Tasks were likely deleted successfully, just update UI
        setTasks(prev => prev.filter(task => !selectedTasks.has(task.id)));
        setSelectedTasks(new Set());
        setSuccess(`${selectedTasks.size} task(s) deleted successfully`);
        onRefresh?.();
      } else {
        setError("Failed to delete tasks");
      }
    } finally {
      setLoading(false);
    }
  };

  // Update task status
  const handleStatusChange = async (
    taskId: string,
    status: TaskWithRelations["status"]
  ) => {
    await handleUpdateTask(taskId, { status });
  };

  // Update task priority
  const handlePriorityChange = async (
    taskId: string,
    priority: TaskWithRelations["priority"]
  ) => {
    await handleUpdateTask(taskId, { priority });
  };

  // Toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Select all tasks
  const selectAllTasks = () => {
    setSelectedTasks(new Set(filteredTasks.map(task => task.id)));
  };

  // Deselect all tasks
  const deselectAllTasks = () => {
    setSelectedTasks(new Set());
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Apply filters
  const applyFilters = () => {
    loadTasks();
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setFilterParams({});
    setSearchTerm("");
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-50 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "OVERDUE":
        return "bg-red-50 text-red-700 border-red-200";
      case "CANCELLED":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-50 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "LOW":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return "No due date";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if task is overdue
  const isOverdue = (task: TaskWithRelations) => {
    if (
      !task.dueDate ||
      task.status === "COMPLETED" ||
      task.status === "CANCELLED"
    ) {
      return false;
    }
    return new Date(task.dueDate) < new Date();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-900">Tasks</h3>
        <div className="flex items-center space-x-2">
          {selectedTasks.size > 0 && (
            <span className="text-xs text-gray-500">
              {selectedTasks.size} selected
            </span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
          >
            <Filter className="mr-1 w-3 h-3" />
            Filter
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={loading}
            className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            <Plus className="mr-1 w-3 h-3" />
            Add Task
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="py-2 pr-4 pl-10 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Status
              </label>
              <select
                value={filterParams.status || ""}
                onChange={e =>
                  setFilterParams(prev => ({
                    ...prev,
                    status:
                      (e.target.value as TaskWithRelations["status"]) ||
                      undefined,
                  }))
                }
                className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Priority
              </label>
              <select
                value={filterParams.priority || ""}
                onChange={e =>
                  setFilterParams(prev => ({
                    ...prev,
                    priority:
                      (e.target.value as TaskWithRelations["priority"]) ||
                      undefined,
                  }))
                }
                className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Automation
              </label>
              <select
                value={
                  filterParams.isAutomated === undefined
                    ? ""
                    : filterParams.isAutomated.toString()
                }
                onChange={e =>
                  setFilterParams(prev => ({
                    ...prev,
                    isAutomated:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
                  }))
                }
                className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tasks</option>
                <option value="true">Automated Only</option>
                <option value="false">Manual Only</option>
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="flex-1 px-3 py-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-700">
              {selectedTasks.size} task(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={deselectAllTasks}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Deselect All
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={loading}
                className="flex items-center px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="mr-1 w-3 h-3" />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="p-3 bg-red-50 rounded-md border border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-50 rounded-md border border-green-200">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Create Task Form */}
      {showCreateForm && (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData(prev => ({ ...prev, title: e.target.value }))
                }
                className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      priority: e.target.value as TaskWithRelations["priority"],
                    }))
                  }
                  className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-medium text-gray-700">
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, dueDate: e.target.value }))
                  }
                  className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAutomated"
                checked={formData.isAutomated}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    isAutomated: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <label htmlFor="isAutomated" className="text-xs text-gray-700">
                Automated Task
              </label>
              <Zap className="w-3 h-3 text-yellow-500" />
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleCreateTask}
                disabled={loading || !formData.title.trim()}
                className="flex items-center px-3 py-2 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="mr-2 w-3 h-3 rounded-full border border-white animate-spin border-t-transparent" />
                ) : (
                  <CheckCircle2 className="mr-2 w-3 h-3" />
                )}
                Create Task
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({
                    title: "",
                    description: "",
                    priority: "MEDIUM",
                    status: "PENDING",
                    dueDate: "",
                    isAutomated: false,
                    automationRule: {
                      trigger: "manual",
                      conditions: { stage: "test" },
                      actions: [{ type: "create_task", title: "Follow up" }],
                    },
                  });
                }}
                className="px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {loading && tasks.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-2 w-6 h-6 rounded-full border border-blue-600 animate-spin border-t-transparent" />
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-8 text-center">
          <CheckSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            {searchTerm ? "No tasks match your search" : "No tasks yet"}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Add first task
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center p-2 space-x-2 bg-gray-50 rounded-md">
            <input
              type="checkbox"
              checked={
                selectedTasks.size === filteredTasks.length &&
                filteredTasks.length > 0
              }
              onChange={e =>
                e.target.checked ? selectAllTasks() : deselectAllTasks()
              }
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-600">
              Select All ({filteredTasks.length})
            </span>
          </div>

          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
                isOverdue(task)
                  ? "bg-red-50 border-red-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {/* Task Header */}
              <div className="p-3">
                <div className="flex justify-between items-start">
                  {/* Left side - Checkbox and main content */}
                  <div className="flex flex-1 gap-3 items-start min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Task title */}
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {task.title}
                        </h4>
                      </div>

                      {/* Status and priority badges */}
                      <div className="flex items-center mb-3 gap-1.5">
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-md ${getStatusColor(task.status)}`}
                        >
                          {task.status.replace("_", " ")}
                        </span>

                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-md ${getPriorityColor(task.priority)}`}
                        >
                          {task.priority}
                        </span>

                        {task.isAutomated && (
                          <span className="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-md border border-purple-200 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            AUTO
                          </span>
                        )}

                        {isOverdue(task) && (
                          <span className="px-2 py-0.5 text-xs font-medium text-red-700 bg-red-50 rounded-md border border-red-200">
                            OVERDUE
                          </span>
                        )}
                      </div>

                      {/* Metadata - single line with proper spacing */}
                      <div className="flex gap-4 items-center text-xs text-gray-600">
                        {task.dueDate && (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        )}

                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {task.assignee.name}
                            </span>
                          </div>
                        )}

                        {task.contact && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {task.contact.name}
                            </span>
                          </div>
                        )}

                        {task.company && (
                          <div className="flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {task.company.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Action buttons */}
                  <div className="flex gap-1 items-center ml-3">
                    {task.status !== "COMPLETED" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "COMPLETED")}
                        disabled={loading}
                        className="p-2 text-green-600 rounded-md transition-colors hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                        title="Mark as completed"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}

                    {task.status === "PENDING" && (
                      <button
                        onClick={() =>
                          handleStatusChange(task.id, "IN_PROGRESS")
                        }
                        disabled={loading}
                        className="p-2 text-blue-600 rounded-md transition-colors hover:text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        title="Start task"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}

                    {task.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => handleStatusChange(task.id, "PENDING")}
                        disabled={loading}
                        className="p-2 text-yellow-600 rounded-md transition-colors hover:text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                        title="Pause task"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => toggleTaskExpansion(task.id)}
                      className="p-2 text-gray-400 rounded-md transition-colors hover:text-gray-600 hover:bg-gray-50"
                      title="Toggle edit mode"
                    >
                      {expandedTasks.has(task.id) ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      disabled={loading}
                      className="p-2 text-red-400 rounded-md transition-colors hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Task Details */}
              {expandedTasks.has(task.id) && (
                <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                  <div className="pt-4">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          value={task.status}
                          onChange={e =>
                            handleStatusChange(
                              task.id,
                              e.target.value as TaskWithRelations["status"]
                            )
                          }
                          disabled={loading}
                          className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Priority
                        </label>
                        <select
                          value={task.priority}
                          onChange={e =>
                            handlePriorityChange(
                              task.id,
                              e.target.value as TaskWithRelations["priority"]
                            )
                          }
                          disabled={loading}
                          className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Due Date
                        </label>
                        <input
                          type="datetime-local"
                          value={
                            task.dueDate
                              ? new Date(task.dueDate)
                                  .toISOString()
                                  .slice(0, 16)
                              : ""
                          }
                          onChange={e =>
                            handleUpdateTask(task.id, {
                              dueDate: e.target.value,
                            })
                          }
                          disabled={loading}
                          className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block mb-2 font-medium text-gray-700">
                          Created
                        </label>
                        <div className="px-3 py-2 text-xs text-gray-600 bg-gray-100 rounded-md">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {task.description && (
                      <div className="mt-4">
                        <label className="block mb-2 font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          value={task.description}
                          onChange={e =>
                            handleUpdateTask(task.id, {
                              description: e.target.value,
                            })
                          }
                          disabled={loading}
                          rows={3}
                          className="px-3 py-2 w-full text-xs rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}

                    {task.isAutomated && task.automationRule && (
                      <div className="p-3 mt-4 bg-purple-50 rounded-md border border-purple-200">
                        <div className="flex items-center mb-2 space-x-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-semibold text-purple-700">
                            Automation Rule
                          </span>
                        </div>
                        <div className="space-y-1 text-xs text-purple-600">
                          <div>
                            <span className="font-medium">Trigger:</span>{" "}
                            {task.automationRule.trigger as string}
                          </div>
                          <div>
                            <span className="font-medium">Conditions:</span>{" "}
                            {JSON.stringify(task.automationRule.conditions)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskSection;
