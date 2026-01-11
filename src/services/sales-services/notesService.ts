import { API_BASE_URL } from "./baseUrl";
import toastService from "./toastService";

export interface Note {
  id: string;
  workspaceId: string;
  organizationId: string;
  title?: string;
  content: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  contact?: Record<string, unknown>;
  company?: Record<string, unknown>;
  deal?: Record<string, unknown>;
  workspace?: Record<string, unknown>;
  organization?: Record<string, unknown>;
}

export interface CreateNoteDto {
  title?: string;
  content: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

export interface UpdateNoteDto {
  title?: string;
  content?: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
}

export interface QueryNoteDto {
  workspaceId: string;
  organizationId: string;
  contactId?: string;
  companyId?: string;
  dealId?: string;
  authorId?: string;
}

export interface NotesResponse {
  data: Note[];
  total: number;
}

export interface BulkDeleteNotesDto {
  noteIds: string[];
}

export interface BulkDeleteResultDto {
  totalRequested: number;
  deleted: number;
  failed: number;
  errors: Array<{
    noteId: string;
    error: string;
  }>;
}

class NotesService {
  private getAuthHeaders(token?: string): HeadersInit {
    const authToken = token || localStorage.getItem("crm_access_token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
  }

  private buildQueryParams(params: QueryNoteDto): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  }

  async getNotes(params: QueryNoteDto, token?: string): Promise<NotesResponse> {
    const queryString = this.buildQueryParams(params);
    const response = await fetch(`${API_BASE_URL}/notes?${queryString}`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }

    return response.json();
  }

  async getNote(
    id: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    const response = await fetch(`${API_BASE_URL}/notes/${id}?${queryString}`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }

    return response.json();
  }

  async createNote(
    data: CreateNoteDto,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(`${API_BASE_URL}/notes?${queryString}`, {
          method: "POST",
          headers: this.getAuthHeaders(token),
          body: JSON.stringify(data),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to create note: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Creating note...",
        success: "Note created successfully!",
        error: "Failed to create note",
      }
    );
  }

  async updateNote(
    id: string,
    data: UpdateNoteDto,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify(data),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to update note: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note...",
        success: "Note updated successfully!",
        error: "Failed to update note",
      }
    );
  }

  async deleteNote(
    id: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<void> {
    const queryString = this.buildQueryParams(params);
    await toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}?${queryString}`,
          {
            method: "DELETE",
            headers: this.getAuthHeaders(token),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to delete note: ${response.statusText}`
          );
        }
      })(),
      {
        loading: "Deleting note...",
        success: "Note deleted successfully!",
        error: "Failed to delete note",
      }
    );
  }

  async bulkDeleteNotes(
    data: BulkDeleteNotesDto,
    params: QueryNoteDto,
    token?: string
  ): Promise<BulkDeleteResultDto> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/bulk-delete?${queryString}`,
          {
            method: "POST",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify(data),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to bulk delete notes: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Deleting notes...",
        success: "Notes deleted successfully!",
        error: "Failed to bulk delete notes",
      }
    );
  }

  // Individual field update methods
  async updateNoteTitle(
    id: string,
    title: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}/title?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ title }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update note title: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note title...",
        success: "Note title updated!",
        error: "Failed to update note title",
      }
    );
  }

  async updateNoteContent(
    id: string,
    content: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}/content?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ content }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update note content: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note content...",
        success: "Note content updated!",
        error: "Failed to update note content",
      }
    );
  }

  async updateNoteContact(
    id: string,
    contactId: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}/contact?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ contactId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update note contact: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note contact...",
        success: "Note contact updated!",
        error: "Failed to update note contact",
      }
    );
  }

  async updateNoteCompany(
    id: string,
    companyId: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}/company?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ companyId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update note company: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note company...",
        success: "Note company updated!",
        error: "Failed to update note company",
      }
    );
  }

  async updateNoteDeal(
    id: string,
    dealId: string,
    params: QueryNoteDto,
    token?: string
  ): Promise<Note> {
    const queryString = this.buildQueryParams(params);
    return toastService.promise(
      (async () => {
        const response = await fetch(
          `${API_BASE_URL}/notes/${id}/deal?${queryString}`,
          {
            method: "PATCH",
            headers: this.getAuthHeaders(token),
            body: JSON.stringify({ dealId }),
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
              `Failed to update note deal: ${response.statusText}`
          );
        }
        return response.json();
      })(),
      {
        loading: "Updating note deal...",
        success: "Note deal updated!",
        error: "Failed to update note deal",
      }
    );
  }
}

export const notesService = new NotesService();
