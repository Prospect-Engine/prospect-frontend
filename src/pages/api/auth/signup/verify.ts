import type { NextApiRequest, NextApiResponse } from "next";
import { setCookie } from "cookies-next";

interface VerifyRequest {
  email: string;
  verification_code: string;
}

interface VerifyResponse {
  success: boolean;
  message: string;
  data?: {
    access_token: string;
    refresh_token: string;
    [key: string]: any; // Allow additional fields from backend
  };
  debug?: {
    error: string;
    type: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { email, verification_code }: VerifyRequest = req.body;

    if (!email || !verification_code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    const otpRegex = /^\d{6}$/;
    if (!otpRegex.test(verification_code)) {
      return res.status(400).json({
        success: false,
        message: "Verification code must be 6 digits",
      });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          verification_code,
        }),
      }
    );

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(
        "[Verify API] Failed to parse backend response:",
        parseError
      );
      console.error("[Verify API] Response status:", response.status);
      console.error("[Verify API] Response text:", responseText);
      throw new Error("Invalid JSON response from backend");
    }

    if (response.ok) {
      let access_token, refresh_token, userData;

      if (data.data) {
        access_token = data.data.access_token;
        refresh_token = data.data.refresh_token;
        userData = data.data;
      } else {
        access_token = data.access_token;
        refresh_token = data.refresh_token;
        userData = data;
      }

      if (!access_token || !refresh_token) {
        console.error("[Verify API] Missing tokens from backend");
        throw new Error("Missing authentication tokens from backend");
      }

      setCookie("access_token", access_token, {
        req,
        res,
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      setCookie("refresh_token", refresh_token, {
        req,
        res,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Email verified successfully!",
        data: {
          access_token,
          refresh_token,
          ...userData,
        },
      });
    } else {
      let errorMessage = "Verification failed. Please try again.";

      if (response.status === 400) {
        errorMessage = data.message || "Invalid verification code.";
      } else if (response.status === 404) {
        errorMessage = "Email not found. Please register first.";
      } else if (response.status === 410) {
        errorMessage =
          "Verification code has expired. Please request a new one.";
      } else if (response.status === 429) {
        errorMessage = "Too many attempts. Please try again later.";
      }

      return res.status(response.status).json({
        success: false,
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error("[Verify API] Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      ...(process.env.NODE_ENV === "development" && {
        debug: {
          error: error instanceof Error ? error.message : "Unknown error",
          type: error instanceof Error ? error.constructor.name : typeof error,
        },
      }),
    });
  }
}
