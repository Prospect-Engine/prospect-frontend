import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/paywall/update-package`,
      method: "post",
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const { data, status } = await apiCall(params);

    // Handle specific error cases
    if (status === 400 && data?.message?.includes("No such customer")) {
      return res.status(400).json({
        error: "Customer not found",
        message:
          "Your account is not properly set up in our billing system. Please contact support.",
        details: data.message,
      });
    }

    // Unwrap the response if it's wrapped in { success, data } format
    const responseData = data?.success && data?.data ? data.data : data;

    return res.status(status).json(responseData);
  } catch (err) {
    // Handle specific error types
    if (err instanceof Error) {
      if (err.message.includes("No such customer")) {
        return res.status(400).json({
          error: "Customer not found",
          message:
            "Your account is not properly set up in our billing system. Please contact support.",
          details: err.message,
        });
      }
    }

    return res.status(500).json({
      error: "Internal server error",
      message:
        "Failed to open customer portal. Please try again or contact support.",
    });
  }
}
