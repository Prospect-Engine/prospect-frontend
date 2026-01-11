const platform = {
  LINKEDIN: "LINKEDIN",
  GMAIL: "GMAIL",
  FACEBOOK: "FACEBOOK",
  WHATSAPP: "WHATSAPP",
  TELEGRAM: "TELEGRAM",
  TWITTER: "TWITTER",
} as const;

export const platformTitle = {
  LINKEDIN: "Linkedin",
  GMAIL: "Gmail",
  FACEBOOK: "Facebook",
  WHATSAPP: "Whatsapp",
  TELEGRAM: "Telegram",
  TWITTER: "Twitter",
} as const;

export type GetValues<T> = T[keyof T];

export type Platform = GetValues<typeof platform>;
export type PlatformTitle = GetValues<typeof platformTitle>;

export type RequiredAction =
  | "WAITING"
  | "PROVIDE_OTP"
  | "UPDATE_CREDENTIALS"
  | "RETRY"
  | "SOLVE_CAPTCHA"
  | "TWO_FACTOR_AUTH_ENABLED";

export type Integration = {
  id: string;
  type: Platform;
  email: string;
  logo?: string;
  country_code: string;
  country_name: string;
  connection_status: "CONNECTED" | "DISCONNECTED";
  connection_message: string;
  required_action: RequiredAction;
  account_name: string;
  propic_url: string;
  profile_url: string;
  ws_url?: string;
  is_premium: boolean;
};

export const logoBackground: Record<Platform, string> = {
  LINKEDIN: "#0077b5",
  FACEBOOK: "#1877F2",
  WHATSAPP: "#25D366",
  GMAIL: "#D44638",
  TELEGRAM: "#0088CC",
  TWITTER: "#1DA1F2",
};

export type IntegrationOption = {
  title: PlatformTitle;
  icon: string;
  isAvailable: boolean;
  platform: Platform;
  createLink?: string;
  setSelectedPlatform?: (platform: string) => void;
  disableActions?: boolean;
};

export type IntegrationColOption = Integration & IntegrationOption;

// Enhanced types for the new connection status design
export type ConnectionStage = "initial" | "connected" | "disconnected";

export type EnhancedIntegrationOption = IntegrationOption & {
  connectionStage?: ConnectionStage;
  connectedUser?: {
    name: string;
    email: string;
    avatar?: string;
    isActive: boolean;
  };
  onConnect?: () => void;
  onDisconnect?: () => void;
  onReconnect?: () => void;
  onRemove?: () => void;
  showEnhancedUI?: boolean;
};
