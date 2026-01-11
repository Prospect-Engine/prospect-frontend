"use client";

import { CheckCircle, X } from "lucide-react";
import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
}

interface CampaignResumeNotificationProps {
  integrationId: string;
  accountName: string;
  campaigns: Campaign[];
  onDismiss: () => void;
}

export function CampaignResumeNotification({
  integrationId,
  accountName,
  campaigns,
  onDismiss,
}: CampaignResumeNotificationProps) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-green-900">
              Campaigns resumed successfully
            </h4>
            <p className="text-sm text-green-700 mt-1">
              {campaigns.length} campaign{campaigns.length > 1 ? "s" : ""}{" "}
              resumed for <span className="font-medium">{accountName}</span>
            </p>

            <div className="mt-2 flex flex-col gap-1">
              {campaigns.map(campaign => (
                <Link
                  key={campaign.id}
                  href={`/outreach/campaigns/${campaign.id}`}
                  className="text-sm text-green-800 hover:text-green-900 underline"
                >
                  {campaign.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-green-400 hover:text-green-600 flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
