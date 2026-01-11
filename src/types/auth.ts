export type UserDataType = {
  user_id: number;
  username: string;
  email: string;
  name: string;
  role: string;
  workspace_id?: string;
  organization_id?: string;
  organization_role?: string;
  organization_permissions?: string[];
  workspace_role?: string;
  workspace_permissions?: string[];
  joined_at?: Date | string;
  is_onboarded?: boolean;
};

export type SwitchableAccountType = {
  name: string;
  workspace_id: string | null;
  user_id: string;
  workspace_name: string;
  organization_id: string;
};

export type AuthValuesType = {
  user: UserDataType | null;
  loading: boolean;
  switchableAccounts: SwitchableAccountType[];
  permissions: string[];
  switchWorkspace: (workspaceId: string) => Promise<void>;
  switchOrganization: (
    organizationId: string
  ) => Promise<{ needsWorkspaceCreation: boolean }>;
  logout: () => void;
};
