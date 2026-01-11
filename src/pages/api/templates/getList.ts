import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import templateConfig from "@/configs/server-config/template";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Extract query parameters
    const {
      page = "1",
      limit = "20",
      order_by = "id",
      sort_type = "desc",
    } = req.query;

    const params: ApiPropsType = {
      url: `${templateConfig.getList}?page=${page}&limit=${limit}&order_by=${order_by}&sort_type=${sort_type}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
