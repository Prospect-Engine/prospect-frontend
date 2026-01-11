import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      id,
      team_id,
      created_before,
      force,
      limit = 20,
    } = req.method === "POST" ? req.body : req.query;

    let formattedCreatedBefore = "";
    if (created_before) {
      const timestamp = Number(created_before);
      if (!isNaN(timestamp)) {
        formattedCreatedBefore = `&created_before=${timestamp}`;
      }
    }
    const forceParam = force ? `&force=${force}` : "";
    const limitParam = `&limit=${limit}`;

    const url = `/unified/chatlist?id=${id}${team_id ? `&team_id=${team_id}` : ""}${formattedCreatedBefore}${forceParam}${limitParam}`;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const params: ApiPropsType = {
      url: url,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    console.log("[getUnifiedChatList] Calling backend with URL:", url);
    const response = await apiCall(params);
    console.log(
      "[getUnifiedChatList] Backend response status:",
      response.status
    );
    console.log(
      "[getUnifiedChatList] Backend response data:",
      JSON.stringify(response.data).slice(0, 500)
    );

    // Backend wraps responses with { success, data }, unwrap it
    const responseData = response.data;
    const data = responseData?.data ?? responseData;
    console.log(
      "[getUnifiedChatList] Returning data:",
      JSON.stringify(data).slice(0, 500)
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error("[getUnifiedChatList] ERROR:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
