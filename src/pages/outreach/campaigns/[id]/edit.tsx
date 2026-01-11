"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { ArrowLeft, CheckCircle, Linkedin, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// interface Step {
//   id: number;
//   title: string;
//   description: string;
//   icon: React.ComponentType<{ className?: string }>;
//   completed: boolean;
//   current: boolean;
// }

export const steps = [
  { label: "Integration", editLabel: "Edit integration", icon: "1" },
  { label: "Add leads", editLabel: "Edit leads", icon: "2" },
  { label: "Create a sequence", editLabel: "Edit sequence", icon: "3" },
  { label: "Select schedule", editLabel: "Edit schedule", icon: "4" },
  { label: "Set quota", editLabel: "Edit quota", icon: "5" },
];

// Helper functions from red-panda
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
  const [activeStep, setActiveStep] = useState<number>(1); // Always start at step 1
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set()); // Track completed steps
  const [newCampaign, setNewCampaign] = useState<Campaign | null>(null);
  const [role, setRole] = useState<RoleType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );
  const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);

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
        // No step parameter, redirect to step 1
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
        // We have a step parameter, update activeStep and mark as initialized
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

  const progress = useMemo(() => {
    return ((activeStep - 1) / (steps.length - 1)) * 100;
  }, [activeStep]);

  const next = useCallback(() => {
    const nextStep = activeStep + 1;
    if (nextStep <= steps.length) {
      // Mark current step as completed when moving to next
      setCompletedSteps(prev => new Set([...prev, activeStep]));

      const stepType = getStepType(nextStep);
      // Allow internal navigation without triggering exit modal
      setShouldBlockNavigation(false);
      router.push(
        {
          pathname: `/outreach/campaigns/${camp_id}/edit`,
          query: { step: stepType },
        },
        undefined,
        { shallow: true }
      );
      // Re-enable blocking shortly after navigation settles
      setTimeout(() => setShouldBlockNavigation(true), 300);
    }
  }, [activeStep, camp_id, router]);

  const back = useCallback(() => {
    const prevStep = activeStep - 1;
    if (prevStep >= 1) {
      const stepType = getStepType(prevStep);
      setShouldBlockNavigation(false);
      router.push(
        {
          pathname: `/outreach/campaigns/${camp_id}/edit`,
          query: { step: stepType },
        },
        undefined,
        { shallow: true }
      );
      setTimeout(() => setShouldBlockNavigation(true), 300);
    } else {
      // If going back from step 1, redirect to campaigns list
      setShouldBlockNavigation(false);
      router.push("/outreach/campaigns");
      setTimeout(() => setShouldBlockNavigation(true), 300);
    }
  }, [activeStep, camp_id, router]);

  const navigateToStep = useCallback(
    (stepNumber: number) => {
      if (stepNumber >= 1 && stepNumber <= steps.length) {
        const stepType = getStepType(stepNumber);
        setShouldBlockNavigation(false);
        router.push(
          {
            pathname: `/outreach/campaigns/${camp_id}/edit`,
            query: { step: stepType },
          },
          undefined,
          { shallow: true }
        );
        setTimeout(() => setShouldBlockNavigation(true), 300);
      }
    },
    [camp_id, router]
  );

  const handleBackClick = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const handleCancelExit = useCallback(() => {
    setShowExitDialog(false);
    setPendingNavigation(null);
  }, []);

  const handleKeepDraft = useCallback(() => {
    setShouldBlockNavigation(false);
    setShowExitDialog(false);
    const targetUrl = pendingNavigation || "/outreach/campaigns";
    setPendingNavigation(null);
    const safeUrl = targetUrl.includes("?")
      ? `${targetUrl}&skipGuard=1`
      : `${targetUrl}?skipGuard=1`;
    setTimeout(() => {
      router.push(safeUrl);
    }, 0);
  }, [router, pendingNavigation]);

  const handleDiscardChanges = useCallback(() => {
    // Simply navigate away without saving or archiving - just discard current step changes
    setShouldBlockNavigation(false);
    setShowExitDialog(false);
    const targetUrl = pendingNavigation || "/outreach/campaigns";
    setPendingNavigation(null);
    const safeUrl = targetUrl.includes("?")
      ? `${targetUrl}&skipGuard=1`
      : `${targetUrl}?skipGuard=1`;
    setTimeout(() => {
      router.push(safeUrl);
    }, 0);
  }, [router, pendingNavigation]);

  // Block navigation when user tries to leave the page
  useEffect(() => {
    let isNavigatingAway = false;

    const handleRouteChangeStart = (url: string) => {
      // Allow navigation within the same edit page (step changes)
      if (url.includes(`/outreach/campaigns/${camp_id}/edit`)) {
        return;
      }

      // Allow explicit skip via query flag (used by save/update flows)
      if (url.includes("skipGuard=1")) {
        return;
      }

      // If navigation is already allowed (after user confirmation), proceed
      if (!shouldBlockNavigation) {
        return;
      }

      // Prevent navigation
      isNavigatingAway = true;
      setPendingNavigation(url);
      setShowExitDialog(true);

      // Cancel navigation by replacing with current route
      setTimeout(() => {
        router.replace(router.pathname, router.asPath, { shallow: true });
      }, 0);
    };

    // Handle browser back button using Next.js beforePopState
    router.beforePopState(({ url, as, options }) => {
      if (shouldBlockNavigation) {
        const targetUrl = as || url;
        setPendingNavigation(targetUrl);
        setShowExitDialog(true);
        return false; // Prevent navigation
      }
      return true; // Allow navigation
    });

    // Handle browser beforeunload (for page refresh/close)
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldBlockNavigation) {
        event.preventDefault();
        event.returnValue = "";
        return "";
      }
    };

    if (router.events) {
      router.events.on("routeChangeStart", handleRouteChangeStart);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (router.events) {
        router.events.off("routeChangeStart", handleRouteChangeStart);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Cleanup beforePopState
      router.beforePopState(() => true);
    };
  }, [router, camp_id, shouldBlockNavigation]);

  const getStepContent = (step: number) => {
    if (role) {
      switch (step) {
        case 1:
          return (
            <IntegrationStep
              campaignId={camp_id}
              next={next}
              role={role}
              isEditMode={true}
            />
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
    // Show loading until properly initialized or if we're redirecting
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-950 dark:to-black">
          {/* Header */}
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBackClick}
                    className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center dark:bg-white">
                      <Linkedin className="w-4 h-4 text-white dark:text-black" />
                    </div>
                    <div>
                      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Edit LinkedIn Campaign
                      </h1>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Modify your outreach campaign
                      </p>
                      {/* {camp_id && (
                        <p className="text-xs text-gray-500 mt-1">
                          Campaign ID: {camp_id}
                        </p>
                      )} */}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge
                    variant="outline"
                    className="text-gray-600 border-gray-300 dark:text-gray-300 dark:border-gray-700"
                  >
                    Step {activeStep} of {steps.length}
                  </Badge>
                  <div className="w-32">
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w- mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Stepper Sidebar */}
              <div className="lg:col-span-1">
                <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl w-full h-fit sticky top-8">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Campaign Setup
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 flex-1">
                    {steps.map((step, index) => {
                      const stepNumber = index + 1;
                      const isCompleted = completedSteps.has(stepNumber);
                      const isCurrent = index === activeStep - 1;

                      return (
                        <div
                          key={stepNumber}
                          onClick={() => {
                            // Allow navigation to any step that is completed, current, or any previous step
                            if (
                              isCompleted ||
                              isCurrent ||
                              stepNumber < activeStep
                            ) {
                              navigateToStep(stepNumber);
                            }
                          }}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200",
                            isCurrent
                              ? "bg-gray-100 border border-gray-300 dark:bg-gray-800 dark:border-gray-700"
                              : isCompleted || stepNumber < activeStep
                                ? "bg-gray-100 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                                : "bg-gray-50 border border-gray-200 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:hover:bg-gray-800",
                            isCompleted || isCurrent || stepNumber < activeStep
                              ? "cursor-pointer"
                              : "cursor-not-allowed opacity-60"
                          )}
                        >
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                              isCurrent
                                ? "bg-black text-white dark:bg-white dark:text-black"
                                : isCompleted || stepNumber < activeStep
                                  ? "bg-black text-white dark:bg-white dark:text-black"
                                  : "bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            )}
                          >
                            {isCompleted || stepNumber < activeStep ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              stepNumber
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                isCurrent
                                  ? "text-gray-900 dark:text-white"
                                  : isCompleted || stepNumber < activeStep
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-600 dark:text-gray-300"
                              )}
                            >
                              {step.label}
                            </p>
                          </div>
                          {(isCompleted || stepNumber < activeStep) && (
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-sm rounded-2xl w-full">
                  <CardContent className="p-8">
                    {isLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
                      </div>
                    ) : (
                      renderContent()
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Exit Confirmation Dialog */}
        <Dialog
          open={showExitDialog}
          onOpenChange={open => {
            if (!open) {
              handleCancelExit();
            }
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <div className="flex flex-col items-center space-y-6 py-6">
              {/* Icon */}
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>

              {/* Question */}
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Do you want to save the campaign?
                </h3>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <Button
                  onClick={handleKeepDraft}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-medium"
                >
                  YES
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDiscardChanges}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2 rounded-md font-medium"
                >
                  NO
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </AuthGuard>
  );
}
