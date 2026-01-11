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
    const { organization_name } = req.body;

    if (!organization_name) {
      return res.status(400).json({ message: "Organization name is required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const response = await apiCall({
      url: "/auth/organizations",
      method: "post",
      body: { organization_name },
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 201) {
      const responseBody = response.data;
      const createData = responseBody?.data ?? responseBody;
      const { access_token: newAccessToken, refresh_token: newRefreshToken } =
        createData;

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

      return res.status(201).json({
        success: true,
        message: "Organization created successfully",
        ...createData,
      });
    } else {
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
