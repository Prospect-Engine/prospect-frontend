/**
 * AVAILABILITY SETTINGS
 * =====================
 * Configure working hours and booking preferences.
 */

import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Plus,
  Trash2,
  Save,
  Globe,
} from "lucide-react";
import {
  SchedulingApiService,
  Availability,
  TimeSlot,
  WeeklyHours,
} from "@/services/schedulingApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";

// Days of the week
const daysOfWeek: (keyof WeeklyHours)[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabels: Record<keyof WeeklyHours, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

// Common timezones
const timezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);

  // Fetch availability
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const { data } = await SchedulingApiService.getAvailability();
        if (data) {
          setAvailability(data);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAvailability();
  }, []);

  // Add time slot
  const addTimeSlot = (day: keyof WeeklyHours) => {
    if (!availability) return;
    const newSlot: TimeSlot = { start: "09:00", end: "17:00" };
    setAvailability({
      ...availability,
      weeklyHours: {
        ...availability.weeklyHours,
        [day]: [...availability.weeklyHours[day], newSlot],
      },
    });
  };

  // Remove time slot
  const removeTimeSlot = (day: keyof WeeklyHours, index: number) => {
    if (!availability) return;
    setAvailability({
      ...availability,
      weeklyHours: {
        ...availability.weeklyHours,
        [day]: availability.weeklyHours[day].filter((_, i) => i !== index),
      },
    });
  };

  // Update time slot
  const updateTimeSlot = (
    day: keyof WeeklyHours,
    index: number,
    field: "start" | "end",
    value: string
  ) => {
    if (!availability) return;
    const updatedSlots = [...availability.weeklyHours[day]];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    setAvailability({
      ...availability,
      weeklyHours: {
        ...availability.weeklyHours,
        [day]: updatedSlots,
      },
    });
  };

  // Save availability
  const saveAvailability = async () => {
    if (!availability) return;

    setSaving(true);
    try {
      await SchedulingApiService.updateAvailability({
        timezone: availability.timezone,
        weeklyHours: availability.weeklyHours,
        bufferBefore: availability.bufferBefore,
        bufferAfter: availability.bufferAfter,
        minimumNotice: availability.minimumNotice,
      });
      ShowShortMessage("Availability saved successfully!", "success");
    } catch (error) {
      ShowShortMessage("Failed to save availability", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout activePage="Appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-2">Loading availability...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activePage="Appointments">
      <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <Link
                  href="/sales/appointments"
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Appointments
                </Link>
                <h1 className="text-2xl font-bold text-foreground">
                  Availability Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                  Set your working hours and booking preferences
                </p>
              </div>
              <button
                onClick={saveAvailability}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-[#3b82f6] text-white rounded-xl font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                Save Changes
              </button>
            </div>

            {availability && (
              <div className="space-y-6">
                {/* Timezone */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-[#3b82f6]" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Timezone
                    </h2>
                  </div>
                  <select
                    value={availability.timezone}
                    onChange={(e) =>
                      setAvailability({ ...availability, timezone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Weekly Hours */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="h-5 w-5 text-[#3b82f6]" />
                    <h2 className="text-lg font-semibold text-foreground">
                      Weekly Hours
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="flex items-start gap-4 py-4 border-b border-black/[0.04] dark:border-white/[0.04] last:border-0"
                      >
                        <div className="w-28 pt-2">
                          <span className="font-medium text-foreground">
                            {dayLabels[day]}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          {availability.weeklyHours[day].length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              Unavailable
                            </p>
                          ) : (
                            availability.weeklyHours[day].map((slot, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) =>
                                    updateTimeSlot(day, index, "start", e.target.value)
                                  }
                                  className="px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                                />
                                <span className="text-muted-foreground">to</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) =>
                                    updateTimeSlot(day, index, "end", e.target.value)
                                  }
                                  className="px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                                />
                                <button
                                  onClick={() => removeTimeSlot(day, index)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          )}
                          <button
                            onClick={() => addTimeSlot(day)}
                            className="flex items-center gap-1 text-sm text-[#3b82f6] hover:underline"
                          >
                            <Plus className="h-4 w-4" />
                            Add hours
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buffer Settings */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <h2 className="text-lg font-semibold text-foreground mb-6">
                    Buffer Settings
                  </h2>

                  <div className="grid sm:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Buffer Before (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={availability.bufferBefore}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            bufferBefore: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time before each meeting
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Buffer After (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={availability.bufferAfter}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            bufferAfter: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Time after each meeting
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Minimum Notice (hours)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="168"
                        value={availability.minimumNotice}
                        onChange={(e) =>
                          setAvailability({
                            ...availability,
                            minimumNotice: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Advance booking required
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </div>
    </AppLayout>
  );
}
