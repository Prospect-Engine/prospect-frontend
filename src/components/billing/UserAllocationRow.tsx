"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Pencil, Trash2, User } from "lucide-react";
import { UserAllocation } from "@/hooks/useSeatAllocations";

interface UserAllocationRowProps {
  allocation: UserAllocation;
  onEdit: (allocation: UserAllocation) => void;
  onDelete: (allocation: UserAllocation) => void;
  disabled?: boolean;
}

/**
 * Row component for displaying a user's seat allocation within a workspace
 * Rendered as a nested row under WorkspaceAllocationTable
 */
export function UserAllocationRow({
  allocation,
  onEdit,
  onDelete,
  disabled = false,
}: UserAllocationRowProps) {
  const utilizationPercentage =
    allocation.allocatedSeats > 0
      ? (allocation.usedSeats / allocation.allocatedSeats) * 100
      : 0;

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/50">
      {/* Indentation spacer */}
      <TableCell className="w-8" />

      {/* User info */}
      <TableCell>
        <div className="flex items-center gap-2 pl-4">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{allocation.userName}</span>
        </div>
      </TableCell>

      {/* Allocated seats */}
      <TableCell className="text-center">
        <span className="font-mono">{allocation.allocatedSeats}</span>
      </TableCell>

      {/* Used seats */}
      <TableCell className="text-center">
        <span className="font-mono text-primary">{allocation.usedSeats}</span>
      </TableCell>

      {/* Available seats */}
      <TableCell className="text-center">
        <span className="font-mono text-green-600">
          {allocation.availableSeats}
        </span>
      </TableCell>

      {/* Utilization */}
      <TableCell>
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={utilizationPercentage} className="h-1.5 flex-1" />
          <span className="text-xs text-muted-foreground w-10 text-right">
            {utilizationPercentage.toFixed(0)}%
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(allocation)}
            disabled={disabled}
            title="Edit allocation"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(allocation)}
            disabled={disabled || allocation.usedSeats > 0}
            title={
              allocation.usedSeats > 0
                ? "Cannot delete: seats in use"
                : "Delete allocation"
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default UserAllocationRow;
