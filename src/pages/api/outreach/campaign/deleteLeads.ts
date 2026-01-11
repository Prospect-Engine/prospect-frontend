import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
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
    const { camp_id, target_leads_id } = req.body;

    const params: ApiPropsType = {
      url: `/campaigns/${camp_id}/remove-target-leads/${target_leads_id}`,
      method: "delete",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    console.log(err);
    return res.status(500).json({ err });
  }
}
