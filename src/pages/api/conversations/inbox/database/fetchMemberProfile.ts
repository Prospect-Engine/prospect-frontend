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
    const { id, team_id } = req.body;

    const url = `/integrations/current/member?id=${id}${team_id ? `&team_id=${team_id}` : ""}`;

    const params: ApiPropsType = {
      url: url,
      method: "get", // Changed to GET since we're using query params
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    if (data?.profile) {
      if (data.profile.public_id) {
        data.profile.public_identifier = data.profile.public_id;
      }
    } else {
      return res.status(404).json({ error: "Profile not found" });
    }

    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
