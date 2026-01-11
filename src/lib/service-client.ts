/**
 * GENIEFY SERVICE CLIENT
 * ======================
 * HTTP client for making requests to Geniefy services.
 * Handles authentication and error handling consistently.
 */

import { api, ServiceName } from './api-config';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

/**
 * Make an authenticated request to a Geniefy service
 */
export async function serviceRequest<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl = `${url}?${queryString}`;
    }
  }

  try {
    const response = await fetch(finalUrl, {
      ...fetchOptions,
      credentials: 'include', // Include cookies for auth
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    const status = response.status;

    // Handle 401 - unauthorized
    if (status === 401) {
      // Could trigger token refresh here
      return { data: null, error: 'Unauthorized', status };
    }

    // Handle 403 - forbidden
    if (status === 403) {
      return { data: null, error: 'Forbidden', status };
    }

    // Handle 438 - trial expired (custom)
    if (status === 438) {
      return { data: null, error: 'Trial period expired', status };
    }

    // Handle 498 - extension expired (custom)
    if (status === 498) {
      return { data: null, error: 'Extension period expired', status };
    }

    // Parse response
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error: data?.message || `Request failed with status ${status}`,
        status,
      };
    }

    return { data, error: null, status };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      status: 0,
    };
  }
}

/**
 * Service-specific clients
 */
export const serviceClient = {
  // GenSales
  sales: {
    getCompanies: (params?: { page?: number; limit?: number; search?: string }) =>
      serviceRequest(api.sales.companies(), { params }),

    getCompany: (id: string) =>
      serviceRequest(api.sales.companies(`/${id}`)),

    createCompany: (data: unknown) =>
      serviceRequest(api.sales.companies(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateCompany: (id: string, data: unknown) =>
      serviceRequest(api.sales.companies(`/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteCompany: (id: string) =>
      serviceRequest(api.sales.companies(`/${id}`), { method: 'DELETE' }),

    getContacts: (params?: { page?: number; limit?: number; companyId?: string }) =>
      serviceRequest(api.sales.contacts(), { params }),

    getContact: (id: string) =>
      serviceRequest(api.sales.contacts(`/${id}`)),
  },

  // GenHR
  hr: {
    getEmployees: (params?: { page?: number; limit?: number; department?: string }) =>
      serviceRequest(api.hr.employees(), { params }),

    getEmployee: (id: string) =>
      serviceRequest(api.hr.employees(`/${id}`)),

    createEmployee: (data: unknown) =>
      serviceRequest(api.hr.employees(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getDepartments: () =>
      serviceRequest(api.hr.departments()),

    getLeaveRequests: (employeeId?: string) =>
      serviceRequest(api.hr.leave(), { params: { employeeId } }),

    submitLeaveRequest: (data: unknown) =>
      serviceRequest(api.hr.leave(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // GenFin
  finance: {
    getInvoices: (params?: { page?: number; limit?: number; status?: string }) =>
      serviceRequest(api.finance.invoices(), { params }),

    getInvoice: (id: string) =>
      serviceRequest(api.finance.invoices(`/${id}`)),

    createInvoice: (data: unknown) =>
      serviceRequest(api.finance.invoices(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getExpenses: (params?: { page?: number; limit?: number; category?: string }) =>
      serviceRequest(api.finance.expenses(), { params }),

    getAccounts: () =>
      serviceRequest(api.finance.accounts()),
  },

  // GenDo
  tasks: {
    getProjects: (params?: { page?: number; limit?: number; status?: string }) =>
      serviceRequest(api.tasks.projects(), { params }),

    getProject: (id: string) =>
      serviceRequest(api.tasks.projects(`/${id}`)),

    createProject: (data: unknown) =>
      serviceRequest(api.tasks.projects(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTasks: (projectId?: string) =>
      serviceRequest(api.tasks.tasks(), { params: { projectId } }),

    createTask: (data: unknown) =>
      serviceRequest(api.tasks.tasks(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateTask: (id: string, data: unknown) =>
      serviceRequest(api.tasks.tasks(`/${id}`), {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // GenChat
  chat: {
    getChatbots: () =>
      serviceRequest(api.chat.chatbots()),

    getChatbot: (id: string) =>
      serviceRequest(api.chat.chatbots(`/${id}`)),

    createChatbot: (data: unknown) =>
      serviceRequest(api.chat.chatbots(), {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getConversations: (chatbotId?: string) =>
      serviceRequest(api.chat.conversations(), { params: { chatbotId } }),

    getSurveys: () =>
      serviceRequest(api.chat.surveys()),
  },
};

export default serviceClient;
