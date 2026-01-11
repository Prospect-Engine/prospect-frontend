export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "sales" | "support";
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
  token?: string;
  // New fields from API response
  user_id?: string;
  username?: string;
  login_type?: string;
  role_id?: string;
  joined_at?: string;
  is_onboarded?: boolean;
  onboarding_date?: string;
  current_onboarding_step?: Record<string, unknown>;
  access_token?: string;
  refresh_token?: string;
  // Additional fields from login/profile API
  phoneNumber?: string;
  timezone?: string;
  globalRole?: string;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: {
    workspacePermissions?: Array<{
      workspaceId: string;
      workspaceName: string;
      organizationId: string;
      organizationName: string;
      role: string;
      permissions: string[];
      overrides?: Array<{
        permission: string;
        granted: boolean;
        expiresAt: string | null;
      }>;
    }>;
    organizationPermissions?: Array<{
      organizationId: string;
      organizationName: string;
      role: string;
      permissions: string[];
    }>;
  };
  organizations?: Array<{
    id: string;
    name: string;
    description?: string;
    logo?: string;
    website?: string;
    plan?: string;
    role: string;
    isActive: boolean;
    createdAt?: string;
    permissions?: string[];
    members?: Array<{
      id: string;
      email: string;
      name: string;
      avatar?: string;
      role: string;
      isActive: boolean;
      joinedAt?: string;
    }>;
    workspaces?: Array<{
      id: string;
      name: string;
      description?: string;
      avatar?: string;
      role: string;
      isActive: boolean;
      organizationId: string;
      organizationName: string;
      createdAt?: string;
      members?: Array<{
        id: string;
        email: string;
        name: string;
        avatar?: string;
        role: string;
        isActive: boolean;
        joinedAt?: string;
      }>;
    }>;
  }>;
  workspaces?: Array<{
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    role: string;
    isActive: boolean;
    organizationId: string;
    organizationName: string;
    createdAt?: string;
    members?: Array<{
      id: string;
      email: string;
      name: string;
      avatar?: string;
      role: string;
      isActive: boolean;
      joinedAt?: string;
    }>;
  }>;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  status:
    | "interested"
    | "engaged"
    | "agency"
    | "startup"
    | "scale-up"
    | "good"
    | "none";
  owner: string;
  lastInteraction: string;
  connection: "good" | "none";
  leadScore?: string;
  avatar?: string;
  createdAt: Date;
  industry?: string;
  location?: string;
  linkedinUrl?: string;
  website?: string;
  dealValue?: number;
  source?: string;
  priority?: "high" | "medium" | "low";
  nextFollowUp?: Date;
  activities?: Activity[];
  customFields?: { [key: string]: string | number | boolean | Date };
  // Additional fields to match Contact structure
  workspaceId?: string;
  phoneNumber?: string | null;
  whatsappNumber?: string | null;
  twitterUrl?: string | null;
  websiteUrl?: string | null;
  jobTitle?: string | null;
  leadType?: "COLD" | "WARM" | "HOT";
  preferredChannel?: string;
  channelPrefs?: Record<string, unknown>;
  customAttributes?: Record<string, unknown>;
  enrichedData?: Record<string, unknown>;
  enrichmentScore?: number;
  lastEnrichedAt?: string | null;
  lastContactedAt?: string | null;
  nextFollowUpAt?: string | null;
  ownerId?: string | null;
  updatedAt?: string;
  companyId?: string | null;
  company?: Record<string, unknown> | null;
  ownerDetails?: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    phoneNumber: string;
    timezone: string;
    globalRole: string;
    isActive: boolean;
    emailVerified: boolean;
    emailVerifiedAt: string;
    lastLoginAt: string;
    preferences: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  workspace?: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    avatar: string | null;
    settings: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
  };
  tags?: Record<string, unknown>[];
  deals?: Record<string, unknown>[];
  messages?: Record<string, unknown>[];
  notes?: Record<string, unknown>[];
  tasks?: Record<string, unknown>[];
}

