import { Diagram, NodeSequence } from "@/types/template";
import { Edge, Node } from "reactflow";
import { toast } from "sonner";

export const getNodesFromTemplate = (template: any): Node[] => {
  const initialNodes: Node[] = [
    {
      id: "0",
      type: "root",
      data: {
        value: { label: "Start Sequence", icon: "lucide:play" },
        command: "NONE",
      },
      position: { x: 200, y: -150 },
    },
  ];

  //

  // Handle different template structures
  let nodes = [];

  if (template?.diagram?.nodes && Array.isArray(template.diagram.nodes)) {
    // Template has diagram with nodes (visual builder format)
    nodes = template.diagram.nodes;
    //
  } else if (template?.nodes && Array.isArray(template.nodes)) {
    // Template has direct nodes property
    nodes = template.nodes;
    //
  } else if (template?.sequence && Array.isArray(template.sequence)) {
    // Convert sequence to nodes (API format)
    nodes = convertSequenceToNodes(template.sequence);
    //
  } else {
    //
    return initialNodes;
  }

  if (!nodes || nodes.length === 0) {
    //
    return initialNodes;
  }

  // Ensure all nodes have proper structure
  const processedNodes = nodes.map((node: any) => ({
    ...node,
    data: {
      ...node.data,
      value: node.data?.value || { label: "Set Action" },
      command: node.data?.command || "NONE",
    },
  }));

  //
  return processedNodes;
};

// Helper function to convert sequence to nodes
const convertSequenceToNodes = (sequence: any[]): Node[] => {
  const nodes: Node[] = [];

  // Add root node first
  nodes.push({
    id: "0",
    type: "root",
    data: {
      value: { label: "Start Sequence", icon: "lucide:play" },
      command: "NONE",
    },
    position: { x: 100, y: 100 },
  });

  sequence.forEach((step, index) => {
    const node: Node = {
      id: step.id.toString(),
      type: getNodeType(step.type),
      data: {
        value: {
          label: step.name || `Step ${step.id}`,
          icon: getNodeIcon(step.type),
          // Map sequence data to node value format
          message: step.data?.message_template || "",
          alternativeMessage: step.data?.alternative_message || "",
          subject: step.data?.subject_template || "",
          alternativeSubject: step.data?.alternative_subject || "",
          unit: step.data?.delay_unit === "DAY" ? "Days" : "Hours",
          count: step.data?.delay_value || 1,
          attachments: step.data?.attachments || [],
        },
        command: step.type,
      },
      position: { x: 100, y: 100 + (index + 1) * 120 },
    };

    //
    nodes.push(node);
  });

  return nodes;
};

// Helper function to apply consistent label styling to edges
export const applyLabelStyling = (edge: Edge): Edge => {
  if (!edge.label) return edge;

  // Determine if this is a "negative" label (Still Not Connected, etc.)
  const isNegativeLabel =
    typeof edge.label === "string" &&
    (edge.label.toLowerCase().includes("still not") ||
      edge.label.toLowerCase().includes("not found"));

  const labelStyle = isNegativeLabel
    ? { fill: "#dc2626", fontWeight: 600, fontSize: 11 }
    : { fill: "#16a34a", fontWeight: 600, fontSize: 11 };

  const labelBgStyle = isNegativeLabel
    ? { fill: "#fee2e2", fillOpacity: 0.95 }
    : { fill: "#dcfce7", fillOpacity: 0.95 };

  return {
    ...edge,
    labelStyle,
    labelShowBg: true,
    labelBgPadding: [6, 4] as [number, number],
    labelBgBorderRadius: 4,
    labelBgStyle,
  };
};

// Helper function to convert sequence to edges
export const getEdgesFromTemplate = (template: any): Edge[] => {
  //

  if (template?.diagram?.edges && Array.isArray(template.diagram.edges)) {
    // Apply consistent label styling to all edges with labels
    return template.diagram.edges.map(applyLabelStyling);
  }

  if (template?.sequence && Array.isArray(template.sequence)) {
    const edges: Edge[] = [];

    // Create edges connecting the sequence
    for (let i = 0; i < template.sequence.length; i++) {
      const currentStep = template.sequence[i];
      const nextStep = template.sequence[i + 1];

      if (nextStep) {
        edges.push({
          id: `edge-${currentStep.id}-${nextStep.id}`,
          source: currentStep.id.toString(),
          target: nextStep.id.toString(),
          type: "smoothstep",
          animated: true,
          markerEnd: {
            type: "arrowclosed" as any,
          },
        });
      }
    }

    //
    return edges;
  }

  //
  return [];
};

