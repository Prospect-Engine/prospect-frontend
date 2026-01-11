import { NextApiRequest, NextApiResponse } from "next/types";
import { apiCall, ApiPropsType } from "@/lib/apiCall";

export interface MaintenanceStatus {
  is_maintenance_mode: boolean;
  is_done: boolean;
  created_at: string;
  updated_at: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Primary: Backend API call
    const params: ApiPropsType = {
      url: "/maintenance/status",
      method: "get",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (error) {
    // Fallback: Environment variable approach
    const fallbackStatus: MaintenanceStatus = {
      is_maintenance_mode: process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true",
      is_done: process.env.NEXT_PUBLIC_MAINTENANCE_MODE !== "true",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    //
    return res.status(200).json(fallbackStatus);
  }
}
