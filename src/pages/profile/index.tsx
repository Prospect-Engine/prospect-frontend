"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { cn } from "@/lib/utils";
import { apiCall } from "@/lib/apiCall";
import { useAuth } from "@/context/AuthContext";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Activity,
  Users,
  MessageSquare,
  ExternalLink,
  Settings,
  Globe,
  Linkedin,
  BarChart3,
  Target,
  RefreshCw,
  Plus,
} from "lucide-react";

// Types based on the API response
interface UserProfile {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  updatedAt: string;
}

interface IntegrationStatus {
  hasIntegration: boolean;
  integration: {
    id: string;
    type: string;
    email: string;
    fullName: string | null;
    connectionStatus: string;
    connectionMessage: string;
    requiredAction: string | null;
    profileUrl: string | null;
    proPicurl: string | null;
  } | null;
}

interface AnalyticsStats {
  totalConnections: number;
  totalMessages: number;
  totalLeads: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  createdAt: string;
}

interface Analytics {
  stats: AnalyticsStats;
  recentActivities: RecentActivity[];
}

interface ProfileData {
  profile: UserProfile;
  integrationStatus: IntegrationStatus;
  analytics: Analytics;
}

export default function ProfilePage() {
  // State management
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // API call - token is handled automatically by the API
        const response = await apiCall({
          url: "/api/profile/getProfile",
          method: "get",
          applyDefaultDomain: false,
        });

        if (response.status === 200) {
          setProfileData(response.data);
          setFormData({
            name: response.data.profile.name,
            email: response.data.profile.email,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
        } else {
          setError("Failed to load profile data");
        }
      } catch (err) {
        setError("An error occurred while loading your profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        ShowShortMessage("Please select a valid image file", "error");
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        ShowShortMessage("Image size must be less than 5MB", "error");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    try {
      setIsUploadingImage(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedImage);

      const response = await apiCall({
        url: "/api/profile/updateImg",
        method: "post",
        body: formData,
        applyDefaultDomain: false,
      });

      if (response.status === 200) {
        ShowShortMessage("Profile image updated successfully", "success");

        // Update local profile data with new image URL
        if (profileData) {
          setProfileData(prev =>
            prev
              ? {
                  ...prev,
                  profile: {
                    ...prev.profile,
                    imageUrl:
                      response.data.imageUrl || response.data.profile?.imageUrl,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : null
          );
        }

        // Clear image selection
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        ShowShortMessage(
          response.data?.message || "Failed to update profile image",
          "error"
        );
      }
    } catch (err) {
      ShowShortMessage("An error occurred while uploading your image", "error");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Cancel image selection
  const handleImageCancel = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Validate password strength
  const validatePassword = (password: string): boolean => {
    // Check for at least 1 uppercase letter
    const hasUpperCase = /[A-Z]/.test(password);
    // Check for at least 1 lowercase letter
    const hasLowerCase = /[a-z]/.test(password);
    // Check for at least 1 number or special character
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const hasNumberOrSpecial = hasNumber || hasSpecial;

    return hasUpperCase && hasLowerCase && hasNumberOrSpecial;
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      ShowShortMessage("Name is required", "error");
      return false;
    }
    if (!formData.email.trim()) {
      ShowShortMessage("Email is required", "error");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      ShowShortMessage("Please enter a valid email address", "error");
      return false;
    }
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        ShowShortMessage(
          "New password must be at least 8 characters long",
          "error"
        );
        return false;
      }
      if (!validatePassword(formData.newPassword)) {
        ShowShortMessage(
          "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character",
          "error"
        );
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        ShowShortMessage("New passwords do not match", "error");
        return false;
      }
    }
    return true;
  };

  // Save profile changes
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      // Check what has changed and call appropriate APIs
      const hasNameChanged =
        profileData && formData.name !== profileData.profile.name;
      const hasPasswordChanged =
        formData.newPassword && formData.newPassword.trim() !== "";
      // const hasEmailChanged = profileData && formData.email !== profileData.profile.email;

      const successMessages: string[] = [];
      let hasError = false;
      let hasSuccessfulUpdate = false;

      // Update name if changed
      if (hasNameChanged) {
        const nameResponse = await apiCall({
          url: "/api/profile/updateName",
          method: "post",
          body: { name: formData.name },
          applyDefaultDomain: false,
        });

        if (nameResponse.status >= 200 && nameResponse.status < 300) {
          successMessages.push("Name updated successfully");
          hasSuccessfulUpdate = true;
        } else {
          ShowShortMessage(
            nameResponse.data?.message || "Failed to update name",
            "error"
          );
          hasError = true;
        }
      }

      // Update password if changed
      if (hasPasswordChanged) {
        const passwordResponse = await apiCall({
          url: "/api/profile/updatePassword",
          method: "post",
          body: {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          },
          applyDefaultDomain: false,
        });

        if (passwordResponse.status >= 200 && passwordResponse.status < 300) {
          successMessages.push("Password updated successfully");
          hasSuccessfulUpdate = true;
        } else {
          // Handle field-specific validation errors
          if (passwordResponse.data?.field_errors) {
            const fieldErrors = passwordResponse.data.field_errors;
            const errorMessages = fieldErrors
              .map((error: any) => error.message)
              .join(", ");
            ShowShortMessage(errorMessages, "error");
          } else {
            ShowShortMessage(
              passwordResponse.data?.message || "Failed to update password",
              "error"
            );
          }
          hasError = true;
        }
      }

      // Update email if changed (using the general update endpoint)
      // if (hasEmailChanged) {
      // const emailResponse = await apiCall({
      //   url: "/api/profile/update",
      //   method: "post",
      //   body: { email: formData.email },
      //   applyDefaultDomain: true,
      // });

      // if (emailResponse.status === 200) {
      //   successMessages.push("Email updated successfully");
      // } else {
      //   ShowShortMessage(emailResponse.data?.message || "Failed to update email", "error");
      //   hasError = true;
      // }
      // }

      // If there was an error, don't close edit mode and return early
      if (hasError) {
        return;
      }

      // If no changes were made, close edit mode
      if (!hasNameChanged && !hasPasswordChanged) {
        ShowShortMessage("No changes to save", "info");
        setIsEditing(false);
        return;
      }

      // If we have successful updates, close edit mode and update state
      if (hasSuccessfulUpdate) {
        // Show success message
        if (successMessages.length > 0) {
          ShowShortMessage(successMessages.join(", "), "success");
        }

        // Close edit mode
        setIsEditing(false);

        // Update local profile data
        if (profileData) {
          setProfileData(prev =>
            prev
              ? {
                  ...prev,
                  profile: {
                    ...prev.profile,
                    name: formData.name,
                    email: formData.email,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : null
          );
        }

        // Clear password fields after successful update
        setFormData(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
    } catch (err) {
      ShowShortMessage(
        "An error occurred while updating your profile",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.profile.name,
        email: profileData.profile.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    setIsEditing(false);
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get activity type icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CONNECTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "UNKNOWN":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <AuthGuard>
        <AppLayout activePage="Settings">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1">
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl h-fit">
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </CardContent>
                </Card>
              </div>
              <div className="lg:col-span-3 space-y-6">
                <Skeleton className="h-64 w-full rounded-2xl" />
                <div className="grid gap-6 md:grid-cols-3">
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  // Error state
  if (error && !profileData) {
    return (
      <AuthGuard>
        <AppLayout activePage="Settings">
          <div className="space-y-6">
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error Loading Profile
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (!profileData) return null;

  // Sidebar menu items
  const sidebarItems = [
    {
      id: "profile",
      name: "Profile",
      icon: User,
      description: "Manage your personal information",
      active: activeTab === "profile",
    },
    {
      id: "analytics",
      name: "Analytics",
      icon: BarChart3,
      description: "View your activity and statistics",
      active: activeTab === "analytics",
    },
    {
      id: "integrations",
      name: "Integrations",
      icon: Settings,
      description: "Manage connected services",
      active: activeTab === "integrations",
    },
  ];

  return (
    <AuthGuard>
      <AppLayout activePage="Settings">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Profile Menu */}
            <div className="lg:col-span-1 lg:sticky lg:top-6 lg:self-start">
              <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl h-fit">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span>Profile Settings</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Manage your account and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {sidebarItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 cursor-pointer group",
                        item.active
                          ? "bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800"
                          : "hover:bg-muted/50 border border-transparent"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                          item.active
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                            : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10"
                        )}
                      >
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p
                          className={cn(
                            "font-medium text-sm",
                            item.active
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-foreground"
                          )}
                        >
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Profile Tab */}
              {activeTab === "profile" && (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Personal Information
                        </CardTitle>
                        <CardDescription>
                          Update your personal details and account settings.
                        </CardDescription>
                      </div>
                      {!isEditing && (
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profile Picture */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {imagePreview ? (
                            <img
                              src={imagePreview}
                              alt="Profile Preview"
                              className="h-20 w-20 rounded-full object-cover"
                            />
                          ) : profileData.profile.imageUrl ? (
                            <img
                              src={profileData.profile.imageUrl}
                              alt="Profile"
                              className="h-20 w-20 rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        {isEditing && (
                          <div className="absolute -bottom-1 -right-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageSelect}
                              className="hidden"
                              id="profile-image-upload"
                            />
                            <label
                              htmlFor="profile-image-upload"
                              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-1.5 cursor-pointer transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">
                          {profileData.profile.name}
                        </h3>
                        <p className="text-gray-600">
                          {profileData.profile.email}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last updated:{" "}
                          {formatDate(profileData.profile.updatedAt)}
                        </p>

                        {/* Image upload controls */}
                        {isEditing && selectedImage && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              onClick={handleImageUpload}
                              disabled={isUploadingImage}
                              className="flex items-center gap-1"
                            >
                              {isUploadingImage ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Save className="h-3 w-3" />
                              )}
                              {isUploadingImage ? "Uploading..." : "Upload"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleImageCancel}
                              disabled={isUploadingImage}
                              className="flex items-center gap-1"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Form Fields */}
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Name Field */}
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={e =>
                              handleInputChange("name", e.target.value)
                            }
                            disabled={!isEditing}
                            className="pl-10"
                            placeholder="Enter your full name"
                          />
                        </div>
                      </div>

                      {/* Email Field */}
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={e =>
                              handleInputChange("email", e.target.value)
                            }
                            disabled={true}
                            className="pl-10"
                            placeholder="Enter your email address"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Email cannot be changed
                        </p>
                      </div>
                    </div>

                    {/* Password Fields - Only show when editing */}
                    {isEditing && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold flex items-center gap-2">
                            <Lock className="h-5 w-5" />
                            Change Password
                          </h4>
                          <p className="text-sm text-gray-600">
                            Leave password fields empty to keep your current
                            password.
                          </p>

                          <div className="grid gap-4 md:grid-cols-2">
                            {/* Current Password */}
                            <div className="space-y-2">
                              <Label htmlFor="currentPassword">
                                Current Password
                              </Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                                <Input
                                  id="currentPassword"
                                  type={
                                    showPasswords.current ? "text" : "password"
                                  }
                                  value={formData.currentPassword}
                                  onChange={e =>
                                    handleInputChange(
                                      "currentPassword",
                                      e.target.value
                                    )
                                  }
                                  className="pl-10 pr-10"
                                  placeholder="Enter current password"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePasswordVisibility("current")
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords.current ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-2">
                              <Label htmlFor="newPassword">New Password</Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                                <Input
                                  id="newPassword"
                                  type={showPasswords.new ? "text" : "password"}
                                  value={formData.newPassword}
                                  onChange={e =>
                                    handleInputChange(
                                      "newPassword",
                                      e.target.value
                                    )
                                  }
                                  className="pl-10 pr-10"
                                  placeholder="Enter new password"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePasswordVisibility("new")
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords.new ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              {/* Password Requirements */}
                              {formData.newPassword && (
                                <div className="text-xs text-gray-600 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        formData.newPassword.length >= 8
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span>At least 8 characters</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        /[A-Z]/.test(formData.newPassword)
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span>1 uppercase letter</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        /[a-z]/.test(formData.newPassword)
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span>1 lowercase letter</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        /[0-9]/.test(formData.newPassword) ||
                                        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
                                          formData.newPassword
                                        )
                                          ? "bg-green-500"
                                          : "bg-gray-300"
                                      }`}
                                    />
                                    <span>1 number or special character</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="confirmPassword">
                                Confirm New Password
                              </Label>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
                                <Input
                                  id="confirmPassword"
                                  type={
                                    showPasswords.confirm ? "text" : "password"
                                  }
                                  value={formData.confirmPassword}
                                  onChange={e =>
                                    handleInputChange(
                                      "confirmPassword",
                                      e.target.value
                                    )
                                  }
                                  className="pl-10 pr-10"
                                  placeholder="Confirm new password"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    togglePasswordVisibility("confirm")
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showPasswords.confirm ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center gap-3 pt-4">
                        <Button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          {isSaving ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancel}
                          disabled={isSaving}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* Stats Overview */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Connections
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {profileData.analytics.stats.totalConnections.toLocaleString()}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Messages
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {profileData.analytics.stats.totalMessages.toLocaleString()}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Total Leads
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {profileData.analytics.stats.totalLeads.toLocaleString()}
                            </p>
                          </div>
                          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <Target className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activities */}
                  <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Recent Activities
                      </CardTitle>
                      <CardDescription>
                        Your latest activities and interactions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {profileData.analytics.recentActivities.length > 0 ? (
                          profileData.analytics.recentActivities.map(
                            activity => (
                              <div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                              >
                                {getActivityIcon(activity.type)}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {activity.description}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatDate(activity.createdAt)}
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {activity.type}
                                </Badge>
                              </div>
                            )
                          )
                        ) : (
                          <div className="text-center py-8">
                            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600">
                              No recent activities found.
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Integrations Tab */}
              {activeTab === "integrations" && (
                <Card className="bg-card/60 backdrop-blur-2xl border border-border/20 rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Connected Integrations
                    </CardTitle>
                    <CardDescription>
                      Manage your connected services and integrations.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profileData.integrationStatus.hasIntegration &&
                    profileData.integrationStatus.integration ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Linkedin className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {profileData.integrationStatus.integration.type}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {
                                  profileData.integrationStatus.integration
                                    .email
                                }
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    profileData.integrationStatus.integration
                                      .connectionStatus === "CONNECTED"
                                      ? "default"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {
                                    profileData.integrationStatus.integration
                                      .connectionStatus
                                  }
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {
                                    profileData.integrationStatus.integration
                                      .connectionMessage
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {profileData.integrationStatus.integration
                              .profileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    profileData.integrationStatus.integration!
                                      .profileUrl!,
                                    "_blank"
                                  )
                                }
                                className="flex items-center gap-2"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View Profile
                              </Button>
                            )}
                            <Button variant="outline" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          No Integrations Connected
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Connect your accounts to get started with
                          integrations.
                        </p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Connect Integration
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
