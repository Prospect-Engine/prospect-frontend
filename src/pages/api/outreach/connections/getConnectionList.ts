import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { page, limit, orderBy, sortType, filter } = req.body;
    const params: ApiPropsType = {
      url: `/connections?page=${page || 1}&limit=${limit || 20}&order_by=${orderBy || "connected_on"}&sort_type=${sortType || "desc"}&${filter ?? ""}`,
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
