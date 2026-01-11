import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User,
  Users,
  ListChecks,
  Bell,
  Link,
  Shield,
  Palette,
  CreditCard,
  Key,
  Sun,
  FileText,
  Mail,
  Plus,
  Trash2,
  Upload,
  Download,
  Save,
  X,
  Calendar,
  Shield as ShieldIcon,
  CheckCircle,
  AlertCircle,
  Send,
  MoreVertical,
  Edit,
  UserX,
  VenetianMask,
  Tag,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Search,
  Building2,
  Settings as SettingsIcon,
  Target,
} from "lucide-react";
import { useAuth } from "../../hooks/sales-hooks/useAuth";
import authService from "../../services/sales-services/authService";
import invitationService, {
  InviteUserRequest,
} from "../../services/sales-services/invitationService";
import tagService, {
  Contact,
  Company,
  Deal,
} from "../../services/sales-services/tagService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import OrganizationManager from "./OrganizationManager";
import WorkspaceManager from "./WorkspaceManager";
import PipelineManagement from "./PipelineManagement";
import WhatsAppIntegrationSettings from "./WhatsAppIntegrationSettings";
import dealService from "../../services/sales-services/dealService";
import { API_BASE_URL } from "../../services/sales-services/baseUrl";

// Centralized API configuration
// Base API from centralized env helper

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  joinedAt: string;
  lastLoginAt?: string;
  isCurrentUser?: boolean;
}

interface ApiMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

const SECTIONS = [
  {
    group: "Account",
    items: [{ key: "profile", label: "Profile", icon: User }],
  },
  // {
  //   group: "Organization",
  //   items: [
  //     { key: "organizations", label: "Organizations", icon: Building2 },
  //     { key: "workspaces", label: "Workspaces", icon: SettingsIcon },
  //   ],
  // },
  {
    group: "Workspace",
    items: [
      // { key: "team", label: "Team & Users", icon: Users },
      // { key: 'lead', label: 'Lead Management', icon: ListChecks },
      { key: "tags", label: "Tag Management", icon: Tag },
      { key: "pipeline", label: "Pipeline Management", icon: Target },
    ],
  },
  // {
  //   group: 'Data',
  //   items: [
  //     { key: 'notifications', label: 'Notifications', icon: Bell },
  //     { key: 'privacy', label: 'Data & Privacy', icon: Shield },
  //   ],
  // },
  {
    group: "Integrations",
    items: [
      // { key: 'integrations', label: 'Integrations', icon: Link },
      { key: "whatsapp", label: "WhatsApp Integration", icon: Send },
    ],
  },
  // {
  //   group: 'Billing',
  //   items: [
  //     { key: 'appearance', label: 'Appearance', icon: Palette },
  //     { key: 'billing', label: 'Billing & Subscription', icon: CreditCard },
  //   ],
  // },
  // {
  //   group: "Pipeline",
  //   items: [{ key: "pipeline", label: "Pipeline Management", icon: Target }],
  // },
];

const Settings: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [section, setSection] = useState("profile");

  // Handle URL parameters to set the initial section
  useEffect(() => {
    const sectionParam = searchParams.get("section");
    if (sectionParam) {
      setSection(sectionParam);
    }
  }, [searchParams]);

  // Helper function to handle section changes with URL updates
  const handleSectionChange = (newSection: string) => {
    setSection(newSection);
    const params = new URLSearchParams(searchParams.toString());
    params.set("section", newSection);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex h-full bg-gray-50 dark:bg-gray-900">
      {/* Settings Sidebar */}
      <aside className="flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Navigation */}
        <div className="overflow-y-auto flex-1">
          {SECTIONS.map(group => (
            <div key={group.group} className="p-4">
              <h3 className="mb-3 text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-left transition-all duration-200 ${
                      section === key
                        ? "bg-gray-900 dark:bg-gray-700 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleSectionChange(key)}
                  >
                    <Icon className="mr-3 w-4 h-4" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Settings Content */}
      <main className="overflow-y-auto flex-1 px-20 py-10">
        <div
          key={section}
          className="settings-section-enter"
          style={{
            animation: "settingsSectionEnter 0.3s ease-out",
            width: "100%",
            height: "100%",
          }}
        >
          {section === "profile" && <ProfileSettings />}
          {section === "organizations" && <OrganizationManager />}
          {section === "workspaces" && <WorkspaceManager />}
          {section === "team" && <TeamSettings />}
          {section === "lead" && <LeadSettings />}
          {section === "tags" && <TagSettings />}
          {section === "pipeline" && <PipelineManagement />}
          {section === "notifications" && <NotificationSettings />}
          {section === "integrations" && <IntegrationSettings />}
          {section === "whatsapp" && <WhatsAppIntegrationSettings />}
          {section === "privacy" && <PrivacySettings />}
          {section === "appearance" && <AppearanceSettings />}
          {section === "billing" && <BillingSettings />}
        </div>
      </main>
    </div>
  );
};

// --- Section Components ---

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-8 mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm smooth-transition">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}

function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="mb-6 smooth-transition">
      <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function FormRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 mb-6 lg:grid-cols-2">{children}</div>
  );
}

