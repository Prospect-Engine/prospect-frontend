import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Building,
  Users,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  VenetianMask,
  UserX,
  XCircle,
  Crown,
} from "lucide-react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import authService from "../../services/sales-services/authService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface WorkspaceData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  memberCount: number;
  userRole: "OWNER" | "ADMIN" | "MEMBER";
  organizationId: string;
  organizationName: string;
  members: Array<{
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    joinedAt: string;
    isActive?: boolean;
    isCurrentUser?: boolean;
  }>;
}

interface OrganizationData {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  website?: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

interface CreateWorkspaceData {
  name: string;
  description?: string;
  organizationId: string;
}

interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface MemberData {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  joinedAt: string;
  isActive?: boolean;
  isCurrentUser?: boolean;
}

interface ApiWorkspaceData {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  memberCount: number;
  userRole: "OWNER" | "ADMIN" | "MEMBER";
  members: Array<{
    userId: string;
    name: string;
    email: string;
    avatar?: string;
    role: "OWNER" | "ADMIN" | "MEMBER";
    joinedAt: string;
    isActive?: boolean;
    isCurrentUser?: boolean;
  }>;
}

type SortField = "name" | "createdAt" | "memberCount" | "userRole";
type SortDirection = "asc" | "desc";

const WorkspaceManager: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { selectedOrganization, selectedWorkspace, organizations } =
    useWorkspace();

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [availableOrganizations, setAvailableOrganizations] = useState<
    OrganizationData[]
  >([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<
    Set<string>
  >(new Set());
  const selectedOrgCount = selectedOrganizations.size;
  const [showOrganizationDropdown, setShowOrganizationDropdown] =
    useState(false);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState("");
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<WorkspaceData[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] =
    useState<MemberData | null>(null);
  const [impersonatingMember, setImpersonatingMember] = useState<string | null>(
    null
  );

  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "OWNER" | "ADMIN" | "MEMBER"
  >("all");

  // Sorting states
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Expanded workspace state
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set()
  );

  const [createData, setCreateData] = useState<CreateWorkspaceData>({
    name: "",
    description: "",
    organizationId: "",
  });

  const [updateData, setUpdateData] = useState<UpdateWorkspaceData>({});

  // Handle clicking outside to close dropdowns and scroll events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }

      // Close organization dropdown when clicking outside
      if (
        showOrganizationDropdown &&
        !(event.target as Element).closest(".organization-dropdown")
      ) {
        setShowOrganizationDropdown(false);
      }
    };

