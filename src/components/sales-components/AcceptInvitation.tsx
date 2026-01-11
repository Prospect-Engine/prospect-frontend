"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import invitationService, {
  Invitation,
} from "@/services/sales-services/invitationService";
import { useAuth } from "@/hooks/sales-hooks/useAuth";

const AcceptInvitation: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [existingUserName, setExistingUserName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");

  const loadInvitation = useCallback(async () => {
    if (!token) return;

    try {
      const response = await invitationService.getInvitation(token);

      if (
        response.success &&
        response.data?.isValid &&
        response.data.invitation
      ) {
        setInvitation(response.data.invitation);
        setUserExists(response.data.userExists || false);
        setExistingUserName(response.data.existingUserName || "");
        setFormData(prev => ({
          ...prev,
          name: response.data?.userExists
            ? response.data?.existingUserName || ""
            : response.data?.invitation?.name || "",
        }));
      } else {
        setError(
          response.data?.message || response.error || "Invalid invitation"
        );
      }
    } catch (error) {
      setError("Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadInvitation();
    } else {
      setError("No invitation token provided");
      setLoading(false);
    }
  }, [token, loadInvitation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    // Different validation for existing vs new users
    if (!userExists) {
      // New user - require password and validation
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (formData.password.length < 8) {
        setError("Password must be at least 8 characters long");
        return;
      }

      if (!formData.name.trim()) {
        setError("Name is required");
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const acceptData: { token: string; password?: string; name?: string } = {
        token,
      };

      // Only include password and name for new users or if they want to update
      if (!userExists) {
        acceptData.password = formData.password;
        acceptData.name = formData.name;
      } else if (formData.name.trim() && formData.name !== existingUserName) {
        // Existing user wants to update name
        acceptData.name = formData.name;
      }

      const response = await invitationService.acceptInvitation(acceptData);

      // Auto-login the user
      if (
        response.success &&
        response.data &&
        (response.data.accessToken || response.data.access_token)
      ) {
        const accessToken = String(
          response.data.accessToken || response.data.access_token || ""
        );
        const refreshToken = String(
          response.data.refreshToken || response.data.refresh_token || ""
        );

        if (accessToken && refreshToken) {
          localStorage.setItem("crm_access_token", accessToken);
          localStorage.setItem("crm_refresh_token", refreshToken);
        }

        // Update auth context
        await login(accessToken);

        // Redirect to dashboard
        router.push("/sales");
      } else {
        setError(response.error || "Failed to create account");
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error ? error.message : "Failed to accept invitation"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="p-8 w-full max-w-md bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <XCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold text-gray-900">
              Invalid Invitation
            </h2>
            <p className="mb-6 text-gray-600">{error}</p>
            <button
              onClick={() => router.push("/auth")}
              className="px-4 py-2 w-full text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="flex justify-center items-center px-4 py-12 min-h-screen bg-gray-50">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Youre Invited!
          </h1>
          <p className="text-gray-600">
            {userExists
              ? "Join the team with your existing account"
              : "Complete your account setup to join the team"}
          </p>
        </div>

        {/* Account Setup Form */}
        {!invitation.isAccepted &&
          new Date(invitation.expiresAt) > new Date() && (
            <div className="p-8 bg-white rounded-xl shadow-lg">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">
                {userExists ? "Accept Invitation" : "Complete Your Account"}
              </h2>

              {userExists && (
                <div className="p-4 mb-6 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Welcome back!</strong> We found an existing account
                    with this email address. Click Accept Invitation to join the
                    new organization/workspace.
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {!userExists && (
                  <>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={formData.password}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              password: e.target.value,
                            })
                          }
                          className="px-4 py-3 pr-12 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Create a secure password"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 text-gray-400 transform -translate-y-1/2 hover:text-gray-600"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-700">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={e =>
                          setFormData({
                            ...formData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="px-4 py-3 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Confirm your password"
                      />
                    </div>
                  </>
                )}

                {userExists && (
                  <div className="py-8 text-center">
                    <div className="mb-4">
                      <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-500" />
                      <h3 className="mb-2 text-lg font-medium text-gray-900">
                        Ready to Join!
                      </h3>
                      <p className="text-gray-600">
                        <strong>{existingUserName}</strong>
                      </p>
                    </div>
                    <div className="p-4 text-left bg-gray-50 rounded-lg">
                      <h4 className="mb-2 font-medium text-gray-900">
                        Youll get access to:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Organization: {invitation.organizationName}</li>
                        {invitation.workspaceName && (
                          <li>
                            • Workspace: {invitation.workspaceName} (
                            {invitation.workspaceRole})
                          </li>
                        )}
                        {invitation.workspaceInvitations &&
                          invitation.workspaceInvitations.length > 0 && (
                            <>
                              {invitation.workspaceInvitations.map(
                                (ws, index) => (
                                  <li key={index}>
                                    • Workspace: {ws.workspaceName} ({ws.role})
                                  </li>
                                )
                              )}
                            </>
                          )}
                      </ul>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex justify-center items-center px-6 py-3 w-full font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="mr-2 w-5 h-5 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                      {userExists
                        ? "Accepting Invitation..."
                        : "Creating Account..."}
                    </>
                  ) : (
                    <>
                      {userExists ? "Accept Invitation" : "Complete Setup"}
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        {/* Expired or Accepted Message */}
        {(invitation.isAccepted ||
          new Date(invitation.expiresAt) < new Date()) && (
          <div className="p-8 text-center bg-white rounded-xl shadow-lg">
            {invitation.isAccepted ? (
              <>
                <CheckCircle className="mx-auto mb-4 w-16 h-16 text-green-500" />
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Invitation Already Accepted
                </h2>
                <p className="mb-6 text-gray-600">
                  This invitation has already been used to create an account.
                </p>
              </>
            ) : (
              <>
                <XCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  Invitation Expired
                </h2>
                <p className="mb-6 text-gray-600">
                  This invitation has expired. Please contact the administrator
                  for a new invitation.
                </p>
              </>
            )}
            <button
              onClick={() => router.push("/auth")}
              className="px-6 py-3 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitation;
