/**
 * CHATFORMS - AI Lead Qualification
 * ==================================
 * Create and manage AI-powered chatforms for lead qualification.
 * Embeddable on websites or before meeting links.
 */

import { useState, useEffect, useCallback } from "react";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  Bot,
  Plus,
  ArrowRight,
  Code,
  Globe,
  Calendar,
  BarChart3,
  Users,
  MessageSquare,
  Zap,
  Copy,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit2,
  Play,
  Pause,
  Loader2,
  Eye,
} from "lucide-react";
import {
  ChatformApiService,
  Chatform,
  ChatformStats,
} from "@/services/chatformApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";

// Use cases
const useCases = [
  {
    id: "website",
    title: "Website Embed",
    description: "Embed on your website to qualify visitors before they book a call",
    icon: Globe,
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    id: "pre_meeting",
    title: "Pre-Meeting Qualifier",
    description: "Send before calendar booking to qualify leads and save time",
    icon: Calendar,
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
  },
  {
    id: "standalone",
    title: "Standalone Link",
    description: "Share a direct link for leads to complete qualification",
    icon: ExternalLink,
    color: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
];

export default function ChatformsPage() {
  const [loading, setLoading] = useState(true);
  const [chatforms, setChatforms] = useState<Chatform[]>([]);
  const [stats, setStats] = useState<ChatformStats>({
    activeForms: 0,
    totalSubmissions: 0,
    qualifiedLeads: 0,
    conversionRate: 0,
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [chatformsRes, statsRes] = await Promise.all([
        ChatformApiService.getChatforms(),
        ChatformApiService.getStats(),
      ]);

      if (Array.isArray(chatformsRes.data)) {
        setChatforms(chatformsRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching chatforms:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy embed code
  const copyEmbedCode = async (chatform: Chatform) => {
    const embedCode = `<script src="${window.location.origin}/chatform-embed.js" data-chatform-id="${chatform.id}"></script>`;
    await navigator.clipboard.writeText(embedCode);
    ShowShortMessage("Embed code copied!", "success");
  };

  // Copy link
  const copyLink = async (chatform: Chatform) => {
    const link = `${window.location.origin}/chatform/${chatform.workspaceId}/${chatform.slug}`;
    await navigator.clipboard.writeText(link);
    ShowShortMessage("Link copied!", "success");
  };

  // Toggle status
  const toggleStatus = async (chatform: Chatform) => {
    const newStatus = chatform.status === "active" ? "paused" : "active";
    try {
      await ChatformApiService.updateChatform(chatform.id, { status: newStatus });
      fetchData();
      ShowShortMessage(`Chatform ${newStatus === "active" ? "activated" : "paused"}`, "success");
    } catch (error) {
      ShowShortMessage("Failed to update status", "error");
    }
  };

  // Delete chatform
  const deleteChatform = async (id: string) => {
    if (!confirm("Are you sure you want to delete this chatform?")) return;
    try {
      await ChatformApiService.deleteChatform(id);
      fetchData();
      ShowShortMessage("Chatform deleted", "success");
    } catch (error) {
      ShowShortMessage("Failed to delete chatform", "error");
    }
  };

  // Stats configuration
  const statsConfig = [
    {
      title: "Active Forms",
      value: stats.activeForms.toString(),
      icon: Bot,
      color: "bg-emerald-500",
    },
    {
      title: "Total Submissions",
      value: stats.totalSubmissions.toString(),
      icon: MessageSquare,
      color: "bg-blue-500",
    },
    {
      title: "Qualified Leads",
      value: stats.qualifiedLeads.toString(),
      icon: Users,
      color: "bg-purple-500",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: Zap,
      color: "bg-amber-500",
    },
  ];

  return (
    <AppLayout activePage="Chatforms">
      <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#10b981] to-[#059669] p-8 md:p-10">
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
              <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-white/80" />
                    <span className="text-sm font-medium text-white/80">
                      Chatforms
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                    AI Lead Qualification
                  </h1>
                  <p className="text-white/70 text-lg max-w-xl">
                    Create intelligent chatforms that qualify leads before calls,
                    embed on your website, or use as pre-meeting qualifiers.
                  </p>
                </div>
                <Link href="/sales/chatforms/new">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white text-[#10b981] rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl">
                    <Plus className="h-5 w-5" />
                    Create Chatform
                  </button>
                </Link>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statsConfig.map((stat) => (
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
                        {loading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Use Cases - only show when no chatforms */}
            {!loading && chatforms.length === 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Create for...
                </h2>
                <div className="grid sm:grid-cols-3 gap-4">
                  {useCases.map((useCase) => (
                    <Link key={useCase.id} href={`/sales/chatforms/new?type=${useCase.id}`}>
                      <div className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group h-full">
                        <div className={`p-3 rounded-xl ${useCase.color} w-fit mb-4`}>
                          <useCase.icon className={`h-5 w-5 ${useCase.iconColor}`} />
                        </div>
                        <h3 className="font-medium text-foreground mb-1">
                          {useCase.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex-1">
                          {useCase.description}
                        </p>
                        <ArrowRight className="h-4 w-4 text-muted-foreground mt-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Chatforms List */}
            <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between p-6 border-b border-black/[0.04] dark:border-white/[0.04]">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Your Chatforms
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Manage your AI qualification forms
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Loading chatforms...</p>
                </div>
              ) : chatforms.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Bot className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Create your first chatform
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Build an AI-powered chatform to qualify leads automatically.
                    Embed it on your website or use before meeting bookings.
                  </p>
                  <Link href="/sales/chatforms/new">
                    <button className="px-6 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors">
                      Create Chatform
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                  {chatforms.map((form) => (
                    <div
                      key={form.id}
                      className="p-6 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: `${form.branding?.primaryColor || "#10b981"}20` }}
                          >
                            <Bot
                              className="h-5 w-5"
                              style={{ color: form.branding?.primaryColor || "#10b981" }}
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground">
                              {form.name}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-muted-foreground">
                                {form.totalSubmissions} submissions
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {form.qualifiedCount} qualified
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">
                                {form.type.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStatus(form)}
                            className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              form.status === "active"
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-200"
                                : form.status === "draft"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 hover:bg-gray-200"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 hover:bg-yellow-200"
                            }`}
                          >
                            {form.status}
                          </button>
                          <button
                            onClick={() => copyLink(form)}
                            className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                            title="Copy link"
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => copyEmbedCode(form)}
                            className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                            title="Copy embed code"
                          >
                            <Code className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <Link href={`/chatform/${form.workspaceId}/${form.slug}`} target="_blank">
                            <button
                              className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Link>
                          <Link href={`/sales/chatforms/${form.id}/edit`}>
                            <button
                              className="p-2 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] rounded-lg"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </Link>
                          <button
                            onClick={() => deleteChatform(form.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/sales/leads">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">View Qualified Leads</p>
                    <p className="text-sm text-muted-foreground">
                      See leads from chatforms
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/sales/appointments">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Calendar className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Appointments</p>
                    <p className="text-sm text-muted-foreground">
                      Manage bookings
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>

              <Link href="/sales">
                <div className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.04] hover:shadow-lg transition-all cursor-pointer group">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Analytics</p>
                    <p className="text-sm text-muted-foreground">
                      View performance
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            </div>
      </div>
    </AppLayout>
  );
}
