/**
 * INSIGHTS HUB
 * ============
 * Combined dashboard for customer feedback and user research.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Lightbulb,
  ArrowRight,
  ClipboardList,
  Inbox,
  Search,
  MessageCircle,
  Users,
  TrendingUp,
  PieChart,
  Video,
  ThumbsUp,
  Star,
  Brain,
  BarChart3,
} from "lucide-react";

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
    title: "Research Studies",
    value: "0",
    icon: Search,
    color: "bg-violet-500",
  },
  {
    title: "Insights Found",
    value: "0",
    icon: Lightbulb,
    color: "bg-emerald-500",
  },
];

// Feedback features
const feedbackFeatures = [
  {
    id: "nps",
    title: "NPS Survey",
    description: "Measure customer loyalty",
    icon: TrendingUp,
    color: "bg-emerald-500",
  },
  {
    id: "csat",
    title: "CSAT Survey",
    description: "Customer satisfaction",
    icon: ThumbsUp,
    color: "bg-blue-500",
  },
  {
    id: "product",
    title: "Product Feedback",
    description: "Feature requests",
    icon: Star,
    color: "bg-amber-500",
  },
];

// Research features
const researchFeatures = [
  {
    id: "interviews",
    title: "User Interviews",
    description: "1-on-1 conversations",
    icon: Video,
    color: "bg-violet-500",
  },
  {
    id: "usability",
    title: "Usability Testing",
    description: "Test with real users",
    icon: Users,
    color: "bg-pink-500",
  },
  {
    id: "analysis",
    title: "AI Analysis",
    description: "Auto-generated insights",
    icon: Brain,
    color: "bg-cyan-500",
  },
];

export default function InsightsPage() {
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
                    <Lightbulb className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Insights Hub
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Customer Insights
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Collect feedback, conduct research, and discover actionable
                    insights about your customers.
                  </p>
                </div>
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

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Feedback Section */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10">
                      <ClipboardList className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Feedback & Surveys
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Collect customer feedback at scale
                      </p>
                    </div>
                  </div>
                  <Link href="/marketing/insights/surveys">
                    <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                      View All
                    </button>
                  </Link>
                </div>
                <div className="p-6 space-y-3">
                  {feedbackFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className={`p-2.5 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Research Section */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-violet-500/10">
                      <Search className="h-5 w-5 text-violet-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        User Research
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Conduct qualitative research studies
                      </p>
                    </div>
                  </div>
                  <Link href="/marketing/insights/research">
                    <button className="text-sm text-violet-600 hover:text-violet-700 font-medium">
                      View All
                    </button>
                  </Link>
                </div>
                <div className="p-6 space-y-3">
                  {researchFeatures.map((feature) => (
                    <div
                      key={feature.id}
                      className="flex items-center gap-4 p-4 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className={`p-2.5 rounded-lg ${feature.color}`}>
                        <feature.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/marketing/insights/surveys">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <ClipboardList className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Surveys</p>
                    <p className="text-sm text-muted-foreground">Create surveys</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights/responses">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Inbox className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Responses</p>
                    <p className="text-sm text-muted-foreground">View submissions</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights/research">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-violet-500/10">
                    <Search className="h-5 w-5 text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Research</p>
                    <p className="text-sm text-muted-foreground">Run studies</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/insights/sessions">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <MessageCircle className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Sessions</p>
                    <p className="text-sm text-muted-foreground">View recordings</p>
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
