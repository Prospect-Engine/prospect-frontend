import { NextApiRequest, NextApiResponse } from "next";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { getCookie } from "cookies-next";
import formidable from "formidable";
import fs from "fs";

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

      // Parse multipart form data
      const form = formidable({
        maxFileSize: 5 * 1024 * 1024, // 5MB limit
        filter: ({ mimetype }) => {
          return Boolean(mimetype && mimetype.includes("image"));
        },
      });

      const [fields, files] = await form.parse(req);
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!file) {
        return res.status(400).json({ message: "Image file is required" });
      }

      // Read the file
      const fileBuffer = fs.readFileSync(file.filepath);

      // Create FormData for the API call
      const formData = new FormData();
      formData.append(
        "file",
        new Blob([fileBuffer]),
        file.originalFilename || "image.jpg"
      );

      const params: ApiPropsType = {
        url: "/profile/update-image",
        method: "post",
        body: formData,
        headers: {
          Authorization: `Bearer ${tokenString}`,
          // Don't set Content-Type, let it be set automatically for FormData
        },
      };

      const { data, status } = await apiCall(params);

      // Clean up the temporary file
      fs.unlinkSync(file.filepath);

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
