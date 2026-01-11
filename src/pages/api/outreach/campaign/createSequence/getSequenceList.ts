import type { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const {
      page = "1",
      limit = "20",
      sortType = "desc",
    } = req.query as Record<string, string>;

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

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

    const url = `${config.templateListEndpoint}?page=${encodeURIComponent(page)}&limit=${encodeURIComponent(limit)}&sortType=${encodeURIComponent(sortType)}`;
    const params: ApiPropsType = {
      url,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch templates",
      err: String((err as Error)?.message || err),
    });
  }
}
