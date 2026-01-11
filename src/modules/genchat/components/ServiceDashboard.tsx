"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  Target,
  MessageSquare,
  Search,
  Calendar,
  UserPlus,
  Sparkles,
  ArrowRight,
  Clock,
  Plus,
  Headphones,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SERVICE_CONFIGS, type ServiceType } from "@/lib/services/constants";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const serviceIcons: Record<ServiceType, typeof Users> = {
  RECRUITING: Users,
  LEAD_GEN: Target,
  FEEDBACK: MessageSquare,
  RESEARCH: Search,
  EVENTS: Calendar,
  ONBOARDING: UserPlus,
  SUPPORT: Headphones,
};

const serviceGradients: Record<ServiceType, string> = {
  RECRUITING: "from-blue-500 to-blue-600",
  LEAD_GEN: "from-green-500 to-green-600",
  FEEDBACK: "from-purple-500 to-purple-600",
  RESEARCH: "from-orange-500 to-orange-600",
  EVENTS: "from-pink-500 to-pink-600",
  ONBOARDING: "from-teal-500 to-teal-600",
  SUPPORT: "from-cyan-500 to-cyan-600",
};

const servicePaths: Record<ServiceType, { dashboard: string; create: string }> = {
  RECRUITING: { dashboard: "/admin/recruiting", create: "/admin/jobs/new" },
  LEAD_GEN: { dashboard: "/admin/lead-gen", create: "/admin/lead-gen/projects/new" },
  FEEDBACK: { dashboard: "/admin/feedback", create: "/admin/feedback/surveys/new" },
  RESEARCH: { dashboard: "/admin/research", create: "/admin/research/studies/new" },
  EVENTS: { dashboard: "/admin/events", create: "/admin/events/new" },
  ONBOARDING: { dashboard: "/admin/onboarding", create: "/admin/onboarding/new" },
  SUPPORT: { dashboard: "/admin/widget", create: "/admin/widget/projects/new" },
};

interface ServiceDashboardProps {
  userName: string;
  serviceData: Record<ServiceType, {
    stats: Array<{ title: string; value: number; description: string }>;
    recentItems: Array<{ id: string; title: string; subtitle: string; timestamp: Date; status?: string }>;
    projectCount: number;
  }>;
}

export function ServiceDashboard({ userName, serviceData }: ServiceDashboardProps) {
  const [selectedService, setSelectedService] = useState<ServiceType>("RECRUITING");

  const currentService = SERVICE_CONFIGS[selectedService];
  const currentData = serviceData[selectedService];
  const Icon = serviceIcons[selectedService];
  const gradient = serviceGradients[selectedService];
  const paths = servicePaths[selectedService];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {userName}
          </h1>
        </div>
      </div>

      {/* Service Tabs - Top Bar */}
      <div className="relative">
        <div className="flex items-center gap-2 p-1.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl overflow-x-auto">
          {Object.values(SERVICE_CONFIGS).map((service) => {
            const ServiceIcon = serviceIcons[service.type];
            const isSelected = selectedService === service.type;
            const data = serviceData[service.type];

            return (
              <button
                key={service.type}
                onClick={() => setSelectedService(service.type)}
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap",
                  "min-w-[140px] flex-shrink-0",
                  isSelected
                    ? cn("bg-white dark:bg-[#2c2c2e] shadow-lg", service.bgColor)
                    : "hover:bg-white/50 dark:hover:bg-white/[0.04]"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-lg",
                  isSelected ? service.bgColor : "bg-black/[0.04] dark:bg-white/[0.06]"
                )}>
                  <ServiceIcon className={cn(
                    "h-4 w-4",
                    isSelected ? service.color : "text-muted-foreground"
                  )} />
                </div>
                <div className="text-left">
                  <p className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {service.shortName}
                  </p>
                  {isSelected && (
                    <p className="text-[10px] text-muted-foreground">
                      {data.projectCount} projects
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Service Content */}
      <div className="space-y-6">
        {/* Service Hero */}
        <div className={cn(
          "relative overflow-hidden rounded-3xl p-8 md:p-10",
          "bg-gradient-to-br",
          gradient
        )}>
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-white/80" />
                <span className="text-sm font-medium text-white/80">{currentService.name}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                {currentService.shortName} Dashboard
              </h2>
              <p className="text-white/70 text-lg max-w-xl">
                {currentService.description}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={paths.dashboard}>
                <Button
                  size="lg"
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 hover:border-white/50 backdrop-blur-sm"
                >
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href={paths.create}>
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 shadow-lg"
                >
                  <Plus className="h-4 w-4" />
                  Create New
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {currentData.stats.map((stat, index) => (
            <div
              key={stat.title}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-semibold tracking-tight text-foreground">
                  {stat.value.toLocaleString()}{stat.description.includes("%") ? "%" : ""}
                </p>
                <p className="text-sm text-muted-foreground/70">{stat.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl", currentService.bgColor)}>
                  <Clock className={cn("h-4 w-4", currentService.color)} />
                </div>
                <div>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest {currentService.shortName.toLowerCase()} activity</CardDescription>
                </div>
              </div>
              <Link href={paths.dashboard}>
                <Button variant="ghost" size="sm" className={currentService.color}>
                  View All
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {currentData.recentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className={cn(
                  "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4",
                  currentService.bgColor
                )}>
                  <Icon className={cn("h-6 w-6", currentService.color)} />
                </div>
                <p className="text-muted-foreground font-medium">No activity yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1 mb-4">
                  Get started by creating your first {currentService.shortName.toLowerCase()} project
                </p>
                <Link href={paths.create}>
                  <Button size="sm">
                    <Plus className="h-3 w-3" />
                    Create {currentService.shortName}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {currentData.recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors duration-200"
                  >
                    <div className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm",
                      "bg-gradient-to-br",
                      gradient
                    )}>
                      {item.title[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {item.status && (
                        <Badge variant="outline" className="text-[10px]">
                          {item.status.replace(/_/g, " ")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:block">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links for Selected Service */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentService.features.slice(0, 3).map((feature, index) => (
            <Link
              key={feature}
              href={paths.dashboard}
              className="group relative overflow-hidden rounded-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/[0.04] dark:hover:shadow-black/20 hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110",
                  currentService.bgColor
                )}>
                  <Icon className={cn("h-5 w-5", currentService.color)} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{feature}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
