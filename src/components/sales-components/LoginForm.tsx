import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import { useAuth } from "../../hooks/sales-hooks/useAuth";
import AppleIcon from "../assets/icons/apple.svg";
import GoogleIcon from "../assets/icons/google.svg";
import XTwitterIcon from "../assets/icons/x-twitter.svg";

interface LoginFormProps {
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
  onSwitchToVerification: (email: string, context: "login") => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSwitchToSignup,
  onSwitchToForgotPassword,
  onSwitchToVerification,
}) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login, refreshAuthState } = useAuth();

  // Initialize remember me from localStorage
  useEffect(() => {
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    setFormData(prev => ({ ...prev, rememberMe: savedRememberMe }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const loginSuccess = await login(formData.email, formData.password);

      if (loginSuccess) {
        setSuccess("Login successful! Redirecting...");

        // Store remember me preference
        if (formData.rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("rememberMeTimestamp", Date.now().toString());
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberMeTimestamp");
        }

        // Force refresh of auth state
        setTimeout(() => {
          refreshAuthState();
        }, 200);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-xl">
        {/* Logo and Welcome Section */}
        <div className="mb-8 text-center">
          <div className="inline-block relative mb-6">
            <div className="flex justify-center items-center w-16 h-16 bg-red-500 rounded-full shadow-lg">
              <div className="flex justify-center items-center w-8 h-8 bg-white rounded-full">
                <div className="w-4 h-4 bg-red-500 rounded-sm"></div>
              </div>
            </div>
            <div className="absolute -inset-2 bg-red-50 rounded-full opacity-50"></div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="text-sm text-gray-600">
            Please enter your details to sign in
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="flex mb-6 space-x-3">
          <button className="flex-1 flex items-center justify-center py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src={AppleIcon} alt="Apple" className="w-5 h-5" />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Apple
            </span>
          </button>
          <button className="flex-1 flex items-center justify-center py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src={GoogleIcon} alt="Google" className="w-5 h-5" />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Google
            </span>
          </button>
          <button className="flex-1 flex items-center justify-center py-2.5 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <img src={XTwitterIcon} alt="X" className="w-5 h-5" />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              X
            </span>
          </button>
        </div>

        {/* Separator */}
        <div className="flex items-center mb-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-4 text-xs font-medium text-gray-500 uppercase">
            OR
          </span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {error && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center p-3 mb-6 space-x-2 bg-green-50 rounded-lg border border-green-100">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">{success}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
          name="crmLoginForm"
          autoComplete={formData.rememberMe ? "on" : "off"}
        >
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              E-Mail Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="py-3 pr-3 pl-10 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter your email..."
                autoComplete={formData.rememberMe ? "email" : "off"}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="py-3 pr-10 pl-10 w-full text-sm rounded-lg border border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Enter your password"
                autoComplete={formData.rememberMe ? "current-password" : "off"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 text-gray-400 transition-colors transform -translate-y-1/2 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
              />
              <span className="ml-2 text-sm text-gray-700">Remember me</span>
            </label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-gray-600 underline transition-colors hover:text-gray-800"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-700">
            Don&apos;t have an account yet?{" "}
            <button
              onClick={onSwitchToSignup}
              className="font-semibold text-red-600 transition-colors hover:text-red-700"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
