import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { setCookie, getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { workspace_id } = req.body;

    if (!workspace_id) {
      return res.status(400).json({ message: "Workspace ID is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const response = await apiCall({
      url: "/auth/switch-workspace",
      method: "post",
      body: { workspace_id },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    });

    if (response.status === 200) {
      const responseBody = response.data;
      const switchData = responseBody?.data ?? responseBody;
      const { access_token: newAccessToken, refresh_token: newRefreshToken } =
        switchData;

      if (newAccessToken && newRefreshToken) {
        // Update cookies with new tokens
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
        message: "Workspace switched successfully",
        ...switchData,
      });
    } else {
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
