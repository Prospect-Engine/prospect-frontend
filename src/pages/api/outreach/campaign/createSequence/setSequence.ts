import type { NextApiRequest, NextApiResponse } from "next/types";
import campaignConfig from "@/configs/server-config/campaign";
import { apiCall, ApiPropsType } from "@/lib/apiCall";
import { unwrapAshbornResponse } from "@/lib/unwrapAshbornResponse";
import { getCookie } from "cookies-next";
import uploadToMinio from "@/lib/minioUpload";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

interface SequenceNode {
  id: number | string;
  type: string;
  name: string;
  data: {
    message_template?: string;
    alternative_message?: string;
    attachments?: ProcessedAttachment[];
    delay_unit?: string;
    delay_value?: number;
    [key: string]: any;
  };
}

interface RawAttachment {
  data: string;
  name: string;
  type: string;
}

interface ProcessedAttachment {
  url: string;
  name: string;
  type: string;
}

interface DiagramNode {
  id: string;
  data: {
    value?: {
      message?: string;
      alternativeMessage?: string;
      attachments?: (RawAttachment | ProcessedAttachment)[];
      label?: string;
      icon?: string;
      [key: string]: any;
    };
    command?: string;
    [key: string]: any;
  };
  type?: string;
  position?: { x: number; y: number };
  [key: string]: any;
}

interface Diagram {
  nodes: DiagramNode[];
  edges?: any[];
  [key: string]: any;
}

// PUT /api/outreach/campaign/createSequence/setSequence
// Enhanced version with file attachment support and MinIO integration
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    res.setHeader("Allow", ["PUT"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { campaignId, payload } = req.body || {};
    if (!campaignId || !payload) {
      return res
        .status(400)
        .json({ message: "campaignId and payload are required" });
    }

    const { sequence_type, sequence, template_id, diagram } = payload;
    const access_token = getCookie("access_token", { req, res });
    const tokenString =
      access_token instanceof Promise ? await access_token : access_token;
    if (!tokenString) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Convert sequence node IDs to strings
    const updatedSequence = sequence.map((node: SequenceNode) => ({
      ...node,
      id: String(node.id),
    }));

    // Create a map of sequence nodes for easy access
    const sequenceNodesMap = new Map<string, SequenceNode>(
      updatedSequence.map((node: SequenceNode) => [node.id, node])
    );

    // Process diagram nodes and update attachments
    const updatedDiagram: Diagram = {
      ...diagram,
      nodes: await Promise.all(
        diagram.nodes.map(async (node: DiagramNode) => {
          if (node.data?.value?.attachments?.length) {
            const processedAttachments: ProcessedAttachment[] = [];

            // Process each attachment
            for (const attachment of node.data.value.attachments) {
              if ("data" in attachment) {
                const { url, success, error } = await uploadToMinio(
                  attachment.data,
                  attachment.name,
                  tokenString,
                  "linkedin/message/campaign" as const
                );

                if (!success) {
                  throw new Error(error);
                }

                processedAttachments.push({
                  url,
                  type: attachment.type,
                  name: attachment.name,
                });
              } else {
                // Already processed attachment
                processedAttachments.push(attachment);
              }
            }

            // Update corresponding sequence node if it exists
            const sequenceNode = sequenceNodesMap.get(node.id);
            if (sequenceNode && node.data.command === "MESSAGE") {
              sequenceNode.data = {
                ...sequenceNode.data,
                message_template: node.data.value.message || "",
                alternative_message: node.data.value.alternativeMessage || "",
                attachments: processedAttachments,
              };
            }

            // Return updated diagram node
            return {
              ...node,
              data: {
                ...node.data,
                value: {
                  ...node.data.value,
                  attachments: processedAttachments,
                },
              },
            };
          }
          return node;
        })
      ),
    };

    // Create final sequence with updated nodes
    const finalSequence = updatedSequence.map(
      (node: SequenceNode) => sequenceNodesMap.get(String(node.id)) || node
    );

    const body = {
      sequence_type,
      sequence: finalSequence,
      diagram: updatedDiagram,
      ...(template_id && { template_id }),
    };

    const url = `${campaignConfig.getCampaignsEndpoint}/${encodeURIComponent(campaignId)}/sequence`;
    const params: ApiPropsType = {
      url,
      method: "put",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenString}`,
      },
      body,
    };

    const { data, status } = await apiCall(params);
    return res.status(status).json(unwrapAshbornResponse(data));
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error occurred",
    });
  }
}
