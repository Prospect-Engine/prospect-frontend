"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Linkedin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { toast } from "sonner";

interface LinkedInProfile {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  is_connected: boolean;
  connection_status: "active" | "inactive" | "error";
  last_sync?: string;
  is_premium: boolean;
}

interface IntegrationStepProps {
  campaignId: string;
  next: () => void;
  back?: () => void;
  role: "FULL_PERMISSION" | "RESTRICTED" | "READ_ONLY";
  isEditMode?: boolean; // True when editing an existing launched campaign
}

export default function IntegrationStep({
  campaignId,
  next,
  role,
  isEditMode = false,
}: IntegrationStepProps) {
  const [profiles, setProfiles] = useState<LinkedInProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [campaignIntegrations, setCampaignIntegrations] = useState<
    LinkedInProfile[]
  >([]);

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
          }));

        setProfiles(normalized);
      } else {
        setProfiles([]);
      }

      if (isSuccessful(campaignStatus)) {
        // Handle both nested (campaignData.data.data) and flat (campaignData.data) structures
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
          }));

        setCampaignIntegrations(campaignIntegrationsNormalized);
        // Pre-select existing campaign integrations (deduplicate IDs)
        const existingIntegrationIds = campaignIntegrationsNormalized.map(
          profile => profile.id
        );
        // Remove duplicates to ensure unique selection
        const uniqueIntegrationIds = Array.from(
          new Set(existingIntegrationIds)
        );
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
      // Remove duplicates first
      const uniquePrev = Array.from(new Set(prev));
      if (uniquePrev.includes(profileId)) {
        // Remove if already selected
        return uniquePrev.filter(id => id !== profileId);
      } else {
        // Add if not selected
        return [...uniquePrev, profileId];
      }
    });
  };

  // Memoize unique selected profiles to avoid recalculating
  const uniqueSelectedProfiles = useMemo(() => {
    return Array.from(new Set(selectedProfiles));
  }, [selectedProfiles]);

  const uniqueSelectedCount = uniqueSelectedProfiles.length;
  const isDisabled = role === "READ_ONLY" || uniqueSelectedCount === 0;

  const handleContinue = async () => {
    if (uniqueSelectedProfiles.length === 0) return;

    // In edit mode (launched campaigns), skip the API call and just proceed
    // Integrations can only be changed for DRAFT campaigns
    if (isEditMode) {
      next();
      return;
    }

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
        toast.success("Integrations updated successfully!");
        next();
      }
    } catch (err) {
      toast.error("Failed to update integrations");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 dark:text-gray-200">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
          <Linkedin className="w-6 h-6 text-blue-600 dark:text-blue-300" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
          Select LinkedIn Profiles
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto px-4">
          Choose one or more LinkedIn profiles to use for this campaign.
          {/* You can select multiple profiles to distribute your outreach. */}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto px-4 w-full">
        {/* Left Side - Simple List (Sidebar) */}
        <div className="space-y-3 lg:col-span-1">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Available Profiles
          </h3>
          <div className="max-h-80 sm:max-h-96 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
            {profiles.map(profile => (
              <div
                key={profile.id}
                className={cn(
                  "flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 border w-full",
                  selectedProfiles.includes(profile.id)
                    ? "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700",
                  !profile.is_connected ||
                    profile.connection_status !== "active"
                    ? "opacity-60 cursor-not-allowed"
                    : ""
                )}
                onClick={() => {
                  if (
                    profile.is_connected &&
                    profile.connection_status === "active"
                  ) {
                    handleProfileSelect(profile.id);
                  }
                }}
              >
                <Avatar className="w-6 h-6 sm:w-8 sm:h-8">
                  <AvatarImage src={profile.profile_picture} />
                  <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-xs">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-300" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <p className="text-xs sm:text-sm font-medium truncate">
                      {profile.name}
                    </p>
                    {profile.is_premium && (
                      <Badge
                        variant="outline"
                        className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                      >
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs opacity-75 truncate">{profile.email}</p>
                  <div className="flex items-center space-x-1 sm:space-x-2 mt-1">
                    {profile.is_connected &&
                      profile.connection_status === "active" && (
                        <Badge
                          variant="outline"
                          className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                        >
                          Connected
                        </Badge>
                      )}
                  </div>
                </div>

                {selectedProfiles.includes(profile.id) && (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Selected Profiles Grid */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Selected Profiles ({uniqueSelectedCount})
          </h3>
          <div className="max-h-80 sm:max-h-96 overflow-y-auto pr-2 hide-scrollbar">
            {uniqueSelectedCount > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                {uniqueSelectedProfiles.map(profileId => {
                  // First try to find in campaign integrations, then in available profiles
                  const profile =
                    campaignIntegrations.find(p => p.id === profileId) ||
                    profiles.find(p => p.id === profileId);
                  if (!profile) return null;

                  return (
                    <Card
                      key={`${profile.id}-${profileId}`}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow relative w-full"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleProfileSelect(profile.id)}
                        className="absolute top-1 right-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-4 w-4 p-0 z-10 text-xs"
                      >
                        ×
                      </Button>
                      <CardContent className="p-2 sm:p-3 pt-5 sm:pt-6 w-full">
                        <div className="flex flex-col items-center text-center space-y-1 sm:space-y-2">
                          <div className="relative">
                            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                              <AvatarImage src={profile.profile_picture} />
                              <AvatarFallback className="bg-gray-100 dark:bg-gray-700">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center justify-center space-x-1">
                              <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                                {profile.name}
                              </h4>
                              {profile.is_premium && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800"
                                >
                                  Premium
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                              {profile.email}
                            </p>
                            {profile.is_connected &&
                              profile.connection_status === "active" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-1 py-0 bg-green-50 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800"
                                >
                                  Connected
                                </Badge>
                              )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No profiles selected</p>
                <p className="text-xs">
                  Select profiles from the left to see them here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center border-t border-gray-200 justify-between pt-4 sm:pt-6 gap-3 sm:gap-0">
        <div className="text-sm text-gray-600">
          {uniqueSelectedCount > 0 ? (
            <span className="text-green-600 font-medium">
              ✓ {uniqueSelectedCount} profile
              {uniqueSelectedCount > 1 ? "s" : ""} selected
            </span>
          ) : (
            <span className="text-amber-600">
              ⚠ Please select at least one profile
            </span>
          )}
        </div>
        <Button
          onClick={handleContinue}
          disabled={isDisabled}
          className="bg-black hover:bg-black/90 disabled:opacity-50 text-white w-full sm:w-auto"
        >
          Next Step
        </Button>
      </div>
    </div>
  );
}
