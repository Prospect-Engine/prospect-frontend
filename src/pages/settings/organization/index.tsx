"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizationOverviewView } from "@/view/settings/organization/organization-overview";
import { OrganizationMembersView } from "@/view/settings/organization/organization-members";
import { OrganizationPermissionsView } from "@/view/settings/organization/organization-permissions";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";

const OrganizationSettingsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AuthGuard>
      <AppLayout activePage="Settings" className="!p-0">
        <div className="w-full p-6">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Organization Overview</TabsTrigger>
              <TabsTrigger value="members">Organization Members</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OrganizationOverviewView />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <OrganizationMembersView />
            </TabsContent>

            <TabsContent value="permissions" className="mt-6">
              <OrganizationPermissionsView />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default OrganizationSettingsPage;
