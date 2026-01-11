import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const response = await apiCall({
      url: "/auth/organizations",
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      const responseBody = response.data;
      const organizationsData = responseBody?.data ?? responseBody;
      return res.status(200).json(organizationsData);
    } else {
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
