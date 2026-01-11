import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, ApiPropsType } from "@/lib/apiCall";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const cookieHeader = req.headers.cookie;
    let tokenString = "";
    if (cookieHeader) {
      const cookies = cookieHeader.split(";");
      const accessTokenCookie = cookies.find(cookie =>
        cookie.trim().startsWith("access_token=")
      );
      if (accessTokenCookie) tokenString = accessTokenCookie.split("=")[1];
    }
    if (!tokenString || tokenString === "undefined" || tokenString === "null") {
      return res.status(401).json({ message: "No access token provided" });
    }
    if (!tokenString.includes(".")) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const { job_id } = req.body || {};
    if (!job_id) return res.status(400).json({ message: "job_id is required" });

    const params: ApiPropsType = {
      url: "/pipeline/batch-enrich-pause",
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      body: { job_id },
      applyDefaultDomain: true,
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
