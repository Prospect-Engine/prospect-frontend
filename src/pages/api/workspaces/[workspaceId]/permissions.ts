import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { workspaceId } = req.query;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/workspaces/${workspaceId}/permissions`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };
    const { data, status } = await apiCall(params);

    // Unwrap response if wrapped
    const permissionsData = data?.data || data;

    return res.status(status).json(permissionsData);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
