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
    const { page, limit, orderBy, sortType, filter } = req.body;
    const params: ApiPropsType = {
      url: `/activity?page=${page || 1}&limit=${limit || 20}&order_by=${orderBy || "id"}&sort_type=${sortType || "desc"}&${filter ?? ""}`,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err });
  }
}
