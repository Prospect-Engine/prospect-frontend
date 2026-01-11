/**
 * Central type exports for red-magic.
 * Types can be imported either from this central file or directly from their subdirectories.
 */

// Connection types for LinkedIn connection sync feature
export type {
  Connection,
  ConnectionListResponse,
  ConnectionListParams,
  ConnectionSyncStatus,
  ConnectionSyncState,
  TriggerSyncResponse,
} from "./connection";
