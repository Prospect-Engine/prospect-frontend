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
    const { name, email, password, promo_code, on_trial, plan_code } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    // Call the external API
    const response = await apiCall({
      url: "/auth/signup/initiate",
      method: "post",
      body: {
        name,
        email: normalizedEmail,
        password,
        promo_code,
        on_trial,
        plan_code,
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
