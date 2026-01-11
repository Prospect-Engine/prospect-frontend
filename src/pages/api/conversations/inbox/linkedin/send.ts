import { apiCall, ApiPropsType } from "@/lib/apiCall";
// import uploadFile from "@/lib/uploadFile";
import { NextApiRequest, NextApiResponse, NextConfig } from "next/types";
import { getCookie } from "cookies-next";
import urlConfig from "@/configs/server-config/conversation";
import uploadToMinio from "@/lib/minioUpload";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;

    // Enhanced token validation
    if (
      !tokenString ||
      typeof tokenString !== "string" ||
      tokenString.trim() === ""
    ) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Invalid or missing access token",
      });
    }
    const body = req.body;
    const { message, conversationUrn, attachments, selectedUserId } = body;

    // Handle file attachments if any
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      //

      // Validate attachment count
      if (attachments.length > 5) {
        return res.status(400).json({
          error: "Too many attachments",
          message: "Maximum 5 attachments allowed per message",
        });
      }

      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];

        // Validate file data
        if (!file.data || !file.name) {
          return res.status(400).json({
            error: "Invalid attachment",
            message: `Attachment ${i + 1} is missing required data`,
          });
        }

        // Validate file type
        const allowedTypes = [
          // Images
          "image/gif",
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/svg+xml",
          "image/bmp",
          // Videos
          "video/mp4",
          "video/mpeg",
          "video/quicktime",
          "video/x-msvideo",
          "video/webm",
          // Audio
          "audio/mpeg",
          "audio/mp3",
          "audio/wav",
          "audio/ogg",
          "audio/webm",
          "audio/aac",
          // Documents
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "text/plain",
          "text/csv",
          "application/json",
          // Archives
          "application/zip",
          "application/x-rar-compressed",
          "application/x-7z-compressed",
        ];

        if (file.type && !allowedTypes.includes(file.type.toLowerCase())) {
          return res.status(400).json({
            error: "Unsupported file type",
            message: `File "${file.name}" has an unsupported type: ${file.type}`,
            file: file.name,
            type: file.type,
          });
        }

        //

        const { url, success, error } = await uploadToMinio(
          file.data,
          file.name,
          tokenString,
          "linkedin/message/inbox"
        );

        if (!success) {
          return res.status(500).json({
            error: "File upload failed",
            message: error || `Failed to upload ${file.name}`,
            file: file.name,
          });
        }

        //

        attachments[i] = {
          url,
          type: file.type,
          name: file.name,
        };
      }

      //
    }

    // Validate that we have either a message or attachments
    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({
        error: "Invalid request",
        message: "Please provide either a message or attachments",
      });
    }

    // If sending only attachments (no text), provide a descriptive message
    // Backend requires message content, so we auto-generate one for attachments-only
    let messageContent = message;

    if (!message && attachments && attachments.length > 0) {
      // Generate a friendly message describing the attachments
      const fileNames = attachments.map((att: any) => att.name).join(", ");
      const fileCount = attachments.length;

      if (fileCount === 1) {
        messageContent = `📎 Shared a file: ${fileNames}`;
      } else {
        messageContent = `📎 Shared ${fileCount} files: ${fileNames}`;
      }

      //
    }

    let requestBody;

    // If a user is selected, include recipient_id
    if (selectedUserId) {
      requestBody = {
        message: messageContent,
        conversation_urn_id: conversationUrn,
        attachments: attachments || [],
        selected_member_id: selectedUserId,
      };
    } else {
      // For owner's chat box
      requestBody = {
        message: messageContent,
        conversation_urn_id: conversationUrn,
        attachments: attachments || [],
        selected_member_id: selectedUserId,
      };
    }

    const params: ApiPropsType = {
      url: `${urlConfig.listEndpoint}/linkedin/send-message`,
      method: "post",
      body: requestBody,
      applyDefaultDomain: true,
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
    };

    // Debug: Log the request details
    //

    const { data, status } = await apiCall(params);
    //
    return res.status(status).json(data);
  } catch (err) {
    return res.status(500).json({ err });
  }
}
