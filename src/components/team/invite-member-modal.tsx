"use client";

import type React from "react";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberInvited: (memberData: {
    email: string;
    name: string;
    role: string;
    permissions: string[];
    teamId?: string;
  }) => void;
  showTeamSelection?: boolean;
  availableTeams?: { id: string; name: string }[];
  defaultTeamId?: string;
}

const availableRoles = [
  {
    id: "MEMBER",
    label: "Member",
    defaultPermissions: ["VIEW_CAMPAIGNS"],
  },
  {
    id: "ADMIN",
    label: "Admin",
    defaultPermissions: [
      "VIEW_CAMPAIGNS",
      "MANAGE_CAMPAIGNS",
      "VIEW_BILLING",
      "MANAGE_MEMBER",
      "INTEGRATE_ACCOUNT",
    ],
  },
  {
    id: "CLIENT",
    label: "Client",
    defaultPermissions: ["VIEW_CAMPAIGNS"],
  },
];

const availablePermissions = [
  {
    id: "VIEW_CAMPAIGNS",
    label: "View Campaigns",
    description: "View campaign data and analytics",
  },
  {
    id: "MANAGE_CAMPAIGNS",
    label: "Manage Campaigns",
    description: "Create, edit, and manage campaigns",
  },
  {
    id: "VIEW_BILLING",
    label: "View Billing",
    description: "Access billing information and invoices",
  },
  {
    id: "MANAGE_MEMBER",
    label: "Manage Member",
    description: "Add, remove, and manage team members",
  },
  {
    id: "INTEGRATE_ACCOUNT",
    label: "Integrate Account",
    description: "Access integration features (requires seat)",
  },
];

// Mock seat availability check
const mockSeatCheck = () => {
  return Math.random() > 0.3; // 70% chance of having seats available
};

export function InviteMemberModal({
  open,
  onOpenChange,
  onMemberInvited,
  showTeamSelection,
  availableTeams,
  defaultTeamId,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState<string[]>(["VIEW_CAMPAIGNS"]);
  const [seatWarning, setSeatWarning] = useState<string | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (permissionId === "INTEGRATE_ACCOUNT" && checked) {
      // Check seat availability
      const hasSeats = mockSeatCheck();
      if (!hasSeats) {
        setSeatWarning("No free seat available for integration permission.");
        return;
      }
    }

    setSeatWarning(null);

    if (checked) {
      setPermissions(prev => [...prev, permissionId]);
    } else {
      setPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !role) return;

    // Validate that we have a team ID when showTeamSelection is false
    if (!showTeamSelection && !defaultTeamId) {
      setSeatWarning("No team selected for invitation.");
      return;
    }

    // Validate that we're not trying to invite to a team that's still being created
    // This prevents sending temporary IDs (temp-*) to the API when teams are in "Creating..." state
    const teamId = showTeamSelection ? selectedTeam : defaultTeamId;
    if (teamId && teamId.startsWith("temp-")) {
      setSeatWarning(
        "Cannot invite members to a team that is still being created. Please wait for the team creation to complete."
      );
      return;
    }

    setIsInviting(true);

    try {
      const teamId = showTeamSelection ? selectedTeam : defaultTeamId;

      // Try new endpoint first, fallback to legacy
      let response = await fetch("/api/workspaces/members/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace_id: teamId,
          team_id: teamId, // Include legacy field for backward compatibility
          role,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          permissions,
        }),
      });

      // If new endpoint fails, try legacy endpoint
      if (!response.ok) {
        response = await fetch("/api/team/member/send-invitation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            team_id: teamId,
            role,
            email: email.trim().toLowerCase(),
            name: name.trim(),
            permissions,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to send invitation");
        setIsInviting(false);
        return;
      }

      await response.json();

      onMemberInvited({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role,
        permissions,
        teamId: showTeamSelection ? selectedTeam : defaultTeamId,
      });

      // Reset form
      setEmail("");
      setName("");
      setRole("");
      setPermissions(["VIEW_CAMPAIGNS"]);
      setSeatWarning(null);
      setIsInviting(false);
      setSelectedTeam("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Network error. Please check your connection and try again.");
      setIsInviting(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setName("");
    setRole("");
    setPermissions(["VIEW_CAMPAIGNS"]);
    setSeatWarning(null);
    setSelectedTeam("");
    onOpenChange(false);
  };

  const handleRoleChange = (newRole: string) => {
    setRole(newRole);

    // Auto-set default permissions for the role
    const roleConfig = availableRoles.find(r => r.id === newRole);
    if (roleConfig) {
      setPermissions(roleConfig.defaultPermissions);
    }
    setSeatWarning(null);
  };

  const isFormValid =
    !email.trim() ||
    !name.trim() ||
    !role ||
    isInviting ||
    (showTeamSelection && !selectedTeam) ||
    (!showTeamSelection && !defaultTeamId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new team member. They will receive an email
            with instructions to join.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="member@company.com"
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              className="mt-1"
              required
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="role">Role *</Label>
              <Select value={role} onValueChange={handleRoleChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(roleOption => (
                    <SelectItem key={roleOption.id} value={roleOption.id}>
                      {roleOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showTeamSelection && availableTeams && (
              <div className="flex-1">
                <Label htmlFor="team">Team *</Label>
                <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Permissions</Label>
            <div className="space-y-3 mt-2">
              {availablePermissions.map(permission => {
                const isChecked = permissions.includes(permission.id);
                const isIntegratePermission =
                  permission.id === "INTEGRATE_ACCOUNT";

                return (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={isChecked}
                      onCheckedChange={checked =>
                        handlePermissionChange(
                          permission.id,
                          checked as boolean
                        )
                      }
                    />
                    <div className="flex-1">
                      <label
                        htmlFor={permission.id}
                        className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                      >
                        {permission.label}
                        {isIntegratePermission && (
                          <Shield className="h-3 w-3" />
                        )}
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {seatWarning && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{seatWarning}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isFormValid}>
              {isInviting ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
