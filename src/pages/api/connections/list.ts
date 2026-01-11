import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
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

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    if (!tokenString) {
      return res.status(401).json({
        message: "Authentication required. Please login again.",
        status_code: 401,
        time: new Date().toISOString(),
      });
    }

    // Build query string from request query parameters
    const queryParams = new URLSearchParams();

    // Forward all supported query params
    const {
      page,
      limit,
      integration_id,
      search,
      is_excluded,
      order_by,
      sort_type,
    } = req.query;

    if (page) queryParams.set("page", String(page));
    if (limit) queryParams.set("limit", String(limit));
    if (integration_id)
      queryParams.set("integration_id", String(integration_id));
    if (search) queryParams.set("search", String(search));
    if (is_excluded !== undefined && is_excluded !== "")
      queryParams.set("is_excluded", String(is_excluded));
    if (order_by) queryParams.set("order_by", String(order_by));
    if (sort_type) queryParams.set("sort_type", String(sort_type));

    const queryString = queryParams.toString();
    const url = `/connections${queryString ? `?${queryString}` : ""}`;

    const params: ApiPropsType = {
      url,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    console.error("Error fetching connections:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
