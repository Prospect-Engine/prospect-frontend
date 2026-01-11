import {
  NodeInfo,
  MenueItemType,
  NodeType,
  SequenceEdge,
} from "@/types/template";
import { Dispatch, SetStateAction } from "react";
import { Node, OnConnect, Edge } from "reactflow";
import { TIMER_WIDTH, NODE_WIDTH, X_DISTANCE_OF_CHILD } from "./options";

// Creates a leaf node of a parent node
export const createNode = (
  parentNode: NodeInfo,
  childNumber: 0 | 1,
  option: MenueItemType
): {
  newNodes: Node[];
  newEdges: SequenceEdge[];
} => {
  let parent: NodeInfo = { ...parentNode };

  const newNodes: Node[] = [];
  const newEdges: SequenceEdge[] = [];

  const createNode: NodeType[] = ["timer", "leaf"];
  createNode.forEach((type: NodeType) => {
    if (type === "timer" && parent.id === "0") return;

    let xAdjustment = 0;
    const yAdjustment = 120;
    if (parent.type !== "timer") {
      xAdjustment = type === "timer" ? (NODE_WIDTH - TIMER_WIDTH) / 2 : 0;
    } else {
      xAdjustment = (TIMER_WIDTH - NODE_WIDTH) / 2;
    }
    const id = (
      parseInt(parent.id) * 2 +
      (parent.type === "timer" ? 0 : childNumber)
    ).toString();
    const newNode: NodeInfo = {
      id: id === "0" ? "1" : id,
      type,
      data:
        type === "timer"
          ? {
              command: "DELAY",
              value: {
                label: "Delay",
                count: 0,
                unit: "Days",
              },
            }
          : { command: "NONE", value: null },
      position: {
        x: parent.position.x + xAdjustment,
        y: parent.position.y + yAdjustment,
      },
    };

    let sourceHandle = "bottom";
    if (parent.type === "bidirectional") {
      sourceHandle = childNumber === 0 ? "left" : "right";
      newNode.position.x =
        newNode.position.x + (childNumber === 0 ? -1 : 1) * X_DISTANCE_OF_CHILD;
    }
    let label = "";
    let labelStyle: Record<string, string | number> = {
      fill: "#16a34a",
      fontWeight: 600,
      fontSize: 11,
    };
    let labelBgStyle: Record<string, string | number> = {
      fill: "#dcfce7",
      fillOpacity: 0.9,
    };
    if (parentNode.type === "bidirectional") {
      if (parent.type === "timer" && !childNumber) {
        labelStyle = {
          ...labelStyle,
          fill: "#dc2626",
        };
        labelBgStyle = {
          fill: "#fee2e2",
          fillOpacity: 0.9,
        };
        if (option.verdict) label = option.verdict[childNumber];
      } else if (parent.type !== "timer" && childNumber)
        if (option.verdict) label = option.verdict[childNumber];
    }

    const edgeParam: SequenceEdge = {
      source: parent.id,
      target: newNode.id,
      sourceHandle,
      targetHandle: "top",
      label,
      labelStyle,
      labelShowBg: true,
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle,
    };
    parent = { ...newNode };
    newNodes.push(newNode);
    newEdges.push(edgeParam);
  });
  return { newNodes, newEdges };
};

