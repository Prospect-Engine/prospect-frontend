"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type HealthStatus = "HEALTHY" | "PARTIAL_ISSUES" | "ALL_DISCONNECTED";
type ConnectionStatus = "CONNECTED" | "DISCONNECTED";
type ProcessStatus = "PROCESSING" | "RECONNECTING" | "PAUSED";
type RecoveryStatus = "AUTO_RECONNECTING" | "MANUAL_REQUIRED" | null;

interface IntegrationHealth {
  integration_id: string;
  username: string;
  connection_status: ConnectionStatus;
  process_status: ProcessStatus;
  is_healthy: boolean;
  recovery_status?: RecoveryStatus;
  leads_total: number;
  leads_seq_started: number;
  leads_seq_not_started: number;
  available_actions: string[];
}

interface CampaignHealthSectionProps {
  campaignId: string;
  healthStatus: HealthStatus;
  integrations: IntegrationHealth[];
  aggregatedStats: {
    total_leads: number;
    leads_completed: number;
    leads_in_progress: number;
    leads_failed: number;
  };
  onRebalance?: () => Promise<void>;
  onRefresh?: () => void;
}

const CampaignHealthSection: React.FC<CampaignHealthSectionProps> = ({
  campaignId,
  healthStatus,
  integrations,
  aggregatedStats,
  onRebalance,
  onRefresh,
}) => {
  const [rebalanceDialogOpen, setRebalanceDialogOpen] = useState(false);
  const [rebalancingIntegrationId, setRebalancingIntegrationId] = useState<
    string | null
  >(null);
  const [isRebalancing, setIsRebalancing] = useState(false);

  const getHealthIcon = (status: HealthStatus) => {
    switch (status) {
      case "HEALTHY":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "PARTIAL_ISSUES":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "ALL_DISCONNECTED":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getHealthBadge = (status: HealthStatus) => {
    switch (status) {
      case "HEALTHY":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Healthy
          </Badge>
        );
      case "PARTIAL_ISSUES":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            Partial Issues
          </Badge>
        );
      case "ALL_DISCONNECTED":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            All Disconnected
          </Badge>
        );
    }
  };

  const getConnectionBadge = (status: ConnectionStatus) => {
    return status === "CONNECTED" ? (
      <Badge
        variant="outline"
        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
      >
        Connected
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
      >
        Disconnected
      </Badge>
    );
  };

  const getProcessBadge = (status: ProcessStatus) => {
    switch (status) {
      case "PROCESSING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
          >
            Processing
          </Badge>
        );
      case "RECONNECTING":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
          >
            Reconnecting
          </Badge>
        );
      case "PAUSED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800"
          >
            Paused
          </Badge>
        );
    }
  };

  const handleRebalanceClick = (integrationId: string) => {
    setRebalancingIntegrationId(integrationId);
    setRebalanceDialogOpen(true);
  };

  const handleRebalanceConfirm = async () => {
    if (!onRebalance) return;

    setIsRebalancing(true);
    try {
      await onRebalance();
      toast.success("Leads rebalanced successfully");
      setRebalanceDialogOpen(false);
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error("Failed to rebalance leads");
    } finally {
      setIsRebalancing(false);
    }
  };

  const renderActionButton = (
    action: string,
    integration: IntegrationHealth
  ) => {
    switch (action) {
      case "pause":
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Pause className="w-3 h-3" />
            Pause
          </Button>
        );
      case "resume":
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="w-3 h-3" />
            Resume
          </Button>
        );
      case "manual_reconnect":
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-3 h-3" />
            Reconnect
          </Button>
        );
      case "rebalance_leads":
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => handleRebalanceClick(integration.integration_id)}
          >
            <ArrowRightLeft className="w-3 h-3" />
            Rebalance
          </Button>
        );
      default:
        return null;
    }
  };

  const totalUnstartedLeads = integrations
    .filter(i => i.connection_status === "DISCONNECTED")
    .reduce((sum, i) => sum + i.leads_seq_not_started, 0);

  return (
    <>
      <Card className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getHealthIcon(healthStatus)}
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  Campaign Health
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Monitor integration status and lead progress
                </CardDescription>
              </div>
            </div>
            {getHealthBadge(healthStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Status Banner */}
          {healthStatus !== "HEALTHY" && (
            <Alert
              className={
                healthStatus === "ALL_DISCONNECTED"
                  ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
              }
            >
              <AlertTriangle
                className={`h-4 w-4 ${
                  healthStatus === "ALL_DISCONNECTED"
                    ? "text-red-600 dark:text-red-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              />
              <AlertDescription
                className={
                  healthStatus === "ALL_DISCONNECTED"
                    ? "text-red-800 dark:text-red-200"
                    : "text-amber-800 dark:text-amber-200"
                }
              >
                {healthStatus === "ALL_DISCONNECTED" ? (
                  <>
                    <strong>All Integrations Disconnected:</strong> Campaign is
                    paused. Please reconnect integrations to resume outreach.
                  </>
                ) : (
                  <>
                    <strong>Some Integrations Have Issues:</strong> Review
                    integration status below and take action if needed.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Aggregated Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Leads
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {aggregatedStats.total_leads}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In Progress
              </p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {aggregatedStats.leads_in_progress}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Completed
              </p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {aggregatedStats.leads_completed}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {aggregatedStats.leads_failed}
              </p>
            </div>
          </div>

          {/* Per-Integration Status Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Integration Status
            </h4>
            <div className="space-y-3">
              {integrations.map(integration => (
                <div
                  key={integration.integration_id}
                  className={`p-4 rounded-lg border ${
                    integration.is_healthy
                      ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10"
                      : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {integration.username}
                      </span>
                      <div className="flex items-center gap-2">
                        {getConnectionBadge(integration.connection_status)}
                        {getProcessBadge(integration.process_status)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {integration.leads_total} leads
                      </span>
                      <span className="text-gray-500 dark:text-gray-500 text-xs">
                        {integration.leads_seq_started} started •{" "}
                        {integration.leads_seq_not_started} pending
                      </span>
                    </div>
                  </div>

                  {/* Recovery Status */}
                  {integration.recovery_status && (
                    <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {integration.recovery_status === "AUTO_RECONNECTING" ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Auto-reconnecting...
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">
                          Manual reconnection required
                        </span>
                      )}
                    </div>
                  )}

                  {/* Available Actions */}
                  {integration.available_actions.length > 0 && (
                    <div className="flex items-center gap-2">
                      {integration.available_actions.map(action =>
                        renderActionButton(action, integration)
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rebalance Confirmation Dialog */}
      <Dialog open={rebalanceDialogOpen} onOpenChange={setRebalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rebalance Leads</DialogTitle>
            <DialogDescription>
              This will redistribute {totalUnstartedLeads} unstarted leads from
              disconnected integrations to healthy integrations. Leads that have
              already started their sequence will not be moved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRebalanceDialogOpen(false)}
              disabled={isRebalancing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRebalanceConfirm}
              disabled={isRebalancing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRebalancing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rebalancing...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Confirm Rebalance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CampaignHealthSection;