    const handleScroll = () => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
      if (showOrganizationDropdown) {
        setShowOrganizationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openDropdown, showOrganizationDropdown]);

  // Function to handle dropdown positioning
  const handleDropdownClick = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right - window.scrollX,
      });
      setOpenDropdown(id);
    }
  };

  // Filter and sort workspaces
  useEffect(() => {
    const filtered = workspaces.filter(workspace => {
      const matchesSearch =
        workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workspace.description &&
          workspace.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && workspace.isActive) ||
        (statusFilter === "inactive" && !workspace.isActive);

      const matchesRole =
        roleFilter === "all" || workspace.userRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort workspaces
    filtered.sort((a, b) => {
      let aValue: string | number | Date;
      let bValue: string | number | Date;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "memberCount":
          aValue = a.memberCount;
          bValue = b.memberCount;
          break;
        case "userRole":
          aValue = a.userRole;
          bValue = b.userRole;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredWorkspaces(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [
    workspaces,
    searchTerm,
    statusFilter,
    roleFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredWorkspaces.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedWorkspaces = filteredWorkspaces.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4 text-blue-500" />
    ) : (
      <ChevronDown className="w-4 h-4 text-blue-500" />
    );
  };

  // Handle workspace row click to expand/collapse members
  const handleWorkspaceClick = (workspaceId: string) => {
    setExpandedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  };

  // Member action handlers
  const handleImpersonateMember = async (member: MemberData) => {
    if (!user || !selectedOrganization) return;

    // Check if current user has permission to impersonate (OWNER or ADMIN only)
    const currentUserRole = user.globalRole;
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      setError(
        "You do not have permission to impersonate users. Only owners and admins can impersonate."
      );
      return;
    }

    // Check if trying to impersonate self
    if (member.userId === user.id) {
      setError("You cannot impersonate yourself.");
      return;
    }

    // Check if currently impersonating someone (impersonated users cannot impersonate others)
    const impersonationToken = localStorage.getItem("impersonation_token");
    if (impersonationToken) {
      setError(
        "You cannot impersonate another user while already impersonating someone. Please exit impersonation first."
      );
      return;
    }

    // Set loading state for this specific member
    setImpersonatingMember(member.userId);
    setOpenDropdown(null); // Close any open dropdowns
    setDropdownPosition(null);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setImpersonatingMember(null);
        return;
      }

      // Call impersonate API
      const response = await fetch(`${API_BASE_URL}/auth/impersonate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: member.userId,
          organizationId: selectedOrganization.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Store original token and user data for reverting
        localStorage.setItem("original_token", token);
        localStorage.setItem(
          "original_user",
          JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.globalRole,
          })
        );
        localStorage.setItem(
          "impersonated_user",
          JSON.stringify({
            id: member.userId,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
          })
        );

        // Replace the access token with impersonation token
        localStorage.setItem("crm_access_token", data.impersonationToken);
        localStorage.setItem("impersonation_token", data.impersonationToken);

        // Fetch the impersonated user's profile to get their permissions and data
        const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${data.impersonationToken}`,
            "Content-Type": "application/json",
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          // Update stored user data with impersonated user's complete profile
          localStorage.setItem("user", JSON.stringify(profileData));

          setSuccess(`Now impersonating ${member.name}. Redirecting...`);
          setTimeout(() => {
            window.location.reload(); // Reload to apply impersonation with new token and user data
          }, 1000);
        } else {
          setError("Failed to load impersonated user profile.");
          setImpersonatingMember(null);
        }
      } else {
        const errorData = await response.json();

        setError("Failed to impersonate user. You may not have permission.");
        setImpersonatingMember(null);
      }
    } catch (error) {
      setError("An error occurred while impersonating user.");
      setImpersonatingMember(null);
    }
  };

  const handleEditMember = (member: MemberData) => {
    // Check if current user has permission to edit members (OWNER or ADMIN only)
    const currentUserRole = user?.globalRole;
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      setError(
        "You do not have permission to edit members. Only owners and admins can edit members."
      );
      return;
    }

    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleDeactivateMember = (member: MemberData) => {
    // Check if current user has permission to deactivate members (OWNER or ADMIN only)
    const currentUserRole = user?.globalRole;
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      setError(
        "You do not have permission to deactivate members. Only owners and admins can deactivate members."
      );
      return;
    }

    // Check if trying to deactivate self
    if (member.userId === user?.id) {
      setError("You cannot deactivate yourself.");
      return;
    }

    setMemberToDeactivate(member);
    setShowDeactivateModal(true);
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const confirmDeactivateMember = async () => {
    if (!user || !selectedOrganization || !memberToDeactivate) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members/${memberToDeactivate.userId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !memberToDeactivate.isActive,
          }),
        }
      );

      if (response.ok) {
        // Update local state to reflect the change immediately
        setWorkspaces(prevWorkspaces =>
          prevWorkspaces.map(workspace => ({
            ...workspace,
            members: workspace.members.map(member =>
              member.userId === memberToDeactivate.userId
                ? { ...member, isActive: !member.isActive }
                : member
            ),
          }))
        );

        setSuccess(
          `${memberToDeactivate.name} has been ${memberToDeactivate.isActive ? "deactivated" : "activated"} successfully!`
        );
        setTimeout(() => setSuccess(""), 5000);

        // Refresh user data and workspaces to show updated data
        await refreshUser();
        if (selectedOrganizations.size > 0) {
          loadWorkspacesFromMultipleOrganizations(
            Array.from(selectedOrganizations)
          );
        }
      } else {
        const errorData = await response.json();

        setError(
          "Failed to update member status. You may not have permission."
        );
      }
    } catch (error) {
      setError("An error occurred while updating member status.");
    } finally {
      setShowDeactivateModal(false);
      setMemberToDeactivate(null);
    }
  };

  const handleRemoveMember = async (member: MemberData) => {
    if (!user || !selectedOrganization) return;

    // Check if current user has permission to remove members (OWNER or ADMIN only)
    const currentUserRole = user.globalRole;
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      setError(
        "You do not have permission to remove members. Only owners and admins can remove members."
      );
      return;
    }

    // Check if trying to remove self
    if (member.userId === user.id) {
      setError("You cannot remove yourself from the organization.");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove ${member.name} from the organization? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members/${member.userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Remove from local state - this would need to be implemented based on your data structure
        setSuccess(`${member.name} has been removed from the organization.`);
        setTimeout(() => setSuccess(""), 3000);

        // Refresh user data to get updated member information
        await refreshUser();
      } else {
        const errorData = await response.json();

        setError("Failed to remove member. You may not have permission.");
      }
    } catch (error) {
      setError("An error occurred while removing member.");
    }
  };

  const loadWorkspacesFromMultipleOrganizations = useCallback(
    async (organizationIds: string[]) => {
      if (!user || organizationIds.length === 0) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("crm_access_token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        // Load workspaces from all selected organizations
        const allWorkspaces: WorkspaceData[] = [];

        for (const orgId of organizationIds) {
          try {
            const response =
              await authService.getWorkspacesByOrganization(orgId);

            if (response.success && response.data) {
              // Add organization info to each workspace
              const org = availableOrganizations.find(o => o.id === orgId);
              const workspacesWithOrg = response.data.map(
                (workspace: Record<string, unknown>) => ({
                  ...(workspace as unknown as ApiWorkspaceData),
                  organizationId: orgId,
                  organizationName: org?.name || `Organization ${orgId}`,
                })
              );
              allWorkspaces.push(...workspacesWithOrg);
            }
          } catch (err) {}
        }

        setWorkspaces(allWorkspaces);
      } catch (err) {
        setError("Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    },
    [user, availableOrganizations]
  );

  const loadWorkspaces = useCallback(
    async (organizationId: string) => {
      if (!user) return;

      setLoading(true);
      try {
        const token = localStorage.getItem("crm_access_token");
        if (!token) {
          setError("No authentication token found");
          return;
        }

        const response =
          await authService.getWorkspacesByOrganization(organizationId);

        if (response.success && response.data) {
          // Add organization info to each workspace
          const org = availableOrganizations.find(o => o.id === organizationId);
          const workspacesWithOrg = response.data.map(
            (workspace: Record<string, unknown>) => ({
              ...(workspace as unknown as ApiWorkspaceData),
              organizationId: organizationId,
              organizationName: org?.name || "Unknown Organization",
            })
          );
          setWorkspaces(workspacesWithOrg);
        } else {
          setError(response.error || "Failed to load workspaces");
        }
      } catch (err) {
        setError("Failed to load workspaces");
      } finally {
        setLoading(false);
      }
    },
    [user, availableOrganizations]
  );

  // Load available organizations from workspace context
  useEffect(() => {
    if (organizations && organizations.length > 0) {
      const orgs = organizations.map(org => ({
        id: org.id,
        name: org.name,
        description: org.description,
        logo: org.logo,
        website: org.website,
        role: org.role,
        isActive: org.isActive,
        createdAt: org.createdAt,
      }));

      setAvailableOrganizations(orgs);

      // Initialize with current selected organization if no organizations are selected yet
      if (selectedOrganization && selectedOrgCount === 0) {
        setSelectedOrganizations(new Set([selectedOrganization.id]));
      }
    }
  }, [organizations, selectedOrganization, selectedOrgCount]);

  // Load workspaces when selected organizations change
  useEffect(() => {
    if (selectedOrgCount > 0) {
      // Only load if organizations are available, otherwise wait for them
      if (availableOrganizations.length > 0) {
        loadWorkspacesFromMultipleOrganizations(
          Array.from(selectedOrganizations)
        );
      }
    } else if (selectedOrgCount === 0) {
      setWorkspaces([]);
      setFilteredWorkspaces([]);
    }
  }, [
    selectedOrganizations,
    selectedOrgCount,
    availableOrganizations.length,
    loadWorkspacesFromMultipleOrganizations,
  ]);

  // Legacy: Load workspaces when organization changes (for backward compatibility)
  useEffect(() => {
    if (selectedOrganization && selectedOrgCount === 0) {
      setCreateData(prev => ({
        ...prev,
        organizationId: selectedOrganization.id,
      }));
      loadWorkspaces(selectedOrganization.id);
    }
  }, [selectedOrganization, selectedOrgCount, loadWorkspaces]);

  // Remove this useEffect as it was causing infinite loops
  // The workspace loading is now handled by the selectedOrganizations useEffect

  // Process workspace data to add isCurrentUser property
  useEffect(() => {
    if (workspaces.length > 0 && userId) {
      const processedWorkspaces = workspaces.map(workspace => ({
        ...workspace,
        members:
          workspace.members?.map(member => ({
            ...member,
            isCurrentUser: member.userId === userId,
          })) || [],
      }));
      setFilteredWorkspaces(processedWorkspaces);
    }
  }, [workspaces, userId]);

  const createWorkspace = async () => {
    if (!createData.name.trim()) {
      setError("Workspace name is required");
      return;
    }

    if (!createData.organizationId) {
      setError("Please select an organization");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await authService.createWorkspace({
        name: createData.name,
        description: createData.description,
        organizationId: createData.organizationId,
      });

      if (response.success) {
        setSuccess("Workspace created successfully!");
        setShowCreateModal(false);
        setCreateData({
          name: "",
          description: "",
          organizationId: createData.organizationId,
        });

        // Refresh user data to get the new workspace
        await refreshUser();
      } else {
        setError(response.error || "Failed to create workspace");
      }
    } catch (err) {
      setError("Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  const updateWorkspace = async () => {
    if (!editingWorkspace) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await authService.updateWorkspace(
        editingWorkspace.id,
        updateData
      );

      if (response.success) {
        setSuccess("Workspace updated successfully!");
        setShowEditModal(false);
        setEditingWorkspace(null);
        setUpdateData({});

        // Refresh user data to get the updated workspace
        await refreshUser();
      } else {
        setError(response.error || "Failed to update workspace");
      }
    } catch (err) {
      setError("Failed to update workspace");
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkspace = async (
    workspaceId: string,
    workspaceName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const response = await authService.deleteWorkspace(workspaceId);

      if (response.success) {
        setSuccess("Workspace deleted successfully!");
        // Refresh workspaces list
        if (selectedOrganizations.size > 0) {
          loadWorkspacesFromMultipleOrganizations(
            Array.from(selectedOrganizations)
          );
        }
      } else {
        setError(response.error || "Failed to delete workspace");
      }
    } catch (err) {
      setError("Failed to delete workspace");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (workspace: WorkspaceData) => {
    setEditingWorkspace(workspace);
    setUpdateData({
      name: workspace.name,
      description: workspace.description || "",
      isActive: workspace.isActive,
    });
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="w-4 h-4 text-purple-600" />;
      case "ADMIN":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "MEMBER":
        return <UserX className="w-4 h-4 text-gray-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    if (isActive) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  // Organization selection handlers
  const handleOrganizationToggle = (orgId: string) => {
    const newSelected = new Set(selectedOrganizations);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }

    setSelectedOrganizations(newSelected);
  };

  const handleSelectAllOrganizations = () => {
    const allOrgIds = availableOrganizations.map(org => org.id);

    setSelectedOrganizations(new Set(allOrgIds));
  };

  const handleClearAllOrganizations = () => {
    setSelectedOrganizations(new Set());
  };

  const getFilteredOrganizations = () => {
    return availableOrganizations.filter(
      org =>
        org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase()) ||
        (org.description &&
          org.description
            .toLowerCase()
            .includes(organizationSearchTerm.toLowerCase()))
    );
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (availableOrganizations.length === 0) {
    return (
      <div className="p-8 mb-8 bg-white rounded-xl border border-gray-200 shadow-sm">
        <h2 className="mb-8 text-2xl font-bold text-gray-900">
          Workspace Management
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Building className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No Organizations Available
            </h3>
            <p className="text-gray-600">
              You don&apos;t have access to any organizations yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 mb-8 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h2 className="mb-8 text-2xl font-bold text-gray-900">
        Workspace Management
      </h2>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Manage workspaces across your organizations
            </h3>
            <p className="mt-1 text-gray-600">
              {selectedOrganizations.size > 0
                ? `Viewing workspaces from ${selectedOrganizations.size} organization${selectedOrganizations.size !== 1 ? "s" : ""}`
                : "Select organizations to view their workspaces"}
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center px-3 py-2 font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
          >
            <Plus className="mr-2 w-4 h-4" /> Create Workspace
          </button>
        </div>

        {/* Organization Multi-Select */}
        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Select Organizations:
          </label>
          <div className="relative">
            <button
              onClick={() =>
                setShowOrganizationDropdown(!showOrganizationDropdown)
              }
              className="flex justify-between items-center px-3 py-2 w-full text-sm text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="flex items-center space-x-2">
                {selectedOrganizations.size > 0 ? (
                  <>
                    <span className="text-gray-900">
                      {selectedOrganizations.size} organization
                      {selectedOrganizations.size !== 1 ? "s" : ""} selected
                    </span>
                    <span className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                      {selectedOrganizations.size}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">
                    Select organizations to view workspaces
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${showOrganizationDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showOrganizationDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg organization-dropdown">
                {/* Search */}
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={organizationSearchTerm}
                      onChange={e => setOrganizationSearchTerm(e.target.value)}
                      className="py-2 pr-3 pl-10 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Select All / Clear All */}
                <div className="flex justify-between p-2 border-b border-gray-200">
                  <button
                    onClick={handleSelectAllOrganizations}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleClearAllOrganizations}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>

                {/* Organization List */}
                <div className="overflow-y-auto max-h-60">
                  {getFilteredOrganizations().length > 0 ? (
                    getFilteredOrganizations().map(org => (
                      <label
                        key={org.id}
                        className="flex items-center px-3 py-2 transition-colors cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedOrganizations.has(org.id)}
                          onChange={() => handleOrganizationToggle(org.id)}
                          className="mr-3 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {org.name}
                          </div>
                          {org.description && (
                            <div className="text-xs text-gray-500 truncate">
                              {org.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              org.role === "OWNER"
                                ? "bg-purple-100 text-purple-800"
                                : org.role === "ADMIN"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {org.role}
                          </span>
                          <div className="relative group">
                            <div className="inline-flex justify-center items-center w-5 h-5 bg-gray-100 rounded-full transition-colors cursor-help hover:bg-gray-200">
                              {getStatusIcon(org.isActive)}
                            </div>
                            <div className="absolute bottom-full left-1/2 z-10 px-2 py-1 mb-1 text-xs text-white whitespace-nowrap bg-gray-900 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100">
                              {org.isActive ? "Active" : "Inactive"}
                              <div className="absolute top-full left-1/2 w-0 h-0 border-transparent transform -translate-x-1/2 border-l-3 border-r-3 border-t-3 border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-sm text-center text-gray-500">
                      {organizationSearchTerm
                        ? "No organizations found matching your search."
                        : "No organizations available."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Selected Organizations Display */}
          {selectedOrganizations.size > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Array.from(selectedOrganizations).map(orgId => {
                const org = availableOrganizations.find(o => o.id === orgId);
                return org ? (
                  <span
                    key={orgId}
                    className="inline-flex items-center px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full"
                  >
                    {org.name}
                    <button
                      onClick={() => handleOrganizationToggle(orgId)}
                      className="ml-1 w-3 h-3 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">{success}</span>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search workspaces by name or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-3 py-1 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Role:</label>
              <select
                value={roleFilter}
                onChange={e =>
                  setRoleFilter(
                    e.target.value as "all" | "OWNER" | "ADMIN" | "MEMBER"
                  )
                }
                className="px-3 py-1 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Showing {filteredWorkspaces.length} of {workspaces.length}{" "}
                workspaces
              </span>
            </div>
          </div>
        </div>

        {/* Workspaces List */}
        <div className="overflow-hidden relative bg-white rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase">
                  Workspace Details
                </th>
                <th
                  className="px-8 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("userRole")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role & Status</span>
                    {getSortIcon("userRole")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("memberCount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Members</span>
                    {getSortIcon("memberCount")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Created</span>
                    {getSortIcon("createdAt")}
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Loading workspaces...
                  </td>
                </tr>
              ) : paginatedWorkspaces.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Building className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          roleFilter !== "all"
                            ? "No workspaces match your filters"
                            : "No workspaces found"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          roleFilter !== "all"
                            ? "Try adjusting your search or filter criteria."
                            : "Get started by creating your first workspace in this organization."}
                        </p>
                      </div>
                      {!searchTerm &&
                        statusFilter === "all" &&
                        roleFilter === "all" && (
                          <button
                            onClick={() => {
                              setShowCreateModal(true);
                              setError("");
                              setSuccess("");
                            }}
                            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                          >
                            <Plus className="mr-2 w-4 h-4" />
                            Create Workspace
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedWorkspaces.map(workspace => (
                  <React.Fragment key={workspace.id}>
                    <tr
                      className={`transition-colors hover:bg-gray-50 cursor-pointer ${
                        selectedWorkspace?.id === workspace.id
                          ? "bg-blue-50"
                          : ""
                      }`}
                      onClick={() => handleWorkspaceClick(workspace.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex justify-center items-center mr-3 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg">
                            <span className="text-sm font-bold text-white">
                              {workspace.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {workspace.name}
                                {selectedWorkspace?.id === workspace.id && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <ChevronRightIcon
                                className={`ml-2 w-4 h-4 text-gray-400 transition-transform ${
                                  expandedWorkspaces.has(workspace.id)
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {workspace.description
                                ? workspace.description.length > 25
                                  ? `${workspace.description.substring(0, 25)}...`
                                  : workspace.description
                                : "No description"}
                            </div>
                            <div className="flex items-center mt-1">
                              <div className="flex justify-center items-center mr-2 w-4 h-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded">
                                <span className="text-xs font-bold text-white">
                                  {workspace.organizationName
                                    .charAt(0)
                                    .toUpperCase()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600 truncate">
                                {workspace.organizationName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(workspace.userRole)}
                            <span>{workspace.userRole}</span>
                          </div>
                          <div className="relative mt-1 group">
                            <div className="inline-flex justify-center items-center w-6 h-6 bg-gray-100 rounded-full transition-colors cursor-help hover:bg-gray-200">
                              {getStatusIcon(workspace.isActive)}
                            </div>
                            <div className="absolute bottom-full left-1/2 z-10 px-2 py-1 mb-2 text-xs text-white whitespace-nowrap bg-gray-900 rounded opacity-0 transition-opacity duration-200 transform -translate-x-1/2 pointer-events-none group-hover:opacity-100">
                              {workspace.isActive ? "Active" : "Inactive"}
                              <div className="absolute top-full left-1/2 w-0 h-0 border-t-4 border-r-4 border-l-4 border-transparent transform -translate-x-1/2 border-t-gray-900"></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {workspace.memberCount} members
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {workspace.createdAt &&
                            new Date(workspace.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="relative dropdown-container">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDropdownClick(workspace.id, e);
                            }}
                            className="p-2 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-50"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdown === workspace.id &&
                            dropdownPosition && (
                              <div
                                className="fixed z-50 w-48 bg-white rounded-md border border-gray-200 shadow-lg"
                                style={{
                                  top: `${dropdownPosition.top}px`,
                                  right: `${dropdownPosition.right}px`,
                                  opacity: 0,
                                  transform: "translateY(-10px) scale(0.95)",
                                  animation:
                                    "dropdownAppear 0.2s ease-out forwards",
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      startEdit(workspace);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Edit className="mr-3 w-4 h-4 text-blue-500" />
                                    Edit Workspace
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Implement manage members functionality
                                      alert(
                                        "Manage members functionality would be implemented here"
                                      );
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Users className="mr-3 w-4 h-4 text-green-500" />
                                    Manage Members
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Implement invite members functionality
                                      alert(
                                        "Invite members functionality would be implemented here"
                                      );
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Plus className="mr-3 w-4 h-4 text-purple-500" />
                                    Invite Members
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Implement workspace settings functionality
                                      alert(
                                        "Workspace settings functionality would be implemented here"
                                      );
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Building className="mr-3 w-4 h-4 text-orange-500" />
                                    Workspace Settings
                                  </button>
                                  <button
                                    onClick={() => {
                                      // TODO: Implement workspace analytics functionality
                                      alert(
                                        "Workspace analytics functionality would be implemented here"
                                      );
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50"
                                  >
                                    <Users className="mr-3 w-4 h-4 text-indigo-500" />
                                    View Analytics
                                  </button>
                                  {workspace.userRole === "OWNER" && (
                                    <button
                                      onClick={() => {
                                        deleteWorkspace(
                                          workspace.id,
                                          workspace.name
                                        );
                                        setOpenDropdown(null);
                                        setDropdownPosition(null);
                                      }}
                                      className="flex items-center px-4 py-2 w-full text-sm text-red-600 transition-colors hover:bg-red-50"
                                    >
                                      <Trash2 className="mr-3 w-4 h-4 text-red-500" />
                                      Delete Workspace
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Members Section */}
                    {expandedWorkspaces.has(workspace.id) && (
                      <tr>
                        <td colSpan={5} className="px-6 py-0 bg-gray-50">
                          <div className="px-6 py-4">
                            <h4 className="mb-3 text-sm font-medium text-gray-900">
                              Members of {workspace.name}
                            </h4>
                            {workspace.members &&
                            workspace.members.length > 0 ? (
                              <div className="space-y-2">
                                {workspace.members.map(member => (
                                  <div
                                    key={member.userId}
                                    className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200"
                                  >
                                    <div className="flex items-center">
                                      <div className="flex justify-center items-center mr-3 w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded">
                                        <span className="text-xs font-bold text-white">
                                          {member.name.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {member.name}
                                          {member.isCurrentUser && (
                                            <span className="ml-2 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                              You
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {member.email}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span
                                          className={`px-2 py-1 rounded-full ${
                                            member.role === "OWNER"
                                              ? "bg-purple-100 text-purple-800"
                                              : member.role === "ADMIN"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {member.role}
                                        </span>
                                        <span>
                                          Joined{" "}
                                          {new Date(
                                            member.joinedAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                      {!member.isCurrentUser && (
                                        <div className="relative dropdown-container">
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              handleDropdownClick(
                                                `member-${member.userId}`,
                                                e
                                              );
                                            }}
                                            className="p-1 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-50"
                                          >
                                            <MoreVertical className="w-3 h-3" />
                                          </button>

                                          {openDropdown ===
                                            `member-${member.userId}` &&
                                            dropdownPosition && (
                                              <div
                                                className="fixed z-50 w-40 bg-white rounded-md border border-gray-200 shadow-lg"
                                                style={{
                                                  top: `${dropdownPosition.top}px`,
                                                  right: `${dropdownPosition.right}px`,
                                                  opacity: 0,
                                                  transform:
                                                    "translateY(-10px) scale(0.95)",
                                                  animation:
                                                    "dropdownAppear 0.2s ease-out forwards",
                                                }}
                                              >
                                                <div className="py-1">
                                                  {member.isActive && (
                                                    <button
                                                      onClick={() => {
                                                        handleImpersonateMember(
                                                          member
                                                        );
                                                        setOpenDropdown(null);
                                                        setDropdownPosition(
                                                          null
                                                        );
                                                      }}
                                                      disabled={
                                                        impersonatingMember ===
                                                        member.userId
                                                      }
                                                      className={`flex items-center px-3 py-1 w-full text-xs transition-colors ${
                                                        impersonatingMember !==
                                                        member.userId
                                                          ? "text-gray-700 hover:bg-gray-50"
                                                          : "text-gray-500 cursor-not-allowed"
                                                      }`}
                                                    >
                                                      {impersonatingMember ===
                                                      member.userId ? (
                                                        <div className="mr-2 w-3 h-3 rounded-full border border-purple-500 animate-spin border-t-transparent" />
                                                      ) : (
                                                        <VenetianMask className="mr-2 w-3 h-3 text-purple-500" />
                                                      )}
                                                      {impersonatingMember ===
                                                      member.userId
                                                        ? "Impersonating..."
                                                        : "Impersonate"}
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => {
                                                      handleEditMember(member);
                                                      setOpenDropdown(null);
                                                      setDropdownPosition(null);
                                                    }}
                                                    className="flex items-center px-3 py-1 w-full text-xs text-gray-700 transition-colors hover:bg-gray-50"
                                                  >
                                                    <Edit className="mr-2 w-3 h-3 text-blue-500" />
                                                    Edit Member
                                                  </button>
                                                  <button
                                                    onClick={() => {
                                                      handleDeactivateMember(
                                                        member
                                                      );
                                                      setOpenDropdown(null);
                                                      setDropdownPosition(null);
                                                    }}
                                                    className={`flex items-center px-3 py-1 w-full text-xs transition-colors ${
                                                      member.isActive
                                                        ? "text-orange-600 hover:bg-orange-50"
                                                        : "text-green-600 hover:bg-green-50"
                                                    }`}
                                                  >
                                                    {member.isActive ? (
                                                      <UserX className="mr-2 w-3 h-3 text-orange-500" />
                                                    ) : (
                                                      <CheckCircle className="mr-2 w-3 h-3 text-green-500" />
                                                    )}
                                                    {member.isActive
                                                      ? "Deactivate"
                                                      : "Activate"}
                                                  </button>
                                                  {member.role !== "OWNER" && (
                                                    <button
                                                      onClick={() => {
                                                        handleRemoveMember(
                                                          member
                                                        );
                                                        setOpenDropdown(null);
                                                        setDropdownPosition(
                                                          null
                                                        );
                                                      }}
                                                      className="flex items-center px-3 py-1 w-full text-xs text-red-600 transition-colors hover:bg-red-50"
                                                    >
                                                      <Trash2 className="mr-2 w-3 h-3 text-red-500" />
                                                      Remove Member
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="py-6 text-center">
                                <Users className="mx-auto mb-3 w-8 h-8 text-gray-400" />
                                <p className="mb-1 text-sm font-medium text-gray-900">
                                  No members found
                                </p>
                                <p className="mb-4 text-sm text-gray-500">
                                  This workspace has no members yet.
                                </p>
                                <button
                                  onClick={() => {
                                    // TODO: Implement invite members functionality
                                    alert(
                                      "Invite members functionality would be implemented here"
                                    );
                                  }}
                                  className="flex items-center px-3 py-2 mx-auto text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                >
                                  <Plus className="mr-2 w-4 h-4" />
                                  Invite Members
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 mt-6 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredWorkspaces.length)} of{" "}
                {filteredWorkspaces.length} results
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1 text-sm text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="mr-1 w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${
                        currentPage === pageNum
                          ? "text-white bg-blue-600"
                          : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-1 text-sm text-gray-500 bg-white rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Workspace Modal */}
        {showCreateModal && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
            <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Create Workspace
                </h3>
                <p className="text-sm text-gray-600">
                  Create a new workspace in your selected organization
                </p>
              </div>

              {error && (
                <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">{success}</span>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  createWorkspace();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={createData.name}
                    onChange={e =>
                      setCreateData({ ...createData, name: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workspace name"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Organization *
                  </label>
                  <select
                    value={createData.organizationId}
                    onChange={e =>
                      setCreateData({
                        ...createData,
                        organizationId: e.target.value,
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select an organization</option>
                    {availableOrganizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={createData.description}
                    onChange={e =>
                      setCreateData({
                        ...createData,
                        description: e.target.value,
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workspace description"
                    rows={3}
                  />
                </div>
                <div className="flex mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateData({
                        name: "",
                        description: "",
                        organizationId: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Workspace Modal */}
        {showEditModal && editingWorkspace && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
            <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Workspace
                </h3>
                <p className="text-sm text-gray-600">
                  Update workspace information
                </p>
              </div>

              {error && (
                <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">{success}</span>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  updateWorkspace();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={updateData.name || ""}
                    onChange={e =>
                      setUpdateData({ ...updateData, name: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={updateData.description || ""}
                    onChange={e =>
                      setUpdateData({
                        ...updateData,
                        description: e.target.value,
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter workspace description"
                    rows={3}
                  />
                </div>
                <div className="flex mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingWorkspace(null);
                      setUpdateData({});
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditModal && editingMember && (
          <div className="flex fixed inset-0 z-50 justify-center items-center  bg-opacity-50">
            <div className="p-6 mx-4 w-full max-w-md bg-white rounded-lg">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Edit Member: {editingMember.name}
              </h3>
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editingMember.name}
                    disabled
                    className="px-3 py-2 w-full text-gray-500 bg-gray-50 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingMember.email}
                    disabled
                    className="px-3 py-2 w-full text-gray-500 bg-gray-50 rounded-lg border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    value={editingMember.role}
                    onChange={e =>
                      setEditingMember({
                        ...editingMember,
                        role: e.target.value as "OWNER" | "ADMIN" | "MEMBER",
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={editingMember.isActive ? "active" : "inactive"}
                    onChange={e =>
                      setEditingMember({
                        ...editingMember,
                        isActive: e.target.value === "active",
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      const token = localStorage.getItem("crm_access_token");
                      if (!token) return;

                      // Update member role
                      const response = await fetch(
                        `${API_BASE_URL}/auth/organizations/${selectedOrganization?.id}/members/${editingMember.userId}/role`,
                        {
                          method: "PATCH",
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            role: editingMember.role,
                          }),
                        }
                      );

                      if (response.ok) {
                        setSuccess(
                          `Member ${editingMember.name} updated successfully!`
                        );
                        setShowEditModal(false);
                        setEditingMember(null);
                        // Refresh user data and workspaces to show updated data
                        await refreshUser();
                        if (selectedOrganizations.size > 0) {
                          loadWorkspacesFromMultipleOrganizations(
                            Array.from(selectedOrganizations)
                          );
                        }
                      } else {
                        const errorData = await response.json();
                        setError(
                          errorData.message || "Failed to update member"
                        );
                      }
                    } catch (error) {
                      setError("An error occurred while updating member");
                    }
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Update Member
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Deactivate/Activate Member Modal */}
        {showDeactivateModal && memberToDeactivate && (
          <div className="flex fixed inset-0 z-50 justify-center items-center  bg-opacity-50">
            <div className="p-6 mx-4 w-full max-w-md bg-white rounded-lg">
              <div className="flex items-center mb-4">
                {memberToDeactivate.isActive ? (
                  <UserX className="mr-3 w-6 h-6 text-orange-500" />
                ) : (
                  <CheckCircle className="mr-3 w-6 h-6 text-green-500" />
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {memberToDeactivate.isActive ? "Deactivate" : "Activate"}{" "}
                  Member
                </h3>
              </div>
              <p className="mb-6 text-sm text-gray-600">
                Are you sure you want to{" "}
                {memberToDeactivate.isActive ? "deactivate" : "activate"}{" "}
                <span className="font-medium">{memberToDeactivate.name}</span>?
                {memberToDeactivate.isActive
                  ? " They will no longer be able to access this workspace."
                  : " They will regain access to this workspace."}
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateModal(false);
                    setMemberToDeactivate(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivateMember}
                  className={`px-4 py-2 text-white rounded-lg ${
                    memberToDeactivate.isActive
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {memberToDeactivate.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceManager;
