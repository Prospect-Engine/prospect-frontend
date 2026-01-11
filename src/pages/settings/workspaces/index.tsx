"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkspacesOverviewView } from "@/view/settings/workspaces/workspaces-overview";
import { WorkspaceMembersView } from "@/view/settings/workspaces/workspace-members";
import { TransferRequestsView } from "@/view/settings/workspaces/transfer-requests";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";

const WorkspaceManagementPage = () => {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <AuthGuard>
      <AppLayout activePage="Settings" className="!p-0">
        <div className="w-full p-6">
          {/* <div className="mb-8">
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-muted-foreground mt-2">Manage teams, members, transfers, permissions, and seats</p>
          </div> */}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Workspaces Overview</TabsTrigger>
              <TabsTrigger value="members">Workspace Members</TabsTrigger>
              <TabsTrigger value="transfers">Transfer Requests</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <WorkspacesOverviewView />
            </TabsContent>

            <TabsContent value="members" className="mt-6">
              <WorkspaceMembersView />
            </TabsContent>

            <TabsContent value="transfers" className="mt-6">
              <TransferRequestsView />
            </TabsContent>
          </Tabs>
        </div>
      </AppLayout>
    </AuthGuard>
  );
};

export default WorkspaceManagementPage;
