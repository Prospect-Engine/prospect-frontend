/**
 * SCHEDULING API SERVICE
 * =======================
 * API service for Calendly-style scheduling functionality.
 * Connects to the genchat-service scheduling module.
 */

import ShowShortMessage from "@/base-component/ShowShortMessage";

// Configuration for scheduling API
const getSchedulingConfig = () => ({
  baseUrl: process.env.NEXT_PUBLIC_GENCHAT_URL || "http://localhost:3011/api/v1",
  workspaceId: typeof window !== "undefined" ? localStorage.getItem("selectedWorkspaceId") || "" : "",
  userId: typeof window !== "undefined" ? (() => {
    const userData = localStorage.getItem("user_data");
    return userData ? JSON.parse(userData)?.id : "";
  })() : "",
});

// Types
export type LocationType = "video" | "phone" | "in_person" | "custom";
export type BookingStatus = "confirmed" | "cancelled" | "completed" | "no_show";
export type BookingSource = "booking_page" | "chatform" | "manual" | "api";

export interface EventType {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  slug: string;
  description?: string;
  duration: number;
  color: string;
  location: LocationType;
  locationValue?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface WeeklyHours {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
}

export interface DateOverride {
  date: string;
  available: boolean;
  slots?: TimeSlot[];
}

export interface Availability {
  id: string;
  userId: string;
  workspaceId: string;
  timezone: string;
  weeklyHours: WeeklyHours;
  bufferBefore: number;
  bufferAfter: number;
  minimumNotice: number;
  dateOverrides: DateOverride[];
}

export interface Booking {
  id: string;
  eventTypeId: string;
  hostUserId: string;
  workspaceId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCompany?: string;
  guestNotes?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  location: LocationType;
  locationValue?: string;
  meetingUrl?: string;
  status: BookingStatus;
  cancellationReason?: string;
  rescheduledFromId?: string;
  source: BookingSource;
  chatformId?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  start: string;
  end: string;
  available: boolean;
}

// DTOs
export interface CreateEventTypeDto {
  name: string;
  description?: string;
  duration: number;
  color?: string;
  location: LocationType;
  locationValue?: string;
}

export interface UpdateEventTypeDto {
  name?: string;
  description?: string;
  duration?: number;
  color?: string;
  location?: LocationType;
  locationValue?: string;
  isActive?: boolean;
}

export interface UpdateAvailabilityDto {
  timezone?: string;
  weeklyHours?: WeeklyHours;
  bufferBefore?: number;
  bufferAfter?: number;
  minimumNotice?: number;
}

export interface CreateBookingDto {
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestCompany?: string;
  guestNotes?: string;
  startTime: string;
  timezone: string;
  source?: BookingSource;
  chatformId?: string;
}

export interface GetBookingsParams {
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  limit?: number;
  offset?: number;
}

// API call helper
async function schedulingApiCall<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    body?: any;
    params?: Record<string, any>;
  } = {}
): Promise<{ data: T; status: number }> {
  const config = getSchedulingConfig();
  const { method = "GET", body, params } = options;

  // Build URL with query parameters
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const fullUrl = `${config.baseUrl}${url}`;

  let status = 500;
  let data: any;

  try {
    const fetchParams: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-workspace-id": config.workspaceId,
        "x-user-id": config.userId,
      },
      body: method === "GET" ? undefined : JSON.stringify(body),
      credentials: "include",
    };

    const response = await fetch(fullUrl, fetchParams);
    status = response.status;

    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: "Invalid JSON response", rawResponse: responseText };
    }

    if (!response.ok && typeof window !== "undefined") {
      ShowShortMessage(data?.message || `Scheduling API error: ${status}`, "error");
    }
  } catch (error) {
    if (typeof window !== "undefined") {
      if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
        ShowShortMessage(
          "Cannot connect to scheduling service. Please check if the server is running.",
          "error"
        );
      } else {
        ShowShortMessage("Scheduling API request failed. Please try again.", "error");
      }
    }
  }

  return { data, status };
}

export class SchedulingApiService {
  // ============================================
  // EVENT TYPE METHODS
  // ============================================

  static async createEventType(dto: CreateEventTypeDto): Promise<{ data: EventType; status: number }> {
    return schedulingApiCall<EventType>("/scheduling/event-types", {
      method: "POST",
      body: dto,
    });
  }

  static async getEventTypes(): Promise<{ data: EventType[]; status: number }> {
    return schedulingApiCall<EventType[]>("/scheduling/event-types", {
      method: "GET",
    });
  }

  static async getEventType(id: string): Promise<{ data: EventType; status: number }> {
    return schedulingApiCall<EventType>(`/scheduling/event-types/${id}`, {
      method: "GET",
    });
  }

