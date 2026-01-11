"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface MaintenanceModeProps {
  children: React.ReactNode;
}

interface MaintenanceStatus {
  is_maintenance_mode: boolean;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export default function MaintenanceMode({ children }: MaintenanceModeProps) {
  const [maintenanceStatus, setMaintenanceStatus] =
    useState<MaintenanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkMaintenanceStatus = async () => {
      try {
        const response = await fetch("/api/maintenance/status");
        if (response.ok) {
          const status = await response.json();
          setMaintenanceStatus(status);
        }
      } catch (error) {
        // Fallback to environment variable if API fails
        const fallbackStatus: MaintenanceStatus = {
          is_maintenance_mode:
            process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
          is_done: process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setMaintenanceStatus(fallbackStatus);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenanceStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 300000);
    return () => clearInterval(interval);
  }, []);

  // Show loading state briefly
  if (isLoading) {
    return <>{children}</>;
  }

  // If maintenance mode is disabled, render children normally
  if (!maintenanceStatus?.is_maintenance_mode || maintenanceStatus?.is_done) {
    return <>{children}</>;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl text-foreground">
            System Maintenance
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            We&apos;re currently performing scheduled maintenance to improve
            your experience.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Our team is working hard to bring you an even better experience.
              Please check back in a few minutes.
            </p>

            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-1">
                Expected Duration
              </p>
              <p className="text-sm text-muted-foreground">
                Usually 30-60 minutes
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button
              onClick={handleRefresh}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Check Again
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              If you continue to see this message, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
