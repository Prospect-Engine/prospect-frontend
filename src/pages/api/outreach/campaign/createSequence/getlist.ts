import type { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

// GET /api/outreach/campaign/createSequence/getlist?camp_id={id}
// Proxies to: {BASE}/campaigns/{camp_id}/sequence
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { camp_id } = req.query as { camp_id?: string };
    if (!camp_id) {
      return res.status(400).json({ message: "camp_id is required" });
    }

    // Prefer Authorization header; fall back to cookie `access_token` or custom header
    const headerAuth = req.headers["authorization"] as string | undefined;
    const cookieToken =
      (req.cookies?.["access_token"] as string | undefined) ||
      (req.headers?.["x-access-token"] as string | undefined);
    const bearer = headerAuth
      ? headerAuth
      : cookieToken
        ? cookieToken.startsWith("Bearer ")
          ? cookieToken
          : `Bearer ${cookieToken}`
        : undefined;

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(camp_id)}/sequence`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch campaign sequence",
      err: String((err as Error)?.message || err),
    });
  }
}
