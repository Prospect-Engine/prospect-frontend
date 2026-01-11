/**
 * UNIVERSAL SETTINGS PAGE
 * =======================
 * Common settings shared across all Geniefy apps.
 * App-specific settings are under their respective feature areas.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import {
  User,
  Shield,
  Building2,
  Users,
  Palette,
  Bell,
  CreditCard,
  ChevronRight,
  Camera,
  Mail,
  Phone,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Check,
  Moon,
  Sun,
  Monitor,
  Loader2,
  ExternalLink,
} from "lucide-react";

// Settings navigation items
const settingsNav = [
  { id: "profile", label: "Profile", icon: User, description: "Personal information" },
  { id: "security", label: "Security", icon: Shield, description: "Password & authentication" },
  { id: "organization", label: "Organization", icon: Building2, description: "Company settings" },
  { id: "workspace", label: "Workspaces", icon: Users, description: "Team & workspace management" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme & display" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Notification preferences" },
  { id: "billing", label: "Billing", icon: CreditCard, description: "Plans & payments" },
];

// Timezone options
const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEDT)" },
];

export default function UniversalSettings() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { user, organizations } = useAuth();
  const { profile: userProfile, isLoading: profileLoading } = useUserProfile();

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    timezone: "UTC",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    campaignUpdates: true,
    weeklyDigest: true,
    securityAlerts: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        name: userProfile.name || "",
        email: userProfile.email || "",
        phone: (userProfile as any).phone || "",
        timezone: (userProfile as any).timezone || "UTC",
      });
    }
  }, [userProfile]);

  useEffect(() => {
    // Check for section in URL query
    const { section } = router.query;
    if (section && typeof section === "string") {
      setActiveSection(section);
    }
  }, [router.query]);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    router.push(`/settings?section=${sectionId}`, undefined, { shallow: true });
  };

  const getUserInitials = (name: string): string => {
    if (!name) return "U";
    const words = name.trim().split(" ");
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // TODO: Implement API call to save profile
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }
    setIsSaving(true);
    // TODO: Implement API call to change password
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setIsSaving(false);
  };

  const profileImage = userProfile?.avatar ?? (userProfile as any)?.imageUrl ?? null;
  const currentOrg = organizations.find((org) => org.id === user?.organization_id);

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Profile Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your personal information and preferences
              </p>
            </div>

            {/* Avatar Section */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
                      {profileImage && (
                        <AvatarImage src={profileImage} alt={userProfile?.name || "User"} />
                      )}
                      <AvatarFallback className="text-2xl font-medium text-white bg-gradient-to-br from-[#0071e3] to-[#00c7ff]">
                        {userProfile ? getUserInitials(userProfile.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {userProfile?.name || "User"}
                    </h3>
                    <p className="text-muted-foreground text-sm">{userProfile?.email}</p>
                    <Badge variant="secondary" className="mt-2 rounded-full">
                      {(userProfile as any)?.role || "Member"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Form */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="pl-10 rounded-xl"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="pl-10 rounded-xl"
                        placeholder="Enter your email"
                        disabled
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="pl-10 rounded-xl"
                        placeholder="Enter your phone"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Select
                        value={profileForm.timezone}
                        onValueChange={(value) => setProfileForm({ ...profileForm, timezone: value })}
                      >
                        <SelectTrigger className="pl-10 rounded-xl">
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="rounded-xl"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your password and security preferences
              </p>
            </div>

            {/* Change Password */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="pl-10 pr-10 rounded-xl"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        className="pl-10 rounded-xl"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        className="pl-10 rounded-xl"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleSavePassword}
                    disabled={isSaving || !passwordForm.currentPassword || !passwordForm.newPassword}
                    className="rounded-xl"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-xl">
                      <Shield className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">2FA is disabled</p>
                      <p className="text-sm text-muted-foreground">
                        Protect your account with two-factor authentication
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "organization":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Organization Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your organization details and settings
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Organization Details</CardTitle>
                <CardDescription>Your organization information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {currentOrg?.name || "Your Organization"}
                    </h3>
                    <p className="text-sm text-muted-foreground">Organization ID: {currentOrg?.id || "N/A"}</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      defaultValue={currentOrg?.name || ""}
                      className="rounded-xl"
                      placeholder="Enter organization name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgWebsite">Website</Label>
                    <Input
                      id="orgWebsite"
                      className="rounded-xl"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button className="rounded-xl">
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "workspace":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Workspace Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage workspaces and team members
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Your Workspaces</CardTitle>
                  <CardDescription>Manage your team workspaces</CardDescription>
                </div>
                <Button className="rounded-xl">
                  <Users className="w-4 h-4 mr-2" />
                  Create Workspace
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Default Workspace</p>
                        <p className="text-sm text-muted-foreground">5 members</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Team Members</CardTitle>
                <CardDescription>Invite and manage team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Enter email address"
                    className="rounded-xl flex-1"
                  />
                  <Button className="rounded-xl">Invite Member</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Appearance Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Customize how Geniefy looks for you
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Theme</CardTitle>
                <CardDescription>Select your preferred theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: "light", label: "Light", icon: Sun },
                    { id: "dark", label: "Dark", icon: Moon },
                    { id: "system", label: "System", icon: Monitor },
                  ].map((themeOption) => (
                    <button
                      key={themeOption.id}
                      onClick={() => setTheme(themeOption.id)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                        theme === themeOption.id
                          ? "border-primary bg-primary/5"
                          : "border-border/50 hover:border-border"
                      )}
                    >
                      <themeOption.icon className={cn(
                        "w-8 h-8",
                        theme === themeOption.id ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        theme === themeOption.id ? "text-primary" : "text-foreground"
                      )}>
                        {themeOption.label}
                      </span>
                      {theme === themeOption.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Notification Settings</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Choose how you want to be notified
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Email Notifications</CardTitle>
                <CardDescription>Manage your email notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { id: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email" },
                  { id: "campaignUpdates", label: "Campaign Updates", description: "Get notified about campaign progress" },
                  { id: "weeklyDigest", label: "Weekly Digest", description: "Receive a weekly summary of activities" },
                  { id: "securityAlerts", label: "Security Alerts", description: "Important security notifications" },
                ].map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Switch
                      checked={notificationSettings[setting.id as keyof typeof notificationSettings]}
                      onCheckedChange={(checked) =>
                        setNotificationSettings({ ...notificationSettings, [setting.id]: checked })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Push Notifications</CardTitle>
                <CardDescription>Browser and mobile push notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div>
                    <p className="font-medium text-foreground">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive real-time push notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({ ...notificationSettings, pushNotifications: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Billing & Plans</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Manage your subscription and billing information
              </p>
            </div>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg">Current Plan</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Pro Plan</h3>
                      <p className="text-sm text-muted-foreground">$49/month - Next billing: Jan 15, 2026</p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-xl">
                    Manage Plan
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                  <CardDescription>Your saved payment methods</CardDescription>
                </div>
                <Button variant="outline" className="rounded-xl">
                  Add Payment Method
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">**** **** **** 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/2027</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="rounded-full">Default</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Billing History</CardTitle>
                  <CardDescription>View your past invoices</CardDescription>
                </div>
                <Button variant="ghost" className="rounded-xl">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { date: "Dec 15, 2025", amount: "$49.00", status: "Paid" },
                    { date: "Nov 15, 2025", amount: "$49.00", status: "Paid" },
                    { date: "Oct 15, 2025", amount: "$49.00", status: "Paid" },
                  ].map((invoice, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                      <div>
                        <p className="font-medium text-foreground">{invoice.date}</p>
                        <p className="text-sm text-muted-foreground">{invoice.amount}</p>
                      </div>
                      <Badge variant="secondary" className="rounded-full bg-green-500/10 text-green-600">
                        {invoice.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Settings">
        <div className="flex gap-6 min-h-[calc(100vh-120px)]">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-2xl sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {settingsNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                        activeSection === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{item.label}</p>
                      </div>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {mounted && renderContent()}
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
