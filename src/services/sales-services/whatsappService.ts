import { API_BASE_URL } from "./baseUrl";

export interface MediaMessage {
  id?: string;
  filename?: string;
  mimeType?: string;
  cloudUrl?: string;
  localPath?: string;
}

export interface LocationMessage {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface ContactMessage {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  title?: string;
}

export interface InteractiveMessage {
  header?: {
    type: "text" | "image" | "video" | "document";
    text?: string;
    media?: string;
  };
  body: string;
  footer?: string;
  action: {
    buttons?: Array<{
      type: "reply";
      reply: {
        id: string;
        title: string;
      };
    }>;
    sections?: Array<{
      title: string;
      rows: Array<{
        id: string;
        title: string;
        description?: string;
      }>;
    }>;
  };
}

export type MessageType =
  | "text"
  | "image"
  | "video"
  | "audio"
  | "document"
  | "sticker"
  | "location"
  | "contact"
  | "interactive";

interface SendMessageParams {
  accountId: string;
  organizationId: string;
  workspaceId: string;
  to: string;
  type: MessageType;
  text?: string;
  media?: string | File;
  caption?: string;
  filename?: string;
  location?: LocationMessage;
  contacts?: ContactMessage[];
  interactive?: InteractiveMessage;
  previewUrl?: string;
}

interface MessagePayload {
  to: string;
  type: MessageType;
  text?: string;
  media?: string;
  caption?: string;
  filename?: string;
  location?: LocationMessage;
  contacts?: ContactMessage[];
  interactive?: InteractiveMessage;
  previewUrl?: string;
}

class WhatsAppService {
  private baseUrl = API_BASE_URL;

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  private getFormDataHeaders(): HeadersInit {
    const token = localStorage.getItem("crm_access_token");
    if (!token) throw new Error("No authentication token found");
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async listAccounts(params: { organizationId: string; workspaceId: string }) {
    const url = `${this.baseUrl}/whatsapp/accounts?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Check if token looks valid (basic validation)
    if (token.length < 10) {
      throw new Error("Invalid authentication token");
    }

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || response.statusText };
        }

        throw new Error(
          errorData.message ||
            `Failed to list accounts: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();

      return responseData;
    } catch (error) {
      // Check if it's a network error
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Network error: Failed to fetch. Please check if the backend server is running and accessible."
        );
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch WhatsApp accounts: ${error}`);
    }
  }

  async getConversations(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const searchParams = new URLSearchParams({
      organizationId: params.organizationId,
      workspaceId: params.workspaceId,
      ...(params.limit && { limit: params.limit.toString() }),
      ...(params.offset && { offset: params.offset.toString() }),
      ...(params.search && { search: params.search }),
    });

    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}/conversations?${searchParams}`;

    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || response.statusText };
        }

