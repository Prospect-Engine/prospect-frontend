import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { getCookie, setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const access_token = getCookie("access_token", { req, res });
  const tokenString =
    access_token instanceof Promise ? await access_token : access_token;

  const headers = {
    Authorization: tokenString ? `Bearer ${tokenString}` : "",
    "Content-Type": "application/json",
  };

  try {
    const { invitation_token, workspace_id } = req.body;

    if (!invitation_token) {
      return res.status(400).json({ message: "Invitation token is required" });
    }

    if (!workspace_id) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const response = await apiCall({
      url: "/workspaces/join",
      method: "post",
      body: {
        invitation_token,
        workspace_id,
      },
      headers,
    });

    if (response.status === 200 || response.status === 201) {
      const responseBody = response.data;
      const joinData = responseBody?.data ?? responseBody;

      // Update tokens if provided
      const { access_token: newAccessToken, refresh_token: newRefreshToken } =
        joinData;

      if (newAccessToken && newRefreshToken) {
        setCookie("access_token", newAccessToken, {
          req,
          res,
          maxAge: 60 * 60 * 24 * 1, // 1 day
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        setCookie("refresh_token", newRefreshToken, {
          req,
          res,
          maxAge: 60 * 60 * 24 * 7, // 7 days
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Successfully joined workspace",
        ...joinData,
      });
    }

    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
