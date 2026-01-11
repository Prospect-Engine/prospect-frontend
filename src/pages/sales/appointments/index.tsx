/**
 * APPOINTMENTS - Calendar Booking System
 * =======================================
 * Manage calendar availability and appointment bookings.
 * Integrates with chatforms for pre-meeting qualification.
 */

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Calendar,
  Plus,
  ArrowRight,
  Clock,
  Users,
  Video,
  MapPin,
  Settings,
  ExternalLink,
  Copy,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Link2,
  Timer,
  Loader2,
  Phone,
  Trash2,
  Edit2,
  Eye,
} from "lucide-react";
import {
  SchedulingApiService,
  EventType,
  Booking,
  LocationType,
} from "@/services/schedulingApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";

// Meeting type configurations
const meetingTypes = [
  {
    id: "video" as LocationType,
    title: "Video Call",
    description: "Google Meet, Zoom, or Teams",
    icon: Video,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "phone" as LocationType,
    title: "Phone Call",
    description: "Direct phone conversation",
    icon: Phone,
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "in_person" as LocationType,
    title: "In-Person",
    description: "Meet at a physical location",
    icon: MapPin,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
];

// Helper functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const getLocationIcon = (location: LocationType) => {
  switch (location) {
    case "video":
      return <Video className="h-5 w-5 text-blue-500" />;
    case "phone":
      return <Phone className="h-5 w-5 text-purple-500" />;
    case "in_person":
      return <MapPin className="h-5 w-5 text-emerald-500" />;
    default:
      return <Calendar className="h-5 w-5 text-gray-500" />;
  }
};

