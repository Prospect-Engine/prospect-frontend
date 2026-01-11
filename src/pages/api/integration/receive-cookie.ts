import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCountryNameFromCode } from "@/lib/country";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const cookies = req.body.linkedInCookies;
    const user_agent = req.headers["user-agent"];

    if (!tokenString)
      return res
        .status(401)
        .json({ message: "Please login to your Sendout account" });
    if (!cookies)
      return res
        .status(400)
        .json({ message: "Please login to your Linkedin account" });
    if (!user_agent)
      return res
        .status(400)
        .json({ message: "User agent missing in your browser" });

    const countryCode = req.body.country_code || "US";
    const countryName = getCountryNameFromCode(countryCode);

    // Ashborn expects cookies as array of {name, value} objects
    const params: ApiPropsType = {
      url: "/integrations/linkedin/cookie",
      method: "post",
      body: {
        cookies,
        user_agent,
        type: "LINKEDIN",
        country_code: countryCode,
        country_name: countryName,
        extra_headers: {
          "sec-ch-ua": req.headers["sec-ch-ua"],
          "sec-ch-ua-platform": req.headers["sec-ch-ua-platform"],
          "sec-ch-ua-mobile": req.headers["sec-ch-ua-mobile"],
        },
      },
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const integrationData = data?.data || data;

    if (status === 200 || status === 201) {
      const connectionStatus =
        integrationData.connection_status || integrationData.connectionStatus;
      if (connectionStatus === "CONNECTED") {
        return res
          .status(200)
          .json({ message: "Linkedin account connected successfully" });
      }
    }
    return res.status(status).json(integrationData);
  } catch (err) {
    res
      .status(500)
      .json({ message: "An error occurred while processing the request." });
  }
}
