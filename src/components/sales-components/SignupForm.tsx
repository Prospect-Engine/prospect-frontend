import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  Building,
  Users,
  Phone,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import authService from "../../services/sales-services/authService";
import AppleIcon from "../assets/icons/apple.svg";
import GoogleIcon from "../../assets/icons/google.svg";
import XTwitterIcon from "../../assets/icons/x-twitter.svg";

interface SignupFormProps {
  onSwitchToLogin: () => void;
  onSwitchToVerification: (email: string, context: "signup") => void;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  organizationName: string;
  workspaceName: string;
}

interface StepValidation {
  isValid: boolean;
  errors: string[];
}

const SignupForm: React.FC<SignupFormProps> = ({
  onSwitchToLogin,
  onSwitchToVerification,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    organizationName: "",
    workspaceName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const totalSteps = 3;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Step validation functions
  const validateStep1 = (): StepValidation => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push("Name is required");
    }
    if (!formData.email.trim()) {
      errors.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push("Please enter a valid email address");
    }
    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateStep2 = (): StepValidation => {
    const errors: string[] = [];

    if (!formData.organizationName.trim()) {
      errors.push("Organization name is required");
    }
    if (!formData.workspaceName.trim()) {
      errors.push("Workspace name is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validateCurrentStep = (): boolean => {
    let validation: StepValidation;

    switch (currentStep) {
      case 1:
        validation = validateStep1();
        break;
      case 2:
        validation = validateStep2();
        break;
      default:
        return true;
    }

    if (!validation.isValid) {
      setError(validation.errors.join(", "));
      return false;
    }

    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Create payload object, excluding phoneNumber if empty
      const signupPayload: {
        name: string;
        email: string;
        password: string;
        organizationName: string;
        workspaceName: string;
        phoneNumber?: string;
      } = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        workspaceName: formData.workspaceName,
      };

      // Only include phoneNumber if it's not empty
      if (formData.phoneNumber.trim()) {
        signupPayload.phoneNumber = formData.phoneNumber;
      }

      const response = await authService.signup(signupPayload);

      if (response.success) {
        setSuccess(
          "Account created successfully! Please check your email for verification code."
        );
        onSwitchToVerification(formData.email, "signup");
      } else {
        setError(
          response.error || "Failed to create account. Please try again."
        );
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        {Array.from({ length: totalSteps }, (_, index) => (
          <div key={index} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index + 1 <= currentStep
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {index + 1}
            </div>
            {index < totalSteps - 1 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  index + 1 < currentStep ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Personal Information
      </h2>

      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Full Name *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your full name"
          />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor="email"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email address"
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="password"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="py-3 pr-12 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Create a password"
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

      {/* Confirm Password Field */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Confirm Password *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="py-3 pr-12 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 text-gray-400 transform -translate-y-1/2 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Organization Details
      </h2>

      {/* Organization Name Field */}
      <div>
        <label
          htmlFor="organizationName"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Organization Name *
        </label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            id="organizationName"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleInputChange}
            className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your organization name"
          />
        </div>
      </div>

      {/* Workspace Name Field */}
      <div>
        <label
          htmlFor="workspaceName"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Workspace Name *
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="text"
            id="workspaceName"
            name="workspaceName"
            value={formData.workspaceName}
            onChange={handleInputChange}
            className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your workspace name"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          This will be your primary workspace for managing leads
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="mb-6 text-xl font-semibold text-gray-900">
        Additional Information
      </h2>

      {/* Phone Number Field */}
      <div>
        <label
          htmlFor="phoneNumber"
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          Phone Number (Optional)
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 w-5 h-5 text-gray-400 transform -translate-y-1/2" />
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="py-3 pr-4 pl-10 w-full rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your phone number"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          We&apos;ll use this for important account notifications
        </p>
      </div>

      {/* Review Section */}
      <div className="p-4 mt-6 bg-gray-50 rounded-lg">
        <h3 className="mb-3 text-sm font-medium text-gray-900">
          Review Your Information
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Name:</span> {formData.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {formData.email}
          </div>
          <div>
            <span className="font-medium">Organization:</span>{" "}
            {formData.organizationName}
          </div>
          <div>
            <span className="font-medium">Workspace:</span>{" "}
            {formData.workspaceName}
          </div>
          {formData.phoneNumber && (
            <div>
              <span className="font-medium">Phone:</span> {formData.phoneNumber}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
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
            Create Account
          </h1>
          <p className="text-sm text-gray-600">
            Join us and start managing your leads
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

        {/* Progress Bar */}
        {renderProgressBar()}

        {error && (
          <div className="p-4 mb-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center">
              <AlertCircle className="mr-2 w-5 h-5 text-red-400" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <CheckCircle className="mr-2 w-5 h-5 text-green-400" />
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        )}

        {/* Multi-step Form */}
        <form
          onSubmit={
            currentStep === totalSteps
              ? handleSignup
              : e => {
                  e.preventDefault();
                  handleNextStep();
                }
          }
        >
          {renderCurrentStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="flex items-center px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
              >
                <ChevronLeft className="mr-2 w-4 h-4" />
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < totalSteps ? (
              <button
                type="submit"
                className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700"
              >
                Next
                <ChevronRight className="ml-2 w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center px-6 py-2 text-white bg-blue-600 rounded-lg transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 w-4 h-4 rounded-full border-2 border-white animate-spin border-t-transparent"></div>
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>
            )}
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;
