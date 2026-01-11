"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { ArrowLeft, Linkedin, AlertTriangle } from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import HorizontalStepper from "@/components/campaign/HorizontalStepper";

// Step components
import IntegrationStep from "./steps/IntegrationStep";
import AddLeadsStep from "./steps/AddLeadsStep";
import SelectSequenceStep from "./steps/SelectSequenceStep";
import ScheduleCampaignStep from "./steps/ScheduleCampaignStep";
import QuotaStep from "./steps/QuotaStep";

// Types
export type RoleType = "FULL_PERMISSION" | "RESTRICTED" | "READ_ONLY";
export type ProcessStatus = "PENDING" | "PROCESSING" | "PROCESSED" | "PAUSED";
export type Status = "DRAFT" | "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED";

interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
  status: Status;
  process_status: ProcessStatus;
  is_locked: boolean;
  sequence_id: string;
  skip_lead_conditions: string[];
  target_leads_id: string | null;
  target_leads_count: number | null;
  work_calender_id: string | null;
  integration_id: string | null;
  launched_at: Date | null;
  created_at: Date;
  daily_engine_quota: any | null;
  loading?: boolean | null;
  campaign_stats: any | null;
  is_archived: boolean;
}

export const steps = [
  { label: "LinkedIn Senders", editLabel: "Edit senders", icon: "1" },
  { label: "Leads", editLabel: "Edit leads", icon: "2" },
  { label: "Sequence", editLabel: "Edit sequence", icon: "3" },
  { label: "Schedule", editLabel: "Edit schedule", icon: "4" },
  { label: "Quota", editLabel: "Edit quota", icon: "5" },
];

// Helper functions
const getRoleType = (campaign: Campaign | null): RoleType | null => {
  if (campaign) {
    switch (campaign.process_status) {
      case "PROCESSED":
        return "READ_ONLY";
      case "PENDING":
        return "FULL_PERMISSION";
      case "PROCESSING":
        return "RESTRICTED";
      case "PAUSED":
        return "RESTRICTED";
      default:
        return "FULL_PERMISSION";
    }
  } else {
    return null;
  }
};

const getStepNumber = (stepType: string) => {
  switch (stepType) {
    case "integration":
      return 1;
    case "lead":
      return 2;
    case "sequence":
      return 3;
    case "schedule":
      return 4;
    case "quota":
      return 5;
    case "launch":
      return 6;
    default:
      return 1;
  }
};

