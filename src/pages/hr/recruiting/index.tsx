/**
 * RECRUITING DASHBOARD
 * ====================
 * AI-powered candidate screening and interviews.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Users,
  Plus,
  ArrowRight,
  Briefcase,
  UserCheck,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Star,
  Clock,
  MapPin,
} from "lucide-react";

// Sample jobs (empty state for now)
const jobs: Array<{
  id: string;
  title: string;
  department: string;
  location: string;
  status: "active" | "paused" | "closed";
  applicants: number;
  shortlisted: number;
  hired: number;
  createdAt: string;
}> = [];

// Stats for the dashboard
const stats = [
  {
    title: "Open Positions",
    value: "0",
    icon: Briefcase,
    color: "bg-blue-500",
  },
  {
    title: "Total Applicants",
    value: "0",
    icon: Users,
    color: "bg-indigo-500",
  },
  {
    title: "Shortlisted",
    value: "0",
    icon: UserCheck,
    color: "bg-green-500",
  },
  {
    title: "Interviews",
    value: "0",
    icon: Calendar,
    color: "bg-purple-500",
  },
];

export default function RecruitingDashboard() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#007aff] to-[#0051a8] p-8 md:p-10">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-white/80" />
                  <span className="text-sm font-medium text-white/80">
                    Recruiting
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  AI-Powered Hiring
                </h1>
                <p className="text-white/70 text-lg max-w-xl">
                  Screen candidates with intelligent AI interviews that evaluate
                  skills, experience, and cultural fit automatically.
                </p>
              </div>
              <Link href="/hr/recruiting/jobs/new">
                <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#007aff] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                  <Plus className="h-5 w-5" />
                  Post a Job
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

          {/* Jobs Section */}
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
            {/* Section Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Job Postings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage your open positions
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    className="pl-10 pr-4 py-2 bg-black/[0.02] dark:bg-white/[0.04] rounded-xl text-sm border-0 focus:ring-2 focus:ring-[#007aff]/20 w-64"
                  />
                </div>
                <button className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Jobs List or Empty State */}
            {jobs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#007aff]/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-[#007aff]" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Post your first job
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create a job posting with AI-powered screening questions to
                  automatically evaluate and shortlist candidates.
                </p>
                <Link href="/hr/recruiting/jobs/new">
                  <button className="px-6 py-3 bg-[#007aff] text-white rounded-xl font-medium hover:bg-[#0066d6] transition-colors">
                    Post a Job
                  </button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/hr/recruiting/jobs/${job.id}`}>
                    <div className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#007aff]/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-[#007aff]" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {job.applicants} applicants
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Star className="h-3 w-3" />
                                {job.shortlisted} shortlisted
                              </span>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              job.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : job.status === "paused"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400"
                            }`}
                          >
                            {job.status}
                          </span>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/hr/recruiting/candidates">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                <div className="p-3 rounded-xl bg-indigo-500/10">
                  <Users className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">All Candidates</p>
                  <p className="text-sm text-muted-foreground">
                    View candidate database
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            <Link href="/hr/recruiting/pipeline">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Pipeline</p>
                  <p className="text-sm text-muted-foreground">
                    Track hiring stages
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            <Link href="/hr/recruiting/interviews">
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <Calendar className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Interviews</p>
                  <p className="text-sm text-muted-foreground">
                    Schedule and review
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
