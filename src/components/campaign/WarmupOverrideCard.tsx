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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Zap,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface IntegrationWarmupDetail {
  integration_id: string;
  username: string;
  account_age_days: number;
  warmup_phase: "INITIAL" | "RAMPING" | "BUILDING" | "MATURE";
  warmup_override: boolean;
  effective_limits: {
    connection_request_limit: number;
    message_limit: number;
    profile_view_limit: number;
    skill_endorse_limit: number;
    like_limit: number;
    profile_follow_limit: number;
    inmail_limit: number;
  };
  base_limits: {
    connection_request_limit: number;
    message_limit: number;
    profile_view_limit: number;
    skill_endorse_limit: number;
    like_limit: number;
    profile_follow_limit: number;
    inmail_limit: number;
  };
}

interface WarmupOverrideCardProps {
  campaignId: string;
  warmupOverrideEnabled: boolean;
  integrations: IntegrationWarmupDetail[];
  aggregateStatus: {
    all_mature: boolean;
    in_warmup_count: number;
    mature_count: number;
  };
  onToggle: (enabled: boolean) => Promise<void>;
  isLoading?: boolean;
}

const phaseLabels = {
  INITIAL: "Initial",
  RAMPING: "Ramping Up",
  BUILDING: "Building",
  MATURE: "Mature",
};

const WarmupOverrideCard: React.FC<WarmupOverrideCardProps> = ({
  campaignId,
  warmupOverrideEnabled,
  integrations,
  aggregateStatus,
  onToggle,
  isLoading = false,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if any integration is < 7 days old
  const hasNewAccounts = integrations.some(i => i.account_age_days < 7);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Warmup Override
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

  return (
    <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Warmup Override
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {aggregateStatus.in_warmup_count > 0
                ? `${aggregateStatus.in_warmup_count}/${integrations.length} integration${integrations.length > 1 ? "s" : ""} in warmup phase`
                : "All integrations are in mature phase"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unified Toggle */}
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="warmup-override-unified"
                className="text-sm font-medium text-amber-800 dark:text-amber-200 cursor-pointer"
              >
                Override Warmup for All Integrations
              </Label>
            </div>
            <Switch
              id="warmup-override-unified"
              checked={warmupOverrideEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Use full quota limits for all integrations (not recommended for new
            accounts - risk of LinkedIn restrictions)
          </p>
        </div>

        {/* Warning for new accounts */}
        {hasNewAccounts && warmupOverrideEnabled && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Warning:</strong> Some integrations are less than 7 days
              old. LinkedIn is more likely to restrict new accounts that exceed
              normal activity levels.
            </AlertDescription>
          </Alert>
        )}

        {/* Per-Integration Breakdown (Collapsible) */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <span>Per-Integration Details</span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>

          {showDetails && (
            <div className="space-y-3 pt-2">
              {integrations.map(integration => (
                <div
                  key={integration.integration_id}
                  className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {integration.username}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {phaseLabels[integration.warmup_phase]} •{" "}
                        {integration.account_age_days} days old
                      </span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        integration.warmup_override
                          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                      }`}
                    >
                      {integration.warmup_override
                        ? "Override Active"
                        : "Warmup Active"}
                    </span>
                  </div>

                  {integration.account_age_days < 7 && (
                    <div className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      New account - high restriction risk
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WarmupOverrideCard;
