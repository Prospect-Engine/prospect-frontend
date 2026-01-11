import type { NextApiRequest, NextApiResponse } from "next";

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForgotPasswordResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { email }: ForgotPasswordRequest = req.body;

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    // Validate required fields
    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const response = await fetch(
      `https://api.sendout.ai/white-walker/v1/auth/reset-password/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message:
          "Password reset code has been sent to your email. Please check your inbox.",
      });
    } else {
      // Use backend message directly, just clean up error codes in brackets
      const backendMessage = data.message || data.error || "";
      let errorMessage = backendMessage.trim();

      // Remove error codes in brackets (e.g., [SE-RP-XX]) but keep the message
      errorMessage = errorMessage.replace(/\[SE-RP-\d+\]/g, "").trim();

      // If no message from backend, provide a default
      if (!errorMessage) {
        errorMessage = "Failed to initiate password reset. Please try again.";
      }

      return res.status(response.status).json({
        success: false,
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error("Forgot password initiate error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
}