// Minimal Modal component
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-in-out ${
        open
          ? "bg-opacity-30 backdrop-blur-sm"
          : "bg-opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-xl md:max-w-2xl relative transition-all duration-300 ease-in-out transform ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    avatar: user?.avatar || "",
    timezone: user?.timezone || "UTC",
  });
  // Change password modal state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handlePasswordInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value,
    }));
    if (passwordError) setPasswordError("");
    if (passwordSuccess) setPasswordSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = authService.getAccessToken();
      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      const response = await authService.updateProfile(formData, token);

      if (response.success && response.data) {
        setSuccess("Profile updated successfully!");
        // Refresh user data to get updated information
        await refreshUser();
      } else {
        setError(
          response.error || "Failed to update profile. Please try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      setPasswordLoading(false);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      setPasswordLoading(false);
      return;
    }

    try {
      const token = authService.getAccessToken();
      if (!token) {
        setPasswordError("Authentication token not found. Please login again.");
        setPasswordLoading(false);
        return;
      }

      const response = await authService.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
        token
      );

      if (response.success) {
        setPasswordSuccess("Password changed successfully!");
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        setShowChangePassword(false);
      } else {
        setPasswordError(response.error || "Failed to change password.");
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        phoneNumber: user.phoneNumber || "",
        avatar: user.avatar || "",
        timezone: user.timezone || "UTC",
      });
    }
  }, [user]);

  return (
    <>
      <SectionCard title="Profile Settings">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Account Information */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center mb-4 space-x-3">
              <ShieldIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Account Information
              </h3>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Account Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    User ID:
                  </span>
                  <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {user?.id}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <span className="px-2 py-1 text-xs text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role:
                  </span>
                  <span className="px-2 py-1 text-xs text-green-800 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-full">
                    {user?.globalRole}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Verification:
                  </span>
                  {user?.emailVerified ? (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 dark:text-green-400">
                        Verified
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-yellow-600 dark:text-yellow-400">
                        Unverified
                      </span>
                    </div>
                  )}
                </div>
                {user?.createdAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Joined:
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <img
                    src={
                      formData.avatar ||
                      user?.avatar ||
                      `https://ui-avatars.com/api/?name=${user?.name}&background=random`
                    }
                    alt="Avatar"
                    className="object-cover w-24 h-24 rounded-full border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                  <button
                    type="button"
                    className="absolute -right-2 -bottom-2 p-2 text-white bg-gray-900 dark:bg-gray-700 rounded-full transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-600 hover:scale-110 shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center">
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Click the upload button to change your profile picture
                  </p>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-300 dark:border-gray-600 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 shadow-sm"
                  >
                    Upload New Picture
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-400">
                  {error}
                </span>
              </div>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-400">
                  {success}
                </span>
              </div>
            </div>
          )}

          <FormRow>
            <FormField label="Full Name" required>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
              />
            </FormField>
            <FormField label="Email Address">
              <input
                type="email"
                className="px-3 py-2 w-full text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                value={user?.email || ""}
                disabled
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Phone Number">
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </FormField>
            <FormField label="Timezone">
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </FormField>
          </FormRow>

          <FormRow>
            <FormField label="Role">
              <input
                type="text"
                className="px-3 py-2 w-full text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600"
                value={user?.globalRole || "N/A"}
                disabled
              />
            </FormField>
            <FormField label="Password">
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ••••••••
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 underline cursor-pointer hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Change password
                </button>
              </div>
            </FormField>
          </FormRow>

          <FormField label="Two-Factor Authentication">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                className="w-5 h-5 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                id="2fa"
              />
              <label
                htmlFor="2fa"
                className="text-sm text-gray-700 dark:text-gray-300"
              >
                Enable two-factor authentication for enhanced security
              </label>
            </div>
          </FormField>

          <div className="flex pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-600 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Save className="mr-2 w-4 h-4" />
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              disabled={isLoading}
              className="flex items-center px-6 py-3 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <X className="mr-2 w-4 h-4" />
              Cancel
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Password Change Modal - Outside the main form */}
      <Modal
        open={showChangePassword}
        onClose={() => {
          setShowChangePassword(false);
          setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          });
          setPasswordError("");
          setPasswordSuccess("");
        }}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Change Password
        </h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <input
            type="password"
            name="currentPassword"
            value={passwordForm.currentPassword}
            onChange={handlePasswordInputChange}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Current password"
            required
          />
          <input
            type="password"
            name="newPassword"
            value={passwordForm.newPassword}
            onChange={handlePasswordInputChange}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="New password"
            required
          />
          <input
            type="password"
            name="confirmNewPassword"
            value={passwordForm.confirmNewPassword}
            onChange={handlePasswordInputChange}
            className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Confirm new password"
            required
          />
          {passwordError && (
            <div className="p-2 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700">
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="p-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded border border-green-200 dark:border-green-700">
              {passwordSuccess}
            </div>
          )}
          <div className="flex mt-2 space-x-2">
            <button
              type="button"
              disabled={passwordLoading}
              onClick={handlePasswordSubmit}
              className="px-4 py-2 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-800 dark:hover:bg-gray-600 hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100"
            >
              {passwordLoading ? "Saving..." : "Save Password"}
            </button>
            <button
              type="button"
              disabled={passwordLoading}
              className="px-4 py-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105 shadow-sm disabled:opacity-50 disabled:hover:scale-100"
              onClick={() => {
                setShowChangePassword(false);
                setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmNewPassword: "",
                });
                setPasswordError("");
                setPasswordSuccess("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function TeamSettings() {
  const { user } = useAuth();
  const { selectedOrganization, selectedWorkspace } = useWorkspace();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [impersonatingMember, setImpersonatingMember] = useState<string | null>(
    null
  );
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] =
    useState<TeamMember | null>(null);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    invitationType: "WORKSPACE_SPECIFIC",
    organizationRole: "MEMBER",
    workspaceRole: "MEMBER",
    workspaceId: "",
    workspaceInvitations: [] as Array<{ workspaceId: string; role: string }>,
  });
  const [availableWorkspaces, setAvailableWorkspaces] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
    }>
  >([]);
  const [showWorkspaceSelection, setShowWorkspaceSelection] = useState(false);
  const [workspaceSearchTerm, setWorkspaceSearchTerm] = useState("");

  // Load available workspaces for the organization
  const loadAvailableWorkspaces = useCallback(async () => {
    if (!selectedOrganization) return;

    try {
      const response = await authService.getWorkspacesByOrganization(
        selectedOrganization.id
      );

      if (response.success && response.data) {
        const workspaces = (
          response.data as Array<Record<string, unknown>>
        ).map(w => ({
          id: String(w.id),
          name: String(w.name),
          description: (w.description as string) || undefined,
        }));
        setAvailableWorkspaces(workspaces);
      } else {
        setAvailableWorkspaces([]);
      }
    } catch (error) {
      setAvailableWorkspaces([]);
    }
  }, [selectedOrganization]);

  // Handle clicking outside to close dropdowns and scroll events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openDropdown]);

  // Function to handle dropdown positioning
  const handleDropdownClick = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right - window.scrollX,
      });
      setOpenDropdown(id);
    }
  };

  // Fetch invitations and team members
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !selectedOrganization) {
        return;
      }

      setLoading(true);
      setMembersLoading(true);

      try {
        const token = localStorage.getItem("crm_access_token");
        if (!token) {
          return;
        }

        // Load available workspaces
        await loadAvailableWorkspaces();

        // Fetch invitations
        const response = await invitationService.getInvitations(
          selectedOrganization.id,
          token
        );

        if (response.success && response.data) {
          // Filter out accepted invitations (should already be filtered on backend)
          const pendingInvitations =
            response.data.invitations?.filter((inv: any) => !inv.isAccepted) ||
            [];
          setInvitations(pendingInvitations);
        }

        // Fetch organization members
        try {
          const membersResponse = await fetch(
            `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (membersResponse.ok) {
            const membersData = await membersResponse.json();

            const members =
              membersData.members?.map((member: ApiMember) => ({
                ...member,
                joinedAt: member.createdAt,
                isCurrentUser: member.id === user.id,
              })) || [];

            setTeamMembers(members);
          } else {
            const errorData = await membersResponse.json();

            // Fallback to showing current user only
            const currentOrgMembership = user.organizations?.find(
              (org: any) => org.id === selectedOrganization.id
            );
            if (currentOrgMembership) {
              setTeamMembers([
                {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  avatar: user.avatar,
                  role: currentOrgMembership.role,
                  isActive: user.isActive,
                  joinedAt:
                    currentOrgMembership.createdAt || user.createdAt || "",
                  isCurrentUser: true,
                },
              ]);
            }
          }
        } catch (error) {
          // Fallback to showing current user only
          const currentOrgMembership = user.organizations?.find(
            (org: any) => org.id === selectedOrganization.id
          );
          if (currentOrgMembership) {
            setTeamMembers([
              {
                id: user.id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: currentOrgMembership.role,
                isActive: user.isActive,
                joinedAt:
                  currentOrgMembership.createdAt || user.createdAt || "",
                isCurrentUser: true,
              },
            ]);
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
        setMembersLoading(false);
      }
    };

    fetchData();
  }, [user, selectedOrganization, loadAvailableWorkspaces]);

  // Handle multiple workspace selection
  const handleWorkspaceSelection = (workspaceId: string, role: string) => {
    setInviteForm(prev => {
      const existingIndex = prev.workspaceInvitations.findIndex(
        ws => ws.workspaceId === workspaceId
      );

      if (existingIndex >= 0) {
        // Update existing workspace role
        const updated = [...prev.workspaceInvitations];
        updated[existingIndex] = { workspaceId, role };
        return { ...prev, workspaceInvitations: updated };
      } else {
        // Add new workspace
        return {
          ...prev,
          workspaceInvitations: [
            ...prev.workspaceInvitations,
            { workspaceId, role },
          ],
        };
      }
    });
  };

  // Remove workspace from selection
  const removeWorkspaceFromSelection = (workspaceId: string) => {
    setInviteForm(prev => ({
      ...prev,
      workspaceInvitations: prev.workspaceInvitations.filter(
        ws => ws.workspaceId !== workspaceId
      ),
    }));
  };

  // Clear all selected workspaces
  const clearAllWorkspaceSelections = () => {
    setInviteForm(prev => ({ ...prev, workspaceInvitations: [] }));
  };

  // Get selected workspace role
  const getSelectedWorkspaceRole = (workspaceId: string) => {
    const workspace = inviteForm.workspaceInvitations.find(
      ws => ws.workspaceId === workspaceId
    );
    return workspace?.role || "MEMBER";
  };

  // Check if workspace is selected
  const isWorkspaceSelected = (workspaceId: string) => {
    return inviteForm.workspaceInvitations.some(
      ws => ws.workspaceId === workspaceId
    );
  };

  // Filter workspaces based on search term
  const filteredWorkspaces = availableWorkspaces.filter(
    workspace =>
      workspace.name
        .toLowerCase()
        .includes(workspaceSearchTerm.toLowerCase()) ||
      (workspace.description &&
        workspace.description
          .toLowerCase()
          .includes(workspaceSearchTerm.toLowerCase()))
  );

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrganization) return;

    // Validate multiple workspace selection
    if (
      inviteForm.invitationType === "MULTIPLE_WORKSPACES" &&
      inviteForm.workspaceInvitations.length === 0
    ) {
      setError(
        "Please select at least one workspace for multiple workspace invitation"
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      // Build payload strictly per invitation type
      const base = {
        email: inviteForm.email,
        name: inviteForm.name,
        type: inviteForm.invitationType as
          | "WORKSPACE_SPECIFIC"
          | "ORGANIZATION_WIDE"
          | "MULTIPLE_WORKSPACES",
        organizationId: selectedOrganization.id,
      } as const;

      let payload:
        | {
            email: string;
            name: string;
            type:
              | "WORKSPACE_SPECIFIC"
              | "ORGANIZATION_WIDE"
              | "MULTIPLE_WORKSPACES";
            organizationId: string;
            organizationRole?: string;
            workspaceId?: string;
            workspaceRole?: string;
            workspaceInvitations?: Array<{ workspaceId: string; role: string }>;
          }
        | undefined;

      if (base.type === "ORGANIZATION_WIDE") {
        payload = {
          ...base,
          organizationRole: inviteForm.organizationRole,
        };
      } else if (base.type === "WORKSPACE_SPECIFIC") {
        payload = {
          ...base,
          workspaceId: inviteForm.workspaceId || selectedWorkspace?.id || "",
          workspaceRole: inviteForm.workspaceRole,
        };
      } else if (base.type === "MULTIPLE_WORKSPACES") {
        payload = {
          ...base,
          workspaceInvitations: inviteForm.workspaceInvitations,
        };
      }

      const response = await invitationService.inviteUser(
        payload as InviteUserRequest,
        token
      );

      if (response.success) {
        setShowInviteModal(false);
        setInviteForm({
          email: "",
          name: "",
          invitationType: "WORKSPACE_SPECIFIC",
          organizationRole: "MEMBER",
          workspaceRole: "MEMBER",
          workspaceId: "",
          workspaceInvitations: [],
        });
        setShowWorkspaceSelection(false);
        setWorkspaceSearchTerm("");
        // Refresh invitations list
        const refreshResponse = await invitationService.getInvitations(
          selectedOrganization.id,
          token
        );
        if (refreshResponse.success && refreshResponse.data) {
          const pendingInvitations =
            refreshResponse.data.invitations?.filter(
              (inv: any) => !inv.isAccepted
            ) || [];
          setInvitations(pendingInvitations);
        }

        // Also refresh team members to show any newly accepted users
        try {
          const membersResponse = await fetch(
            `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            const members =
              membersData.members?.map((member: ApiMember) => ({
                ...member,
                joinedAt: member.createdAt,
                isCurrentUser: member.id === user.id,
              })) || [];
            setTeamMembers(members);
          }
        } catch (error) {}

        setSuccess("Invitation sent successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.error || "Failed to send invitation";
        setError(errorMessage);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token || !selectedOrganization) return;

      const response = await invitationService.resendInvitation(
        invitationId,
        token
      );
      if (response.success) {
        // Refresh the list
        const refreshResponse = await invitationService.getInvitations(
          selectedOrganization.id,
          token
        );
        if (refreshResponse.success && refreshResponse.data) {
          const pendingInvitations =
            refreshResponse.data.invitations?.filter(
              (inv: any) => !inv.isAccepted
            ) || [];
          setInvitations(pendingInvitations);
        }
        setSuccess("Invitation resent successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.error || "Failed to resend invitation";
        setError(errorMessage);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token || !selectedOrganization) return;

      const response = await invitationService.cancelInvitation(
        invitationId,
        token
      );
      if (response.success) {
        // Refresh the list
        const refreshResponse = await invitationService.getInvitations(
          selectedOrganization.id,
          token
        );
        if (refreshResponse.success && refreshResponse.data) {
          const pendingInvitations =
            refreshResponse.data.invitations?.filter(
              (inv: any) => !inv.isAccepted
            ) || [];
          setInvitations(pendingInvitations);
        }
        setSuccess("Invitation canceled successfully!");
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMessage = response.error || "Failed to cancel invitation";
        setError(errorMessage);
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "text-yellow-800 bg-yellow-100";
      case "ACCEPTED":
        return "text-green-800 bg-green-100";
      case "EXPIRED":
        return "text-red-800 bg-red-100";
      default:
        return "text-gray-800 bg-gray-100";
    }
  };

  const getInvitationTypeLabel = (type: string) => {
    switch (type) {
      case "ORGANIZATION_WIDE":
        return "Organization-wide";
      case "WORKSPACE_SPECIFIC":
        return "Workspace-specific";
      case "MULTIPLE_WORKSPACES":
        return "Multiple workspaces";
      default:
        return type;
    }
  };

  // Action handlers for team members
  const handleImpersonate = async (member: TeamMember) => {
    if (!user || !selectedOrganization) return;

    // Set loading state for this specific member
    setImpersonatingMember(member.id);
    setOpenDropdown(null); // Close any open dropdowns
    setDropdownPosition(null);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setImpersonatingMember(null);
        return;
      }

      // Call impersonate API
      const response = await fetch(`${API_BASE_URL}/auth/impersonate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: member.id,
          organizationId: selectedOrganization.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Store original token and user data for reverting
        localStorage.setItem("original_token", token);
        localStorage.setItem(
          "original_user",
          JSON.stringify({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            role: user.globalRole,
          })
        );
        localStorage.setItem(
          "impersonated_user",
          JSON.stringify({
            id: member.id,
            name: member.name,
            email: member.email,
            avatar: member.avatar,
          })
        );

        // Replace the access token with impersonation token
        localStorage.setItem("access_token", data.impersonationToken);
        localStorage.setItem("impersonation_token", data.impersonationToken);

        // Fetch the impersonated user's profile to get their permissions and data
        const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${data.impersonationToken}`,
            "Content-Type": "application/json",
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();

          // Update stored user data with impersonated user's complete profile
          localStorage.setItem("user", JSON.stringify(profileData));

          setSuccess(`Now impersonating ${member.name}. Redirecting...`);
          setTimeout(() => {
            window.location.reload(); // Reload to apply impersonation with new token and user data
          }, 1000);
        } else {
          setError("Failed to load impersonated user profile.");
          setImpersonatingMember(null);
        }
      } else {
        const errorData = await response.json();

        setError("Failed to impersonate user. You may not have permission.");
        setImpersonatingMember(null);
      }
    } catch (error) {
      setError("An error occurred while impersonating user.");
      setImpersonatingMember(null);
    }
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleDeactivateMember = (member: TeamMember) => {
    setMemberToDeactivate(member);
    setShowDeactivateModal(true);
    setOpenDropdown(null);
    setDropdownPosition(null);
  };

  const confirmDeactivateMember = async () => {
    if (!user || !selectedOrganization || !memberToDeactivate) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members/${memberToDeactivate.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: !memberToDeactivate.isActive,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setTeamMembers(
          teamMembers.map(m =>
            m.id === memberToDeactivate.id ? { ...m, isActive: !m.isActive } : m
          )
        );
        setSuccess(
          `${memberToDeactivate.name} has been ${memberToDeactivate.isActive ? "deactivated" : "activated"}.`
        );
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();

        setError(
          "Failed to update member status. You may not have permission."
        );
      }
    } catch (error) {
      setError("An error occurred while updating member status.");
    } finally {
      setShowDeactivateModal(false);
      setMemberToDeactivate(null);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (!user || !selectedOrganization) return;

    if (
      !confirm(
        `Are you sure you want to remove ${member.name} from the organization? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members/${member.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // Remove from local state
        setTeamMembers(teamMembers.filter(m => m.id !== member.id));
        setSuccess(`${member.name} has been removed from the organization.`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();

        setError("Failed to remove member. You may not have permission.");
      }
    } catch (error) {
      setError("An error occurred while removing member.");
    }
  };

  const handleUpdateMember = async (updatedMember: Partial<TeamMember>) => {
    if (!user || !selectedOrganization || !editingMember) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/organizations/${selectedOrganization.id}/members/${editingMember.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedMember),
        }
      );

      if (response.ok) {
        // Update local state
        setTeamMembers(
          teamMembers.map(m =>
            m.id === editingMember.id ? { ...m, ...updatedMember } : m
          )
        );
        setShowEditModal(false);
        setEditingMember(null);
        setSuccess("Member updated successfully.");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorData = await response.json();

        setError("Failed to update member. You may not have permission.");
      }
    } catch (error) {
      setError("An error occurred while updating member.");
    }
  };

  // Close workspace selector on outside click / scroll / Escape
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (
        showWorkspaceSelection &&
        !(event.target as Element).closest(".workspace-dropdown")
      ) {
        setShowWorkspaceSelection(false);
      }
    };

    const onScroll = () => {
      if (showWorkspaceSelection) setShowWorkspaceSelection(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showWorkspaceSelection) {
        setShowWorkspaceSelection(false);
      }
    };

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [showWorkspaceSelection]);

  return (
    <SectionCard title="Team & Users">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage your team members and their roles
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Invite new users and manage their permissions
            </p>
          </div>
          <button
            onClick={() => {
              setShowInviteModal(true);
              setError("");
              setSuccess("");
            }}
            className="flex items-center px-3 py-2 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            <Plus className="mr-2 w-4 h-4" /> Invite User
          </button>
        </div>

        {/* Active Team Members */}
        <div className="mb-8">
          <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
            Active Team Members
          </h4>
          <div className="overflow-hidden relative bg-white rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    Member Details
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {membersLoading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading team members...
                    </td>
                  </tr>
                ) : teamMembers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No team members found
                    </td>
                  </tr>
                ) : impersonatingMember ? (
                  // Show only the impersonating user's row during impersonation
                  teamMembers
                    .filter(member => member.id === impersonatingMember)
                    .map(member => (
                      <tr
                        key={member.id}
                        className="bg-purple-50 border-purple-200 transition-colors"
                      >
                        <td colSpan={3} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center space-y-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full border-4 border-purple-600 animate-spin border-t-transparent"></div>
                              <div className="text-left">
                                <div className="text-lg font-medium text-purple-900">
                                  Impersonating {member.name}...
                                </div>
                                <div className="text-sm text-purple-600">
                                  Setting up user session and permissions
                                </div>
                              </div>
                            </div>
                            <div className="overflow-hidden w-full max-w-xs h-2 bg-purple-200 rounded-full">
                              <div className="h-2 bg-purple-600 rounded-full animate-pulse"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  // Show all members normally when not impersonating
                  teamMembers.map(member => (
                    <tr
                      key={member.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <img
                            src={
                              member.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`
                            }
                            className="mr-3 w-8 h-8 rounded-full"
                            alt={member.name}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {member.name}
                              {member.isCurrentUser && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {member.email}
                            </div>
                            {member.joinedAt && (
                              <div className="text-xs text-gray-400">
                                Joined{" "}
                                {new Date(member.joinedAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {member.role}{" "}
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              member.isActive
                                ? "text-green-800 bg-green-100"
                                : "text-red-800 bg-red-100"
                            }`}
                          >
                            {member.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        {!member.isCurrentUser && (
                          <div className="relative dropdown-container">
                            <button
                              onClick={e => handleDropdownClick(member.id, e)}
                              className="p-2 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openDropdown === member.id && dropdownPosition && (
                              <div
                                className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg"
                                style={{
                                  top: `${dropdownPosition.top}px`,
                                  right: `${dropdownPosition.right}px`,
                                  opacity: 0,
                                  transform: "translateY(-10px) scale(0.95)",
                                  animation:
                                    "dropdownAppear 0.2s ease-out forwards",
                                }}
                              >
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      handleImpersonate(member);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    disabled={!member.isActive}
                                    className={`flex items-center px-4 py-2 w-full text-sm transition-colors ${
                                      member.isActive
                                        ? "text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        : "text-gray-500 cursor-not-allowed"
                                    }`}
                                  >
                                    <VenetianMask
                                      className={`mr-3 w-4 h-4 ${
                                        member.isActive
                                          ? "text-purple-500"
                                          : "text-gray-500"
                                      }`}
                                    />
                                    Impersonate
                                    {!member.isActive && (
                                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                        (Inactive)
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleEditMember(member);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <Edit className="mr-3 w-4 h-4 text-blue-500" />
                                    Edit Member
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleDeactivateMember(member);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    <UserX className="mr-3 w-4 h-4 text-orange-500" />
                                    {member.isActive
                                      ? "Deactivate"
                                      : "Activate"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleRemoveMember(member);
                                      setOpenDropdown(null);
                                      setDropdownPosition(null);
                                    }}
                                    className="flex items-center px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                                  >
                                    <Trash2 className="mr-3 w-4 h-4 text-red-500" />
                                    Remove Member
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="mb-8">
          <h4 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
            Pending Invitations
          </h4>
          <div className="overflow-hidden relative bg-white rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    Member Details
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Loading invitations...
                    </td>
                  </tr>
                ) : invitations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No pending invitations
                    </td>
                  </tr>
                ) : (
                  invitations.map(invitation => (
                    <tr
                      key={invitation.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex justify-center items-center w-8 h-8 bg-gray-200 rounded-full">
                            <Mail className="w-4 h-4 text-gray-500" />
                          </div>
                          <div className="flex-1 ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {invitation.email}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {invitation.name || "No name provided"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {getInvitationTypeLabel(invitation.type)} • Sent{" "}
                              {new Date(
                                invitation.createdAt
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {invitation.organizationRole ||
                            invitation.workspaceRole ||
                            "Member"}
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invitation.status)}`}
                        >
                          {invitation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="relative dropdown-container">
                          <button
                            onClick={e =>
                              handleDropdownClick(
                                `invitation-${invitation.id}`,
                                e
                              )
                            }
                            className="p-2 text-gray-400 rounded-full transition-colors hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdown === `invitation-${invitation.id}` &&
                            dropdownPosition && (
                              <div
                                className="fixed z-50 w-40 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg"
                                style={{
                                  top: `${dropdownPosition.top}px`,
                                  right: `${dropdownPosition.right}px`,
                                  opacity: 0,
                                  transform: "translateY(-10px) scale(0.95)",
                                  animation:
                                    "dropdownAppear 0.2s ease-out forwards",
                                }}
                              >
                                <div className="py-1">
                                  {invitation.status === "PENDING" && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleResendInvitation(invitation.id);
                                          setOpenDropdown(null);
                                          setDropdownPosition(null);
                                        }}
                                        className="flex items-center px-4 py-2 w-full text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                      >
                                        <Send className="mr-3 w-4 h-4 text-blue-500" />
                                        Resend
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleCancelInvitation(invitation.id);
                                          setOpenDropdown(null);
                                          setDropdownPosition(null);
                                        }}
                                        className="flex items-center px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                                      >
                                        <X className="mr-3 w-4 h-4 text-red-500" />
                                        Cancel
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Invite User Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setError("");
          setSuccess("");
        }}
      >
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Invite User
            </h3>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-700">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                {success}
              </span>
            </div>
          )}

          <form onSubmit={handleInviteSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Email Address" required>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={e =>
                    setInviteForm({ ...inviteForm, email: e.target.value })
                  }
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  placeholder="Enter email address"
                  required
                />
              </FormField>

              <FormField label="Name (Optional)">
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e =>
                    setInviteForm({ ...inviteForm, name: e.target.value })
                  }
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </FormField>

              <FormField label="Invitation Type" required>
                <select
                  value={inviteForm.invitationType}
                  onChange={e => {
                    const newType = e.target.value;
                    setInviteForm({
                      ...inviteForm,
                      invitationType: newType,
                      // Reset workspace-specific fields when changing type
                      workspaceId:
                        newType === "WORKSPACE_SPECIFIC"
                          ? inviteForm.workspaceId
                          : "",
                      workspaceInvitations:
                        newType === "MULTIPLE_WORKSPACES"
                          ? inviteForm.workspaceInvitations
                          : [],
                    });
                    setShowWorkspaceSelection(false);
                    setWorkspaceSearchTerm("");
                  }}
                  className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                >
                  <option value="WORKSPACE_SPECIFIC">Workspace-specific</option>
                  <option value="ORGANIZATION_WIDE">Organization-wide</option>
                  <option value="MULTIPLE_WORKSPACES">
                    Multiple workspaces
                  </option>
                </select>
              </FormField>

              {inviteForm.invitationType === "ORGANIZATION_WIDE" ? (
                <FormField label="Organization Role" required>
                  <select
                    value={inviteForm.organizationRole}
                    onChange={e =>
                      setInviteForm({
                        ...inviteForm,
                        organizationRole: e.target.value,
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </FormField>
              ) : inviteForm.invitationType === "WORKSPACE_SPECIFIC" ? (
                <FormField label="Workspace Role" required>
                  <select
                    value={inviteForm.workspaceRole}
                    onChange={e =>
                      setInviteForm({
                        ...inviteForm,
                        workspaceRole: e.target.value,
                      })
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </FormField>
              ) : (
                <FormField label="Multiple Workspaces" required>
                  <div className="relative workspace-dropdown">
                    {/* Custom Dropdown Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setShowWorkspaceSelection(!showWorkspaceSelection)
                      }
                      className="flex justify-between items-center px-3 w-full h-10 text-left bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <span className="text-sm text-gray-700 truncate">
                        {inviteForm.workspaceInvitations.length > 0
                          ? `${inviteForm.workspaceInvitations.length} workspace${inviteForm.workspaceInvitations.length !== 1 ? "s" : ""} selected`
                          : "Select workspaces..."}
                      </span>
                      <div className="flex items-center space-x-2">
                        {inviteForm.workspaceInvitations.length > 0 && (
                          <span className="inline-flex justify-center items-center w-6 h-6 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                            {inviteForm.workspaceInvitations.length}
                          </span>
                        )}
                        <svg
                          className={`w-4 h-4 text-gray-400 transition-transform ${showWorkspaceSelection ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {/* Dropdown Content */}
                    {showWorkspaceSelection && (
                      <div className="absolute right-0 left-0 bottom-full z-10 mb-2 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="Search workspaces..."
                              value={workspaceSearchTerm}
                              onChange={e =>
                                setWorkspaceSearchTerm(e.target.value)
                              }
                              className="px-3 py-2 pl-8 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                              className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Workspace List */}
                        <div className="overflow-y-auto max-h-56">
                          {filteredWorkspaces.length > 0 ? (
                            filteredWorkspaces.map(workspace => (
                              <div
                                key={workspace.id}
                                className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:bg-gray-700 transition-colors ${
                                  isWorkspaceSelected(workspace.id)
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <div className="flex flex-1 items-center space-x-3">
                                  <input
                                    type="checkbox"
                                    checked={isWorkspaceSelected(workspace.id)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        handleWorkspaceSelection(
                                          workspace.id,
                                          "MEMBER"
                                        );
                                      } else {
                                        removeWorkspaceFromSelection(
                                          workspace.id
                                        );
                                      }
                                    }}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {workspace.name}
                                    </div>
                                    {workspace.description && (
                                      <div className="text-xs text-gray-500 truncate">
                                        {workspace.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isWorkspaceSelected(workspace.id) && (
                                  <select
                                    value={getSelectedWorkspaceRole(
                                      workspace.id
                                    )}
                                    onChange={e =>
                                      handleWorkspaceSelection(
                                        workspace.id,
                                        e.target.value
                                      )
                                    }
                                    className="px-2 py-1 ml-2 text-xs bg-white dark:bg-gray-700 dark:text-gray-300 rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <option value="OWNER">Owner</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="MEMBER">Member</option>
                                    <option value="GUEST">Guest</option>
                                  </select>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                              {workspaceSearchTerm
                                ? "No workspaces found"
                                : "No workspaces available"}
                            </div>
                          )}
                        </div>

                        {/* Selected Workspaces Summary */}
                        {inviteForm.workspaceInvitations.length > 0 && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                Selected (
                                {inviteForm.workspaceInvitations.length})
                              </div>
                              <button
                                type="button"
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={clearAllWorkspaceSelections}
                              >
                                Clear all
                              </button>
                            </div>
                            <div className="space-y-1">
                              {inviteForm.workspaceInvitations
                                .slice(0, 4)
                                .map(wsInvitation => {
                                  const workspace = availableWorkspaces.find(
                                    w => w.id === wsInvitation.workspaceId
                                  );
                                  return (
                                    <div
                                      key={wsInvitation.workspaceId}
                                      className="flex justify-between items-center text-xs"
                                    >
                                      <span className="text-gray-700 truncate">
                                        {workspace?.name || "Unknown"}
                                      </span>
                                      <div className="flex items-center space-x-1">
                                        <select
                                          value={wsInvitation.role}
                                          onChange={e =>
                                            handleWorkspaceSelection(
                                              wsInvitation.workspaceId,
                                              e.target.value
                                            )
                                          }
                                          className="px-1.5 py-0.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                          <option value="OWNER">Owner</option>
                                          <option value="ADMIN">Admin</option>
                                          <option value="MANAGER">
                                            Manager
                                          </option>
                                          <option value="MEMBER">Member</option>
                                          <option value="GUEST">Guest</option>
                                        </select>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeWorkspaceFromSelection(
                                              wsInvitation.workspaceId
                                            )
                                          }
                                          className="ml-1 text-red-500 hover:text-red-700"
                                          aria-label="Remove workspace"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              {inviteForm.workspaceInvitations.length > 4 && (
                                <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                  +{inviteForm.workspaceInvitations.length - 4}{" "}
                                  more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
              )}
            </div>

            <div className="flex justify-end pt-4 space-x-3">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
          setError("");
          setSuccess("");
        }}
      >
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Member
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Update member information and permissions
            </p>
          </div>

          {error && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-700">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-600 dark:text-red-400">
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-700">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                {success}
              </span>
            </div>
          )}

          {editingMember && (
            <form
              onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateMember({
                  role: formData.get("role") as string,
                  isActive: formData.get("status") === "active",
                });
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Name">
                  <input
                    type="text"
                    defaultValue={editingMember.name}
                    className="px-3 py-2 w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </FormField>

                <FormField label="Email">
                  <input
                    type="email"
                    defaultValue={editingMember.email}
                    className="px-3 py-2 w-full bg-gray-50 dark:bg-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  />
                </FormField>

                <FormField label="Role" required>
                  <select
                    name="role"
                    defaultValue={editingMember.role}
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OWNER">Owner</option>
                  </select>
                </FormField>

                <FormField label="Status" required>
                  <select
                    name="status"
                    defaultValue={
                      editingMember.isActive ? "active" : "inactive"
                    }
                    className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </FormField>
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMember(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="mr-2 w-4 h-4" />
                  {loading ? "Updating..." : "Update Member"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Deactivate Member Modal */}
      <Modal
        open={showDeactivateModal}
        onClose={() => {
          setShowDeactivateModal(false);
          setMemberToDeactivate(null);
        }}
      >
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {memberToDeactivate?.isActive ? "Deactivate" : "Activate"} Member
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {memberToDeactivate?.isActive
                ? `Are you sure you want to deactivate ${memberToDeactivate?.name} in this organization? They will no longer be able to access this organization but can still access other organizations where they are active.`
                : `Are you sure you want to activate ${memberToDeactivate?.name} in this organization? They will regain access to this organization.`}
            </p>
            <div className="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> This is an organization-level
                deactivation. The user can still access other organizations
                where they are active.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowDeactivateModal(false);
                setMemberToDeactivate(null);
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeactivateMember}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                memberToDeactivate?.isActive
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {memberToDeactivate?.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>
      </Modal>
    </SectionCard>
  );
}

function LeadSettings() {
  return (
    <SectionCard title="Lead Management">
      <form className="space-y-8">
        <FormField label="Custom Lead Statuses">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add new status"
              />
              <button className="px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600">
                Add Status
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                Interested
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                Engaged
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                Agency
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                Startup
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-full">
                Scale Up
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                None
              </span>
            </div>
          </div>
        </FormField>

        <FormField label="Custom Lead Fields">
          <div className="space-y-4">
            <div className="flex space-x-4">
              <input
                type="text"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add new field"
              />
              <button className="px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600">
                Add Field
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                Company Size
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                Budget Range
              </span>
              <span className="px-3 py-1 text-sm font-medium text-gray-800 bg-gray-100 rounded-full">
                Decision Maker
              </span>
            </div>
          </div>
        </FormField>

        <FormRow>
          <FormField label="Lead Assignment Rules">
            <select className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Manual</option>
              <option>Round Robin</option>
              <option>Auto-assign by owner</option>
            </select>
          </FormField>
          <FormField label="Lead Scoring Configuration">
            <input
              type="text"
              className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
              placeholder="e.g. +10 for email, +20 for call"
            />
          </FormField>
        </FormRow>

        <div className="flex pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className="flex items-center px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            <Save className="mr-2 w-4 h-4" />
            Save Changes
          </button>
          <button
            type="button"
            className="flex items-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
          >
            <X className="mr-2 w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function NotificationSettings() {
  return (
    <SectionCard title="Notification Settings">
      <form className="space-y-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Email Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  defaultChecked
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Lead assigned to me
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  defaultChecked
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Activity on my leads
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Daily summary
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Weekly reports
                </span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              In-app Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  defaultChecked
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  New lead added
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  defaultChecked
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Task assigned
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  Weekly summary
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  System updates
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className="flex items-center px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            <Save className="mr-2 w-4 h-4" />
            Save Changes
          </button>
          <button
            type="button"
            className="flex items-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
          >
            <X className="mr-2 w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function IntegrationSettings() {
  return (
    <SectionCard title="Integrations">
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center w-12 h-12 bg-blue-100 rounded-lg">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Gmail
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Connect your Gmail account for email tracking
                </p>
              </div>
            </div>
            <button className="px-3 py-2 font-semibold text-green-700 bg-green-100 rounded-lg transition-colors hover:bg-green-200">
              Connected
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center w-12 h-12 bg-purple-100 rounded-lg">
                <Link className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Zapier
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automate workflows with Zapier integrations
                </p>
              </div>
            </div>
            <button className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
              Connect
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center w-12 h-12 bg-orange-100 rounded-lg">
                <Key className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  API Key
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Generate API keys for external integrations
                </p>
              </div>
            </div>
            <button className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
              Generate
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex justify-center items-center w-12 h-12 bg-green-100 rounded-lg">
                <Link className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Webhooks
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure webhooks for real-time updates
                </p>
              </div>
            </div>
            <button className="px-3 py-2 font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
              Configure
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function PrivacySettings() {
  return (
    <SectionCard title="Data & Privacy">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <button className="flex justify-center items-center px-6 py-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border-2 border-blue-200 dark:border-blue-700 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/40">
            <Download className="mr-3 w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-blue-700 dark:text-blue-400">
              Export Data
            </span>
          </button>
          <button className="flex justify-center items-center px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
            <Upload className="mr-3 w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Import Data
            </span>
          </button>
        </div>

        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-400">
                Privacy & Compliance
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Manage your data privacy settings and compliance requirements
              </p>
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    id="gdpr"
                  />
                  <span className="ml-3 text-sm text-yellow-800">
                    Enable GDPR/CCPA compliance
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
          <div className="flex items-start">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-400">
                Danger Zone
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                Permanently delete your account and all associated data
              </p>
              <button className="px-3 py-2 mt-4 font-semibold text-white bg-red-600 rounded-lg transition-colors hover:bg-red-700">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function AppearanceSettings() {
  return (
    <SectionCard title="Appearance">
      <form className="space-y-8">
        <FormField label="Theme">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input
                type="radio"
                name="theme"
                className="mr-3"
                defaultChecked
              />
              <div className="flex items-center">
                <Sun className="mr-2 w-5 h-5 text-yellow-500" />
                <span className="font-medium">Light</span>
              </div>
            </label>
            <label className="flex items-center p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <input type="radio" name="theme" className="mr-3" />
              <span className="font-medium">System</span>
            </label>
          </div>
        </FormField>

        <FormRow>
          <FormField label="Primary Color">
            <div className="flex items-center space-x-4">
              <input
                type="color"
                className="p-0 w-12 h-8 bg-transparent border-0 cursor-pointer"
                defaultValue="#3B82F6"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Choose your primary brand color
              </span>
            </div>
          </FormField>
          <FormField label="Font Size">
            <select
              defaultValue="Medium"
              className="px-3 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-transparent"
            >
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </FormField>
        </FormRow>

        <div className="flex pt-6 space-x-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="submit"
            className="flex items-center px-6 py-3 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            <Save className="mr-2 w-4 h-4" />
            Save Changes
          </button>
          <button
            type="button"
            className="flex items-center px-6 py-3 font-semibold text-gray-700 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200"
          >
            <X className="mr-2 w-4 h-4" />
            Cancel
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

function BillingSettings() {
  return (
    <SectionCard title="Billing & Subscription">
      <div className="space-y-8">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-4">
            <CreditCard className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Current Plan: <span className="text-blue-600">Pro</span>
              </h3>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Usage: 5/10 users • Next billing: August 1, 2024
              </p>
            </div>
            <button className="px-6 py-2 ml-auto font-semibold text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700">
              Upgrade Plan
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Payment Method
          </h3>
          <div className="flex items-center space-x-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg"
              alt="Visa"
              className="object-contain w-12 h-8"
            />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Visa ending in 1234
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Expires 12/25
              </p>
            </div>
            <button className="ml-auto font-medium text-blue-600 hover:text-blue-700">
              Change
            </button>
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Invoice History
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  July 2024
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pro Plan - $99.00
                </p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700">
                <FileText className="mr-1 w-4 h-4" />
                Download
              </button>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  June 2024
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pro Plan - $99.00
                </p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700">
                <FileText className="mr-1 w-4 h-4" />
                Download
              </button>
            </div>
            <div className="flex justify-between items-center py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  May 2024
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pro Plan - $99.00
                </p>
              </div>
              <button className="flex items-center text-blue-600 hover:text-blue-700">
                <FileText className="mr-1 w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// Tag interfaces
interface Tag {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

interface TagWithCounts extends Tag {
  contactCount: number;
  companyCount: number;
  dealCount: number;
}

// Tag Management Component
function TagSettings() {
  const { selectedWorkspace } = useWorkspace();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Tag | "usage">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState("");

  // Form states
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [assignForm, setAssignForm] = useState({
    tagId: "",
    entityId: "",
    entityType: "contact" as "contact" | "company" | "deal",
  });

  // Entity data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [entitySearchTerm, setEntitySearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle clicking outside to close dropdowns and scroll events
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    const handleScroll = () => {
      if (openDropdown) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openDropdown]);

  // Function to handle dropdown positioning
  const handleDropdownClick = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right - window.scrollX,
      });
      setOpenDropdown(id);
    }
  };

  // Load tags using tagService
  const loadTags = async () => {
    const token = authService.getAccessToken();
    if (!token || !selectedWorkspace?.id || !selectedWorkspace?.organizationId)
      return;

    try {
      setLoading(true);
      const response = await tagService.getAllTags(
        selectedWorkspace.id,
        selectedWorkspace.organizationId,
        token
      );

      if (response.success && response.data) {
        setTags(response.data);
      } else {
        setError(response.error || "Failed to load tags");
      }
    } catch (err) {
      setError("Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  // Load entities based on type
  const loadEntities = async (entityType: "contact" | "company" | "deal") => {
    const token = authService.getAccessToken();
    if (
      !token ||
      !selectedWorkspace?.id ||
      !selectedWorkspace?.organizationId
    ) {
      return;
    }

    try {
      setLoadingEntities(true);

      switch (entityType) {
        case "contact": {
          const contactsResponse = await tagService.loadContacts(
            selectedWorkspace.id,
            selectedWorkspace.organizationId,
            token
          );

          if (contactsResponse.success) {
            setContacts(contactsResponse.data || []);
          } else {
            setError(contactsResponse.error || "Failed to load contacts");
          }
          break;
        }

        case "company": {
          const companiesResponse = await tagService.loadCompanies(
            selectedWorkspace.id,
            selectedWorkspace.organizationId,
            token
          );

          if (companiesResponse.success) {
            setCompanies(companiesResponse.data || []);
          } else {
            setError(companiesResponse.error || "Failed to load companies");
          }
          break;
        }

        case "deal": {
          const dealsResponse = await dealService.getDeals(
            selectedWorkspace.id,
            selectedWorkspace.organizationId,
            token
          );

          if (dealsResponse.success) {
            setDeals(dealsResponse.data || []);
          } else {
            setError(dealsResponse.error || "Failed to load deals");
          }
          break;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to load ${entityType}s: ${errorMessage}`);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Create or update tag
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authService.getAccessToken();
    if (!token || !selectedWorkspace?.id || !selectedWorkspace?.organizationId)
      return;

    try {
      let response;

      if (selectedTag) {
        // Update existing tag
        response = await tagService.updateTag(
          selectedTag.id,
          {
            name: createForm.name,
            description: createForm.description,
          },
          selectedWorkspace.id,
          selectedWorkspace.organizationId,
          token
        );
      } else {
        // Create new tag
        response = await tagService.createTag(
          {
            name: createForm.name,
            description: createForm.description,
            workspaceId: selectedWorkspace.id,
            organizationId: selectedWorkspace.organizationId,
          },
          token
        );
      }

      if (response.success) {
        setCreateForm({ name: "", description: "" });
        setSelectedTag(null);
        setShowCreateModal(false);
        setSuccess(`Tag ${selectedTag ? "updated" : "created"} successfully`);
        await loadTags();
      } else {
        setError(
          response.error || `Failed to ${selectedTag ? "update" : "create"} tag`
        );
      }
    } catch (err) {
      setError(`Failed to ${selectedTag ? "update" : "create"} tag`);
    }
  };

  // Delete tag
  const handleDeleteTag = async (tagId: string) => {
    setTagToDelete(tagId);
    setShowDeleteConfirmModal(true);
  };

  // Confirm delete tag
  const confirmDeleteTag = async () => {
    if (!tagToDelete) return;

    const token = authService.getAccessToken();
    if (!token || !selectedWorkspace?.id || !selectedWorkspace?.organizationId)
      return;

    try {
      const response = await tagService.deleteTag(
        tagToDelete,
        selectedWorkspace.id,
        selectedWorkspace.organizationId,
        token
      );

      if (response.success) {
        setSuccess("Tag deleted successfully");
        await loadTags();
      } else {
        setError(response.error || "Failed to delete tag");
      }
    } catch (err) {
      setError("Failed to delete tag");
    } finally {
      setTagToDelete(null);
      setShowDeleteConfirmModal(false);
    }
  };

  // Assign tag
  const handleAssignTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = authService.getAccessToken();
    if (!token || !selectedWorkspace?.id || !selectedWorkspace?.organizationId)
      return;

    try {
      const response = await tagService.assignTag(
        {
          tagId: assignForm.tagId,
          entityId: assignForm.entityId,
          entityType: assignForm.entityType,
          workspaceId: selectedWorkspace.id,
          organizationId: selectedWorkspace.organizationId,
        },
        token
      );

      if (response.success) {
        setAssignForm({ tagId: "", entityId: "", entityType: "contact" });
        setShowAssignModal(false);
        setSuccess("Tag assigned successfully");
        await loadTags(); // Reload to update usage counts
      } else {
        setError(response.error || "Failed to assign tag");
      }
    } catch (err) {
      setError("Failed to assign tag");
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (selectedWorkspace) {
      loadTags();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspace]);

  // Load entities when assign modal opens
  useEffect(() => {
    if (showAssignModal && assignForm.entityType) {
      loadEntities(assignForm.entityType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAssignModal, assignForm.entityType]);

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tags;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        tag =>
          tag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tag.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortField === "usage") {
        const aUsage =
          ((a as TagWithCounts).contactCount || 0) +
          ((a as TagWithCounts).companyCount || 0) +
          ((a as TagWithCounts).dealCount || 0);
        const bUsage =
          ((b as TagWithCounts).contactCount || 0) +
          ((b as TagWithCounts).companyCount || 0) +
          ((b as TagWithCounts).dealCount || 0);

        if (sortDirection === "asc") {
          return aUsage - bUsage;
        } else {
          return bUsage - aUsage;
        }
      } else {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue && bValue) {
          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        }
      }
      return 0;
    });

    return filtered;
  }, [tags, searchTerm, sortField, sortDirection]);

  // Filter entities based on search term
  const filteredEntities = useMemo(() => {
    const searchLower = entitySearchTerm.toLowerCase();

    switch (assignForm.entityType) {
      case "contact":
        return contacts.filter(
          contact =>
            contact.name.toLowerCase().includes(searchLower) ||
            contact.email?.toLowerCase().includes(searchLower)
        );
      case "company":
        return companies.filter(
          company =>
            company.name.toLowerCase().includes(searchLower) ||
            company.industry?.toLowerCase().includes(searchLower)
        );
      case "deal":
        return deals.filter(
          deal =>
            deal.title.toLowerCase().includes(searchLower) ||
            deal.stage?.toLowerCase().includes(searchLower)
        );
      default:
        return [];
    }
  }, [contacts, companies, deals, assignForm.entityType, entitySearchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTags.length / pageSize);
  const paginatedTags = filteredAndSortedTags.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle sort
  const handleSort = (field: keyof Tag | "usage") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedTags.length === paginatedTags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(paginatedTags.map(tag => tag.id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    const token = authService.getAccessToken();
    if (!token || !selectedWorkspace?.id || !selectedWorkspace?.organizationId)
      return;

    try {
      const response = await tagService.bulkDeleteTags(
        selectedTags,
        selectedWorkspace.id,
        selectedWorkspace.organizationId,
        token
      );

      if (response.success) {
        setSelectedTags([]);
        setSuccess(`${selectedTags.length} tags deleted successfully`);
        await loadTags();
      } else {
        setError(response.error || "Failed to delete tags");
      }
    } catch (err) {
      setError("Failed to delete tags");
    } finally {
      setShowBulkDeleteModal(false);
    }
  };

  // Get entity display name
  const getEntityDisplayName = (
    entity: Contact | Company | Deal,
    type: string
  ) => {
    switch (type) {
      case "contact": {
        const contact = entity as Contact;
        return `${contact.name}${contact.email ? ` (${contact.email})` : ""}`;
      }
      case "company": {
        const company = entity as Company;
        return `${company.name}${company.industry ? ` (${company.industry})` : ""}`;
      }
      case "deal": {
        const deal = entity as Deal;
        return `${deal.title}${deal.value ? ` ($${deal.value.toLocaleString()})` : ""}`;
      }
      default:
        return "Unknown";
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto mb-4 w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading tags...</p>
        </div>
      </div>
    );
  }

  return (
    <SectionCard title="Tag Management">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage your tags and their assignments
            </h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Create, edit, and assign tags to contacts, companies, and deals
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-3 py-2 font-semibold text-white bg-gray-900 dark:bg-gray-700 rounded-lg transition-colors hover:bg-gray-800 dark:hover:bg-gray-600"
          >
            <Plus className="mr-2 w-4 h-4" /> Create Tag
          </button>
        </div>

        {/* Success/Error Display */}
        {success && (
          <div className="px-6 py-4 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-700">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <div className="pl-3 ml-auto">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-4 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700">
            <div className="flex items-center">
              <AlertCircle className="mr-2 w-5 h-5 text-red-500" />
              <span className="text-red-700 dark:text-red-400">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Tags Table */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              All Tags ({tags.length})
            </h4>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search tags..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="py-1 pr-3 pl-8 w-48 text-xs rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-gray-400 focus:border-gray-500 dark:focus:border-gray-400"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </button>
                )}
              </div>
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete Selected ({selectedTags.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-700 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800"
                      checked={
                        selectedTags.length === paginatedTags.length &&
                        paginatedTags.length > 0
                      }
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    <div className="flex items-center space-x-1">
                      <span>Tag Details</span>
                      <button
                        onClick={() => handleSort("name")}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                  <th className="px-1 py-3 text-xs font-semibold tracking-wider text-left text-gray-600 dark:text-gray-400 uppercase">
                    Usage & Stats
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wider text-right text-gray-600 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      Loading tags...
                    </td>
                  </tr>
                ) : paginatedTags.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500 dark:text-gray-400"
                    >
                      No tags found
                    </td>
                  </tr>
                ) : (
                  paginatedTags.map(tag => (
                    <tr
                      key={tag.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-700 focus:ring-gray-500 dark:focus:ring-gray-400 bg-white dark:bg-gray-800"
                          checked={selectedTags.includes(tag.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTags(prev => [...prev, tag.id]);
                            } else {
                              setSelectedTags(prev =>
                                prev.filter(id => id !== tag.id)
                              );
                            }
                          }}
                        />
                      </td>
                      <td className="py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="flex justify-center items-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {tag.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 ml-3 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {tag.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {tag.description || "No description"}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Created{" "}
                              {new Date(tag.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-1 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {((tag as TagWithCounts).contactCount || 0) +
                                ((tag as TagWithCounts).companyCount || 0) +
                                ((tag as TagWithCounts).dealCount || 0)}{" "}
                              total
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              ({(tag as TagWithCounts).contactCount || 0}c,{" "}
                              {(tag as TagWithCounts).companyCount || 0}cp,{" "}
                              {(tag as TagWithCounts).dealCount || 0}d)
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                        <div className="relative dropdown-container">
                          <button
                            onClick={e => handleDropdownClick(tag.id, e)}
                            className="p-2 text-gray-400 dark:text-gray-500 rounded-full transition-colors hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openDropdown === tag.id && dropdownPosition && (
                            <div
                              className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-lg"
                              style={{
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                opacity: 0,
                                transform: "translateY(-10px) scale(0.95)",
                                animation:
                                  "dropdownAppear 0.2s ease-out forwards",
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    setSelectedTag(tag);
                                    setCreateForm({
                                      name: tag.name,
                                      description: tag.description || "",
                                    });
                                    setShowCreateModal(true);
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Edit className="mr-3 w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  Edit Tag
                                </button>
                                <button
                                  onClick={() => {
                                    setAssignForm({
                                      tagId: tag.id,
                                      entityId: "",
                                      entityType: "contact",
                                    });
                                    setShowAssignModal(true);
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="flex items-center px-4 py-2 w-full text-sm text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                  <Tag className="mr-3 w-4 h-4 text-gray-500 dark:text-gray-400" />
                                  Assign Tag
                                </button>
                                <button
                                  onClick={() => {
                                    handleDeleteTag(tag.id);
                                    setOpenDropdown(null);
                                    setDropdownPosition(null);
                                  }}
                                  className="flex items-center px-4 py-2 w-full text-sm text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="mr-3 w-4 h-4 text-red-500 dark:text-red-400" />
                                  Delete Tag
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage(prev => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronsRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Create/Edit Tag Modal */}
        {showCreateModal && (
          <Modal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
          >
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                {selectedTag ? "Edit Tag" : "Create New Tag"}
              </h3>
              <form onSubmit={handleCreateTag} className="space-y-4">
                <FormField label="Name" required>
                  <input
                    type="text"
                    name="name"
                    value={createForm.name}
                    onChange={e =>
                      setCreateForm(prev => ({ ...prev, name: e.target.value }))
                    }
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    placeholder="Enter tag name"
                    required
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    name="description"
                    value={createForm.description}
                    onChange={e =>
                      setCreateForm(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    placeholder="Enter tag description"
                    rows={3}
                  />
                </FormField>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
                  >
                    {selectedTag ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Assign Tag Modal */}
        {showAssignModal && (
          <Modal
            open={showAssignModal}
            onClose={() => setShowAssignModal(false)}
          >
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Assign Tag
              </h3>
              <form onSubmit={handleAssignTag} className="space-y-4">
                <FormField label="Tag" required>
                  <select
                    value={assignForm.tagId}
                    onChange={e =>
                      setAssignForm(prev => ({
                        ...prev,
                        tagId: e.target.value,
                      }))
                    }
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    required
                  >
                    <option value="">Select a tag</option>
                    {tags.map(tag => (
                      <option key={tag.id} value={tag.id}>
                        {tag.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Entity Type" required>
                  <select
                    value={assignForm.entityType}
                    onChange={e => {
                      const newType = e.target.value as
                        | "contact"
                        | "company"
                        | "deal";
                      setAssignForm(prev => ({
                        ...prev,
                        entityType: newType,
                        entityId: "", // Reset entity selection when type changes
                      }));
                    }}
                    className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    required
                  >
                    <option value="contact">Contact</option>
                    <option value="company">Company</option>
                    <option value="deal">Deal</option>
                  </select>
                </FormField>

                <FormField label={`Select ${assignForm.entityType}`} required>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder={`Search ${assignForm.entityType}s...`}
                        value={entitySearchTerm}
                        onChange={e => setEntitySearchTerm(e.target.value)}
                        className="py-2 pr-3 pl-8 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {loadingEntities ? (
                      <div className="flex justify-center py-4">
                        <div className="w-6 h-6 rounded-full border-b-2 border-blue-600 animate-spin"></div>
                      </div>
                    ) : (
                      <div className="overflow-y-auto max-h-48 rounded-md border border-gray-200 dark:border-gray-700">
                        {filteredEntities.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            No {assignForm.entityType}s found
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filteredEntities.map(entity => (
                              <button
                                key={entity.id}
                                type="button"
                                onClick={() => {
                                  setAssignForm(prev => ({
                                    ...prev,
                                    entityId: entity.id,
                                  }));
                                  setEntitySearchTerm("");
                                }}
                                className={`w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                  assignForm.entityId === entity.id
                                    ? "bg-gray-100 dark:bg-gray-700 border-l-4 border-gray-500 dark:border-gray-400"
                                    : ""
                                }`}
                              >
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {getEntityDisplayName(
                                    entity,
                                    assignForm.entityType
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {entity.id}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {assignForm.entityId && (
                      <div className="p-2 mt-2 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-700">
                        <div className="text-sm text-green-800 dark:text-green-400">
                          Selected:{" "}
                          {getEntityDisplayName(
                            [...contacts, ...companies, ...deals].find(
                              e => e.id === assignForm.entityId
                            )!,
                            assignForm.entityType
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </FormField>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!assignForm.tagId || !assignForm.entityId}
                    className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Tag
                  </button>
                </div>
              </form>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
          <Modal
            open={showDeleteConfirmModal}
            onClose={() => setShowDeleteConfirmModal(false)}
          >
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Delete Tag
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this tag? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirmModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTag}
                  className="px-4 py-2 text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Bulk Delete Modal */}
        {showBulkDeleteModal && (
          <Modal
            open={showBulkDeleteModal}
            onClose={() => setShowBulkDeleteModal(false)}
          >
            <div className="p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Delete Selected Tags
              </h3>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete {selectedTags.length} selected
                tags? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 text-white bg-red-600 dark:bg-red-700 rounded-md hover:bg-red-700 dark:hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </SectionCard>
  );
}

export default Settings;
