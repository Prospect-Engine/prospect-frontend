import {
  PipelineMap,
  PipelineCategory,
  Pipeline,
} from "../../services/sales-services/pipelineService";
import { Contact, Company } from "../../types/sales-types";

export interface PipelineCounts {
  uniqueContacts: number;
  uniqueCompanies: number;
  totalUnique: number;
  pipelineCounts: {
    [pipelineId: string]: {
      uniqueContacts: number;
      uniqueCompanies: number;
      totalUnique: number;
    };
  };
  categoryCounts: {
    [categoryId: string]: {
      uniqueContacts: number;
      uniqueCompanies: number;
      totalUnique: number;
    };
  };
}

export function calculateUniquePipelineCounts(
  pipelineMaps: PipelineMap[],
  pipelineCategories: PipelineCategory[],
  pipelines: Pipeline[],
  contacts: Contact[],
  companies: Company[]
): PipelineCounts {
  // Get all unique contact and company IDs from pipeline maps
  const uniqueContactIds = new Set<string>();
  const uniqueCompanyIds = new Set<string>();

  // Track counts per pipeline
  const pipelineCounts: {
    [pipelineId: string]: {
      uniqueContacts: number;
      uniqueCompanies: number;
      totalUnique: number;
    };
  } = {};
  const pipelineContactIds: { [pipelineId: string]: Set<string> } = {};
  const pipelineCompanyIds: { [pipelineId: string]: Set<string> } = {};

  // Track counts per category
  const categoryCounts: {
    [categoryId: string]: {
      uniqueContacts: number;
      uniqueCompanies: number;
      totalUnique: number;
    };
  } = {};
  const categoryContactIds: { [categoryId: string]: Set<string> } = {};
  const categoryCompanyIds: { [categoryId: string]: Set<string> } = {};

  // Process each pipeline map
  pipelineMaps.forEach(map => {
    if (map.contactId) {
      uniqueContactIds.add(map.contactId);

      // Track per pipeline
      if (!pipelineContactIds[map.pipelineId]) {
        pipelineContactIds[map.pipelineId] = new Set();
      }
      pipelineContactIds[map.pipelineId].add(map.contactId);

      // Track per category
      const pipeline = pipelines.find(p => p.id === map.pipelineId);
      if (pipeline) {
        if (!categoryContactIds[pipeline.pipelineCategoryId]) {
          categoryContactIds[pipeline.pipelineCategoryId] = new Set();
        }
        categoryContactIds[pipeline.pipelineCategoryId].add(map.contactId);
      }
    }

    if (map.companyId) {
      uniqueCompanyIds.add(map.companyId);

      // Track per pipeline
      if (!pipelineCompanyIds[map.pipelineId]) {
        pipelineCompanyIds[map.pipelineId] = new Set();
      }
      pipelineCompanyIds[map.pipelineId].add(map.companyId);

      // Track per category
      const pipeline = pipelines.find(p => p.id === map.pipelineId);
      if (pipeline) {
        if (!categoryCompanyIds[pipeline.pipelineCategoryId]) {
          categoryCompanyIds[pipeline.pipelineCategoryId] = new Set();
        }
        categoryCompanyIds[pipeline.pipelineCategoryId].add(map.companyId);
      }
    }
  });

  // Calculate pipeline counts
  Object.keys(pipelineContactIds).forEach(pipelineId => {
    const uniqueContacts = pipelineContactIds[pipelineId].size;
    const uniqueCompanies = pipelineCompanyIds[pipelineId]?.size || 0;
    pipelineCounts[pipelineId] = {
      uniqueContacts,
      uniqueCompanies,
      totalUnique: uniqueContacts + uniqueCompanies,
    };
  });

  // Calculate category counts
  Object.keys(categoryContactIds).forEach(categoryId => {
    const uniqueContacts = categoryContactIds[categoryId].size;
    const uniqueCompanies = categoryCompanyIds[categoryId]?.size || 0;
    categoryCounts[categoryId] = {
      uniqueContacts,
      uniqueCompanies,
      totalUnique: uniqueContacts + uniqueCompanies,
    };
  });

  return {
    uniqueContacts: uniqueContactIds.size,
    uniqueCompanies: uniqueCompanyIds.size,
    totalUnique: uniqueContactIds.size + uniqueCompanyIds.size,
    pipelineCounts,
    categoryCounts,
  };
}
