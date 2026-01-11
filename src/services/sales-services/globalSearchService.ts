import { SearchResult } from "../../hooks/sales-hooks/useGlobalSearch";
import { API_BASE_URL } from "./baseUrl";

export interface GlobalSearchParams {
  query: string;
  workspaceId: string;
  organizationId: string;
  types?: ("leads" | "tasks" | "deals" | "companies" | "contacts")[];
  limit?: number;
}

export const globalSearchService = {
  async search(params: GlobalSearchParams): Promise<SearchResult[]> {
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/search/global?${new URLSearchParams({
          query: params.query,
          workspaceId: params.workspaceId,
          organizationId: params.organizationId,
          ...(params.types && { types: params.types.join(",") }),
          ...(params.limit && { limit: params.limit.toString() }),
        })}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      throw new Error("Search service unavailable");
    }
  },
};
