import type { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, type ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";
import leadsConfig from "@/configs/server-config/leads";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Extract query parameters
    const {
      campaigns,
      company,
      contact_email,
      current_position,
      first_name,
      full_name,
      headline,
      industry,
      is_excluded,
      is_open,
      is_premium,
      last_name,
      location,
      order_by = "id",
      phone,
      sort_type = "desc",
      tag_id,
    } = req.query;

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Handle campaigns array
    if (campaigns) {
      const campaignArray = Array.isArray(campaigns) ? campaigns : [campaigns];
      campaignArray.forEach((camp: string) => {
        queryParams.append("campaigns", camp);
      });
    }

    // Add other query parameters if they exist
    if (company) queryParams.append("company", company as string);
    if (contact_email !== undefined)
      queryParams.append("contact_email", contact_email as string);
    if (current_position)
      queryParams.append("current_position", current_position as string);
    if (first_name) queryParams.append("first_name", first_name as string);
    if (full_name) queryParams.append("full_name", full_name as string);
    if (headline) queryParams.append("headline", headline as string);
    if (industry) queryParams.append("industry", industry as string);
    if (is_excluded !== undefined)
      queryParams.append("is_excluded", is_excluded as string);
    if (is_open !== undefined) queryParams.append("is_open", is_open as string);
    if (is_premium !== undefined)
      queryParams.append("is_premium", is_premium as string);
    if (last_name) queryParams.append("last_name", last_name as string);
    if (location) queryParams.append("location", location as string);
    if (order_by) queryParams.append("order_by", order_by as string);
    if (phone !== undefined) queryParams.append("phone", phone as string);
    if (sort_type) queryParams.append("sort_type", sort_type as string);
    if (tag_id) queryParams.append("tag_id", tag_id as string);

    // Build URL with query parameters
    const url = `${leadsConfig.getListEndpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const params: ApiPropsType = {
      url,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Return the response in the format expected by the frontend
    // The API returns: { data: [...], page, limit, total }
    // Frontend expects: data array or data.leads or data.data
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch leads",
      err: String((err as Error)?.message || err),
    });
  }
}
