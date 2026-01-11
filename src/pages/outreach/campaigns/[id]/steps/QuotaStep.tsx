"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  ChevronLeft,
  ChevronRight,
  Target,
  Info,
  Settings,
  Moon,
  Calendar,
  Loader2,
} from "lucide-react";
import QuotaComponent from "@/components/campaign/QuotaComponent";
import { DailyQuota, QuotaLimit, QuotaErrors } from "@/types/quota";
import { useRouter } from "next/router";
import { toast } from "sonner";

interface QuotaStepProps {
  campaignId: string;
  next: () => void;
  back: () => void;
  role: string;
  campaign: any;
}

export default function QuotaStep({ campaignId, next, back }: QuotaStepProps) {
  const router = useRouter();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Auto-Pause Settings state - will be populated from API
  const [autoPause, setAutoPause] = useState({
    enabled: true,
    onWeekends: false, // Will be set from campaign data
    onHolidays: false, // Will be set from weekly recovery status
  });

  // Quota state management - will be populated from API
  const [dailyQuota, setDailyQuota] = useState<DailyQuota>({
    connection_request_limit: 0,
    message_limit: 0,
    profile_view_limit: 0,
    skill_endorse_limit: 0,
    like_limit: 0,
    profile_follow_limit: 0,
    inmail_limit: 0,
  });

  const [quotaLimit, setQuotaLimit] = useState<QuotaLimit>({
    connection_request_limit: 0,
    message_limit: 0,
    profile_view_limit: 0,
    skill_endorse_limit: 0,
    like_limit: 0,
    profile_follow_limit: 0,
    inmail_limit: 0,
  });

  const [quotaErrors, setQuotaErrors] = useState<QuotaErrors>({});

  // Campaign data state
  const [campaignData, setCampaignData] = useState<any>(null);

  // Integration IDs from campaign (Task 3.1) - supports multiple integrations
  const [integrationIds, setIntegrationIds] = useState<string[]>([]);

  // Weekly recovery status per integration (keyed by integration ID)
  const [weeklyRecoveryStatus, setWeeklyRecoveryStatus] = useState<
    Record<string, boolean>
  >({});

  // Campaign name state for local editing
  const [campaignName, setCampaignName] = useState<string>("");

  // Fetch data from APIs on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      let fetchedCampaign: any = null;
      try {
        setIsLoading(true);

        // 1. Fetch campaign data first to get quota limits and settings
        const campaignResponse = await fetch(
          "/api/outreach/campaign/getCampaign",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ camp_id: campaignId }),
          }
        );

        if (campaignResponse.ok) {
          const responseData = await campaignResponse.json();
          // Handle wrapped response { success: true, data: {...} }
          fetchedCampaign = responseData.data || responseData;

          // Store campaign data for later use
          setCampaignData(fetchedCampaign);

          // Task 3.1: Extract ALL integration IDs from campaign data
          // For virtual campaigns, use planned_integrations array
          // For single integration campaigns, use integration_id
          const campaignIntegrationIds: string[] = fetchedCampaign
            .planned_integrations?.length
            ? fetchedCampaign.planned_integrations
            : fetchedCampaign.integration_id
              ? [fetchedCampaign.integration_id]
              : [];
          setIntegrationIds(campaignIntegrationIds);

          // Set campaign name for editing
          setCampaignName(fetchedCampaign.name || "");

          // Set onWeekends based on skip_lead_conditions
          setAutoPause(prev => ({
            ...prev,
            onWeekends:
              fetchedCampaign.skip_lead_conditions?.includes(
                "CAMPAIGN_DUPLICATE"
              ) || false,
          }));
        }

        // 2. Fetch quota status to get used quotas (for display purposes)
        const quotaResponse = await fetch(
          "/api/outreach/campaign/quotastep/getQuotaStatus",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (quotaResponse.ok) {
          const quotaData = await quotaResponse.json();
          const {
            used_daily_engine_quota,
            available_daily_engine_quota,
          }: {
            used_daily_engine_quota?: DailyQuota;
            available_daily_engine_quota?: QuotaLimit;
          } = quotaData;

          const isEditMode = Boolean(fetchedCampaign?.launched_at);
          const quotaFields: (keyof QuotaLimit)[] = [
            "connection_request_limit",
            "message_limit",
            "profile_view_limit",
            "skill_endorse_limit",
            "like_limit",
            "profile_follow_limit",
            "inmail_limit",
          ];

          const baseQuota: QuotaLimit = {
            connection_request_limit: 0,
            message_limit: 0,
            profile_view_limit: 0,
            skill_endorse_limit: 0,
            like_limit: 0,
            profile_follow_limit: 0,
            inmail_limit: 0,
          };

          const combinedQuota = quotaFields.reduce<QuotaLimit>(
            (acc, field) => {
              const usedValue =
                used_daily_engine_quota?.[field as keyof DailyQuota] || 0;
              const availableValue = available_daily_engine_quota?.[field] || 0;
              acc[field] = isEditMode
                ? usedValue + availableValue
                : availableValue;
              return acc;
            },
            { ...baseQuota }
          );

          // Set daily quota based on mode
          if (isEditMode && fetchedCampaign?.daily_engine_quota) {
            // In edit mode: pre-fill from campaign's saved quota
            setDailyQuota(fetchedCampaign.daily_engine_quota);
          } else if (used_daily_engine_quota) {
            // In create mode: use used quota as starting point (existing behavior)
            setDailyQuota(used_daily_engine_quota);
          }

          setQuotaLimit(combinedQuota);
        }

        // 3. Task 3.3 & 3.5: Fetch weekly quota recovery status for ALL integrations
        const weeklyRecoveryIntegrationIds: string[] = fetchedCampaign
          ?.planned_integrations?.length
          ? fetchedCampaign.planned_integrations
          : fetchedCampaign?.integration_id
            ? [fetchedCampaign.integration_id]
            : [];

        if (weeklyRecoveryIntegrationIds.length > 0) {
          // Fetch weekly recovery status for each integration
          const weeklyStatusMap: Record<string, boolean> = {};

          await Promise.all(
            weeklyRecoveryIntegrationIds.map(async (intId: string) => {
              try {
                const weeklyRecoveryResponse = await fetch(
                  `/api/outreach/campaign/quotastep/getWeeklyQoutaRecoveyStatus?integrationId=${intId}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );

                if (weeklyRecoveryResponse.ok) {
                  const weeklyData = await weeklyRecoveryResponse.json();
                  weeklyStatusMap[intId] = weeklyData.is_enabled || false;
                }
              } catch {
                // If fetch fails for one integration, set it to false
                weeklyStatusMap[intId] = false;
              }
            })
          );

          setWeeklyRecoveryStatus(weeklyStatusMap);

          // For backward compatibility: set onHolidays to true if ANY integration has weekly recovery enabled
          const anyEnabled = Object.values(weeklyStatusMap).some(
            enabled => enabled
          );
          setAutoPause(prev => ({
            ...prev,
            onHolidays: anyEnabled,
          }));
        }
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    if (campaignId) {
      fetchInitialData();
    }
  }, [campaignId]);

  // Check if quota limits are set
  const hasZeroQuotaLimit = !Object.values(quotaLimit).some(
    value => value !== 0
  );
  const hasQuotaErrors = Object.values(quotaErrors).some(error => error !== "");
  const hasCampaignName = campaignName && campaignName.trim() !== "";

  // Check if at least 1 daily action is set (sum of all daily quota values)
  const totalDailyActions = Object.values(dailyQuota).reduce(
    (sum, value) => sum + (value || 0),
    0
  );
  const hasMinimumDailyActions = totalDailyActions >= 1;

  const canProceed = !hasZeroQuotaLimit && !hasQuotaErrors && hasCampaignName;

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 dark:text-slate-200">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-slate-600 dark:text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              Loading quota settings...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveAndUpdate = async () => {
    try {
      // Check minimum daily actions requirement
      if (!hasMinimumDailyActions) {
        toast.error(
          "Please set at least 1 daily action to launch the campaign"
        );
        return;
      }

      // Check if this is a new campaign (not launched yet) or existing campaign
      const isNewCampaign = !campaignData?.launched_at;

      if (isNewCampaign) {
        // Determine if this is a virtual campaign (has planned integrations)
        const isVirtual = Boolean(
          campaignData?.is_virtual_parent ||
            (campaignData?.planned_integrations &&
              campaignData.planned_integrations.length > 0)
        );

        // Call the launch API for new campaigns
        const launchResponse = await fetch("/api/outreach/campaign/launch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            camp_id: campaignId,
            name: campaignName,
            skip_lead_conditions: autoPause.onWeekends
              ? ["CAMPAIGN_DUPLICATE"]
              : [],
            daily_engine_quota: dailyQuota,
            isVirtual,
          }),
        });

        if (launchResponse.ok) {
          const launchData = await launchResponse.json();

          toast.success("Campaign launched successfully!");
          router.push("/outreach/campaigns?skipGuard=1");
        } else {
          const errorData = await launchResponse.json();

          // Show error message from backend
          const errorMessage =
            errorData?.message || "Failed to launch campaign";
          toast.error(errorMessage);
        }
      } else {
        // Call the updateConfig API for existing campaigns
        const updateResponse = await fetch(
          "/api/outreach/campaign/quotastep/updateConfig",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              camp_id: campaignId,
              name: campaignName,
              skip_lead_conditions: autoPause.onWeekends
                ? ["CAMPAIGN_DUPLICATE"]
                : [],
              daily_engine_quota: dailyQuota,
            }),
          }
        );

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();

          toast.success("Campaign configuration updated successfully!");
          router.push("/outreach/campaigns?skipGuard=1");
        } else {
          const errorData = await updateResponse.json();

          // Show error message from backend
          const errorMessage =
            errorData?.message || "Failed to update campaign configuration";
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 dark:text-gray-200">
      {/* Campaign Name */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span>Campaign Details</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Give your campaign a name to identify it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label
              htmlFor="campaign-name"
              className="text-gray-700 dark:text-gray-300"
            >
              Campaign Name *
            </Label>
            <Input
              id="campaign-name"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="Enter campaign name"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Auto-Pause Settings */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span>Auto-Pause Settings</span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            Automatically pause your campaign under certain conditions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {autoPause.enabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <Label
                    htmlFor="pause-weekends"
                    className="text-gray-700 dark:text-gray-300"
                  >
                    Ignore if same leads found in other campaigns (Recommended)
                  </Label>
                </div>
                <Switch
                  id="pause-weekends"
                  checked={autoPause.onWeekends}
                  onCheckedChange={checked =>
                    setAutoPause({
                      ...autoPause,
                      onWeekends: checked,
                    })
                  }
                />
              </div>

              {/* Weekly Quota Recovery - per integration */}
              {integrationIds.length === 0 ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Label
                      htmlFor="pause-holidays"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Enable Weekly Quota Recovery
                    </Label>
                  </div>
                  <Switch id="pause-holidays" checked={false} disabled={true} />
                </div>
              ) : integrationIds.length === 1 ? (
                // Single integration: simple toggle
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Label
                      htmlFor="pause-holidays"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Enable Weekly Quota Recovery
                    </Label>
                  </div>
                  <Switch
                    id="pause-holidays"
                    checked={weeklyRecoveryStatus[integrationIds[0]] || false}
                    onCheckedChange={async checked => {
                      const intId = integrationIds[0];

                      // Optimistically update UI
                      setWeeklyRecoveryStatus(prev => ({
                        ...prev,
                        [intId]: checked,
                      }));
                      setAutoPause(prev => ({
                        ...prev,
                        onHolidays: checked,
                      }));

                      try {
                        const response = await fetch(
                          "/api/outreach/campaign/quotastep/toggleWeeklyQoutaRecovey",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              integrationId: intId,
                              isEnabled: checked,
                            }),
                          }
                        );

                        if (response.ok) {
                          toast.success(
                            checked
                              ? "Weekly quota recovery enabled"
                              : "Weekly quota recovery disabled"
                          );
                        } else {
                          // Revert on failure
                          setWeeklyRecoveryStatus(prev => ({
                            ...prev,
                            [intId]: !checked,
                          }));
                          setAutoPause(prev => ({
                            ...prev,
                            onHolidays: !checked,
                          }));
                          toast.error("Failed to update weekly quota recovery");
                        }
                      } catch {
                        // Revert on error
                        setWeeklyRecoveryStatus(prev => ({
                          ...prev,
                          [intId]: !checked,
                        }));
                        setAutoPause(prev => ({
                          ...prev,
                          onHolidays: !checked,
                        }));
                        toast.error("Failed to update weekly quota recovery");
                      }
                    }}
                  />
                </div>
              ) : (
                // Multiple integrations: show toggle per integration
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <Label className="text-gray-700 dark:text-gray-300">
                      Weekly Quota Recovery (per integration)
                    </Label>
                  </div>
                  <div className="ml-6 space-y-2">
                    {integrationIds.map((intId, index) => (
                      <div
                        key={intId}
                        className="flex items-center justify-between py-1"
                      >
                        <Label
                          htmlFor={`weekly-recovery-${intId}`}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          Integration {index + 1}
                        </Label>
                        <Switch
                          id={`weekly-recovery-${intId}`}
                          checked={weeklyRecoveryStatus[intId] || false}
                          onCheckedChange={async checked => {
                            // Optimistically update UI
                            setWeeklyRecoveryStatus(prev => ({
                              ...prev,
                              [intId]: checked,
                            }));

                            // Update global autoPause based on any enabled
                            const updatedStatus = {
                              ...weeklyRecoveryStatus,
                              [intId]: checked,
                            };
                            const anyEnabled = Object.values(
                              updatedStatus
                            ).some(enabled => enabled);
                            setAutoPause(prev => ({
                              ...prev,
                              onHolidays: anyEnabled,
                            }));

                            try {
                              const response = await fetch(
                                "/api/outreach/campaign/quotastep/toggleWeeklyQoutaRecovey",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    integrationId: intId,
                                    isEnabled: checked,
                                  }),
                                }
                              );

                              if (response.ok) {
                                toast.success(
                                  checked
                                    ? `Weekly quota recovery enabled for Integration ${index + 1}`
                                    : `Weekly quota recovery disabled for Integration ${index + 1}`
                                );
                              } else {
                                // Revert on failure
                                setWeeklyRecoveryStatus(prev => ({
                                  ...prev,
                                  [intId]: !checked,
                                }));
                                const revertedStatus = {
                                  ...weeklyRecoveryStatus,
                                  [intId]: !checked,
                                };
                                const revertedAnyEnabled = Object.values(
                                  revertedStatus
                                ).some(enabled => enabled);
                                setAutoPause(prev => ({
                                  ...prev,
                                  onHolidays: revertedAnyEnabled,
                                }));
                                toast.error(
                                  `Failed to update weekly quota recovery for Integration ${index + 1}`
                                );
                              }
                            } catch {
                              // Revert on error
                              setWeeklyRecoveryStatus(prev => ({
                                ...prev,
                                [intId]: !checked,
                              }));
                              const revertedStatus = {
                                ...weeklyRecoveryStatus,
                                [intId]: !checked,
                              };
                              const revertedAnyEnabled = Object.values(
                                revertedStatus
                              ).some(enabled => enabled);
                              setAutoPause(prev => ({
                                ...prev,
                                onHolidays: revertedAnyEnabled,
                              }));
                              toast.error(
                                `Failed to update weekly quota recovery for Integration ${index + 1}`
                              );
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quota Component - always show (warmup is always overridden by default) */}
      <QuotaComponent
        dailyQuota={dailyQuota}
        setDailyQuota={setDailyQuota}
        quotaLimit={quotaLimit}
        setQuotaLimit={setQuotaLimit}
        errors={quotaErrors}
        setErrors={setQuotaErrors}
        disabled={false}
      />

      {/* Additional Information */}
      <Card className="bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Info className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span>Quota Guidelines</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                Recommended Limits:
              </h4>
              <ul className="space-y-1">
                <li>• Connection requests: 50-100/day</li>
                <li>• Messages: 100-200/day</li>
                <li>• Profile views: 200-300/day</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-gray-900 dark:text-white">
                Best Practices:
              </h4>
              <ul className="space-y-1">
                <li>• Start with lower limits</li>
                <li>• Monitor LinkedIn&apos;s response</li>
                <li>• Adjust based on performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={back}
          className="flex items-center space-x-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Schedule</span>
        </Button>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {canProceed ? (
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✓{" "}
              {!campaignData?.launched_at
                ? "Ready to launch campaign"
                : "Ready to update campaign configuration"}
            </span>
          ) : (
            <span>
              {!hasCampaignName
                ? "Enter campaign name to continue"
                : !hasMinimumDailyActions
                  ? "Set at least 1 daily action to continue"
                  : "Ready to launch campaign"}
            </span>
          )}
        </div>
        <Button
          onClick={handleSaveAndUpdate}
          disabled={!canProceed}
          className="bg-black hover:bg-black/90 text-white px-8"
        >
          {!campaignData?.launched_at ? "Save and Launch" : "Save and Update"}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
