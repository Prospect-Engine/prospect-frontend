import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import config from "@/configs/server-config/template";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { id } = req.query;

    if (!id || typeof id !== "string") {
      return res.status(400).json({
        message: "Template ID is required",
      });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getTemplateEndpoint}?id=${id}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get template",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
