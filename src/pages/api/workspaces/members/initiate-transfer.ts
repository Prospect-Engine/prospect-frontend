import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

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
    const { id } = req.query;
    const { from_workspace_id, to_workspace_id, transfer_data } = req.body;

    if (!id || !from_workspace_id || !to_workspace_id) {
      return res.status(400).json({
        message:
          "Missing required parameters: id, from_workspace_id, to_workspace_id",
      });
    }

    const params: ApiPropsType = {
      url: `/workspaces/transfer/members/${id}`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: {
        from_workspace_id,
        to_workspace_id,
        transfer_data,
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
