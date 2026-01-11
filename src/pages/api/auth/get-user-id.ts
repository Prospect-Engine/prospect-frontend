import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get access token from HTTP-only cookie
    const accessToken = getCookie("access_token", { req, res });

    if (!accessToken || typeof accessToken !== "string") {
      return res.status(401).json({ message: "No access token found" });
    }

    // Decode JWT token to extract user ID
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      const userId = payload.user_id;

      if (!userId) {
        return res
          .status(401)
          .json({ message: "Invalid token - no user ID found" });
      }

      return res.status(200).json({
        success: true,
        user_id: userId,
        payload: payload,
      });
    } catch (decodeError) {
      return res.status(401).json({ message: "Invalid token format" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
