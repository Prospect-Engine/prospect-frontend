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

    // Get member ID and workspace_id from query parameters
    // Support both workspace_id (new) and team_id (legacy) for backwards compatibility
    const { id, workspace_id, team_id } = req.query;

    // Prefer workspace_id, fall back to team_id for backwards compatibility
    const workspaceIdParam = workspace_id || team_id;

    // Build the URL with member ID and workspace_id
    let url = `/integrations/current/member?id=${id}`;
    if (workspaceIdParam) {
      url += `&workspace_id=${workspaceIdParam}`;
    }

    const params: ApiPropsType = {
      url: url,
      method: "get",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    try {
      if (data?.profile?.public_id) {
        data.profile.public_identifier = data.profile.public_id;
      }
    } catch (err) {}

    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
