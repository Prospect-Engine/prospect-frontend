import config from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { Campaign } from "@/types/campaign";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Get parameters from request body (POST request)
    const { page, limit, orderBy, sortType, filter } = req.body;

    //
    //
    const params: ApiPropsType = {
      url: `${config.getCampaignsEndpoint}?page=${page || 1}&limit=${limit || 20}&order_by=${orderBy || "id"}&sort_type=${sortType || "desc"}&${filter ?? ""}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
      body: {
        page: page || 1,
        limit: limit || 10,
        orderBy: orderBy || "id",
        sortType: sortType || "desc",
        filter: filter || "",
      },
    };

    const { data: rawData, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response to get the actual campaign data
    const data = unwrapAshbornResponse<{
      id?: string;
      name?: string;
      is_archived?: boolean;
      loading?: boolean;
      campaigns?: Campaign[];
      page?: number;
      limit?: number;
      total?: number;
    }>(rawData);

    // Handle the response structure and return all campaigns
    if (data) {
      // If the response has campaign data in the root object, wrap it in a campaigns array
      if (data.id && data.name !== undefined) {
        // This is a single campaign object, apply archive filter
        const campaignData = { ...data };
        campaignData.loading = false;

        let shouldInclude = true;

        if (filter && filter.includes("is_archived")) {
          const archiveMatch = filter.match(/is_archived=(true|false)/);
          if (archiveMatch) {
            const showArchived = archiveMatch[1] === "true";
            shouldInclude = campaignData.is_archived === showArchived;
          }
        } else {
          // Default: exclude archived campaigns
          shouldInclude = !campaignData.is_archived;
        }

        if (shouldInclude) {
          return res.status(status).json({
            campaigns: [campaignData],
            page: 1,
            limit: 20,
            total: 1,
          });
        } else {
          return res.status(status).json({
            campaigns: [],
            page: 1,
            limit: 20,
            total: 0,
          });
        }
      } else if (data.campaigns && Array.isArray(data.campaigns)) {
        // Apply archive filter based on request
        let filteredCampaigns = data.campaigns;

        if (filter && filter.includes("is_archived")) {
          const archiveMatch = filter.match(/is_archived=(true|false)/);
          if (archiveMatch) {
            const showArchived = archiveMatch[1] === "true";
            filteredCampaigns = data.campaigns.filter(
              (campaign: Campaign) => campaign.is_archived === showArchived
            );
          }
        } else {
          // Default: filter out archived campaigns if no filter specified
          filteredCampaigns = data.campaigns.filter(
            (campaign: Campaign) => !campaign.is_archived
          );
        }

        // Apply process_status filter if provided
        if (filter && filter.includes("process_status=")) {
          const statusMatch = filter.match(
            /process_status=(PENDING|PROCESSING|PROCESSED|PAUSED|RECONNECTING)/
          );
          if (statusMatch) {
            const targetStatus = statusMatch[1];
            filteredCampaigns = filteredCampaigns.filter(
              (campaign: Campaign) => campaign.process_status === targetStatus
            );
          }
        }

        // Set loading to false for all campaigns
        filteredCampaigns.forEach((campaign: Campaign) => {
          campaign.loading = false;
        });

        // Use backend's total if available, otherwise calculate based on filtered results
        // If we have a full page and backend total, use backend total
        // Otherwise, if backend provides total, use it (it represents total before client-side filtering)
        // For client-side filtered results, we need to estimate or use backend total if available
        let totalCount = data.total;

        // If backend doesn't provide total, we need to estimate
        // If we got a full page of results, there might be more
        if (totalCount === undefined || totalCount === null) {
          // If we have a full page, estimate there might be more
          if (filteredCampaigns.length === (data.limit || limit || 20)) {
            // Estimate: at least current page * limit, possibly more
            totalCount = (data.page || page || 1) * (data.limit || limit || 20);
          } else {
            // This is likely the last page, so total is the current count
            totalCount = filteredCampaigns.length;
          }
        } else {
          // Backend provided total, but we did client-side filtering
          // If we filtered, the total might be less than backend total
          // For now, use backend total as it's more accurate
          // In a perfect world, backend would do the filtering and return correct total
          totalCount = data.total;
        }

        return res.status(status).json({
          campaigns: filteredCampaigns,
          page: data.page || page || 1,
          limit: data.limit || limit || 20,
          total: totalCount,
        });
      } else {
        // No campaigns found, return empty array
        return res.status(status).json({
          campaigns: [],
          page: 1,
          limit: 20,
          total: 0,
        });
      }
    }

    // Fallback for no data
    return res.status(status).json({
      campaigns: [],
      page: 1,
      limit: 20,
      total: 0,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