export const createChild = (
  option: MenueItemType,
  parentNode: NodeInfo,
  setNodes: Dispatch<SetStateAction<Node[]>>,
  onConnect: OnConnect
) => {
  setNodes((prevNodes: Node[]) => {
    const edgeParams: SequenceEdge[] = [];
    const newNodes: Node[] = prevNodes.filter((currentNode: Node) => {
      if (parentNode.id === currentNode.id) return true;
      return !isSuccessor(parseInt(parentNode.id), parseInt(currentNode.id));
    });

    const needToUplift = newNodes.length === prevNodes.length;

    let parent: NodeInfo | Node = { ...parentNode };
    if (parent.id === "0") {
      const { newNodes: childs, newEdges } = createNode(
        parent as NodeInfo,
        0,
        option
      );
      newNodes.push(...childs);
      edgeParams.push(...newEdges);
      parent = { ...childs[0] };
    }

    parent = newNodes.find(node => node.id === parent.id) as NodeInfo;

    if (parent) {
      // Create a new parent node object to avoid mutation
      const updatedParent = {
        ...parent,
        type:
          option.action === "CreateSingleChild"
            ? "unidirectional"
            : "bidirectional",
        data: {
          command: option.command,
          value: { label: option.title, icon: option.icon },
        },
      };

      // Update the parent in the newNodes array
      const parentIndex = newNodes.findIndex(node => node.id === parent.id);
      if (parentIndex !== -1) {
        newNodes[parentIndex] = updatedParent;
        parent = updatedParent;
      }
      const numberOfChild = option.action === "CreateSingleChild" ? 1 : 2;

      for (
        let childNumber: 0 | 1 = 0;
        childNumber < numberOfChild;
        childNumber++
      ) {
        const { newNodes: childs, newEdges } = createNode(
          parent as NodeInfo,
          childNumber as 0 | 1,
          option
        );
        newNodes.push(...childs);
        edgeParams.push(...newEdges);
      }
    }

    if (needToUplift) upliftAllNodes(newNodes);
    edgeParams.forEach(param => onConnect(param));
    return newNodes;
  });
};

const isSuccessor = (parent: number, child: number): boolean => {
  if (child < parent) return false;
  if (parent === child) return true;
  return isSuccessor(parent, Math.floor(child / 2));
};

export const removeSubtree = (
  targetId: string,
  setNodes: Dispatch<SetStateAction<Node[]>>
) => {
  if (targetId === "0") return;
  setNodes((prevNodes: Node[]) => {
    const newNodes = prevNodes.filter((currentNode: Node) => {
      if (targetId === currentNode.id) return true;
      const shouldDelete = isSuccessor(
        parseInt(targetId),
        parseInt(currentNode.id)
      );
      return !shouldDelete;
    });
    const targetNode = newNodes.find(
      currentNode => currentNode.id === targetId
    );
    if (targetNode) {
      convertToLeafNode(targetNode, newNodes);
    }
    return newNodes;
  });
};

export const truncateEdges = (
  targetId: string,
  setEdges: Dispatch<SetStateAction<Edge[]>>
) => {
  setEdges((prevEdges: Edge[]) => {
    const newEdges = [...prevEdges];
    const n = newEdges.filter(({ source, target }: Edge) => {
      return (
        !isSuccessor(parseInt(targetId), parseInt(source)) ||
        !isSuccessor(parseInt(targetId), parseInt(target))
      );
    });
    return n;
  });
};

const convertToLeafNode = (targetNode: Node, newNodes: Node[]) => {
  // Create a new node object to avoid mutation
  const updatedNode = {
    ...targetNode,
    type: "leaf",
    data: { value: null, command: "NONE" },
  };

  // Update the node in the array
  const nodeIndex = newNodes.findIndex(node => node.id === targetNode.id);
  if (nodeIndex !== -1) {
    newNodes[nodeIndex] = updatedNode;
  }
};

const upliftAllNodes = (newNodes: Node[]) => {
  newNodes.forEach(node => {
    node.position.y -= 150;
  });
};

// ==========================================
// LinkedIn Action Validation Helper Functions
// ==========================================

/**
 * Get the parent node ID in the binary tree structure.
 * Root node (1) has no parent, returns null.
 * Parent of node N is floor(N / 2).
 */
const getParentId = (nodeId: number): number | null => {
  if (nodeId <= 1) return null;
  return Math.floor(nodeId / 2);
};

/**
 * Get all ancestor nodes for a given node ID.
 * Traverses up the binary tree from the node to the root.
 */
export const getAncestorNodes = (nodeId: string, nodes: Node[]): Node[] => {
  const ancestors: Node[] = [];
  let currentId = parseInt(nodeId);

  // Traverse up the tree to find all ancestors
  while (currentId > 1) {
    const parentId = getParentId(currentId);
    if (parentId === null) break;

    const parentNode = nodes.find(n => parseInt(n.id) === parentId);
    if (parentNode) {
      ancestors.push(parentNode);
    }
    currentId = parentId;
  }

  return ancestors;
};

