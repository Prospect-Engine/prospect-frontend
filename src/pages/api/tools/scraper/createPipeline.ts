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

    // Expected body: { name, url, description?, source_type }
    const { name, url, description, source_type } = req.body || {};
    if (!name || !url || !source_type) {
      return res
        .status(400)
        .json({ message: "name, url and source_type are required" });
    }

    // Forward request to upstream API
    const params: ApiPropsType = {
      url: `/pipeline/create`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      body: {
        name,
        url,
        description,
        source_type, // enum: GROUP | EVENT | POST | SEARCH_URL | SALES_NAVIGATOR
      },
      applyDefaultDomain: true,
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
