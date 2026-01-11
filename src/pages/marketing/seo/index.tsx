/**
 * SEO DASHBOARD
 * =============
 * Search engine optimization tools.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  Key,
  FileSearch,
  Globe,
  BarChart3,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";

// Stats for the SEO dashboard
const stats = [
  {
    title: "Keywords Tracked",
    value: "0",
    icon: Key,
    color: "bg-sky-500",
  },
  {
    title: "Avg. Position",
    value: "-",
    icon: TrendingUp,
    color: "bg-emerald-500",
  },
  {
    title: "Pages Analyzed",
    value: "0",
    icon: FileSearch,
    color: "bg-purple-500",
  },
  {
    title: "Opportunities",
    value: "0",
    icon: Zap,
    color: "bg-amber-500",
  },
];

// SEO Tools
const seoTools = [
  {
    id: "keyword-research",
    title: "Keyword Research",
    description: "Discover relevant keywords with search volume and competition data",
    icon: Key,
    color: "bg-sky-500/10",
    iconColor: "text-sky-500",
    href: "/marketing/seo/keywords",
  },
  {
    id: "content-analyzer",
    title: "Content Analyzer",
    description: "Get SEO scores and optimization suggestions for your content",
    icon: FileSearch,
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
    href: "/marketing/seo/analyzer",
  },
  {
    id: "meta-generator",
    title: "Meta Generator",
    description: "Generate optimized titles and descriptions with AI",
    icon: Zap,
    color: "bg-amber-500/10",
    iconColor: "text-amber-500",
    href: "/marketing/content/writer?type=meta",
  },
  {
    id: "rank-tracker",
    title: "Rank Tracker",
    description: "Monitor your keyword positions over time",
    icon: TrendingUp,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    href: "/marketing/seo/keywords",
  },
];

// Sample tracked keywords (empty for now)
const trackedKeywords: Array<{
  id: string;
  keyword: string;
  position: number;
  change: number;
  volume: number;
  difficulty: number;
}> = [];

export default function SeoDashboard() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0288D1] to-[#01579B] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      SEO Tools
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Search Optimization
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Improve your content's visibility with keyword research,
                    content analysis, and rank tracking tools.
                  </p>
                </div>
                <Link href="/marketing/seo/keywords">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#0288D1] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Add Keywords
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

            {/* SEO Tools Grid */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                SEO Tools
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {seoTools.map((tool) => (
                  <Link key={tool.id} href={tool.href}>
                    <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className={`p-3 rounded-xl ${tool.color} w-fit mb-4`}>
                        <tool.icon className={`h-5 w-5 ${tool.iconColor}`} />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-muted-foreground flex-1">
                        {tool.description}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tracked Keywords Section */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Tracked Keywords
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Monitor your keyword rankings
                  </p>
                </div>
                <Link href="/marketing/seo/keywords">
                  <button className="text-sm text-[#0288D1] hover:underline flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>

              {trackedKeywords.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-500/10 flex items-center justify-center">
                    <Target className="h-8 w-8 text-sky-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No keywords tracked
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start tracking keywords to monitor your search rankings and
                    identify opportunities for improvement.
                  </p>
                  <Link href="/marketing/seo/keywords">
                    <button className="px-6 py-3 bg-[#0288D1] text-white rounded-xl font-medium hover:bg-[#0277BD] transition-colors">
                      Add Keywords
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Keyword
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Position
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Change
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Volume
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Difficulty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                      {trackedKeywords.map((keyword) => (
                        <tr
                          key={keyword.id}
                          className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-medium text-foreground">
                              {keyword.keyword}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-foreground">
                              {keyword.position}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              {keyword.change > 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : keyword.change < 0 ? (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              ) : (
                                <Minus className="h-4 w-4 text-slate-400" />
                              )}
                              <span
                                className={`font-medium ${
                                  keyword.change > 0
                                    ? "text-green-500"
                                    : keyword.change < 0
                                    ? "text-red-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {Math.abs(keyword.change)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground">
                            {keyword.volume.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <div className="w-16 h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    keyword.difficulty < 30
                                      ? "bg-green-500"
                                      : keyword.difficulty < 60
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${keyword.difficulty}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/marketing/seo/keywords">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-sky-500/10">
                    <Key className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Keyword Research</p>
                    <p className="text-sm text-muted-foreground">
                      Find new keywords
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/seo/analyzer">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <FileSearch className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Analyzer</p>
                    <p className="text-sm text-muted-foreground">
                      Optimize your content
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/content">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-teal-500/10">
                    <Globe className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Studio</p>
                    <p className="text-sm text-muted-foreground">
                      Create SEO content
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
