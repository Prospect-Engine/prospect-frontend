import { NextApiRequest, NextApiResponse } from "next/types";
import { setCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Clear both access and refresh tokens
    setCookie("access_token", "", {
      req,
      res,
      maxAge: 0,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    setCookie("refresh_token", "", {
      req,
      res,
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res
      .status(200)
      .json({ message: "You have successfully logged out!" });
  } catch (err) {
    return res.status(500).json({ error: "Failed to logout" });
  }
}
