import React, { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import EmailVerification from "./EmailVerification";

const AuthPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<
    "login" | "signup" | "forgot-password" | "verification"
  >("login");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationContext, setVerificationContext] = useState<
    "signup" | "login"
  >("signup");

  const handleSwitchToSignup = () => setCurrentView("signup");
  const handleSwitchToLogin = () => setCurrentView("login");
  const handleSwitchToForgotPassword = () => setCurrentView("forgot-password");
  const handleSwitchToVerification = (
    email: string,
    context: "signup" | "login"
  ) => {
    setVerificationEmail(email);
    setVerificationContext(context);
    setCurrentView("verification");
  };
  const handleVerificationSuccess = () => {
    setCurrentView("login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {currentView === "login" && (
          <LoginForm
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToForgotPassword={handleSwitchToForgotPassword}
            onSwitchToVerification={handleSwitchToVerification}
          />
        )}
        {currentView === "signup" && (
          <SignupForm
            onSwitchToLogin={handleSwitchToLogin}
            onSwitchToVerification={handleSwitchToVerification}
          />
        )}
        {currentView === "verification" && (
          <EmailVerification
            email={verificationEmail}
            context={verificationContext}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={() =>
              setCurrentView(
                verificationContext === "login" ? "login" : "signup"
              )
            }
          />
        )}
        {currentView === "forgot-password" && (
          <ForgotPasswordForm onSwitchToLogin={handleSwitchToLogin} />
        )}
      </div>
    </div>
  );
};

export default AuthPage;
