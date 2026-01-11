import { apiCall, ApiPropsType } from "@/lib/apiCall";
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

    // Extract query parameters
    const {
      page = "1",
      limit = "20",
      order_by = "received_on",
      sort_type = "desc",
      search,
      campaigns,
      teams,
      team_members,
      time_filter,
      from_date,
      to_date,
      time_zone,
    } = req.query;

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set("page", String(page));
    queryParams.set("limit", String(limit));
    queryParams.set("order_by", String(order_by));
    queryParams.set("sort_type", String(sort_type));

    // Add search parameter if provided
    if (search && typeof search === "string" && search.trim().length > 0) {
      queryParams.set("search", search.trim());
    }

    if (campaigns && typeof campaigns === "string") {
      queryParams.set("campaigns", campaigns);
    }

    if (teams && typeof teams === "string") {
      queryParams.set("teams", teams);
    }

    if (team_members && typeof team_members === "string") {
      queryParams.set("team_members", team_members);
    }

    if (time_filter && typeof time_filter === "string") {
      queryParams.set("time_filter", time_filter);

      if (time_filter === "custom") {
        if (from_date && typeof from_date === "string") {
          queryParams.set("from_date", from_date);
        }
        if (to_date && typeof to_date === "string") {
          queryParams.set("to_date", to_date);
        }
        if (time_zone && typeof time_zone === "string") {
          queryParams.set("time_zone", time_zone);
        }
      }
    }

    const params: ApiPropsType = {
      url: `/replies/unified?${queryParams.toString()}`,
      method: "get",
      applyDefaultDomain: true,
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const response = await apiCall(params);

    // Return the response data with the same status code
    return res.status(response.status || 200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
