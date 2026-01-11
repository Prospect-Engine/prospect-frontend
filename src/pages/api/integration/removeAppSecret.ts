import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // TODO: Implement authenticator endpoint in ashborn
    // For now, return not implemented
    return res.status(501).json({
      message: "Authenticator feature not yet implemented in ashborn",
      success: false,
    });
  } catch (err) {
    return res.status(500).json({ err });
  }
}
