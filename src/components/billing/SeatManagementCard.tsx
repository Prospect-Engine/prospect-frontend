"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ArrowRight, AlertTriangle } from "lucide-react";
import { useSeatStatistics, SeatStatistics } from "@/hooks/useSeatStatistics";

interface SeatManagementCardProps {
  className?: string;
}

/**
 * Card component displaying organization seat allocation summary
 * with a link to the full seat management page
 */
export function SeatManagementCard({ className }: SeatManagementCardProps) {
  const { statistics, isLoading, error, refreshStatistics } =
    useSeatStatistics();

  // Refresh statistics on mount
  useEffect(() => {
    refreshStatistics();
  }, []);

  if (isLoading) {
    return <SeatManagementCardSkeleton className={className} />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Seat Management
          </CardTitle>
          <CardDescription>
            Manage seat allocations across workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshStatistics()}
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!statistics || !statistics.organization) {
    return null;
  }

  const { organization } = statistics;
  const utilizationColor = getUtilizationColor(
    organization.utilizationPercentage
  );

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Seat Management
            </CardTitle>
            <CardDescription>
              Manage seat allocations across workspaces
            </CardDescription>
          </div>
          <Link href="/billing/seats">
            <Button variant="outline" size="sm">
              Manage
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Usage Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {organization.totalSeats}
              </div>
              <div className="text-xs text-muted-foreground">Total Seats</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {organization.usedSeats}
              </div>
              <div className="text-xs text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {organization.availableSeats}
              </div>
              <div className="text-xs text-muted-foreground">Available</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Utilization</span>
              <span className={utilizationColor}>
                {organization.utilizationPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={organization.utilizationPercentage}
              className="h-2"
            />
          </div>

          {/* Workspace Summary */}
          {statistics.workspaces.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {statistics.workspaces.length} workspace
                {statistics.workspaces.length !== 1 ? "s" : ""} with seat
                allocations
              </div>
            </div>
          )}

          {/* Warning if high utilization */}
          {organization.utilizationPercentage >= 90 && (
            <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded-md text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs">
                {organization.utilizationPercentage >= 100
                  ? "All seats are in use. Consider upgrading your plan."
                  : "Running low on available seats."}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for the SeatManagementCard
 */
function SeatManagementCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center space-y-1">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Get color class based on utilization percentage
 */
function getUtilizationColor(percentage: number): string {
  if (percentage >= 90) return "text-red-600 dark:text-red-400";
  if (percentage >= 75) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

export default SeatManagementCard;
