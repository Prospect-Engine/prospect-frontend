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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle, User, Crown, Users } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  permissions: string[];
}

interface ManageMemberRolePermissionsModalProps {
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
    icon: User,
    defaultPermissions: [],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Crown,
    defaultPermissions: [
      "view_campaigns",
      "manage_campaigns",
      "view_billing",
      "manage_member",
      "integrate_account",
    ],
  },
  {
    id: "client",
    label: "Client",
    icon: Users,
    defaultPermissions: ["view_campaigns", "integrate_account"],
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

// Mock seat availability check
const mockSeatCheck = () => {
  return Math.random() > 0.3; // 70% chance of having seats available
};

export function ManageMemberRolePermissionsModal({
  member,
  open,
  onOpenChange,
  onMemberUpdated,
}: ManageMemberRolePermissionsModalProps) {
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
  const [seatWarning, setSeatWarning] = useState<string | null>(null);
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
      if (newRole === "client") {
        // Client can only have view_campaigns and integrate_account
        setSelectedPermissions(["view_campaigns", "integrate_account"]);
      } else if (newRole === "admin") {
        // Admin must have all permissions
        setSelectedPermissions(availablePermissions.map(p => p.id));
      } else {
        // Member starts with no permissions selected
        setSelectedPermissions([]);
      }
    }
    setSeatWarning(null);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (permissionId === "integrate_account" && checked) {
      // Check seat availability
      const hasSeats = mockSeatCheck();
      if (!hasSeats) {
        setSeatWarning("No free seat available for integration permission.");
        return;
      }
    }

    setSeatWarning(null);

    let newPermissions: string[];
    if (checked) {
      newPermissions = [...selectedPermissions, permissionId];
    } else {
      newPermissions = selectedPermissions.filter(p => p !== permissionId);
    }

    // Enforce role-based permission rules
    if (selectedRole === "admin") {
      // Admin must have all permissions - if any permission is removed, change to member
      if (newPermissions.length < availablePermissions.length) {
        setSelectedRole("member");
        setSelectedPermissions(newPermissions); // Keep the current permissions, just change role
        return;
      }
    } else if (selectedRole === "client") {
      // Client can only have view_campaigns and integrate_account
      if (
        permissionId !== "view_campaigns" &&
        permissionId !== "integrate_account"
      ) {
        return; // Don't allow other permissions for client
      }
    }

    // If all permissions are selected, automatically change to Admin role
    if (newPermissions.length === availablePermissions.length) {
      setSelectedRole("admin");
    }

    setSelectedPermissions(newPermissions);
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

  const handleClose = () => {
    setMemberName(member.name);
    setSelectedRole(member.role.toLowerCase());
    setSelectedPermissions(mapApiPermissionsToComponent(member.permissions));
    setSeatWarning(null);
    onOpenChange(false);
  };

  const hasChanges =
    memberName.trim() !== member.name.trim() ||
    selectedRole !== member.role.toLowerCase() ||
    JSON.stringify(selectedPermissions.sort()) !==
      JSON.stringify(mapApiPermissionsToComponent(member.permissions).sort());

  const selectedRoleConfig = availableRoles.find(r => r.id === selectedRole);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Member</DialogTitle>
          <DialogDescription>
            Update member name, role, and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Name Input */}
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

          {/* Role Selection */}
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
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => {
                  const IconComponent = role.icon;
                  return (
                    <SelectItem key={role.id} value={role.id}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{role.label}</div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedRoleConfig && (
              <div className="mt-2 p-3 bg-muted rounded-lg">
                <div className="flex flex-wrap gap-1">
                  {selectedPermissions.map(permission => (
                    <Badge
                      key={permission}
                      variant="outline"
                      className="text-xs"
                    >
                      {availablePermissions.find(p => p.id === permission)
                        ?.label || permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Permissions */}
          <div>
            <Label className="text-sm font-medium">Custom Permissions</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Customize permissions beyond the default role permissions
            </p>
            <div className="space-y-3">
              {availablePermissions.map(permission => {
                const isChecked = selectedPermissions.includes(permission.id);
                const isIntegratePermission =
                  permission.id === "integrate_account";

                // Determine if permission should be disabled based on role
                const isDisabled =
                  (selectedRole === "client" &&
                    permission.id !== "view_campaigns" &&
                    permission.id !== "integrate_account") ||
                  (selectedRole === "admin" && !isChecked); // Admin can't uncheck permissions

                return (
                  <div
                    key={permission.id}
                    className="flex items-start space-x-3"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={isChecked}
                      disabled={isDisabled || isSaving}
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
                        className={`text-sm font-medium flex items-center gap-2 ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                      >
                        {permission.label}
                        {isIntegratePermission && (
                          <Shield className="h-3 w-3" />
                        )}
                        {selectedRole === "admin" && !isChecked && (
                          <Badge variant="outline" className="text-xs ml-2">
                            Required for Admin
                          </Badge>
                        )}
                        {selectedRole === "client" &&
                          permission.id !== "view_campaigns" &&
                          permission.id !== "integrate_account" && (
                            <Badge variant="outline" className="text-xs ml-2">
                              Not available for Client
                            </Badge>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