        throw new Error(
          errorData.message ||
            `Failed to get conversations: ${response.status} ${response.statusText}`
        );
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      // Check if it's a network/CORS error
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error(
          "Network error: Failed to fetch conversations. Please check if the backend server is running and CORS is properly configured."
        );
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Failed to fetch conversations: ${error}`);
    }
  }

  async getConversationMessages(params: {
    accountId: string;
    whatsappId: string;
    organizationId: string;
    workspaceId: string;
    limit?: number;
    offset?: number;
  }) {
    const url = new URL(
      `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
        params.accountId
      )}/conversations/${encodeURIComponent(params.whatsappId)}/messages`
    );
    url.searchParams.set("organizationId", params.organizationId);
    url.searchParams.set("workspaceId", params.workspaceId);
    if (params.limit) url.searchParams.set("limit", String(params.limit));
    if (params.offset) url.searchParams.set("offset", String(params.offset));

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error("Failed to load conversation messages");
    }

    const responseData = await response.json();

    return responseData;
  }

  async sendMessage(params: SendMessageParams) {
    const url = new URL(
      `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
        params.accountId
      )}/send`
    );
    url.searchParams.set("organizationId", params.organizationId);
    url.searchParams.set("workspaceId", params.workspaceId);

    // Handle file uploads
    if (params.media instanceof File) {
      return this.sendFileMessage(url.toString(), params);
    }

    // Handle JSON requests
    return this.sendJsonMessage(url.toString(), params);
  }

  private async sendFileMessage(url: string, params: SendMessageParams) {
    const formData = new FormData();
    formData.append("file", params.media as File); // Use 'file' like React frontend
    formData.append("to", params.to);
    formData.append("type", params.type);

    if (params.caption) formData.append("caption", params.caption);
    if (params.filename) formData.append("filename", params.filename);

    const response = await fetch(url, {
      method: "POST",
      headers: this.getFormDataHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return response.json();
  }

  private async sendJsonMessage(url: string, params: SendMessageParams) {
    const payload: MessagePayload = {
      to: params.to,
      type: params.type,
    };

    // Add type-specific fields like React frontend
    switch (params.type) {
      case "text":
        payload.text = params.text;
        if (params.previewUrl) payload.previewUrl = params.previewUrl;
        break;

      case "image":
      case "video":
      case "audio":
      case "document":
      case "sticker":
        payload.media = params.media as string;
        if (params.caption) payload.caption = params.caption;
        if (params.filename) payload.filename = params.filename;
        break;

      case "location":
        payload.location = params.location;
        break;

      case "contact":
        payload.contacts = params.contacts;
        break;

      case "interactive":
        payload.interactive = params.interactive;
        break;
    }

    const token = localStorage.getItem("crm_access_token");
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || response.statusText };
      }

      throw new Error(
        errorData.message ||
          `Failed to send message: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();

    return responseData;
  }

  async sendTextMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    text: string;
    previewUrl?: string;
  }) {
    return this.sendMessage({
      ...params,
      type: "text",
    });
  }

  async sendImageMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    media: string | File;
    caption?: string;
    filename?: string;
  }) {
    return this.sendMessage({
      ...params,
      type: "image",
    });
  }

  async sendVideoMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    media: string | File;
    caption?: string;
    filename?: string;
  }) {
    return this.sendMessage({
      ...params,
      type: "video",
    });
  }

  async sendAudioMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    media: string | File;
    filename?: string;
  }) {
    return this.sendMessage({
      ...params,
      type: "audio",
    });
  }

  async sendDocumentMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    media: string | File;
    caption?: string;
    filename?: string;
  }) {
    return this.sendMessage({
      ...params,
      type: "document",
    });
  }

  async sendStickerMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    media: string | File;
  }) {
    return this.sendMessage({
      ...params,
      type: "sticker",
    });
  }

  async sendLocationMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    location: LocationMessage;
  }) {
    return this.sendMessage({
      ...params,
      type: "location",
    });
  }

  async sendContactMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    contacts: ContactMessage[];
  }) {
    return this.sendMessage({
      ...params,
      type: "contact",
    });
  }

  async sendInteractiveMessage(params: {
    accountId: string;
    organizationId: string;
    workspaceId: string;
    to: string;
    interactive: InteractiveMessage;
  }) {
    return this.sendMessage({
      ...params,
      type: "interactive",
    });
  }

  getFileInfo(file: File): {
    type: MessageType;
    mimeType: string;
    filename: string;
  } {
    const mimeType = file.type;
    const filename = file.name;

    if (mimeType.startsWith("image/")) {
      return { type: "image", mimeType, filename };
    } else if (mimeType.startsWith("video/")) {
      return { type: "video", mimeType, filename };
    } else if (mimeType.startsWith("audio/")) {
      return { type: "audio", mimeType, filename };
    } else if (mimeType === "application/pdf" || filename.endsWith(".pdf")) {
      return { type: "document", mimeType, filename };
    } else if (
      filename.endsWith(".doc") ||
      filename.endsWith(".docx") ||
      filename.endsWith(".xls") ||
      filename.endsWith(".xlsx") ||
      filename.endsWith(".txt")
    ) {
      return { type: "document", mimeType, filename };
    } else {
      return { type: "document", mimeType, filename };
    }
  }

  async connectAccount(params: {
    organizationId: string;
    workspaceId: string;
    name?: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/connect?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name: params.name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to connect account: ${response.statusText}`);
    }

    return response.json();
  }

  async getQRCode(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}/qr-code?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to get QR code: ${response.statusText}`);
    }

    return response.json();
  }

  async getAccountStatus(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}/status?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If endpoint doesn't exist (404), return a default status
        if (response.status === 404) {
          return {
            status: "UNKNOWN",
            message: "Status endpoint not available",
          };
        }
        throw new Error(`Failed to get account status: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      return { status: "UNKNOWN", message: "Failed to fetch status" };
    }
  }

  async reconnectAccount(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}/reconnect?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to reconnect account: ${response.statusText}`);
    }

    return response.json();
  }

  async disconnectAccount(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}/disconnect?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const response = await fetch(url, {
      method: "POST",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to disconnect account: ${response.statusText}`);
    }

    return response.json();
  }

  async removeAccount(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
  }) {
    const url = `${this.baseUrl}/whatsapp/accounts/${encodeURIComponent(
      params.accountId
    )}?organizationId=${encodeURIComponent(
      params.organizationId
    )}&workspaceId=${encodeURIComponent(params.workspaceId)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to remove account: ${response.statusText}`);
    }

    return response.json();
  }

  async markConversationAsRead(params: {
    organizationId: string;
    workspaceId: string;
    accountId: string;
    conversationId: string;
    type?: "INDIVIDUAL" | "GROUP";
  }) {
    const url = new URL(
      `${this.baseUrl}/whatsapp/accounts/${params.accountId}/conversations/${params.conversationId}/read`
    );
    url.searchParams.set("organizationId", params.organizationId);
    url.searchParams.set("workspaceId", params.workspaceId);

    if (params.type) {
      url.searchParams.set("type", params.type);
    }

    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(errorText || "Failed to mark conversation as read");
    }

    const responseData = await response.json();

    return responseData;
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;
