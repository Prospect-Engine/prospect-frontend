"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Custom styles for React-DatePicker to match project design
const datePickerStyles = `
  .react-datepicker {
    border: 1px solid #e5e7eb !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
    font-family: inherit !important;
  }
  
  .react-datepicker__header {
    background-color: #f9fafb !important;
    border-bottom: 1px solid #e5e7eb !important;
    border-radius: 8px 8px 0 0 !important;
    padding: 8px 0 !important;
  }
  
  .react-datepicker__current-month {
    color: #374151 !important;
    font-size: 14px !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__time-container {
    border-left: none !important;
  }
  
  .react-datepicker__time {
    background-color: white !important;
  }
  
  .react-datepicker__time-list {
    max-height: 200px !important;
    overflow-y: auto !important;
    scrollbar-width: none !important; /* Firefox */
    -ms-overflow-style: none !important; /* Internet Explorer 10+ */
  }
  
  .react-datepicker__time-list::-webkit-scrollbar {
    display: none !important; /* WebKit */
  }
  
  
  .react-datepicker__time-list-item {
    padding: 8px 16px !important;
    color: #374151 !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
  }
  
  .react-datepicker__time-list-item:hover {
    background-color: #f3f4f6 !important;
  }
  
  .react-datepicker__time-list-item--selected {
    background-color: #3b82f6 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__time-list-item--selected:hover {
    background-color: #2563eb !important;
  }
  
  /* Dark mode styles */
  .dark .react-datepicker {
    background-color: #1f2937 !important;
    border-color: #4b5563 !important;
  }
  
  .dark .react-datepicker__header {
    background-color: #374151 !important;
    border-bottom-color: #4b5563 !important;
  }
  
  .dark .react-datepicker__current-month {
    color: #f9fafb !important;
  }
  
  .dark .react-datepicker__time {
    background-color: #1f2937 !important;
  }
  
  .dark .react-datepicker__time-list-item {
    color: #d1d5db !important;
  }
  
  .dark .react-datepicker__time-list-item:hover {
    background-color: #374151 !important;
  }
  
  .dark .react-datepicker__time-list-item--selected {
    background-color: #3b82f6 !important;
    color: white !important;
  }

  .react-datepicker__current-month,
  .react-datepicker-time__header,
  .react-datepicker-year-header {
    color: #374151 !important;
  }

  .dark .react-datepicker__current-month,
  .dark .react-datepicker-time__header,
  .dark .react-datepicker-year-header {
    color: #fff !important;
  }
`;

import {
  Calendar,
  Clock,
  Plus,
  ChevronDown,
  X,
  Check,
  Target,
  Save,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { countryCodeMap } from "@/lib/country";
import AppLayout from "@/components/layout/AppLayout";
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
const fetchWorkCalendar = async () => {
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
        toast.error(
          "AUTH: Unauthorized to fetch Work Calendar. Please re-authenticate."
        );
        return null;
      }
      toast.error(
        `API: Failed to fetch Work Calendar (${response.status}). ${serverMessage}`
      );
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error("Error fetching work calendar");
    return null;
  }
};