export default function AppointmentsPage() {
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    upcoming: 0,
    thisWeek: 0,
    completed: 0,
    cancelled: 0,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventTypesRes, bookingsRes, statsData] = await Promise.all([
        SchedulingApiService.getEventTypes(),
        SchedulingApiService.getBookings(),
        SchedulingApiService.getBookingStats(),
      ]);

      if (Array.isArray(eventTypesRes.data)) {
        setEventTypes(eventTypesRes.data);
      }
      if (Array.isArray(bookingsRes.data)) {
        // Filter to only upcoming confirmed bookings
        const upcomingBookings = bookingsRes.data.filter(
          (b) => b.status === "confirmed" && new Date(b.startTime) > new Date()
        );
        setBookings(upcomingBookings);
      }
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching scheduling data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy booking link
  const copyBookingLink = async (eventType: EventType) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/book/${eventType.userId}/${eventType.slug}`;
    await navigator.clipboard.writeText(link);
    ShowShortMessage("Booking link copied to clipboard!", "success");
  };

  // Toggle event type active status
  const toggleEventTypeStatus = async (eventType: EventType) => {
    try {
      await SchedulingApiService.updateEventType(eventType.id, {
        isActive: !eventType.isActive,
      });
      fetchData();
      ShowShortMessage(
        `Event type ${eventType.isActive ? "deactivated" : "activated"}`,
        "success"
      );
    } catch (error) {
      ShowShortMessage("Failed to update event type", "error");
    }
  };

  // Delete event type
  const deleteEventType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event type?")) return;
    try {
      await SchedulingApiService.deleteEventType(id);
      fetchData();
      ShowShortMessage("Event type deleted", "success");
    } catch (error) {
      ShowShortMessage("Failed to delete event type", "error");
    }
  };

  // Cancel booking
  const cancelBooking = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await SchedulingApiService.cancelBooking(id, "Cancelled by host");
      fetchData();
      ShowShortMessage("Booking cancelled", "success");
    } catch (error) {
      ShowShortMessage("Failed to cancel booking", "error");
    }
  };

  // Stats configuration
  const statsConfig = [
    {
      title: "Upcoming",
      value: stats.upcoming.toString(),
      icon: Calendar,
      color: "bg-blue-500",
    },
    {
      title: "This Week",
      value: stats.thisWeek.toString(),
      icon: CalendarDays,
      color: "bg-purple-500",
    },
    {
      title: "Completed",
      value: stats.completed.toString(),
      icon: CheckCircle2,
      color: "bg-green-500",
    },
    {
      title: "Cancelled",
      value: stats.cancelled.toString(),
      icon: XCircle,
      color: "bg-red-500",
    },
  ];

  return (
    <AppLayout activePage="Appointments">
      <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Appointments
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Calendar Bookings
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Manage your availability, create booking links, and integrate
                    with chatforms for qualified appointments only.
                  </p>
                </div>
                <Link href="/sales/appointments/new">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#3b82f6] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    New Event Type
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsConfig.map((stat) => (
                <div
                  key={stat.title}
                  className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-foreground">
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Event Types */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Event Types
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Create booking links for different meeting types
                  </p>
                </div>
                <Link href="/sales/appointments/new">
                  <button className="text-sm text-[#3b82f6] hover:underline flex items-center gap-1">
                    Create Event Type <Plus className="h-4 w-4" />
                  </button>
                </Link>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading event types...</p>
                </div>
              ) : eventTypes.length === 0 ? (
                <div className="p-8">
                  <div className="grid sm:grid-cols-3 gap-4">
                    {meetingTypes.map((type) => (
                      <Link key={type.id} href={`/sales/appointments/new?type=${type.id}`}>
                        <div className="flex flex-col p-5 rounded-xl border border-black/[0.04] dark:border-white/[0.04] hover:shadow-md transition-all cursor-pointer group h-full">
                          <div className={`p-3 rounded-xl ${type.color} w-fit mb-3`}>
                            <type.icon className={`h-5 w-5 ${type.iconColor}`} />
                          </div>
                          <h3 className="font-medium text-foreground mb-1">
                            {type.title}
                          </h3>
                          <p className="text-sm text-muted-foreground flex-1">
                            {type.description}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-[#3b82f6] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="h-4 w-4" /> Create
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {eventTypes.map((event) => (
                    <div
                      key={event.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${event.color}20` }}
                          >
                            {getLocationIcon(event.location)}
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {event.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Timer className="h-3 w-3" />
                                {event.duration} min
                              </span>
                              {event.description && (
                                <span className="text-sm text-muted-foreground">
                                  {event.description}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleEventTypeStatus(event)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              event.isActive
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-200"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 hover:bg-gray-200"
                            }`}
                          >
                            {event.isActive ? "Active" : "Inactive"}
                          </button>
                          <button
                            onClick={() => copyBookingLink(event)}
                            className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                            title="Copy booking link"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <Link href={`/book/${event.userId}/${event.slug}`} target="_blank">
                            <button
                              className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                              title="Preview booking page"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Link>
                          <Link href={`/sales/appointments/${event.id}/edit`}>
                            <button
                              className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                              title="Edit event type"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Link>
                          <button
                            onClick={() => deleteEventType(event.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            title="Delete event type"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Upcoming Appointments
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your scheduled meetings
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading appointments...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No upcoming appointments
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create event types and share your booking link to start
                    receiving appointments from qualified leads.
                  </p>
                  <Link href="/sales/appointments/new">
                    <button className="px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#2563eb] transition-colors">
                      Create Event Type
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-xs text-muted-foreground uppercase">
                              {formatDate(booking.startTime)}
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              {formatTime(booking.startTime)}
                            </p>
                          </div>
                          <div className="w-px h-12 bg-black/[0.06] dark:bg-white/[0.06]" />
                          <div>
                            <h3 className="font-medium text-foreground">
                              {booking.guestName}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {booking.guestEmail}
                              {booking.guestCompany && ` - ${booking.guestCompany}`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {getLocationIcon(booking.location)}
                                <span className="capitalize">{booking.location.replace("_", " ")}</span>
                              </span>
                              {booking.source === "chatform" && (
                                <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">
                                  Qualified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
                            }`}
                          >
                            {booking.status}
                          </span>
                          <button
                            onClick={() => cancelBooking(booking.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            title="Cancel booking"
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/sales/chatforms">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Link2 className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Link to Chatform</p>
                    <p className="text-sm text-muted-foreground">
                      Qualify before booking
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/sales/appointments/availability">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Settings className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Availability Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Set working hours
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/sales/leads">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">View Leads</p>
                    <p className="text-sm text-muted-foreground">
                      See booked contacts
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
      </div>
    </AppLayout>
  );
}
