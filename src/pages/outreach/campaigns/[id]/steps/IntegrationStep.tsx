"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Linkedin,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Clock,
  Info,
  Crown,
  Users,
} from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface LinkedInProfile {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  is_connected: boolean;
  connection_status: "active" | "inactive" | "error";
  last_sync?: string;
  is_premium: boolean;
  daily_limit?: number;
  campaigns_count?: number;
}

interface IntegrationStepProps {
  campaignId: string;
  next: () => void;
  back?: () => void;
  role: "FULL_PERMISSION" | "RESTRICTED" | "READ_ONLY";
  isEditMode?: boolean;
}

export default function IntegrationStep({
  campaignId,
  next,
  back,
  role,
  isEditMode = false,
}: IntegrationStepProps) {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [campaignIntegrations, setCampaignIntegrations] = useState<LinkedInProfile[]>([]);

  // Fetch available profiles and campaign integrations
  const fetchProfiles = async () => {
    setIsLoading(true);
    try {
      // Fetch available profiles from integration list
      const { data: availableData, status: availableStatus } = await apiCall({
        url: "/api/integration/list",
        method: "get",
        applyDefaultDomain: false,
      });

      // Fetch campaign integrations
      const { data: campaignData, status: campaignStatus } = await apiCall({
        url: "/api/outreach/campaign/integrationStep/getIntegrations",
        method: "post",
        applyDefaultDomain: false,
        body: {
          camp_id: campaignId,
        },
      });

      if (isSuccessful(availableStatus)) {
        const normalized: LinkedInProfile[] = (
          Array.isArray(availableData)
            ? availableData
            : availableData?.integrations || []
        )
          .filter((item: any) => item?.type === "LINKEDIN")
          .map((item: any) => ({
            id: item.id,
            name: item.account_name || item.name || item.email,
            email: item.email,
            profile_picture: item.propic_url,
            is_connected: item.connection_status === "CONNECTED",
            connection_status:
              item.connection_status === "CONNECTED"
                ? "active"
                : item.connection_status === "DISCONNECTED"
                  ? "inactive"
                  : "error",
            last_sync: undefined,
            is_premium: Boolean(item.is_premium),
            daily_limit: item.daily_limit || 40,
            campaigns_count: item.campaigns_count || 0,
          }));

        setProfiles(normalized);
      } else {
        setProfiles([]);
      }

      if (isSuccessful(campaignStatus)) {
        const responseData =
          campaignData?.data?.data || campaignData?.data || {};
        const integrations = responseData?.integrations || [];
        const campaignIntegrationsNormalized: LinkedInProfile[] = integrations
          .filter((item: any) => item?.type === "LINKEDIN")
          .map((item: any) => ({
            id: item.id,
            name: item.full_name || item.username || "Unknown User",
            email: item.username,
            profile_picture: item.propic_url || undefined,
            is_connected: item.connection_status === "CONNECTED",
            connection_status:
              item.connection_status === "CONNECTED"
                ? "active"
                : item.connection_status === "DISCONNECTED"
                  ? "inactive"
                  : "error",
            last_sync: undefined,
            is_premium: Boolean(item.is_premium),
            daily_limit: item.daily_limit || 40,
            campaigns_count: item.campaigns_count || 0,
          }));

        setCampaignIntegrations(campaignIntegrationsNormalized);
        const existingIntegrationIds = campaignIntegrationsNormalized.map(
          profile => profile.id
        );
        const uniqueIntegrationIds = Array.from(new Set(existingIntegrationIds));
        setSelectedProfiles(uniqueIntegrationIds);
      } else {
        setCampaignIntegrations([]);
        setSelectedProfiles([]);
      }
    } catch (error) {
      setProfiles([]);
      setCampaignIntegrations([]);
      setSelectedProfiles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfiles(prev => {
      const uniquePrev = Array.from(new Set(prev));
      if (uniquePrev.includes(profileId)) {
        return uniquePrev.filter(id => id !== profileId);
      } else {
        return [...uniquePrev, profileId];
      }
    });
  };

  const handleSelectAll = () => {
    const activeProfiles = allProfiles.filter(
      p => p.is_connected && p.connection_status === "active"
    );
    if (selectedProfiles.length === activeProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(activeProfiles.map(p => p.id));
    }
  };

  const uniqueSelectedProfiles = useMemo(() => {
    return Array.from(new Set(selectedProfiles));
  }, [selectedProfiles]);

  const uniqueSelectedCount = uniqueSelectedProfiles.length;
  const isDisabled = role === "READ_ONLY" || uniqueSelectedCount === 0;

  // Combine all profiles (campaign integrations + available)
  const allProfiles = useMemo(() => {
    const profileMap = new Map<string, LinkedInProfile>();
    campaignIntegrations.forEach(p => profileMap.set(p.id, p));
    profiles.forEach(p => profileMap.set(p.id, p));
    return Array.from(profileMap.values());
  }, [profiles, campaignIntegrations]);

  const activeProfilesCount = allProfiles.filter(
    p => p.is_connected && p.connection_status === "active"
  ).length;

  const handleContinue = async () => {
    if (uniqueSelectedProfiles.length === 0) return;

    if (isEditMode) {
      next();
      return;
    }

    setIsSaving(true);
    try {
      const { status } = await apiCall({
        url: "/api/outreach/campaign/integrationStep/addIntregrationToCampaign",
        method: "post",
        applyDefaultDomain: false,
        body: {
          campaignId: campaignId,
          integration_ids: uniqueSelectedProfiles,
        },
      });

      if (isSuccessful(status)) {
        toast.success("LinkedIn senders saved successfully!");
        next();
      }
    } catch (err) {
      toast.error("Failed to save senders");
    } finally {
      setIsSaving(false);
    }
  };

  // Skeleton loader for table rows
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4].map(i => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-28" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </td>
          <td className="px-4 py-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </td>
          <td className="px-4 py-4">
            <div className="flex gap-2">
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back && (
            <Button
              variant="outline"
              size="sm"
              onClick={back}
              className="rounded-lg"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Linkedin className="w-5 h-5 text-blue-600" />
              LinkedIn Senders
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              Select LinkedIn accounts to use in this campaign
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3.5 h-3.5 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">
                      You can select multiple accounts to distribute your outreach
                      and increase daily sending capacity.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </p>
          </div>
        </div>

        <Button
          onClick={handleContinue}
          disabled={isDisabled || isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left w-12">
                <Checkbox
                  checked={
                    activeProfilesCount > 0 &&
                    selectedProfiles.length === activeProfilesCount
                  }
                  onCheckedChange={handleSelectAll}
                  disabled={activeProfilesCount === 0}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  LinkedIn Subscription
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Campaigns
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                  Configure
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <TableSkeleton />
            ) : allProfiles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <Linkedin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    No LinkedIn accounts connected
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Connect a LinkedIn account to start creating campaigns
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 rounded-lg"
                    onClick={() => window.location.href = "/integration"}
                  >
                    Connect LinkedIn
                  </Button>
                </td>
              </tr>
            ) : (
              allProfiles.map(profile => {
                const isSelected = uniqueSelectedProfiles.includes(profile.id);
                const isDisconnected = !profile.is_connected || profile.connection_status !== "active";

                return (
                  <tr
                    key={profile.id}
                    className={cn(
                      "transition-colors",
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/30",
                      isDisconnected && "opacity-50"
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => !isDisconnected && handleProfileSelect(profile.id)}
                        disabled={isDisconnected || role === "READ_ONLY"}
                        className="rounded"
                      />
                    </td>

                    {/* Name & Avatar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                            <AvatarImage src={profile.profile_picture} alt={profile.name} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                              {profile.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Status dot */}
                          <div
                            className={cn(
                              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900",
                              profile.connection_status === "active"
                                ? "bg-emerald-500"
                                : "bg-gray-400"
                            )}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {profile.name}
                            </span>
                            {profile.is_premium && (
                              <Crown className="w-4 h-4 text-amber-500" />
                            )}
                            {isDisconnected && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                                Disconnected
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            <span>up to {profile.daily_limit || 40} connections/day</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="w-3 h-3 text-gray-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Daily connection request limit</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* LinkedIn Subscription */}
                    <td className="px-4 py-4">
                      <span className={cn(
                        "text-sm",
                        profile.is_premium
                          ? "text-amber-600 dark:text-amber-400 font-medium"
                          : "text-gray-600 dark:text-gray-400"
                      )}>
                        {profile.is_premium ? "Premium Account" : "Free Account"}
                      </span>
                    </td>

                    {/* Campaigns */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          In{" "}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {profile.campaigns_count || 0}
                          </span>{" "}
                          campaign{(profile.campaigns_count || 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>

                    {/* Configure */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Settings coming soon");
                                }}
                              >
                                <Settings className="w-4 h-4 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Account Settings</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="w-9 h-9 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toast.info("Schedule settings coming soon");
                                }}
                              >
                                <Clock className="w-4 h-4 text-gray-500" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Schedule Settings</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Status */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          {uniqueSelectedCount > 0 ? (
            <>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {uniqueSelectedCount} sender{uniqueSelectedCount > 1 ? "s" : ""} selected
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-amber-600 dark:text-amber-400">
                Select at least one sender to continue
              </span>
            </>
          )}
        </div>

        <span className="text-xs text-gray-400">
          {allProfiles.length} account{allProfiles.length !== 1 ? "s" : ""} available
        </span>
      </div>
    </div>
  );
}
