import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import templateConfig from "@/configs/server-config/template";
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

    const params: ApiPropsType = {
      url: templateConfig.createEndpoint,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: req.body,
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
