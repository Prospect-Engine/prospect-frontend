import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import workspaceConfig from "@/configs/server-config/workspace";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { team_id, permissions } = req.body;

    if (!team_id || !permissions) {
      return res
        .status(400)
        .json({ message: "team_id and permissions are required" });
    }

    const params: ApiPropsType = {
      url: workspaceConfig.permitWorkspaceEndpoint,
      method: "put",
      body: { team_id, permissions },
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
