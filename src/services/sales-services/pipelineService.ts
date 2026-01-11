import { Contact, Company, Deal } from "../../types/sales-types";
import { API_BASE_URL } from "./baseUrl";

// Pipeline Types
export interface PipelineCategory {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  pipelines: Pipeline[];
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  status: "ACTIVE" | "INACTIVE";
  pipelineCategoryId: string;
  workspaceId: string;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
  pipelineCategory: PipelineCategory;
  pipelineStages: PipelineStage[];
  PipelineMap: PipelineMap[];
}

export interface PipelineStage {
  id: string;
  name: string;
  description?: string;
  pipelineId: string;
  pipelineCategoryId: string;
  createdAt: string;
  updatedAt: string;
  pipeline: Pipeline;
  pipelineCategory: PipelineCategory;
  PipelineMap: PipelineMap[];
}

export interface PipelineMap {
  id: string;
  pipelineId: string;
  stageId: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
  createdAt: string;
  updatedAt: string;
  pipeline: Pipeline;
  stage: PipelineStage;
  company?: { id: string; name: string };
  contact?: { id: string; name: string };
  deal?: { id: string; title: string };
}

export interface PipelineStats {
  totalPipelines: number;
  activePipelines: number;
  inactivePipelines: number;
  totalCategories: number;
  totalStages: number;
  totalMappings: number;
  pipelinesByStatus: { status: string; count: number }[];
  categoriesWithPipelineCount: {
    categoryId: string;
    categoryName: string;
    pipelineCount: number;
  }[];
}

// DTOs
export interface CreatePipelineCategoryDto {
  name: string;
  description?: string;
  workspaceId: string;
  organizationId?: string;
}

export interface CreatePipelineDto {
  name: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  pipelineCategoryId: string;
  workspaceId: string;
  organizationId?: string;
}

export interface CreatePipelineStageDto {
  name: string;
  description?: string;
  pipelineId: string;
  pipelineCategoryId: string;
}

export interface CreatePipelineMapDto {
  pipelineId: string;
  stageId: string;
  companyId?: string;
  contactId?: string;
  dealId?: string;
}

export interface UpdatePipelineMapDto {
  stageId: string;
}

// Query DTOs
export interface QueryPipelineDto {
  workspaceId: string;
  organizationId?: string;
}

export interface QueryPipelineCategoryDto {
  workspaceId: string;
  organizationId?: string;
}

export interface QueryPipelineStageDto {
  workspaceId: string;
  pipelineId?: string;
  pipelineCategoryId?: string;
}

export interface QueryPipelineMapDto {
  workspaceId: string;
  pipelineId?: string;
  stageId?: string;
}

class PipelineService {
  private baseUrl = API_BASE_URL;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const response = await fetch(`${this.baseUrl}/pipelines${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Pipeline operation failed");
    }

    return response.json();
  }

  // Pipeline Categories
  async getPipelineCategories(
    workspaceId: string,
    organizationId?: string
  ): Promise<PipelineCategory[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<PipelineCategory[]>(`/categories?${params.toString()}`);
  }

  async createPipelineCategory(
    data: CreatePipelineCategoryDto
  ): Promise<PipelineCategory> {
    return this.request<PipelineCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePipelineCategory(
    id: string,
    data: Partial<CreatePipelineCategoryDto>
  ): Promise<PipelineCategory> {
    return this.request<PipelineCategory>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePipelineCategory(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/categories/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  // Pipelines
  async getPipelines(
    workspaceId: string,
    organizationId?: string
  ): Promise<Pipeline[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Pipeline[]>(`?${params.toString()}`);
  }

  async createPipeline(data: CreatePipelineDto): Promise<Pipeline> {
    return this.request<Pipeline>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePipeline(
    id: string,
    data: Partial<CreatePipelineDto>,
    workspaceId: string,
    organizationId?: string
  ): Promise<Pipeline> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<Pipeline>(`/${id}?${params.toString()}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePipeline(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  // Pipeline Stages
  async getPipelineStages(
    workspaceId: string,
    pipelineId?: string,
    pipelineCategoryId?: string
  ): Promise<PipelineStage[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(pipelineId && { pipelineId }),
      ...(pipelineCategoryId && { pipelineCategoryId }),
    });

    return this.request<PipelineStage[]>(`/stages?${params.toString()}`);
  }

  async createPipelineStage(
    data: CreatePipelineStageDto
  ): Promise<PipelineStage> {
    return this.request<PipelineStage>("/stages", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePipelineStage(
    id: string,
    data: Partial<CreatePipelineStageDto>,
    workspaceId: string,
    organizationId?: string
  ): Promise<PipelineStage> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<PipelineStage>(`/stages/${id}?${params.toString()}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deletePipelineStage(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/stages/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  // Pipeline Maps
  async getPipelineMaps(
    workspaceId: string,
    pipelineId?: string,
    stageId?: string
  ): Promise<PipelineMap[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(pipelineId && { pipelineId }),
      ...(stageId && { stageId }),
    });

    return this.request<PipelineMap[]>(`/maps?${params.toString()}`);
  }

  async createPipelineMap(data: CreatePipelineMapDto): Promise<PipelineMap> {
    return this.request<PipelineMap>("/maps", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePipelineMap(
    id: string,
    data: UpdatePipelineMapDto,
    workspaceId: string,
    organizationId?: string
  ): Promise<PipelineMap> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<PipelineMap>(`/maps/${id}?${params.toString()}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePipelineMap(
    id: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<void> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<void>(`/maps/${id}?${params.toString()}`, {
      method: "DELETE",
    });
  }

  async movePipelineMap(
    mapId: string,
    newStageId: string,
    workspaceId: string,
    organizationId?: string
  ): Promise<PipelineMap> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<PipelineMap>(`/maps/${mapId}?${params.toString()}`, {
      method: "PATCH",
      body: JSON.stringify({ stageId: newStageId }),
    });
  }

  // Statistics
  async getPipelineStats(
    workspaceId: string,
    organizationId?: string
  ): Promise<PipelineStats> {
    const params = new URLSearchParams({
      workspaceId,
      ...(organizationId && { organizationId }),
    });

    return this.request<PipelineStats>(`/stats?${params.toString()}`);
  }

  // Enums
  async getPipelineEnums(): Promise<{ status: string[] }> {
    return this.request<{ status: string[] }>("/enums");
  }
}

export default new PipelineService();