const getStepType = (step: number) => {
  switch (step) {
    case 1:
      return "integration";
    case 2:
      return "lead";
    case 3:
      return "sequence";
    case 4:
      return "schedule";
    case 5:
      return "quota";
    default:
      return "integration";
  }
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const { query } = router;
  const camp_id = query.id as string;
  const paramStep = query.step as string;
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [newCampaign, setNewCampaign] = useState<Campaign | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch campaign data
  const fetchCampaign = useCallback(async () => {
    if (!camp_id) return;

    setIsLoading(true);
    try {
      const { data, status } = await apiCall({
        url: `/api/outreach/campaign/getCampaign`,
        method: "post",
        body: { camp_id },
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        setNewCampaign(data);
        const userRole = getRoleType(data);
        setRole(userRole);

        // Initialize completed steps based on campaign data
        const completed = new Set<number>();
        if (data.integration_id) completed.add(1);
        if (data.target_leads_id) completed.add(2);
        if (data.sequence_id) completed.add(3);
        if (data.work_calender_id) completed.add(4);
        if (data.daily_engine_quota) completed.add(5);
        setCompletedSteps(completed);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  }, [camp_id]);

  // Handle initial redirect to step 1 if no step parameter
  useEffect(() => {
    if (camp_id && !hasRedirected) {
      if (!paramStep) {
        setHasRedirected(true);
        router.push(
          {
            pathname: `/outreach/campaigns/${camp_id}/create`,
            query: { step: "integration" },
          },
          undefined,
          { shallow: true }
        );
      } else {
        const currentStep = getStepNumber(paramStep);
        setActiveStep(currentStep);
        setIsInitialized(true);
        setHasRedirected(true);
      }
    }
  }, [camp_id, paramStep, router, hasRedirected]);

  useEffect(() => {
    if (camp_id && !newCampaign) {
      fetchCampaign();
    }
  }, [camp_id, newCampaign, fetchCampaign]);

  // Handle step parameter changes after initialization
  useEffect(() => {
    if (paramStep && isInitialized) {
      const currentStep = getStepNumber(paramStep);
      if (activeStep !== currentStep) {
        setActiveStep(currentStep);
      }
    }
  }, [paramStep, isInitialized, activeStep]);

  const next = useCallback(() => {
    const nextStep = activeStep + 1;
    if (nextStep <= steps.length) {
      setCompletedSteps(prev => new Set([...prev, activeStep]));
      const stepType = getStepType(nextStep);
      router.push(
        {
          pathname: `/outreach/campaigns/${camp_id}/create`,
          query: { step: stepType },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [activeStep, camp_id, router]);

  const back = useCallback(() => {
    const prevStep = activeStep - 1;
    if (prevStep >= 1) {
      const stepType = getStepType(prevStep);
      router.push(
        {
          pathname: `/outreach/campaigns/${camp_id}/create`,
          query: { step: stepType },
        },
        undefined,
        { shallow: true }
      );
    }
  }, [activeStep, camp_id, router]);

  const navigateToStep = useCallback(
    (stepNumber: number) => {
      if (stepNumber >= 1 && stepNumber <= steps.length) {
        const stepType = getStepType(stepNumber);
        router.push(
          {
            pathname: `/outreach/campaigns/${camp_id}/create`,
            query: { step: stepType },
          },
          undefined,
          { shallow: true }
        );
      }
    },
    [camp_id, router]
  );

  const handleBackClick = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const handleKeepDraft = useCallback(() => {
    setShowExitDialog(false);
    router.push("/outreach/campaigns");
  }, [router]);

  const handleDeleteCampaign = useCallback(async () => {
    if (!camp_id) return;

    setIsDeleting(true);
    try {
      const { status } = await apiCall({
        url: `/api/outreach/campaign/deleteCampaign`,
        method: "delete",
        body: { id: camp_id },
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        setShowExitDialog(false);
        router.push("/outreach/campaigns");
      }
    } catch (error) {
    } finally {
      setIsDeleting(false);
    }
  }, [camp_id, router]);

  const getStepContent = (step: number) => {
    if (role) {
      switch (step) {
        case 1:
          return (
            <IntegrationStep campaignId={camp_id} next={next} role={role} />
          );
        case 2:
          return (
            <AddLeadsStep
              campaignId={camp_id}
              next={next}
              back={back}
              role={role}
              campaign={newCampaign}
            />
          );
        case 3:
          return (
            <SelectSequenceStep
              campaignId={camp_id}
              next={next}
              back={back}
              role={role}
            />
          );
        case 4:
          return (
            <ScheduleCampaignStep
              campaignId={camp_id}
              next={next}
              back={back}
              role={role}
            />
          );
        case 5:
          return (
            <QuotaStep
              campaignId={camp_id}
              next={next}
              back={back}
              role={role}
              campaign={newCampaign}
            />
          );
        default:
          return null;
      }
    }
  };

  const renderContent = () => {
    if (!isInitialized || (!paramStep && !hasRedirected)) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
        </div>
      );
    }
    return getStepContent(activeStep);
  };

  return (
    <AuthGuard>
      <AppLayout activePage="Campaign">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          {/* Compact Header */}
          <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-14">
                {/* Left: Back button and title */}
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white -ml-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                      <Linkedin className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Create Campaign
                      </h1>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        LinkedIn Outreach
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Step indicator */}
                <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                  Step {activeStep} of {steps.length}
                </div>
              </div>
            </div>
          </div>

          {/* Horizontal Stepper */}
          <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 py-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <HorizontalStepper
                steps={steps}
                activeStep={activeStep}
                completedSteps={completedSteps}
                onStepClick={(stepNumber) => {
                  const isCompleted = completedSteps.has(stepNumber);
                  const isCurrent = stepNumber === activeStep;
                  if (isCompleted || isCurrent || stepNumber < activeStep) {
                    navigateToStep(stepNumber);
                  }
                }}
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm rounded-2xl overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-black dark:border-gray-700 dark:border-t-white"></div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Loading campaign...
                      </span>
                    </div>
                  </div>
                ) : (
                  renderContent()
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent className="sm:max-w-sm rounded-2xl">
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Icon */}
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              </div>

              {/* Question */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Save as draft?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your progress will be saved and you can continue later.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  onClick={handleDeleteCampaign}
                  disabled={isDeleting}
                  className="flex-1 rounded-xl"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Discard"
                  )}
                </Button>
                <Button
                  onClick={handleKeepDraft}
                  className="flex-1 bg-black hover:bg-black/90 dark:bg-white dark:hover:bg-gray-100 dark:text-black text-white rounded-xl"
                >
                  Save Draft
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </AuthGuard>
  );
}
