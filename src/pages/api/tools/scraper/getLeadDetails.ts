import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { pipelineId, urn_id } = req.body;

    if (!pipelineId || !urn_id) {
      return res
        .status(400)
        .json({ message: "pipelineId and urn_id are required" });
    }

    const params: ApiPropsType = {
      url: `/pipeline/get-lead-details`,
      method: "post",
      body: {
        pipelineId,
        urn_id,
      },
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
