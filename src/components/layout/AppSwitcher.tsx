/**
 * APP SWITCHER COMPONENT
 * ======================
 * Horizontal tab bar for switching between Geniefy products/apps.
 * Inspired by the chatqualify.io service switcher design.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Send,
  Bot,
  DollarSign,
  Users,
  CheckSquare,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Define the apps/products
interface AppConfig {
  id: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  color: string;
  path: string;
  projectCount?: number;
}

const apps: AppConfig[] = [
  {
    id: "gensales",
    name: "GenSales",
    shortName: "Sales",
    icon: Send,
    color: "#E57373",
    path: "/sales",
    projectCount: 0,
  },
  {
    id: "genchat",
    name: "GenChat",
    shortName: "Chat",
    icon: Bot,
    color: "#34c759",
    path: "/chat",
    projectCount: 0,
  },
  {
    id: "genfin",
    name: "GenFin",
    shortName: "Finance",
    icon: DollarSign,
    color: "#ff9500",
    path: "/finance",
    projectCount: 0,
  },
  {
    id: "genhr",
    name: "GenHR",
    shortName: "HR",
    icon: Users,
    color: "#af52de",
    path: "/hr",
    projectCount: 0,
  },
  {
    id: "gendo",
    name: "GenDo",
    shortName: "Tasks",
    icon: CheckSquare,
    color: "#007aff",
    path: "/tasks",
    projectCount: 0,
  },
];

// Detect current app from pathname
function detectCurrentApp(pathname: string): string {
  if (pathname.startsWith("/chat")) return "genchat";
  if (pathname.startsWith("/finance")) return "genfin";
  if (pathname.startsWith("/hr")) return "genhr";
  if (pathname.startsWith("/tasks")) return "gendo";
  if (pathname.startsWith("/sales") || pathname.startsWith("/sales") || pathname.startsWith("/outreach") || pathname.startsWith("/conversations") || pathname.startsWith("/integration") || pathname.startsWith("/analytics")) return "gensales";
  return "gensales";
}

interface AppSwitcherProps {
  className?: string;
}

export function AppSwitcher({ className }: AppSwitcherProps) {
  const router = useRouter();
  const currentAppId = detectCurrentApp(router.pathname);

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center gap-2 p-1.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-2xl overflow-x-auto">
        {apps.map((app) => {
          const isSelected = currentAppId === app.id;
          const Icon = app.icon;

          return (
            <Link key={app.id} href={app.path}>
              <button
                className={cn(
                  "flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap",
                  "min-w-[120px] flex-shrink-0",
                  isSelected
                    ? "bg-white dark:bg-[#2c2c2e] shadow-lg border-2"
                    : "hover:bg-white/50 dark:hover:bg-white/[0.04]"
                )}
                style={{
                  borderColor: isSelected ? app.color : "transparent",
                }}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg",
                    isSelected
                      ? ""
                      : "bg-black/[0.04] dark:bg-white/[0.06]"
                  )}
                  style={{
                    backgroundColor: isSelected ? `${app.color}15` : undefined,
                  }}
                >
                  <Icon
                    className={cn("h-4 w-4")}
                    style={{
                      color: isSelected ? app.color : "var(--muted-foreground)",
                    }}
                  />
                </div>
                <div className="text-left">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {app.shortName}
                  </p>
                  {isSelected && (
                    <p className="text-[10px] text-muted-foreground">
                      {app.projectCount} projects
                    </p>
                  )}
                </div>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default AppSwitcher;
