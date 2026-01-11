/**
 * Connection types for LinkedIn connection sync feature.
 * These types match the backend DTOs in ashborn exactly.
 */

/**
 * Represents a synced LinkedIn connection.
 * Maps to ConnectionResponseDto from ashborn backend.
 */
export interface Connection {
  id: string;
  integration_id: string;
  urn_id: string;
  type: "LINKEDIN";
  name?: string;
  headline?: string;
  profile_url?: string;
  profile_pic_url?: string;
  company?: string;
  position?: string;
  location?: string;
  connected_on?: string;
  is_excluded: boolean;
  note?: string;
  tag_id?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Response structure for paginated connection list.
 * Maps to ConnectionListResponse from ashborn backend.
 */
export interface ConnectionListResponse {
  data: Connection[];
  page: number;
  limit: number;
  total: number;
}

/**
 * Query parameters for fetching connections.
 * Maps to ConnectionListQueryDto from ashborn backend.
 */
export interface ConnectionListParams {
  page?: number;
  limit?: number;
  integration_id?: string;
  search?: string;
  is_excluded?: boolean;
  order_by?: "connected_on" | "created_at" | "name";
  sort_type?: "asc" | "desc";
}

/**
 * Possible sync status values for connection sync.
 */
export type ConnectionSyncStatus =
  | "IDLE"
  | "SYNCING_FULL"
  | "SYNCING_INCREMENTAL"
  | "VERIFYING"
  | "FAILED";

/**
 * Connection sync state for an integration.
 * Maps to ConnectionSyncStatusDto from ashborn backend.
 */
export interface ConnectionSyncState {
  integration_id: string;
  status: ConnectionSyncStatus;
  synced_count: number;
  linkedin_count?: number;
  sync_progress: number;
  last_full_sync_at?: string;
  last_incremental_sync_at?: string;
  last_verification_at?: string;
  last_manual_sync_at?: string;
  next_scheduled_sync_at?: string;
  failure_reason?: string;
  retry_count: number;
  can_trigger_manual_sync: boolean;
}

/**
 * Response when triggering a manual sync.
 * Maps to TriggerSyncResponse from ashborn backend.
 */
export interface TriggerSyncResponse {
  message: string;
  job_id?: string;
}

// ============================================================
// CRM Sync Types
// ============================================================

/**
 * CRM sync status for a connection.
 * Indicates whether the connection has been synced to CRM.
 */
export type CRMSyncStatusType = "PENDING" | "SYNCED" | "FAILED" | "SKIPPED";

/**
 * CRM sync status details for a connection.
 */
export interface CRMSyncStatus {
  id: string;
  connection_id: string;
  contact_id?: string;
  status: CRMSyncStatusType;
  synced_at?: string;
  error?: string;
  match_type?: "URN_ID" | "LINKEDIN_URL" | "EMAIL" | "NEW";
}

/**
 * Extended connection with CRM sync status.
 */
export interface ConnectionWithCRMSync extends Connection {
  crm_sync_status?: CRMSyncStatus;
}

/**
 * Response when triggering CRM sync for a connection.
 */
export interface CRMSyncTriggerResponse {
  success: boolean;
  action?: "created" | "updated" | "skipped";
  contact_id?: string;
  match_type?: "URN_ID" | "LINKEDIN_URL" | "EMAIL" | "NEW";
  message?: string;
  error?: string;
}

/**
 * CRM sync statistics for dashboard display.
 */
export interface CRMSyncStats {
  total_connections: number;
  synced_count: number;
  pending_count: number;
  failed_count: number;
  skipped_count: number;
  last_sync_at?: string;
}
