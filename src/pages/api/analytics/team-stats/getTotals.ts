import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

const ALLOWED_QUERY_KEYS = [
  "page",
  "limit",
  "order_by",
  "sort_type",
  "search",
  "team_id",
  "email",
  "role",
  "status",
  "time_filter",
  "from_date",
  "to_date",
  "time_zone",
  "campaign_status",
];

const buildQueryString = (req: NextApiRequest) => {
  const params = new URLSearchParams();

  ALLOWED_QUERY_KEYS.forEach(key => {
    const value = req.query[key];
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach(v => {
        if (v !== undefined && v !== null) {
          params.append(key, String(v));
        }
      });
    } else {
      params.append(key, String(value));
    }
  });

  if (!params.has("page")) {
    params.set("page", "1");
  }
  if (!params.has("limit")) {
    params.set("limit", "10");
  }

  if (!params.has("order_by")) {
    params.set("order_by", "team_id");
  }
  if (!params.has("sort_type")) {
    params.set("sort_type", "asc");
  }

  return params.toString();
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const queryString = buildQueryString(req);
    const params: ApiPropsType = {
      url: `/team-stats/totals${queryString ? `?${queryString}` : ""}`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
