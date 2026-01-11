import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";
import config from "@/configs/server-config/conversation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const { teamMemberId, teamId, type = "LINKEDIN", createdBefore } = req.body;

    let params: ApiPropsType;

    if (teamId && teamId.trim() !== "") {
      // Team-specific endpoint
      params = {
        url: `/conversations/${type}/${teamId}/${teamMemberId}${createdBefore ? `?createdBefore=${createdBefore}&count=20` : ""}`,
        headers: {
          Authorization: `Bearer ${tokenString}`,
        },
      };
    } else {
      params = {
        url: `${config.listEndpoint}/${type.toLowerCase()}?createdBefore=${createdBefore}&count=20`,
        // url: `/conversations/${type}/${teamMemberId}${createdBefore ? `?createdBefore=${createdBefore}&count=20` : ""}`,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      };
    }

    const response = await apiCall(params);
    const { data, status } = response;
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: err });
  }
}
