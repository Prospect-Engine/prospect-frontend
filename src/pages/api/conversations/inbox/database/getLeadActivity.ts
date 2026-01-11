import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { id } = req.method === "POST" ? req.body : req.query;

    if (!id) {
      return res.status(400).json({ error: "Lead ID is required" });
    }

    const url = `/leads/activity/${id}`;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: url,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const response = await apiCall(params);
    const data = response.data;
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
