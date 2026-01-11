"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Shield, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Organization permissions based on Prisma schema
const ORGANIZATION_PERMISSIONS = [
  {
    permission: "MANAGE_ORGANIZATION",
    description: "Full control over organization settings and configuration",
  },
  {
    permission: "MANAGE_BILLING",
    description: "Manage subscription, payments, and billing information",
  },
  {
    permission: "MANAGE_MEMBERS",
    description: "Invite, edit, and remove organization members",
  },
  {
    permission: "MANAGE_WORKSPACES",
    description: "Create, edit, and archive workspaces",
  },
  {
    permission: "MANAGE_WHITE_LABEL",
    description: "Configure white-label and branding settings",
  },
  {
    permission: "VIEW_ANALYTICS",
    description: "Access organization-wide analytics and reports",
  },
];

// Permissions granted to each role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: [
    "MANAGE_ORGANIZATION",
    "MANAGE_BILLING",
    "MANAGE_MEMBERS",
    "MANAGE_WORKSPACES",
    "MANAGE_WHITE_LABEL",
    "VIEW_ANALYTICS",
  ],
  ADMIN: ["MANAGE_MEMBERS", "MANAGE_WORKSPACES", "VIEW_ANALYTICS"],
  MEMBER: ["VIEW_ANALYTICS"],
};

export function OrganizationPermissionsView() {
  const { user } = useAuth();

  const userRole = user?.organization_role || "MEMBER";
  const userPermissions = user?.organization_permissions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Organization Permissions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            View permissions available for organization roles
          </p>
        </div>
      </div>

      {/* Your Role Card */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Role & Permissions
          </CardTitle>
          <CardDescription>
            Your current role and permissions in this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Role:
            </span>
            <Badge
              className={
                userRole === "OWNER"
                  ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                  : userRole === "ADMIN"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              }
            >
              {userRole}
            </Badge>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Your Permissions:
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {userPermissions.length > 0 ? (
                userPermissions.map(perm => (
                  <Badge
                    key={perm}
                    variant="outline"
                    className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {perm.replace(/_/g, " ")}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">
                  No specific permissions assigned
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Matrix */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Permissions Matrix
          </CardTitle>
          <CardDescription>
            Overview of permissions available for each organization role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Permission</TableHead>
                <TableHead className="text-center">Owner</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-center">Member</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ORGANIZATION_PERMISSIONS.map(item => (
                <TableRow key={item.permission}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.permission.replace(/_/g, " ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {ROLE_PERMISSIONS.OWNER.includes(item.permission) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {ROLE_PERMISSIONS.ADMIN.includes(item.permission) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {ROLE_PERMISSIONS.MEMBER.includes(item.permission) ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Description */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-white">
            Permission Descriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ORGANIZATION_PERMISSIONS.map(item => (
              <div
                key={item.permission}
                className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <Badge variant="outline" className="shrink-0">
                  {item.permission.replace(/_/g, " ")}
                </Badge>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
