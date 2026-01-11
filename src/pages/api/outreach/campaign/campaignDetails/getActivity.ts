import type { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, type ApiPropsType } from "@/lib/apiCall";
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
      campaigns,
      from_date,
      to_date,
      full_name,
      order_by = "id",
      sort_type = "desc",
      time_zone,
    } = req.query;

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (campaigns) {
      const campaignArray = Array.isArray(campaigns) ? campaigns : [campaigns];
      campaignArray.forEach((camp: string) => {
        queryParams.append("campaigns", camp);
      });
    }
    if (from_date) queryParams.append("from_date", from_date as string);
    if (to_date) queryParams.append("to_date", to_date as string);
    if (full_name) queryParams.append("full_name", full_name as string);
    if (order_by) queryParams.append("order_by", order_by as string);
    if (sort_type) queryParams.append("sort_type", sort_type as string);
    if (time_zone) queryParams.append("time_zone", time_zone as string);

    const params: ApiPropsType = {
      url: `/activity${queryParams.toString() ? `?${queryParams.toString()}` : ""}`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
      applyDefaultDomain: true,
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch activity",
      err: String((err as Error)?.message || err),
    });
  }
}
