/**
 * NEW EVENT TYPE
 * ===============
 * Create a new event type for scheduling.
 */

import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  Check,
} from "lucide-react";
import {
  SchedulingApiService,
  LocationType,
  CreateEventTypeDto,
} from "@/services/schedulingApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";

// Duration options
const durationOptions = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

// Color options
const colorOptions = [
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#6366f1", // Indigo
];

// Location types
const locationTypes = [
  {
    id: "video" as LocationType,
    title: "Video Call",
    description: "Google Meet, Zoom, or Teams",
    icon: Video,
    placeholder: "https://zoom.us/j/...",
  },
  {
    id: "phone" as LocationType,
    title: "Phone Call",
    description: "Direct phone conversation",
    icon: Phone,
    placeholder: "+1 (555) 000-0000",
  },
  {
    id: "in_person" as LocationType,
    title: "In-Person",
    description: "Meet at a physical location",
    icon: MapPin,
    placeholder: "123 Main St, City, State",
  },
  {
    id: "custom" as LocationType,
    title: "Custom",
    description: "Specify your own location",
    icon: Calendar,
    placeholder: "Location details...",
  },
];

export default function NewEventTypePage() {
  const router = useRouter();
  const { type: preselectedType } = router.query;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEventTypeDto>({
    name: "",
    description: "",
    duration: 30,
    color: "#3b82f6",
    location: (preselectedType as LocationType) || "video",
    locationValue: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      ShowShortMessage("Please enter an event name", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, status } = await SchedulingApiService.createEventType(formData);

      if (status >= 200 && status < 300) {
        ShowShortMessage("Event type created successfully!", "success");
        router.push("/sales/appointments");
      }
    } catch (error) {
      ShowShortMessage("Failed to create event type", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activePage="Appointments">
      <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/sales/appointments"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Appointments
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                Create Event Type
              </h1>
              <p className="text-muted-foreground mt-1">
                Set up a new type of meeting that people can book with you
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., 30 Minute Meeting"
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                />
              </div>

              {/* Description */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of this meeting type..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6] resize-none"
                />
              </div>

              {/* Duration */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                <label className="block text-sm font-medium text-foreground mb-4">
                  Duration
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {durationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, duration: option.value })
                      }
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        formData.duration === option.value
                          ? "bg-[#3b82f6] text-white"
                          : "bg-black/[0.04] dark:bg-white/[0.04] text-foreground hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Type */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                <label className="block text-sm font-medium text-foreground mb-4">
                  Location
                </label>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {locationTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          location: type.id,
                          locationValue: "",
                        })
                      }
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all text-left ${
                        formData.location === type.id
                          ? "border-[#3b82f6] bg-[#3b82f6]/5"
                          : "border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16]"
                      }`}
                    >
                      <type.icon
                        className={`h-5 w-5 mt-0.5 ${
                          formData.location === type.id
                            ? "text-[#3b82f6]"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <p
                          className={`font-medium ${
                            formData.location === type.id
                              ? "text-[#3b82f6]"
                              : "text-foreground"
                          }`}
                        >
                          {type.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      {formData.location === type.id && (
                        <Check className="h-5 w-5 text-[#3b82f6] ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Location Value Input */}
                <input
                  type="text"
                  value={formData.locationValue}
                  onChange={(e) =>
                    setFormData({ ...formData, locationValue: e.target.value })
                  }
                  placeholder={
                    locationTypes.find((t) => t.id === formData.location)
                      ?.placeholder
                  }
                  className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/20 focus:border-[#3b82f6]"
                />
              </div>

              {/* Color */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                <label className="block text-sm font-medium text-foreground mb-4">
                  Color
                </label>
                <div className="flex gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        formData.color === color
                          ? "ring-2 ring-offset-2 ring-[#3b82f6]"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && (
                        <Check className="h-5 w-5 text-white mx-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Link href="/sales/appointments" className="flex-1">
                  <button
                    type="button"
                    className="w-full px-6 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] text-foreground font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Cancel
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={loading || !formData.name.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-[#3b82f6] text-white font-medium hover:bg-[#2563eb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-5 w-5" />
                      Create Event Type
                    </>
                  )}
                </button>
              </div>
            </form>
      </div>
    </AppLayout>
  );
}
