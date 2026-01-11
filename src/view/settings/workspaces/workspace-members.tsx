"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRightLeft,
  Edit,
  Shield,
  Users,
  Search,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TransferWorkspaceMemberModal,
  EditWorkspaceMemberModal,
  RemoveWorkspaceMemberModal,
} from "@/components/workspace";

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  acceptedAt: string;
  status: "active" | "pending_transfer" | "pending";
  workspaceId: string;
  workspaceName: string;
}

interface ApiMember {
  id: string;
  name: string;
  email: string;
  role: string;
  workspace_name: string;
  workspace_id: string;
  status: string;
  accepted_at: string;
  permissions: string[];
}

interface ApiResponse {
  success: boolean;
  data: {
    data: ApiMember[];
    page: number;
    limit: number;
    total: number;
  };
}

export function WorkspaceMembersView() {
  const [allMembers, setAllMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(
    null
  );
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  // Map API status to component status
  const mapStatus = (apiStatus: string): WorkspaceMember["status"] => {
    switch (apiStatus.toUpperCase()) {
      case "ACCEPTED":
        return "active";
      case "PENDING":
        return "pending";
      case "PENDING_TRANSFER":
        return "pending_transfer";
      default:
        return "pending";
    }
  };

  // Convert role from uppercase to title case
  const formatRole = (role: string): string => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const mapApiMemberToWorkspaceMember = (
    apiMember: ApiMember
  ): WorkspaceMember => {
    return {
      id: apiMember.id,
      name: apiMember.name,
      email: apiMember.email,
      avatar: undefined, // No avatar in API response
      role: formatRole(apiMember.role),
      permissions: apiMember.permissions,
      acceptedAt: apiMember.accepted_at,
      status: mapStatus(apiMember.status),
      workspaceId: apiMember.workspace_id,
      workspaceName: apiMember.workspace_name,
    };
  };

  // Get unique workspaces from members data
  const availableWorkspaces = useMemo(() => {
    const uniqueWorkspaces = Array.from(
      new Set(allMembers.map(member => member.workspaceId))
    ).map(workspaceId => {
      const member = allMembers.find(m => m.workspaceId === workspaceId);
      return { id: workspaceId, name: member?.workspaceName || workspaceId };
    });

    return [{ id: "all", name: "All Workspaces" }, ...uniqueWorkspaces];
  }, [allMembers]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        "/api/workspaces/members/list?page=1&limit=100"
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result: ApiResponse = await response.json();
      // Handle wrapped response from backend ResponseInterceptor
      const membersData = result.data?.data || [];
      setAllMembers(membersData.map(mapApiMemberToWorkspaceMember));
    } catch (err) {
      setError("Failed to fetch workspace members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
    const interval = setInterval(fetchMembers, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filteredMembers = useMemo(() => {
    return allMembers.filter(member => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesWorkspace =
        selectedWorkspace === "all" || member.workspaceId === selectedWorkspace;
      const matchesRole =
        selectedRole === "all" ||
        member.role.toLowerCase() === selectedRole.toLowerCase();

      return matchesSearch && matchesWorkspace && matchesRole;
    });
  }, [allMembers, searchTerm, selectedWorkspace, selectedRole]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Active
          </Badge>
        );
      case "pending_transfer":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Transfer Pending
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {status}
          </Badge>
        );
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
            Admin
          </Badge>
        );
      case "member":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            Member
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
            {role}
          </Badge>
        );
    }
  };

  const handleEdit = (memberId: string) => {
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setEditModalOpen(true);
    }
  };

  const handleTransfer = (memberId: string) => {
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setTransferModalOpen(true);
    }
  };

  const handleRemove = (memberId: string) => {
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setRemoveModalOpen(true);
    }
  };

  const updateMemberStatus = (
    memberId: string,
    status: WorkspaceMember["status"]
  ) => {
    setAllMembers(prev =>
      prev.map(member =>
        member.id === memberId ? { ...member, status } : member
      )
    );
  };

  const updateMemberRoleAndPermissions = (
    memberId: string,
    name: string,
    role: string,
    permissions: string[]
  ) => {
    setAllMembers(prev =>
      prev.map(member =>
        member.id === memberId
          ? {
              ...member,
              name,
              role: role.charAt(0).toUpperCase() + role.slice(1),
              permissions,
            }
          : member
      )
    );
  };

  if (loading && allMembers.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </div>

        {/* Members Table Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined At
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-6 w-16" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-4 px-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error: {error}
        </h3>
        <p className="text-gray-500 mb-4">
          Please try again later or check your network connection.
        </p>
        <Button
          onClick={fetchMembers}
          disabled={loading}
          className="flex items-center gap-2 mx-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Workspace Members
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredMembers.length} of {allMembers.length} members
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMembers}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <Select
            value={selectedWorkspace}
            onValueChange={setSelectedWorkspace}
          >
            <SelectTrigger className="w-48 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="All Workspaces" />
            </SelectTrigger>
            <SelectContent>
              {availableWorkspaces.map(workspace => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-48 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* No Results Message */}
      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No members found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}

      {/* Members Table - Only show when there are results */}
      {filteredMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined At
                  </th>
                  <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map(member => (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-3">
                          <AvatarImage
                            src={
                              member.avatar ||
                              `/placeholder.svg?height=32&width=32&text=${member.name.charAt(0)}`
                            }
                            alt={member.name}
                          />
                          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium">
                            {member.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {member.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {member.workspaceName}
                      </span>
                    </td>
                    <td className="py-4 px-4">{getRoleBadge(member.role)}</td>
                    <td className="py-4 px-4">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {member.acceptedAt
                          ? new Date(member.acceptedAt)
                              .toDateString()
                              .slice(0, 10) +
                            " " +
                            new Date(member.acceptedAt)
                              .toTimeString()
                              .slice(0, 5)
                          : "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(member.id)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTransfer(member.id)}
                          disabled={member.status === "pending_transfer"}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(member.id)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedMember && (
        <>
          <TransferWorkspaceMemberModal
            member={{
              id: selectedMember.id,
              name: selectedMember.name,
              email: selectedMember.email,
              permissions: selectedMember.permissions,
              teamId: selectedMember.workspaceId,
            }}
            open={transferModalOpen}
            onOpenChange={setTransferModalOpen}
            onTransferInitiated={memberId =>
              updateMemberStatus(memberId, "pending_transfer")
            }
          />
          <EditWorkspaceMemberModal
            member={{
              id: selectedMember.id,
              name: selectedMember.name,
              role: selectedMember.role,
              permissions: selectedMember.permissions,
            }}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onMemberUpdated={updateMemberRoleAndPermissions}
          />
          <RemoveWorkspaceMemberModal
            member={{
              id: selectedMember.id,
              name: selectedMember.name,
              email: selectedMember.email,
              role: selectedMember.role,
            }}
            open={removeModalOpen}
            onOpenChange={setRemoveModalOpen}
            onMemberRemoved={() => {
              setAllMembers(prev =>
                prev.filter(m => m.id !== selectedMember?.id)
              );
              setSelectedMember(null);
            }}
          />
        </>
      )}
    </div>
  );
}

// Legacy alias for backward compatibility
export const TeamMembersView = WorkspaceMembersView;
