// Template types based on API schema
export interface SequenceNode {
  id: number;
  type:
    | "INVITE"
    | "INVITE_BY_EMAIL"
    | "INEMAIL"
    | "FIND_EMAIL"
    | "MESSAGE"
    | "VIEW_PROFILE"
    | "ENDORSE"
    | "FOLLOW"
    | "LIKE"
    | "WITHDRAW_INVITE"
    | "WAIT_FOR_DECISION"
    | "DELAY"
    | "END";
  name: string;
  data?: {
    message_template?: string;
    alternative_message?: string;
    delay_unit?: string;
    delay_value?: number;
    [key: string]: any;
  };
}

export interface Template {
  id: string;
  name: string;
  sequence_type: "LINKEDIN" | "EMAIL" | "SMS" | "WHATSAPP";
  sequence: SequenceNode[];
  diagram: Record<string, any>;
  created_at: string;
  // Additional fields that might be present in the UI but not in API
  status?: "active" | "draft" | "paused" | "archived";
  updated_at?: string;
  usage_count?: number;
  success_rate?: number;
  tags?: string[];
  description?: string;
}

export interface TemplateListResponse {
  templates: Template[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TemplateFilters {
  page?: number;
  limit?: number;
  order_by?: string;
  sort_type?: "asc" | "desc";
  search?: string;
  type?: string;
  status?: string;
}
