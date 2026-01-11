/**
 * CHATFORM API SERVICE
 * ====================
 * API service for AI-powered lead qualification chatforms.
 * Connects to the genchat-service chatforms module.
 */

import ShowShortMessage from "@/base-component/ShowShortMessage";

// Configuration
const getChatformConfig = () => ({
  baseUrl: process.env.NEXT_PUBLIC_GENCHAT_URL || "http://localhost:3011/api/v1",
  workspaceId: typeof window !== "undefined" ? localStorage.getItem("selectedWorkspaceId") || "" : "",
  userId: typeof window !== "undefined" ? (() => {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData)?.id : "";
  })() : "",
});

// Types
export type QuestionType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "select"
  | "multi_select"
  | "boolean"
  | "rating"
  | "date"
  | "url"
  | "company"
  | "job_title";

export type ChatformType = "website" | "pre_meeting" | "standalone";
export type ChatformStatus = "active" | "draft" | "paused" | "archived";
export type SubmissionStatus = "completed" | "partial" | "qualified" | "disqualified";

export interface QualificationRule {
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "in" | "not_in";
  value: string | number | string[];
  action: "qualify" | "disqualify" | "score";
  score?: number;
}

export interface ChatformQuestion {
  id: string;
  type: QuestionType;
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  placeholder?: string;
  aiFollowUp?: boolean;
  qualificationRule?: QualificationRule;
}

export interface ChatformBranding {
  logo?: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily?: string;
  welcomeMessage: string;
  completionMessage: string;
}

export interface Chatform {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  type: ChatformType;
  status: ChatformStatus;
  questions: ChatformQuestion[];
  branding: ChatformBranding;
  qualificationThreshold?: number;
  redirectUrl?: string;
  eventTypeId?: string;
  notifyOnSubmission: boolean;
  notifyEmail?: string;
  totalSubmissions: number;
  qualifiedCount: number;
  conversionRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatformAnswer {
  questionId: string;
  value: string | number | string[] | boolean;
  score?: number;
}

export interface ChatformSubmission {
  id: string;
  chatformId: string;
  workspaceId: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCompany?: string;
  answers: ChatformAnswer[];
  totalScore: number;
  status: SubmissionStatus;
  sourceUrl?: string;
  leadId?: string;
  bookingId?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface ChatformStats {
  activeForms: number;
  totalSubmissions: number;
  qualifiedLeads: number;
  conversionRate: number;
}

// DTOs
export interface CreateChatformDto {
  name: string;
  description?: string;
  type: ChatformType;
  questions: ChatformQuestion[];
  branding?: Partial<ChatformBranding>;
  qualificationThreshold?: number;
  redirectUrl?: string;
  eventTypeId?: string;
  notifyOnSubmission?: boolean;
  notifyEmail?: string;
}

export interface UpdateChatformDto {
  name?: string;
  description?: string;
  type?: ChatformType;
  status?: ChatformStatus;
  questions?: ChatformQuestion[];
  branding?: Partial<ChatformBranding>;
  qualificationThreshold?: number;
  redirectUrl?: string;
  eventTypeId?: string;
  notifyOnSubmission?: boolean;
  notifyEmail?: string;
}

export interface SubmitChatformDto {
  chatformId: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  guestCompany?: string;
  answers: ChatformAnswer[];
  sourceUrl?: string;
}

export interface GetSubmissionsParams {
  chatformId?: string;
  status?: SubmissionStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// API helper
async function chatformApiCall<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: any;
    params?: Record<string, any>;
  } = {}
): Promise<{ data: T; status: number }> {
  const config = getChatformConfig();
  const { method = "GET", body, params } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const fullUrl = `${config.baseUrl}${url}`;

  let status = 500;
  let data: any;

  try {
    const fetchParams: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-workspace-id": config.workspaceId,
        "x-user-id": config.userId,
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
      credentials: "include",
    };

    const response = await fetch(fullUrl, fetchParams);
    status = response.status;

    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: "Invalid JSON response", rawResponse: responseText };
    }

    if (!response.ok && typeof window !== "undefined") {
      ShowShortMessage(data?.message || `Chatform API error: ${status}`, "error");
    }
  } catch (error) {
    if (typeof window !== "undefined") {
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        ShowShortMessage(
          "Cannot connect to chatform service. Please check if the server is running.",
          "error"
        );
      } else {
        ShowShortMessage("Chatform API request failed. Please try again.", "error");
      }
    }
  }

  return { data, status };
}

// API Service
export class ChatformApiService {
  // ============================================
  // CHATFORM CRUD
  // ============================================

  static async createChatform(dto: CreateChatformDto): Promise<{ data: Chatform; status: number }> {
    return chatformApiCall<Chatform>("/chatforms", {
      method: "POST",
      body: dto,
    });
  }

  static async getChatforms(): Promise<{ data: Chatform[]; status: number }> {
    return chatformApiCall<Chatform[]>("/chatforms", {
      method: "GET",
    });
  }

  static async getChatform(id: string): Promise<{ data: Chatform; status: number }> {
    return chatformApiCall<Chatform>(`/chatforms/${id}`, {
      method: "GET",
    });
  }

  static async updateChatform(id: string, dto: UpdateChatformDto): Promise<{ data: Chatform; status: number }> {
    return chatformApiCall<Chatform>(`/chatforms/${id}`, {
      method: "PUT",
      body: dto,
    });
  }

  static async deleteChatform(id: string): Promise<{ data: any; status: number }> {
    return chatformApiCall(`/chatforms/${id}`, {
      method: "DELETE",
    });
  }

  static async duplicateChatform(id: string): Promise<{ data: Chatform; status: number }> {
    return chatformApiCall<Chatform>(`/chatforms/${id}/duplicate`, {
      method: "POST",
    });
  }

  // ============================================
  // STATS
  // ============================================

  static async getStats(): Promise<{ data: ChatformStats; status: number }> {
    return chatformApiCall<ChatformStats>("/chatforms/stats", {
      method: "GET",
    });
  }

  // ============================================
  // SUBMISSIONS
  // ============================================

  static async getSubmissions(params?: GetSubmissionsParams): Promise<{ data: ChatformSubmission[]; status: number }> {
    return chatformApiCall<ChatformSubmission[]>("/chatforms/submissions/all", {
      method: "GET",
      params,
    });
  }

  static async getChatformSubmissions(
    chatformId: string,
    params?: GetSubmissionsParams
  ): Promise<{ data: ChatformSubmission[]; status: number }> {
    return chatformApiCall<ChatformSubmission[]>(`/chatforms/${chatformId}/submissions`, {
      method: "GET",
      params,
    });
  }

  static async getSubmission(id: string): Promise<{ data: ChatformSubmission; status: number }> {
    return chatformApiCall<ChatformSubmission>(`/chatforms/submissions/${id}`, {
      method: "GET",
    });
  }

  // ============================================
  // PUBLIC (for embedding)
  // ============================================

  static async getPublicChatform(
    workspaceId: string,
    slug: string
  ): Promise<{ data: Chatform; status: number }> {
    return chatformApiCall<Chatform>(`/chatforms/public/${workspaceId}/${slug}`, {
      method: "GET",
    });
  }

  static async submitChatform(dto: SubmitChatformDto): Promise<{ data: ChatformSubmission; status: number }> {
    return chatformApiCall<ChatformSubmission>("/chatforms/public/submit", {
      method: "POST",
      body: dto,
    });
  }
}

export default ChatformApiService;
