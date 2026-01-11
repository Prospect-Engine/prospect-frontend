import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

const rejectSubscription = async (tokenString: string) => {
  const params: ApiPropsType = {
    url: "/paywall/trial/reject",
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

    const response = await rejectSubscription(tokenString?.toString() ?? "");

    const { data, status } = response;

    if (data) {
      return res.status(200).json(data);
    } else {
      return res.status(500).json({
        error: "Unexpected response format from subscription cancellation",
      });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: errorMessage });
  }
}
