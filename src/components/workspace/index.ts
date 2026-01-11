// Workspace components - new implementations
export { WorkspaceSwitcher, TeamSwitcher } from "./WorkspaceSwitcher";
export {
  WorkspaceSwitcherDropdown,
  TeamSwitcherDropdown,
} from "./WorkspaceSwitcherDropdown";
export {
  CreateWorkspaceModal,
  CreateTeamModal,
} from "./create-workspace-modal";

// Re-export team modals with workspace aliases for gradual migration
// These maintain backward compatibility while enabling migration to workspace naming
export { TeamDetailsModal } from "../team/team-details-modal";
export { TeamDetailsModal as WorkspaceDetailsModal } from "../team/team-details-modal";

export { DeleteTeamModal } from "../team/delete-team-modal";
export { DeleteTeamModal as DeleteWorkspaceModal } from "../team/delete-team-modal";

export { InviteMemberModal } from "../team/invite-member-modal";
export { InviteMemberModal as InviteWorkspaceMemberModal } from "../team/invite-member-modal";

export { RemoveMemberModal } from "../team/remove-member-modal";
export { RemoveMemberModal as RemoveWorkspaceMemberModal } from "../team/remove-member-modal";

export { EditMemberModal } from "../team/edit-member-modal";
export { EditMemberModal as EditWorkspaceMemberModal } from "../team/edit-member-modal";

export { TransferMemberModal } from "../team/transfer-member-modal";
export { TransferMemberModal as TransferWorkspaceMemberModal } from "../team/transfer-member-modal";

export { ManageMemberRolePermissionsModal } from "../team/manage-member-role-permissions-modal";
export { ManageMemberRolePermissionsModal as ManageWorkspaceMemberPermissionsModal } from "../team/manage-member-role-permissions-modal";
