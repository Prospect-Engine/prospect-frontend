/**
 * CONTENT CALENDAR
 * ================
 * Visual content planning and scheduling.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Calendar,
  Plus,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { useState } from "react";

// Days of the week
const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Get current month's calendar data
const getCurrentMonthDays = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = [];

  // Add padding for days before the first day of month
  for (let i = 0; i < startPadding; i++) {
    days.push({ date: null, isCurrentMonth: false });
  }

  // Add days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
      isToday: i === now.getDate(),
    });
  }

  return days;
};

// Stats for the calendar
const stats = [
  {
    title: "Scheduled",
    value: "0",
    icon: Clock,
    color: "bg-amber-500",
  },
  {
    title: "Published",
    value: "0",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  {
    title: "Drafts",
    value: "0",
    icon: FileText,
    color: "bg-slate-500",
  },
  {
    title: "Failed",
    value: "0",
    icon: AlertCircle,
    color: "bg-red-500",
  },
];

// Sample scheduled content (empty for now)
const scheduledContent: Array<{
  id: string;
  title: string;
  date: Date;
  platform: string;
  status: "scheduled" | "published" | "draft" | "failed";
}> = [];

export default function ContentCalendar() {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const calendarDays = getCurrentMonthDays();
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#26A69A] to-[#00796B] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Content Calendar
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Plan Your Content
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Visualize and organize your content schedule. Drag and drop
                    to reschedule posts across all platforms.
                  </p>
                </div>
                <Link href="/marketing/social/compose">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#26A69A] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Schedule Post
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat) => (
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
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Calendar Section */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-foreground">
                    {monthName}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button className="p-1.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="flex items-center bg-black/[0.02] dark:bg-white/[0.04] rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("calendar")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "calendar"
                          ? "bg-white dark:bg-[#3c3c3e] shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "list"
                          ? "bg-white dark:bg-[#3c3c3e] shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Calendar Grid or Empty State */}
              {viewMode === "calendar" ? (
                <div className="p-6">
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground py-2"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[100px] rounded-xl border transition-colors ${
                          day.isCurrentMonth
                            ? day.isToday
                              ? "border-[#26A69A] bg-[#26A69A]/5"
                              : "border-black/[0.04] dark:border-white/[0.04] hover:border-[#26A69A]/50"
                            : "border-transparent bg-black/[0.01] dark:bg-white/[0.01]"
                        }`}
                      >
                        {day.date && (
                          <div className="p-2">
                            <span
                              className={`text-sm font-medium ${
                                day.isToday
                                  ? "text-[#26A69A]"
                                  : day.isCurrentMonth
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {day.date.getDate()}
                            </span>
                            {/* Content indicators would go here */}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* List View Empty State */
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#26A69A]/10 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-[#26A69A]" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No scheduled content
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start planning your content calendar. Schedule posts to see
                    them appear here.
                  </p>
                  <Link href="/marketing/social/compose">
                    <button className="px-6 py-3 bg-[#26A69A] text-white rounded-xl font-medium hover:bg-[#00897B] transition-colors">
                      Schedule Post
                    </button>
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/marketing/social/compose">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-cyan-500/10">
                    <Plus className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Create Post</p>
                    <p className="text-sm text-muted-foreground">
                      Add content to calendar
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/social">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Clock className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">View Queue</p>
                    <p className="text-sm text-muted-foreground">
                      See upcoming posts
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/content">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-teal-500/10">
                    <FileText className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Studio</p>
                    <p className="text-sm text-muted-foreground">
                      Create with AI
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
