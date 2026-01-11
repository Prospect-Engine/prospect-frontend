"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { InviteMemberModal } from "./invite-member-modal";
import { RemoveMemberModal } from "./remove-member-modal";
import { ManageMemberRolePermissionsModal } from "./manage-member-role-permissions-modal";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Calendar,
  Loader2,
  Save,
  X,
  Copy,
} from "lucide-react";
import { formatDateTime } from "@/utils/formatDateTime";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Pagination } from "@/components/ui/pagination";

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  owner: string;
  createdAt: string;
  seatAllocation?: {
    allocated_seats: number;
    used_seats: number;
    user_allocations?: unknown[];
  };
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  permissions: string[];
  status: "active" | "pending";
  joinedAt: string;
}

interface ApiTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  team_name?: string;
  workspace_name?: string;
  team_id?: string;
  workspace_id?: string;
  status: string;
  accepted_at: string;
  permissions: string[];
}

interface ApiResponse {
  data: ApiTeamMember[];
  page: number;
  limit: number;
  total: number;
}

interface TeamDetailsModalProps {
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTeamUpdated?: (
    teamId: string,
    newName: string,
    allocatedSeats?: number
  ) => Promise<void>;
  isOwner?: boolean;
}

export function TeamDetailsModal({
  team,
  open,
  onOpenChange,
  onTeamUpdated,
  isOwner = false,
}: TeamDetailsModalProps) {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Team name editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(team.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Allocated seats editing states
  const [isEditingSeats, setIsEditingSeats] = useState(false);
  const [allocatedSeats, setAllocatedSeats] = useState<number>(
    team.seatAllocation?.allocated_seats ?? 0
  );
  const [isUpdatingSeats, setIsUpdatingSeats] = useState(false);
  const isEditing = isEditingName || isEditingSeats;

  // Update edited name when team prop changes
  useEffect(() => {
    setEditedName(team.name);
    setAllocatedSeats(team.seatAllocation?.allocated_seats ?? 0);
  }, [team.name]);

  // Handle team name save
  const handleSaveTeamName = async () => {
    if (
      !onTeamUpdated ||
      editedName.trim() === team.name ||
      !editedName.trim()
    ) {
      setIsEditingName(false);
      setEditedName(team.name);
      return;
    }

    try {
      setIsUpdatingName(true);
      await onTeamUpdated(team.id, editedName.trim(), allocatedSeats);
      setIsEditingName(false); // Exit edit mode after successful update
    } catch (err) {
      setEditedName(team.name); // Reset to original name on error
      setIsEditingName(false);
    } finally {
      setIsUpdatingName(false);
    }
  };

  // Handle allocated seats save
  const handleSaveAllocatedSeats = async () => {
    // Prevent negative values
    const normalized = Number(Math.max(0, Number(allocatedSeats) || 0));
    if (!onTeamUpdated) {
      return;
    }
    try {
      setIsUpdatingSeats(true);
      await onTeamUpdated(team.id, editedName.trim() || team.name, normalized);
      setAllocatedSeats(normalized);
      setIsEditingSeats(false);
      toast.success("Allocated seats updated");
    } catch (err) {
      toast.error("Failed to update allocated seats");
    } finally {
      setIsUpdatingSeats(false);
    }
  };

  // Unified save for name + seats
  const handleSaveAll = async () => {
    const normalized = Number(Math.max(0, Number(allocatedSeats) || 0));
    if (!onTeamUpdated) return;
    try {
      setIsUpdatingName(true);
      setIsUpdatingSeats(true);
      await onTeamUpdated(
        team.id,
        (editedName || team.name).trim(),
        normalized
      );
      setIsEditingName(false);
      setIsEditingSeats(false);
      toast.success("Team updated");
    } catch (err) {
      toast.error("Failed to update team");
    } finally {
      setIsUpdatingName(false);
      setIsUpdatingSeats(false);
    }
  };

  const handleCancelAll = () => {
    setEditedName(team.name);
    setAllocatedSeats(team.seatAllocation?.allocated_seats ?? 0);
    setIsEditingName(false);
    setIsEditingSeats(false);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditedName(team.name);
    setIsEditingName(false);
  };

  // Handle copy team ID
  const handleCopyTeamId = async () => {
    try {
      await navigator.clipboard.writeText(team.id);
      toast.success("Team ID copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy team ID");
    }
  };

  // Transform API response to component format
  const transformApiMember = (apiMember: ApiTeamMember): TeamMember => {
    return {
      id: apiMember.id,
      name: apiMember.name,
      email: apiMember.email,
      role:
        apiMember.role.charAt(0).toUpperCase() +
        apiMember.role.slice(1).toLowerCase(),
      permissions: apiMember.permissions.map(permission =>
        permission.toLowerCase()
      ),
      status: apiMember.status === "ACCEPTED" ? "active" : "pending",
      joinedAt: new Date(apiMember.accepted_at).toISOString().split("T")[0],
    };
  };

  // Extract fetch function so it can be reused
  const fetchTeamMembers = useCallback(async () => {
    if (!team.id) return;

    try {
      setLoading(true);
      setError(null);

      // Try new endpoint first, fallback to legacy
      let response = await fetch(
        `/api/workspaces/members?workspaceId=${encodeURIComponent(team.id)}&page=${currentPage}&limit=${itemsPerPage}`
      );

      // If new endpoint fails, try legacy endpoint
      if (!response.ok) {
        response = await fetch(
          `/api/team/member/getByTeamId?teamId=${encodeURIComponent(team.id)}&page=${currentPage}&limit=${itemsPerPage}`
        );
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData?.message ||
          errorData?.error ||
          `Failed to fetch team members: ${response.status}`;
        toast.error(errorMessage);
        setError(errorMessage);
        return;
      }

      const result = await response.json();

      // Handle different response structures
      // The API might return data directly as an array or wrapped in a data property
      let teamMembersData: ApiTeamMember[] = [];
      let paginationData: {
        page: number;
        limit: number;
        total: number;
      } | null = null;

      if (Array.isArray(result)) {
        // Direct array response (no pagination)
        teamMembersData = result;
        setTotalItems(result.length);
        setTotalPages(1);
      } else if (result.data && Array.isArray(result.data)) {
        // Wrapped in data property with pagination
        teamMembersData = result.data;
        if (
          result.page !== undefined &&
          result.limit !== undefined &&
          result.total !== undefined
        ) {
          paginationData = {
            page: result.page,
            limit: result.limit,
            total: result.total,
          };
          setTotalItems(result.total);
          setTotalPages(Math.ceil(result.total / result.limit));
        } else {
          setTotalItems(result.data.length);
          setTotalPages(1);
        }
      } else if (result.members && Array.isArray(result.members)) {
        // Wrapped in members property
        teamMembersData = result.members;
        if (
          result.page !== undefined &&
          result.limit !== undefined &&
          result.total !== undefined
        ) {
          paginationData = {
            page: result.page,
            limit: result.limit,
            total: result.total,
          };
          setTotalItems(result.total);
          setTotalPages(Math.ceil(result.total / result.limit));
        } else {
          setTotalItems(result.members.length);
          setTotalPages(1);
        }
      } else {
        // Try to find any array property
        const arrayValues = Object.values(result).find(
          val => Array.isArray(val) && val.length > 0
        );
        if (arrayValues) {
          teamMembersData = arrayValues as ApiTeamMember[];
          setTotalItems(teamMembersData.length);
          setTotalPages(1);
        }
      }

      const teamMembers = teamMembersData.map(transformApiMember);
      setMembers(teamMembers);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch team members";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [team.id, currentPage, itemsPerPage]);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembersEffect = async () => {
      if (!open || !team.id) return;
      await fetchTeamMembers();
    };

    fetchTeamMembersEffect();
  }, [open, team.id, fetchTeamMembers]);

  // Reset pagination when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPage(1);
    }
  }, [open]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleInviteMember = (memberData: {
    email: string;
    name: string;
    role: string;
    permissions: string[];
  }) => {
    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: memberData.name,
      email: memberData.email,
      role: memberData.role,
      permissions: memberData.permissions,
      status: "pending",
      joinedAt: new Date().toISOString().split("T")[0],
    };
    setMembers(prev => [...prev, newMember]);
  };

  const handleRemoveMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
    // Optionally refetch the member list to ensure it's up to date
    // This is helpful in case there are concurrent changes
    setTimeout(() => {
      if (open && team.id) {
        fetchTeamMembers();
      }
    }, 500);
  };

  const handleUpdateRoleAndPermissions = (
    memberId: string,
    name: string,
    role: string,
    permissions: string[]
  ) => {
    setMembers(prev =>
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

  const openRemoveModal = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveModalOpen(true);
  };

  // Check if a member is the current user
  const isCurrentUser = (member: TeamMember) => {
    if (!currentUser || !currentUser.email || !member.email) return false;
    // Compare by email since that's the most reliable identifier
    return member.email.toLowerCase() === currentUser.email.toLowerCase();
  };

  const openPermissionsModal = (member: TeamMember) => {
    setSelectedMember(member);
    setPermissionsModalOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isEditing ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <Input
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") {
                        handleSaveAll();
                      } else if (e.key === "Escape") {
                        handleCancelAll();
                      }
                    }}
                    autoFocus
                    className="min-w-0 w-auto max-w-xs"
                    style={{
                      width: `${Math.max(editedName.length * 8 + 20, 120)}px`,
                    }}
                    disabled={isUpdatingName || isUpdatingSeats}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Allocated seats:</span>
                    <Input
                      type="number"
                      value={allocatedSeats}
                      onChange={e =>
                        setAllocatedSeats(parseInt(e.target.value || "0", 10))
                      }
                      className="w-24 h-8"
                      min={0}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={isUpdatingName || isUpdatingSeats}
                    title="Save"
                  >
                    {isUpdatingName || isUpdatingSeats ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelAll}
                    disabled={isUpdatingName || isUpdatingSeats}
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span>{team.name}</span>
                  <div className="flex items-center gap-1">
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingName(true);
                          setIsEditingSeats(true);
                        }}
                        title="Edit team name and allocated seats"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm">
                      Team ID: {team.id.slice(-4)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyTeamId}
                      title="Copy Team ID"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Team Info */}
          <div className="grid gap-4 md:grid-cols-4 mt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{totalItems || members.length}</strong> members
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Owner: <strong>{team.owner}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Allocated seats: <strong>{allocatedSeats}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Used seats:{" "}
                <strong>{team.seatAllocation?.used_seats ?? 0}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Members Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex-shrink-0 px-6 pt-4 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Team Members</h3>
              <Button
                onClick={() => setInviteModalOpen(true)}
                disabled={team.id.startsWith("temp-")}
                title={
                  team.id.startsWith("temp-")
                    ? "Cannot invite members while team is being created"
                    : "Invite a new member to this team"
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading team members...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">{error}</p>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Members List */}
            {!loading && !error && (
              <div className="space-y-3">
                {members.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No members found for this team</p>
                  </div>
                ) : (
                  members.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={member.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback className="text-xs">
                            {member.name
                              .split(" ")
                              .map(n => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {member.name}
                            </span>
                            <Badge
                              variant={
                                member.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {member.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {member.permissions.length} permissions
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isCurrentUser(member) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPermissionsModal(member)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        {!isCurrentUser(member) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRemoveModal(member)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer with Pagination */}
        {totalPages > 1 && totalItems > 0 && (
          <div className="flex-shrink-0 border-t px-6 py-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={totalItems}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemsPerPageOptions={[10, 20, 50]}
              itemLabel="members"
            />
          </div>
        )}

        {/* Actual Modals */}
        <InviteMemberModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          onMemberInvited={handleInviteMember}
          showTeamSelection={false}
          defaultTeamId={team.id}
        />

        {selectedMember && (
          <>
            <RemoveMemberModal
              member={selectedMember}
              open={removeModalOpen}
              onOpenChange={setRemoveModalOpen}
              onMemberRemoved={handleRemoveMember}
            />

            <ManageMemberRolePermissionsModal
              member={selectedMember}
              open={permissionsModalOpen}
              onOpenChange={setPermissionsModalOpen}
              onMemberUpdated={handleUpdateRoleAndPermissions}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
