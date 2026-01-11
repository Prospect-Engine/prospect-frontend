import { NextApiRequest, NextApiResponse } from "next/types";
import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

/**
 * Get Search URL Progress
 *
 * Fetches the current progress of a search URL fetch operation.
 * Frontend polls this endpoint during PROCESSING status to show real-time progress.
 *
 * POST /api/outreach/campaign/searchUrlProgress
 * Body: { campaignId: string, searchUrlId: string }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     id: string,
 *     status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PAUSED',
 *     fetchedCount: number,
 *     expectedCount: number,
 *     progress: number, // 0-100
 *     pageCount: number,
 *     lastFetchAt: string | null,
 *     errorMessage: string | null
 *   }
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ message: "Method not allowed" });
    }

    const { campaignId, searchUrlId } = req.body;

    if (!campaignId || !searchUrlId) {
      return res
        .status(400)
        .json({ message: "campaignId and searchUrlId are required" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Call backend: GET /campaigns/{campaignId}/search-urls/{searchUrlId}/progress
    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}/${encodeURIComponent(campaignId)}/search-urls/${encodeURIComponent(searchUrlId)}/progress`,
      method: "get",
      headers: { Authorization: `Bearer ${tokenString}` },
    };

    const { data, status } = await apiCall(params);

    // Return the response directly - backend already returns the right format
    return res.status(status).json(data);
  } catch (err) {
    console.error("Error fetching search URL progress:", err);
    return res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
