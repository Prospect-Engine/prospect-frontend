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

    const { transferRequestId } = req.body;

    if (!transferRequestId) {
      return res.status(400).json({ message: "transferRequestId is required" });
    }

    const params: ApiPropsType = {
      url: `/workspaces/transfer/members/${transferRequestId}/accept`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
