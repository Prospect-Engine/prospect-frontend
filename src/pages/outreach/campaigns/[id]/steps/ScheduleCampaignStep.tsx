"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { countryCodeMap } from "@/lib/country";
import * as ct from "countries-and-timezones";

// Get timezones for a country using countries-and-timezones package
const getTimezonesForCountry = (countryCode: string): string[] => {
  try {
    const codeUpper = (countryCode || "").toUpperCase();
    const country = ct.getCountry(codeUpper);
    if (country && country.timezones) {
      return country.timezones;
    }
  } catch (error) {}

  // Fallback timezone mapping for common countries
  const fallbackTimezones: { [key: string]: string[] } = {
    us: [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Phoenix",
      "America/Anchorage",
      "Pacific/Honolulu",
    ],
    gb: ["Europe/London"],
    de: ["Europe/Berlin"],
    fr: ["Europe/Paris"],
    id: ["Asia/Jakarta", "Asia/Pontianak", "Asia/Makassar", "Asia/Jayapura"],
    in: ["Asia/Kolkata"],
    sg: ["Asia/Singapore"],
    my: ["Asia/Kuala_Lumpur"],
    th: ["Asia/Bangkok"],
    jp: ["Asia/Tokyo"],
    cn: ["Asia/Shanghai"],
    au: ["Australia/Sydney", "Australia/Melbourne", "Australia/Perth"],
    ca: ["America/Toronto", "America/Vancouver", "America/Edmonton"],
    br: ["America/Sao_Paulo"],
    mx: ["America/Mexico_City"],
    ru: ["Europe/Moscow"],
    za: ["Africa/Johannesburg"],
    eg: ["Africa/Cairo"],
    ng: ["Africa/Lagos"],
    ke: ["Africa/Nairobi"],
  };

  return fallbackTimezones[countryCode.toLowerCase()] || [];
};

