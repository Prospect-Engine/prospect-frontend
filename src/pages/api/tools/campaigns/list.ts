import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const {
      page = 1,
      limit = 20,
      orderBy = "id",
      sortType = "desc",
      filter = "",
    } = req.body as any;

    const qs = `page=${page}&limit=${limit}&order_by=${orderBy}&sort_type=${sortType}${filter ? `&${filter}` : ""}`;
    const params: ApiPropsType = {
      url: `/pipeline/campaigns?${qs}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      applyDefaultDomain: true,
    };

    const { data, status } = await apiCall(params);
    // Normalize response to include best-effort campaign name
    try {
      const items = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      const normalized = items.map((c: any) => ({
        id: String(c.id ?? c.campaign_id ?? c._id ?? ""),
        name: String(
          c.name ??
            c.title ??
            c.campaign_name ??
            c.displayName ??
            c.id ??
            "Unnamed Campaign"
        ),
      }));
      return res.status(200).json({ data: normalized });
    } catch {
      return res.status(status).json(data);
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
