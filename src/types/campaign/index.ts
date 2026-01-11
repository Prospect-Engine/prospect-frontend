// import { DailyQuota } from "../settings";

// export type LeadsRow = {
//   id: string;
//   title?: string;
//   leadCount: number;
//   leads: string[];
// };

export type LeadsRow = {
  id: string;
  leads: string[];
  targetUrl: string | null;
  error_message?: string;
  source: DataSource;
  leadCount: number;
  createdAt: Date;
};

export enum DataSource {
  CSV = "CSV",
  SEARCH_URL = "SEARCH_URL",
}

export type TargetLead = {
  id: string;
  lead_ids: string[];
  total_leads: number;
  target_search_url_id: string | null;
  data_source: DataSource;
  campaign_id: string;
  error_message?: string;
  start?: number;
  search_url?: string;
  created_at: Date;
  updated_at: Date;
};

export type UnprocessedLeadIndex = {
  lead_list_index: number;
  target_lead_index: number;
} | null;

export type AddLeadForm = {
  title?: string;
  url: string;
  csv: string;
  search: string;
  leadCount?: number;
  cleanedUrls?: string[];
  originalValue?: string;
};

export type FormattedLeads = {
  title?: string;
  leads: string[];
  searchUrl: string;
  hasDuplicate: number;
};

type Status = "DRAFT" | "ACTIVE";
export type ProcessStatus =
  | "PENDING"
  | "PROCESSING"
  | "PROCESSED"
  | "PAUSED"
  | "RECONNECTING";

export type CampaignStatsType = {
  id: string;
  campaign_id: string;
  invite_send_count: number | null;
  lead_connected_count: number | null;
  inemail_send_count: number | null;
  message_send_count: number | null;
  message_reply_count: number | null;
  in_progress_lead_count: number | null;
  awaiting_lead_count: number | null;
  completed_sequence_lead_count: number | null;
  pasued_lead_count: number | null;
  fail_count: number | null;
  black_listed_count: number | null;
  follow_count: number | null;
  endorse_count: number | null;
  like_post_count: number | null;
  profile_verified_count: number | null;
  profile_viewed_count: number | null;
  ignored_count: number | null;
  withdrawn_count: number | null;
};

export interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
  status: Status;
  process_status: ProcessStatus;
  is_locked: boolean;
  sequence_id: string;
  skip_lead_conditions: string[];
  target_leads_id: string | null;
  target_leads_count: number | null;
  work_calender_id: string | null;
  integration_id: string | null;
  launched_at: Date | null;
  created_at: Date;
  // daily_engine_quota: DailyQuota | null;
  loading?: boolean | null;
  campaign_stats: CampaignStatsType | null;
  is_archived: boolean;
}

export interface ActiveCampaign {
  id: string;
  name: string;
}

export const Role = {
  READ_ONLY: "read-only",
  RESTRICTED: "restricted",
  FULL_PERMISSION: "full-permission",
} as const;
export type RoleType = keyof typeof Role;
