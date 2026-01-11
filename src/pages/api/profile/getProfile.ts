import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const access_token = getCookie("access_token", { req, res });

  // Handle Promise case for newer cookies-next version (v6+)
  const tokenString =
    access_token instanceof Promise ? await access_token : access_token;

  if (!tokenString) {
    return res.status(401).json({
      message: "Authentication required. Please login again.",
      status_code: 401,
      time: new Date().toISOString(),
    });
  }

  const params: ApiPropsType = {
    url: "/profile",
    method: "get",
    headers: {
      Authorization: `Bearer ${tokenString}`,
    },
  };

  const { data, status } = await apiCall(params);

  // Ashborn wraps responses in { success: true, data: {...} }
  // Unwrap the response to get the actual profile data
  const profileData = data?.data || data;

  return res.status(status).json(profileData);
}
