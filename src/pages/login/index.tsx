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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { setAuthenticated } from "@/components/auth/AuthGuard";
import { AuthService } from "@/lib/auth";
import { Loader2, Eye, EyeOff } from "lucide-react";
import toastService from "@/services/sales-services/toastService";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});

  // Initialize remember me from localStorage
  useEffect(() => {
    const savedRememberMe = AuthService.getRememberMePreference();
    setRememberMe(savedRememberMe);
  }, []);

  // Check if user is already authenticated
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Wait a bit to ensure cookies are loaded
        await new Promise(resolve => setTimeout(resolve, 100));

        const isValidAuth = await AuthService.validateAuthState();

        if (isValidAuth) {
          // User is already authenticated, redirect to dashboard
          router.replace("/sales");
          return;
        }
      } catch (error) {
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkExistingAuth();
  }, [router]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email.toLowerCase().trim(),
          password: password,
          rememberMe: rememberMe,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = "Invalid email or password. Please try again.";

        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.error) {
          errorMessage = responseData.error;
        } else if (response.status === 400) {
          errorMessage =
            "Invalid credentials. Please check your email and password.";
        } else if (response.status === 401) {
          errorMessage = "Invalid email or password. Please try again.";
        } else if (response.status === 429) {
          errorMessage = "Too many login attempts. Please try again later.";
        } else if (response.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        // Show error in both toast and form
        toastService.error(errorMessage);
        setErrors({
          general: errorMessage,
        });
        return;
      }

      // Check if response has success flag and data
      if (!responseData?.success || !responseData?.data) {
        const errorMessage =
          responseData?.message || "Login failed. Please try again.";
        toastService.error(errorMessage);
        setErrors({
          general: errorMessage,
        });
        return;
      }

      // Store authentication data
      AuthService.storeAuthData(responseData.data, rememberMe);

      // Set authentication state
      setAuthenticated(true, rememberMe);

      // Show success message
      toastService.success("Login successful!");

      // Debug: Log successful login for password manager

      // Small delay to ensure Chrome detects the successful submission
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check subscription status before redirecting
      await checkSubscriptionAndRedirect();
    } catch (error) {
      // Handle network errors or other exceptions

      let errorMessage =
        "Network error. Please check your connection and try again.";

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorMessage =
            "Unable to connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }

      // Show error in both toast and form
      toastService.error(errorMessage);
      setErrors({
        general: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionAndRedirect = async () => {
    try {
      const response = await fetch("/api/subscription/getsubscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        router.push("/onboarding/choose-plan");
        return;
      }

      const data = await response.json();

      if (!data?.subscription) {
        router.push("/onboarding/choose-plan");
        return;
      }

      if (data.needsSubscription) {
        router.push("/onboarding/choose-plan");
        return;
      }

      router.push("/sales");
    } catch (error) {
      console.error("[Login] Subscription check error:", error);
      router.push("/onboarding/choose-plan");
    }
  };

  const handleForgotPassword = () => {
    // Handle forgot password logic
  };

  // Show loading state while checking existing authentication
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center p-4 min-h-screen bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-4 animate-spin border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center p-4 min-h-screen bg-background">
      <div className="space-y-6 w-full max-w-md">
        {/* Header - Clear visual hierarchy */}
        {/* <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h1>
          <p className="text-base text-muted-foreground">
            Sign in to your Red Magic account
          </p>
        </div> */}

        {/* Login Card - Consistent spacing and clear structure */}
        <Card className="shadow-lg">
          <CardHeader className="pb-6 space-y-1">
            <CardTitle className="text-2xl text-center text-foreground">
              Sign In
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isLoading ? (
              <LoginSkeleton />
            ) : (
              <>
                {/* General Error Message */}
                {errors.general && (
                  <div
                    className="p-3 text-sm rounded-md border text-destructive bg-destructive/10 border-destructive/20"
                    // role="alert"
                    aria-live="polite"
                  >
                    <div className="flex items-start space-x-2">
                      <svg
                        className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{errors.general}</span>
                    </div>
                  </div>
                )}

                {/* Login Form - Clear form structure */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                  name="loginForm"
                  autoComplete={rememberMe ? "on" : "off"}
                  noValidate
                >
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-foreground"
                    >
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={e => {
                        setEmail(e.target.value);
                        // Clear email error when user starts typing
                        if (errors.email) {
                          setErrors(prev => ({ ...prev, email: undefined }));
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSubmit(e as any);
                        }
                      }}
                      disabled={isLoading}
                      className={
                        errors.email
                          ? "border-destructive focus-visible:ring-destructive/20"
                          : ""
                      }
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      autoComplete={rememberMe ? "email" : "off"}
                    />
                    {errors.email && (
                      <p id="email-error" className="text-sm text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          // Clear password error when user starts typing
                          if (errors.password) {
                            setErrors(prev => ({
                              ...prev,
                              password: undefined,
                            }));
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmit(e as any);
                          }
                        }}
                        disabled={isLoading}
                        className={
                          errors.password
                            ? "border-destructive focus-visible:ring-destructive/20 pr-10"
                            : "pr-10"
                        }
                        aria-describedby={
                          errors.password ? "password-error" : undefined
                        }
                        autoComplete={rememberMe ? "current-password" : "off"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-0 right-0 px-3 py-2 h-full hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    {errors.password && (
                      <p
                        id="password-error"
                        className="text-sm text-destructive"
                      >
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Remember Me & Forgot Password - Clear grouping */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={checked =>
                          setRememberMe(checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor="remember"
                        className="text-sm cursor-pointer text-muted-foreground"
                      >
                        Remember me
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 text-sm text-primary hover:text-primary/80"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                    >
                      Forgot password?
                    </Button>
                  </div>

                  {/* Submit Button - Clear call to action */}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                {/* OR Separator with equal spacing */}
                <div className="relative my-6">
                  <div className="flex absolute inset-0 items-center">
                    <Separator />
                  </div>
                  <div className="flex relative justify-center text-xs uppercase">
                    <span className="px-3 font-medium bg-background text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                {/* Footer - Clear navigation */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Button
                      variant="link"
                      className="px-0 text-sm font-medium text-primary hover:text-primary/80"
                      onClick={() => {
                        // Navigate to sign up page
                        router.push("/auth");
                      }}
                    >
                      Create one now
                    </Button>
                  </p>
                </div>

                {/* Social Login Divider - Clear visual separation */}
                {/* <div className="relative">
                  <div className="flex absolute inset-0 items-center">
                    <Separator />
                  </div>
                  <div className="flex relative justify-center text-xs uppercase">
                    <span className="px-3 font-medium bg-background text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div> */}

                {/* Social Login Buttons - Consistent sizing and clear hierarchy */}
                {/* <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => handleSocialLogin("Google")}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => handleSocialLogin("Microsoft")}
                    disabled={isLoading}
                  >
                    <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24">
                      <path
                        d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"
                        fill="#00BCF2"
                      />
                    </svg>
                    Microsoft
                  </Button>
                </div> */}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Loading Skeleton - Better perceived performance
function LoginSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-full h-11" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-full h-11" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-full h-11" />

      <div className="relative">
        <div className="flex absolute inset-0 items-center">
          <Separator />
        </div>
        <div className="flex relative justify-center text-xs uppercase">
          <span className="px-3 bg-background text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="w-full h-11" />
        <Skeleton className="w-full h-11" />
      </div>
    </div>
  );
}
