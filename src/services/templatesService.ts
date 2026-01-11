import { TemplateListResponse, TemplateFilters } from "@/types/templates";

export class TemplatesService {
  private static baseUrl = "/api/templates";

  static async getTemplates(
    filters: TemplateFilters = {}
  ): Promise<TemplateListResponse> {
    const queryParams = new URLSearchParams();

    // Include pagination parameters
    if (filters.page) queryParams.append("page", filters.page.toString());
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.order_by) queryParams.append("order_by", filters.order_by);
    if (filters.sort_type) queryParams.append("sort_type", filters.sort_type);

    // Include filtering parameters
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.status) queryParams.append("status", filters.status);

    const queryString = queryParams.toString();
    const url = `${this.baseUrl}/getList${queryString ? `?${queryString}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;

        // Try to get more specific error information
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the status code
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async createTemplate(templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateTemplate(id: string, templateData: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...templateData }),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }
}
