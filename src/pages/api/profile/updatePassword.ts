import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    try {
      const access_token = getCookie("access_token", { req, res });

      // Handle Promise case for newer cookies-next version (v6+)
      const tokenString =
        access_token instanceof Promise ? await access_token : access_token;

      //

      if (!tokenString) {
        return res.status(401).json({
          message: "Authentication required. Please login again.",
          status_code: 401,
          time: new Date().toISOString(),
        });
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate required fields
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          message:
            "Current password, new password, and confirm password are required",
        });
      }

      // Validate password length
      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ message: "New password must be at least 8 characters long" });
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        return res
          .status(400)
          .json({ message: "New password and confirm password do not match" });
      }

      const params: ApiPropsType = {
        url: "/profile/update-password",
        method: "post",
        body: {
          currentPassword,
          newPassword,
          confirmPassword,
        },
        headers: {
          Authorization: `Bearer ${tokenString}`,
        },
      };

      const { data, status } = await apiCall(params);
      return res.status(status).json(data);
    } catch (error) {
      res.status(500).json({
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
