import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { workspaceId } = req.query;

  if (!workspaceId || typeof workspaceId !== "string") {
    return res.status(400).json({ message: "Workspace ID is required" });
  }

  const access_token = getCookie("access_token", { req, res });
  const tokenString =
    access_token instanceof Promise ? await access_token : access_token;

  try {
    if (req.method === "PUT") {
      const { name, allocated_seats } = req.body as {
        name?: string;
        allocated_seats?: number;
      };

      if (name === undefined && allocated_seats === undefined) {
        return res.status(400).json({
          message: "Nothing to update. Provide name or allocated_seats",
        });
      }

      const body: Record<string, unknown> = {};
      if (name !== undefined) {
        body.name = name;
      }
      if (allocated_seats !== undefined) {
        body.allocated_seats = allocated_seats;
      }

      const params: ApiPropsType = {
        url: `/workspaces/${workspaceId}`,
        method: "put",
        body,
        headers: {
          Authorization: `Bearer ${tokenString}`,
          "Content-Type": "application/json",
        },
      };
      const { data, status } = await apiCall(params);
      return res.status(status).json(data);
    }

    if (req.method === "DELETE") {
      const params: ApiPropsType = {
        url: `/workspaces/${workspaceId}`,
        method: "delete",
        headers: {
          Authorization: `Bearer ${tokenString}`,
          "Content-Type": "application/json",
        },
      };
      const { data, status } = await apiCall(params);
      return res.status(status).json(data);
    }

    if (req.method === "GET") {
      const params: ApiPropsType = {
        url: `/workspaces/${workspaceId}`,
        headers: {
          Authorization: `Bearer ${tokenString}`,
          "Content-Type": "application/json",
        },
      };
      const { data, status } = await apiCall(params);

      // Unwrap response if wrapped
      const workspaceData = data?.data || data;

      return res.status(status).json(workspaceData);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
