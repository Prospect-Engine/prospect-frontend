"use client";

import React from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import AppLayout from "@/components/layout/AppLayout";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageSquare, UserCheck, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type CampaignStat = {
  id: string;
  name: string;
  status: "PROCESSED" | "PROCESSING" | "PAUSED" | "ACTIVE";
  launchedAt: string;
  connections: { total: number; connected: number; inviteRate: number };
  messages: { sent: number; replies: number; rate: number };
  profile: { viewed: number; endorsed: number; liked: number };
  issues: { blacklisted: number; ignored: number; withdrawn: number };
  leadSummary: {
    total: number;
    verified: number;
    inProgress: number;
    completed: number;
    failed: number;
  };
  needsAttention?: boolean;
};

// No demo campaigns. Everything comes from API.

// Helpers to compute and clamp percentages
const clampPercent = (value: number): number => {
  if (isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
};

const computeRate = (
  provided: any,
  numerator: number,
  denominator: number
): number => {
  const providedNum = Number(provided);
  if (!isNaN(providedNum) && providedNum > 0) return clampPercent(providedNum);
  if (!denominator || isNaN(denominator) || denominator <= 0) return 0;
  const calc = ((Number(numerator) || 0) / denominator) * 100;
  return clampPercent(calc);
};

// Normalize API status/process_status to our union
const normalizeStatus = (raw: any): CampaignStat["status"] => {
  const v = String(raw || "").toUpperCase();
  if (v === "PROCESSED" || v === "COMPLETED" || v === "DONE")
    return "PROCESSED";
  if (v === "PROCESSING" || v === "IN_PROGRESS" || v === "RUNNING")
    return "PROCESSING";
  if (v === "PAUSED" || v === "SUSPENDED") return "PAUSED";
  if (v === "ACTIVE" || v === "STARTED") return "ACTIVE";
  return "PROCESSED";
};

// Format date-time helper
const formatDateTime = (value: string): string => {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return String(value);
  return d.format("MMM DD, YYYY HH:mm");
};

const StatPill = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number | string;
  color: string;
}) => (
  <div
    className={`flex items-center gap-2 rounded-md px-3 py-1 text-xs font-medium bg-${color}-50 text-${color}-700 border border-${color}-200 whitespace-nowrap`}
  >
    <span className="shrink-0">{value}</span>
    <span className="text-gray-500">{label}</span>
  </div>
);