// Contact interface for API integration
export interface Contact {
  id: string;
  workspaceId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
  jobTitle: string | null;
  industry: string | null;
  leadType: "COLD" | "WARM" | "HOT";
  leadScore: number;
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "PROSPECT"
    | "CUSTOMER"
    | "LOST"
    | "WON"
    | "DEAD"
    | "LEAD"
    | "ENGAGED"
    | "INTERESTED"
    | "WARM"
    | "CLOSED";
  priority: "HOT" | "WARM" | "COLD";
  source: string | null;
  avatar: string | null;
  preferredChannel:
    | "EMAIL"
    | "PHONE"
    | "WHATSAPP"
    | "LINKEDIN"
    | "TWITTER"
    | "TELEGRAM"
    | "WEBSITE";
  channelPrefs: Record<string, unknown>;
  customAttributes: Record<string, unknown>;
  enrichedData: Record<string, unknown>;
  enrichmentScore: number;
  lastEnrichedAt: string | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string | null;
  company: Record<string, unknown> | null;
  owner: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    phoneNumber: string;
    timezone: string;
    globalRole: string;
    isActive: boolean;
    emailVerified: boolean;
    emailVerifiedAt: string;
    lastLoginAt: string;
    preferences: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  workspace: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    avatar: string | null;
    settings: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
  };
  tags: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  deals: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  // LinkedIn Profile Fields
  linkedinUrnId?: string | null;
  linkedinPublicId?: string | null;
  linkedinLocation?: string | null;
  linkedinHeadline?: string | null;
  linkedinAbout?: string | null;
  linkedinJoined?: string | null;
  linkedinBirthday?: string | null;
  linkedinConnected?: string | null;
  linkedinAddress?: string | null;
  linkedinIsOpenToWork?: boolean | null;
  linkedinProfilePhoto?: string | null;
  linkedinProfileUpdated?: string | null;
  linkedinContactInfoUpdated?: string | null;
  // LinkedIn Complex Fields
  linkedinExperience?: LinkedInExperience[];
  linkedinSkills?: LinkedInSkill[];
  linkedinJobPreferences?: LinkedInJobPreference[];
  linkedinWebsites?: LinkedInWebsite[];
  linkedinVerifications?: LinkedInVerification[];
  linkedinRecommendations?: LinkedInRecommendation[];
  linkedinPosts?: LinkedInPost[];
  linkedinFeaturedSections?: LinkedInFeaturedSection[];
  linkedinMutualContacts?: LinkedInMutualContact[];
}

