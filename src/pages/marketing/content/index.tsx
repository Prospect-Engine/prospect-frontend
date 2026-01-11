/**
 * AI CONTENT STUDIO
 * =================
 * AI-powered content creation hub.
 */

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  ArrowRight,
  Wand2,
  Bot,
  Image,
  FileText,
  Zap,
  RefreshCw,
  Hash,
  MessageSquare,
  PenSquare,
  LayoutTemplate,
  Lightbulb,
} from "lucide-react";

// Content types
const contentTypes = [
  {
    id: "social-post",
    title: "Social Post",
    description: "Create engaging social media posts",
    icon: MessageSquare,
    color: "bg-cyan-500",
    href: "/marketing/content/writer?type=social",
  },
  {
    id: "caption",
    title: "Caption",
    description: "Generate catchy captions",
    icon: PenSquare,
    color: "bg-pink-500",
    href: "/marketing/content/writer?type=caption",
  },
  {
    id: "hashtags",
    title: "Hashtags",
    description: "Find trending hashtags",
    icon: Hash,
    color: "bg-purple-500",
    href: "/marketing/content/writer?type=hashtags",
  },
  {
    id: "blog-post",
    title: "Blog Post",
    description: "Write long-form content",
    icon: FileText,
    color: "bg-blue-500",
    href: "/marketing/content/writer?type=blog",
  },
  {
    id: "ad-copy",
    title: "Ad Copy",
    description: "Create compelling ads",
    icon: Zap,
    color: "bg-amber-500",
    href: "/marketing/content/writer?type=ad",
  },
  {
    id: "repurpose",
    title: "Repurpose",
    description: "Transform existing content",
    icon: RefreshCw,
    color: "bg-green-500",
    href: "/marketing/content/writer?type=repurpose",
  },
];

// Stats for the studio
const stats = [
  {
    title: "Content Created",
    value: "0",
    icon: FileText,
    color: "bg-teal-500",
  },
  {
    title: "AI Generations",
    value: "0",
    icon: Sparkles,
    color: "bg-purple-500",
  },
  {
    title: "Templates",
    value: "0",
    icon: LayoutTemplate,
    color: "bg-amber-500",
  },
  {
    title: "Media Files",
    value: "0",
    icon: Image,
    color: "bg-pink-500",
  },
];

// Recent generations (empty state)
const recentGenerations: Array<{
  id: string;
  type: string;
  content: string;
  createdAt: string;
}> = [];

export default function ContentStudio() {
  return (
    <div className="flex flex-col h-screen bg-[#f5f5f7] dark:bg-[#1c1c1e]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#009688] to-[#00695C] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      AI Content Studio
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    Create with AI
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Generate engaging content for all your marketing needs.
                    Powered by advanced AI that understands your brand voice.
                  </p>
                </div>
                <Link href="/marketing/content/writer">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#009688] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Wand2 className="h-5 w-5" />
                    Start Writing
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

            {/* Content Types Grid */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Create Content
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {contentTypes.map((type) => (
                  <Link key={type.id} href={type.href}>
                    <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                      <div className={`p-3 rounded-xl ${type.color}`}>
                        <type.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{type.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {type.description}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Generations */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Recent Generations
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your AI-generated content
                  </p>
                </div>
              </div>

              {recentGenerations.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-500/10 flex items-center justify-center">
                    <Lightbulb className="h-8 w-8 text-teal-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No content yet
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start creating content with our AI writer. Choose a content
                    type above to begin.
                  </p>
                  <Link href="/marketing/content/writer">
                    <button className="px-6 py-3 bg-[#009688] text-white rounded-xl font-medium hover:bg-[#00897B] transition-colors">
                      Start Creating
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {recentGenerations.map((gen) => (
                    <div
                      key={gen.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 rounded-full uppercase">
                            {gen.type}
                          </span>
                          <p className="font-medium text-foreground mt-2 line-clamp-2">
                            {gen.content}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {gen.createdAt}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground ml-4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/marketing/content/writer">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-teal-500/10">
                    <Bot className="h-5 w-5 text-teal-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">AI Writer</p>
                    <p className="text-sm text-muted-foreground">
                      Generate content with AI
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/content/library">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-pink-500/10">
                    <Image className="h-5 w-5 text-pink-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Media Library</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your assets
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/marketing/social/compose">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-cyan-500/10">
                    <PenSquare className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Create Post</p>
                    <p className="text-sm text-muted-foreground">
                      Publish to social media
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
