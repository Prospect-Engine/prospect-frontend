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

    const { pipelineId, urn_ids, job_name } = req.body;

    if (!pipelineId || !urn_ids || !Array.isArray(urn_ids)) {
      return res.status(400).json({
        message: "pipelineId and urn_ids array are required",
      });
    }

    // Forward request to backend enrichment API
    const params: ApiPropsType = {
      url: "/pipeline/batch-enrich-leads",
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      body: {
        pipelineId,
        urn_ids,
        job_name: job_name || `Pipeline ${pipelineId}`,
      },
      applyDefaultDomain: true,
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