const saveWorkCalendar = async (workCalendarData: any) => {
  try {
    const response = await fetch("/api/workCalender/addDefault", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        work_calenders: workCalendarData,
      }),
    });

    if (!response.ok) {
      toast.error(`Save work calendar API failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error("Error saving work calendar");
    return null;
  }
};

// Quota API functions
type EngineQuota = {
  connection_request_limit?: number;
  message_limit?: number;
  profile_view_limit?: number;
  skill_endorse_limit?: number;
  like_limit?: number;
  profile_follow_limit?: number;
  inmail_limit?: number;
};

const mapEngineToUiQuota = (q: EngineQuota) => ({
  conn: q.connection_request_limit ?? 0,
  msg: q.message_limit ?? 0,
  views: q.profile_view_limit ?? 0,
  endorse: q.skill_endorse_limit ?? 0,
  likes: q.like_limit ?? 0,
  follows: q.profile_follow_limit ?? 0,
  inmail: q.inmail_limit ?? 0,
});

// Currently unused; kept for future save integration
// mapUiToEngineQuota available when we add quota save flow

const fetchQuotaList = async () => {
  const resp = await fetch("/api/settings/getQuotaList", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (resp.status === 401 || resp.status === 403) {
    return null;
  }
  if (!resp.ok) {
    toast.error(`Quota list failed: ${resp.status}`);
    return null;
  }
  return resp.json();
};

const fetchQuotaStatus = async () => {
  const resp = await fetch("/api/settings/getQuotaStatus", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (resp.status === 401 || resp.status === 403) {
    return null;
  }
  if (!resp.ok) {
    toast.error(`Quota status failed: ${resp.status}`);
    return null;
  }
  return resp.json();
};

// Currently unused; kept for future save integration
// setQuotaSettings will be used when enabling quota persistence editing from UI

const CampaignSettingsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingCalendar, setIsSavingCalendar] = useState(false);
  const [isSavingQuota, setIsSavingQuota] = useState(false);
  const [isLoadingQuotas, setIsLoadingQuotas] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Inject custom styles in useEffect to avoid hydration mismatch
  useEffect(() => {
    if (!isClient) return;

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = datePickerStyles;
    document.head.appendChild(styleSheet);

    return () => {
      // Cleanup: remove the style sheet when component unmounts
      if (styleSheet.parentNode) {
        styleSheet.parentNode.removeChild(styleSheet);
      }
    };
  }, [isClient]);
  const [error, setError] = useState<string | null>(null);
  const [, setHasExistingCalendar] = useState(false);

  const [schedules, setSchedules] = useState([
    {
      id: 1,
      startTime: "08:30",
      endTime: "17:30",
      days: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
  ]);
  const [selectedCountry, setSelectedCountry] = useState("us");
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [currentTime, setCurrentTime] = useState(new Date());
  const hasInitialized = useRef(false);

  // Global quota limits
  const [quotaLimits, setQuotaLimits] = useState({
    conn: 30,
    msg: 100,
    views: 60,
    endorse: 30,
    likes: 100,
    follows: 100,
    inmail: 20,
  });
  const [usedQuota, setUsedQuota] = useState({
    conn: 0,
    msg: 0,
    views: 0,
    endorse: 0,
    likes: 0,
    follows: 0,
    inmail: 0,
  });

  // Individual campaign quotas
  const [quotas] = useState({
    asia: {
      conn: 20,
      msg: 35,
      views: 22,
      endorse: 25,
      likes: 25,
      follows: 16,
      inmail: 4,
    },
    mixEurope: {
      conn: 5,
      msg: 15,
      views: 7,
      endorse: 5,
      likes: 21,
      follows: 7,
      inmail: 2,
    },
    sweden: {
      conn: 5,
      msg: 50,
      views: 7,
      endorse: 5,
      likes: 5,
      follows: 7,
      inmail: 1,
    },
  });

  // Dynamic quotas from backend (full campaign list)
  type UiQuota = {
    conn: number;
    msg: number;
    views: number;
    endorse: number;
    likes: number;
    follows: number;
    inmail: number;
  };
  type CampaignQuotaRow = { id?: string; name: string; limits: UiQuota };
  const [campaignQuotas, setCampaignQuotas] = useState<CampaignQuotaRow[]>([]);

  // Load quotas from backend on mount
  useEffect(() => {
    const loadQuotas = async () => {
      setIsLoadingQuotas(true);
      try {
        let data = await fetchQuotaList();
        if (!data) {
          data = await fetchQuotaStatus();
        }
        if (!data) {
          // Unauthorized; keep defaults silently
          setIsLoadingQuotas(false);
          return;
        }
        const {
          available_daily_engine_quota,
          used_daily_engine_quota,
          campaign_quotas,
        } = data as any;

        if (available_daily_engine_quota) {
          setQuotaLimits(mapEngineToUiQuota(available_daily_engine_quota));
        }
        if (used_daily_engine_quota) {
          setUsedQuota(mapEngineToUiQuota(used_daily_engine_quota));
        }

        // If backend returns campaign-wise quotas, build dynamic rows
        if (Array.isArray(campaign_quotas) && campaign_quotas.length > 0) {
          const rows: CampaignQuotaRow[] = campaign_quotas.map((c: any) => ({
            id: c?.id,
            name: c?.name || "",
            limits: mapEngineToUiQuota(c?.daily_engine_quota || {}),
          }));
          setCampaignQuotas(rows);
        }
      } catch (e) {
        console.error("Failed to load quotas:", e);
      } finally {
        setIsLoadingQuotas(false);
      }
    };
    loadQuotas();
  }, []);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Generate time options for dropdown (15-minute intervals)
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const displayTime = new Date(
          2000,
          0,
          1,
          hour,
          minute
        ).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        });
        times.push({ value: timeString, label: displayTime });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Helper function to convert 24-hour format to 12-hour format for display
  const formatTimeForDisplay = (time24: string) => {
    const [hour, minute] = time24.split(":");
    const hour24 = parseInt(hour);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minute} ${period}`;
  };

  // Helper function to convert 12-hour format to 24-hour format for storage
  const formatTimeForStorage = (time12: string) => {
    const [time, period] = time12.split(" ");
    const [hour, minute] = time.split(":");
    const hour24 =
      period === "PM" && hour !== "12"
        ? parseInt(hour) + 12
        : period === "AM" && hour === "12"
          ? 0
          : parseInt(hour);
    return `${hour24.toString().padStart(2, "0")}:${minute}`;
  };

  // Custom Input Component for React-DatePicker
  const CustomTimeInput = React.forwardRef<HTMLButtonElement, any>(
    ({ value, onClick, placeholder }, ref) => (
      <button
        ref={ref}
        onClick={onClick}
        className="h-6 text-xs w-20 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-1"
      >
        <Clock className="w-3 h-3" />
        {value || placeholder}
      </button>
    )
  );

  CustomTimeInput.displayName = "CustomTimeInput";

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
    if (!selectedCountry) return [];
    const timezones = getTimezonesForCountry(selectedCountry);
    return timezones.filter(isValidTimezone);
  }, [selectedCountry]);

  // Get current time for a specific timezone
  const getCurrentTimeForTimezone = (timezone: string) => {
    try {
      // Validate timezone before using it
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
      // Return timezone name without time if there's an error
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
  const groupSchedulesByTimeRange = (schedules: any[]) => {
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
      grouped.get(timeKey).days.push(schedule.days[0]);
    });

    return Array.from(grouped.values()).map((schedule, index) => ({
      ...schedule,
      id: index + 1,
      days: schedule.days.map((day: string) => {
        // Convert full day names to abbreviated format
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

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Reset timezone when country changes: only adjust if current timezone is invalid for new country
  useEffect(() => {
    if (selectedCountry) {
      const availableTimezones = getAvailableTimezones();
      if (
        availableTimezones.length > 0 &&
        !availableTimezones.includes(selectedTimezone as any)
      ) {
        setSelectedTimezone(availableTimezones[0]);
      }
    }
  }, [selectedCountry, selectedTimezone, getAvailableTimezones]);

  // Load existing work calendar data on component mount (only once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    const loadWorkCalendar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchWorkCalendar();

        // Check if we have existing calendar data
        if (data && data.work_calender) {
          const calendarData = data.work_calender;

          // Update state with existing data
          if (calendarData.country_code) {
            // Find the country name that matches the country code
            const countryEntry = Object.entries(countryCodeMap).find(
              ([, code]) => code === calendarData.country_code
            );
            if (countryEntry) {
              setSelectedCountry(countryEntry[1].toLowerCase());
            } else {
              // Fallback to the country code if not found in mapping
              setSelectedCountry(calendarData.country_code.toLowerCase());
            }
          }
          if (calendarData.time_zone) {
            // Prefer backend country for initial timezone resolution
            const initialCountry = (
              calendarData.country_code || ""
            ).toLowerCase();
            const availableTimezones = initialCountry
              ? getTimezonesForCountry(initialCountry).filter(isValidTimezone)
              : [];

            if (availableTimezones.includes(calendarData.time_zone)) {
              setSelectedTimezone(calendarData.time_zone);
            } else {
              // Use the first available timezone for the country
              setSelectedTimezone(
                availableTimezones[0] || calendarData.time_zone
              );
            }
          }

          // Convert work_ranges to schedules format
          if (
            calendarData.work_ranges &&
            Array.isArray(calendarData.work_ranges)
          ) {
            const convertedSchedules = calendarData.work_ranges.map(
              (range: any, index: number) => ({
                id: range.id || index + 1,
                startTime: range.start || "09:00",
                endTime: range.end || "18:00",
                days: [range.day_name?.toUpperCase() || "MONDAY"],
              })
            );

            // Group schedules by time ranges
            const groupedSchedules =
              groupSchedulesByTimeRange(convertedSchedules);
            setSchedules(groupedSchedules);
          }

          setHasExistingCalendar(true);
          setShowForm(true);
        }
      } catch (error) {
        setError("Failed to load work calendar data");
        // Don't show form if there's an error loading existing data
        setHasExistingCalendar(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkCalendar();
  }, []);

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

  const handleSaveCalendar = async () => {
    setIsSavingCalendar(true);
    setError(null);

    try {
      // Convert schedules to work_ranges format
      const workRanges = schedules.flatMap(schedule =>
        schedule.days.map(day => {
          // Convert abbreviated day names back to full names
          const dayMap: { [key: string]: string } = {
            Sun: "SUNDAY",
            Mon: "MONDAY",
            Tue: "TUESDAY",
            Wed: "WEDNESDAY",
            Thu: "THURSDAY",
            Fri: "FRIDAY",
            Sat: "SATURDAY",
          };

          return {
            start: schedule.startTime,
            end: schedule.endTime,
            day_name: dayMap[day] || day.toUpperCase(),
          };
        })
      );

      // Convert selected country back to country code
      const countryCode =
        countryCodeMap[
          Object.keys(countryCodeMap).find(
            countryName =>
              countryCodeMap[countryName].toLowerCase() === selectedCountry
          ) || ""
        ] || selectedCountry.toUpperCase();

      const workCalendarData = {
        name: "Default",
        country_code: countryCode,
        time_zone: selectedTimezone,
        work_ranges: workRanges,
      };

      await saveWorkCalendar(workCalendarData);

      setIsSuccess(true);
      setHasExistingCalendar(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      setError("Failed to save work calendar. Please try again.");
    } finally {
      setIsSavingCalendar(false);
    }
  };

  const handleSaveQuota = async () => {
    setIsSavingQuota(true);
    setError(null);

    try {
      const campaign_quotas = (
        campaignQuotas.length > 0 ? campaignQuotas : []
      ).map(row => ({
        id: row.id,
        name: row.name,
        daily_engine_quota: {
          connection_request_limit: row.limits.conn,
          message_limit: row.limits.msg,
          profile_view_limit: row.limits.views,
          skill_endorse_limit: row.limits.endorse,
          like_limit: row.limits.likes,
          profile_follow_limit: row.limits.follows,
          inmail_limit: row.limits.inmail,
          decision_check_limit: 0,
          connection_by_email_limit: 0,
        },
      }));

      if (campaign_quotas.length > 0) {
        await fetch("/api/settings/setQuota", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ campaign_quotas }),
        });
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      setError("Failed to save quotas. Please try again.");
    } finally {
      setIsSavingQuota(false);
    }
  };

  // legacy updater removed (dynamic rows handle updates directly)

  const getTotalQuota = (field: string) => {
    if (campaignQuotas.length > 0) {
      return campaignQuotas.reduce(
        (sum, row) => sum + (row.limits as any)[field],
        0
      );
    }
    return Object.values(quotas).reduce(
      (sum, campaign) =>
        sum + (campaign[field as keyof typeof campaign] as number),
      0
    );
  };

  const isQuotaLimitExceeded = (field: string) => {
    // Don't show exceeded state while loading quotas
    if (isLoadingQuotas) return false;
    const total = getTotalQuota(field);
    const limit = quotaLimits[field as keyof typeof quotaLimits];
    return total > limit;
  };

  const hasAnyQuotaExceeded = () => {
    const fields = [
      "conn",
      "msg",
      "views",
      "endorse",
      "likes",
      "follows",
      "inmail",
    ];
    return fields.some(field => isQuotaLimitExceeded(field));
  };

  // const updateQuotaLimit = (field: string, value: string) => {
  //   const numValue = Math.max(0, parseInt(value) || 0);
  //   setQuotaLimits(prev => ({
  //     ...prev,
  //     [field]: numValue,
  //   }));
  // };

  return (
    <AppLayout activePage="Outreach">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          {isSuccess && (
            <Badge
              variant="secondary"
              className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800"
            >
              <Check className="w-3 h-3 mr-1" />
              Settings saved
            </Badge>
          )}
        </div>

        {/* Combined Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Work Calendar Section */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm lg:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-4 h-4 text-blue-500" />
                Work Calendar
              </CardTitle>
              <CardDescription className="text-sm">
                Configure your timezone and working hours for optimal campaign
                scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="text-center py-6">
                  <div className="space-y-3">
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        Loading Work Calendar...
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Please wait while we load your calendar settings.
                      </p>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-6">
                  <div className="space-y-3">
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {error.startsWith("AUTH:")
                          ? "Authentication Required"
                          : "Error Loading Calendar"}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {error.startsWith("AUTH:")
                          ? "We couldn't verify your session. Please sign in again to load your existing calendar. You can still create a new calendar below."
                          : error}
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowForm(true)}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create New Calendar
                    </Button>
                  </div>
                </div>
              ) : !showForm ? (
                <div className="text-center py-6">
                  <div className="space-y-3">
                    <div className="mx-auto w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        No Work Calendar Set
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Create your first work calendar to define when your
                        campaigns should be active.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowForm(true)}
                      size="sm"
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Calendar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={selectedCountry}
                          onChange={e => setSelectedCountry(e.target.value)}
                          className="w-full h-8 px-2 py-1 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
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
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Timezone
                      </label>
                      <div className="relative">
                        <select
                          value={selectedTimezone}
                          onChange={e => setSelectedTimezone(e.target.value)}
                          className="w-full h-8 px-2 py-1 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none"
                        >
                          {getAvailableTimezones().length > 0 ? (
                            getAvailableTimezones().map((timezone: string) => (
                              <option key={timezone} value={timezone}>
                                {formatTimezoneDisplay(timezone)}
                              </option>
                            ))
                          ) : (
                            <option value={selectedTimezone}>
                              {formatTimezoneDisplay(selectedTimezone)}
                            </option>
                          )}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Work Schedules
                      </h4>
                      <Button
                        onClick={addNewSchedule}
                        variant="outline"
                        size="sm"
                        className="gap-1 h-7"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    </div>

                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {schedules.map((schedule, index) => (
                        <Card
                          key={schedule.id}
                          className="bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"
                        >
                          <CardContent className="pl-4 pr-2 pt-0 pb-0">
                            <div className="flex items-center text-xs">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Schedule {index + 1}
                              </span>
                              <div className="flex-1"></div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Start
                                </span>
                                {isClient ? (
                                  <DatePicker
                                    selected={
                                      new Date(
                                        `2000-01-01T${schedule.startTime}`
                                      )
                                    }
                                    onChange={(date: Date | null) => {
                                      if (date) {
                                        const timeString = date
                                          .toTimeString()
                                          .slice(0, 5);
                                        updateSchedule(
                                          schedule.id,
                                          "startTime",
                                          timeString
                                        );
                                      }
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    dateFormat="h:mm aa"
                                    timeCaption="Time"
                                    customInput={<CustomTimeInput />}
                                    popperPlacement="bottom-start"
                                  />
                                ) : (
                                  <button className="h-6 text-xs w-20 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {schedule.startTime
                                      ? new Date(
                                          `2000-01-01T${schedule.startTime}`
                                        ).toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "Start"}
                                  </button>
                                )}
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  End
                                </span>
                                {isClient ? (
                                  <DatePicker
                                    selected={
                                      new Date(`2000-01-01T${schedule.endTime}`)
                                    }
                                    onChange={(date: Date | null) => {
                                      if (date) {
                                        const timeString = date
                                          .toTimeString()
                                          .slice(0, 5);
                                        updateSchedule(
                                          schedule.id,
                                          "endTime",
                                          timeString
                                        );
                                      }
                                    }}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    dateFormat="h:mm aa"
                                    timeCaption="Time"
                                    customInput={<CustomTimeInput />}
                                    popperPlacement="bottom-start"
                                  />
                                ) : (
                                  <button className="h-6 text-xs w-20 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 flex items-center justify-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {schedule.endTime
                                      ? new Date(
                                          `2000-01-01T${schedule.endTime}`
                                        ).toLocaleTimeString("en-US", {
                                          hour: "numeric",
                                          minute: "2-digit",
                                          hour12: true,
                                        })
                                      : "End"}
                                  </button>
                                )}
                                <span className="text-gray-400">|</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  Days
                                </span>
                                <div className="flex gap-1">
                                  {daysOfWeek.map(day => (
                                    <Button
                                      key={day}
                                      onClick={() =>
                                        toggleDay(schedule.id, day)
                                      }
                                      variant={
                                        schedule.days.includes(day)
                                          ? "default"
                                          : "outline"
                                      }
                                      size="sm"
                                      className={cn(
                                        "w-5 h-5 p-0 text-xs",
                                        schedule.days.includes(day)
                                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
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
                                  onClick={() => removeSchedule(schedule.id)}
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

                  <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={handleSaveCalendar}
                      size="sm"
                      disabled={isSavingCalendar}
                      className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-sm gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSavingCalendar ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Save className="w-3 h-3" />
                      )}
                      {isSavingCalendar ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quota Management Section */}
          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm lg:col-span-3">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    Quota Management
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Set daily limits for each campaign activity
                  </CardDescription>
                </div>
                <Button
                  onClick={handleSaveQuota}
                  size="sm"
                  disabled={hasAnyQuotaExceeded()}
                  className={cn(
                    "shadow-sm gap-1",
                    hasAnyQuotaExceeded()
                      ? "bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-50 dark:hover:bg-gray-100 text-white dark:text-gray-900"
                  )}
                >
                  {isSavingQuota ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  {isSavingQuota ? "Saving..." : "Save"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto flex justify-center">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Connections
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Messages
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Profile Views
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Endorsements
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Likes
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Follows
                      </th>
                      <th className="px-2 py-1 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        InMail
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {campaignQuotas.map((row, idx) => (
                      <tr
                        key={`${row.id || row.name}-${idx}`}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-2 py-1 font-medium text-gray-900 dark:text-white text-xs">
                          {row.name}
                        </td>
                        {(
                          [
                            "conn",
                            "msg",
                            "views",
                            "endorse",
                            "likes",
                            "follows",
                            "inmail",
                          ] as const
                        ).map(field => (
                          <td key={field} className="px-2 py-1">
                            <Input
                              type="number"
                              min="0"
                              value={(row.limits as any)[field]}
                              onChange={e => {
                                const val = Math.max(
                                  0,
                                  parseInt(e.target.value) || 0
                                );
                                setCampaignQuotas(prev =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? {
                                          ...r,
                                          limits: { ...r.limits, [field]: val },
                                        }
                                      : r
                                  )
                                );
                              }}
                              className="w-16 h-6 text-center text-xs"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}

                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-t-2 border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-1 font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 text-xs">
                        Summary
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("conn")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.conn}/{quotaLimits.conn}
                              {isQuotaLimitExceeded("conn") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("msg")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.msg}/{quotaLimits.msg}
                              {isQuotaLimitExceeded("msg") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("views")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.views}/{quotaLimits.views}
                              {isQuotaLimitExceeded("views") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("endorse")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.endorse}/{quotaLimits.endorse}
                              {isQuotaLimitExceeded("endorse") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("likes")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.likes}/{quotaLimits.likes}
                              {isQuotaLimitExceeded("likes") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("follows")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-3">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.follows}/{quotaLimits.follows}
                              {isQuotaLimitExceeded("follows") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td
                        className={cn(
                          "px-1 py-1 font-semibold text-xs",
                          isQuotaLimitExceeded("inmail")
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-600 dark:text-gray-400"
                        )}
                      >
                        <div className="flex items-center gap-1 ml-4">
                          {isLoadingQuotas ? (
                            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                          ) : (
                            <>
                              {usedQuota.inmail}/{quotaLimits.inmail}
                              {isQuotaLimitExceeded("inmail") && (
                                <AlertTriangle className="w-2 h-2" />
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Info Section */}
              <div className="p-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-start gap-2">
                  <Info className="w-3 h-3 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <p className="font-medium text-gray-900 dark:text-gray-200 mb-1">
                      Tips
                    </p>
                    <ul className="space-y-0.5 text-xs">
                      <li>
                        • Set quota limits first, then individual campaign
                        limits
                      </li>
                      <li>
                        • Total campaign quotas cannot exceed quota limits
                      </li>
                      <li>• Red indicators show exceeded quota limits</li>
                      <li>
                        • Save button is disabled when limits are exceeded
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default CampaignSettingsPage;
