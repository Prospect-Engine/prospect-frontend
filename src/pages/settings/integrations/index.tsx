"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import {
  Linkedin,
  Mail,
  MessageSquare,
  Twitter,
  Database,
  Plus,
  MoreVertical,
  RefreshCw,
  Trash2,
  Edit,
  Loader2,
  AlertCircle,
  Shield,
  Copy,
  Check,
  Key,
  Slack,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Integration as IntegrationType } from "@/types/integration";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import config from "@/configs/integration";
import { toast } from "sonner";
import { AutoReconnectStatus } from "@/components/integrations/AutoReconnectStatus";
import { CampaignResumeNotification } from "@/components/integrations/CampaignResumeNotification";
import { SyncStatusPanel } from "@/components/integrations/SyncStatusPanel";
import { InlineSyncStats } from "@/components/integrations/InlineSyncStats";
import { SyncActionButton } from "@/components/integrations/SyncActionButton";

interface Integration {
  id: string;
  name: string;
  description: string;
  platform: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  comingSoon?: boolean;
}

export default function IntegrationSettings() {
  const router = useRouter();
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPlatformSelection, setShowPlatformSelection] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<IntegrationType[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2FA Secret Management State
  const [showAdd2FADialog, setShowAdd2FADialog] = useState(false);
  const [showView2FADialog, setShowView2FADialog] = useState(false);
  const [showRemove2FADialog, setShowRemove2FADialog] = useState(false);
  const [twoFactorSecrets, setTwoFactorSecrets] = useState<any[]>([]);
  const [secretKey, setSecretKey] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [currentIntegrationId, setCurrentIntegrationId] = useState<string>("");
  const [integrationsWith2FA, setIntegrationsWith2FA] = useState<Set<string>>(
    new Set()
  );

  // Delete Integration State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingIntegration, setDeletingIntegration] =
    useState<IntegrationType | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Reconnect Integration State
  const [reconnectingIntegration, setReconnectingIntegration] =
    useState<IntegrationType | null>(null);
  const [loadingReconnect, setLoadingReconnect] = useState(false);
  const [reconnectStatus, setReconnectStatus] = useState<string>("");
  const [reconnectTimer, setReconnectTimer] = useState<NodeJS.Timeout | null>(
    null
  );
  const [reconnectRetryCount, setReconnectRetryCount] = useState(0);
  const [abortControllers, setAbortControllers] = useState<
    Map<string, AbortController>
  >(new Map());

  // Disconnect Integration State
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [disconnectingIntegration, setDisconnectingIntegration] =
    useState<IntegrationType | null>(null);
  const [loadingDisconnect, setLoadingDisconnect] = useState(false);

  // Campaign Resume Notification State
  const [resumedCampaigns, setResumedCampaigns] = useState<
    Record<string, Array<{ id: string; name: string }>>
  >({});
  const [dismissedNotifications, setDismissedNotifications] = useState<
    Set<string>
  >(new Set());

  // Refresh Profile State
  const [refreshingProfileId, setRefreshingProfileId] = useState<string | null>(
    null
  );

  const integrations: Integration[] = [
    {
      id: "linkedin",
      name: "LinkedIn",
      description:
        "Connect your LinkedIn accounts for automated outreach and lead generation",
      platform: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      comingSoon: false,
    },
    {
      id: "email",
      name: "Email",
      description:
        "Connect your email accounts for automated outreach and lead generation",
      platform: "Email",
      icon: Mail,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      comingSoon: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description:
        "Connect your WhatsApp accounts for automated outreach and lead generation",
      platform: "WhatsApp",
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      comingSoon: false,
    },
    {
      id: "twitter",
      name: "X (Twitter)",
      description:
        "Connect your X (Twitter) accounts for automated outreach and lead generation",
      platform: "Twitter",
      icon: Twitter,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      comingSoon: true,
    },
    {
      id: "slack",
      name: "Slack",
      description:
        "Connect your Slack accounts for automated outreach and lead generation",
      platform: "Slack",
      icon: Slack,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      comingSoon: true,
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description:
        "Connect your HubSpot accounts for automated outreach and lead generation",
      platform: "HubSpot",
      icon: Database,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      comingSoon: true,
    },
  ];

  // Fetch connected accounts from API
  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, status } = await apiCall({
        url: config.integrationList,
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        setConnectedAccounts(data || []);
        // Check 2FA status for each integration after list is loaded
        if (data && data.length > 0) {
          checkAllIntegrations2FAStatus(data);
        }
      } else {
        setError("Failed to fetch integrations");
      }
    } catch (err) {
      setError("Failed to fetch integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load integrations on component mount
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Check 2FA status for all connected accounts (parallelized with timeout)
  const checkAllIntegrations2FAStatus = async (integrations: any[]) => {
    const integrationsWith2FASet = new Set<string>();
    const TIMEOUT_MS = 10000; // 10 seconds timeout per request

    try {
      // Run all checks in parallel with individual timeouts
      const promises = integrations.map(async integration => {
        const abortController = new AbortController();
        const requestId = `check2FA-${integration.id}-${Date.now()}`;

        setAbortControllers(prev =>
          new Map(prev).set(requestId, abortController)
        );

        try {
          const timeoutId = setTimeout(
            () => abortController.abort(),
            TIMEOUT_MS
          );

          const response = await fetch(
            `/api/integration/viewAppSecret?integration_id=${integration.id}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
              signal: abortController.signal,
            }
          );

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            if (data && !data.message?.includes("No authenticator found")) {
              return integration.id;
            }
          }
        } catch (err) {
          // Ignore abort errors and other errors
          if (err instanceof Error && err.name !== "AbortError") {
            console.warn(`Failed to check 2FA for ${integration.id}:`, err);
          }
        } finally {
          // Clean up abort controller
          setAbortControllers(prev => {
            const newMap = new Map(prev);
            newMap.delete(requestId);
            return newMap;
          });
        }
        return null;
      });

      const results = await Promise.all(promises);
      results.forEach(id => {
        if (id) integrationsWith2FASet.add(id);
      });

      setIntegrationsWith2FA(integrationsWith2FASet);
    } catch (err) {
      console.warn("Error checking 2FA status:", err);
    }
  };

  // 2FA Secret Management Functions
  const fetch2FASecrets = async (integrationId?: string) => {
    const TIMEOUT_MS = 10000; // 10 seconds timeout
    const abortController = new AbortController();
    const requestId = `fetch2FA-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoading2FA(true);
      const url = integrationId
        ? `/api/integration/viewAppSecret?integration_id=${integrationId}`
        : "/api/integration/viewAppSecret";

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Handle case where no authenticator is found
        if (data?.message === "No authenticator found for this integration") {
          setTwoFactorSecrets([]);
          // Remove this integration from the set of integrations with 2FA
          if (integrationId) {
            setIntegrationsWith2FA(prev => {
              const newSet = new Set(prev);
              newSet.delete(integrationId);
              return newSet;
            });
          }
        } else {
          setTwoFactorSecrets(data || []);
          // Add this integration to the set of integrations with 2FA
          if (integrationId && (data || []).length > 0) {
            setIntegrationsWith2FA(prev => new Set(prev).add(integrationId));
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error fetching 2FA secrets:", err);
        toast.error("Failed to fetch 2FA secrets. Please try again.");
      }
    } finally {
      setLoading2FA(false);
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  const add2FASecret = async (integrationId?: string) => {
    const TIMEOUT_MS = 15000; // 15 seconds timeout
    const abortController = new AbortController();
    const requestId = `add2FA-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoading2FA(true);
      const body = integrationId
        ? { secret: secretKey, integration_id: integrationId }
        : { secret: secretKey };

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/addAppSecret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setShowAdd2FADialog(false);
        setSecretKey("");
        // Add this integration to the set of integrations with 2FA
        if (integrationId) {
          setIntegrationsWith2FA(prev => new Set(prev).add(integrationId));
        }
        fetch2FASecrets(integrationId);
        toast.success("2FA secret added successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to add 2FA secret");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("Request timed out. Please try again.");
      } else if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error adding 2FA secret:", err);
        toast.error("Failed to add 2FA secret. Please try again.");
      }
    } finally {
      setLoading2FA(false);
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  const remove2FASecret = async (secretId: string, integrationId?: string) => {
    const TIMEOUT_MS = 15000; // 15 seconds timeout
    const abortController = new AbortController();
    const requestId = `remove2FA-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoading2FA(true);
      const body = integrationId
        ? { integration_id: integrationId }
        : { integration_id: secretId };

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/removeAppSecret", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setShowRemove2FADialog(false);
        // Remove this integration from the set of integrations with 2FA
        if (integrationId) {
          setIntegrationsWith2FA(prev => {
            const newSet = new Set(prev);
            newSet.delete(integrationId);
            return newSet;
          });
        }
        fetch2FASecrets(integrationId);
        toast.success("2FA secret removed successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to remove 2FA secret");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("Request timed out. Please try again.");
      } else if (err instanceof Error && err.name !== "AbortError") {
        console.error("Error removing 2FA secret:", err);
        toast.error("Failed to remove 2FA secret. Please try again.");
      }
    } finally {
      setLoading2FA(false);
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {}
  };

  // Delete Integration Function
  const deleteIntegration = async (integrationId: string) => {
    const TIMEOUT_MS = 15000; // 15 seconds timeout
    const abortController = new AbortController();
    const requestId = `delete-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoadingDelete(true);

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: integrationId }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Remove the integration from the local state
        setConnectedAccounts(prev =>
          prev.filter(account => account.id !== integrationId)
        );

        // Remove from 2FA set if it was there
        setIntegrationsWith2FA(prev => {
          const newSet = new Set(prev);
          newSet.delete(integrationId);
          return newSet;
        });

        setShowDeleteDialog(false);
        setDeletingIntegration(null);

        toast.success("Integration removed successfully");
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to remove integration");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("Request timed out. Please try again.");
      } else {
        console.error("Error deleting integration:", err);
        toast.error("Failed to remove integration");
      }
    } finally {
      setLoadingDelete(false);
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  const handleDeleteIntegration = (integration: IntegrationType) => {
    setDeletingIntegration(integration);
    setShowDeleteDialog(true);
  };

  // Sync Integration Function
  const syncIntegration = async (integrationId: string) => {
    const TIMEOUT_MS = 10000; // 10 seconds timeout
    const abortController = new AbortController();
    const requestId = `sync-${integrationId}-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: integrationId }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
      return null;
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.warn(`Error syncing integration ${integrationId}:`, err);
      }
      return null;
    } finally {
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  // Reconnect Integration Function
  const reconnectIntegration = async (integrationId: string) => {
    const TIMEOUT_MS = 30000; // 30 seconds timeout for initial reconnect
    const abortController = new AbortController();
    const requestId = `reconnect-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoadingReconnect(true);
      setReconnectStatus("Initiating reconnection...");
      setReconnectRetryCount(0);

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/reconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ integration_id: integrationId }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setReconnectStatus(
          "Reconnection initiated. Redirecting to LinkedIn integration..."
        );
        toast.success("Reconnection started", {
          description:
            "You'll be redirected to the LinkedIn integration assistant to complete the process.",
        });
        clearReconnectTimer();
        setLoadingReconnect(false);
        setReconnectRetryCount(0);
        const redirectUrl = `/settings/integrations/linkedin?mode=reconnect&integrationId=${integrationId}`;
        router.push(redirectUrl);
        return;
      } else {
        const errorData = await response.json();
        setReconnectStatus("");
        toast.error(errorData.message || "Failed to reconnect integration");
        setLoadingReconnect(false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setReconnectStatus("");
        toast.error("Reconnection request timed out. Please try again.");
        setLoadingReconnect(false);
      } else {
        setReconnectStatus("");
        console.error("Error reconnecting integration:", err);
        toast.error("Failed to reconnect integration");
        setLoadingReconnect(false);
      }
    } finally {
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  // Start monitoring reconnection progress
  const startReconnectMonitoring = async (integrationId: string) => {
    const MAX_RETRIES = 60; // Maximum 5 minutes (60 * 5 seconds)
    let retryCount = 0;
    let isMonitoring = true;

    // Clear any existing timer first
    clearReconnectTimer();

    const checkStatus = async () => {
      // Stop monitoring if retry limit reached
      if (retryCount >= MAX_RETRIES) {
        setReconnectStatus("");
        setLoadingReconnect(false);
        clearReconnectTimer();
        isMonitoring = false;
        toast.error("Reconnection timeout. Please try again.");
        return;
      }

      // Stop monitoring if already completed
      if (!isMonitoring) return;

      retryCount++;
      setReconnectRetryCount(retryCount);
      const currentRetry = retryCount;

      try {
        const integrationData = await syncIntegration(integrationId);

        if (integrationData) {
          const { connection_status, required_action, connection_message } =
            integrationData;

          switch (connection_status) {
            case "CONNECTED":
              setReconnectStatus("Reconnection successful!");
              setLoadingReconnect(false);
              clearReconnectTimer();
              isMonitoring = false; // Stop monitoring
              setReconnectRetryCount(0);
              await fetchIntegrations();
              toast.success("Integration reconnected successfully");
              break;

            case "DISCONNECTED":
              if (required_action === "WAITING") {
                setReconnectStatus(
                  `Waiting for reconnection... (${currentRetry}/${MAX_RETRIES})`
                );
                // Continue monitoring
                return;
              } else if (required_action === "SOLVE_CAPTCHA") {
                setReconnectStatus(
                  "Captcha required. Please solve the captcha in the browser window."
                );
                // Continue monitoring
                return;
              } else if (required_action === "PROVIDE_OTP") {
                setReconnectStatus(
                  "OTP required. Please check your email/phone for verification code."
                );
                // Continue monitoring
                return;
              } else if (required_action === "RETRY") {
                setReconnectStatus("");
                setLoadingReconnect(false);
                clearReconnectTimer();
                isMonitoring = false; // Stop monitoring
                setReconnectRetryCount(0);
                toast.error(
                  connection_message || "Reconnection failed. Please try again."
                );
                break;
              }
              break;

            default:
              setReconnectStatus(
                `Status: ${connection_status}. ${connection_message || ""} (${currentRetry}/${MAX_RETRIES})`
              );
              // Continue monitoring
              return;
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("Error checking reconnection status:", err);
        }
      }
    };

    // Check status immediately
    await checkStatus();

    // Set up periodic checking (every 5 seconds) only if still monitoring
    if (isMonitoring) {
      const timer = setInterval(() => {
        // Use a ref-like pattern to check current state
        if (isMonitoring && retryCount < MAX_RETRIES) {
          checkStatus();
        } else {
          clearInterval(timer);
          setReconnectTimer(null);
        }
      }, 5000);
      setReconnectTimer(timer);
    }
  };

  // Clear reconnect timer
  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer) {
      clearInterval(reconnectTimer);
      setReconnectTimer(null);
    }
  }, [reconnectTimer]);

  // Cleanup timer and abort controllers on component unmount
  useEffect(() => {
    return () => {
      clearReconnectTimer();
      // Abort all pending requests
      setAbortControllers(prev => {
        prev.forEach(controller => {
          controller.abort();
        });
        return new Map();
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearReconnectTimer]);

  const handleReconnectIntegration = (integration: IntegrationType) => {
    setReconnectingIntegration(integration);
    reconnectIntegration(integration.id);
  };

  // Disconnect Integration Function
  const disconnectIntegration = async (integrationId: string) => {
    const TIMEOUT_MS = 15000; // 15 seconds timeout
    const abortController = new AbortController();
    const requestId = `disconnect-${Date.now()}`;

    setAbortControllers(prev => new Map(prev).set(requestId, abortController));

    try {
      setLoadingDisconnect(true);

      const timeoutId = setTimeout(() => abortController.abort(), TIMEOUT_MS);

      const response = await fetch("/api/integration/disconnect", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: integrationId }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();

        // Only update status if API returns success: true
        if (data.success === true) {
          // Update the integration status to DISCONNECTED instead of removing it
          setConnectedAccounts(prev =>
            prev.map(account =>
              account.id === integrationId
                ? { ...account, connection_status: "DISCONNECTED" }
                : account
            )
          );

          setShowDisconnectDialog(false);
          setDisconnectingIntegration(null);

          toast.success("Integration disconnected successfully");
        } else {
          toast.error("Failed to disconnect integration");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to disconnect integration");
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("Request timed out. Please try again.");
      } else {
        console.error("Error disconnecting integration:", err);
        toast.error("Failed to disconnect integration");
      }
    } finally {
      setLoadingDisconnect(false);
      setAbortControllers(prev => {
        const newMap = new Map(prev);
        newMap.delete(requestId);
        return newMap;
      });
    }
  };

  const handleDisconnectIntegration = (integration: IntegrationType) => {
    setDisconnectingIntegration(integration);
    setShowDisconnectDialog(true);
  };

  // Refresh Profile Function
  const refreshProfile = async (integrationId: string) => {
    try {
      setRefreshingProfileId(integrationId);

      const response = await fetch("/api/integration/refresh-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: integrationId }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          await fetchIntegrations();
          toast.success("Profile refreshed successfully", {
            description: data.profile?.has_sales_navigator
              ? "Sales Navigator detected"
              : "Profile data updated",
          });
        } else {
          toast.error(data.error || "Failed to refresh profile");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to refresh profile");
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
      toast.error("Failed to refresh profile");
    } finally {
      setRefreshingProfileId(null);
    }
  };

  const handleAddIntegration = () => {
    setShowPlatformSelection(true);
  };

  const handleConnect = (integration: Integration) => {
    if (integration.id === "linkedin") {
      // Navigate to dedicated LinkedIn integration page
      window.location.href = "/settings/integrations/linkedin/";
      return;
    }

    if (integration.id === "whatsapp") {
      // Navigate to Sales settings WhatsApp integration page
      window.location.href = "/sales/settings?section=whatsapp";
      return;
    }

    setSelectedIntegration(integration);
    setShowAddDialog(true);
  };

  const handlePlatformSelect = (integration: Integration) => {
    setShowPlatformSelection(false);
    handleConnect(integration);
  };

  // Helper function to get platform icon
  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "linkedin":
        return Linkedin;
      case "gmail":
        return Mail;
      case "whatsapp":
        return MessageSquare;
      case "twitter":
        return Twitter;
      default:
        return Mail;
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONNECTED":
        return "bg-emerald-500";
      case "DISCONNECTED":
        return "bg-gray-400";
      default:
        return "bg-amber-500";
    }
  };

  return (
    <AuthGuard>
      <AppLayout activePage="Settings">
        <div className="space-y-6">
          {/* Connected Accounts Section */}
          <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">
                    Connected Accounts
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage your connected accounts
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleAddIntegration}
                  className="rounded-xl border-border/30 hover:border-border/50 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-muted-foreground">
                      Loading connected accounts...
                    </span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 font-medium mb-2">
                      Failed to load accounts
                    </p>
                    <p className="text-muted-foreground text-sm mb-4">
                      {error}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchIntegrations}
                      className="rounded-xl"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : connectedAccounts.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200/50">
                      <Linkedin className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No connected accounts yet
                    </h3>
                    <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                      Connect your LinkedIn account to start syncing connections
                      and running automated outreach campaigns
                    </p>
                    <Button
                      onClick={handleAddIntegration}
                      className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Connect LinkedIn
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Campaign Resume Notifications */}
                  {connectedAccounts.map(account => {
                    const campaigns = resumedCampaigns[account.id];
                    const isDismissed = dismissedNotifications.has(account.id);

                    if (!campaigns || campaigns.length === 0 || isDismissed) {
                      return null;
                    }

                    return (
                      <CampaignResumeNotification
                        key={`notification-${account.id}`}
                        integrationId={account.id}
                        accountName={
                          account.account_name ||
                          account.email ||
                          "Unknown Account"
                        }
                        campaigns={campaigns}
                        onDismiss={() => {
                          setDismissedNotifications(prev => {
                            const newSet = new Set(prev);
                            newSet.add(account.id);
                            return newSet;
                          });
                        }}
                      />
                    );
                  })}

                  {/* Connected Accounts - Minimal Row Design */}
                  <div className="divide-y divide-border/10">
                    {connectedAccounts.map(account => {
                      const PlatformIcon = getPlatformIcon(account.type);
                      const isConnected =
                        account.connection_status === "CONNECTED";
                      const isDisconnected =
                        account.connection_status === "DISCONNECTED";
                      const isReconnecting =
                        loadingReconnect &&
                        reconnectingIntegration?.id === account.id;

                      return (
                        <div
                          key={account.id}
                          className="group py-5 first:pt-0 last:pb-0 -mx-3 px-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50/80 hover:to-transparent transition-all duration-300 ease-out"
                        >
                          {/* Main Row */}
                          <div className="flex items-start gap-4">
                            {/* Avatar with Platform Badge */}
                            <div className="relative flex-shrink-0 group-hover:scale-[1.02] transition-transform duration-300">
                              <Avatar className="w-14 h-14 ring-2 ring-white shadow-md group-hover:shadow-lg group-hover:ring-slate-100 transition-all duration-300">
                                {account.propic_url ? (
                                  <Image
                                    src={account.propic_url}
                                    alt={account.account_name || "Account"}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-lg font-semibold">
                                    {account.account_name?.charAt(0) ||
                                      account.email?.charAt(0) ||
                                      "?"}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              {/* Platform Badge Overlay */}
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#0077B5] rounded-lg flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                                <PlatformIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            {/* Content Section */}
                            <div className="flex-1 min-w-0">
                              {/* Name & Email Row */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-foreground text-base truncate group-hover:text-slate-950 transition-colors duration-200">
                                    {account.account_name ||
                                      account.email ||
                                      "Unknown Account"}
                                  </h3>
                                  {account.email && (
                                    <p className="text-muted-foreground text-sm truncate group-hover:text-slate-500 transition-colors duration-200">
                                      {account.email}
                                    </p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {/* Primary Action Button */}
                                  {isConnected && (
                                    <SyncActionButton
                                      integrationId={account.id}
                                      integrationType={account.type}
                                    />
                                  )}
                                  {isDisconnected && !isReconnecting && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() =>
                                        handleReconnectIntegration(account)
                                      }
                                      disabled={loadingReconnect}
                                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                      <RefreshCw className="w-4 h-4 mr-1.5" />
                                      Reconnect
                                    </Button>
                                  )}
                                  {isReconnecting && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      className="rounded-xl"
                                    >
                                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                                      Reconnecting...
                                    </Button>
                                  )}

                                  {/* Refresh Profile Button - Only for connected LinkedIn */}
                                  {isConnected &&
                                    account.type.toLowerCase() ===
                                      "linkedin" && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                refreshProfile(account.id)
                                              }
                                              disabled={
                                                refreshingProfileId ===
                                                account.id
                                              }
                                              className="rounded-xl border-border/40 hover:border-border/60 hover:bg-slate-50 transition-all duration-200 w-9 h-9 p-0"
                                            >
                                              {refreshingProfileId ===
                                              account.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                              ) : (
                                                <RefreshCw className="w-4 h-4" />
                                              )}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-sm">
                                              Refresh Profile
                                            </p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}

                                  {/* More Options */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 rounded-xl opacity-60 hover:opacity-100 hover:bg-slate-100 transition-all duration-200"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      className="w-52 rounded-xl shadow-xl border border-border/20 p-1"
                                    >
                                      {/* 2FA Options */}
                                      {!integrationsWith2FA.has(account.id) ? (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setCurrentIntegrationId(account.id);
                                            setSecretKey("");
                                            setShowAdd2FADialog(true);
                                          }}
                                          className="rounded-lg cursor-pointer"
                                        >
                                          <Shield className="w-4 h-4 mr-2 text-slate-500" />
                                          Add 2FA Secret
                                        </DropdownMenuItem>
                                      ) : (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setCurrentIntegrationId(
                                                account.id
                                              );
                                              fetch2FASecrets(account.id);
                                              setShowView2FADialog(true);
                                            }}
                                            className="rounded-lg cursor-pointer"
                                          >
                                            <Key className="w-4 h-4 mr-2 text-slate-500" />
                                            View 2FA Secrets
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setCurrentIntegrationId(
                                                account.id
                                              );
                                              setShowRemove2FADialog(true);
                                            }}
                                            className="rounded-lg cursor-pointer"
                                          >
                                            <Shield className="w-4 h-4 mr-2 text-slate-500" />
                                            Remove 2FA Secret
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      <div className="h-px bg-border/50 my-1" />

                                      {/* Remove Account */}
                                      <DropdownMenuItem
                                        className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                                        onClick={() =>
                                          handleDeleteIntegration(account)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Remove Account
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Badges Row */}
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {/* LinkedIn Badge - Clickable */}
                                {account.type.toLowerCase() === "linkedin" &&
                                account.profile_url ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-sky-50 text-sky-700 border border-sky-200/60 rounded-lg px-2.5 py-1 hover:bg-sky-100 hover:border-sky-300 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow"
                                    onClick={() =>
                                      window.open(
                                        account.profile_url,
                                        "_blank",
                                        "noopener,noreferrer"
                                      )
                                    }
                                  >
                                    <PlatformIcon className="w-3 h-3 mr-1.5 text-sky-600" />
                                    LinkedIn
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-slate-100 text-slate-600 rounded-lg px-2.5 py-1"
                                  >
                                    <PlatformIcon className="w-3 h-3 mr-1.5" />
                                    {account.type}
                                  </Badge>
                                )}

                                {/* Premium Badge */}
                                {account.is_premium && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-amber-50 text-amber-700 border border-amber-200/60 rounded-lg px-2.5 py-1 shadow-sm"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                                    Premium
                                  </Badge>
                                )}

                                {/* 2FA Badge */}
                                {integrationsWith2FA.has(account.id) ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg px-2.5 py-1 shadow-sm"
                                  >
                                    <Shield className="w-3 h-3 mr-1.5" />
                                    2FA Enabled
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-slate-50 text-slate-400 border border-slate-200/60 rounded-lg px-2.5 py-1"
                                  >
                                    <Shield className="w-3 h-3 mr-1.5" />
                                    2FA Disabled
                                  </Badge>
                                )}
                              </div>

                              {/* Stats Row - Inline Sync Status */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-sm">
                                {/* Connection Status */}
                                <div className="flex items-center gap-1.5">
                                  {isConnected ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span className="text-emerald-600 font-medium">
                                        Connected
                                      </span>
                                    </>
                                  ) : isDisconnected ? (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                                      <span className="text-amber-600 font-medium">
                                        Disconnected
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                      <span className="text-blue-600 font-medium">
                                        Reconnecting
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Connection Message Tooltip */}
                                {account.connection_message && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 text-muted-foreground cursor-help">
                                          <Info className="w-3.5 h-3.5" />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        side="top"
                                        className="max-w-xs z-50"
                                      >
                                        <p className="text-sm">
                                          {account.connection_message}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}

                                {/* Inline Sync Stats - Only for connected LinkedIn */}
                                {isConnected &&
                                  account.type.toLowerCase() === "linkedin" && (
                                    <InlineSyncStats
                                      integrationId={account.id}
                                    />
                                  )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add More Integrations CTA */}
          {connectedAccounts.length > 0 && connectedAccounts.length < 5 && (
            <div
              onClick={() => setShowPlatformSelection(true)}
              className="group cursor-pointer mt-6"
            >
              <div className="relative bg-gradient-to-br from-slate-50/80 via-white to-slate-50/80 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center transition-all duration-300 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:via-white hover:to-blue-50/50 hover:shadow-lg hover:shadow-blue-100/50">
                {/* Icon */}
                <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-100 mb-5 group-hover:scale-110 group-hover:shadow-xl group-hover:border-blue-200 transition-all duration-300">
                  <Plus className="w-8 h-8 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-slate-900 transition-colors duration-200">
                  Add Another Integration
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-6 group-hover:text-slate-600 transition-colors duration-200">
                  Connect more accounts to scale your outreach and reach more
                  prospects across different platforms.
                </p>

                {/* Platform Chips */}
                <div className="flex justify-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-slate-600 shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all duration-200">
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                    LinkedIn
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-slate-600 shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all duration-200">
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    WhatsApp
                  </span>
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-sm text-slate-600 shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all duration-200">
                    <Mail className="w-4 h-4 text-[#EA4335]" />
                    Email
                  </span>
                </div>

                {/* Subtle Arrow Indicator */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reconnection Status Display */}
          {loadingReconnect && reconnectingIntegration && (
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent>
                <div className="flex items-center space-x-3 p-4">
                  <div className="flex-shrink-0">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      Reconnecting{" "}
                      {reconnectingIntegration.account_name ||
                        reconnectingIntegration.email ||
                        "Integration"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {reconnectStatus ||
                        "Please wait while we reconnect your account..."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearReconnectTimer();
                      setLoadingReconnect(false);
                      setReconnectStatus("");
                      setReconnectingIntegration(null);
                    }}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Platform Selection Dialog */}
          <Dialog
            open={showPlatformSelection}
            onOpenChange={setShowPlatformSelection}
          >
            <DialogContent className="max-w-4xl w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl max-h-[85vh] overflow-y-auto min-w-[50vw]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Choose Integration Platform
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Select a platform to connect and start automating your
                  outreach
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                {/* Available Platforms */}
                {integrations.map(integration =>
                  integration.comingSoon ? (
                    <Card
                      key={integration.id}
                      className="bg-card/30 backdrop-blur-2xl border border-border/10 rounded-2xl opacity-60 cursor-not-allowed"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <integration.icon className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base font-semibold text-muted-foreground">
                              {integration.name}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          disabled
                          variant="outline"
                          className="w-full rounded-xl border-border/20 text-muted-foreground"
                        >
                          Coming Soon
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card
                      key={integration.id}
                      className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                      onClick={() => handlePlatformSelect(integration)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center space-x-4">
                          <div
                            className={cn(
                              "w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                              integration.bgColor
                            )}
                          >
                            <integration.icon
                              className={cn(
                                "w-5 h-5 md:w-6 md:h-6",
                                integration.color
                              )}
                            />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base font-semibold text-foreground">
                              {integration.name}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                              {integration.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Button
                          variant="outline"
                          className="w-full rounded-xl border-border/30 hover:border-border/50 transition-all duration-200"
                        >
                          Connect
                        </Button>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>

              {/* Dialog Footer */}
              <div className="flex items-center justify-end pt-4 border-t border-border/20">
                <Button
                  variant="outline"
                  onClick={() => setShowPlatformSelection(false)}
                  className="rounded-xl border-border/30 hover:border-border/50 transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Integration Details Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="max-w-3xl w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground">
                  Connect {selectedIntegration?.name}
                </DialogTitle>
              </DialogHeader>

              <div className="p-6 text-center">
                <p className="text-muted-foreground">
                  Integration setup coming soon...
                </p>
                <Button
                  onClick={() => setShowAddDialog(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Add 2FA Secret Dialog */}
          <Dialog open={showAdd2FADialog} onOpenChange={setShowAdd2FADialog}>
            <DialogContent className="max-w-2xl w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  Add 2FA Secret
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new two-factor authentication secret for enhanced
                  security
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="secretKey"
                    className="text-sm font-medium text-foreground"
                  >
                    Secret Key
                  </Label>
                  <Input
                    id="secretKey"
                    type="text"
                    placeholder="Enter your 2FA secret key"
                    value={secretKey}
                    onChange={e => setSecretKey(e.target.value)}
                    className="rounded-xl border-border/30 focus:border-border/50 transition-all duration-200"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the secret key from your 2FA app or generate a new one
                  </p>
                </div>

                {secretKey && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-xl border border-border/20">
                      <p className="text-sm text-muted-foreground mb-2">
                        Your 2FA secret key:
                      </p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 p-3 bg-white rounded-lg border border-border/20">
                          <p className="text-foreground font-mono text-sm break-all">
                            {secretKey}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(secretKey)}
                          className="rounded-lg"
                        >
                          {copySuccess ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/20">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdd2FADialog(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => add2FASecret(currentIntegrationId)}
                    disabled={!secretKey || loading2FA}
                    className="rounded-xl"
                  >
                    {loading2FA ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Add Secret
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* View 2FA Secrets Dialog */}
          <Dialog open={showView2FADialog} onOpenChange={setShowView2FADialog}>
            <DialogContent className="max-w-4xl w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  View 2FA Secrets
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  View and manage your 2FA secrets for this integration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {loading2FA ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-muted-foreground">
                        Loading 2FA secrets...
                      </span>
                    </div>
                  </div>
                ) : twoFactorSecrets.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground font-medium mb-2">
                        No 2FA secrets configured
                      </p>
                      <p className="text-muted-foreground text-sm mb-4">
                        Add your first 2FA secret to enhance security
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {twoFactorSecrets.map((secret, index) => (
                      <div
                        key={secret.id || index}
                        className="p-4 bg-white/30 backdrop-blur-sm rounded-2xl border border-border/20 hover:bg-white/50 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {secret.name || `2FA Secret ${index + 1}`}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Created:{" "}
                                {secret.created_at
                                  ? new Date(
                                      secret.created_at
                                    ).toLocaleDateString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSecretKey(secret.secret || "");
                                setShowView2FADialog(false);
                                setShowAdd2FADialog(true);
                              }}
                              className="rounded-xl"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(secret.secret)}
                              className="rounded-xl"
                            >
                              {copySuccess ? (
                                <Check className="w-4 h-4 mr-2" />
                              ) : (
                                <Copy className="w-4 h-4 mr-2" />
                              )}
                              Copy
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setCurrentIntegrationId(
                                  secret.integration_id || currentIntegrationId
                                );
                                setShowView2FADialog(false);
                                setShowRemove2FADialog(true);
                              }}
                              className="rounded-xl"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/50 rounded-xl border border-border/20">
                          <p className="text-foreground font-mono text-sm break-all">
                            {secret.secret || "Secret not available"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border/20">
                  <Button
                    variant="outline"
                    onClick={() => setShowView2FADialog(false)}
                    className="rounded-xl"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setSecretKey("");
                      setShowView2FADialog(false);
                      setShowAdd2FADialog(true);
                    }}
                    className="rounded-xl"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Add New Secret
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Remove 2FA Secret Dialog */}
          <Dialog
            open={showRemove2FADialog}
            onOpenChange={setShowRemove2FADialog}
          >
            <DialogContent className="max-w-md w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Trash2 className="w-5 h-5 mr-2 text-red-500" />
                  Remove 2FA Secret
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Are you sure you want to remove the 2FA secret? This action
                  cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/20">
                <Button
                  variant="outline"
                  onClick={() => setShowRemove2FADialog(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    remove2FASecret(currentIntegrationId, currentIntegrationId)
                  }
                  disabled={loading2FA}
                  className="rounded-xl"
                >
                  {loading2FA ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove Secret
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Delete Integration Dialog */}
          <Dialog
            open={showDeleteDialog}
            onOpenChange={open => {
              setShowDeleteDialog(open);
              if (!open) {
                setDeleteConfirmText("");
              }
            }}
          >
            <DialogContent className="max-w-md w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2 text-red-600" />
                  Remove LinkedIn Account
                </DialogTitle>
              </DialogHeader>

              {deletingIntegration && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    You are about to permanently remove{" "}
                    <span className="font-medium">
                      {deletingIntegration.account_name ||
                        deletingIntegration.email ||
                        "Unknown Account"}
                    </span>
                    .
                  </p>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                      ⚠️ This action cannot be undone
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      All data including profile information, connection
                      history, and settings will be permanently deleted. There
                      is no recovery option.
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="deleteConfirm"
                      className="text-sm font-medium text-gray-700"
                    >
                      Type &quot;DELETE&quot; to confirm:
                    </Label>
                    <Input
                      id="deleteConfirm"
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border rounded-lg"
                      placeholder="DELETE"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/20">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmText("");
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deletingIntegration) {
                      deleteIntegration(deletingIntegration.id);
                      setDeleteConfirmText("");
                    }
                  }}
                  disabled={loadingDelete || deleteConfirmText !== "DELETE"}
                  className="rounded-xl"
                >
                  {loadingDelete ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Permanently Delete
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Disconnect Integration Dialog */}
          <Dialog
            open={showDisconnectDialog}
            onOpenChange={setShowDisconnectDialog}
          >
            <DialogContent className="max-w-md w-[90vw] bg-card/95 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <RefreshCw className="w-5 h-5 mr-2 text-orange-500" />
                  Disconnect Integration
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Are you sure you want to disconnect this integration? This
                  will stop all automated activities for this account.
                </DialogDescription>
              </DialogHeader>

              {disconnectingIntegration && (
                <div className="p-4 bg-muted/50 rounded-xl border border-border/20">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      {disconnectingIntegration.propic_url ? (
                        <Image
                          src={disconnectingIntegration.propic_url}
                          alt={
                            disconnectingIntegration.account_name || "Account"
                          }
                          width={40}
                          height={40}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className="bg-card/40 text-foreground text-sm font-medium">
                          {disconnectingIntegration.account_name?.charAt(0) ||
                            disconnectingIntegration.email?.charAt(0) ||
                            "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {disconnectingIntegration.account_name ||
                          disconnectingIntegration.email ||
                          "Unknown Account"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {disconnectingIntegration.type}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border/20">
                <Button
                  variant="outline"
                  onClick={() => setShowDisconnectDialog(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    disconnectingIntegration &&
                    disconnectIntegration(disconnectingIntegration.id)
                  }
                  disabled={loadingDisconnect}
                  className="rounded-xl"
                >
                  {loadingDisconnect ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
