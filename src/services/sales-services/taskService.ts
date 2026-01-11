import { TaskWithRelations } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";
// DTOs for API requests
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  assigneeId?: string;
  isAutomated?: boolean;
  automationRule?: Record<string, unknown>;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  assigneeId?: string;
  isAutomated?: boolean;
  automationRule?: Record<string, unknown>;
}

export interface TaskQueryParams {
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  assigneeId?: string;
  contactId?: string;
  companyId?: string;
  isAutomated?: boolean;
}

export interface BulkDeleteTasksRequest {
  taskIds: string[];
}

// API Response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TaskListResponse {
  success: boolean;
  data: TaskWithRelations[];
  message?: string;
}

class TaskService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    // Handle 204 No Content responses (DELETE operations)
    if (response.status === 204) {
      return { success: true } as T;
    }

    return response.json();
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
    data?: Record<string, unknown>,
    token?: string,
    queryParams?: Record<string, string | number | boolean>
  ): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${API_BASE_URL}/tasks${endpoint}`);

      // Add query parameters
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            url.searchParams.append(key, String(value));
          }
        });
      }

      const headers = token
        ? this.getAuthHeaders(token)
        : { "Content-Type": "application/json" };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      const responseData = await this.handleResponse<ApiResponse<T>>(response);

      return responseData;
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  // Get all tasks
  async getTasks(
    workspaceId: string,
    organizationId: string,
    token: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<TaskWithRelations[]>> {
    const params = {
      workspaceId,
      organizationId,
      ...queryParams,
    };

    return this.makeRequest<TaskWithRelations[]>(
      "",
      "GET",
      undefined,
      token,
      params
    );
  }

  // Get a single task
  async getTask(
    taskId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const params = {
      workspaceId,
      organizationId,
    };

    return this.makeRequest<TaskWithRelations>(
      `/${taskId}`,
      "GET",
      undefined,
      token,
      params
    );
  }

  // Create a new task
  async createTask(
    taskData: CreateTaskRequest,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const params = {
      workspaceId,
      organizationId,
    };

    return toastService.promise(
      this.makeRequest<TaskWithRelations>(
        "",
        "POST",
        taskData as unknown as Record<string, unknown>,
        token,
        params
      ),
      {
        loading: "Creating task...",
        success: "Task created successfully!",
        error: "Failed to create task",
      }
    );
  }

  // Update a task
  async updateTask(
    taskId: string,
    taskData: UpdateTaskRequest,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const params = {
      workspaceId,
      organizationId,
    };

    return toastService.promise(
      this.makeRequest<TaskWithRelations>(
        `/${taskId}`,
        "PATCH",
        taskData as unknown as Record<string, unknown>,
        token,
        params
      ),
      {
        loading: "Updating task...",
        success: "Task updated successfully!",
        error: "Failed to update task",
      }
    );
  }

  // Delete a task
  async deleteTask(
    taskId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<void>> {
    const params = {
      workspaceId,
      organizationId,
    };

    return toastService.promise(
      this.makeRequest<void>(`/${taskId}`, "DELETE", undefined, token, params),
      {
        loading: "Deleting task...",
        success: "Task deleted successfully!",
        error: "Failed to delete task",
      }
    );
  }

  // Bulk delete tasks
  async bulkDeleteTasks(
    taskIds: string[],
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<void>> {
    const params = {
      workspaceId,
      organizationId,
    };

    return toastService.promise(
      this.makeRequest<void>("/bulk", "DELETE", { taskIds }, token, params),
      {
        loading: "Deleting tasks...",
        success: "Tasks deleted successfully!",
        error: "Failed to delete tasks",
      }
    );
  }

  // Get tasks by contact
  async getTasksByContact(
    contactId: string,
    workspaceId: string,
    organizationId: string,
    token: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<TaskWithRelations[]>> {
    const params = {
      workspaceId,
      organizationId,
      ...queryParams,
    };

    return this.makeRequest<TaskWithRelations[]>(
      `/contacts/${contactId}`,
      "GET",
      undefined,
      token,
      params
    );
  }

  // Get tasks by company
  async getTasksByCompany(
    companyId: string,
    workspaceId: string,
    organizationId: string,
    token: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<TaskWithRelations[]>> {
    const params = {
      workspaceId,
      organizationId,
      ...queryParams,
    };

    return this.makeRequest<TaskWithRelations[]>(
      `/companies/${companyId}`,
      "GET",
      undefined,
      token,
      params
    );
  }

  // Get tasks by deal
  async getTasksByDeal(
    dealId: string,
    workspaceId: string,
    organizationId: string,
    token: string,
    queryParams?: TaskQueryParams
  ): Promise<ApiResponse<TaskWithRelations[]>> {
    const params = {
      workspaceId,
      organizationId,
      ...queryParams,
    };

    return this.makeRequest<TaskWithRelations[]>(
      `/deals/${dealId}`,
      "GET",
      undefined,
      token,
      params
    );
  }

  // Create task for a contact
  async createTaskForContact(
    contactId: string,
    taskData: Omit<CreateTaskRequest, "contactId">,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const fullTaskData = {
      ...taskData,
      contactId,
    };

    return this.createTask(fullTaskData, workspaceId, organizationId, token);
  }

  // Create task for a company
  async createTaskForCompany(
    companyId: string,
    taskData: Omit<CreateTaskRequest, "companyId">,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const fullTaskData = {
      ...taskData,
      companyId,
    };

    return this.createTask(fullTaskData, workspaceId, organizationId, token);
  }

  // Create task for a deal
  async createTaskForDeal(
    dealId: string,
    taskData: Omit<CreateTaskRequest, "dealId">,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const fullTaskData = {
      ...taskData,
      dealId,
    };

    return this.createTask(fullTaskData, workspaceId, organizationId, token);
  }

  // Update task status
  async updateTaskStatus(
    taskId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE",
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    const updateData: UpdateTaskRequest = { status };

    if (status === "COMPLETED") {
      updateData.completedAt = new Date().toISOString();
    } else {
      updateData.completedAt = undefined;
    }

    return this.updateTask(
      taskId,
      updateData,
      workspaceId,
      organizationId,
      token
    );
  }

  // Update task priority
  async updateTaskPriority(
    taskId: string,
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    return this.updateTask(
      taskId,
      { priority },
      workspaceId,
      organizationId,
      token
    );
  }

  // Mark task as completed
  async completeTask(
    taskId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    return this.updateTaskStatus(
      taskId,
      "COMPLETED",
      workspaceId,
      organizationId,
      token
    );
  }

  // Mark task as in progress
  async startTask(
    taskId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    return this.updateTaskStatus(
      taskId,
      "IN_PROGRESS",
      workspaceId,
      organizationId,
      token
    );
  }

  // Cancel task
  async cancelTask(
    taskId: string,
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ApiResponse<TaskWithRelations>> {
    return this.updateTaskStatus(
      taskId,
      "CANCELLED",
      workspaceId,
      organizationId,
      token
    );
  }
}

const taskService = new TaskService();
export default taskService;