/**
 * Check if an INVITE action exists in the ancestor nodes.
 * This is required for MESSAGE and WITHDRAW_INVITE actions.
 */
export const hasInviteInAncestors = (
  nodeId: string,
  nodes: Node[]
): boolean => {
  const ancestors = getAncestorNodes(nodeId, nodes);
  return ancestors.some(
    node =>
      node.data?.command === "INVITE" ||
      node.data?.command === "INVITE_BY_EMAIL"
  );
};

/**
 * Check if there is a DELAY node after the most recent INVITE in ancestors.
 * Messages should not be sent immediately after invite - a delay is recommended.
 */
export const hasDelayAfterInvite = (nodeId: string, nodes: Node[]): boolean => {
  const ancestors = getAncestorNodes(nodeId, nodes);

  // Find the index of the most recent INVITE
  const inviteIndex = ancestors.findIndex(
    node =>
      node.data?.command === "INVITE" ||
      node.data?.command === "INVITE_BY_EMAIL"
  );

  if (inviteIndex === -1) return false;

  // Check if there's a DELAY between the current node and the INVITE
  // Ancestors are ordered from closest to farthest, so we check indices before the INVITE
  const nodesBetween = ancestors.slice(0, inviteIndex);
  return nodesBetween.some(node => node.data?.command === "DELAY");
};

/**
 * Check if INEMAIL already exists in the current path (ancestors).
 * LinkedIn restricts to one InMail per sequence path.
 */
export const hasInEmailInPath = (nodeId: string, nodes: Node[]): boolean => {
  const ancestors = getAncestorNodes(nodeId, nodes);
  return ancestors.some(node => node.data?.command === "INEMAIL");
};

/**
 * Check if INVITE already exists in the ancestor path.
 * Cannot add multiple INVITEs in the same path.
 */
export const hasInviteAlreadyInPath = (
  nodeId: string,
  nodes: Node[]
): boolean => {
  const ancestors = getAncestorNodes(nodeId, nodes);
  return ancestors.some(
    node =>
      node.data?.command === "INVITE" ||
      node.data?.command === "INVITE_BY_EMAIL"
  );
};

/**
 * Check if FIND_EMAIL exists in ancestors.
 * Required for INVITE_BY_EMAIL action.
 */
export const hasFindEmailInAncestors = (
  nodeId: string,
  nodes: Node[]
): boolean => {
  const ancestors = getAncestorNodes(nodeId, nodes);
  return ancestors.some(node => node.data?.command === "FIND_EMAIL");
};

/**
 * Check if MESSAGE action can be added at this node.
 * Rules:
 * - Must have INVITE in ancestors (unless lead is already connected)
 * - Should have DELAY after INVITE (warning if not, but allowed)
 */
export const canAddMessageNode = (
  nodeId: string,
  nodes: Node[],
  isAlreadyConnected: boolean = false
): { allowed: boolean; reason?: string; warning?: string } => {
  // If already connected, MESSAGE can be added without INVITE
  if (isAlreadyConnected) {
    return { allowed: true };
  }

  // Check for INVITE in ancestors
  if (!hasInviteInAncestors(nodeId, nodes)) {
    return {
      allowed: false,
      reason: "MESSAGE requires an INVITE action in the sequence path",
    };
  }

  // Check for DELAY after INVITE (warning only)
  if (!hasDelayAfterInvite(nodeId, nodes)) {
    return {
      allowed: true,
      warning: "Consider adding a delay after INVITE before sending a message",
    };
  }

  return { allowed: true };
};

/**
 * Check if INEMAIL (InMail) action can be added at this node.
 * Rules:
 * - Only ONE InMail allowed per sequence path
 * - Does not require connection (InMail can be sent to non-connections)
 */