// LinkedIn Complex Field Types
export interface LinkedInExperience {
  id: string;
  contactId: string;
  position: string;
  company?: string;
  duration?: string;
  location?: string;
  description?: string;
  skills?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInSkill {
  id: string;
  contactId: string;
  skillName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInJobPreference {
  id: string;
  contactId: string;
  jobTitle?: string;
  locationType?: string;
  location?: string;
  employmentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInWebsite {
  id: string;
  contactId: string;
  url: string;
  type?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInVerification {
  id: string;
  contactId: string;
  type: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInRecommendation {
  id: string;
  contactId: string;
  recommenderName: string;
  recommenderHeadline?: string;
  recommenderUrn?: string;
  recommenderPublicId?: string;
  recommendationSource?: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInPost {
  id: string;
  contactId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInFeaturedSection {
  id: string;
  contactId: string;
  type: string;
  title?: string;
  text?: string;
  subtitle?: string;
  linkText?: string;
  url?: string;
  mediaUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LinkedInMutualContact {
  id: string;
  contactId: string;
  name: string;
  headline?: string;
  location?: string;
  publicId?: string;
  urn?: string;
  createdAt: string;
  updatedAt: string;
}

// Company interface for API integration
export interface Company {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  domain: string | null;
  websiteUrl: string | null;
  industry: string | null;
  size: "STARTUP" | "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE" | null;
  revenue: string | null;
  description: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  whatsappNumber: string | null;
  source: string | null;
  preferredChannel:
    | "EMAIL"
    | "PHONE"
    | "WHATSAPP"
    | "LINKEDIN"
    | "TWITTER"
    | "TELEGRAM"
    | "WEBSITE";
  channelPrefs: Record<string, unknown>;
  logo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  zipCode: string | null;
  status:
    | "ACTIVE"
    | "INACTIVE"
    | "PROSPECT"
    | "CUSTOMER"
    | "LOST"
    | "WON"
    | "DEAD"
    | "LEAD"
    | "ENGAGED"
    | "INTERESTED"
    | "WARM"
    | "CLOSED";
  priority: "HOT" | "WARM" | "COLD";
  leadScore: number;
  customAttributes: Record<string, unknown>;
  enrichedData: Record<string, unknown>;
  enrichmentScore: number | null;
  lastEnrichedAt: string | null;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    phoneNumber: string;
    timezone: string;
    globalRole: string;
    isActive: boolean;
    emailVerified: boolean;
    emailVerifiedAt: string;
    lastLoginAt: string;
    preferences: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
  workspace: {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    avatar: string | null;
    settings: Record<string, unknown>;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    ownerId: string;
  };
  tags: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  deals: Record<string, unknown>[];
  messages: Record<string, unknown>[];
  notes: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  contacts: Record<string, unknown>[];
}

export interface Activity {
  id: string;
  type:
    | "email"
    | "call"
    | "meeting"
    | "note"
    | "task"
    | "CONTACT_CREATED"
    | "CONTACT_UPDATED"
    | "CUSTOM";
  title: string;
  description?: string;
  date: Date;
  createdAt: string;
  userId: string;
  userName: string;
  // Backend activity fields
  user?: {
    id: string;
    name: string;
    email: string;
  };
  contactId?: string;
  companyId?: string;
  dealId?: string;
  campaignId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  outcome?: string;
  channel?: string;
  duration?: number;
  scheduledAt?: string;
  completedAt?: string;
}

export interface TableColumn {
  key: keyof Lead | "actions" | "checkbox";
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

export interface FilterState {
  search: string;
  status: string[];
  tags: string[];
  owner: string[];
  assignee?: string[];
  contact?: string[];
  company?: string[];
  connection?: string[];
  priority?: string[];
  engagement?: string[];
  valueRange?: string[];
  dateRange: {
    start?: Date;
    end?: Date;
    selectedOption?: string; // For simple toggle behavior like value range
  };
  // Entity-specific filters
  industry?: string[];
  source?: string[];
  leadType?: string[];
  leadScore?: string[];
  size?: string[];
  revenue?: string[];
  probability?: string[];
  expectedCloseDate?: string[];
  taskStatus?: string[];
  taskPriority?: string[];
  dueDate?: string[];
}

export interface SortState {
  field: keyof Lead;
  direction: "asc" | "desc";
}

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  organizationName: string;
  workspaceName: string;
  promo_code?: string;
  on_trial?: boolean;
  plan_code?: string;
}

export interface SignupResponse {
  success: boolean;
  message?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  // API response structure
  user_id?: string;
  username?: string;
  name?: string;
  login_type?: string;
  role_id?: string;
  joined_at?: string;
  is_onboarded?: boolean;
  onboarding_date?: string;
  current_onboarding_step?: Record<string, unknown>;
  access_token?: string;
  refresh_token?: string;
  // Verification response fields
  verificationTokenSent?: boolean;
  email?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface VerificationRequest {
  email: string;
  verification_code: string;
}

export interface ResetPasswordInitiateRequest {
  email: string;
}

export interface ResetPasswordVerifyRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  otp: string;
  password: string;
}

export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

// Task interfaces
export interface Task {
  id: string;
  workspaceId: string;
  organizationId: string;
  title: string;
  description?: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "OVERDUE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  completedAt?: string;
  contactId?: string;
  companyId?: string;
  assigneeId?: string;
  isAutomated: boolean;
  automationRule?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithRelations extends Task {
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  contact?: {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
  };
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
  workspace?: {
    id: string;
    name: string;
  };
  organization?: {
    id: string;
    name: string;
  };
}

export interface Deal {
  id: string;
  workspaceId: string;
  organizationId: string;
  title: string;
  description?: string;
  value?: number;
  currency: string;
  probability: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: "OPEN" | "WON" | "LOST" | "PAUSED";
  ownerId?: string;
  contactId?: string;
  companyId?: string;
  customAttributes?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  // Relations
  company?: {
    id: string;
    name: string;
    industry?: string;
    websiteUrl?: string;
  };
  contact?: {
    id: string;
    name: string;
    email?: string;
    phoneNumber?: string;
    jobTitle?: string;
  };
  owner?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  activities?: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  tags?: Array<{
    id: string;
    name: string;
  }>;
  notes?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  tasks?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate?: string;
  }>;
}

export interface DealPipeline {
  stage: string;
  count: number;
  value: number;
  deals: Deal[];
}
