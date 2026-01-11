import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const { name, allocated_seats } = req.body as {
      name?: string;
      allocated_seats?: number;
    };

    if (!name) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const body: Record<string, unknown> = { name };
    if (allocated_seats !== undefined) {
      body.allocated_seats = allocated_seats;
    }

    const params: ApiPropsType = {
      url: "/workspaces/create",
      method: "post",
      body,
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err: any) {
    if (err?.message?.includes("same name conflict")) {
      return res.status(409).json({
        message:
          "A workspace with this name already exists. Please choose a different name.",
        error: err.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create workspace. Please try again.",
      error: err?.message || "Internal server error",
    });
  }
}
