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

    // TODO: Implement notice endpoint in ashborn
    // For now, return empty notices
    return res.status(200).json({
      notices: [],
      hasNotices: false,
    });
  } catch (err) {
    return res.status(500).json({ err });
  }
}
