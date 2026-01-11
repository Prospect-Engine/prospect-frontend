import type { NextApiRequest, NextApiResponse } from "next";

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  promo_code?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    user_id: string;
    email: string;
    name: string;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
    });
  }

  try {
    const { name, email, password, promo_code }: RegisterRequest = req.body;

    // Normalize email to lowercase and trim whitespace
    const normalizedEmail = email.toLowerCase().trim();

    // Validate required fields
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/signup/initiate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
          password,
          promo_code: promo_code || null,
          plan_code: "BASIC",
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message:
          "Registration successful. Please check your email for verification code.",
        data: {
          user_id: data.user_id || "",
          email: normalizedEmail,
          name: name,
        },
      });
    } else {
      let errorMessage = "Registration failed. Please try again.";

      if (response.status === 409) {
        errorMessage = "An account with this email already exists.";
      } else if (response.status === 400) {
        errorMessage = data.message || "Invalid registration data.";
      } else if (response.status === 422) {
        errorMessage =
          data.message || "Validation failed. Please check your input.";
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