  static async updateEventType(id: string, dto: UpdateEventTypeDto): Promise<{ data: EventType; status: number }> {
    return schedulingApiCall<EventType>(`/scheduling/event-types/${id}`, {
      method: "PUT",
      body: dto,
    });
  }

  static async deleteEventType(id: string): Promise<{ data: any; status: number }> {
    return schedulingApiCall(`/scheduling/event-types/${id}`, {
      method: "DELETE",
    });
  }

  // Public booking page
  static async getPublicEventType(userId: string, slug: string): Promise<{ data: EventType; status: number }> {
    return schedulingApiCall<EventType>(`/scheduling/public/${userId}/event-types/${slug}`, {
      method: "GET",
    });
  }

  // ============================================
  // AVAILABILITY METHODS
  // ============================================

  static async getAvailability(): Promise<{ data: Availability; status: number }> {
    return schedulingApiCall<Availability>("/scheduling/availability", {
      method: "GET",
    });
  }

  static async updateAvailability(dto: UpdateAvailabilityDto): Promise<{ data: Availability; status: number }> {
    return schedulingApiCall<Availability>("/scheduling/availability", {
      method: "PUT",
      body: dto,
    });
  }

  static async addDateOverride(dto: DateOverride): Promise<{ data: Availability; status: number }> {
    return schedulingApiCall<Availability>("/scheduling/availability/date-overrides", {
      method: "POST",
      body: dto,
    });
  }

  static async removeDateOverride(date: string): Promise<{ data: any; status: number }> {
    return schedulingApiCall(`/scheduling/availability/date-overrides/${date}`, {
      method: "DELETE",
    });
  }

  // ============================================
  // AVAILABLE SLOTS METHODS
  // ============================================

  static async getAvailableSlots(
    eventTypeId: string,
    startDate: string,
    endDate: string,
    timezone?: string
  ): Promise<{ data: AvailableSlot[]; status: number }> {
    return schedulingApiCall<AvailableSlot[]>("/scheduling/slots", {
      method: "GET",
      params: { eventTypeId, startDate, endDate, timezone },
    });
  }

  static async getPublicAvailableSlots(
    eventTypeId: string,
    startDate: string,
    endDate: string,
    timezone?: string
  ): Promise<{ data: AvailableSlot[]; status: number }> {
    return schedulingApiCall<AvailableSlot[]>("/scheduling/public/slots", {
      method: "GET",
      params: { eventTypeId, startDate, endDate, timezone },
    });
  }

  // ============================================
  // BOOKING METHODS
  // ============================================

  static async createBooking(dto: CreateBookingDto): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>("/scheduling/bookings", {
      method: "POST",
      body: dto,
    });
  }

  static async createPublicBooking(dto: CreateBookingDto): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>("/scheduling/public/bookings", {
      method: "POST",
      body: dto,
    });
  }

  static async getBookings(params?: GetBookingsParams): Promise<{ data: Booking[]; status: number }> {
    return schedulingApiCall<Booking[]>("/scheduling/bookings", {
      method: "GET",
      params,
    });
  }

  static async getBooking(id: string): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>(`/scheduling/bookings/${id}`, {
      method: "GET",
    });
  }

  static async rescheduleBooking(
    id: string,
    startTime: string,
    reason?: string
  ): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>(`/scheduling/bookings/${id}/reschedule`, {
      method: "POST",
      body: { startTime, reason },
    });
  }

  static async cancelBooking(id: string, reason?: string): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>(`/scheduling/bookings/${id}/cancel`, {
      method: "POST",
      body: { reason },
    });
  }

  static async markBookingCompleted(id: string): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>(`/scheduling/bookings/${id}/complete`, {
      method: "PATCH",
    });
  }

  static async markBookingNoShow(id: string): Promise<{ data: Booking; status: number }> {
    return schedulingApiCall<Booking>(`/scheduling/bookings/${id}/no-show`, {
      method: "PATCH",
    });
  }

  // ============================================
  // STATS METHODS (computed from bookings)
  // ============================================

  static async getBookingStats(): Promise<{
    upcoming: number;
    thisWeek: number;
    completed: number;
    cancelled: number;
  }> {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Get all bookings
    const { data: bookings } = await this.getBookings();

    if (!Array.isArray(bookings)) {
      return { upcoming: 0, thisWeek: 0, completed: 0, cancelled: 0 };
    }

    const upcoming = bookings.filter(
      (b) => b.status === "confirmed" && new Date(b.startTime) > now
    ).length;

    const thisWeek = bookings.filter((b) => {
      const startTime = new Date(b.startTime);
      return startTime >= startOfWeek && startTime < endOfWeek && b.status === "confirmed";
    }).length;

    const completed = bookings.filter((b) => b.status === "completed").length;
    const cancelled = bookings.filter((b) => b.status === "cancelled").length;

    return { upcoming, thisWeek, completed, cancelled };
  }
}

export default SchedulingApiService;
