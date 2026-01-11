import type { NextApiRequest, NextApiResponse } from "next";
import { getCookie, setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get refresh token from HTTP-only cookie
    const refreshToken = getCookie("refresh_token", { req, res });

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token found",
      });
    }

    // Call ashborn's refresh endpoint with the refresh token
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `refresh_token=${refreshToken}`,
      },
    });

    if (!response.ok) {
      // Refresh failed - clear cookies and return error
      setCookie("access_token", "", {
        req,
        res,
        maxAge: 0,
        path: "/",
      });
      setCookie("refresh_token", "", {
        req,
        res,
        maxAge: 0,
        path: "/",
      });

      return res.status(401).json({
        success: false,
        message: "Token refresh failed",
      });
    }

    const data = await response.json();

    // Set the new access token cookie
    if (data.access_token) {
      setCookie("access_token", data.access_token, {
        req,
        res,
        maxAge: 60 * 60 * 24 * 1, // 1 day
        httpOnly: false, // Allow client-side access for token extraction
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data,
    });
  } catch (error) {
    console.error("[Auth Refresh] Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during token refresh",
    });
  }
}
