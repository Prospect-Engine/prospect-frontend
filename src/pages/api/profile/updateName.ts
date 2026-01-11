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

      const { name } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const params: ApiPropsType = {
        url: "/profile/update",
        method: "post",
        body: {
          name,
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
