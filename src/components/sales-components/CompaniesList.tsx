import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Phone,
  Calendar,
  Building,
  AlertCircle,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Company } from "../../types/sales-types";
import companyService from "../../services/sales-services/companyService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCompanies, useDebouncedValue } from "../../hooks/sales-hooks";
import CompanyDetailPanel from "../../components/sales-components/CompanyDetailPanel";

const CompaniesList: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Use the optimized companies hook with pagination and caching
  const {
    companies,
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
  } = useCompanies({
    workspaceId: selectedWorkspace?.id || "",
    organizationId: selectedOrganization?.id || "",
    enabled: !!user && !!selectedOrganization && !!selectedWorkspace,
    initialPage: 1,
    initialLimit: 25,
  });

  // Debounce search input
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  // Update search when debounced value changes
  useEffect(() => {
    setSearch(debouncedSearch);
  }, [debouncedSearch, setSearch]);

  // Convert fetchError to string
  const error = fetchError?.message || null;

  const filteredCompanies = companies.filter(company => {
    const matchesSearch =
      (company.name &&
        typeof company.name === "string" &&
        company.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.domain &&
        typeof company.domain === "string" &&
        company.domain.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (company.email &&
        typeof company.email === "string" &&
        company.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      statusFilter === "all" || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (
    companyId: string,
    newStatus: Company["status"]
  ) => {
    // Make API call to update company status
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token || !selectedWorkspace || !selectedOrganization) return;

      await companyService.updateCompany(
        companyId,
        selectedWorkspace.id,
        selectedOrganization.id,
        { status: newStatus },
        token
      );
      // Refetch to get updated data
      refetch();
    } catch (error) {
      console.error("Failed to update company status:", error);
    }
  };

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    INACTIVE: "bg-gray-100 text-gray-800",
    PROSPECT: "bg-blue-100 text-blue-800",
    CUSTOMER: "bg-green-100 text-green-800",
    LOST: "bg-red-100 text-red-800",
    WON: "bg-green-100 text-green-800",
    DEAD: "bg-gray-100 text-gray-800",
    LEAD: "bg-yellow-100 text-yellow-800",
    ENGAGED: "bg-purple-100 text-purple-800",
    INTERESTED: "bg-blue-100 text-blue-800",
    WARM: "bg-orange-100 text-orange-800",
    CLOSED: "bg-gray-100 text-gray-800",
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
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
              <span>Add Company</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              >
                <option value="all">All Status</option>
              </select>
              <button
                className="flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50"
                disabled
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Companies Table with User Deactivation Warning */}
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                0 Companies
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Company
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
              <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
              <p className="text-sm text-gray-600">
                {selectedOrganization?.name} • {selectedWorkspace?.name}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Company</span>
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled
              >
                <option value="all">All Status</option>
              </select>
              <button
                className="flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50"
                disabled
              >
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </button>
            </div>
          </div>

          {/* Companies Table with Permission Warning */}
          <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                0 Companies
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                      Company
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
                          You dont have permission to view companies in this
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
              Error loading companies
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
              view companies.
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-sm text-gray-600">
            {selectedOrganization.name} • {selectedWorkspace.name}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Filters */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="py-2 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="interested">Interested</option>
            <option value="engaged">Engaged</option>
            <option value="agency">Agency</option>
            <option value="startup">Startup</option>
            <option value="scale-up">Scale Up</option>
            <option value="good">Good</option>
            <option value="none">None</option>
          </select>
          <button className="flex items-center px-4 py-2 space-x-2 rounded-lg border border-gray-300 transition-colors hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Companies Table */}
      <div className="overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {filteredCompanies.length} Companies
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Company
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
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="mx-auto mb-4 w-12 h-12 text-gray-400">
                        <User className="w-12 h-12" />
                      </div>
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        No companies found
                      </h3>
                      <p className="text-gray-600">
                        {selectedWorkspace && selectedWorkspace.id
                          ? "Get started by creating your first company."
                          : "Please select a workspace to view companies."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map(company => (
                  <tr
                    key={company.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            company.logo ||
                            "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=2"
                          }
                          alt={company.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() => setSelectedCompany(company)}
                          >
                            {company.name}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Building className="mr-1 w-3 h-3" />
                            {company.domain}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={company.status}
                        onChange={e =>
                          handleStatusChange(
                            company.id,
                            e.target.value as Company["status"]
                          )
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${statusColors[company.status]}`}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="PROSPECT">Prospect</option>
                        <option value="CUSTOMER">Customer</option>
                        <option value="LOST">Lost</option>
                        <option value="WON">Won</option>
                        <option value="DEAD">Dead</option>
                        <option value="LEAD">Lead</option>
                        <option value="ENGAGED">Engaged</option>
                        <option value="INTERESTED">Interested</option>
                        <option value="WARM">Warm</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      $
                      {company.revenue ? company.revenue.toLocaleString() : "0"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {company.industry || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {company.createdAt
                        ? new Date(company.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-1 text-blue-600 rounded transition-colors hover:text-blue-900 hover:bg-blue-50"
                          onClick={() => setSelectedCompany(company)}
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-green-600 rounded transition-colors hover:text-green-900 hover:bg-green-50">
                          <Phone className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-purple-600 rounded transition-colors hover:text-purple-900 hover:bg-purple-50">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-600 rounded transition-colors hover:text-gray-900 hover:bg-gray-50">
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
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} companies
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

      {/* Add Company Form Modal */}
      {showAddForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center p-4  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Add New Company
            </h3>
            <form className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter company name"
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
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Company Detail Panel */}
      {selectedCompany && (
        <CompanyDetailPanel
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
          onUpdate={updatedCompany => {
            // Refetch to get updated data from server
            refetch();
            setSelectedCompany(updatedCompany as unknown as Company);
          }}
        />
      )}
    </div>
  );
};

export default CompaniesList;
