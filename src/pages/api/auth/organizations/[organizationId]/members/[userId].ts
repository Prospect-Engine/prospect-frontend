import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { organizationId, userId } = req.query;

  if (!organizationId || typeof organizationId !== "string") {
    return res.status(400).json({ message: "Organization ID is required" });
  }

  if (!userId || typeof userId !== "string") {
    return res.status(400).json({ message: "User ID is required" });
  }

  const access_token = getCookie("access_token", { req, res });
  const tokenString =
    access_token instanceof Promise ? await access_token : access_token;

  if (!tokenString) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const headers = {
    Authorization: `Bearer ${tokenString}`,
    "Content-Type": "application/json",
  };

  try {
    if (req.method === "PUT") {
      // Update organization member
      const { role, permissions, name } = req.body;

      const response = await apiCall({
        url: `/auth/organizations/${organizationId}/members/${userId}`,
        method: "put",
        body: {
          role,
          permissions,
          name,
        },
        headers,
      });

      if (response.status === 200) {
        return res.status(200).json(response.data);
      }
      return res.status(response.status).json(response.data);
    }

    if (req.method === "DELETE") {
      // Remove organization member
      const response = await apiCall({
        url: `/auth/organizations/${organizationId}/members/${userId}`,
        method: "delete",
        headers,
      });

      if (response.status === 200) {
        return res.status(200).json(response.data);
      }
      return res.status(response.status).json(response.data);
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
