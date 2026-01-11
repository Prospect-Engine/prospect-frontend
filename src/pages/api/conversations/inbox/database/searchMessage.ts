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
    const { search, action, id, team_id } = req.body;
    let url;
    if (!search) {
      url = `/unified/search?search=${action}&id=${id}${team_id ? `&team_id=${team_id}` : ""}`;
    } else {
      url = `/unified/search?search=${search}&id=${id}${team_id ? `&team_id=${team_id}` : ""}`;
    }
    const params: ApiPropsType = {
      url: url,
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
