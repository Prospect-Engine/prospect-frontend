import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { name, skip_lead_conditions, camp_id, daily_engine_quota } =
      req.body;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    const params: ApiPropsType = {
      url: `/campaigns/${camp_id}/update-config`,
      method: "put",
      body: { name, skip_lead_conditions, daily_engine_quota },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);
    // console.dir({ data, status }, { depth: null });
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({ err });
  }
}
