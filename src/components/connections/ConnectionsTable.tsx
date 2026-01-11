"use client";

import { Connection, ConnectionWithCRMSync, CRMSyncStatus } from "@/types/connection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { CRMSyncStatusBadge } from "./CRMSyncStatusBadge";

interface ConnectionsTableProps {
  connections: Connection[] | ConnectionWithCRMSync[];
  isLoading: boolean;
  showCRMSync?: boolean;
}

/**
 * Helper function to get initials from a name.
 * Returns first two letters of first and last name.
 */
function getInitials(name?: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Loading skeleton component for the table.
 * Displays 5 placeholder rows with animation.
 */
function TableLoadingSkeleton({ showCRMSync = false }: { showCRMSync?: boolean }) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-medium">Profile</TableHead>
            <TableHead className="font-medium">Headline</TableHead>
            <TableHead className="font-medium">Company</TableHead>
            <TableHead className="font-medium">Connected</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            {showCRMSync && <TableHead className="font-medium">CRM Sync</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              {showCRMSync && (
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-md" />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Empty state component shown when no connections are found.
 */
function EmptyState() {
  return (
    <div className="border rounded-lg p-12 text-center text-muted-foreground">
      No connections found. Try adjusting your filters.
    </div>
  );
}

/**
 * ConnectionsTable component displays a list of LinkedIn connections
 * in a table format with profile information, headline, company,
 * connected date, and status.
 */
export function ConnectionsTable({
  connections,
  isLoading,
  showCRMSync = false,
}: ConnectionsTableProps) {
  if (isLoading) {
    return <TableLoadingSkeleton showCRMSync={showCRMSync} />;
  }

  if (connections.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-medium">Profile</TableHead>
            <TableHead className="font-medium">Headline</TableHead>
            <TableHead className="font-medium">Company</TableHead>
            <TableHead className="font-medium">Connected</TableHead>
            <TableHead className="font-medium">Status</TableHead>
            {showCRMSync && <TableHead className="font-medium">CRM Sync</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {connections.map(connection => (
            <TableRow
              key={connection.id}
              className="hover:bg-muted/30 transition-colors"
            >
              {/* Profile column: avatar, name, position, LinkedIn link */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={connection.profile_pic_url}
                      alt={connection.name || "Profile"}
                    />
                    <AvatarFallback>
                      {getInitials(connection.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {connection.name || "Unknown"}
                      </span>
                      {connection.profile_url && (
                        <a
                          href={connection.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-primary flex-shrink-0"
                          title="Open LinkedIn profile"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    {connection.position && (
                      <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {connection.position}
                      </p>
                    )}
                  </div>
                </div>
              </TableCell>

              {/* Headline column */}
              <TableCell>
                <p className="text-sm line-clamp-2 max-w-[300px]">
                  {connection.headline || "-"}
                </p>
              </TableCell>

              {/* Company column */}
              <TableCell>
                <span className="text-sm">{connection.company || "-"}</span>
              </TableCell>

              {/* Connected date column */}
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {connection.connected_on
                    ? format(new Date(connection.connected_on), "MMM d, yyyy")
                    : "-"}
                </span>
              </TableCell>

              {/* Status column */}
              <TableCell>
                {connection.is_excluded ? (
                  <Badge variant="secondary">Excluded</Badge>
                ) : (
                  <Badge variant="outline">Active</Badge>
                )}
              </TableCell>

              {/* CRM Sync column */}
              {showCRMSync && (
                <TableCell>
                  <CRMSyncStatusBadge
                    status={(connection as ConnectionWithCRMSync).crm_sync_status}
                  />
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
