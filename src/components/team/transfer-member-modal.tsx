"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  teamId: string;
}

interface Team {
  id: string;
  name: string;
}

interface TransferMemberModalProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferInitiated: (memberId: string) => void;
}

export function TransferMemberModal({
  member,
  open,
  onOpenChange,
  onTransferInitiated,
}: TransferMemberModalProps) {
  const [teamInput, setTeamInput] = useState<string>("");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [transferAllData, setTransferAllData] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const hasIntegratePermission =
    member.permissions.includes("integrate_account");

  const permissionLabels: Record<string, string> = {
    view_campaigns: "View Campaigns",
    manage_campaigns: "Manage Campaigns",
    view_billing: "View Billing",
    manage_member: "Manage Member",
    integrate_account: "Integrate Account",
  };

  // Fetch available teams when modal opens
  useEffect(() => {
    if (open) {
      fetchTeams();
    }
  }, [open]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    try {
      const response = await fetch("/api/workspaces/all");

      if (response.ok) {
        const result = await response.json();
        setAvailableTeams(result.data || result.workspaces || []);
      } else {
        setAvailableTeams([]);
      }
    } catch (error) {
      setAvailableTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleTransfer = async () => {
    const targetTeamId = selectedTeamId || teamInput.trim();
    if (!targetTeamId) return;

    setIsTransferring(true);

    try {
      const response = await fetch(
        `/api/workspaces/members/initiate-transfer?id=${member.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from_workspace_id: member.teamId,
            to_workspace_id: targetTeamId,
            transfer_data: transferAllData,
          }),
        }
      );

      if (response.ok) {
        await response.json();
        toast.success("Transfer initiated successfully!");
        onTransferInitiated(member.id);
        onOpenChange(false);
        setTeamInput("");
        setSelectedTeamId("");
        setTransferAllData(false);
      } else {
        const errorData = await response.json();

        // Display error message to user
        const errorMessage = errorData.message || "Failed to initiate transfer";
        toast.error(errorMessage);
      }
    } catch (error) {
      // Display error message to user
      toast.error("An error occurred while initiating the transfer");
    } finally {
      setIsTransferring(false);
    }
  };

  const isTransferDisabled = !selectedTeamId && !teamInput.trim();

  const handleTeamSelect = (team: Team) => {
    setTeamInput(team.name);
    setSelectedTeamId(team.id);
    setShowDropdown(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTeamInput(e.target.value);
    setSelectedTeamId(""); // Clear selected team when user types manually
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Team Member</DialogTitle>
          <DialogDescription>
            Transfer {member.name} to another team. This action requires
            approval from the destination team owner.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label className="text-sm font-medium">Destination Team</label>
            <div className="relative mt-1">
              <Input
                placeholder={
                  loadingTeams
                    ? "Loading teams..."
                    : "Select team or enter team ID"
                }
                value={teamInput}
                onChange={handleInputChange}
                onFocus={() => setShowDropdown(true)}
                disabled={loadingTeams}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loadingTeams}
              >
                ▼
              </Button>
              {showDropdown && availableTeams.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto scrollbar-hide">
                  {availableTeams.map(team => (
                    <div
                      key={team.id}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200"
                      onClick={() => handleTeamSelect(team)}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{team.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="transferAllData"
              checked={transferAllData}
              onChange={e => setTransferAllData(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="transferAllData" className="text-sm font-medium">
              Transfer all {member.name}&apos;s data
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">
              Permissions to Transfer
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {member.permissions.map(permission => (
                <Badge
                  key={permission}
                  variant={
                    permission === "integrate_account" ? "default" : "secondary"
                  }
                  className="flex items-center gap-1"
                >
                  {permission === "integrate_account" && (
                    <Shield className="h-3 w-3" />
                  )}
                  {permissionLabels[permission] || permission.replace("_", " ")}
                </Badge>
              ))}
            </div>
          </div>

          {transferAllData && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {member.name}&apos;s all data will be transferred including
                campaigns, leads, conversations, and other associated data. This
                action cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {hasIntegratePermission && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {member.name} has &quot;Integrate Account&quot; permission. The
                destination team must have available seats to accept this
                transfer.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={isTransferDisabled || isTransferring}
          >
            {isTransferring ? "Initiating Transfer..." : "Initiate Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
