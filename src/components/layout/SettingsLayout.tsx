"use client";

import React from "react";
import { useRouter } from "next/router";
import { TopBar } from "./TopBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface SettingsLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function SettingsLayout({ children, className }: SettingsLayoutProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar - shared across all apps */}
      <TopBar />

      {/* Main Content Area - no sidebar */}
      <main className={cn("flex-1", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {children}
        </div>
      </main>
    </div>
  );
}

export default SettingsLayout;
