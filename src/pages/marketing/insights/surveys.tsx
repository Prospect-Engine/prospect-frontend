/**
 * SURVEYS
 * =======
 * Collect customer feedback and run surveys.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  ArrowRight,
  Inbox,
  BarChart3,
  Users,
  Star,
  ThumbsUp,
  FileQuestion,
  PieChart,
  TrendingUp,
} from "lucide-react";

// Survey types
const surveyTypes = [
  {
    id: "nps",
    title: "NPS Survey",
    description: "Measure customer loyalty with Net Promoter Score",
    icon: TrendingUp,
    color: "bg-emerald-500",
    href: "/marketing/insights/surveys/create?type=nps",
  },
  {
    id: "csat",
    title: "CSAT Survey",
    description: "Customer satisfaction after interactions",
    icon: ThumbsUp,
    color: "bg-blue-500",
    href: "/marketing/insights/surveys/create?type=csat",
  },
  {
    id: "product",
    title: "Product Feedback",
    description: "Gather feature requests and improvements",
    icon: Star,
    color: "bg-amber-500",
    href: "/marketing/insights/surveys/create?type=product",
  },
  {
    id: "custom",
    title: "Custom Survey",
    description: "Build your own survey from scratch",
    icon: FileQuestion,
    color: "bg-purple-500",
    href: "/marketing/insights/surveys/create?type=custom",
  },
];

// Stats
const stats = [
  {
    title: "Active Surveys",
    value: "0",
    icon: ClipboardList,
    color: "bg-amber-500",
  },
  {
    title: "Total Responses",
    value: "0",
    icon: Inbox,
    color: "bg-blue-500",
  },
  {
    title: "Avg. NPS Score",
    value: "-",
    icon: TrendingUp,
    color: "bg-emerald-500",
  },
  {
    title: "Response Rate",
    value: "0%",
    icon: PieChart,
    color: "bg-purple-500",
  },
];

// Recent surveys (empty state)
const recentSurveys: Array<{
  id: string;
  name: string;
  type: string;
  responses: number;
  status: "active" | "draft" | "closed";
  createdAt: string;
}> = [];

export default function SurveysPage() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#f59e0b] to-[#d97706] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Surveys
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Customer Surveys
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Collect valuable insights from your customers with NPS surveys,
                    satisfaction polls, and custom feedback forms.
                  </p>
                </div>
                <Link href="/marketing/insights/surveys/create">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#f59e0b] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Create Survey
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

            {/* Survey Types */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Create Survey
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {surveyTypes.map((type) => (
                  <Link key={type.id} href={type.href}>
                    <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className={`p-3 rounded-xl ${type.color} w-fit mb-4`}>
                        <type.icon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        {type.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex-1">
                        {type.description}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Surveys */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Your Surveys
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage and view survey responses
                  </p>
                </div>
              </div>

              {recentSurveys.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    <ClipboardList className="h-8 w-8 text-amber-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No surveys yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start collecting customer feedback by creating your first survey.
                    Choose from NPS, CSAT, or custom survey templates.
                  </p>
                  <Link href="/marketing/insights/surveys/create">
                    <button className="px-6 py-3 bg-[#f59e0b] text-white rounded-xl font-medium hover:bg-[#d97706] transition-colors">
                      Create Survey
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {recentSurveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <ClipboardList className="h-5 w-5 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {survey.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {survey.responses} responses
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 rounded-full uppercase">
                                {survey.type}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            survey.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : survey.status === "draft"
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
                              : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                          }`}
                        >
                          {survey.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <Link href="/marketing/insights/responses">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Inbox className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">View Responses</p>
                    <p className="text-sm text-muted-foreground">
                      All survey submissions
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights/research">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-violet-500/10">
                    <Users className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">User Research</p>
                    <p className="text-sm text-muted-foreground">
                      Conduct research studies
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
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
