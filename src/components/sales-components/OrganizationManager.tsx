import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

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

interface OrganizationData {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  logo?: string;
  website?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  memberCount: number;
  workspaceCount: number;
  userRole: "OWNER" | "ADMIN" | "MEMBER";
  members: MemberData[];
  workspaces?: Array<{
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    memberCount: number;
    userRole: "OWNER" | "ADMIN" | "MEMBER";
    members?: MemberData[];
  }>;
}

interface CreateOrganizationData {
  name: string;
  description?: string;
  domain?: string;
  logo?: string;
  website?: string;
}

interface UpdateOrganizationData {
  name?: string;
  description?: string;
  domain?: string;
  logo?: string;
  website?: string;
  isActive?: boolean;
}

type SortField =
  | "name"
  | "createdAt"
  | "memberCount"
  | "workspaceCount"
  | "userRole";
type SortDirection = "asc" | "desc";

const OrganizationManager: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { organizations, selectedOrganization } = useWorkspace();
  const [organizationsData, setOrganizationsData] = useState<
    OrganizationData[]
  >([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<
    OrganizationData[]
  >([]);
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

  const [editingOrg, setEditingOrg] = useState<OrganizationData | null>(null);
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

  // Expanded organization state
  const [expandedOrganizations, setExpandedOrganizations] = useState<
    Set<string>
  >(new Set());

  const [createData, setCreateData] = useState<CreateOrganizationData>({
    name: "",
    description: "",
    domain: "",
    logo: "",
    website: "",
  });

  const [updateData, setUpdateData] = useState<UpdateOrganizationData>({});

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
    };

    const handleScroll = () => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openDropdown]);

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

  // Convert organizations to the expected format
  useEffect(() => {
    const formattedOrgs = organizations.map(org => ({
      id: org.id,
      name: org.name,
      description: org.description,
      domain: org.domain as string | undefined,
      logo: org.logo,
      website: org.website,
      isActive: org.isActive ?? true,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt as string,
      ownerId: org.ownerId || user?.id || "",
      memberCount: org.members?.length || 0,
      workspaceCount: org.workspaces?.length || 0,
      userRole: org.role as "OWNER" | "ADMIN" | "MEMBER",
      members:
        org.members?.map((member: unknown) => ({
          userId: (member as Record<string, unknown>).id as string,
          name: (member as Record<string, unknown>).name as string,
          email: (member as Record<string, unknown>).email as string,
          avatar: (member as Record<string, unknown>).avatar as
            | string
            | undefined,
          role: (member as Record<string, unknown>).role as
            | "OWNER"
            | "ADMIN"
            | "MEMBER",
          joinedAt: ((member as Record<string, unknown>).createdAt ||
            (member as Record<string, unknown>).joinedAt ||
            "") as string,
          isCurrentUser: (member as Record<string, unknown>).id === user?.id,
        })) || [],
      workspaces:
        org.workspaces?.map((workspace: unknown) => ({
          id: (workspace as Record<string, unknown>).id as string,
          name: (workspace as Record<string, unknown>).name as string,
          description: (workspace as Record<string, unknown>).description as
            | string
            | undefined,
          isActive: (workspace as Record<string, unknown>).isActive as boolean,
          createdAt: (workspace as Record<string, unknown>).createdAt as string,
          memberCount:
            ((workspace as Record<string, unknown>).members as unknown[])
              ?.length || 0,
          userRole: (workspace as Record<string, unknown>).role as
            | "OWNER"
            | "ADMIN"
            | "MEMBER",
          members:
            ((workspace as Record<string, unknown>).members as unknown[])?.map(
              (member: unknown) => ({
                userId: (member as Record<string, unknown>).id as string,
                name: (member as Record<string, unknown>).name as string,
                email: (member as Record<string, unknown>).email as string,
                avatar: (member as Record<string, unknown>).avatar as
                  | string
                  | undefined,
                role: (member as Record<string, unknown>).role as
                  | "OWNER"
                  | "ADMIN"
                  | "MEMBER",
                joinedAt: ((member as Record<string, unknown>).createdAt ||
                  (member as Record<string, unknown>).joinedAt ||
                  "") as string,
                isCurrentUser:
                  (member as Record<string, unknown>).id === user?.id,
              })
            ) || [],
        })) || [],
    }));
    setOrganizationsData(formattedOrgs as unknown as OrganizationData[]);
  }, [organizations, user]);

  // Filter and sort organizations
  useEffect(() => {
    const filtered = organizationsData.filter(org => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.description &&
          org.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.website &&
          org.website.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && org.isActive) ||
        (statusFilter === "inactive" && !org.isActive);

      const matchesRole = roleFilter === "all" || org.userRole === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });

    // Sort organizations
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
        case "workspaceCount":
          aValue = a.workspaceCount;
          bValue = b.workspaceCount;
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

    setFilteredOrganizations(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [
    organizationsData,
    searchTerm,
    statusFilter,
    roleFilter,
    sortField,
    sortDirection,
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrganizations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrganizations = filteredOrganizations.slice(
    startIndex,
    endIndex
  );

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

  // Handle organization row click to expand/collapse workspaces
  const handleOrganizationClick = (orgId: string) => {
    setExpandedOrganizations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orgId)) {
        newSet.delete(orgId);
      } else {
        newSet.add(orgId);
      }
      return newSet;
    });
  };

  // Handle workspace row click to show members
  const handleWorkspaceClick = (workspaceId: string) => {
    // Find the organization that contains this workspace
    const org = organizationsData.find(org =>
      org.workspaces?.some(ws => ws.id === workspaceId)
    );

    if (org) {
      const workspace = org.workspaces?.find(ws => ws.id === workspaceId);
      if (workspace) {
        // Toggle the expanded state for this workspace
        setExpandedOrganizations(prev => {
          const newSet = new Set(prev);
          const workspaceKey = `workspace-${workspaceId}`;
          if (newSet.has(workspaceKey)) {
            newSet.delete(workspaceKey);
          } else {
            newSet.add(workspaceKey);
          }
          return newSet;
        });
      }
    }
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
        localStorage.setItem("access_token", data.impersonationToken);
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

  const handleEditMember = () => {
    // Check if current user has permission to edit members (OWNER or ADMIN only)
    const currentUserRole = user?.globalRole;
    if (currentUserRole !== "OWNER" && currentUserRole !== "ADMIN") {
      setError(
        "You do not have permission to edit members. Only owners and admins can edit members."
      );
      return;
    }

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
        setOrganizationsData(prevOrgs =>
          prevOrgs.map(org => ({
            ...org,
            members: org.members.map(member =>
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

        // Refresh user data to get updated organization data
        await refreshUser();
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

  const createOrganization = async () => {
    if (!createData.name.trim()) {
      setError("Organization name is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      const response = await fetch(`${API_BASE_URL}/auth/organization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("Organization created successfully!");
        setShowCreateModal(false);
        setCreateData({
          name: "",
          description: "",
          domain: "",
          logo: "",
          website: "",
        });

        // Refresh user data to get the new organization
        await refreshUser();
      } else {
        setError(result.message || "Failed to create organization");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async () => {
    if (!editingOrg) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      const response = await fetch(
        `${API_BASE_URL}/auth/organization/${editingOrg.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess("Organization updated successfully!");
        setShowEditModal(false);
        setEditingOrg(null);
        setUpdateData({});

        // Refresh user data to get the updated organization
        await refreshUser();
      } else {
        setError(result.message || "Failed to update organization");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const deleteOrganization = async (orgId: string, orgName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${orgName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("crm_access_token");
      const response = await fetch(
        `${API_BASE_URL}/auth/organization/${orgId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (response.ok) {
        setSuccess("Organization deleted successfully!");
        // Refresh the page to reload organizations
        window.location.reload();
      } else {
        setError(result.message || "Failed to delete organization");
      }
    } catch {
      setError("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (org: OrganizationData) => {
    setEditingOrg(org);
    setUpdateData({
      name: org.name,
      description: org.description || "",
      domain: org.domain || "",
      logo: org.logo || "",
      website: org.website || "",
      isActive: org.isActive,
    });
    setShowEditModal(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Building className="w-4 h-4" />;
      case "ADMIN":
        return <Users className="w-4 h-4" />;
      case "MEMBER":
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
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

  if (organizations.length === 0) {
    return (
      <div className="p-8 mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
          Organization Management
        </h2>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Building className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              No Organizations Available
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You don&apos;t have access to any organizations yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        Organization Management
      </h2>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage your organizations and their workspaces
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Create and manage organizations, workspaces, and team members
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateModal(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center px-6 py-2 font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-600 hover:scale-105 shadow-sm"
          >
            <Plus className="mr-2 w-4 h-4" /> Create Organization
          </button>
        </div>

        {/* Error and Success Messages */}
        {error && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-700">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600 dark:text-red-400">
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-700">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600 dark:text-green-400">
              {success}
            </span>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search organizations by name, description, or website..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Role:
              </label>
              <select
                value={roleFilter}
                onChange={e =>
                  setRoleFilter(
                    e.target.value as "all" | "OWNER" | "ADMIN" | "MEMBER"
                  )
                }
                className="px-3 py-1 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredOrganizations.length} of{" "}
                {organizationsData.length} organizations
              </span>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="overflow-hidden relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                  Organization Details
                </th>
                <th
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("userRole")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Role & Status</span>
                    {getSortIcon("userRole")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("memberCount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Members</span>
                    {getSortIcon("memberCount")}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort("workspaceCount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Workspaces</span>
                    {getSortIcon("workspaceCount")}
                  </div>
                </th>
                <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    Loading organizations...
                  </td>
                </tr>
              ) : paginatedOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <Building className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          roleFilter !== "all"
                            ? "No organizations match your filters"
                            : "No organizations found"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {searchTerm ||
                          statusFilter !== "all" ||
                          roleFilter !== "all"
                            ? "Try adjusting your search or filter criteria."
                            : "Get started by creating your first organization."}
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
                            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 shadow-sm"
                          >
                            <Plus className="mr-2 w-4 h-4" />
                            Create Organization
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedOrganizations.map(org => (
                  <React.Fragment key={org.id}>
                    <tr
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                        selectedOrganization?.id === org.id
                          ? "bg-blue-50 dark:bg-blue-900/30"
                          : ""
                      }`}
                      onClick={() => handleOrganizationClick(org.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex justify-center items-center mr-3 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                            <span className="text-sm font-bold text-white">
                              {org.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {org.name}
                                {selectedOrganization?.id === org.id && (
                                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                                    Current
                                  </span>
                                )}
                              </div>
                              <ChevronRightIcon
                                className={`ml-2 w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                                  expandedOrganizations.has(org.id)
                                    ? "rotate-90"
                                    : ""
                                }`}
                              />
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {org.description
                                ? org.description.length > 25
                                  ? `${org.description.substring(0, 25)}...`
                                  : org.description
                                : "No description"}
                            </div>
                            {org.website && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 truncate">
                                {org.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(org.userRole)}
                            <span>{org.userRole}</span>
                          </div>
                          <span
                            className={`inline-flex px-2 py-1 mt-1 text-xs font-semibold rounded-full ${
                              org.isActive
                                ? "text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30"
                                : "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30"
                            }`}
                          >
                            {org.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {org.memberCount} members
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {org.workspaceCount} workspaces
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="relative dropdown-container">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDropdownClick(org.id, e);
                            }}
                            className="p-2 text-gray-400 dark:text-gray-500 rounded-full transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdown === org.id && dropdownPosition && (
                            <div
                              className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg"
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
                                    startEdit(org);
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Edit className="mr-3 w-4 h-4 text-blue-500" />
                                  Edit Organization
                                </button>
                                {org.userRole === "OWNER" && (
                                  <button
                                    onClick={() => {
                                      deleteOrganization(org.id, org.name);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                                  >
                                    <Trash2 className="mr-3 w-4 h-4 text-red-500" />
                                    Delete Organization
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Workspaces Section */}
                    {expandedOrganizations.has(org.id) && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-0 bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="px-6 py-4">
                            <h4 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                              Workspaces in {org.name}
                            </h4>
                            {org.workspaces && org.workspaces.length > 0 ? (
                              <div className="space-y-2">
                                {org.workspaces.map(workspace => (
                                  <React.Fragment key={workspace.id}>
                                    <div
                                      className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200 transition-colors cursor-pointer hover:bg-gray-50"
                                      onClick={() =>
                                        handleWorkspaceClick(workspace.id)
                                      }
                                    >
                                      <div className="flex items-center">
                                        <div className="flex justify-center items-center mr-3 w-6 h-6 bg-gradient-to-br from-green-500 to-blue-600 rounded">
                                          <span className="text-xs font-bold text-white">
                                            {workspace.name
                                              .charAt(0)
                                              .toUpperCase()}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">
                                              {workspace.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {workspace.description
                                                ? workspace.description.length >
                                                  30
                                                  ? `${workspace.description.substring(0, 30)}...`
                                                  : workspace.description
                                                : "No description"}
                                            </div>
                                          </div>
                                          <ChevronRightIcon
                                            className={`ml-2 w-4 h-4 text-gray-400 transition-transform ${
                                              expandedOrganizations.has(
                                                `workspace-${workspace.id}`
                                              )
                                                ? "rotate-90"
                                                : ""
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                          <span>
                                            {workspace.memberCount} members
                                          </span>
                                          <span>{workspace.userRole}</span>
                                          <span>
                                            {new Date(
                                              workspace.createdAt
                                            ).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <div className="relative dropdown-container">
                                          <button
                                            onClick={e => {
                                              e.stopPropagation();
                                              handleDropdownClick(
                                                `workspace-${workspace.id}`,
                                                e
                                              );
                                            }}
                                            className="p-1 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-50"
                                          >
                                            <MoreVertical className="w-4 h-4" />
                                          </button>

                                          {openDropdown ===
                                            `workspace-${workspace.id}` &&
                                            dropdownPosition && (
                                              <div
                                                className="fixed z-50 w-48 bg-white rounded-md border border-gray-200 shadow-lg"
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
                                                  <button
                                                    onClick={() => {
                                                      // TODO: Implement edit workspace functionality
                                                      alert(
                                                        "Edit workspace functionality would be implemented here"
                                                      );
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
                                                  {workspace.userRole ===
                                                    "OWNER" && (
                                                    <button
                                                      onClick={() => {
                                                        if (
                                                          confirm(
                                                            `Are you sure you want to delete workspace "${workspace.name}"?`
                                                          )
                                                        ) {
                                                          // TODO: Implement delete workspace functionality
                                                          alert(
                                                            "Delete workspace functionality would be implemented here"
                                                          );
                                                        }
                                                        setOpenDropdown(null);
                                                        setDropdownPosition(
                                                          null
                                                        );
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
                                      </div>
                                    </div>

                                    {/* Expanded Members Section for this workspace */}
                                    {expandedOrganizations.has(
                                      `workspace-${workspace.id}`
                                    ) && (
                                      <div className="p-3 mt-2 ml-6 bg-gray-100 rounded-lg border border-gray-200">
                                        <h5 className="mb-2 text-xs font-medium text-gray-700">
                                          Members of {workspace.name}
                                        </h5>
                                        {workspace.members &&
                                        workspace.members.length > 0 ? (
                                          <div className="space-y-2">
                                            {workspace.members.map(member => (
                                              <div
                                                key={member.userId}
                                                className="flex justify-between items-center p-2 bg-white rounded border border-gray-200"
                                              >
                                                <div className="flex items-center">
                                                  <div className="flex justify-center items-center mr-2 w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-600 rounded">
                                                    <span className="text-xs font-bold text-white">
                                                      {member.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <div className="text-xs font-medium text-gray-900">
                                                      {member.name}
                                                      {member.isCurrentUser && (
                                                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                                                          You
                                                        </span>
                                                      )}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                      {member.email}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                    <span
                                                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                                                        member.role === "OWNER"
                                                          ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                                          : member.role ===
                                                              "ADMIN"
                                                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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
                                                                    setOpenDropdown(
                                                                      null
                                                                    );
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
                                                                  handleEditMember();
                                                                  setOpenDropdown(
                                                                    null
                                                                  );
                                                                  setDropdownPosition(
                                                                    null
                                                                  );
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
                                                                  setOpenDropdown(
                                                                    null
                                                                  );
                                                                  setDropdownPosition(
                                                                    null
                                                                  );
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
                                                              {member.role !==
                                                                "OWNER" && (
                                                                <button
                                                                  onClick={() => {
                                                                    handleRemoveMember(
                                                                      member
                                                                    );
                                                                    setOpenDropdown(
                                                                      null
                                                                    );
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
                                          <div className="py-4 text-center">
                                            <Users className="mx-auto mb-2 w-6 h-6 text-gray-400" />
                                            <p className="mb-1 text-xs font-medium text-gray-900">
                                              No members found
                                            </p>
                                            <p className="mb-3 text-xs text-gray-500">
                                              This workspace has no members yet.
                                            </p>
                                            <button
                                              onClick={e => {
                                                e.stopPropagation();
                                                // TODO: Implement invite members functionality
                                                alert(
                                                  "Invite members functionality would be implemented here"
                                                );
                                              }}
                                              className="flex items-center px-2 py-1 mx-auto text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                            >
                                              <Plus className="mr-1 w-3 h-3" />
                                              Invite Members
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            ) : (
                              <div className="py-6 text-center">
                                <Building className="mx-auto mb-3 w-8 h-8 text-gray-400" />
                                <p className="mb-1 text-sm font-medium text-gray-900">
                                  No workspaces found
                                </p>
                                <p className="mb-4 text-sm text-gray-500">
                                  This organization has no workspaces yet.
                                </p>
                                <button
                                  onClick={() => {
                                    setShowCreateModal(true);
                                    setError("");
                                    setSuccess("");
                                  }}
                                  className="flex items-center px-3 py-2 mx-auto text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                >
                                  <Plus className="mr-2 w-4 h-4" />
                                  Create Workspace
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
          <div className="flex justify-between items-center px-4 py-3 mt-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredOrganizations.length)} of{" "}
                {filteredOrganizations.length} results
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-1 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          ? "text-white bg-gray-900 dark:bg-gray-700"
                          : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
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
                className="flex items-center px-3 py-1 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="ml-1 w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Create Organization Modal */}
        {showCreateModal && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300 ease-in-out">
            <div className="p-6 w-full max-w-md bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Create Organization
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Create a new organization for your team
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
                  createOrganization();
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
                    placeholder="Enter organization name"
                    required
                  />
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
                    placeholder="Enter organization description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    value={createData.website}
                    onChange={e =>
                      setCreateData({ ...createData, website: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
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
                        domain: "",
                        logo: "",
                        website: "",
                      });
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Organization Modal */}
        {showEditModal && editingOrg && (
          <div className="flex fixed inset-0 z-50 justify-center items-center p-4  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
            <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Organization
                </h3>
                <p className="text-sm text-gray-600">
                  Update organization information
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
                  updateOrganization();
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
                    placeholder="Enter organization name"
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
                    placeholder="Enter organization description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="url"
                    value={updateData.website || ""}
                    onChange={e =>
                      setUpdateData({ ...updateData, website: e.target.value })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>
                <div className="flex mt-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingOrg(null);
                      setUpdateData({});
                    }}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
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
                  ? " They will no longer be able to access this organization."
                  : " They will regain access to this organization."}
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

export default OrganizationManager;
