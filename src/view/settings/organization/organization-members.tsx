"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/utils/formatDateTime";
import { toast } from "sonner";
import {
  InviteOrganizationMemberModal,
  EditOrganizationMemberModal,
  RemoveOrganizationMemberModal,
} from "@/components/organization";

interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id?: string;
  email: string;
  name: string;
  role: string;
  status: string;
  permissions: string[];
  invited_by: string;
  created_at: string;
  accepted_at?: string;
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ADMIN: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  MEMBER: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const STATUS_COLORS: Record<string, string> = {
  ACCEPTED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  DECLINED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function OrganizationMembersView() {
  const { user } = useAuth();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<OrganizationMember | null>(null);

  const organizationId = user?.organization_id;

  const canManageMembers =
    user?.organization_role === "OWNER" ||
    user?.organization_role === "ADMIN" ||
    user?.organization_permissions?.includes("MANAGE_MEMBERS");

  const fetchMembers = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/auth/organizations/${organizationId}/members`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch members: ${response.status}`);
      }

      const result = await response.json();
      // Handle both wrapped { data: { members: [] } } and direct { members: [] } response
      const data = result.data || result;
      const membersArray = data.members || [];

      setMembers(membersArray);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch members";
      setError(errorMessage);
      toast.error("Failed to load organization members");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInviteMember = async (memberData: {
    email: string;
    name?: string;
    role: string;
    permissions?: string[];
  }) => {
    if (!organizationId) return;

    try {
      const response = await fetch(
        `/api/auth/organizations/${organizationId}/members/invite`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(memberData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.message || result.error || "Failed to invite member";
        throw new Error(errorMessage);
      }

      setInviteModalOpen(false);
      toast.success("Member invited successfully");
      fetchMembers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to invite member";
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: {
      role?: string;
      permissions?: string[];
      name?: string;
    }
  ) => {
    if (!organizationId) return;

    try {
      const response = await fetch(
        `/api/auth/organizations/${organizationId}/members/${memberId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.message || result.error || "Failed to update member";
        throw new Error(errorMessage);
      }

      setEditModalOpen(false);
      setSelectedMember(null);
      toast.success("Member updated successfully");
      fetchMembers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update member";
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organizationId) return;

    try {
      const response = await fetch(
        `/api/auth/organizations/${organizationId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        const errorMessage =
          result.message || result.error || "Failed to remove member";
        throw new Error(errorMessage);
      }

      setRemoveModalOpen(false);
      setSelectedMember(null);
      toast.success("Member removed successfully");
      fetchMembers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to remove member";
      toast.error(errorMessage);
      throw err;
    }
  };

  const openEditModal = (member: OrganizationMember) => {
    setSelectedMember(member);
    setEditModalOpen(true);
  };

  const openRemoveModal = (member: OrganizationMember) => {
    setSelectedMember(member);
    setRemoveModalOpen(true);
  };

  const canEditMember = (member: OrganizationMember) => {
    // Cannot edit owner
    if (member.role === "OWNER") return false;
    // Cannot edit self
    if (member.user_id === user?.id) return false;
    return canManageMembers;
  };

  const canRemoveMember = (member: OrganizationMember) => {
    // Cannot remove owner
    if (member.role === "OWNER") return false;
    // Cannot remove self
    if (member.user_id === user?.id) return false;
    return canManageMembers;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            Error loading members
          </div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <Button
            variant="outline"
            onClick={() => fetchMembers()}
            className="text-gray-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Organization Members
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage members of your organization
          </p>
        </div>
        {canManageMembers && (
          <Button
            onClick={() => setInviteModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Members
            </CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.filter(m => m.status === "ACCEPTED").length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Pending Invitations
            </CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {members.filter(m => m.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No members yet
              </h3>
              <p className="text-gray-500 mb-4">
                Start by inviting members to your organization.
              </p>
              {canManageMembers && (
                <Button
                  onClick={() => setInviteModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Joined</TableHead>
                  {canManageMembers && (
                    <TableHead className="w-[50px]"></TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ROLE_COLORS[member.role] || ROLE_COLORS.MEMBER
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          STATUS_COLORS[member.status] || STATUS_COLORS.PENDING
                        }
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {member.permissions.slice(0, 2).map(perm => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className="text-xs"
                          >
                            {perm.replace(/_/g, " ")}
                          </Badge>
                        ))}
                        {member.permissions.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.permissions.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {member.accepted_at
                          ? formatDateTime(member.accepted_at)
                          : member.created_at
                            ? formatDateTime(member.created_at)
                            : "-"}
                      </div>
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        {(canEditMember(member) || canRemoveMember(member)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEditMember(member) && (
                                <DropdownMenuItem
                                  onClick={() => openEditModal(member)}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canRemoveMember(member) && (
                                <DropdownMenuItem
                                  onClick={() => openRemoveModal(member)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <InviteOrganizationMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvite={handleInviteMember}
      />

      {selectedMember && (
        <>
          <EditOrganizationMemberModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            member={selectedMember}
            onUpdate={handleUpdateMember}
          />

          <RemoveOrganizationMemberModal
            open={removeModalOpen}
            onOpenChange={setRemoveModalOpen}
            member={selectedMember}
            onRemove={handleRemoveMember}
          />
        </>
      )}
    </div>
  );
}
