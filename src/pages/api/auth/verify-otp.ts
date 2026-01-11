import type { NextApiRequest, NextApiResponse } from "next";
import { apiCall } from "@/lib/apiCall";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, verification_code } = req.body;

    if (!email || !verification_code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required" });
    }

    // Call the external API
    const response = await apiCall({
      url: "/auth/signup/verify",
      method: "post",
      body: {
        email,
        verification_code,
      },
    });

    if (response.status === 200 || response.status === 201) {
      return res.status(200).json(response.data);
    } else {
      return res.status(response.status).json(response.data);
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