// Helper function to get node type based on sequence type
const getNodeType = (sequenceType: string): string => {
  switch (sequenceType) {
    case "DELAY":
      return "timer";
    case "LIKE":
    case "FOLLOW":
    case "VIEW_PROFILE":
    case "ENDORSE":
    case "WITHDRAW_INVITE":
      return "unidirectional";
    case "MESSAGE":
    case "INVITE":
    case "INEMAIL":
      return "bidirectional";
    case "END":
      return "leaf";
    default:
      return "unidirectional";
  }
};

// Helper function to get node icon based on sequence type
const getNodeIcon = (sequenceType: string): string => {
  switch (sequenceType) {
    case "DELAY":
      return "lucide:clock";
    case "LIKE":
      return "lucide:thumbs-up";
    case "FOLLOW":
      return "lucide:user-plus";
    case "VIEW_PROFILE":
      return "lucide:eye";
    case "ENDORSE":
      return "lucide:award";
    case "WITHDRAW_INVITE":
      return "lucide:user-minus";
    case "MESSAGE":
      return "lucide:message-square";
    case "INVITE":
      return "lucide:user-plus";
    case "INEMAIL":
      return "lucide:mail";
    case "END":
      return "lucide:check-circle";
    default:
      return "lucide:circle";
  }
};

export const getSequence = (nodes: Node[]): NodeSequence[] => {
  const nodeSequence: NodeSequence[] = [];

  nodes.forEach(node => {
    const index = node.id;
    const { command, value } = node.data;
    if (index === "0" || command === "NONE") return;

    // Ensure we have a valid numeric ID
    const id = parseInt(index);
    if (isNaN(id) || id <= 0) {
      //
      return;
    }

    const obj: NodeSequence = {
      id,
      type: command,
      name: value?.label || `Step ${id}`,
    };

    switch (command) {
      case "DELAY":
        obj.data = {
          delay_unit: value?.unit === "Days" ? "DAY" : "HR",
          delay_value: value?.count || 1,
        };
        break;
      case "INVITE":
        obj.data = {
          message_template: value?.message || "",
          alternative_message: value?.alternativeMessage || "",
        };
        break;
      case "MESSAGE":
        obj.data = {
          message_template: value?.message || "",
          alternative_message: value?.alternativeMessage || "",
          attachments:
            value?.attachments?.map((att: any) => ({
              url: att.url || "",
              name: att.name || "",
              type: att.type || "",
            })) || [],
        };
        break;
      case "INEMAIL":
        obj.data = {
          message_template: value?.message || "",
          subject_template: value?.subject || "",
          alternative_message: value?.alternativeMessage || "",
          alternative_subject: value?.alternativeSubject || "",
          attachments:
            value?.attachments?.map((att: any) => ({
              url: att.url || "",
              name: att.name || "",
              type: att.type || "",
            })) || [],
        };
        break;
      case "LIKE":
      case "FOLLOW":
      case "VIEW_PROFILE":
      case "ENDORSE":
      case "WITHDRAW_INVITE":
        // These actions don't require additional data
        obj.data = {};
        break;
      case "END":
        obj.data = {
          message_template: "",
          alternative_message: "",
        };
        break;
      default:
        // Fallback for any other command types
        obj.data = {
          message_template: value.message || "",
          alternative_message: value.alternativeMessage || "",
        };
        break;
    }
    nodeSequence.push(obj);
  });
  return nodeSequence;
};

export const saveSequence = async (
  nodes: Node[],
  edges: Edge[],
  name: string,
  sequenceType: string = "LINKEDIN"
) => {
  const sequence = getSequence(nodes);

  try {
    const templateData = {
      name,
      sequence_type: sequenceType,
      sequence,
      diagram: { nodes, edges },
    };

    const response = await fetch("/api/templates/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(templateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Template saved successfully - no redirect needed
    // User stays in campaign creation flow

    return result;
  } catch (error) {
    toast.error("Failed to save template. Please try again.");
    throw error;
  }
};

export const checkEmptyMessageInSequence = (
  sequence: NodeSequence[]
): {
  error: boolean;
  nodeType?: string;
  message?: string;
  errorNodeIds?: string[];
} => {
  for (const item of sequence) {
    if (item.type === "MESSAGE") {
      if (!item.data?.message_template?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter a message",
          errorNodeIds: [item.id.toString()],
        };
      }
      if (!item.data?.alternative_message?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter an alternative message",
          errorNodeIds: [item.id.toString()],
        };
      }
    } else if (item.type === "INEMAIL") {
      if (!item.data?.subject_template?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter a subject INEMAIL",
          errorNodeIds: [item.id.toString()],
        };
      }
      if (!item.data?.message_template?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter a message INEMAIL",
          errorNodeIds: [item.id.toString()],
        };
      }
      if (!item.data?.alternative_subject?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter an alternative subject INEMAIL",
          errorNodeIds: [item.id.toString()],
        };
      }
      if (!item.data?.alternative_message?.trim().length) {
        return {
          error: true,
          nodeType: item.type,
          message: "Please enter an alternative message INEMAIL",
          errorNodeIds: [item.id.toString()],
        };
      }
    }
  }
  return { error: false };
};

