import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: `/replies/unified/metadata`,
      method: "get",
      applyDefaultDomain: true,
      headers: {
        Authorization: `Bearer ${tokenString}`,
        "Content-Type": "application/json",
      },
    };

    const response = await apiCall(params);

    // Return the response data with the same status code
    return res.status(response.status || 200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
