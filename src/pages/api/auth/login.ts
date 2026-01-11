import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { username, password, rememberMe } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedUsername = username.toLowerCase().trim();

    // Call the external API
    const response = await apiCall({
      url: "/auth/login",
      method: "post",
      body: { username: normalizedUsername, password },
    });

    if (response.status === 200) {
      // Handle both wrapped ({ success, data }) and unwrapped response formats
      const responseBody = response.data;
      const loginData = responseBody?.data ?? responseBody;
      const { access_token, refresh_token } = loginData;

      // Validate required fields
      if (!access_token || !refresh_token) {
        return res
          .status(500)
          .json({ message: "Invalid login response - missing tokens" });
      }

      // Set cookie expiration based on remember me preference
      const accessTokenMaxAge = rememberMe
        ? 60 * 60 * 24 * 30
        : 60 * 60 * 24 * 1; // 30 days vs 1 day
      const refreshTokenMaxAge = rememberMe
        ? 60 * 60 * 24 * 90
        : 60 * 60 * 24 * 7; // 90 days vs 7 days

      // Set secure cookies with proper configuration
      setCookie("access_token", access_token, {
        req,
        res,
        maxAge: accessTokenMaxAge,
        httpOnly: false, // Allow client-side access for token extraction
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
        path: "/", // Available on all paths
        // domain: '.yourdomain.com', // Uncomment if using subdomains
      });

      setCookie("refresh_token", refresh_token, {
        req,
        res,
        maxAge: refreshTokenMaxAge,
        httpOnly: true, // Security: prevent XSS
        secure: process.env.NODE_ENV === "production", // HTTPS only in production
        sameSite: "lax", // CSRF protection
        path: "/", // Available on all paths
        // domain: '.yourdomain.com', // Uncomment if using subdomains
      });

      // Pass through the login response directly
      // Ashborn returns the correct format for storeAuthData
      return res.status(200).json({
        success: true,
        message: "Login successful!",
        data: loginData,
      });
    } else {
      // Pass through the external API error response with proper status code
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
