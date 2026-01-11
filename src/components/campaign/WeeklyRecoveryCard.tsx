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
import { Calendar, Loader2, Info } from "lucide-react";

interface IntegrationRecoveryDetail {
  integration_id: string;
  username: string;
  is_enabled: boolean;
  next_recovery_date?: string;
}

interface WeeklyRecoveryCardProps {
  campaignId: string;
  unifiedEnabled: boolean;
  integrations: IntegrationRecoveryDetail[];
  nextRecoveryDate?: string;
  onToggle: (enabled: boolean) => Promise<void>;
  isLoading?: boolean;
}

const WeeklyRecoveryCard: React.FC<WeeklyRecoveryCardProps> = ({
  campaignId,
  unifiedEnabled,
  integrations,
  nextRecoveryDate,
  onToggle,
  isLoading = false,
}) => {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    try {
      await onToggle(checked);
    } finally {
      setIsToggling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Quota Recovery
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">
            Loading recovery status...
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              Weekly Quota Recovery
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              Automatically restore unused quota at the end of each week
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Unified Toggle */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="weekly-recovery-unified"
                className="text-sm font-medium text-blue-800 dark:text-blue-200 cursor-pointer"
              >
                Enable Weekly Recovery for All Integrations
              </Label>
            </div>
            <Switch
              id="weekly-recovery-unified"
              checked={unifiedEnabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Unused quota will be recovered each week, allowing more flexible
            outreach scheduling
          </p>
        </div>

        {/* Next Recovery Date */}
        {unifiedEnabled && nextRecoveryDate && (
          <div className="flex items-start gap-2 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Next Recovery
              </span>
              <span className="text-xs text-blue-700 dark:text-blue-300">
                {formatDate(nextRecoveryDate)}
              </span>
            </div>
          </div>
        )}

        {/* Integration Status Summary */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {unifiedEnabled ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Recovery enabled for {integrations.length} integration
              {integrations.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Recovery disabled for all integrations
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeeklyRecoveryCard;
