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

    const params: ApiPropsType = {
      url: `/unified/unified-members`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const response = await apiCall(params);
    const { data, status } = response;

    // Ensure we return all members regardless of connection status
    // The UI should show all team members even if their LinkedIn integration is disconnected
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
