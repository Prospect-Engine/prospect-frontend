import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

const getPricing = async (tokenString: string) => {
  const params: ApiPropsType = {
    url: `/paywall/packages`,
    headers: {
      Authorization: `Bearer ${tokenString}`,
    },
  };
  return await apiCall(params);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const response = await getPricing(tokenString?.toString() ?? "");

    if (response.status !== 200) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch pricing data" });
    }

    const { data, status } = response;
    // Extract the inner data array from wrapped response { success: true, data: [...] }
    const pricing = data?.data ?? data;
    return res.status(status).json(pricing);
  } catch (err) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
