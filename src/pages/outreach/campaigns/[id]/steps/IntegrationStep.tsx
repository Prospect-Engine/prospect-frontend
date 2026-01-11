"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Linkedin, ArrowRight, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { toast } from "sonner";
import ProfileSelectionCard, { ProfileSelectionCardSkeleton } from "@/components/campaign/ProfileSelectionCard";

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
  isEditMode?: boolean;
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

  const uniqueSelectedProfiles = useMemo(() => {
    return Array.from(new Set(selectedProfiles));
  }, [selectedProfiles]);

  const uniqueSelectedCount = uniqueSelectedProfiles.length;
  const isDisabled = role === "READ_ONLY" || uniqueSelectedCount === 0;

  // Combine all profiles (campaign integrations + available)
  const allProfiles = useMemo(() => {
    const profileMap = new Map<string, LinkedInProfile>();

    // Add campaign integrations first
    campaignIntegrations.forEach(p => profileMap.set(p.id, p));

    // Add available profiles (will overwrite if same ID)
    profiles.forEach(p => profileMap.set(p.id, p));

    return Array.from(profileMap.values());
  }, [profiles, campaignIntegrations]);

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
        toast.success("Integration saved successfully!");
        next();
      }
    } catch (err) {
      toast.error("Failed to save integration");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
          <Linkedin className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Select LinkedIn Profile
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
            Choose which LinkedIn account to use for this campaign
          </p>
        </div>
      </div>

      {/* Profile List */}
      <div className="max-w-xl mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            <ProfileSelectionCardSkeleton />
            <ProfileSelectionCardSkeleton />
            <ProfileSelectionCardSkeleton />
          </div>
        ) : allProfiles.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
            <Linkedin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No LinkedIn profiles connected
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Connect a LinkedIn account to start creating campaigns
            </p>
            <Button
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => window.location.href = "/integration"}
            >
              Connect LinkedIn
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {allProfiles.map(profile => (
              <ProfileSelectionCard
                key={profile.id}
                profile={profile}
                isSelected={uniqueSelectedProfiles.includes(profile.id)}
                onSelect={handleProfileSelect}
                disabled={role === "READ_ONLY"}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          {/* Status message */}
          <div className="flex items-center gap-2">
            {uniqueSelectedCount > 0 ? (
              <>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {uniqueSelectedCount} profile{uniqueSelectedCount > 1 ? 's' : ''} selected
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-amber-600 dark:text-amber-400">
                  Select a profile to continue
                </span>
              </>
            )}
          </div>

          {/* Continue button */}
          <Button
            onClick={handleContinue}
            disabled={isDisabled || isSaving}
            className="bg-black hover:bg-black/90 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white rounded-xl px-6 min-w-[140px]"
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
      </div>
    </div>
  );
}
