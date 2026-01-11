import type { NextApiRequest, NextApiResponse } from "next";

interface ResendRequest {
  email: string;
}

interface ResendResponse {
  success: boolean;
  message: string;
}

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3; // 3 requests per minute

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const key = `resend_otp_${email}`;
  const record = rateLimitStore.get(key);

  if (!record) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Reset counter if window has passed
  if (now - record.lastReset > RATE_LIMIT_WINDOW) {
    rateLimitStore.set(key, { count: 1, lastReset: now });
    return true;
  }

  // Check if limit exceeded
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment counter
  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResendResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { email }: ResendRequest = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Check rate limit
    if (!checkRateLimit(email)) {
      return res.status(429).json({
        success: false,
        message:
          "Too many requests. Please wait before requesting another code.",
      });
    }

    // Call the external API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: "Verification code sent successfully!",
      });
    } else {
      // Handle specific error cases
      let errorMessage =
        "Failed to resend verification code. Please try again.";

      if (response.status === 404) {
        errorMessage = "Email not found. Please register first.";
      } else if (response.status === 429) {
        errorMessage = "Please wait before requesting another code.";
      } else if (response.status === 400) {
        errorMessage = data.message || "Invalid request.";
      }

      return res.status(response.status).json({
        success: false,
        message: errorMessage,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
}
