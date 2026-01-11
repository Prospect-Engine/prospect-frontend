import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Calendar,
  Building,
  AlertCircle,
  User,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Deal } from "../../types/sales-types";
import dealService from "../../services/sales-services/dealService";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useDeals, useDebouncedValue } from "../../hooks/sales-hooks";
import DealDetailPanel from "../../components/sales-components/DealDetailPanel";

const DealsList: React.FC = () => {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const [searchTerm, setSearchTermLocal] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Use the optimized deals hook with pagination and caching
  const {
    deals,
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
  } = useDeals({
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

  const filteredDeals = deals.filter(deal => {
    const matchesSearch =
      deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.company?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deal.contact?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || deal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Deal["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "WON":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "LOST":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      case "PAUSED":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleCreateDeal = async (dealData: Partial<Deal>) => {
    if (!user || !selectedOrganization || !selectedWorkspace) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setFormError("No authentication token found");
        return;
      }

      const workspaceId = selectedWorkspace.id;
      const organizationId = selectedOrganization.id;

      const response = await dealService.createDeal(
        workspaceId,
        organizationId,
        dealData,
        token
      );

      if (response.success && response.data) {
        // Refetch to get updated data from server
        refetch();
        setShowAddForm(false);
        setFormError(null);
      } else {
        setFormError(response.error || "Failed to create deal");
      }
    } catch (err) {
      setFormError("Failed to create deal");
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Deals</h2>
              <p className="text-sm text-gray-500">Error loading deals</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retry
            </button>
          </div>
        </div>

        {/* Error Message */}
        <div className="px-6 py-12">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 w-12 h-12 text-red-500" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              Failed to load deals
            </h3>
            <p className="mx-auto mb-4 max-w-md text-sm text-gray-500">
              {error}
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <p>Please check:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Your internet connection</li>
                <li>That the backend server is running</li>
                <li>That you have the correct permissions</li>
                <li>That the workspace and organization are selected</li>
              </ul>
            </div>
            <div className="mt-6 space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              <button
                onClick={() => setError(null)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Deals</h2>
            <p className="text-sm text-gray-500">
              {filteredDeals.length} deals found
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 w-4 h-4" />
            Add Deal
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={e => setSearchTermLocal(e.target.value)}
                className="block py-2 pr-3 pl-10 w-full leading-5 placeholder-gray-500 bg-white rounded-md border border-gray-300 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="block px-3 py-2 w-48 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="WON">Won</option>
            <option value="LOST">Lost</option>
            <option value="PAUSED">Paused</option>
          </select>
          <button className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-gray-400">
            <Filter className="mr-2 w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Deals List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 5 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="px-6 py-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-48 bg-gray-200 rounded" />
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="h-3 w-24 bg-gray-200 rounded" />
                        <div className="h-3 w-20 bg-gray-200 rounded" />
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-20 bg-gray-200 rounded" />
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : filteredDeals.map(deal => (
          <div
            key={deal.id}
            className="px-6 py-4 cursor-pointer hover:bg-gray-50"
            onClick={() => setSelectedDeal(deal)}
          >
            <div className="flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex justify-center items-center w-10 h-10 bg-blue-100 rounded-full">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {deal.title}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}
                      >
                        {deal.status}
                      </span>
                    </div>
                    <div className="flex items-center mt-1 space-x-4 text-sm text-gray-500">
                      {deal.company && (
                        <div className="flex items-center">
                          <Building className="mr-1 w-4 h-4" />
                          <span>{deal.company.name}</span>
                        </div>
                      )}
                      {deal.contact && (
                        <div className="flex items-center">
                          <User className="mr-1 w-4 h-4" />
                          <span>{deal.contact.name}</span>
                        </div>
                      )}
                      {deal.value && (
                        <div className="flex items-center">
                          <DollarSign className="mr-1 w-4 h-4" />
                          <span>
                            {formatCurrency(deal.value, deal.currency)}
                          </span>
                        </div>
                      )}
                      {deal.expectedCloseDate && (
                        <div className="flex items-center">
                          <Calendar className="mr-1 w-4 h-4" />
                          <span>
                            Closes {formatDate(deal.expectedCloseDate)}
                          </span>
                        </div>
                      )}
                    </div>
                    {deal.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {deal.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {deal.owner && (
                  <div className="flex items-center text-sm text-gray-500">
                    <User className="mr-1 w-4 h-4" />
                    <span>{deal.owner.name}</span>
                  </div>
                )}
                <button className="text-gray-400 hover:text-gray-600">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} deals
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

      {/* Empty State */}
      {filteredDeals.length === 0 && !loading && (
        <div className="py-12 text-center">
          <DollarSign className="mx-auto w-12 h-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No deals found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by creating your first deal."}
          </p>
          {!searchTerm && statusFilter === "all" && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md border border-transparent shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="mr-2 w-4 h-4" />
                Add Deal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddForm && (
        <div className="flex fixed inset-0 z-50 justify-center items-center  bg-opacity-50 backdrop-blur-sm transition-all duration-300 ease-in-out">
          <div className="p-6 w-full max-w-md bg-white rounded-xl transition-all duration-300 ease-in-out transform animate-in slide-in-from-bottom-4 fade-in scale-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add New Deal
              </h3>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-gray-600">
              Only the title field is required. All other fields are optional
              and can be updated later.
            </p>
            {formError && (
              <div className="p-4 mb-4 bg-red-50 rounded-md border border-red-200">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{formError}</p>
                  </div>
                </div>
              </div>
            )}
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();

                const formData = new FormData(e.currentTarget);
                const title = formData.get("title") as string;
                const description = formData.get("description") as string;
                const value = formData.get("value") as string;
                const probability = formData.get("probability") as string;
                const expectedCloseDate = formData.get(
                  "expectedCloseDate"
                ) as string;

                if (!title.trim()) {
                  setFormError("Deal title is required.");
                  return;
                }

                const dealData: Partial<Deal> = {
                  title: title.trim(),
                  description: description.trim() || undefined,
                  value: value ? parseFloat(value) : undefined,
                  probability: probability ? parseInt(probability) : undefined,
                  expectedCloseDate: expectedCloseDate
                    ? new Date(expectedCloseDate).toISOString()
                    : undefined,
                  status: "OPEN" as const,
                  currency: "USD",
                };
                handleCreateDeal(dealData);
              }}
            >
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal title"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter deal description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Value
                  </label>
                  <input
                    name="value"
                    type="number"
                    min="0"
                    step="0.01"
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-gray-700">
                    Probability (%)
                  </label>
                  <input
                    name="probability"
                    type="number"
                    min="0"
                    max="100"
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Expected Close Date
                </label>
                <input
                  name="expectedCloseDate"
                  type="date"
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex mt-6 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormError(null);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-white rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Add Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdate={updatedDeal => {
            // Refetch to get updated data from server
            refetch();
            setSelectedDeal(updatedDeal);
          }}
        />
      )}
    </div>
  );
};

export default DealsList;
