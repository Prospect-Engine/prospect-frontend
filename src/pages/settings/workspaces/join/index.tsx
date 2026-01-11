import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { parseJwt } from "@/lib/jwt";
import { getAppLogo } from "@/lib/logo";
import config from "@/configs/auth";
import toast from "react-hot-toast";

interface JoinTeamFormData {
  name: string;
  newPassword: string;
  confirmPassword: string;
}

export interface TokenInfo {
  email: string;
  memberId: string;
  userId?: string;
}

const JoinTeamPage = () => {
  const router = useRouter();
  const auth = useAuth();
  const { query } = router;
  const [token, setToken] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<{
    onBoarding: boolean;
    joining: boolean;
  }>({
    onBoarding: true,
    joining: false,
  });
  const [formData, setFormData] = useState<JoinTeamFormData>({
    name: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<JoinTeamFormData>>({});
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    if (!query.token) {
      router.replace(!auth.user ? "/auth" : "/sales");
      return;
    }

    const token = query.token.toString();
    setToken(token);

    setLoading(prev => ({ ...prev, onBoarding: true }));

    try {
      const data: TokenInfo = parseJwt(query.token as string);

      if (!data) {
        setError(
          "Invalid or expired invitation token. Please request a new invitation."
        );
        setLoading(prev => ({ ...prev, onBoarding: false }));
        return;
      }

      if (!!data?.userId) {
        // Auto-join if user already exists
        handleAutoJoin(token);
      }
      setLoading(prev => ({ ...prev, onBoarding: false }));
    } catch (error) {
      setError(
        "Invalid or expired invitation token. Please request a new invitation."
      );
      setLoading(prev => ({ ...prev, onBoarding: false }));
    }
  }, [router, query.token, auth.user]);

  const handleAutoJoin = async (token: string) => {
    try {
      const response = await fetch("/api/team/member/join-invitation", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          name: null,
          password: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Successfully joined the team!");
        toast.success("Successfully joined the team!");
        setTimeout(() => {
          router.push("/sales");
        }, 2000);
      } else {
        setError(
          "Failed to join team automatically. Please complete the form below."
        );
      }
    } catch (error) {
      setError(
        "Failed to join team automatically. Please complete the form below."
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<JoinTeamFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name as keyof JoinTeamFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }

    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!query.token) {
      router.push(config.login);
      return;
    }

    setLoading(prev => ({ ...prev, joining: true }));
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/team/member/join-invitation", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token,
          name: formData.name,
          password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Successfully joined the team! Redirecting...");
        toast.success("Successfully joined the team!");
        setTimeout(() => {
          router.push("/sales");
        }, 2000);
      } else {
        setError(data?.message || "Failed to join team. Please try again.");
        toast.error(data?.message || "Failed to join team. Please try again.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, joining: false }));
    }
  };

  if (loading.onBoarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
                  <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
                    <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900">
              Join Team
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your name and new password to complete the process.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700"
                >
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                  placeholder="Enter your name"
                  autoFocus
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* New Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className={`pr-10 ${errors.newPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pr-10 ${errors.confirmPassword ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading.joining || auth.isLoading}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading.joining || auth.isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Team"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

JoinTeamPage.getLayout = (page: ReactNode) => page;
JoinTeamPage.authGuard = false;
JoinTeamPage.billingGuard = false;

export default JoinTeamPage;