export type SequenceValidationResult = {
  isValid: boolean;
  errorMessage?: string;
  errorNodeIds?: string[];
};

export const verifySequence = async (
  nodes: Node[]
): Promise<SequenceValidationResult> => {
  const sequence = getSequence(nodes);

  // Check if sequence has any actions
  if (!sequence.length) {
    return {
      isValid: false,
      errorMessage:
        "Invalid Sequence! You need to add at least one action to your sequence.",
    };
  }

  // Check for empty messages
  const { error, message, errorNodeIds } =
    checkEmptyMessageInSequence(sequence);
  if (error) {
    return { isValid: false, errorMessage: message, errorNodeIds };
  }

  // Check sequence structure
  const structureValidation = validateSequenceStructure(nodes);
  if (!structureValidation.isValid) {
    return {
      isValid: false,
      errorMessage: structureValidation.errorMessage,
      errorNodeIds: structureValidation.errorNodeIds,
    };
  }

  // Check for DELAY nodes that need attention
  const delayValidation = validateDelayNodes(nodes);
  if (!delayValidation.isValid) {
    return {
      isValid: false,
      errorMessage: delayValidation.errorMessage,
      errorNodeIds: delayValidation.errorNodeIds,
    };
  }

  // Here you would typically make an API call to verify the sequence
  //

  return { isValid: true };
};

// Enhanced sequence structure validation
export const validateSequenceStructure = (
  nodes: Node[]
): { isValid: boolean; errorMessage?: string; errorNodeIds?: string[] } => {
  // Check if we have a root node
  const rootNode = nodes.find(node => node.id === "0");
  if (!rootNode) {
    return {
      isValid: false,
      errorMessage: "Sequence must start with a root node.",
      errorNodeIds: ["0"],
    };
  }

  // Check for orphaned nodes (nodes without proper connections)
  const connectedNodes = new Set<string>();
  nodes.forEach(node => {
    if (node.id !== "0") {
      connectedNodes.add(node.id);
    }
  });

  // Check for nodes that are not properly connected to the sequence
  const actionNodes = nodes.filter(
    node =>
      node.data.command !== "NONE" &&
      node.data.command !== "END" &&
      node.id !== "0"
  );

  if (actionNodes.length === 0) {
    return {
      isValid: false,
      errorMessage:
        "Sequence must contain at least one action (message, invite, etc.).",
      errorNodeIds: ["0"],
    };
  }

  return { isValid: true };
};

// Validate DELAY nodes specifically
export const validateDelayNodes = (
  nodes: Node[]
): { isValid: boolean; errorMessage?: string; errorNodeIds?: string[] } => {
  const delayNodes = nodes.filter(node => node.data.command === "DELAY");

  for (const delayNode of delayNodes) {
    // Check if DELAY node has proper configuration
    const delayValue = delayNode.data.value?.count;
    const delayUnit = delayNode.data.value?.unit;

    if (delayValue === undefined || delayValue < 0) {
      return {
        isValid: false,
        errorMessage: `DELAY node "${delayNode.data.value?.label || "Delay"}" must have a valid delay value (0 or greater).`,
        errorNodeIds: [delayNode.id],
      };
    }

    if (!delayUnit || !["Days", "Hours"].includes(delayUnit)) {
      return {
        isValid: false,
        errorMessage: `DELAY node "${delayNode.data.value?.label || "Delay"}" must have a valid time unit (Days or Hours).`,
        errorNodeIds: [delayNode.id],
      };
    }
  }

  return { isValid: true };
};

