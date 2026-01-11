import { API_BASE_URL } from "./baseUrl";

// Comprehensive Analytics Interfaces
export interface ContactAnalytics {
  summary: {
    total: number;
    active: number;
    inactive: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  leadTypes: Array<{ type: string; count: number; percentage: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  industryDistribution: Array<{
    industry: string;
    count: number;
    percentage: number;
  }>;
  communicationChannels: Array<{
    channel: string;
    count: number;
    percentage: number;
  }>;
  leadScoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  topContacts: Array<{
    id: string;
    name: string;
    email: string;
    leadScore: number;
    status: string;
    lastContactedAt: string | null;
  }>;
  recentContacts: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    leadType: string;
  }>;
  linkedInData: {
    totalWithLinkedIn: number;
    openToWork: number;
    averageEnrichmentScore: number;
    topSkills: Array<{ skill: string; count: number }>;
    topIndustries: Array<{ industry: string; count: number }>;
  };
}

export interface CompanyAnalytics {
  summary: {
    total: number;
    active: number;
    inactive: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  industryDistribution: Array<{
    industry: string;
    count: number;
    percentage: number;
  }>;
  sizeDistribution: Array<{ size: string; count: number; percentage: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  leadScoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  topCompanies: Array<{
    id: string;
    name: string;
    industry: string;
    leadScore: number;
    status: string;
  }>;
  recentCompanies: Array<{
    id: string;
    name: string;
    industry: string;
    createdAt: string;
  }>;
}

export interface DealAnalytics {
  summary: {
    total: number;
    open: number;
    won: number;
    lost: number;
    totalValue: number;
    averageValue: number;
    winRate: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    totalValue: number;
  }>;
  valueDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
    totalValue: number;
  }>;
  probabilityDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  monthlyDeals: Array<{ month: string; count: number; value: number }>;
  topDeals: Array<{
    id: string;
    title: string;
    value: number;
    probability: number;
    status: string;
    expectedCloseDate: string | null;
  }>;
  recentDeals: Array<{
    id: string;
    title: string;
    value: number;
    status: string;
    createdAt: string;
  }>;
}

export interface ActivityAnalytics {
  summary: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  typeDistribution: Array<{ type: string; count: number; percentage: number }>;
  outcomeDistribution: Array<{
    outcome: string;
    count: number;
    percentage: number;
  }>;
  channelDistribution: Array<{
    channel: string;
    count: number;
    percentage: number;
  }>;
  monthlyActivities: Array<{ month: string; count: number }>;
  recentActivities: Array<{
    id: string;
    title: string;
    type: string;
    outcome: string;
    createdAt: string;
  }>;
  topPerformers: Array<{
    userId: string;
    userName: string;
    activityCount: number;
    successRate: number;
  }>;
}

export interface TaskAnalytics {
  summary: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    completionRate: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  priorityDistribution: Array<{
    priority: string;
    count: number;
    percentage: number;
  }>;
  monthlyTasks: Array<{ month: string; created: number; completed: number }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
  }>;
  automationStats: {
    totalAutomated: number;
    automationRate: number;
    topAutomationRules: Array<{ rule: string; count: number }>;
  };
}

export interface PipelineAnalytics {
  summary: {
    totalPipelines: number;
    totalStages: number;
    activePipelines: number;
  };
  pipelineDistribution: Array<{
    pipelineId: string;
    pipelineName: string;
    stageCount: number;
    dealCount: number;
    totalValue: number;
  }>;
  stageDistribution: Array<{
    stageId: string;
    stageName: string;
    pipelineName: string;
    dealCount: number;
    totalValue: number;
    conversionRate: number;
  }>;
  conversionRates: Array<{
    fromStage: string;
    toStage: string;
    conversionRate: number;
    dealCount: number;
  }>;
  topStages: Array<{
    stageId: string;
    stageName: string;
    pipelineName: string;
    dealCount: number;
    totalValue: number;
  }>;
}

export interface MessageAnalytics {
  summary: {
    total: number;
    sent: number;
    received: number;
    opened: number;
    clicked: number;
    replied: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  };
  channelPerformance: Array<{
    channel: string;
    sent: number;
    opened: number;
    clicked: number;
    openRate: number;
    clickRate: number;
  }>;
  monthlyMessages: Array<{
    month: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
  recentMessages: Array<{
    id: string;
    subject: string;
    channel: string;
    status: string;
    sentAt: string;
  }>;
}

export interface CampaignAnalytics {
  summary: {
    total: number;
    active: number;
    completed: number;
    draft: number;
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    averageOpenRate: number;
    averageClickRate: number;
    averageReplyRate: number;
  };
  typeDistribution: Array<{ type: string; count: number; percentage: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  performanceMetrics: Array<{
    campaignId: string;
    name: string;
    type: string;
    sent: number;
    opened: number;
    clicked: number;
    replied: number;
    openRate: number;
    clickRate: number;
    replyRate: number;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    totalSent: number;
    createdAt: string;
  }>;
}

export interface NoteAnalytics {
  summary: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    growthRate: number;
  };
  entityDistribution: Array<{
    entity: string;
    count: number;
    percentage: number;
  }>;
  monthlyNotes: Array<{ month: string; count: number }>;
  recentNotes: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
}

export interface IntegrationAnalytics {
  summary: {
    total: number;
    active: number;
    connected: number;
    errorCount: number;
  };
  typeDistribution: Array<{ type: string; count: number; percentage: number }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  usageStats: Array<{
    integrationId: string;
    name: string;
    type: string;
    usageCount: number;
    lastUsedAt: string | null;
  }>;
}

export interface ComprehensiveAnalytics {
  contacts: ContactAnalytics;
  companies: CompanyAnalytics;
  deals: DealAnalytics;
  activities: ActivityAnalytics;
  tasks: TaskAnalytics;
  pipelines: PipelineAnalytics;
  messages: MessageAnalytics;
  campaigns: CampaignAnalytics;
  notes: NoteAnalytics;
  integrations: IntegrationAnalytics;
  overview: {
    totalContacts: number;
    totalCompanies: number;
    totalDeals: number;
    totalActivities: number;
    totalTasks: number;
    totalMessages: number;
    totalCampaigns: number;
    totalNotes: number;
    totalIntegrations: number;
    totalValue: number;
    averageDealValue: number;
    overallWinRate: number;
    overallTaskCompletionRate: number;
    overallMessageOpenRate: number;
    overallCampaignOpenRate: number;
  };
}

class AnalyticsService {
  async getComprehensiveAnalytics(
    workspaceId: string,
    organizationId: string,
    token: string
  ): Promise<ComprehensiveAnalytics> {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const params = new URLSearchParams({ workspaceId });
      if (organizationId) {
        params.append("organizationId", organizationId);
      }

      const response = await fetch(`${API_BASE_URL}/analytics?${params}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`Analytics API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();
