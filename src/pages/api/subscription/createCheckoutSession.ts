import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

const createCheckoutSession = async (tokenString: string, id: string) => {
  const params: ApiPropsType = {
    url: `/paywall/checkout/${id}`,
    method: "post",
    headers: {
      Authorization: `Bearer ${tokenString}`,
    },
    body: {},
  };
  return await apiCall(params);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Price ID is required" });
    }

    const response = await createCheckoutSession(
      tokenString?.toString() ?? "",
      id
    );

    const { data, status } = response;

    // Log the response for debugging
    //

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response to get the actual checkout data
    const checkoutData = data?.data || data;

    // Check if the data contains the expected Stripe checkout URL and ID
    if (checkoutData && checkoutData.url && checkoutData.id) {
      return res.status(200).json({
        url: checkoutData.url,
        id: checkoutData.id,
      });
    } else {
      return res.status(500).json({
        error: "Unexpected response format from checkout session creation",
        details: data,
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: errorMessage });
  }
}
