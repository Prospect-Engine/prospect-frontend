export type DailyQuota = {
  connection_request_limit: number;
  message_limit: number;
  profile_view_limit: number;
  skill_endorse_limit: number;
  like_limit: number;
  profile_follow_limit: number;
  inmail_limit: number;
};

export type QuotaLimit = Record<string, number>;

export type QuotaErrors = Record<string, string>;

// Warmup System Types (Task 2.1)
export type WarmupPhase = "INITIAL" | "RAMPING" | "BUILDING" | "MATURE";
export type WarmupStatus = "ACTIVE" | "COMPLETED" | "PAUSED" | "DISABLED";

export interface QuotaLimits {
  connectionRequestLimit: number;
  connectionByEmailLimit: number;
  messageLimit: number;
  profileViewLimit: number;
  skillEndorseLimit: number;
  likeLimit: number;
  profileFollowLimit: number;
  inmailLimit: number;
}

export interface WarmupStatusWithOverride {
  integrationId: string;
  phase: WarmupPhase;
  status: WarmupStatus;
  accountAgeDays: number;
  daysInCurrentPhase: number;
  daysUntilNextPhase: number;
  progressPercent: number;
  currentLimits: QuotaLimits;
  baseLimits: QuotaLimits;
  warmupOverride: boolean;
  effectiveLimits: QuotaLimits;
  isComplete: boolean;
}

// Weekly Quota Recovery Types (Task 2.2)
export interface WeeklyQuotaRecoveryStatus {
  integrationId: string;
  workspaceId: string;
  isEnabled: boolean;
  isDefault: boolean; // true if no explicit setting exists
  createdAt?: string;
  updatedAt?: string;
}
