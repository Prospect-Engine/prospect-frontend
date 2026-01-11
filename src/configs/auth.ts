export default {
  meEndpoint: "/auth/me",
  login: "/auth",
  loginEndpoint: "/api/auth/login",
  registerEndpoint: "/api/auth/signup/initiate",
  emailVerificationEndpoint: "/api/auth/signup/verify",
  logoutEndpoint: "/api/auth/logout",
  loginStateTokenName: "userData",
  storageTokenKeyName: "access_token",
  onTokenExpiration: "refresh_token", // logout | refreshToken
  verifyEmail: "/register/provide-otp",
  dashBoard: "/sales",

  resetPassword: "/reset-password",
  resetPasswordEndpoint: "/api/auth/reset-password/initiate",
  resetTokenCheck: "/reset-password/verify-otp",
  resetPasswordTokenVerifyEndpoint: "/api/auth/reset-password/verify",
  resetPasswordChange: "/reset-password/new-password",
  resetPasswordChangeEndpoint: "/api/auth/reset-password",
  resendeOtpEndpoint: "/api/auth/resend-otp",
  // billing
  getSubscriptionEndpoint: "/api/billing/getSubscription",
};
