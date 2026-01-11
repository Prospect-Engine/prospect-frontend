import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { organizationId } = req.query;

  if (!organizationId || typeof organizationId !== "string") {
    return res.status(400).json({ message: "Organization ID is required" });
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
    const { email, name, role, permissions } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }

    const response = await apiCall({
      url: `/auth/organizations/${organizationId}/members/invite`,
      method: "post",
      body: {
        email,
        name,
        role,
        permissions,
      },
      headers,
    });

    if (response.status === 201) {
      return res.status(201).json(response.data);
    }
    return res.status(response.status).json(response.data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
