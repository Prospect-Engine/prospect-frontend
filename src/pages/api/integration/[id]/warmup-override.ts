import { NextApiRequest, NextApiResponse } from "next/types";
import { getCookie } from "cookies-next";

interface WarmupOverrideBody {
  override: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { id } = req.query;
    const { override } = req.body as WarmupOverrideBody;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ message: "Integration ID is required" });
    }

    if (typeof override !== "boolean") {
      return res.status(400).json({ message: "Override must be a boolean" });
    }

    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    const fullUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/integration/${id}/warmup-override`;

    // Use direct fetch instead of apiCall to avoid credentials mode issues
    const response = await fetch(fullUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenString}`,
      },
      body: JSON.stringify({ override }),
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { error: "Invalid JSON response", rawResponse: responseText };
    }

    // Ashborn wraps responses in { success: true, data: {...} }
    const responseData = data?.data || data;

    return res.status(response.status).json(responseData);
  } catch (err) {
    console.error("[warmup-override] Error:", err);
    return res.status(500).json({ err });
  }
}