// Work Calendar API functions
const fetchWorkCalendar = async (campaignId: string) => {
  try {
    // First, try to get campaign-specific work calendar
    const response = await fetch(
      `/api/outreach/campaign/getWorkCalender?campaignId=${encodeURIComponent(campaignId)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      let serverMessage = "";
      try {
        const text = await response.text();
        serverMessage = text;
      } catch {
        // ignore body parse errors
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "AUTH: Unauthorized to fetch Work Calendar. Please re-authenticate."
        );
      }
      throw new Error(
        `API: Failed to fetch Work Calendar (${response.status}). ${serverMessage}`
      );
    }

    const data = await response.json();

    // Handle wrapped response: { success: true, data: { work_calender: {...} } }
    const workCalendar = data?.data?.work_calender || data?.work_calender;

    // If campaign has work calendar data, return it
    if (workCalendar) {
      return { work_calender: workCalendar };
    }

    // If no work calendar found for campaign, fallback to default
    return await fetchDefaultWorkCalendar();
  } catch (error) {
    // If campaign API fails, try default work calendar
    return await fetchDefaultWorkCalendar();
  }
};

// Fallback function to get default work calendar
const fetchDefaultWorkCalendar = async () => {
  try {
    const response = await fetch("/api/workCalender/getDefault", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      let serverMessage = "";
      try {
        const text = await response.text();
        serverMessage = text;
      } catch {
        // ignore body parse errors
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "AUTH: Unauthorized to fetch Default Work Calendar. Please re-authenticate."
        );
      }
      throw new Error(
        `API: Failed to fetch Default Work Calendar (${response.status}). ${serverMessage}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

// Set Work Calendar for Campaign API function
const setWorkCalendarForCampaign = async (
  campaignId: string,
  workCalendarData: any
) => {
  try {
    const response = await fetch("/api/outreach/campaign/setWorkCalender", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        campaignId,
        work_calender_id: workCalendarData.work_calender_id,
        work_calender: workCalendarData.work_calender,
      }),
    });

    if (!response.ok) {
      let serverMessage = "";
      try {
        const text = await response.text();
        serverMessage = text;
      } catch {
        // ignore body parse errors
      }

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "AUTH: Unauthorized to set Work Calendar. Please re-authenticate."
        );
      }
      throw new Error(
        `API: Failed to set Work Calendar (${response.status}). ${serverMessage}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
};

interface ScheduleSettings {
  startDate: string;
  startTime: string;
  timezone: string;
  country: string;
  delays: {
    betweenMessages: number;
    betweenLeads: number;
    unit: "MINUTES" | "HOURS";
  };
  limits: {
    dailyLimit: number;
    weeklyLimit: number;
    enabled: boolean;
  };
}

interface WorkSchedule {
  id: number;
  startTime: string;
  endTime: string;
  days: string[];
}

interface ScheduleCampaignStepProps {
  campaignId: string;
  next: () => void;
  back: () => void;
  role: string;
}

export default function ScheduleCampaignStep({
  campaignId,
  next,
  back,
}: ScheduleCampaignStepProps) {
  const [schedule, setSchedule] = useState<ScheduleSettings>({
    startDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    timezone: "America/New_York",
    country: "us",
    delays: {
      betweenMessages: 30,
      betweenLeads: 5,
      unit: "MINUTES",
    },
    limits: {
      dailyLimit: 50,
      weeklyLimit: 200,
      enabled: true,
    },
  });

  // Work Calendar state
  const [schedules, setSchedules] = useState<WorkSchedule[]>([
    {
      id: 1,
      startTime: "08:30",
      endTime: "17:30",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingCalendar, setIsSettingCalendar] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [useDefaultCalendar, setUseDefaultCalendar] = useState(false);
  const [defaultCalendarId, setDefaultCalendarId] = useState<string | null>(
    null
  );
  const hasInitialized = useRef(false);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Validate if a timezone is supported by the browser
  const isValidTimezone = (timezone: string): boolean => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      return true;
    } catch {
      return false;
    }
  };

  // Get available timezones for the selected country (filtered for valid timezones)
  const getAvailableTimezones = useCallback(() => {
    if (!schedule.country) return [];
    const timezones = getTimezonesForCountry(schedule.country);
    return timezones.filter(isValidTimezone);
  }, [schedule.country]);

  // Get current time for a specific timezone
  const getCurrentTimeForTimezone = (timezone: string) => {
    try {
      if (!timezone || typeof timezone !== "string") {
        return "";
      }

      const timeInTimezone = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(currentTime);
      return timeInTimezone;
    } catch (error) {
      return "";
    }
  };

  // Format timezone display with current time
  const formatTimezoneDisplay = (timezone: string) => {
    const currentTime = getCurrentTimeForTimezone(timezone);
    const timezoneName = timezone.replace(/_/g, " ");
    return currentTime ? `${timezoneName} (${currentTime})` : timezoneName;
  };

  // Helper function to group schedules by time ranges
  const groupSchedulesByTimeRange = (schedules: WorkSchedule[]) => {
    const grouped = new Map();

    schedules.forEach(schedule => {
      const timeKey = `${schedule.startTime}-${schedule.endTime}`;
      if (!grouped.has(timeKey)) {
        grouped.set(timeKey, {
          id: schedule.id,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          days: [],
        });
      }
      // Add all days from the schedule, not just the first one
      schedule.days.forEach(day => {
        if (!grouped.get(timeKey).days.includes(day)) {
          grouped.get(timeKey).days.push(day);
        }
      });
    });

    return Array.from(grouped.values()).map((schedule, index) => ({
      ...schedule,
      id: index + 1,
      days: schedule.days.map((day: string) => {
        const dayMap: { [key: string]: string } = {
          SUNDAY: "Sun",
          MONDAY: "Mon",
          TUESDAY: "Tue",
          WEDNESDAY: "Wed",
          THURSDAY: "Thu",
          FRIDAY: "Fri",
          SATURDAY: "Sat",
        };
        return dayMap[day] || day;
      }),
    }));
  };

  const handleScheduleUpdate = useCallback(
    (updates: Partial<ScheduleSettings>) => {
      const updated = { ...schedule, ...updates };
      setSchedule(updated);
    },
    [schedule]
  );

  // Work Calendar management functions
  const addNewSchedule = () => {
    const newSchedule = {
      id: Date.now(),
      startTime: "09:00",
      endTime: "18:00",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    };
    setSchedules([...schedules, newSchedule]);
  };

  const removeSchedule = (id: number) => {
    setSchedules(schedules.filter(schedule => schedule.id !== id));
  };

  const updateSchedule = (
    id: number,
    field: string,
    value: string | string[]
  ) => {
    setSchedules(
      schedules.map(schedule =>
        schedule.id === id ? { ...schedule, [field]: value } : schedule
      )
    );
  };

  const toggleDay = (scheduleId: number, day: string) => {
    setSchedules(
      schedules.map(schedule => {
        if (schedule.id === scheduleId) {
          const newDays = schedule.days.includes(day)
            ? schedule.days.filter(d => d !== day)
            : [...schedule.days, day];
          return { ...schedule, days: newDays };
        }
        return schedule;
      })
    );
  };

  // Create default work calendar with current schedule settings
  const createDefaultCalendar = async () => {
    try {
      // Prepare work ranges from current schedules
      const workRanges = schedules.flatMap(scheduleItem => {
        const dayMap: { [key: string]: string } = {
          Sun: "SUNDAY",
          Mon: "MONDAY",
          Tue: "TUESDAY",
          Wed: "WEDNESDAY",
          Thu: "THURSDAY",
          Fri: "FRIDAY",
          Sat: "SATURDAY",
        };

        return scheduleItem.days.map(day => ({
          id: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day),
          day_name: dayMap[day] || day.toUpperCase(),
          start: scheduleItem.startTime,
          end: scheduleItem.endTime,
        }));
      });

      const response = await fetch("/api/workCalender/addDefault", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          work_calenders: {
            name: "Default Work Calendar",
            country_code: schedule.country,
            time_zone: schedule.timezone,
            work_ranges: workRanges,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create default calendar (${response.status})`
        );
      }

      const data = await response.json();
      // Handle wrapped response: { success: true, data: { id: "...", ... } }
      const calendarId = data?.data?.id || data?.id;
      if (calendarId) {
        setDefaultCalendarId(calendarId);
        return calendarId;
      }
      throw new Error("Failed to get calendar ID from response");
    } catch (error) {
      setCalendarError("Failed to create default work calendar");
      return null;
    }
  };

  // Fetch default work calendar data
  const fetchDefaultCalendarData = async () => {
    try {
      const response = await fetch("/api/workCalender/getDefault", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch default work calendar (${response.status})`
        );
      }

      const data = await response.json();
      // Handle wrapped response: { success: true, data: { work_calender: {...} } }
      const workCalendar = data?.data?.work_calender || data?.work_calender;
      if (workCalendar && workCalendar.id) {
        setDefaultCalendarId(workCalendar.id);
        return workCalendar.id;
      }
      // If no default calendar exists, create one
      return await createDefaultCalendar();
    } catch (error) {
      setCalendarError("Failed to load default work calendar");
      return null;
    }
  };

  // Handle default calendar checkbox change
  const handleDefaultCalendarChange = async (checked: boolean) => {
    setUseDefaultCalendar(checked);
    setCalendarError(null);

    if (checked) {
      // Fetch or create default calendar data when checked
      const defaultId = await fetchDefaultCalendarData();
      if (!defaultId) {
        setUseDefaultCalendar(false);
      }
    } else {
      setDefaultCalendarId(null);
    }
  };

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Reset timezone when country changes
  useEffect(() => {
    if (schedule.country) {
      const availableTimezones = getAvailableTimezones();
      if (
        availableTimezones.length > 0 &&
        !availableTimezones.includes(schedule.timezone as any)
      ) {
        setSchedule(prev => ({ ...prev, timezone: availableTimezones[0] }));
      }
    }
  }, [schedule.country, schedule.timezone, getAvailableTimezones]);

  // Load existing work calendar data on component mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const loadWorkCalendar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchWorkCalendar(campaignId);

        if (data && data.work_calender) {
          const calendarData = data.work_calender;

          // Check if this is a default work calendar
          if (calendarData.name === "Default" && calendarData.id) {
            setUseDefaultCalendar(true);
            setDefaultCalendarId(calendarData.id);
            return; // Skip loading custom schedule data for default calendar
          }

          if (calendarData.country_code) {
            const countryEntry = Object.entries(countryCodeMap).find(
              ([, code]) => code === calendarData.country_code
            );
            if (countryEntry) {
              setSchedule(prev => ({
                ...prev,
                country: countryEntry[1].toLowerCase(),
              }));
            } else {
              setSchedule(prev => ({
                ...prev,
                country: calendarData.country_code.toLowerCase(),
              }));
            }
          }
          if (calendarData.time_zone) {
            const initialCountry = (
              calendarData.country_code || ""
            ).toLowerCase();
            const availableTimezones = initialCountry
              ? getTimezonesForCountry(initialCountry).filter(isValidTimezone)
              : [];

            if (availableTimezones.includes(calendarData.time_zone)) {
              setSchedule(prev => ({
                ...prev,
                timezone: calendarData.time_zone,
              }));
            } else {
              setSchedule(prev => ({
                ...prev,
                timezone: availableTimezones[0] || calendarData.time_zone,
              }));
            }
          }

          if (
            calendarData.work_ranges &&
            Array.isArray(calendarData.work_ranges)
          ) {
            // Group work ranges by time range first
            const timeRangeMap = new Map();

            calendarData.work_ranges.forEach((range: any, index: number) => {
              // Handle both old format (start_time/end_time) and new format (start/end)
              const startTime = range.start_time || range.start || "09:00";
              const endTime = range.end_time || range.end || "18:00";
              const timeKey = `${startTime}-${endTime}`;

              if (!timeRangeMap.has(timeKey)) {
                timeRangeMap.set(timeKey, {
                  id: range.id || index + 1,
                  startTime: startTime,
                  endTime: endTime,
                  days: [],
                });
              }

              // Handle both old format (day) and new format (day_name)
              const day = (
                range.day_name ||
                range.day ||
                "MONDAY"
              ).toUpperCase();
              if (!timeRangeMap.get(timeKey).days.includes(day)) {
                timeRangeMap.get(timeKey).days.push(day);
              }
            });

            const convertedSchedules = Array.from(timeRangeMap.values()).map(
              (schedule, index) => ({
                ...schedule,
                id: index + 1,
                days: schedule.days.map((day: string) => {
                  const dayMap: { [key: string]: string } = {
                    SUNDAY: "Sun",
                    MONDAY: "Mon",
                    TUESDAY: "Tue",
                    WEDNESDAY: "Wed",
                    THURSDAY: "Thu",
                    FRIDAY: "Fri",
                    SATURDAY: "Sat",
                  };
                  return dayMap[day] || day;
                }),
              })
            );

            setSchedules(convertedSchedules);
          }
        }
      } catch (error) {
        setError("Failed to load work calendar data");
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkCalendar();
  }, []);

  const getEstimatedDuration = () => {
    // Mock calculation based on schedule settings
    const messagesPerDay = schedule.limits.dailyLimit;
    const workingDaysPerWeek =
      schedules.reduce((total, sched) => total + sched.days.length, 0) /
        schedules.length || 5;
    const delayBetweenMessages = schedule.delays.betweenMessages;

    return {
      daily: `${messagesPerDay} messages`,
      weekly: `${Math.round(messagesPerDay * workingDaysPerWeek)} messages`,
      estimatedTime: `${Math.ceil((messagesPerDay * delayBetweenMessages) / 60)} hours/day`,
    };
  };

  // Prepare work calendar data for API call
  const prepareWorkCalendarData = () => {
    // If using default calendar, return the default calendar ID
    if (useDefaultCalendar && defaultCalendarId) {
      return {
        work_calender_id: defaultCalendarId,
        work_calender: null,
      };
    }

    // Otherwise, create custom work calendar
    const workRanges = schedules.flatMap((scheduleItem, scheduleIndex) => {
      // Convert day abbreviations to full day names
      const dayMap: { [key: string]: string } = {
        Sun: "SUNDAY",
        Mon: "MONDAY",
        Tue: "TUESDAY",
        Wed: "WEDNESDAY",
        Thu: "THURSDAY",
        Fri: "FRIDAY",
        Sat: "SATURDAY",
      };

      // Create a work range for each day in the schedule
      return scheduleItem.days.map((day, dayIndex) => ({
        id: scheduleIndex * 10 + dayIndex + 1, // Generate unique ID for each work range
        day_name: dayMap[day] || "MONDAY",
        start: scheduleItem.startTime,
        end: scheduleItem.endTime,
      }));
    });

    return {
      work_calender_id: null, // Set to null for new work calendar
      work_calender: {
        name: "Campaign", // Use simple name as shown in expected format
        country_code: schedule.country.toUpperCase(),
        time_zone: schedule.timezone,
        work_ranges: workRanges,
      },
    };
  };

  // Handle next button click with work calendar API call
  const handleNext = async () => {
    if (!canProceed) return;

    setIsSettingCalendar(true);
    setCalendarError(null);

    try {
      const workCalendarData = prepareWorkCalendarData();
      await setWorkCalendarForCampaign(campaignId, workCalendarData);
      next(); // Proceed to next step only after successful API call
    } catch (error) {
      setCalendarError(
        error instanceof Error ? error.message : "Failed to set work calendar"
      );
    } finally {
      setIsSettingCalendar(false);
    }
  };

  const canProceed = useDefaultCalendar
    ? defaultCalendarId !== null
    : schedule.startDate && schedule.startTime && schedule.timezone;

  return (
    <div className="space-y-6">
      {/* Work Calendar - Full Width */}
      <Card className="bg-white/70 dark:bg-white/5 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-white">
            <Calendar className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Work Calendar
          </CardTitle>
          <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
            Configure your timezone and working hours for optimal campaign
            scheduling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-6">
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-slate-500/20 to-slate-600/20 dark:from-slate-400/20 dark:to-slate-500/20 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-slate-600 dark:text-slate-400 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Loading Work Calendar...
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Please wait while we load your calendar settings.
                  </p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 dark:from-red-400/20 dark:to-orange-400/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Error Loading Calendar
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Use Default Calendar Checkbox */}
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="useDefaultCalendar"
                  checked={useDefaultCalendar}
                  onChange={e => handleDefaultCalendarChange(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="useDefaultCalendar"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Use default work calendar
                </label>
              </div>

              {!useDefaultCalendar && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={schedule.country}
                          onChange={e =>
                            handleScheduleUpdate({ country: e.target.value })
                          }
                          className="w-full h-8 px-2 py-1 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none text-slate-700 dark:text-slate-300"
                        >
                          <option value="">Select country</option>
                          {Object.entries(countryCodeMap)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([countryName, countryCode]) => (
                              <option
                                key={countryCode}
                                value={countryCode.toLowerCase()}
                              >
                                {countryName}
                              </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={schedule.timezone}
                          onChange={e =>
                            handleScheduleUpdate({ timezone: e.target.value })
                          }
                          className="w-full h-8 px-2 py-1 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none text-slate-700 dark:text-slate-300"
                        >
                          {getAvailableTimezones().length > 0 ? (
                            getAvailableTimezones().map((timezone: string) => (
                              <option key={timezone} value={timezone}>
                                {formatTimezoneDisplay(timezone)}
                              </option>
                            ))
                          ) : (
                            <option value={schedule.timezone}>
                              {formatTimezoneDisplay(schedule.timezone)}
                            </option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Work Schedules
                      </h4>
                      <Button
                        onClick={addNewSchedule}
                        variant="outline"
                        size="sm"
                        className="gap-1 h-7 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {schedules.map((scheduleItem, index) => (
                        <Card
                          key={scheduleItem.id}
                          className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        >
                          <CardContent className="pl-4 pr-2 pt-0 pb-0">
                            <div className="flex items-center text-xs">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                Schedule {index + 1}
                              </span>
                              <div className="flex-1"></div>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-600 dark:text-slate-400">
                                  Start
                                </span>
                                <TimePicker
                                  value={scheduleItem.startTime}
                                  onChange={value =>
                                    updateSchedule(
                                      scheduleItem.id,
                                      "startTime",
                                      value
                                    )
                                  }
                                />
                                <span className="text-slate-400 dark:text-slate-500">
                                  |
                                </span>
                                <span className="text-slate-600 dark:text-slate-400">
                                  End
                                </span>
                                <TimePicker
                                  value={scheduleItem.endTime}
                                  onChange={value =>
                                    updateSchedule(
                                      scheduleItem.id,
                                      "endTime",
                                      value
                                    )
                                  }
                                />
                                <span className="text-slate-400 dark:text-slate-500">
                                  |
                                </span>
                                <span className="text-slate-600 dark:text-slate-400">
                                  Days
                                </span>
                                <div className="flex gap-1">
                                  {daysOfWeek.map(day => (
                                    <Button
                                      key={day}
                                      onClick={() =>
                                        toggleDay(scheduleItem.id, day)
                                      }
                                      variant={
                                        scheduleItem.days.includes(day)
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      className={cn(
                                        "w-5 h-5 p-0 text-xs",
                                        scheduleItem.days.includes(day)
                                          ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                                          : "hover:bg-slate-100 dark:hover:bg-slate-700"
                                      )}
                                    >
                                      {day[0]}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex-1"></div>
                              {schedules.length > 1 && (
                                <Button
                                  onClick={() =>
                                    removeSchedule(scheduleItem.id)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="h-4 w-4 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {useDefaultCalendar && (
                <div className="text-center py-6">
                  <div className="space-y-3">
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 dark:from-blue-400/20 dark:to-indigo-400/20 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                        Using Default Work Calendar
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Your campaign will use the default work calendar
                        settings.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="outline"
          onClick={back}
          className="flex items-center space-x-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Sequence</span>
        </Button>
        <div className="flex flex-col items-end space-y-2">
          {calendarError && (
            <div className="text-sm text-red-600 dark:text-red-400 text-right">
              {calendarError}
            </div>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || isSettingCalendar}
            className="bg-black hover:bg-black/90 text-white px-8"
          >
            {isSettingCalendar ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Setting Calendar...
              </>
            ) : (
              <>
                Continue to Quota
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
