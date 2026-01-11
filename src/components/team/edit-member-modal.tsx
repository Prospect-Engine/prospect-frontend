"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Crown } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

interface EditMemberModalProps {
  member: TeamMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberUpdated: (
    memberId: string,
    name: string,
    role: string,
    permissions: string[]
  ) => void;
}

const availableRoles = [
  {
    id: "member",
    label: "Member",
    description: "Standard team member with basic access",
    icon: User,
    defaultPermissions: ["view_campaigns"],
  },
  {
    id: "admin",
    label: "Admin",
    description: "Administrator with full management access",
    icon: Crown,
    defaultPermissions: [
      "view_campaigns",
      "manage_campaigns",
      "view_billing",
      "manage_member",
      "integrate_account",
    ],
  },
];

const availablePermissions = [
  {
    id: "view_campaigns",
    label: "View Campaigns",
    description: "View campaign data and analytics",
  },
  {
    id: "manage_campaigns",
    label: "Manage Campaigns",
    description: "Create, edit, and manage campaigns",
  },
  {
    id: "view_billing",
    label: "View Billing",
    description: "Access billing information and invoices",
  },
  {
    id: "manage_member",
    label: "Manage Member",
    description: "Add, remove, and manage team members",
  },
  {
    id: "integrate_account",
    label: "Integrate Account",
    description: "Access integration features (requires seat)",
  },
];

export function EditMemberModal({
  member,
  open,
  onOpenChange,
  onMemberUpdated,
}: EditMemberModalProps) {
  // Map API permissions to component format
  const mapApiPermissionsToComponent = (apiPermissions: string[]): string[] => {
    const permissionMap: { [key: string]: string } = {
      INTEGRATE_ACCOUNT: "integrate_account",
      VIEW_CAMPAIGNS: "view_campaigns",
      MANAGE_CAMPAIGNS: "manage_campaigns",
      VIEW_BILLING: "view_billing",
      MANAGE_MEMBER: "manage_member",
    };
    return apiPermissions.map(
      permission => permissionMap[permission] || permission.toLowerCase()
    );
  };

  // Map component permissions back to API format
  const mapComponentPermissionsToApi = (
    componentPermissions: string[]
  ): string[] => {
    const permissionMap: { [key: string]: string } = {
      integrate_account: "INTEGRATE_ACCOUNT",
      view_campaigns: "VIEW_CAMPAIGNS",
      manage_campaigns: "MANAGE_CAMPAIGNS",
      view_billing: "VIEW_BILLING",
      manage_member: "MANAGE_MEMBER",
    };
    return componentPermissions.map(
      permission => permissionMap[permission] || permission.toUpperCase()
    );
  };

  const [memberName, setMemberName] = useState<string>(member.name);
  const [selectedRole, setSelectedRole] = useState<string>(
    member.role.toLowerCase()
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    mapApiPermissionsToComponent(member.permissions)
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update state when member changes
  useEffect(() => {
    setMemberName(member.name);
    setSelectedRole(member.role.toLowerCase());
    setSelectedPermissions(mapApiPermissionsToComponent(member.permissions));
  }, [member]);

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);

    // Auto-set default permissions for the role
    const roleConfig = availableRoles.find(r => r.id === newRole);
    if (roleConfig) {
      setSelectedPermissions(roleConfig.defaultPermissions);
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permissionId));
    }
  };

  const handleSave = async () => {
    // Validate name
    const trimmedName = memberName.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);

    try {
      // Convert permissions back to API format before sending
      const apiPermissions = mapComponentPermissionsToApi(selectedPermissions);

      // Try new endpoint first, fallback to legacy
      let response = await fetch("/api/workspaces/members/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          member_id: member.id, // Support both id and member_id
          role: selectedRole.toUpperCase(), // Convert to uppercase to match API expectations
          name: trimmedName,
          permissions: apiPermissions,
        }),
      });

      // Fallback to legacy endpoint if new endpoint fails
      if (!response.ok && response.status === 404) {
        response = await fetch("/api/team/member/update", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: member.id,
            role: selectedRole.toUpperCase(),
            name: trimmedName,
            permissions: apiPermissions,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update member");
        return;
      }

      await response.json();

      // Call the parent callback with the updated information
      onMemberUpdated(member.id, trimmedName, selectedRole, apiPermissions);
      onOpenChange(false);
    } catch (error) {
      // You might want to show a toast or error message here
      toast.error("Failed to update member. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Member</DialogTitle>
          <DialogDescription>
            Update member name, role, and permissions within the team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="member-name" className="text-sm font-medium">
              Name
            </Label>
            <Input
              id="member-name"
              type="text"
              value={memberName}
              onChange={e => setMemberName(e.target.value)}
              placeholder="Enter member name"
              className="mt-1"
              disabled={isSaving}
            />
          </div>

          <div>
            <Label htmlFor="member-role" className="text-sm font-medium">
              Role
            </Label>
            <Select
              value={selectedRole}
              onValueChange={handleRoleChange}
              disabled={isSaving}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center gap-2">
                      <role.icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{role.label}</div>
                        <div className="text-xs text-gray-500">
                          {role.description}
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium">Permissions</Label>
            <div className="mt-2 space-y-3">
              {availablePermissions.map(permission => (
                <div key={permission.id} className="flex items-start gap-3">
                  <Checkbox
                    id={permission.id}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={checked =>
                      handlePermissionChange(permission.id, checked as boolean)
                    }
                    disabled={isSaving}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.label}
                    </label>
                    <p className="text-xs text-gray-500">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium">Current Permissions</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPermissions.map(permission => (
                <Badge key={permission} variant="secondary">
                  {availablePermissions.find(p => p.id === permission)?.label ||
                    permission}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
