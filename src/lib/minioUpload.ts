import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
  PutBucketLifecycleConfigurationCommand,
} from "@aws-sdk/client-s3";

interface UploadResponse {
  url: string;
  success: boolean;
  error?: string;
}

interface IntegrationResponse {
  integration_id: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const RETENTION_DAYS = 180;
const bucketName = process.env.NEXT_PUBLIC_MINIO_BUCKET || "redmagic-bucket";

// Initialize S3 Client for MinIO
const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.NEXT_PUBLIC_MINIO_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_MINIO_ID || "",
    secretAccessKey: process.env.NEXT_PUBLIC_MINIO_KEY || "",
  },
  forcePathStyle: true, // Required for MinIO
});

/**
 * Get user's integration ID from backend
 */
const getIntegrationId = async (access_token: string): Promise<string> => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;

  try {
    const response = await fetch(`${url}/api/user/integration`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Integration endpoint not available");
    }

    const data: IntegrationResponse = await response.json();
    //
    return data.integration_id;
  } catch (error) {
    // Fallback to extracting user ID from JWT token
    try {
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      const userId =
        payload.user_id || payload.sub || payload.id || "default-user";
      //
      return userId;
    } catch (tokenError) {
      return "default-user";
    }
  }
};

/**
 * Setup bucket lifecycle policies for automatic cleanup
 */
const setupBucketLifecycle = async () => {
  try {
    const command = new PutBucketLifecycleConfigurationCommand({
      Bucket: bucketName,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: "DeleteAfter180Days",
            Status: "Enabled",
            Filter: { Prefix: "" },
            Expiration: { Days: RETENTION_DAYS },
          },
        ],
      },
    });
    await s3Client.send(command);
    //
  } catch (error) {}
};

/**
 * Create bucket if it doesn't exist
 */
const createBucketIfNotExists = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    //
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      //

      try {
        // Create bucket
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));

        // Set public access policy
        await s3Client.send(
          new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Sid: "PublicReadGetObject",
                  Effect: "Allow",
                  Principal: "*",
                  Action: ["s3:GetObject"],
                  Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
              ],
            }),
          })
        );

        // Setup lifecycle rules
        await setupBucketLifecycle();

        //
      } catch (createError) {
        throw createError;
      }
    } else {
      throw error;
    }
  }
};

/**
 * Main upload function
 * @param data - Base64 encoded file data
 * @param name - Original file name
 * @param access_token - JWT access token
 * @param folder - Folder path (e.g., 'linkedin/message/inbox')
 */
const uploadToMinio = async (
  data: string,
  name: string,
  access_token: string,
  folder: string
): Promise<UploadResponse> => {
  try {
    //

    // Validate inputs
    if (!data || !name || !access_token) {
      return {
        url: "",
        success: false,
        error: "Missing required parameters for file upload",
      };
    }

    // Get integration ID
    const integrationId = await getIntegrationId(access_token);
    //

    // Ensure bucket exists
    await createBucketIfNotExists();

    // Verify bucket exists
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));

    // Parse base64 data and extract MIME type
    const [mimeInfo, base64Data] = data.includes(",")
      ? data.split(",")
      : ["", data];
    let mimeType = "application/octet-stream";

    if (mimeInfo) {
      const mimeMatch = mimeInfo.match(/:(.*?);/);
      if (mimeMatch && mimeMatch[1]) {
        mimeType = mimeMatch[1];
      }
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      return {
        url: "",
        success: false,
        error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
      };
    }

    //

    // Generate unique filename
    const randomStr = Math.random().toString(36).substring(7);
    const timestamp = Date.now();
    const extension = name.includes(".")
      ? name.substring(name.lastIndexOf("."))
      : "";
    const fileName = `file-${timestamp}-${randomStr}${extension}`;

    // Create folder structure: folder/integrationId/
    const folderPath = `${folder}/${integrationId}/`;
    const fileKey = `${folderPath}${fileName}`.replace(/\/+/g, "/");

    //

    // Create folder marker (optional, helps with organization)
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: folderPath,
          Body: "",
          ContentType: "application/x-directory",
        })
      );
    } catch (error) {
      // Folder creation failure is not critical
    }

    // Upload file with explicit content length to avoid Stream warning
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: buffer.length, // Specify content length to avoid AWS SDK warning
      ACL: "public-read",
      Metadata: {
        originalName: name,
        uploadedAt: new Date().toISOString(),
        integrationId: integrationId,
      },
    });

    await s3Client.send(command);

    // Construct file URL (use CDN if configured)
    const cdnUrl =
      process.env.NEXT_PUBLIC_CDN_URL || process.env.NEXT_PUBLIC_MINIO_ENDPOINT;
    const fileUrl = `${cdnUrl}/${bucketName}/${fileKey}`;

    //

    return {
      url: fileUrl,
      success: true,
    };
  } catch (error) {
    return {
      url: "",
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
};

export default uploadToMinio;
