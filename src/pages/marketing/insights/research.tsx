/**
 * USER RESEARCH
 * =============
 * Conduct user research studies and gather insights.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Search,
  Plus,
  ArrowRight,
  Users,
  MessageCircle,
  Sparkles,
  Video,
  Eye,
  Target,
  Brain,
  Lightbulb,
  ClipboardList,
} from "lucide-react";

// Research methods
const researchMethods = [
  {
    id: "interviews",
    title: "User Interviews",
    description: "Conduct 1-on-1 interviews with users",
    icon: Video,
    color: "bg-violet-500",
    href: "/marketing/insights/research/create?type=interview",
  },
  {
    id: "usability",
    title: "Usability Testing",
    description: "Test your product with real users",
    icon: Eye,
    color: "bg-blue-500",
    href: "/marketing/insights/research/create?type=usability",
  },
  {
    id: "focus-group",
    title: "Focus Groups",
    description: "Moderate group discussions",
    icon: Users,
    color: "bg-emerald-500",
    href: "/marketing/insights/research/create?type=focus-group",
  },
  {
    id: "card-sorting",
    title: "Card Sorting",
    description: "Understand user mental models",
    icon: Target,
    color: "bg-amber-500",
    href: "/marketing/insights/research/create?type=card-sorting",
  },
];

// Stats
const stats = [
  {
    title: "Active Studies",
    value: "0",
    icon: Search,
    color: "bg-violet-500",
  },
  {
    title: "Sessions Completed",
    value: "0",
    icon: Video,
    color: "bg-blue-500",
  },
  {
    title: "Participants",
    value: "0",
    icon: Users,
    color: "bg-emerald-500",
  },
  {
    title: "Insights Found",
    value: "0",
    icon: Lightbulb,
    color: "bg-amber-500",
  },
];

// Recent studies (empty state)
const recentStudies: Array<{
  id: string;
  name: string;
  type: string;
  participants: number;
  sessions: number;
  status: "active" | "draft" | "completed";
  createdAt: string;
}> = [];

export default function ResearchPage() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      User Research
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Research Studies
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Conduct user research to understand your customers better.
                    Run interviews, usability tests, and gather actionable insights.
                  </p>
                </div>
                <Link href="/marketing/insights/research/create">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#8b5cf6] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    New Study
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

            {/* Research Methods */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Research Methods
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {researchMethods.map((method) => (
                  <Link key={method.id} href={method.href}>
                    <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className={`p-3 rounded-xl ${method.color} w-fit mb-4`}>
                        <method.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        {method.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex-1">
                        {method.description}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Studies */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Your Studies
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage research studies and view sessions
                  </p>
                </div>
              </div>

              {recentStudies.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-violet-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No studies yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start understanding your users by creating your first research study.
                    Conduct interviews, usability tests, or focus groups.
                  </p>
                  <Link href="/marketing/insights/research/create">
                    <button className="px-6 py-3 bg-[#8b5cf6] text-white rounded-xl font-medium hover:bg-[#7c3aed] transition-colors">
                      Create Study
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {recentStudies.map((study) => (
                    <div
                      key={study.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <Search className="h-5 w-5 text-violet-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {study.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {study.participants} participants
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {study.sessions} sessions
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 rounded-full uppercase">
                                {study.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            study.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : study.status === "draft"
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                          }`}
                        >
                          {study.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/marketing/insights/sessions">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      View all research sessions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights/surveys">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Surveys</p>
                    <p className="text-sm text-muted-foreground">
                      Collect feedback at scale
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Sparkles className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Insights Hub</p>
                    <p className="text-sm text-muted-foreground">
                      Back to overview
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
