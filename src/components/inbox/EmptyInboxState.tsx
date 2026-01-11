"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  RefreshCw,
  Linkedin,
  Megaphone,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateContext =
  | "no-integration" // User has no LinkedIn connected
  | "needs-sync" // Integration exists but no conversations synced
  | "no-conversations" // Synced but empty (no conversations)
  | "filter-empty"; // Has conversations but filter returns empty

interface EmptyInboxStateProps {
  context: EmptyStateContext;
  onSyncMessages?: () => void;
  onNavigateToIntegrations?: () => void;
  onNavigateToCampaigns?: () => void;
  onClearFilter?: () => void;
  isSyncing?: boolean;
  cooldownRemaining?: number;
  filterName?: string;
  className?: string;
}

const EmptyInboxState: React.FC<EmptyInboxStateProps> = ({
  context,
  onSyncMessages,
  onNavigateToIntegrations,
  onNavigateToCampaigns,
  onClearFilter,
  isSyncing = false,
  cooldownRemaining = 0,
  filterName,
  className,
}) => {
  const configs: Record<
    EmptyStateContext,
    {
      icon: React.ReactNode;
      iconBg: string;
      title: string;
      description: string;
      primaryAction?: {
        label: string;
        onClick?: () => void;
        icon?: React.ReactNode;
        disabled?: boolean;
        loading?: boolean;
      };
      secondaryAction?: {
        label: string;
        onClick?: () => void;
      };
      features?: string[];
    }
  > = {
    "no-integration": {
      icon: <Linkedin className="w-8 h-8 text-blue-600" />,
      iconBg: "bg-blue-50 dark:bg-blue-950/30",
      title: "Connect Your LinkedIn Account",
      description:
        "Link your LinkedIn account to start syncing conversations and managing your outreach from one place.",
      primaryAction: {
        label: "Connect LinkedIn",
        onClick: onNavigateToIntegrations,
        icon: <ArrowRight className="w-4 h-4 ml-2" />,
      },
      features: [
        "Sync all your LinkedIn conversations",
        "Reply to messages directly from here",
        "Track campaign responses in one inbox",
      ],
    },
    "needs-sync": {
      icon: <RefreshCw className="w-8 h-8 text-emerald-600" />,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
      title: "Sync Your Conversations",
      description:
        "Your LinkedIn account is connected! Sync your messages to see all your conversations here.",
      primaryAction: {
        label: isSyncing
          ? "Syncing..."
          : cooldownRemaining > 0
            ? `Wait ${cooldownRemaining}s`
            : "Sync Messages Now",
        onClick: onSyncMessages,
        icon: isSyncing ? (
          <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
        ) : undefined,
        disabled: isSyncing || cooldownRemaining > 0,
        loading: isSyncing,
      },
      features: [
        "Import existing LinkedIn conversations",
        "Auto-sync new messages in real-time",
        "Keep everything organized by campaign",
      ],
    },
    "no-conversations": {
      icon: <Inbox className="w-8 h-8 text-violet-600" />,
      iconBg: "bg-violet-50 dark:bg-violet-950/30",
      title: "Your Inbox is Ready",
      description:
        "You're all set! Start a campaign to begin conversations with prospects, or sync again if you have existing chats.",
      primaryAction: {
        label: "Launch a Campaign",
        onClick: onNavigateToCampaigns,
        icon: <Megaphone className="w-4 h-4 mr-2" />,
      },
      secondaryAction: {
        label: isSyncing
          ? "Syncing..."
          : cooldownRemaining > 0
            ? `Sync in ${cooldownRemaining}s`
            : "Sync Messages",
        onClick:
          !isSyncing && cooldownRemaining === 0 ? onSyncMessages : undefined,
      },
      features: [
        "Send personalized connection requests",
        "Automate follow-up sequences",
        "Track replies and engagement",
      ],
    },
    "filter-empty": {
      icon: <MessageCircle className="w-8 h-8 text-amber-600" />,
      iconBg: "bg-amber-50 dark:bg-amber-950/30",
      title: "No Matching Conversations",
      description: filterName
        ? `No conversations match the "${filterName}" filter. Try a different filter or view all conversations.`
        : "No conversations match your current filter. Try adjusting your search or filters.",
      primaryAction: {
        label: "Show All Conversations",
        onClick: onClearFilter,
      },
    },
  };

  const config = configs[context];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto",
        className
      )}
    >
      {/* Icon with animated background */}
      <div
        className={cn(
          "relative w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm",
          config.iconBg
        )}
      >
        {config.icon}
        {context === "needs-sync" && !isSyncing && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Title */}
      <h2 className="mb-3 text-xl font-semibold text-foreground">
        {config.title}
      </h2>

      {/* Description */}
      <p className="mb-6 text-sm text-muted-foreground leading-relaxed max-w-sm">
        {config.description}
      </p>

      {/* Features list */}
      {config.features && config.features.length > 0 && (
        <div className="mb-8 space-y-3 text-left w-full max-w-xs">
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {config.primaryAction && (
          <Button
            onClick={config.primaryAction.onClick}
            disabled={config.primaryAction.disabled}
            className={cn(
              "w-full rounded-lg px-6 py-2.5",
              context === "no-integration" &&
                "bg-blue-600 hover:bg-blue-700 text-white",
              context === "needs-sync" &&
                "bg-emerald-600 hover:bg-emerald-700 text-white",
              context === "no-conversations" &&
                "bg-violet-600 hover:bg-violet-700 text-white",
              context === "filter-empty" &&
                "bg-amber-600 hover:bg-amber-700 text-white"
            )}
          >
            {config.primaryAction.icon &&
              !config.primaryAction.loading &&
              typeof config.primaryAction.icon === "object" &&
              "props" in config.primaryAction.icon &&
              !(config.primaryAction.icon as any).props?.className?.includes(
                "ml-"
              ) &&
              config.primaryAction.icon}
            {config.primaryAction.label}
            {config.primaryAction.icon &&
              typeof config.primaryAction.icon === "object" &&
              "props" in config.primaryAction.icon &&
              (config.primaryAction.icon as any).props?.className?.includes(
                "ml-"
              ) &&
              config.primaryAction.icon}
          </Button>
        )}

        {config.secondaryAction && (
          <Button
            variant="ghost"
            onClick={config.secondaryAction.onClick}
            disabled={!config.secondaryAction.onClick}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {config.secondaryAction.label}
          </Button>
        )}
      </div>

      {/* Subtle hint */}
      {context === "no-conversations" && (
        <p className="mt-6 text-xs text-muted-foreground/70 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Pro tip: Messages from prospects will appear here automatically
        </p>
      )}
    </div>
  );
};

export default EmptyInboxState;
