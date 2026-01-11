/**
 * MARKETING DASHBOARD
 * ===================
 * AI-powered marketing suite overview.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Megaphone,
  Plus,
  ArrowRight,
  Share2,
  Calendar,
  Search,
  Sparkles,
  Users,
  BarChart3,
  Globe,
  Wand2,
  TrendingUp,
  FileText,
  Eye,
  Heart,
} from "lucide-react";

// Stats for the dashboard
const stats = [
  {
    title: "Posts Scheduled",
    value: "0",
    icon: Calendar,
    color: "bg-cyan-500",
  },
  {
    title: "Content Created",
    value: "0",
    icon: FileText,
    color: "bg-teal-500",
  },
  {
    title: "Total Reach",
    value: "0",
    icon: Eye,
    color: "bg-emerald-500",
  },
  {
    title: "Engagement",
    value: "0",
    icon: Heart,
    color: "bg-pink-500",
  },
];

// Quick action cards
const quickActions = [
  {
    title: "Create Post",
    description: "Write and schedule social media content",
    icon: Share2,
    color: "bg-cyan-500/10",
    iconColor: "text-cyan-500",
    href: "/marketing/social/compose",
  },
  {
    title: "AI Writer",
    description: "Generate content with AI assistance",
    icon: Sparkles,
    color: "bg-teal-500/10",
    iconColor: "text-teal-500",
    href: "/marketing/content/writer",
  },
  {
    title: "Content Calendar",
    description: "Plan and organize your content",
    icon: Calendar,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    href: "/marketing/calendar",
  },
  {
    title: "SEO Analysis",
    description: "Optimize content for search engines",
    icon: Search,
    color: "bg-sky-500/10",
    iconColor: "text-sky-500",
    href: "/marketing/seo",
  },
];

export default function MarketingDashboard() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#00BCD4] to-[#00838F] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      GenMarketing
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    AI Marketing Suite
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Create, schedule, and optimize your marketing content with
                    AI-powered tools. Manage all social media from one place.
                  </p>
                </div>
                <Link href="/marketing/social/compose">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#00BCD4] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Create Content
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
                      <p className="text-sm text-muted-foreground">
                        {stat.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.title} href={action.href}>
                    <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className={`p-3 rounded-xl ${action.color} w-fit mb-4`}>
                        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex-1">
                        {action.description}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Feature Sections */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Social Media Hub */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/10">
                      <Globe className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Social Media Hub
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage all platforms
                      </p>
                    </div>
                  </div>
                  <Link href="/marketing/social">
                    <button className="text-sm text-[#00BCD4] hover:underline">
                      View All
                    </button>
                  </Link>
                </div>
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                    <Share2 className="h-7 w-7 text-cyan-500" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">
                    Connect Your Accounts
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Link your social media accounts to start scheduling and publishing content.
                  </p>
                  <Link href="/marketing/social/accounts">
                    <button className="px-4 py-2 bg-[#00BCD4] text-white rounded-lg text-sm font-medium hover:bg-[#00ACC1] transition-colors">
                      Connect Accounts
                    </button>
                  </Link>
                </div>
              </div>

              {/* AI Content Studio */}
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-500/10">
                      <Wand2 className="h-5 w-5 text-teal-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        AI Content Studio
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Generate with AI
                      </p>
                    </div>
                  </div>
                  <Link href="/marketing/content">
                    <button className="text-sm text-[#00BCD4] hover:underline">
                      Open Studio
                    </button>
                  </Link>
                </div>
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                    <Sparkles className="h-7 w-7 text-teal-500" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">
                    AI-Powered Content
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                    Generate engaging posts, captions, and hashtags with our AI writer.
                  </p>
                  <Link href="/marketing/content/writer">
                    <button className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
                      Start Writing
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* More Features */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/marketing/calendar">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-emerald-500/10">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      Plan your content
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/seo">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-sky-500/10">
                    <TrendingUp className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">SEO Tools</p>
                    <p className="text-sm text-muted-foreground">
                      Optimize for search
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
                      Track performance
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
