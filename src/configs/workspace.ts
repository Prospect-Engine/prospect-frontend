const config = {
  // Workspace CRUD
  createWorkspace: "/api/workspaces/create",
  updateWorkspace: "/api/workspaces/:id",
  deleteWorkspace: "/api/workspaces/:id",
  getWorkspaceList: "/api/workspaces",
  getWorkspaceMembers: "/api/workspaces/members",

  // Member management
  getMemberList: "/api/workspaces/members",
  getSeatStats: "/api/workspaces/seat-stats",
  getWorkspaceStats: "/api/workspaces/stats",
  sendInvitation: "/api/workspaces/send-invitation",
  joinWorkspace: "/api/workspaces/invitations/join",
  permitWorkspace: "/api/workspaces/permissions",
  givenPermissions: "/api/workspaces/permissions",

  // Workspace and organization switching
  getAllSwitchableAccounts: "/api/workspaces/all-accounts",
  switchWorkspace: "/api/auth/switch-workspace",
  switchOrganization: "/api/auth/switch-organization",
  getPermissions: "/api/workspaces/permissions",
};
export default config;
