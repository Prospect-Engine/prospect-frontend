"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { setAuthenticated } from "@/components/auth/AuthGuard";
import { AuthService } from "@/lib/auth";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import ForgotPasswordDialog from "@/components/auth/ForgotPasswordDialog";
import { useAuth } from "@/context/AuthContext";

interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  general?: string;
}

export default function AuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState("signin");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Password visibility toggles
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [signInErrors, setSignInErrors] = useState<ValidationErrors>({});
  const [signUpErrors, setSignUpErrors] = useState<ValidationErrors>({});

  // Track if forms have been submitted to show errors
  const [signInSubmitted, setSignInSubmitted] = useState(false);
  const [signUpSubmitted, setSignUpSubmitted] = useState(false);

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [signUpData, setSignUpData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    promo_code: "",
    on_trial: false,
    plan_code: "basic",
  });

  // Initialize remember me from localStorage
  useEffect(() => {
    const savedRememberMe = AuthService.getRememberMePreference();
    setSignInData(prev => ({ ...prev, rememberMe: savedRememberMe }));
  }, []);

  // Clear errors and submission state when switching tabs
  useEffect(() => {
    setSignInErrors({});
    setSignUpErrors({});
    setSignInSubmitted(false);
    setSignUpSubmitted(false);
  }, [activeTab]);

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark form as submitted
    setSignInSubmitted(true);

    // Clear previous errors
    setSignInErrors({});

    // Client-side validation
    const errors: ValidationErrors = {};
    if (!signInData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signInData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!signInData.password) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setSignInErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      await login(
        {
          email: signInData.email.toLowerCase().trim(),
          password: signInData.password,
          rememberMe: signInData.rememberMe,
        },
        error => {
          const errorMessage =
            typeof error === "string"
              ? error
              : "Login failed. Please check your credentials.";
          setSignInErrors({ general: errorMessage });
        }
      );

      setAuthenticated(true, signInData.rememberMe);

      await new Promise(resolve => setTimeout(resolve, 100));

      ShowShortMessage("Successfully signed in!", "success");

      router.push("/sales");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setSignInErrors({ general: errorMessage });
      ShowShortMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark form as submitted
    setSignUpSubmitted(true);

    // Clear previous errors
    setSignUpErrors({});

    // Client-side validation
    const errors: ValidationErrors = {};

    if (!signUpData.name.trim()) {
      errors.name = "Full name is required";
    } else if (signUpData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    if (!signUpData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(signUpData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!signUpData.password) {
      errors.password = "Password is required";
    } else if (signUpData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (!signUpData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (signUpData.password !== signUpData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setSignUpErrors(errors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: signUpData.name,
          email: signUpData.email.toLowerCase().trim(),
          password: signUpData.password,
          promo_code: signUpData.promo_code || null,
          on_trial: signUpData.on_trial,
          plan_code: signUpData.plan_code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        ShowShortMessage(
          "Account created successfully! Please verify your email.",
          "success"
        );
        router.push(
          `/verify-otp?email=${encodeURIComponent(signUpData.email)}`
        );
      } else {
        // Handle API errors
        const errorMessage =
          data.message ||
          data.error ||
          "Registration failed. Please try again.";
        setSignUpErrors({ general: errorMessage });
        ShowShortMessage(errorMessage, "error");
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again.";
      setSignUpErrors({ general: errorMessage });
      ShowShortMessage(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

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
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to Sendout
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account or create a new one
          </p>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Authentication
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4">
                {isLoading ? (
                  <SignInSkeleton />
                ) : (
                  <form
                    onSubmit={handleSignIn}
                    className="space-y-4"
                    name="signInForm"
                    method="post"
                    autoComplete={signInData.rememberMe ? "on" : "off"}
                    noValidate
                  >
                    {/* General Error Message */}
                    {signInErrors.general && (
                      <div
                        className="p-3 text-sm rounded-md border text-destructive bg-destructive/10 border-destructive/20"
                        role="alert"
                        aria-live="polite"
                      >
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span>{signInErrors.general}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={e =>
                          setSignInData({
                            ...signInData,
                            email: e.target.value,
                          })
                        }
                        required
                        disabled={isLoading}
                        autoComplete={signInData.rememberMe ? "email" : "off"}
                        aria-invalid={
                          signInSubmitted && signInErrors.email
                            ? "true"
                            : "false"
                        }
                        aria-describedby={
                          signInSubmitted && signInErrors.email
                            ? "email-error"
                            : undefined
                        }
                      />
                      {signInSubmitted && signInErrors.email && (
                        <p
                          id="email-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signInErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showSignInPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={e =>
                            setSignInData({
                              ...signInData,
                              password: e.target.value,
                            })
                          }
                          required
                          disabled={isLoading}
                          autoComplete={
                            signInData.rememberMe ? "current-password" : "off"
                          }
                          className="pr-10"
                          aria-invalid={
                            signInSubmitted && signInErrors.password
                              ? "true"
                              : "false"
                          }
                          aria-describedby={
                            signInSubmitted && signInErrors.password
                              ? "password-error"
                              : undefined
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowSignInPassword(!showSignInPassword)
                          }
                          disabled={isLoading}
                          aria-label={
                            showSignInPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showSignInPassword ? (
                            <EyeOff
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      </div>
                      {signInSubmitted && signInErrors.password && (
                        <p
                          id="password-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signInErrors.password}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="remember"
                          className="rounded border-gray-300"
                          checked={signInData.rememberMe}
                          onChange={e =>
                            setSignInData({
                              ...signInData,
                              rememberMe: e.target.checked,
                            })
                          }
                          disabled={isLoading}
                        />
                        <Label
                          htmlFor="remember"
                          className="text-sm cursor-pointer"
                        >
                          Remember me
                        </Label>
                      </div>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm"
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Sign In
                    </Button>
                  </form>
                )}

                {/* <div className="relative">
                  <div className="flex absolute inset-0 items-center">
                    <Separator />
                  </div>
                  <div className="flex relative justify-center text-xs uppercase">
                    <span className="px-2 bg-background text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" disabled={isLoading}>
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
                  <Button variant="outline" disabled={isLoading}>
                    <svg
                      className="mr-2 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                    Twitter
                  </Button>
                </div> */}
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                {isLoading ? (
                  <SignUpSkeleton />
                ) : (
                  <form
                    onSubmit={handleSignUp}
                    className="space-y-4"
                    noValidate
                  >
                    {/* General Error Message */}
                    {signUpErrors.general && (
                      <div
                        className="p-3 text-sm rounded-md border text-destructive bg-destructive/10 border-destructive/20"
                        role="alert"
                        aria-live="polite"
                      >
                        <div className="flex items-start space-x-2">
                          <AlertCircle
                            className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span>{signUpErrors.general}</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={signUpData.name}
                        onChange={e =>
                          setSignUpData({ ...signUpData, name: e.target.value })
                        }
                        required
                        disabled={isLoading}
                        aria-invalid={
                          signUpSubmitted && signUpErrors.name
                            ? "true"
                            : "false"
                        }
                        aria-describedby={
                          signUpSubmitted && signUpErrors.name
                            ? "name-error"
                            : undefined
                        }
                      />
                      {signUpSubmitted && signUpErrors.name && (
                        <p
                          id="name-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signUpErrors.name}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={e =>
                          setSignUpData({
                            ...signUpData,
                            email: e.target.value,
                          })
                        }
                        required
                        disabled={isLoading}
                        aria-invalid={
                          signUpSubmitted && signUpErrors.email
                            ? "true"
                            : "false"
                        }
                        aria-describedby={
                          signUpSubmitted && signUpErrors.email
                            ? "signup-email-error"
                            : undefined
                        }
                      />
                      {signUpSubmitted && signUpErrors.email && (
                        <p
                          id="signup-email-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signUpErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="promo-code">Promo Code (Optional)</Label>
                      <Input
                        id="promo-code"
                        placeholder="Enter promo code"
                        value={signUpData.promo_code}
                        onChange={e =>
                          setSignUpData({
                            ...signUpData,
                            promo_code: e.target.value.trim().toUpperCase(),
                          })
                        }
                        disabled={isLoading}
                        maxLength={50}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignUpPassword ? "text" : "password"}
                          placeholder="Create a password"
                          value={signUpData.password}
                          onChange={e =>
                            setSignUpData({
                              ...signUpData,
                              password: e.target.value,
                            })
                          }
                          required
                          disabled={isLoading}
                          className="pr-10"
                          aria-invalid={
                            signUpSubmitted && signUpErrors.password
                              ? "true"
                              : "false"
                          }
                          aria-describedby={
                            signUpSubmitted && signUpErrors.password
                              ? "signup-password-error signup-password-hint"
                              : "signup-password-hint"
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowSignUpPassword(!showSignUpPassword)
                          }
                          disabled={isLoading}
                          aria-label={
                            showSignUpPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showSignUpPassword ? (
                            <EyeOff
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      </div>
                      {signUpSubmitted && signUpErrors.password ? (
                        <p
                          id="signup-password-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signUpErrors.password}
                        </p>
                      ) : (
                        <p
                          id="signup-password-hint"
                          className="text-xs text-muted-foreground"
                        >
                          Must be at least 8 characters long
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={e =>
                            setSignUpData({
                              ...signUpData,
                              confirmPassword: e.target.value,
                            })
                          }
                          required
                          disabled={isLoading}
                          className="pr-10"
                          aria-invalid={
                            signUpSubmitted && signUpErrors.confirmPassword
                              ? "true"
                              : "false"
                          }
                          aria-describedby={
                            signUpSubmitted && signUpErrors.confirmPassword
                              ? "confirm-password-error"
                              : undefined
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          disabled={isLoading}
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          ) : (
                            <Eye
                              className="w-4 h-4 text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </Button>
                      </div>
                      {signUpSubmitted && signUpErrors.confirmPassword && (
                        <p
                          id="confirm-password-error"
                          className="text-sm text-destructive"
                          role="alert"
                        >
                          {signUpErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="terms"
                        className="rounded border-gray-300"
                        required
                        aria-describedby="terms-description"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm"
                        id="terms-description"
                      >
                        I agree to the{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm"
                          onClick={e => e.preventDefault()}
                        >
                          Terms of Service
                        </Button>{" "}
                        and{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm"
                          onClick={e => e.preventDefault()}
                        >
                          Privacy Policy
                        </Button>
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      Create Account
                    </Button>
                  </form>
                )}

                {/* <div className="relative">
                  <div className="flex absolute inset-0 items-center">
                    <Separator />
                  </div>
                  <div className="flex relative justify-center text-xs uppercase">
                    <span className="px-2 bg-background text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" disabled={isLoading}>
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
                  <Button variant="outline" disabled={isLoading}>
                    <svg
                      className="mr-2 w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                    </svg>
                    Twitter
                  </Button>
                </div> */}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-sm text-center text-muted-foreground">
          <p>
            {activeTab === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <Button
                  variant="link"
                  className="px-0"
                  onClick={() => setActiveTab("signup")}
                >
                  Sign up
                </Button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="px-0"
                  onClick={() => setActiveTab("signin")}
                >
                  Sign in
                </Button>
              </>
            )}
          </p>
        </div>

        {/* Forgot Password Dialog */}
        <ForgotPasswordDialog
          open={isForgotPasswordOpen}
          onOpenChange={setIsForgotPasswordOpen}
        />
      </div>
    </div>
  );
}

// Skeleton Components
function SignInSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="w-12 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-20 h-4" />
        </div>
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-full h-10" />
    </div>
  );
}

function SignUpSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
        <div className="space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-full h-10" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="w-12 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-16 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="w-4 h-4" />
        <Skeleton className="w-64 h-4" />
      </div>
      <Skeleton className="w-full h-10" />
    </div>
  );
}
