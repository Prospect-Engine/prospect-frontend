import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";
import { getCountryNameFromCode } from "@/lib/country";

// Map integration types to ashborn endpoints
const typeEndpointMap: Record<string, string> = {
  LINKEDIN: "/integrations/linkedin",
  GMAIL: "/integrations/gmail",
  WHATSAPP: "/integrations/whatsapp",
  OUTLOOK: "/integrations/outlook",
  INSTAGRAM: "/integrations/instagram",
  TWITTER: "/integrations/twitter",
  TELEGRAM: "/integrations/telegram",
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const body = req.body;
    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Ensure we have a valid country code and name with intelligent fallback
    const countryCode = body.country_code || "US";
    const countryName =
      body.proxy_country || getCountryNameFromCode(countryCode);

    const integrationType = (body.type || "LINKEDIN").toUpperCase();

    // Build request body matching ashborn DTO structure
    const requestBody = {
      email: body.email,
      password: body.password,
      country_name: countryName,
      country_code: countryCode,
      type: integrationType,
      use_authenticator: body.useTwoFactorAuth || false,
      authenticator_secret:
        body.authenticator_secret || body.twoFactorSecret || null,
      user_agent: req.headers["user-agent"] || "",
      extra_headers: {
        "sec-ch-ua": req.headers["sec-ch-ua"],
        "sec-ch-ua-platform": req.headers["sec-ch-ua-platform"],
        "sec-ch-ua-mobile": req.headers["sec-ch-ua-mobile"],
      },
      // For WhatsApp
      phone_number: body.phone_number,
      // For OAuth-based integrations
      oauth_token: body.oauth_token,
      refresh_token: body.refresh_token,
    };

    // Get type-specific endpoint (default to linkedin)
    const endpoint =
      typeEndpointMap[integrationType] || "/integrations/linkedin";

    const params: ApiPropsType = {
      url: endpoint,
      method: "post",
      body: requestBody,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    // Unwrap the response to get the actual integration data
    const integrationData = data?.data || data;

    return res.status(status).json(integrationData);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