const Meter = ({
  value,
  color = "blue",
}: {
  value: number;
  color?: string;
}) => (
  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
    <div
      className={`h-2 rounded-full bg-${color}-600`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

export default function SingleStatDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id");
  const teamId = searchParams.get("team_id");
  const memberName = searchParams.get("name");
  const memberEmail = searchParams.get("email");
  const teamName = searchParams.get("team_name");

  const [campaigns, setCampaigns] = React.useState<CampaignStat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const totals = React.useMemo(() => {
    const sum = (arr: any[], fn: (x: any) => number) =>
      arr.reduce((acc, it) => acc + (Number(fn(it)) || 0), 0);
    return {
      campaigns: campaigns.length,
      connected: sum(campaigns, c => c.connections.connected),
      messages: sum(campaigns, c => c.messages.sent),
      replies: sum(campaigns, c => c.messages.replies),
    };
  }, [campaigns]);

  const doFetch = React.useCallback(
    async (signal?: AbortSignal) => {
      if (!userId || !teamId) return;
      try {
        setLoading(true);
        setError(null);
        const resp = await fetch("/api/analytics/team-stats/getStatDetail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ user_id: userId, team_id: teamId }),
          signal,
        });
        if (!resp.ok) {
          toast.error(`Failed: ${resp.status}`);
          return null;
        }
        const data = await resp.json();

        const srcCampaigns =
          (Array.isArray(data?.campaigns)
            ? data.campaigns
            : Array.isArray(data?.data)
              ? data.data
              : []) || [];

        const mapped: CampaignStat[] = srcCampaigns.map(
          (c: any, idx: number) => ({
            id: String(c?.id ?? idx + 1),
            name: String(c?.name ?? c?.campaign_name ?? `Campaign ${idx + 1}`),
            status: normalizeStatus(c?.process_status ?? c?.status),
            launchedAt: String(c?.launched_at ?? c?.created_at ?? ""),
            connections: {
              // Treat invite_send_count as the canonical total for connections progress
              total: Number(
                c?.invite_send_count ??
                  c?.invites_sent ??
                  c?.connections_total ??
                  c?.connection_total ??
                  c?.total_connections ??
                  0
              ),
              connected: Number(c?.connected ?? c?.lead_connected_count ?? 0),
              inviteRate: (() => {
                const connected = Number(
                  c?.connected ?? c?.lead_connected_count ?? 0
                );
                // Prefer invites sent as denominator for connection completion
                const primaryDen = Number(
                  c?.invite_send_count ?? c?.invites_sent ?? 0
                );
                const fallbackDen = Number(
                  c?.connections_total ??
                    c?.connection_total ??
                    c?.total_connections ??
                    c?.total_leads ??
                    c?.lead_total ??
                    0
                );
                const denominator =
                  primaryDen > 0
                    ? primaryDen
                    : fallbackDen > 0
                      ? fallbackDen
                      : 0;
                return computeRate(
                  c?.invite_rate ?? c?.inviteRate,
                  connected,
                  denominator
                );
              })(),
            },
            messages: {
              sent: Number(c?.messages_sent ?? c?.message_send_count ?? 0),
              replies: Number(c?.replies ?? c?.message_reply_count ?? 0),
              rate: computeRate(
                c?.reply_rate ?? c?.replyRate,
                Number(c?.replies ?? c?.message_reply_count ?? 0),
                Number(c?.messages_sent ?? c?.message_send_count ?? 0)
              ),
            },
            profile: {
              viewed: Number(c?.profile_viewed_count ?? 0),
              endorsed: Number(c?.endorse_count ?? 0),
              liked: Number(c?.like_post_count ?? 0),
            },
            issues: {
              blacklisted: Number(c?.black_listed_count ?? 0),
              ignored: Number(c?.ignored_count ?? 0),
              withdrawn: Number(c?.withdrawn_count ?? 0),
            },
            leadSummary: {
              total: Number(c?.total_leads ?? c?.lead_total ?? 0),
              verified: Number(c?.profile_verified_count ?? 0),
              inProgress: Number(c?.in_progress_lead_count ?? 0),
              completed: Number(c?.completed_sequence_lead_count ?? 0),
              failed: Number(c?.fail_count ?? 0),
            },
            needsAttention: Boolean(
              c?.needs_attention ?? (c?.ignored_count ?? 0) > 0
            ),
          })
        );

        if (!signal || !signal.aborted) setCampaigns(mapped);
      } catch (e: any) {
        if (signal?.aborted) return;
        setError(e?.message || "Failed to load details");
      } finally {
        if (!signal || !signal.aborted) setLoading(false);
      }
    },
    [userId, teamId]
  );

  React.useEffect(() => {
    const controller = new AbortController();
    doFetch(controller.signal);
    return () => controller.abort();
  }, [doFetch]);

  return (
    <AppLayout activePage="Analytics">
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Team Statistics
        </button>

        {/* Header */}
        <Card>
          <CardContent className="">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-2 w-full max-w-[240px]">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
                <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-4">
                      <Skeleton className="h-3 w-20 mb-2" />
                      <Skeleton className="h-6 w-10" />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg font-semibold">
                    {String(userId || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {memberName || "Member"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {memberEmail || `user: ${userId ?? "-"}`}
                    </div>
                    <div className="text-xs text-gray-500">
                      {teamName || `team: ${teamId ?? "-"}`}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Campaigns</div>
                    <div className="text-2xl font-semibold">
                      {totals.campaigns}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Connected</div>
                    <div className="text-2xl font-semibold">
                      {totals.connected}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Messages</div>
                    <div className="text-2xl font-semibold">
                      {totals.messages}
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-xs text-gray-500">Replies</div>
                    <div className="text-2xl font-semibold">
                      {totals.replies}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-base font-semibold text-gray-900">
          Campaign Statistics
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide pr-1">
          {loading &&
            campaigns.length === 0 &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`sk-${i}`} className="shadow-none">
                <CardHeader className="">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-60" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                    {[3, 3, 4, 2].map((span, idx) => (
                      <div
                        key={idx}
                        className={`lg:col-span-${span} rounded-lg border p-4`}
                      >
                        <Skeleton className="h-4 w-32 mb-4" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          {!loading && campaigns.length === 0 && !error && (
            <div className="text-sm text-gray-500">
              No campaign data available.
            </div>
          )}
          {campaigns.map(c => (
            <Card key={c.id} className="shadow-none ">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-800">{c.name}</CardTitle>
                    <div className="text-xs text-gray-500">
                      Launched: {formatDateTime(c.launchedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.needsAttention && (
                      <div className="flex items-center text-xs text-red-600 gap-1">
                        <AlertCircle className="w-4 h-4" /> Needs Attention
                      </div>
                    )}
                    <Badge className="bg-gray-800 hover:bg-gray-900">
                      {c.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
                  {/* Connections */}
                  <div className="lg:col-span-3 rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Connections
                    </div>
                    <div className="text-2xl font-semibold">
                      {c.connections.total}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="text-green-700 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        {c.connections.connected} Connected
                      </span>
                      <span>{c.connections.inviteRate}%</span>
                    </div>
                    <div className="mt-2">
                      <Meter value={c.connections.inviteRate} color="green" />
                    </div>
                  </div>

                  {/* Message Engagement */}
                  <div className="lg:col-span-3 rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Message Engagement
                    </div>
                    <div className="text-2xl font-semibold">
                      {c.messages.sent}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span className="text-blue-700 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {c.messages.replies} Replies
                      </span>
                      <span>{c.messages.rate}%</span>
                    </div>
                    <div className="mt-2">
                      <Meter value={c.messages.rate} color="blue" />
                    </div>
                  </div>

                  {/* Profile Engagement */}
                  <div className="lg:col-span-4 rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">
                      Profile Engagement
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-md bg-gray-50 border p-3 text-center flex-1 min-w-[110px]">
                        <div className="text-xs text-gray-500">Viewed</div>
                        <div className="text-xl font-semibold">
                          {c.profile.viewed}
                        </div>
                      </div>
                      <div className="rounded-md bg-indigo-50 border p-3 text-center flex-1 min-w-[110px]">
                        <div className="text-xs text-indigo-700 whitespace-nowrap">
                          Endorsed
                        </div>
                        <div className="text-xl font-semibold text-indigo-700">
                          {c.profile.endorsed}
                        </div>
                      </div>
                      <div className="rounded-md bg-green-50 border p-3 text-center flex-1 min-w-[110px]">
                        <div className="text-xs text-green-700 whitespace-nowrap">
                          Liked Posts
                        </div>
                        <div className="text-xl font-semibold text-green-700">
                          {c.profile.liked}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issues */}
                  <div className="lg:col-span-2 rounded-lg border p-4">
                    <div className="text-sm text-gray-600 mb-2">Issues</div>
                    <div className="flex flex-wrap gap-3">
                      <div className="rounded-md bg-red-50 border p-2 text-center flex-1 min-w-[90px]">
                        <div className="text-[10px] text-red-600 leading-none whitespace-nowrap">
                          Blacklisted
                        </div>
                        <div className="text-lg font-semibold text-red-700">
                          {c.issues.blacklisted}
                        </div>
                      </div>
                      <div className="rounded-md bg-amber-50 border p-2 text-center flex-1 min-w-[90px]">
                        <div className="text-[10px] text-amber-700 leading-none">
                          Ignored
                        </div>
                        <div className="text-lg font-semibold text-amber-700">
                          {c.issues.ignored}
                        </div>
                      </div>
                      <div className="rounded-md bg-gray-50 border p-2 text-center flex-1 min-w-[90px]">
                        <div className="text-[10px] text-gray-600 leading-none">
                          Withdrawn
                        </div>
                        <div className="text-lg font-semibold text-gray-700">
                          {c.issues.withdrawn}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lead summary pills */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatPill
                    label="Total Leads"
                    value={c.leadSummary.total}
                    color="indigo"
                  />
                  <StatPill
                    label="Verified Leads"
                    value={c.leadSummary.verified}
                    color="blue"
                  />
                  <StatPill
                    label="In Progress"
                    value={c.leadSummary.inProgress}
                    color="cyan"
                  />
                  <StatPill
                    label="Completed"
                    value={c.leadSummary.completed}
                    color="green"
                  />
                  <StatPill
                    label="Failed"
                    value={c.leadSummary.failed}
                    color="red"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
