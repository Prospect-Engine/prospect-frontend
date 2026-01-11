"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Mail,
  MessageCircle,
  Phone,
  Zap,
} from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { cn } from "@/lib/utils";

// Real LinkedIn Logo Component
const LinkedInLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  </svg>
);

// WhatsApp Logo
const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path
      fill="currentColor"
      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
    />
  </svg>
);

// Gmail Logo
const GmailLogo = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
    <path fill="#4285F4" d="M22.5 6v12c0 1.38-1.12 2.5-2.5 2.5h-1V8.12l-7 5.25-7-5.25V20.5H4c-1.38 0-2.5-1.12-2.5-2.5V6c0-.69.28-1.31.73-1.76A2.49 2.49 0 014 3.5h.5l7.5 5.62L19.5 3.5h.5c.69 0 1.31.28 1.76.74.45.45.74 1.07.74 1.76z"/>
  </svg>
);

interface IntegrationSummary {
  type: string;
  connected_count: number;
  total_count: number;
  has_issues: boolean;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  href: string;
  connected: number;
  total: number;
  hasIssues: boolean;
  isAvailable: boolean;
  comingSoon?: boolean;
}

export default function IntegrationsHubPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [integrationStats, setIntegrationStats] = useState<Record<string, IntegrationSummary>>({});

  // Fetch integration stats
  const fetchIntegrationStats = async () => {
    setIsLoading(true);
    try {
      const { data, status } = await apiCall({
        url: "/api/integration/list",
        method: "get",
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        const integrations = Array.isArray(data) ? data : data?.integrations || [];

        // Group by type and count
        const stats: Record<string, IntegrationSummary> = {};

        integrations.forEach((item: any) => {
          const type = item.type || "UNKNOWN";
          if (!stats[type]) {
            stats[type] = {
              type,
              connected_count: 0,
              total_count: 0,
              has_issues: false,
            };
          }
          stats[type].total_count++;
          if (item.connection_status === "CONNECTED") {
            stats[type].connected_count++;
          }
          if (item.connection_status === "ERROR" || item.connection_status === "DISCONNECTED") {
            stats[type].has_issues = true;
          }
        });

        setIntegrationStats(stats);
      }
    } catch (error) {
      console.error("Failed to fetch integration stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrationStats();
  }, []);

  const integrations: Integration[] = [
    {
      id: "linkedin",
      name: "LinkedIn",
      description: "Connect LinkedIn accounts to send connection requests, messages, and InMails to your prospects.",
      icon: <LinkedInLogo className="w-8 h-8" />,
      bgColor: "bg-[#0A66C2]",
      iconColor: "text-white",
      href: "/integration/linkedin",
      connected: integrationStats["LINKEDIN"]?.connected_count || 0,
      total: integrationStats["LINKEDIN"]?.total_count || 0,
      hasIssues: integrationStats["LINKEDIN"]?.has_issues || false,
      isAvailable: true,
    },
    {
      id: "gmail",
      name: "Gmail",
      description: "Connect Gmail accounts to send personalized email campaigns and track opens and replies.",
      icon: <GmailLogo className="w-8 h-8" />,
      bgColor: "bg-white border-2 border-gray-200",
      iconColor: "text-red-500",
      href: "/integration/gmail",
      connected: integrationStats["GMAIL"]?.connected_count || 0,
      total: integrationStats["GMAIL"]?.total_count || 0,
      hasIssues: integrationStats["GMAIL"]?.has_issues || false,
      isAvailable: true,
      comingSoon: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Connect WhatsApp Business to send messages and engage with your prospects on their preferred channel.",
      icon: <WhatsAppLogo className="w-8 h-8" />,
      bgColor: "bg-[#25D366]",
      iconColor: "text-white",
      href: "/integration/whatsapp",
      connected: integrationStats["WHATSAPP"]?.connected_count || 0,
      total: integrationStats["WHATSAPP"]?.total_count || 0,
      hasIssues: integrationStats["WHATSAPP"]?.has_issues || false,
      isAvailable: true,
      comingSoon: true,
    },
    {
      id: "slack",
      name: "Slack",
      description: "Get real-time notifications about campaign activities, replies, and important events in Slack.",
      icon: <MessageCircle className="w-8 h-8" />,
      bgColor: "bg-[#4A154B]",
      iconColor: "text-white",
      href: "/integration/slack",
      connected: integrationStats["SLACK"]?.connected_count || 0,
      total: integrationStats["SLACK"]?.total_count || 0,
      hasIssues: false,
      isAvailable: false,
      comingSoon: true,
    },
    {
      id: "hubspot",
      name: "HubSpot",
      description: "Sync your contacts and deals with HubSpot CRM for seamless lead management.",
      icon: <Zap className="w-8 h-8" />,
      bgColor: "bg-[#FF7A59]",
      iconColor: "text-white",
      href: "/integration/hubspot",
      connected: integrationStats["HUBSPOT"]?.connected_count || 0,
      total: integrationStats["HUBSPOT"]?.total_count || 0,
      hasIssues: false,
      isAvailable: false,
      comingSoon: true,
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "Connect Salesforce to sync contacts, accounts, and track campaign performance.",
      icon: <Zap className="w-8 h-8" />,
      bgColor: "bg-[#00A1E0]",
      iconColor: "text-white",
      href: "/integration/salesforce",
      connected: integrationStats["SALESFORCE"]?.connected_count || 0,
      total: integrationStats["SALESFORCE"]?.total_count || 0,
      hasIssues: false,
      isAvailable: false,
      comingSoon: true,
    },
  ];

  const IntegrationCard = ({ integration }: { integration: Integration }) => {
    const isDisabled = integration.comingSoon || !integration.isAvailable;

    return (
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-200 cursor-pointer group",
          "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
          !isDisabled && "hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 hover:-translate-y-1",
          isDisabled && "opacity-70 cursor-not-allowed"
        )}
        onClick={() => !isDisabled && router.push(integration.href)}
      >
        <CardContent className="p-6">
          {/* Coming Soon Badge */}
          {integration.comingSoon && (
            <Badge className="absolute top-4 right-4 bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400">
              Coming Soon
            </Badge>
          )}

          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
              integration.bgColor
            )}
          >
            <div className={integration.iconColor}>{integration.icon}</div>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {integration.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
            {integration.description}
          </p>

          {/* Stats & Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {integration.total > 0 ? (
                <>
                  {integration.hasIssues ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {integration.connected}/{integration.total} connected
                  </span>
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500">
                  No accounts connected
                </span>
              )}
            </div>

            {!isDisabled && (
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const SkeletonCard = () => (
    <Card className="animate-pulse bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
      <CardContent className="p-6">
        <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-full mb-2" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-3/4 mb-4" />
        <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-32" />
      </CardContent>
    </Card>
  );

  return (
    <AuthGuard>
      <AppLayout activePage="Integration">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Integrations
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Connect your accounts and tools to supercharge your outreach campaigns.
              </p>
            </div>

            {/* Messaging Channels Section */}
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Messaging Channels
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  integrations
                    .filter((i) => ["linkedin", "gmail", "whatsapp"].includes(i.id))
                    .map((integration) => (
                      <IntegrationCard key={integration.id} integration={integration} />
                    ))
                )}
              </div>
            </div>

            {/* CRM & Notifications Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                CRM & Notifications
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                  <>
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                  </>
                ) : (
                  integrations
                    .filter((i) => ["slack", "hubspot", "salesforce"].includes(i.id))
                    .map((integration) => (
                      <IntegrationCard key={integration.id} integration={integration} />
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