export const canAddInMailNode = (
  nodeId: string,
  nodes: Node[]
): { allowed: boolean; reason?: string } => {
  if (hasInEmailInPath(nodeId, nodes)) {
    return {
      allowed: false,
      reason: "Only one InMail action is allowed per sequence path",
    };
  }

  return { allowed: true };
};

/**
 * Check if WITHDRAW_INVITE action can be added at this node.
 * Rules:
 * - Must have INVITE in ancestors (can only withdraw an existing invite)
 */
export const canAddWithdrawInvite = (
  nodeId: string,
  nodes: Node[]
): { allowed: boolean; reason?: string } => {
  if (!hasInviteInAncestors(nodeId, nodes)) {
    return {
      allowed: false,
      reason: "WITHDRAW_INVITE requires an INVITE action in the sequence path",
    };
  }

  return { allowed: true };
};

/**
 * Check if INVITE action can be added at this node.
 * Rules:
 * - Cannot add INVITE if one already exists in ancestors
 */
export const canAddInviteNode = (
  nodeId: string,
  nodes: Node[]
): { allowed: boolean; reason?: string } => {
  if (hasInviteAlreadyInPath(nodeId, nodes)) {
    return {
      allowed: false,
      reason: "An INVITE action already exists in this sequence path",
    };
  }

  return { allowed: true };
};

/**
 * Check if INVITE_BY_EMAIL action can be added at this node.
 * Rules:
 * - Requires FIND_EMAIL in ancestors
 * - Cannot add if INVITE already exists in path
 */
export const canAddInviteByEmailNode = (
  nodeId: string,
  nodes: Node[]
): { allowed: boolean; reason?: string } => {
  if (hasInviteAlreadyInPath(nodeId, nodes)) {
    return {
      allowed: false,
      reason: "An INVITE action already exists in this sequence path",
    };
  }

  if (!hasFindEmailInAncestors(nodeId, nodes)) {
    return {
      allowed: false,
      reason:
        "INVITE_BY_EMAIL requires a FIND_EMAIL action in the sequence path",
    };
  }

  return { allowed: true };
};

/**
 * Get the complete validation state for a node.
 * This includes all validation flags and disabled commands.
 */
export const getValidationState = (
  nodeId: string,
  nodes: Node[],
  isAlreadyConnected: boolean = false
): {
  isValid: boolean;
  disabledCommands: string[];
  hasInviteInAncestors: boolean;
  hasDelayAfterInvite: boolean;
  hasInEmailInPath: boolean;
} => {
  const disabledCommands: string[] = [];
  const hasInvite = hasInviteInAncestors(nodeId, nodes);
  const hasDelay = hasDelayAfterInvite(nodeId, nodes);
  const hasInEmail = hasInEmailInPath(nodeId, nodes);

  // Check MESSAGE
  const messageCheck = canAddMessageNode(nodeId, nodes, isAlreadyConnected);
  if (!messageCheck.allowed) {
    disabledCommands.push("MESSAGE");
  }

  // Check INEMAIL
  const inMailCheck = canAddInMailNode(nodeId, nodes);
  if (!inMailCheck.allowed) {
    disabledCommands.push("INEMAIL");
  }

  // Check WITHDRAW_INVITE
  const withdrawCheck = canAddWithdrawInvite(nodeId, nodes);
  if (!withdrawCheck.allowed) {
    disabledCommands.push("WITHDRAW_INVITE");
  }

  // Check INVITE
  const inviteCheck = canAddInviteNode(nodeId, nodes);
  if (!inviteCheck.allowed) {
    disabledCommands.push("INVITE");
  }

  // Check INVITE_BY_EMAIL
  const inviteByEmailCheck = canAddInviteByEmailNode(nodeId, nodes);
  if (!inviteByEmailCheck.allowed) {
    disabledCommands.push("INVITE_BY_EMAIL");
  }

  return {
    isValid: true,
    disabledCommands,
    hasInviteInAncestors: hasInvite,
    hasDelayAfterInvite: hasDelay,
    hasInEmailInPath: hasInEmail,
  };
};
