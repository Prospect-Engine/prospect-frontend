"use client";

import { Briefcase, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatsCard({ title, value, description, icon, iconBg, iconColor, trend }: StatsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/20">
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-2xl", iconBg)}>
            <div className={iconColor}>{icon}</div>
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              trend.isPositive
                ? "text-green-600 bg-green-50 dark:bg-green-500/10"
                : "text-red-600 bg-red-50 dark:bg-red-500/10"
            )}>
              <TrendingUp className={cn("h-3 w-3", !trend.isPositive && "rotate-180")} />
              {trend.value}%
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground/70">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  totalJobs: number;
  activeJobs: number;
  totalCandidates: number;
  pendingReview: number;
}

export function DashboardStats({
  totalJobs,
  activeJobs,
  totalCandidates,
  pendingReview,
}: DashboardStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Jobs"
        value={totalJobs}
        description={`${activeJobs} currently active`}
        icon={<Briefcase className="h-5 w-5" />}
        iconBg="bg-blue-50 dark:bg-blue-500/10"
        iconColor="text-[#0071e3]"
      />
      <StatsCard
        title="Total Candidates"
        value={totalCandidates}
        description="All applications"
        icon={<Users className="h-5 w-5" />}
        iconBg="bg-green-50 dark:bg-green-500/10"
        iconColor="text-[#34c759]"
      />
      <StatsCard
        title="Pending Review"
        value={pendingReview}
        description="Awaiting your action"
        icon={<Clock className="h-5 w-5" />}
        iconBg="bg-orange-50 dark:bg-orange-500/10"
        iconColor="text-[#ff9500]"
      />
      <StatsCard
        title="Active Jobs"
        value={activeJobs}
        description="Currently hiring"
        icon={<CheckCircle className="h-5 w-5" />}
        iconBg="bg-purple-50 dark:bg-purple-500/10"
        iconColor="text-[#af52de]"
      />
    </div>
  );
}
