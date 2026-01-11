"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Download,
  AlertCircle,
  X,
  MessageCircle,
  Wifi,
  WifiOff,
  Smartphone,
} from "lucide-react";
import whatsappService from "../../services/sales-services/whatsappService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import toastService from "../../services/sales-services/toastService";

interface WhatsAppAccount {
  id: string;
  remoteAccountId: string;
  phoneNumber?: string;
  displayName?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
  integration: {
    id: string;
    endpointUrl?: string;
    provider?: string;
  };
}

const WhatsAppIntegrationSettings: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();

  const [accounts, setAccounts] = useState<WhatsAppAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{
    qrCode: string;
    accountId: string;
    accountName: string;
  } | null>(null);
  const [pollingIntervals, setPollingIntervals] = useState<{
    [key: string]: NodeJS.Timeout;
  }>({});

  // Load WhatsApp accounts
  const loadAccounts = useCallback(async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      // Get workspace and organization IDs from context
      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const res = await whatsappService.listAccounts({
        organizationId,
        workspaceId,
      });
      setAccounts(res.accounts || []);
    } catch (error) {
      setError("Failed to load WhatsApp accounts");
      toastService.error("Failed to load WhatsApp accounts");
    } finally {
      setLoading(false);
    }
  }, [user, selectedOrganization, selectedWorkspace]);

  // Stop polling for a specific account
  const stopPolling = (accountId: string) => {
    if (pollingIntervals[accountId]) {
      clearInterval(pollingIntervals[accountId]);
      setPollingIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[accountId];
        return newIntervals;
      });
    }
  };

  // Connect new WhatsApp account
  const handleConnect = async () => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      toastService.error("Please select an organization and workspace");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const result = await whatsappService.connectAccount({
        organizationId,
        workspaceId,
        name: `WhatsApp Account ${accounts.length + 1}`,
      });

      if (result.accountId) {
        toastService.success("WhatsApp account created successfully");

        // Show QR code modal
        setQrCodeData({
          qrCode: result.qrCode || "",
          accountId: result.accountId,
          accountName: result.accountName || "New Account",
        });
        setShowQRModal(true);

        // Start polling for connection status
        pollConnectionStatus(result.accountId);

        // Reload accounts
        await loadAccounts();
      }
    } catch (error) {
      toastService.error("Failed to connect WhatsApp account");
    } finally {
      setLoading(false);
    }
  };

  // Reconnect existing account
  const handleReconnect = async (account: WhatsAppAccount) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      toastService.error("Please select an organization and workspace");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const result = await whatsappService.reconnectAccount({
        organizationId,
        workspaceId,
        accountId: account.id,
      });

      if (result.qrCode) {
        setQrCodeData({
          qrCode: result.qrCode,
          accountId: account.id,
          accountName: account.displayName || account.remoteAccountId,
        });
        setShowQRModal(true);

        // Start polling for connection status
        pollConnectionStatus(account.id);
      }

      toastService.success("Reconnection initiated");
    } catch (error) {
      toastService.error("Failed to reconnect account");
    } finally {
      setLoading(false);
    }
  };

  // Poll connection status
  const pollConnectionStatus = async (accountId: string) => {
    if (!selectedOrganization || !selectedWorkspace) {
      return;
    }

    const poll = async () => {
      try {
        const workspaceId = selectedWorkspace.id;
        const organizationId = selectedOrganization.id;

        const status = await whatsappService.getAccountStatus({
          organizationId,
          workspaceId,
          accountId,
        });

        if (status.status === "CONNECTED") {
          toastService.success("WhatsApp account connected successfully");
          stopPolling(accountId);
          setShowQRModal(false);
          await loadAccounts(); // Reload to get updated status
        } else if (status.status === "DISCONNECTED") {
          toastService.error("WhatsApp account disconnected");
          stopPolling(accountId);
        }
      } catch (error) {
        stopPolling(accountId);
      }
    };

    // Poll every 5 seconds
    const interval = setInterval(poll, 5000);
    setPollingIntervals(prev => ({ ...prev, [accountId]: interval }));

    // Initial poll
    poll();
  };

  // Remove account
  const handleRemove = async (account: WhatsAppAccount) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      toastService.error("Please select an organization and workspace");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${account.displayName || account.remoteAccountId}?`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      await whatsappService.removeAccount({
        organizationId,
        workspaceId,
        accountId: account.id,
      });

      toastService.success("WhatsApp account removed successfully");
      await loadAccounts();
    } catch (error) {
      toastService.error("Failed to remove account");
    } finally {
      setLoading(false);
    }
  };

  // Disconnect account
  const handleDisconnect = async (account: WhatsAppAccount) => {
    if (!user || !selectedOrganization || !selectedWorkspace) {
      toastService.error("Please select an organization and workspace");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      await whatsappService.disconnectAccount({
        organizationId,
        workspaceId,
        accountId: account.id,
      });

      toastService.success("WhatsApp account disconnected successfully");
      await loadAccounts();
    } catch (error) {
      toastService.error("Failed to disconnect account");
    } finally {
      setLoading(false);
    }
  };

  // Get status text and color
  const getStatusText = (status?: string) => {
    switch (status) {
      case "CONNECTED":
        return {
          text: "Connected",
          color: "text-green-600 dark:text-green-400",
        };
      case "DISCONNECTED":
        return {
          text: "Disconnected",
          color: "text-red-600 dark:text-red-400",
        };
      case "CONNECTING":
        return {
          text: "Connecting...",
          color: "text-yellow-600 dark:text-yellow-400",
        };
      case "QR_READY":
        return {
          text: "QR Code Ready",
          color: "text-gray-600 dark:text-gray-400",
        };
      default:
        return { text: "Unknown", color: "text-gray-600 dark:text-gray-400" };
    }
  };

  // Check if account can be reconnected
  const canReconnect = (status?: string) => {
    return status === "DISCONNECTED" || status === "CONNECTING";
  };

  // Copy QR code to clipboard
  const copyQRCode = () => {
    if (qrCodeData?.qrCode) {
      navigator.clipboard.writeText(qrCodeData.qrCode);
      toastService.success("QR code copied to clipboard");
    }
  };

  // Download QR code
  const downloadQRCode = () => {
    if (qrCodeData?.qrCode) {
      const link = document.createElement("a");
      link.href = qrCodeData.qrCode;
      link.download = `whatsapp-qr-${qrCodeData.accountName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toastService.success("QR code downloaded");
    }
  };

  // Close QR modal
  const closeQRModal = () => {
    setShowQRModal(false);
    setQrCodeData(null);
  };

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [pollingIntervals]);

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="mb-4 text-red-600">
              <AlertCircle className="mx-auto w-12 h-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Error loading WhatsApp accounts
            </h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no workspace selected state
  if (!selectedOrganization || !selectedWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="mb-4 text-gray-400">
              <MessageCircle className="mx-auto w-12 h-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No workspace selected
            </h3>
            <p className="mb-4 text-gray-600">
              Please select an organization and workspace from the sidebar to
              manage WhatsApp accounts.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            WhatsApp Integration
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your WhatsApp Business API connections
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleConnect}
            disabled={loading || !selectedOrganization || !selectedWorkspace}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="mr-2 w-4 h-4" />
            Connect Account
          </button>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {loading ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              <RefreshCw className="mr-2 w-4 h-4 animate-spin" />
              Loading accounts...
            </div>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-6 text-center">
            <MessageCircle className="mx-auto mb-4 w-12 h-12 text-gray-400 dark:text-gray-500" />
            <h4 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No WhatsApp accounts
            </h4>
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
              Connect your first WhatsApp Business API account to get started
            </p>
            <button
              onClick={handleConnect}
              disabled={!selectedOrganization || !selectedWorkspace}
              className="flex items-center px-4 py-2 mx-auto text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <Plus className="mr-2 w-4 h-4" />
              Connect First Account
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {accounts.map(account => {
              const statusInfo = getStatusText(account.status);
              return (
                <div key={account.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="flex justify-center items-center w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {account.displayName || account.remoteAccountId}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {account.phoneNumber || "No phone number"}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span
                            className={`text-xs font-medium ${statusInfo.color}`}
                          >
                            {statusInfo.text}
                          </span>
                          {account.status === "CONNECTED" ? (
                            <Wifi className="w-3 h-3 text-green-500 dark:text-green-400" />
                          ) : (
                            <WifiOff className="w-3 h-3 text-red-500 dark:text-red-400" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {canReconnect(account.status) && (
                        <button
                          onClick={() => handleReconnect(account)}
                          className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <RefreshCw className="mr-1 w-3 h-3" />
                          Reconnect
                        </button>
                      )}
                      {account.status === "CONNECTED" && (
                        <button
                          onClick={() => handleDisconnect(account)}
                          className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          <WifiOff className="mr-1 w-3 h-3" />
                          Disconnect
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(account)}
                        className="flex items-center px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        <Trash2 className="mr-1 w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
          <div className="p-6 mx-4 w-full max-w-md bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Connect WhatsApp Account
              </h3>
              <button
                onClick={closeQRModal}
                className="p-1 text-gray-400 dark:text-gray-500 rounded-full hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Scan this QR code with your WhatsApp mobile app to connect{" "}
                <strong className="text-gray-900 dark:text-white">
                  {qrCodeData.accountName}
                </strong>
              </p>
              <div className="flex justify-center mb-4">
                <img
                  src={qrCodeData.qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 border border-gray-200 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div className="flex justify-center space-x-2">
                <button
                  onClick={copyQRCode}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Copy className="mr-2 w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={downloadQRCode}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Download className="mr-2 w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppIntegrationSettings;
