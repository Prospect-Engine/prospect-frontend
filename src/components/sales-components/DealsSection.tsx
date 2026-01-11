import React, { useState, useEffect, useCallback } from "react";
import { TrendingUp, Calendar, User } from "lucide-react";
import { Deal } from "../../types/sales-types";
import dealService from "../../services/sales-services/dealService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

interface DealsSectionProps {
  entityId: string;
  entityType: "contact" | "company";
}

const DealsSection: React.FC<DealsSectionProps> = ({
  entityId,
  entityType,
}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedEntity, setLastLoadedEntity] = useState<string | null>(null);
  const {
    selectedWorkspace,
    selectedOrganization,
    isLoading: workspaceLoading,
  } = useWorkspace();

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unknown date";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (value: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-blue-500";
      case "WON":
        return "bg-green-500";
      case "LOST":
        return "bg-red-500";
      case "PAUSED":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const loadDeals = useCallback(async () => {
    const token = localStorage.getItem("crm_access_token");
    if (!token) {
      setError("Authentication required");
      setLoading(false);
      return;
    }

    if (!selectedWorkspace) {
      setError("Please select a workspace");
      setLoading(false);
      return;
    }

    if (!selectedOrganization) {
      setError("Please select an organization");
      setLoading(false);
      return;
    }

    // Create a unique key for this entity
    const entityKey = `${entityType}-${entityId}-${selectedWorkspace.id}-${selectedOrganization?.id}`;

    // Check if we already have data for this entity and it's not stale
    if (lastLoadedEntity === entityKey && deals.length > 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (entityType === "contact") {
        response = await dealService.getDealsByContact(
          entityId,
          selectedWorkspace.id,
          selectedOrganization?.id,
          token
        );
      } else {
        response = await dealService.getDealsByCompany(
          entityId,
          selectedWorkspace.id,
          selectedOrganization?.id,
          token
        );
      }

      if (response.success && response.data) {
        setDeals(response.data);
        setLastLoadedEntity(entityKey);
      } else {
        setError(response.error || "Failed to load deals");
      }
    } catch (err) {
      setError("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [
    entityId,
    entityType,
    selectedWorkspace,
    selectedOrganization,
    deals.length,
    lastLoadedEntity,
  ]);

  useEffect(() => {
    if (!workspaceLoading && selectedWorkspace && selectedOrganization) {
      loadDeals();
    }
  }, [
    entityId,
    entityType,
    selectedWorkspace,
    selectedOrganization,
    workspaceLoading,
    loadDeals,
  ]);

  const handleRefresh = () => {
    setLastLoadedEntity(null); // Clear cache to force reload
    loadDeals();
  };

  if (workspaceLoading) {
    return (
      <div className="p-4" data-tab="deals">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">Deals</h3>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="mt-2 text-sm text-gray-500">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4" data-tab="deals">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">Deals</h3>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="mt-2 text-sm text-gray-500">Loading deals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4" data-tab="deals">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">Deals</h3>
        </div>
        <div className="py-8 text-center">
          <div className="mb-2 text-red-500">⚠️</div>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4" data-tab="deals">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-900">Deals</h3>
      </div>

      {deals.length > 0 ? (
        <div className="space-y-3">
          {deals.map((deal, index) => (
            <div
              key={(deal.id as string) || index}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors hover:bg-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-1 space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(
                        deal.status as string
                      )}`}
                    />
                    <span className="text-xs font-medium text-gray-700 uppercase">
                      {(deal.status as string) || "Unknown Stage"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {deal.createdAt
                        ? formatDate(deal.createdAt as string)
                        : "Unknown date"}
                    </span>
                  </div>
                  <h4 className="mb-1 text-sm font-medium text-gray-900">
                    {(deal.title as string) || "Untitled Deal"}
                  </h4>
                  {Boolean(deal.value) && (
                    <p className="text-sm font-medium text-green-600">
                      {formatCurrency(
                        deal.value as number,
                        deal.currency as string
                      )}
                    </p>
                  )}
                  {Boolean(deal.probability) && (
                    <p className="text-xs text-gray-500">
                      {deal.probability}% probability
                    </p>
                  )}
                  {Boolean(deal.description) && (
                    <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {deal.description as string}
                    </p>
                  )}
                  {deal.expectedCloseDate && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <Calendar className="mr-1 w-3 h-3" />
                      Expected close:{" "}
                      {formatDate(deal.expectedCloseDate as string)}
                    </div>
                  )}
                  {deal.owner && (
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                      <User className="mr-1 w-3 h-3" />
                      {deal.owner.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <TrendingUp className="mx-auto mb-2 w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">No deals associated yet</p>
        </div>
      )}
    </div>
  );
};

export default DealsSection;
