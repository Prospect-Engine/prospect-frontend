import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { team_id, role, email, name, permissions } = req.body;

    if (!team_id || !role || !email || !name) {
      return res
        .status(400)
        .json({ message: "team_id, role, email, and name are required" });
    }

    const params: ApiPropsType = {
      url: `/workspaces/send-invitation`,
      method: "post",
      body: { team_id, role, email, name, permissions },
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
