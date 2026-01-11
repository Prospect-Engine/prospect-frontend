"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Mail, Lock, User } from "lucide-react";
import Link from "next/link";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  promo_code?: string;
  agreeToTerms: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    promo_code: "",
    agreeToTerms: false,
  });

  const handleInputChange = (
    field: keyof RegisterData,
    value: string | boolean
  ) => {
    setRegisterData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(""); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!registerData.name.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!registerData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerData.email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (registerData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!registerData.agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: registerData.name,
          email: registerData.email.toLowerCase().trim(),
          password: registerData.password,
          promo_code: registerData.promo_code || null,
          plan_code: "BASIC",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(
          `/register/verify-otp?email=${encodeURIComponent(registerData.email.toLowerCase().trim())}`
        );
      } else {
        setError(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/auth">
            <Button
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Sign In
            </Button>
          </Link>
        </div>

        {/* Registration Card */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-600">
              Join Sendout and start your journey
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={registerData.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={registerData.email}
                    onChange={e => handleInputChange("email", e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Promo Code (Optional) */}
              <div className="space-y-2">
                <Label
                  htmlFor="promo_code"
                  className="text-gray-700 font-medium"
                >
                  Promo Code <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="promo_code"
                  type="text"
                  placeholder="Enter promo code"
                  value={registerData.promo_code}
                  onChange={e =>
                    handleInputChange(
                      "promo_code",
                      e.target.value.trim().toUpperCase()
                    )
                  }
                  className="bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                  disabled={isLoading}
                  maxLength={50}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={registerData.password}
                    onChange={e =>
                      handleInputChange("password", e.target.value)
                    }
                    className="pl-10 bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-gray-700 font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={registerData.confirmPassword}
                    onChange={e =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className="pl-10 bg-white/50 border-gray-200 focus:border-gray-400 focus:ring-gray-400"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={registerData.agreeToTerms}
                  onCheckedChange={checked =>
                    handleInputChange("agreeToTerms", checked as boolean)
                  }
                  disabled={isLoading}
                  className="mt-1"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-gray-900 hover:underline font-medium"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 font-medium transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth"
                  className="text-gray-900 hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
