/**
 * API Route: Send Voice Message
 *
 * Proxies voice message uploads to the backend unified inbox endpoint.
 * Accepts multipart/form-data with audio file.
 */

import { NextApiRequest, NextApiResponse } from "next";
import { getCookie } from "cookies-next";
import formidable from "formidable";
import fs from "fs";

// Disable Next.js body parsing to handle multipart form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Backend base URL
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3000/white-walker/v1";

interface ParsedFormData {
  audioFile: formidable.File | null;
  conversationUrnId: string;
  integrationId: string;
  text?: string;
  audioDuration?: number;
}

async function parseMultipartForm(
  req: NextApiRequest
): Promise<ParsedFormData> {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: 25 * 1024 * 1024, // 25MB limit
      keepExtensions: true,
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      // Handle fields (formidable v3 returns arrays)
      const getFieldValue = (field: string | string[] | undefined): string =>
        Array.isArray(field) ? field[0] : field || "";

      resolve({
        audioFile: Array.isArray(files.audio)
          ? files.audio[0]
          : files.audio || null,
        conversationUrnId: getFieldValue(fields.conversationUrnId),
        integrationId: getFieldValue(fields.integrationId),
        text: getFieldValue(fields.text) || undefined,
        audioDuration: fields.audioDuration
          ? Number(getFieldValue(fields.audioDuration))
          : undefined,
      });
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get auth token
    const accessToken = getCookie("access_token", { req, res });
    const tokenString =
      accessToken instanceof Promise ? await accessToken : accessToken;

    if (!tokenString || typeof tokenString !== "string") {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // Parse multipart form data
    const { audioFile, conversationUrnId, integrationId, text, audioDuration } =
      await parseMultipartForm(req);

    // Validate required fields
    if (!audioFile) {
      return res.status(400).json({
        success: false,
        error: "Audio file is required",
      });
    }

    if (!conversationUrnId) {
      return res.status(400).json({
        success: false,
        error: "Conversation URN ID is required",
      });
    }

    if (!integrationId) {
      return res.status(400).json({
        success: false,
        error: "Integration ID is required",
      });
    }

    // Build form data for backend
    const formData = new FormData();

    // Read file and append to form data
    const fileBuffer = fs.readFileSync(audioFile.filepath);
    const audioBlob = new Blob([fileBuffer], {
      type: audioFile.mimetype || "audio/webm",
    });
    formData.append(
      "audio",
      audioBlob,
      audioFile.originalFilename || "voice_message.webm"
    );
    formData.append("conversationUrnId", conversationUrnId);

    if (text) {
      formData.append("text", text);
    }

    if (audioDuration) {
      formData.append("audioDuration", String(audioDuration));
    }

    // Forward to backend
    const backendUrl = `${BACKEND_URL}/unified-inbox/send-voice/${integrationId}`;

    const backendResponse = await fetch(backendUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenString}`,
      },
      body: formData,
    });

    // Clean up temp file
    try {
      fs.unlinkSync(audioFile.filepath);
    } catch {
      // Ignore cleanup errors
    }

    const data = await backendResponse.json();

    return res.status(backendResponse.status).json(data);
  } catch (error) {
    console.error("Send voice message error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
}
