"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Users,
  Layers,
  Calendar,
  Loader2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/utils/formatDateTime";
import { toast } from "sonner";

interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  owner_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  member_count: number;
  workspace_count: number;
}

export function OrganizationOverviewView() {
  const { user, organizations } = useAuth();
  const [organizationInfo, setOrganizationInfo] =
    useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const currentOrganization = organizations?.find(
    org => org.id === user?.organization_id
  );

  const fetchOrganizationInfo = async () => {
    if (!user?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/auth/organizations/${user.organization_id}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization info: ${response.status}`
        );
      }

      const result = await response.json();
      const data = result.data || result;

      setOrganizationInfo({
        id: data.id,
        name: data.name,
        slug: data.slug,
        owner_id: data.owner_id,
        owner_name: data.owner_name,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
        member_count: data.member_count || 0,
        workspace_count: data.workspace_count || 0,
      });
      setEditName(data.name);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch organization info";
      setError(errorMessage);

      // Fallback to using context data if API fails
      if (currentOrganization) {
        setOrganizationInfo({
          id: currentOrganization.id,
          name: currentOrganization.name,
          slug: currentOrganization.slug,
          owner_id: currentOrganization.owner_id,
          is_active: currentOrganization.is_active,
          created_at: currentOrganization.created_at,
          updated_at: currentOrganization.updated_at,
          member_count: 0,
          workspace_count: 0,
        });
        setEditName(currentOrganization.name);
        setError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationInfo();
  }, [user?.organization_id]);

  const handleSaveName = async () => {
    if (!editName.trim() || !organizationInfo) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/auth/organizations/${organizationInfo.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: editName.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update organization name"
        );
      }

      setOrganizationInfo({ ...organizationInfo, name: editName.trim() });
      setIsEditing(false);
      toast.success("Organization name updated successfully");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update organization name";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(organizationInfo?.name || "");
    setIsEditing(false);
  };

  const isOwner =
    user?.id === organizationInfo?.owner_id ||
    user?.organization_role === "OWNER" ||
    user?.organization_permissions?.includes("MANAGE_ORGANIZATION");

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !organizationInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400 mb-2">
            Error loading organization
          </div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <Button
            variant="outline"
            onClick={() => fetchOrganizationInfo()}
            className="text-gray-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!organizationInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Organization
          </h3>
          <p className="text-gray-500">You are not part of any organization.</p>
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
            Organization Overview
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your organization settings
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Organization
            </CardTitle>
            <Building2 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">
              {organizationInfo.name}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {organizationInfo.is_active ? "Active" : "Inactive"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Members
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {organizationInfo.member_count}
            </div>
            <p className="text-xs text-gray-500 mt-1">Organization members</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Workspaces
            </CardTitle>
            <Layers className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {organizationInfo.workspace_count}
            </div>
            <p className="text-xs text-gray-500 mt-1">Active workspaces</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Created
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatDateTime(organizationInfo.created_at).split(",")[0]}
            </div>
            <p className="text-xs text-gray-500 mt-1">Organization created</p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Organization Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Organization Name
              </Label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1"
                    disabled={saving}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={saving || !editName.trim()}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                    {organizationInfo.name}
                  </div>
                  {isOwner && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Organization Slug
              </Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {organizationInfo.slug}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Owner
              </Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {organizationInfo.owner_name || organizationInfo.owner_id}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Status
              </Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {organizationInfo.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Created At
              </Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {formatDateTime(organizationInfo.created_at)}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-600 dark:text-gray-400">
                Last Updated
              </Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                {formatDateTime(organizationInfo.updated_at)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