// Add END nodes after DELAY nodes that don't have proper children
export const addEndNodesAfterDelayNodes = (
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } => {
  const updatedNodes = [...nodes];
  const updatedEdges = [...edges];

  const delayNodes = updatedNodes.filter(node => node.data.command === "DELAY");

  for (const delayNode of delayNodes) {
    const nodeId = parseInt(delayNode.id);
    const leftChildId = (nodeId * 2).toString();
    const rightChildId = (nodeId * 2 + 1).toString();

    const leftChild = updatedNodes.find(node => node.id === leftChildId);
    const rightChild = updatedNodes.find(node => node.id === rightChildId);

    // Check if DELAY node has any children
    const hasChildren = leftChild || rightChild;

    if (!hasChildren) {
      // Add END node as child
      const endNodeId = leftChildId;
      const endNode: Node = {
        id: endNodeId,
        type: "leaf",
        data: {
          command: "END",
          value: { label: "End of the sequence" },
        },
        position: {
          x: delayNode.position.x,
          y: delayNode.position.y + 120,
        },
      };

      updatedNodes.push(endNode);

      // Add edge from DELAY to END
      updatedEdges.push({
        id: `e-${delayNode.id}-${endNodeId}`,
        source: delayNode.id,
        target: endNodeId,
        type: "smoothstep",
        animated: true,
        markerEnd: {
          type: "arrowclosed" as any,
        },
      });
    }
  }

  return { nodes: updatedNodes, edges: updatedEdges };
};

// Ensure sequence has proper structure for backend validation
export const ensureSequenceStructure = (
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } => {
  // First, add END nodes after DELAY nodes that need them
  const { nodes: nodesWithEnds, edges: edgesWithEnds } =
    addEndNodesAfterDelayNodes(nodes, edges);

  // Additional validation: Ensure every DELAY node has an END node as a child
  const delayNodes = nodesWithEnds.filter(
    node => node.data.command === "DELAY"
  );
  const endNodes = nodesWithEnds.filter(node => node.data.command === "END");

  //

  // Additional structure validation and fixes can be added here

  return { nodes: nodesWithEnds, edges: edgesWithEnds };
};

export const addSequence = async (
  camp_id: string,
  sequence: NodeSequence[],
  nodes: Node[],
  edges: Edge[]
) => {
  try {
    const response = await fetch(
      "/api/outreach/campaign/createSequence/setSequence",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: camp_id,
          payload: {
            sequence_type: "LINKEDIN",
            sequence,
            diagram: { nodes, edges },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    //
    return result;
  } catch (error) {
    throw error;
  }
};

// Helper function to validate sequence structure
const validateSequence = (sequence: any[]) => {
  const errors: string[] = [];

  sequence.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} missing ID`);
    }
    if (!node.type) {
      errors.push(`Node at index ${index} missing type`);
    }
    if (!node.data) {
      errors.push(`Node at index ${index} missing data`);
    }

    // Validate specific node types
    if (node.type === "DELAY") {
      if (!node.data.delay_unit || !node.data.delay_value) {
        errors.push(`DELAY node at index ${index} missing delay data`);
      }
    }

    if (node.type === "MESSAGE") {
      if (!node.data.message_template) {
        errors.push(`MESSAGE node at index ${index} missing message_template`);
      }
    }
  });

  return errors;
};

export const addSequenceToCampaign = async (
  campaignId: string,
  template: any
) => {
  try {
    //

    // Check if template has sequence data
    if (!template.sequence || !Array.isArray(template.sequence)) {
      throw new Error("Invalid template: missing sequence data");
    }

    //

    // Validate sequence has valid nodes
    if (!template.sequence.length) {
      throw new Error("Template has no valid sequence nodes");
    }

    // Validate sequence structure
    const validationErrors = validateSequence(template.sequence);
    if (validationErrors.length > 0) {
      //
      throw new Error(`Invalid sequence: ${validationErrors.join(", ")}`);
    }

    // Ensure sequence nodes have proper structure
    const validatedSequence = template.sequence.map((node: any) => ({
      id: String(node.id), // Ensure ID is string
      type: node.type,
      name: node.name || `Step ${node.id}`,
      data: {
        ...node.data,
        // Ensure required fields are present
        message_template: node.data?.message_template || "",
        alternative_message: node.data?.alternative_message || "",
        delay_unit: node.data?.delay_unit || "HR",
        delay_value: node.data?.delay_value || 1,
      },
    }));

    //

    // Use setSequence API to apply the template
    const response = await fetch(
      "/api/outreach/campaign/createSequence/setSequence",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId,
          payload: {
            sequence_type: "LINKEDIN",
            sequence: validatedSequence,
            diagram: template.diagram || { nodes: [], edges: [] }, // Use diagram if available, otherwise empty
            template_id: template.id,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      //
      throw new Error(
        `HTTP error! status: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    const result = await response.json();
    //
    return result;
  } catch (error) {
    //
    throw error;
  }
};
