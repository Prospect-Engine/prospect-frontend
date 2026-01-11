import type { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, type ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const campId = (req.query?.camp_id || req.query?.id) as string | undefined;
  if (!campId) {
    return res.status(400).json({ message: "camp_id is required" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(
        campId
      )}/sequence`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
    };
    const { data: rawData, status } = await apiCall(params);

    // Unwrap Ashborn response format
    const data = unwrapAshbornResponse<{
      sequence?: Record<string, unknown>;
      diagram?: unknown;
    }>(rawData);

    // Extract sequence object from response
    // The API returns: { sequence: { id, nodes, diagram, ... } }
    // We want to return it in a format that's easy for the frontend to access
    const sequenceData = data?.sequence || data;

    // Return the sequence object with diagram accessible at multiple levels
    // This allows frontend to access: sequenceResp.diagram, sequenceResp.data.diagram, or sequenceResp.sequence.diagram
    return res.status(status).json({
      ...sequenceData,
      // Include diagram at the top level for direct access
      diagram: sequenceData?.diagram || null,
      // Include the full sequence object for nested access
      sequence: sequenceData,
      // Also include in data property for backward compatibility
      data: {
        ...sequenceData,
        diagram: sequenceData?.diagram || null,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch campaign sequence",
      err: String((err as Error)?.message || err),
    });
  }
}
