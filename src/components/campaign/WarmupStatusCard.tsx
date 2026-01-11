"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, TrendingUp, Zap, Loader2 } from "lucide-react";
import {
  WarmupStatusWithOverride,
  WarmupPhase,
  QuotaLimits,
} from "@/types/quota";

interface WarmupStatusCardProps {
  integrationId: string;
  warmupStatus: WarmupStatusWithOverride | null;
  isLoading: boolean;
  onOverrideToggle: (override: boolean) => Promise<void>;
}

// Phase configuration for display
const phaseConfig: Record<
  WarmupPhase,
  { label: string; limitPercent: number; totalDays: number }
> = {
  INITIAL: { label: "Initial", limitPercent: 25, totalDays: 3 },
  RAMPING: { label: "Ramping Up", limitPercent: 50, totalDays: 3 },
  BUILDING: { label: "Building", limitPercent: 75, totalDays: 7 },
  MATURE: { label: "Mature", limitPercent: 100, totalDays: 0 },
};

// Format quota limit key to display label
const formatLimitLabel = (key: keyof QuotaLimits): string => {
  const labels: Record<keyof QuotaLimits, string> = {
    connectionRequestLimit: "Connections",
    connectionByEmailLimit: "Email Connections",
    messageLimit: "Messages",
    profileViewLimit: "Profile Views",
    skillEndorseLimit: "Endorsements",
    likeLimit: "Likes",
    profileFollowLimit: "Follows",
    inmailLimit: "InMails",
  };
  return labels[key] || key;
};

// Keys to hide from the warmup display (not relevant for campaign settings)
const HIDDEN_LIMIT_KEYS: (keyof QuotaLimits)[] = [
  "connectionByEmailLimit",
  "profileViewLimit",
];

const WarmupStatusCard: React.FC<WarmupStatusCardProps> = ({
  integrationId,
  warmupStatus,
  isLoading,
  onOverrideToggle,
}) => {
  const [isToggling, setIsToggling] = useState(false);

  // Handle override toggle with loading state
  const handleOverrideToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onOverrideToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Warmup Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">
            Loading warmup status...
          </span>
        </CardContent>
      </Card>
    );
  }

  // No warmup status available
  if (!warmupStatus) {
    return (
      <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Warmup Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">
            Warmup status is not available for this integration.
          </p>
        </CardContent>
      </Card>
    );
  }

  const {
    phase,
    accountAgeDays,
    daysInCurrentPhase,
    progressPercent,
    warmupOverride,
    effectiveLimits,
    baseLimits,
    currentLimits,
  } = warmupStatus;
  const config = phaseConfig[phase];

  // Calculate days display
  const getPhaseDayDisplay = (): string => {
    if (phase === "MATURE") {
      return "Warmup Complete";
    }
    const totalDaysInPhase = config.totalDays;
    return `Day ${daysInCurrentPhase + 1} of ${totalDaysInPhase}`;
  };

  // Check if account is new (< 7 days old) for warning
  const isNewAccount = accountAgeDays < 7;

  // Get the limits to display (effective limits respect override status)
  const displayLimits = effectiveLimits;
  const limitKeys = Object.keys(displayLimits) as (keyof QuotaLimits)[];

  // Filter to show only non-zero limits and exclude hidden keys
  const activeQuotaKeys = limitKeys.filter(
    key => baseLimits[key] > 0 && !HIDDEN_LIMIT_KEYS.includes(key)
  );

  return (
    <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Warmup Status
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Account warmup protects your LinkedIn account from restrictions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Phase and Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phase:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {config.label}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({getPhaseDayDisplay()})
              </span>
            </div>
            <span className="text-sm font-medium text-primary">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Limits - Compact Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Daily Limits
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                warmupOverride
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {warmupOverride
                ? "Full Quota"
                : `${config.limitPercent}% Capacity`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {activeQuotaKeys.map(key => {
              const effectiveValue = displayLimits[key];
              const baseValue = baseLimits[key];
              const percentage =
                baseValue > 0
                  ? Math.round((effectiveValue / baseValue) * 100)
                  : 0;
              return (
                <div
                  key={key}
                  className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {effectiveValue}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {formatLimitLabel(key)}
                  </span>
                  {!warmupOverride && (
                    <div className="w-full mt-1">
                      <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Override Toggle Section */}
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <Label
                htmlFor="warmup-override"
                className="text-sm font-medium text-amber-800 dark:text-amber-200 cursor-pointer"
              >
                Override Warmup
              </Label>
            </div>
            <Switch
              id="warmup-override"
              checked={warmupOverride}
              onCheckedChange={handleOverrideToggle}
              disabled={isToggling}
            />
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Use full quota limits (not recommended for new accounts - risk of
            LinkedIn restrictions)
          </p>
        </div>

        {/* Warning for new accounts */}
        {isNewAccount && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>New Account Warning:</strong> Your LinkedIn account is
              only {accountAgeDays} {accountAgeDays === 1 ? "day" : "days"} old.
              LinkedIn is more likely to restrict new accounts that exceed
              normal activity levels. We recommend keeping warmup enabled until
              your account is at least 14 days old.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default WarmupStatusCard;
