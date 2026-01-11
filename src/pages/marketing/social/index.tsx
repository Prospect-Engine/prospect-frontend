/**
 * SOCIAL MEDIA HUB
 * ================
 * Multi-platform social media management.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Share2,
  Plus,
  ArrowRight,
  Globe,
  Users,
  Calendar,
  BarChart3,
  Filter,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  PenSquare,
} from "lucide-react";

// Platform icons (using text for simplicity)
const platforms = [
  { id: "facebook", name: "Facebook", color: "#1877F2", connected: false },
  { id: "instagram", name: "Instagram", color: "#E4405F", connected: false },
  { id: "linkedin", name: "LinkedIn", color: "#0A66C2", connected: false },
  { id: "twitter", name: "Twitter/X", color: "#000000", connected: false },
  { id: "tiktok", name: "TikTok", color: "#000000", connected: false },
];

// Sample scheduled posts (empty state for now)
const scheduledPosts: Array<{
  id: string;
  content: string;
  platforms: string[];
  scheduledAt: string;
  status: "scheduled" | "published" | "failed";
}> = [];

// Stats for the hub
const stats = [
  {
    title: "Connected Accounts",
    value: "0",
    icon: Users,
    color: "bg-cyan-500",
  },
  {
    title: "Scheduled Posts",
    value: "0",
    icon: Clock,
    color: "bg-amber-500",
  },
  {
    title: "Published Today",
    value: "0",
    icon: CheckCircle2,
    color: "bg-green-500",
  },
  {
    title: "Total Reach",
    value: "0",
    icon: Globe,
    color: "bg-purple-500",
  },
];

export default function SocialMediaHub() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00BCD4] to-[#0097A7] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Social Media Hub
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Manage All Platforms
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Connect your social media accounts and manage all your content
                    from one centralized dashboard.
                  </p>
                </div>
                <Link href="/marketing/social/compose">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#00BCD4] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Create Post
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

            {/* Connected Platforms */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Connected Platforms
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your social media accounts
                  </p>
                </div>
                <Link href="/marketing/social/accounts">
                  <button className="text-sm text-[#00BCD4] hover:underline flex items-center gap-1">
                    Manage Accounts <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {platforms.map((platform) => (
                    <div
                      key={platform.id}
                      className="flex flex-col items-center p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.04] hover:shadow-md transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: `${platform.color}15` }}
                      >
                        <span
                          className="text-lg font-bold"
                          style={{ color: platform.color }}
                        >
                          {platform.name.charAt(0)}
                        </span>
                      </div>
                      <p className="font-medium text-foreground text-sm">
                        {platform.name}
                      </p>
                      {platform.connected ? (
                        <span className="text-xs text-green-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <Link href="/marketing/social/accounts">
                          <button className="text-xs text-[#00BCD4] mt-1 hover:underline">
                            Connect
                          </button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scheduled Posts */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              {/* Section Header */}
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Scheduled Posts
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Upcoming content queue
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      className="pl-10 pr-4 py-2 bg-black/[0.02] dark:bg-white/[0.04] rounded-xl text-sm border-0 focus:ring-2 focus:ring-[#00BCD4]/20 w-64"
                    />
                  </div>
                  <button className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg transition-colors">
                    <Filter className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Posts List or Empty State */}
              {scheduledPosts.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00BCD4]/10 flex items-center justify-center">
                    <PenSquare className="h-8 w-8 text-[#00BCD4]" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No scheduled posts
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your first post to start building your content queue.
                    Schedule posts across multiple platforms at once.
                  </p>
                  <Link href="/marketing/social/compose">
                    <button className="px-6 py-3 bg-[#00BCD4] text-white rounded-xl font-medium hover:bg-[#00ACC1] transition-colors">
                      Create Post
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#00BCD4]/10 flex items-center justify-center">
                            <PenSquare className="h-5 w-5 text-[#00BCD4]" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground line-clamp-1">
                              {post.content}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.scheduledAt}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {post.platforms.join(", ")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              post.status === "scheduled"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
                                : post.status === "published"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            }`}
                          >
                            {post.status}
                          </span>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/marketing/social/accounts">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-cyan-500/10">
                    <Users className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Manage Accounts</p>
                    <p className="text-sm text-muted-foreground">
                      Connect and manage platforms
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/calendar">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      View scheduled content
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/social/analytics">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      Track performance metrics
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
