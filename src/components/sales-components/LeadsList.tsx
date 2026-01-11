import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Phone,
  Mail,
  Calendar,
  Building,
  AlertCircle,
  Upload,
  Download,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Lead, Contact, FilterState } from "../../types/sales-types";
import contactService from "../../services/sales-services/contactService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useContacts, useDebouncedValue } from "../../hooks/sales-hooks";
import { TableSkeleton } from "./skeletons";
import LeadDetailPanel from "./LeadDetailPanel";
import NestedFilterDropdown from "./NestedFilterDropdown";
import ImportExportModal from "./ImportExportModal";

const LeadsList: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    tags: [],
    owner: [],
    connection: [],
    dateRange: {},
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showImportExportModal, setShowImportExportModal] = useState(false);
  const [importExportMode, setImportExportMode] = useState<"import" | "export">(
    "import"
  );

  // Use the optimized contacts hook with pagination and caching
  const {
    contacts,
    total,
    page,
    limit,
    totalPages,
    isLoading: loading,
    isRefetching,
    error: fetchError,
    setPage,
    setLimit,
    setSearch,
    refetch,
  } = useContacts({
    workspaceId: selectedWorkspace?.id || "",
    organizationId: selectedOrganization?.id || "",
    enabled: !!user && !!selectedOrganization && !!selectedWorkspace,
    initialPage: 1,
    initialLimit: 25,
  });

  // Debounce search input
  const debouncedSearch = useDebouncedValue(filters.search, 300);

  // Update search when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Convert contacts to leads format
  const leads = useMemo(() => {
    return contacts.map(contact => {
      const contactObj = contact as unknown as Record<string, unknown>;
      return {
        id: contactObj.id as string,
        name: (contactObj.name as string) || "Unknown",
        email: (contactObj.email as string) || "",
        phone: (contactObj.phoneNumber as string) || undefined,
        company: contactObj.company
          ? ((contactObj.company as Record<string, unknown>).name as string)
          : undefined,
        position: (contactObj.jobTitle as string) || undefined,
        status: mapContactStatusToLeadStatus(contactObj.status as string),
        tags:
          (contactObj.tags as Record<string, unknown>[])
            ?.map(tag => {
              if (typeof tag === "string") {
                return tag;
              }
              if (tag && typeof tag === "object") {
                const tagObj = tag as Record<string, unknown>;
                if (
                  tagObj.tag &&
                  ((tagObj.tag as Record<string, unknown>).name as string)
                ) {
                  return (tagObj.tag as Record<string, unknown>).name as string;
                }
                if (tagObj.name) {
                  return tagObj.name as string;
                }
              }
              return null;
            })
            .filter(tag => tag !== null) || [],
        owner: contactObj.owner
          ? ((contactObj.owner as Record<string, unknown>).name as string)
          : "Unknown",
        lastInteraction: contactObj.lastContactedAt
          ? new Date(contactObj.lastContactedAt as string).toLocaleDateString()
          : "Never",
        connection: (contactObj.leadScore as number) > 50 ? "good" : "none",
        leadScore: (contactObj.leadScore as number)?.toString() || "0",
        avatar: (contactObj.avatar as string) || undefined,
        createdAt: new Date(contactObj.createdAt as string),
        industry: undefined,
        location: undefined,
        linkedinUrl: (contactObj.linkedinUrl as string) || undefined,
        website: (contactObj.websiteUrl as string) || undefined,
        notes: undefined,
        dealValue: undefined,
        source: (contactObj.source as string) || undefined,
        priority: mapLeadTypeToPriority(contactObj.leadType as string),
        nextFollowUp: contactObj.nextFollowUpAt
          ? new Date(contactObj.nextFollowUpAt as string)
          : undefined,
        activities:
          (contactObj.activities as Record<string, unknown>[])?.map(
            activity => {
              const activityObj = activity as Record<string, unknown>;
              return {
                id: activityObj.id as string,
                type: activityObj.type as
                  | "email"
                  | "call"
                  | "meeting"
                  | "note"
                  | "task"
                  | "CONTACT_CREATED"
                  | "CONTACT_UPDATED"
                  | "CUSTOM",
                title: activityObj.title as string,
                description: activityObj.description as string,
                date: new Date(
                  (activityObj.createdAt as string) ||
                    (activityObj.date as string)
                ),
                createdAt: activityObj.createdAt as string,
                userId: activityObj.userId as string,
                userName: activityObj.user
                  ? ((activityObj.user as Record<string, unknown>)
                      .name as string)
                  : (activityObj.userName as string) || "Unknown User",
                user: activityObj.user as Record<string, unknown>,
                metadata: activityObj.metadata as Record<string, unknown>,
              };
            }
          ) || [],
        customFields:
          (contactObj.customAttributes as {
            [key: string]: string | number | boolean | Date;
          }) || {},
      };
    }) as unknown as Lead[];
  }, [contacts]);

  // Convert fetchError to string
  const error = fetchError?.message || null;

  // Helper functions to map API data to UI format
  const mapContactStatusToLeadStatus = (status: string): Lead["status"] => {
    switch (status) {
      case "ACTIVE":
        return "interested";
      case "INACTIVE":
        return "none";
      case "PROSPECT":
        return "interested";
      case "CUSTOMER":
        return "good";
      case "LOST":
        return "none";
      case "WON":
        return "good";
      case "DEAD":
        return "none";
      case "LEAD":
        return "interested";
      case "ENGAGED":
        return "engaged";
      case "INTERESTED":
        return "interested";
      case "WARM":
        return "interested";
      case "CLOSED":
        return "none";
      default:
        return "none";
    }
  };

  const mapLeadTypeToPriority = (leadType: string): Lead["priority"] => {
    switch (leadType) {
      case "HOT":
        return "high";
      case "WARM":
        return "medium";
      case "COLD":
        return "low";
      default:
        return "low";
    }
  };

  const filteredLeads = leads.filter(lead => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchableFields = [lead.name, lead.company, lead.email];
      if (
        !searchableFields.some(
          field =>
            field &&
            typeof field === "string" &&
            field.toLowerCase().includes(searchTerm)
        )
      ) {
        return false;
      }
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(lead.status)) {
      return false;
    }

    // Tags filter
    if (
      filters.tags.length > 0 &&
      !filters.tags.some(tag =>
        (lead.tags || []).some(leadTag => {
          if (typeof leadTag === "string") {
            return leadTag === tag;
          }
          if (leadTag && typeof leadTag === "object") {
            const tagObj = leadTag as Record<string, unknown>;
            return (
              (tagObj.name as string) === tag ||
              (tagObj.tag &&
                ((tagObj.tag as Record<string, unknown>).name as string)) ===
                tag
            );
          }
          return false;
        })
      )
    ) {
      return false;
    }

    // Owner filter
    if (filters.owner.length > 0 && !filters.owner.includes(lead.owner)) {
      return false;
    }

    // Connection filter
    if (
      (filters.connection?.length || 0) > 0 &&
      !filters.connection?.includes(lead.connection)
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange.start && lead.createdAt < filters.dateRange.start) {
      return false;
    }
    if (filters.dateRange.end && lead.createdAt > filters.dateRange.end) {
      return false;
    }

    return true;
  });

  // Show error state - but still show table structure for permission errors
  if (error) {
    // Check if it's a user deactivation error
    const isUserDeactivationError =
      error.includes("User not found or inactive") ||
      error.includes("User not found") ||
      error.includes("inactive");

    // Check if it's a permission error
    const isPermissionError =
      error.includes("permission") ||
      error.includes("Permission") ||
      error.includes("Insufficient") ||
      error.includes("Required:") ||
      error.includes("Forbidden") ||
      (error.includes("Unauthorized") && !isUserDeactivationError);

    if (isUserDeactivationError) {
      // Show table structure with user deactivation warning
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="text-sm text-gray-600">
                {selectedOrganization?.name} • {selectedWorkspace?.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
              disabled
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <NestedFilterDropdown
                entityType="leads"
                filters={filters}
                onUpdateFilters={setFilters}
                availableTags={
                  leads
                    .flatMap(lead => lead.tags || [])
                    .map(tag => {
                      if (typeof tag === "string") return tag;
                      if (tag && typeof tag === "object") {
                        const tagObj = tag as Record<string, unknown>;
                        return (
                          (tagObj.name as string) ||
                          (tagObj.tag &&
                            ((tagObj.tag as Record<string, unknown>)
                              .name as string)) ||
                          ""
                        );
                      }
                      return "";
                    })
                    .filter(Boolean) as string[]
                }
                availableOwners={
                  [
                    ...new Set(leads.map(lead => lead.owner).filter(Boolean)),
                  ] as string[]
                }
                availableStatuses={
                  [
                    ...new Set(leads.map(lead => lead.status).filter(Boolean)),
                  ] as string[]
                }
              />
            </div>
          </div>

          {/* Leads Table with User Deactivation Warning */}
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">0 Leads</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Value
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-4 text-orange-600">
                          <AlertCircle className="mx-auto w-12 h-12" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                          Account Deactivated
                        </h3>
                        <p className="mb-4 max-w-md text-gray-600">
                          Your account has been deactivated in this
                          organization. You can still access other organizations
                          where you are active.
                        </p>
                        <div className="flex flex-col space-y-2">
                          <p className="text-sm text-gray-500">
                            Switch to another organization from the sidebar to
                            continue working.
                          </p>
                          {user?.organizations &&
                            user.organizations.length > 1 && (
                              <div className="p-4 mt-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="mb-2 text-sm font-medium text-blue-900">
                                  Available Organizations:
                                </h4>
                                <div className="space-y-1">
                                  {user.organizations
                                    .filter(
                                      org => org.id !== selectedOrganization?.id
                                    )
                                    .map(org => (
                                      <div
                                        key={org.id}
                                        className="text-sm text-blue-700"
                                      >
                                        • {org.name}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (isPermissionError) {
      // Show table structure with permission warning
      return (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
              <p className="text-sm text-gray-600">
                {selectedOrganization?.name} • {selectedWorkspace?.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Lead</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={filters.search}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, search: e.target.value }))
                  }
                  className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <NestedFilterDropdown
                entityType="leads"
                filters={filters}
                onUpdateFilters={setFilters}
                availableTags={
                  leads
                    .flatMap(lead => lead.tags || [])
                    .map(tag => {
                      if (typeof tag === "string") return tag;
                      if (tag && typeof tag === "object") {
                        const tagObj = tag as Record<string, unknown>;
                        return (
                          (tagObj.name as string) ||
                          (tagObj.tag &&
                            ((tagObj.tag as Record<string, unknown>)
                              .name as string)) ||
                          ""
                        );
                      }
                      return "";
                    })
                    .filter(Boolean) as string[]
                }
                availableOwners={
                  [
                    ...new Set(leads.map(lead => lead.owner).filter(Boolean)),
                  ] as string[]
                }
                availableStatuses={
                  [
                    ...new Set(leads.map(lead => lead.status).filter(Boolean)),
                  ] as string[]
                }
              />
            </div>
          </div>

          {/* Leads Table with Permission Warning */}
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">0 Leads</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Lead
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Value
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Last Contact
                    </th>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="mb-4 text-yellow-600">
                          <AlertCircle className="mx-auto w-12 h-12" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-gray-900">
                          Insufficient Permissions
                        </h3>
                        <p className="mb-4 max-w-md text-gray-600">
                          You don&apos;t have permission to view leads in this
                          workspace.
                        </p>
                        <p className="text-sm text-gray-500">
                          Contact your workspace administrator to request the
                          necessary permissions.
                        </p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    // For non-permission errors, show the original error page
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="mb-4 text-red-600">
              <AlertCircle className="mx-auto w-12 h-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Error loading leads
            </h3>
            <p className="mb-4 text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show no workspace selected state
  if (!selectedOrganization || !selectedWorkspace) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="mb-4 text-gray-400">
              <Building className="mx-auto w-12 h-12" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No workspace selected
            </h3>
            <p className="mb-4 text-gray-600">
              Please select an organization and workspace from the sidebar to
              view leads.
            </p>

            {/* Debug information */}
            <div className="p-4 mt-4 text-sm text-left bg-gray-100 rounded-lg">
              <h4 className="mb-2 font-semibold">Debug Information:</h4>
              <p>
                <strong>User:</strong> {user ? "Present" : "Missing"}
              </p>
              <p>
                <strong>Organizations:</strong>{" "}
                {user?.organizations?.length || 0}
              </p>
              <p>
                <strong>Workspaces:</strong> {user?.workspaces?.length || 0}
              </p>
              {user && (
                <details className="mt-2">
                  <summary className="font-medium cursor-pointer">
                    User Data Structure
                  </summary>
                  <pre className="overflow-auto mt-2 text-xs">
                    {JSON.stringify(user, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debug: Show workspace and organization IDs when available

  // Ensure we have the required data
  if (!selectedWorkspace || !selectedOrganization) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-600">Loading workspace data...</p>
          </div>
        </div>
        <div className="py-8 text-center">
          <p className="text-gray-500">Please select a workspace to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 justify-between items-start sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-600">
            {selectedOrganization?.name} • {selectedWorkspace?.name}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center w-full sm:gap-3 sm:w-auto">
          <button
            onClick={() => {
              setImportExportMode("import");
              setShowImportExportModal(true);
            }}
            className="flex items-center px-3 py-2 space-x-2 text-sm text-blue-600 rounded-lg border border-blue-600 transition-colors hover:bg-blue-50"
            style={{ minWidth: "fit-content" }}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Import</span>
            <span className="sm:hidden">Import</span>
          </button>
          <button
            onClick={() => {
              setImportExportMode("export");
              setShowImportExportModal(true);
            }}
            className="flex items-center px-3 py-2 space-x-2 text-sm text-green-600 rounded-lg border border-green-600 transition-colors hover:bg-green-50"
            style={{ minWidth: "fit-content" }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-3 py-2 space-x-2 text-sm text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            style={{ minWidth: "fit-content" }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Lead</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.search}
              onChange={e =>
                setFilters(prev => ({ ...prev, search: e.target.value }))
              }
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <NestedFilterDropdown
            entityType="leads"
            filters={filters}
            onUpdateFilters={setFilters}
            availableTags={
              leads
                .flatMap(lead => lead.tags || [])
                .map(tag => {
                  if (typeof tag === "string") return tag;
                  if (tag && typeof tag === "object") {
                    const tagObj = tag as Record<string, unknown>;
                    return (
                      (tagObj.name as string) ||
                      (tagObj.tag &&
                        ((tagObj.tag as Record<string, unknown>)
                          .name as string)) ||
                      ""
                    );
                  }
                  return "";
                })
                .filter(Boolean) as string[]
            }
            availableOwners={
              [
                ...new Set(leads.map(lead => lead.owner).filter(Boolean)),
              ] as string[]
            }
            availableStatuses={
              [
                ...new Set(leads.map(lead => lead.status).filter(Boolean)),
              ] as string[]
            }
          />
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredLeads.length} Leads
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Lead
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Value
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="ml-4 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded" />
                          <div className="h-3 w-24 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-16 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-20 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded" />
                        <div className="h-6 w-6 bg-gray-200 rounded" />
                        <div className="h-6 w-6 bg-gray-200 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mx-auto mb-4 w-12 h-12 text-gray-400">
                        <User className="w-12 h-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No leads found
                      </h3>
                      <p className="text-gray-600">
                        {selectedWorkspace && selectedWorkspace.id
                          ? "Get started by creating your first lead."
                          : "Please select a workspace to view leads."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    className="transition-colors cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            lead.avatar ||
                            "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2"
                          }
                          alt={lead.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Building className="mr-1 w-3 h-3" />
                            {lead.company
                              ? ((lead.company as Record<string, unknown>)
                                  .name as string)
                              : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLead(lead);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${
                          lead.status === "interested"
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                            : lead.status === "engaged"
                              ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                              : lead.status === "agency"
                                ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                : lead.status === "startup"
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                  : lead.status === "scale-up"
                                    ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    : lead.status === "good"
                                      ? "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {lead.status.charAt(0).toUpperCase() +
                          lead.status.slice(1).toLowerCase()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      ${lead.dealValue ? lead.dealValue.toLocaleString() : "0"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.source || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {lead.lastInteraction}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-blue-600 rounded transition-colors hover:text-blue-900 hover:bg-blue-50">
                          <Mail className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 rounded transition-colors hover:text-green-900 hover:bg-green-50">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-purple-600 rounded transition-colors hover:text-purple-900 hover:bg-purple-50">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 dark:text-gray-400 rounded transition-colors hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} leads
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-2 py-1 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center space-x-1 px-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Lead Form Modal */}
      {showAddForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Add New Lead
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter lead name"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Company
                </label>
                <input
                  type="text"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Value
                </label>
                <input
                  type="number"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter potential value"
                />
              </div>
              <div className="flex mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
                >
                  Add Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead as unknown as Contact}
          onClose={() => setSelectedLead(null)}
          onUpdate={updatedLead => {
            // Refetch to get updated data from server
            refetch();
            setSelectedLead(updatedLead as unknown as Lead);
          }}
        />
      )}

      {/* Import/Export Modal */}
      {showImportExportModal && (
        <ImportExportModal
          isOpen={showImportExportModal}
          mode={importExportMode}
          onClose={() => {
            setShowImportExportModal(false);
          }}
          onSuccess={() => {
            setShowImportExportModal(false);
            // Refresh the leads list using the hook's refetch
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default LeadsList;
