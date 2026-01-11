"use client";

import { useIntegrationStatus } from "@/hooks/useIntegrationStatus";
import { CheckCircle, AlertCircle, Loader2, XCircle } from "lucide-react";

interface AutoReconnectStatusProps {
  integrationId: string;
  initialStatus: string;
}

export function AutoReconnectStatus({
  integrationId,
  initialStatus,
}: AutoReconnectStatusProps) {
  const { status, isReconnecting } = useIntegrationStatus(
    integrationId,
    initialStatus
  );

  if (status === "CONNECTED") {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm">Connected</span>
      </div>
    );
  }

  if (status === "RECONNECTING") {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Reconnecting...</span>
      </div>
    );
  }

  if (status === "DISCONNECTED") {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Disconnected</span>
      </div>
    );
  }

  if (status === "ERROR") {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="w-4 h-4" />
        <span className="text-sm">Reconnection failed</span>
      </div>
    );
  }

  return null;
}
