import workspaceConfig from "@/configs/server-config/workspace";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { NextApiRequest, NextApiResponse } from "next/types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { token, name, password } = req.body;

    if (!token) {
      return res.status(400).json({ message: "token is required" });
    }

    // For auto-join (existing users), name and password can be null
    // For new users, name and password are required
    const isAutoJoin = name === null && password === null;
    const isNewUser = name && password;

    if (!isAutoJoin && !isNewUser) {
      return res.status(400).json({
        message:
          "Either provide name and password for new users, or null values for existing users",
      });
    }

    const params: ApiPropsType = {
      url: workspaceConfig.joinInvitationEndpoint,
      method: "post",
      body: { password, token, name },
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
    const { data, status } = await apiCall(params);
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
