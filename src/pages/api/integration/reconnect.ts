import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

/**
 * Reconnect integration API handler.
 *
 * Supports two modes:
 * 1. Simple reconnect (just integration_id) - attempts quick reconnection
 * 2. Full re-authentication (with credentials) - triggers fresh auth flow
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const {
      integration_id,
      email,
      password,
      country_code,
      country_name,
      user_agent,
      use_authenticator,
      authenticator_secret,
      force_reconnection,
    } = req.body;

    const access_token = getCookie("access_token", { req, res });

    // Handle Promise case for newer cookies-next version (v6+)
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Build the reconnect body - include credentials if provided for full re-auth
    const reconnectBody: Record<string, unknown> = {
      integrationId: integration_id,
    };

    // Add credentials for full re-authentication mode
    if (email) reconnectBody.email = email;
    if (password) reconnectBody.password = password;
    if (country_code) reconnectBody.countryCode = country_code;
    if (country_name) reconnectBody.countryName = country_name;
    if (user_agent) reconnectBody.userAgent = user_agent;
    if (use_authenticator !== undefined)
      reconnectBody.useAuthenticator = use_authenticator;
    if (authenticator_secret)
      reconnectBody.authenticatorSecret = authenticator_secret;
    if (force_reconnection !== undefined)
      reconnectBody.forceReconnection = force_reconnection;

    // Ashborn uses POST /integrations/reconnect
    const params: ApiPropsType = {
      url: "/integrations/reconnect",
      method: "post",
      body: reconnectBody,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    const { data, status } = await apiCall(params);

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(status).json(responseData);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
