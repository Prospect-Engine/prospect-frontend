"use client";

import React, {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
} from "react";
import ReactFlow, {
  Node,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MarkerType,
  OnConnect,
  Background,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
  Sparkles,
  Star,
  Save,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import template components
import getNode from "@/components/template/nodes/node";
import getTimer from "@/components/template/nodes/timer";
import ActionMenu from "@/components/template/menu";
import Modal from "@/components/template/modal";
import {
  ErrorNodesProvider,
  useErrorNodes,
} from "@/components/template/ErrorNodesContext";

// Bridge component to expose context functions via ref
const ErrorNodesBridge = React.forwardRef<
  { highlightErrorNodes: (ids: string[], durationMs?: number) => void },
  object
>((_, ref) => {
  const { highlightErrorNodes } = useErrorNodes();
  React.useImperativeHandle(ref, () => ({ highlightErrorNodes }), [
    highlightErrorNodes,
  ]);
  return null;
});
ErrorNodesBridge.displayName = "ErrorNodesBridge";
import {
  actionItems,
  configurableCommands,
  configureItems,
} from "@/lib/template/options";
import {
  getNodesFromTemplate,
  getEdgesFromTemplate,
  saveSequence,
  verifySequence,
  addEndNodesAfterDelayNodes,
  ensureSequenceStructure,
  addSequenceToCampaign,
  applyLabelStyling,
} from "@/lib/template/utils";
import {
  NodeInfo,
  MenueItemType,
  MenuType,
  ModalType,
  Command,
  SequenceEdge,
} from "@/types/template";
import {
  createChild,
  removeSubtree,
  truncateEdges,
} from "@/lib/template/sequenceHelper";
import { TemplatesService } from "@/services/templatesService";
import { Template as ApiTemplate, TemplateFilters } from "@/types/templates";
import { toast } from "sonner";

interface SequenceStep {
  id: string;
  type: "MESSAGE" | "DELAY" | "END";
  name: string;
  content: string;
  delay?: number;
  delayUnit?: "HOURS" | "DAYS";
  order: number;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: SequenceStep[];
  isDefault: boolean;
  isPremium: boolean;
  usage: number;
  rating: number;
  tags: string[];
  diagram?: any;
  sequence?: any[];
}

interface SelectSequenceStepProps {
  campaignId: string;
  next: () => void;
  back: () => void;
  role: string;
}

// Role-based permissions
const ROLE_PERMISSIONS = {
  FULL_PERMISSION: {
    canEdit: true,
    canSave: true,
    canDelete: true,
    canCreateCustom: true,
    canViewTemplates: true,
  },
  VIEW_ONLY: {
    canEdit: false,
    canSave: false,
    canDelete: false,
    canCreateCustom: false,
    canViewTemplates: true,
  },
  LIMITED: {
    canEdit: true,
    canSave: false,
    canDelete: false,
    canCreateCustom: true,
    canViewTemplates: true,
  },
};

export default function SelectSequenceStep({
  campaignId,
  next,
  back,
  role,
}: SelectSequenceStepProps) {
  // Get permissions for current role
  const permissions =
    ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] ||
    ROLE_PERMISSIONS.LIMITED;
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("custom");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  // Templates tab state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // ReactFlow state for visual sequence builder
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateType, setTemplateType] = useState<
    "LINKEDIN" | "EMAIL" | "SMS" | "WHATSAPP"
  >("LINKEDIN");
  const [templateTags, setTemplateTags] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [isLoadingSequences, setIsLoadingSequences] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);
  const [isReadOnly, setIsReadOnly] = useState(!permissions.canEdit);
  const [currentDiagramState, setCurrentDiagramState] = useState<
    "INITIAL" | "DRAFT"
  >("INITIAL");
  const [hasExistingSequence, setHasExistingSequence] = useState(false);

  // Template creation state
  const currentNode = useRef<NodeInfo | null>(null);
  const errorNodesRef = useRef<{
    highlightErrorNodes: (ids: string[], durationMs?: number) => void;
  } | null>(null);
  const [actionMenuVisibility, setActionMenuVisibility] =
    useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenueItemType[]>(actionItems);
  const [modalType, setModalType] = useState<ModalType>("Timer");
  const [modalVisibility, setModalVisibility] = useState<boolean>(false);
  const [disableBtn, setDisableBtn] = useState<{
    save: boolean;
    switch: boolean;
  }>({
    save: false,
    switch: false,
  });
  const [clickPosition, setClickPosition] = useState<
    { x: number; y: number } | undefined
  >();
  const anchorRef = useRef(null);

  // Draft system utilities
  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      // First try to clean up old items if exists
      const storageKeys = Object.keys(localStorage);
      const diagramKeys = storageKeys.filter(k => k.endsWith("-diagram"));

      // If we have more than 5 diagrams saved, remove the oldest ones
      if (diagramKeys.length > 5) {
        diagramKeys
          .slice(0, diagramKeys.length - 5)
          .forEach(k => localStorage.removeItem(k));
      }

      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if ((e as Error).name === "QuotaExceededError") {
        // If still full, clear all diagrams and try again
        const storageKeys = Object.keys(localStorage);
        storageKeys
          .filter(k => k.endsWith("-diagram"))
          .forEach(k => localStorage.removeItem(k));

        try {
          localStorage.setItem(key, value);
          return true;
        } catch (e) {
          toast.error("Unable to save draft - storage full");
          return false;
        }
      }

      return false;
    }
  };

  // ReactFlow callbacks
  const onConnect: OnConnect = useCallback(
    (params: SequenceEdge) => {
      setEdges(eds =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: true,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const toggleMenuVisibility = useCallback(() => {
    setActionMenuVisibility(visibility => !visibility);
  }, []);

  const handleDisableButton = (state: "save" | "switch", value: boolean) => {
    setDisableBtn(prev => {
      return { ...prev, [state]: value };
    });
  };

  const switchDraft = useCallback(() => {
    const isDraft = currentDiagramState === "DRAFT";

    if (isDraft) {
      // Switch to initial/saved version
      if (selectedTemplate) {
        try {
          const nodesFromTemplate = getNodesFromTemplate(
            selectedTemplate as any
          );
          setNodes(nodesFromTemplate);
          setEdges([]);
        } catch {
          const initialNodes = getNodesFromTemplate(null);
          setNodes(initialNodes);
          setEdges([]);
        }
      } else {
        const initialNodes = getNodesFromTemplate(null);
        setNodes(initialNodes);
        setEdges([]);
      }
      setCurrentDiagramState("INITIAL");
      return;
    }

    // Switch to draft version
    const diagramString = localStorage.getItem(`${campaignId}-diagram`);
    if (!diagramString) {
      toast.error("No draft available for this campaign.");
      return;
    }

    try {
      const diagramObj = JSON.parse(diagramString);
      setNodes(diagramObj.nodes || []);
      setEdges((diagramObj.edges || []).map(applyLabelStyling));
      setCurrentDiagramState("DRAFT");
    } catch (e) {
      toast.error("Error loading draft. Please try again.");
    }
  }, [currentDiagramState, selectedTemplate, campaignId, setNodes, setEdges]);

  // Auto-save draft functionality
  useEffect(() => {
    if (campaignId && nodes.length && edges.length) {
      const updatedNodes = nodes.map(node => {
        const { height, width, ...rest } = node;
        return rest;
      });

      const diagramObj = { nodes: updatedNodes, edges };
      safeSetLocalStorage(`${campaignId}-diagram`, JSON.stringify(diagramObj));
    }
  }, [nodes, edges, campaignId]);

  // Initialize with root node for visual builder
  useEffect(() => {
    if (activeTab === "custom") {
      // Check for existing draft first
      const diagramString = localStorage.getItem(`${campaignId}-diagram`);
      if (diagramString) {
        try {
          const diagramObj = JSON.parse(diagramString);
          setNodes(diagramObj.nodes || []);
          setEdges((diagramObj.edges || []).map(applyLabelStyling));
          setCurrentDiagramState("DRAFT");
        } catch {
          const initialNodes = getNodesFromTemplate(null);
          setNodes(initialNodes);
          setEdges([]);
        }
      } else {
        const initialNodes = getNodesFromTemplate(null);
        setNodes(initialNodes);
        setEdges([]);
      }
      setIsReadOnly(false); // Reset to editable when switching to custom
    }
  }, [activeTab, setNodes, campaignId]);

  // On mount and page reload: fetch existing custom sequences; if present, load first; else start fresh
  useEffect(() => {
    const fetchSequences = async () => {
      setIsLoadingSequences(true);
      try {
        const resp = await fetch(
          `/api/outreach/campaign/createSequence/getlist?camp_id=${encodeURIComponent(campaignId)}`,
          {
            method: "GET",
            credentials: "same-origin",
          }
        );
        const data = await resp.json();

        // Handle new response format with sequence.diagram
        if (data?.sequence?.diagram) {
          const sequence = data.sequence;
          setHasExistingSequence(true); // Mark that sequence is already set
          setSelectedTemplate({
            id: sequence.id,
            name: "Custom Sequence",
            description: "Custom sequence loaded from backend",
            category: "Custom",
            isDefault: false,
            isPremium: false,
            usage: 0,
            rating: 0,
            tags: [],
            steps: sequence.nodes
              .filter((node: any) => node.type !== "END")
              .map((node: any, index: number) => ({
                id: node.id.toString(),
                type: node.type === "DELAY" ? "DELAY" : "MESSAGE",
                name: node.name,
                content: node.data?.message_template || "",
                delay: node.data?.delay_value,
                delayUnit: node.data?.delay_unit === "DAY" ? "DAYS" : "HOURS",
                order: index + 1,
              })),
          });
          setShowBuilder(true);
          setIsReadOnly(false); // Allow editing of existing sequences

          // Load the diagram data directly into ReactFlow
          if (sequence.diagram.nodes && sequence.diagram.edges) {
            setNodes(sequence.diagram.nodes);
            setEdges(sequence.diagram.edges.map(applyLabelStyling));
          } else {
            // Fallback to template conversion
            try {
              const nodesFromTemplate = getNodesFromTemplate(sequence as any);
              setNodes(nodesFromTemplate);
              setEdges([]);
            } catch {
              const initialNodes = getNodesFromTemplate(null);
              setNodes(initialNodes);
              setEdges([]);
            }
          }
          setActiveTab("custom");
        } else {
          // Handle legacy format
          const list: Template[] = Array.isArray(data?.data)
            ? (data.data as Template[])
            : Array.isArray(data)
              ? (data as Template[])
              : Array.isArray(data?.templates)
                ? (data.templates as Template[])
                : [];

          if (list.length > 0) {
            // pick first custom template and load to builder
            setHasExistingSequence(true); // Mark that sequence is already set
            const first = list[0];
            setSelectedTemplate(first);
            setShowBuilder(true);
            try {
              const nodesFromTemplate = getNodesFromTemplate(first as any);
              setNodes(nodesFromTemplate);
              setEdges([]);
              setActiveTab("custom");
            } catch {
              const initialNodes = getNodesFromTemplate(null);
              setNodes(initialNodes);
              setEdges([]);
            }
          } else {
            // No existing sequence; keep default custom tab
            setActiveTab("custom");
          }
        }
      } catch (e) {
        setActiveTab("custom");
      } finally {
        setIsLoadingSequences(false);
      }
    };
    fetchSequences();
  }, [campaignId, setNodes, setEdges]);

  // Also fetch sequences on window focus (handles page reload scenarios)
  useEffect(() => {
    const handleFocus = () => {
      // Re-fetch sequences when window regains focus (e.g., after page reload)
      const fetchSequences = async () => {
        try {
          const resp = await fetch(
            `/api/outreach/campaign/createSequence/getlist?camp_id=${encodeURIComponent(campaignId)}`,
            {
              method: "GET",
              credentials: "same-origin",
            }
          );
          const data = await resp.json();

          // Handle new response format with sequence.diagram
          if (data?.sequence?.diagram) {
            const sequence = data.sequence;
            if (!selectedTemplate) {
              // Only update if we don't already have a selected template
              setSelectedTemplate({
                id: sequence.id,
                name: "Custom Sequence",
                description: "Custom sequence loaded from backend",
                category: "Custom",
                isDefault: false,
                isPremium: false,
                usage: 0,
                rating: 0,
                tags: [],
                steps: sequence.nodes
                  .filter((node: any) => node.type !== "END")
                  .map((node: any, index: number) => ({
                    id: node.id.toString(),
                    type: node.type === "DELAY" ? "DELAY" : "MESSAGE",
                    name: node.name,
                    content: node.data?.message_template || "",
                    delay: node.data?.delay_value,
                    delayUnit:
                      node.data?.delay_unit === "DAY" ? "DAYS" : "HOURS",
                    order: index + 1,
                  })),
              });
              setShowBuilder(true);
              setIsReadOnly(false); // Allow editing of existing sequences

              // Load the diagram data directly into ReactFlow
              if (sequence.diagram.nodes && sequence.diagram.edges) {
                setNodes(sequence.diagram.nodes);
                setEdges(sequence.diagram.edges.map(applyLabelStyling));
              } else {
                // Fallback to template conversion
                try {
                  const nodesFromTemplate = getNodesFromTemplate(
                    sequence as any
                  );
                  setNodes(nodesFromTemplate);
                  setEdges([]);
                } catch {
                  // Keep current state if conversion fails
                }
              }
              setActiveTab("custom");
            }
          } else {
            // Handle legacy format
            const list: Template[] = Array.isArray(data?.data)
              ? (data.data as Template[])
              : Array.isArray(data)
                ? (data as Template[])
                : Array.isArray(data?.templates)
                  ? (data.templates as Template[])
                  : [];

            if (list.length > 0 && !selectedTemplate) {
              // Only update if we don't already have a selected template
              const first = list[0];
              setSelectedTemplate(first);
              setShowBuilder(true);
              try {
                const nodesFromTemplate = getNodesFromTemplate(first as any);
                setNodes(nodesFromTemplate);
                setEdges([]);
                setActiveTab("templates");
              } catch {
                // Keep current state if conversion fails
              }
            }
          }
        } catch (e) {
          // Silently fail on focus refetch
        }
      };
      fetchSequences();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        handleFocus();
      }
    });
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("visibilitychange", handleFocus);
    };
  }, [campaignId, selectedTemplate, setNodes, setEdges]);

  // When switching to templates tab, fetch saved templates from backend
  useEffect(() => {
    const fetchTemplates = async () => {
      if (activeTab !== "templates") return;
      setTemplateLoading(true);
      try {
        const filters: TemplateFilters = {
          page: 1,
          limit: 100,
          order_by: "created_at",
          sort_type: "desc",
        };

        const response = await TemplatesService.getTemplates(filters);

        // Transform API templates to match the Template interface used in this component
        const transformedTemplates: Template[] = response.templates.map(
          template => ({
            id: template.id,
            name: template.name,
            description:
              template.description ||
              `Template with ${template.sequence.length} steps`,
            category: "Saved Templates",
            isDefault: false,
            isPremium: false,
            usage: template.usage_count || 0,
            rating: template.success_rate || 0,
            tags: template.tags || [],
            steps: template.sequence.map((step, index) => ({
              id: step.id.toString(),
              type: step.type === "DELAY" ? "DELAY" : "MESSAGE",
              name: step.name,
              content: step.data?.message_template || "",
              delay: step.data?.delay_value,
              delayUnit: step.data?.delay_unit === "DAY" ? "DAYS" : "HOURS",
              order: index + 1,
            })),
            // Preserve original template data for template reuse
            sequence: template.sequence,
            diagram: template.diagram,
          })
        );

        setSavedTemplates(transformedTemplates);
      } catch (e) {
        setSavedTemplates([]);
      } finally {
        setTemplateLoading(false);
      }
    };
    fetchTemplates();
  }, [activeTab]);

  const showMenu = useCallback(
    (
      ref: any,
      node: NodeInfo,
      menuType: MenuType,
      event?: React.MouseEvent
    ) => {
      const command: Command = node.data.command;
      const configurable = configurableCommands.find(c => c === command);
      const configMenuItems = configurable
        ? configureItems
        : [configureItems[1]];

      switch (menuType) {
        case "Configure":
          setMenuItems(configMenuItems);
          break;
        case "SetAction":
          setMenuItems(actionItems);
          break;
      }
      anchorRef.current = ref.current;
      currentNode.current = node;

      // Set click position if event is provided
      if (event) {
        setClickPosition({
          x: event.clientX,
          y: event.clientY + 5, // Small offset to avoid overlap with cursor
        });
      }

      toggleMenuVisibility();
    },
    [toggleMenuVisibility]
  );

  const showModal = useCallback((node: NodeInfo, type: ModalType) => {
    setModalType(type);
    currentNode.current = node;
    setModalVisibility(true);
  }, []);

  const setLeafToEnd = useCallback(
    (id: string) => {
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          if (node.id === id) {
            // Create a completely new node object to ensure ReactFlow detects the change
            return {
              ...node,
              data: {
                ...node.data,
                command: "END",
                value: { label: "End of the sequence" },
              },
            };
          }
          return node;
        });
      });
    },
    [setNodes]
  );

  const setEndToLeaf = useCallback(
    (id: string) => {
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          if (node.id === id && node.data.command === "END") {
            // Convert END node back to leaf node
            return {
              ...node,
              type: "leaf",
              data: {
                ...node.data,
                command: "NONE",
                value: { label: "Set Action" },
              },
            };
          }
          return node;
        });
      });
    },
    [setNodes]
  );

  const dispatch = useCallback(
    (option: MenueItemType) => {
      if (currentNode.current) {
        if (option.type === "SetAction") {
          truncateEdges(currentNode.current.id, setEdges);
          createChild(option, currentNode.current, setNodes, onConnect);
        } else {
          switch (option.action) {
            case "Delete":
              truncateEdges(currentNode.current.id, setEdges);
              removeSubtree(currentNode.current.id, setNodes);
              break;
            case "Configure":
              showModal(currentNode.current, "Configure");
              break;
          }
        }
      } else {
        toast.error("Bug! No current Node");
      }
    },
    [currentNode, onConnect, setEdges, setNodes, showModal]
  );

  const nodeTypes = useMemo(() => {
    //
    return {
      root: getNode({ nodeType: "root", showMenu, isDraft: !isReadOnly }),
      leaf: getNode({
        nodeType: "leaf",
        showMenu,
        isDraft: !isReadOnly,
        dispatch,
        currentNode,
        anchorRef,
        setLeafToEnd,
        setEndToLeaf,
      }),
      unidirectional: getNode({
        nodeType: "unidirectional",
        showMenu,
        isDraft: !isReadOnly,
        dispatch,
        anchorRef,
        currentNode,
        setEndToLeaf,
      }),
      bidirectional: getNode({
        nodeType: "bidirectional",
        showMenu,
        isDraft: !isReadOnly,
        dispatch,
        anchorRef,
        currentNode,
        setEndToLeaf,
      }),
      timer: getTimer(showModal),
    };
  }, [dispatch, setLeafToEnd, setEndToLeaf, showMenu, showModal, isReadOnly]);

  const configureModal = useMemo(
    () => (
      <Modal
        modalType={modalType}
        show={modalVisibility}
        handleClose={() => setModalVisibility(false)}
        targetNode={currentNode.current}
        setNodes={setNodes}
      />
    ),
    [modalVisibility, modalType, setNodes]
  );

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    const validation = await verifySequence(nodes);
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Invalid sequence structure");
      // Highlight error nodes temporarily
      if (validation.errorNodeIds && validation.errorNodeIds.length > 0) {
        errorNodesRef.current?.highlightErrorNodes(
          validation.errorNodeIds,
          5000
        );
      }
      return;
    }

    handleDisableButton("save", true);
    await saveSequence(nodes, edges, templateName);

    // Also push to backend sequence API for this virtual campaign
    try {
      const sequencePayload = {
        sequence_type: templateType,
        sequence: nodes
          .filter(n => n.data.command !== "NONE")
          .map((n, idx) => {
            if (n.data.command === "DELAY") {
              return {
                id: idx + 1,
                type: "DELAY",
                name: n.data.value?.label || "Delay",
                data: {
                  delay_unit: (n.data.value?.unit === "Days" ? "DAY" : "HR") as
                    | "HR"
                    | "DAY",
                  delay_value: Number(n.data.value?.count) || 0,
                },
              };
            }
            if (n.data.command === "END") {
              return {
                id: idx + 1,
                type: "END",
                name: "End",
              };
            }
            return {
              id: idx + 1,
              type: "LIKE",
              name: n.data.value?.label || "Like post",
            };
          }),
        diagram: {},
        sequence_id: selectedTemplate?.id || null,
      };

      // Verify sequence before saving
      //
      const verifyResponse = await fetch(
        "/api/outreach/campaign/createSequence/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: sequencePayload.sequence_type,
            sequence: sequencePayload.sequence,
          }),
          credentials: "same-origin",
        }
      );

      if (!verifyResponse.ok) {
        const verifyErrorData = await verifyResponse.json();

        toast.error(
          verifyErrorData.message ||
            verifyErrorData.err?.message ||
            "Sequence verification failed. Please check your sequence structure."
        );
        handleDisableButton("save", false);
        return;
      }

      const verifyResult = await verifyResponse.json();
      //

      await fetch("/api/outreach/campaign/createSequence/setSequence", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId, payload: sequencePayload }),
      });
    } catch (e) {
      // ignore failure of background save here
    }
    handleDisableButton("save", false);

    // Create a template object from the visual sequence
    const visualTemplate: Template = {
      id: "visual-" + Date.now(),
      name: templateName,
      description: templateDescription,
      category: "Custom",
      isDefault: false,
      isPremium: false,
      usage: 0,
      rating: 0,
      tags: templateTags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag),
      steps: nodes
        .filter(
          node => node.data.command !== "NONE" && node.data.command !== "END"
        )
        .map((node, index) => ({
          id: node.id,
          type: node.data.command as "MESSAGE" | "DELAY",
          name: node.data.value?.label || `Step ${index + 1}`,
          content: node.data.value?.message || "",
          delay: node.data.value?.count,
          delayUnit:
            node.data.value?.unit === "Days"
              ? ("DAYS" as const)
              : ("HOURS" as const),
          order: index + 1,
        })),
    };

    setSelectedTemplate(visualTemplate);
    setActiveTab("custom");

    // Show success message
    toast.success("Template saved successfully!");
  };

  const handleUseCustomSequence = async () => {
    const validation = await verifySequence(nodes);
    if (!validation.isValid) {
      toast.error(validation.errorMessage || "Invalid sequence structure");
      // Highlight error nodes temporarily
      if (validation.errorNodeIds && validation.errorNodeIds.length > 0) {
        errorNodesRef.current?.highlightErrorNodes(
          validation.errorNodeIds,
          5000
        );
      }
      return;
    }

    // Automatically fix DELAY nodes that need END nodes
    const { nodes: fixedNodes, edges: fixedEdges } = addEndNodesAfterDelayNodes(
      nodes,
      edges
    );
    if (
      fixedNodes.length !== nodes.length ||
      fixedEdges.length !== edges.length
    ) {
      setNodes(fixedNodes);
      setEdges(fixedEdges);
    }

    // Create a template object from the visual sequence without saving
    const customTemplate: Template = {
      id: "custom-" + Date.now(),
      name: "Custom Sequence",
      description: "Custom sequence created in visual builder",
      category: "Custom",
      isDefault: false,
      isPremium: false,
      usage: 0,
      rating: 0,
      tags: [],
      steps: nodes
        .filter(
          node => node.data.command !== "NONE" && node.data.command !== "END"
        )
        .map((node, index) => ({
          id: node.id,
          type: node.data.command as "MESSAGE" | "DELAY",
          name: node.data.value?.label || `Step ${index + 1}`,
          content: node.data.value?.message || "",
          delay: node.data.value?.count,
          delayUnit:
            node.data.value?.unit === "Days"
              ? ("DAYS" as const)
              : ("HOURS" as const),
          order: index + 1,
        })),
    };

    setSelectedTemplate(customTemplate);
    setIsReadOnly(false); // Custom sequences are editable
  };

  // Get unique categories from saved templates
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(savedTemplates.map(template => template.category))
    );
    return ["all", ...uniqueCategories];
  }, [savedTemplates]);

  // Filter by search and category
  const filteredTemplates = savedTemplates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTemplates.length / pageSize)
  );
  const paginatedTemplates = useMemo(
    () =>
      filteredTemplates.slice(
        (currentPage - 1) * pageSize,
        (currentPage - 1) * pageSize + pageSize
      ),
    [filteredTemplates, currentPage]
  );

  useEffect(() => {
    // Reset to first page on search or category change
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Helper functions for template display
  const getSequencePreview = (template: Template) => {
    const messageSteps = template.steps.filter(step => step.type === "MESSAGE");
    return messageSteps.length > 0
      ? (messageSteps[0].content?.substring(0, 100) || "No message content") +
          "..."
      : "No message content";
  };

  const getSequenceComplexity = (template: Template) => {
    const stepCount = template.steps.length;
    if (stepCount <= 3)
      return {
        label: "Simple",
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200",
      };
    if (stepCount <= 6)
      return {
        label: "Medium",
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200",
      };
    return {
      label: "Complex",
      color:
        "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-900 dark:hover:text-green-200",
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleTemplatePreview = useCallback(
    (template: Template) => {
      // Switch to custom tab for preview
      setActiveTab("custom");
      // Load template into builder for preview
      setSelectedTemplate(template);
      setShowBuilder(true);
      setIsReadOnly(true); // Preview mode
      try {
        const nodesFromTemplate = getNodesFromTemplate(template as any);
        const edgesFromTemplate = getEdgesFromTemplate(template as any);
        setNodes(nodesFromTemplate);
        setEdges(edgesFromTemplate);
      } catch (e) {
        const initialNodes = getNodesFromTemplate(null);
        setNodes(initialNodes);
        setEdges([]);
      }
    },
    [setNodes, setEdges]
  );

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      //
      // Switch to custom tab for editing
      setActiveTab("custom");
      // Load template into builder for editing
      setSelectedTemplate(template);
      setShowBuilder(true);
      setIsReadOnly(false);
      //
      try {
        const nodesFromTemplate = getNodesFromTemplate(template as any);
        const edgesFromTemplate = getEdgesFromTemplate(template as any);
        //
        //
        setNodes(nodesFromTemplate);
        setEdges(edgesFromTemplate);
      } catch (e) {
        const initialNodes = getNodesFromTemplate(null);
        setNodes(initialNodes);
        setEdges([]);
      }
    },
    [setNodes, setEdges]
  );

  const canProceed =
    selectedTemplate !== null || (activeTab === "custom" && nodes.length > 1);

  const buildSequencePayload = () => {
    // First, ensure sequence has proper structure for backend validation
    const { nodes: fixedNodes, edges: fixedEdges } = ensureSequenceStructure(
      nodes,
      edges
    );

    // Build sequence maintaining binary tree structure with proper IDs
    const built = fixedNodes
      .filter(n => n.data.command !== "NONE")
      .sort((a, b) => parseInt(a.id) - parseInt(b.id)) // Sort by ID to maintain tree order
      .map(n => {
        const command = n.data.command;
        const id = parseInt(n.id);

        if (command === "DELAY") {
          return {
            id,
            type: "DELAY",
            name: n.data.value?.label || "Delay",
            data: {
              delay_unit: (n.data.value?.unit === "Days" ? "DAY" : "HR") as
                | "HR"
                | "DAY",
              delay_value: Number(n.data.value?.count) || 0,
            },
          };
        }

        if (command === "END") {
          return {
            id,
            type: "END",
            name: "End of the sequence",
            data: {
              message_template: "",
              alternative_message: "",
            },
          };
        }

        // Handle all other command types with their specific data structure
        const baseNode = {
          id,
          type: command, // Use the actual command type
          name: n.data.value?.label || `${command} action`,
        };

        // Add data based on command type
        switch (command) {
          case "MESSAGE":
            return {
              ...baseNode,
              data: {
                message_template: n.data.value?.message || "",
                alternative_message: n.data.value?.alternativeMessage || "",
                attachments:
                  n.data.value?.attachments?.map((att: any) => ({
                    url: att.data || att.url || "",
                    name: att.name,
                    type: att.type,
                  })) || [],
              },
            };
          case "INEMAIL":
            return {
              ...baseNode,
              data: {
                message_template: n.data.value?.message || "",
                subject_template: n.data.value?.subject || "",
                alternative_message: n.data.value?.alternativeMessage || "",
                alternative_subject: n.data.value?.alternativeSubject || "",
                attachments:
                  n.data.value?.attachments?.map((att: any) => ({
                    url: att.data || att.url || "",
                    name: att.name,
                    type: att.type,
                  })) || [],
              },
            };
          case "INVITE":
            return {
              ...baseNode,
              data: {
                message_template: n.data.value?.message || "",
                alternative_message: n.data.value?.alternativeMessage || "",
              },
            };
          case "LIKE":
          case "FOLLOW":
          case "VIEW_PROFILE":
          case "ENDORSE":
          case "WITHDRAW_INVITE":
            return {
              ...baseNode,
              data: {}, // These actions don't require additional data
            };
          default:
            // Fallback for any other command types
            return {
              ...baseNode,
              data: {
                message_template: n.data.value?.message || "",
                alternative_message: n.data.value?.alternativeMessage || "",
              },
            };
        }
      });

    // Only send template_id if it's a valid UUID (from saved templates)
    // For custom sequences, don't send template_id
    const isValidUUID = (id: string) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    return {
      sequence_type: templateType,
      sequence: built,
      diagram: {
        nodes: fixedNodes,
        edges: fixedEdges,
      },
      sequence_id:
        selectedTemplate?.id && isValidUUID(selectedTemplate.id)
          ? selectedTemplate.id
          : null,
    };
  };

  const submitSequence = async () => {
    const payload = buildSequencePayload();

    // // Debug: Log the sequence being sent
    //

    try {
      // First, verify the sequence before submitting
      //
      const verifyResponse = await fetch(
        "/api/outreach/campaign/createSequence/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: payload.sequence_type,
            sequence: payload.sequence,
          }),
          credentials: "same-origin",
        }
      );

      if (!verifyResponse.ok) {
        const verifyErrorData = await verifyResponse.json();

        throw new Error(
          verifyErrorData.message ||
            verifyErrorData.err?.message ||
            "Sequence verification failed. Please check your sequence structure."
        );
      }

      const verifyResult = await verifyResponse.json();
      //

      // If verification passes, proceed with sequence submission
      const response = await fetch(
        "/api/outreach/campaign/createSequence/setSequence",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId, payload }),
          credentials: "same-origin",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      // Clear draft after successful submission
      localStorage.removeItem(`${campaignId}-diagram`);
      setCurrentDiagramState("INITIAL");
      handleDisableButton("switch", true);
    } catch (e) {
      throw e; // Re-throw to be handled by the calling function
    }
  };

  return (
    <ErrorNodesProvider>
      <ErrorNodesBridge ref={errorNodesRef} />
      <div className="space-y-6 dark:text-slate-200">
        {isLoadingSequences && (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Loading sequences...
          </div>
        )}

        {/* Always show tabs - allow editing existing sequences */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className={`grid w-full ${hasExistingSequence ? "grid-cols-1" : "grid-cols-2"} bg-slate-100 dark:bg-slate-800`}
          >
            {!hasExistingSequence && (
              <>
                <TabsTrigger
                  value="custom"
                  className="flex items-center space-x-2 dark:text-slate-300 dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Custom</span>
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="flex items-center space-x-2 dark:text-slate-300 dark:data-[state=active]:bg-black dark:data-[state=active]:text-white"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Templates</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Custom Tab - Visual Builder */}
          <TabsContent value="custom" className="space-y-4">
            {configureModal}

            {/* Template Header */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold dark:text-white">
                    {hasExistingSequence ? "Edit Sequence" : "Custom Sequence"}
                  </h3>
                  {hasExistingSequence && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Modify your existing campaign sequence
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    className="w-64 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200"
                  />
                </div>
                {permissions.canSave && (
                  <Button
                    onClick={handleSaveTemplate}
                    disabled={disableBtn.save || !templateName.trim()}
                    variant="outline"
                    className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {disableBtn.save ? "Saving..." : "Save Template"}
                  </Button>
                )}
                {permissions.canEdit && (
                  <Button
                    onClick={switchDraft}
                    disabled={disableBtn.switch}
                    variant="outline"
                    className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Switch to{" "}
                    {currentDiagramState === "DRAFT" ? "Initial" : "Draft"}
                  </Button>
                )}
              </div>
            </div>

            {/* Visual Sequence Builder */}
            <Card className="p-0">
              <CardContent className="p-0">
                <div className="h-[600px] relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 25px 25px, #64748b 2px, transparent 0)",
                        backgroundSize: "50px 50px",
                      }}
                    ></div>
                  </div>
                  {/* Gradient Overlay */}
                  <div className="absolute inset- bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20 pointer-events-none"></div>

                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={isReadOnly ? undefined : onNodesChange}
                    onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                    onConnect={isReadOnly ? undefined : onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{
                      padding: 0.2,
                      includeHiddenNodes: false,
                      minZoom: 0.5,
                      maxZoom: 1.2,
                    }}
                    className="bg-transparent"
                    deleteKeyCode={[]}
                    nodesDraggable={!isReadOnly}
                    nodesConnectable={!isReadOnly}
                    elementsSelectable={!isReadOnly}
                    minZoom={0.2}
                    maxZoom={1.5}
                  >
                    {/* Background pattern handled by CSS */}
                    <ActionMenu
                      open={actionMenuVisibility}
                      setOpen={setActionMenuVisibility}
                      items={menuItems}
                      anchorRef={anchorRef}
                      dispatch={dispatch}
                      clickPosition={clickPosition}
                      currentNodeId={currentNode.current?.id}
                      nodes={nodes}
                    />
                    <Controls />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab - Only show when no existing sequence */}
          {!hasExistingSequence && (
            <TabsContent value="templates" className="space-y-4">
              {/* Search and Filters */}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900 dark:text-slate-200 text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Templates Grid - 6 per page (2 rows x 3 cols) */}
              {!showBuilder && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templateLoading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-8 h-8 border-4 border-slate-300 border-t-black dark:border-slate-600 dark:border-t-white rounded-full animate-spin mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Loading Templates
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Please wait while we fetch your templates...
                      </p>
                    </div>
                  ) : savedTemplates.length > 0 ? (
                    paginatedTemplates.map(template => (
                      <Card
                        key={template.id}
                        className={cn(
                          "transition-all duration-200 hover:shadow-md dark:bg-slate-900 dark:border-slate-700",
                          selectedTemplate?.id === template.id
                            ? "ring-2 ring-black bg-slate-50 dark:ring-white dark:bg-slate-800"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <CardTitle className="text-lg dark:text-white">
                                  {template.name}
                                </CardTitle>
                                {template.isPremium && (
                                  <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 text-xs">
                                    Premium
                                  </Badge>
                                )}
                                {template.isDefault && (
                                  <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm dark:text-slate-300">
                                {template.description}
                              </CardDescription>
                            </div>
                            {selectedTemplate?.id === template.id && (
                              <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white dark:bg-black rounded-full" />
                              </div>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {/* Sequence Information */}
                          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {template.steps.length} steps
                                </span>
                              </div>
                              <Badge
                                className={cn(
                                  "text-xs font-medium",
                                  getSequenceComplexity(template).color
                                )}
                              >
                                {getSequenceComplexity(template).label}
                              </Badge>
                            </div>
                          </div>

                          {/* Message Preview */}
                          <div className="mb-4">
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700/50 dark:to-slate-600/50 rounded-lg p-4 border border-slate-200 dark:border-slate-600">
                              <div className="flex items-start gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                                  Preview
                                </span>
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                                {getSequencePreview(template)}
                              </p>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Usage</span>
                              <span>{template.usage} times</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{template.rating}%</span>
                            </div>
                          </div>

                          {/* Tags */}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.tags.slice(0, 2).map(tag => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="text-xs dark:bg-slate-700 dark:text-slate-300"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 2 && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs dark:bg-slate-700 dark:text-slate-300"
                                >
                                  +{template.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 mt-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleTemplatePreview(template);
                                }}
                                className="flex-1 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                              <Button
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-900 dark:hover:bg-slate-800"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Template
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                      <BookOpen className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" />
                      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        No Templates Available
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md">
                        No saved templates found. Create a custom sequence or
                        save templates for future use.
                      </p>
                      <Button
                        onClick={() => setActiveTab("custom")}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Create Custom Sequence
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Pagination */}
              {!showBuilder && savedTemplates.length > 0 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, currentPage - 2) + i;
                      if (pageNum > totalPages) return null;
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? "default" : "outline"
                          }
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 p-0 ${
                            currentPage === pageNum
                              ? "bg-black text-white dark:bg-white dark:text-black"
                              : "dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                          }`}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage(p => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="flex items-center dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}

              {/* Pagination Info */}
              {!showBuilder && savedTemplates.length > 0 && (
                <div className="text-center text-sm text-slate-600 dark:text-slate-300 pt-2">
                  {templateLoading
                    ? "Loading templates..."
                    : `Showing ${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredTemplates.length)} of ${filteredTemplates.length} templates`}
                </div>
              )}

              {/* Separate Builder Page inside Templates tab */}
              {showBuilder && selectedTemplate && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div />
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      {isReadOnly ? "Viewing" : "Editing"}:{" "}
                      <span className="font-medium text-black dark:text-white">
                        {selectedTemplate.name}
                      </span>
                      {isReadOnly && (
                        <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300 text-xs rounded-md">
                          Read Only
                        </span>
                      )}
                    </div>
                    <div />
                  </div>
                  <div className="h-[600px] relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage:
                            "radial-gradient(circle at 25px 25px, #64748b 2px, transparent 0)",
                          backgroundSize: "50px 50px",
                        }}
                      ></div>
                    </div>
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/20 dark:via-transparent dark:to-purple-900/20 pointer-events-none"></div>

                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      onNodesChange={isReadOnly ? undefined : onNodesChange}
                      onEdgesChange={isReadOnly ? undefined : onEdgesChange}
                      onConnect={isReadOnly ? undefined : onConnect}
                      nodeTypes={nodeTypes}
                      fitView
                      fitViewOptions={{
                        padding: 0.2,
                        includeHiddenNodes: false,
                        minZoom: 0.5,
                        maxZoom: 1.2,
                      }}
                      className="bg-transparent"
                      deleteKeyCode={[]}
                      nodesDraggable={!isReadOnly}
                      nodesConnectable={!isReadOnly}
                      elementsSelectable={!isReadOnly}
                    >
                      {/* Background pattern handled by CSS */}
                      <ActionMenu
                        open={actionMenuVisibility}
                        setOpen={setActionMenuVisibility}
                        items={menuItems}
                        anchorRef={anchorRef}
                        dispatch={dispatch}
                        clickPosition={clickPosition}
                        currentNodeId={currentNode.current?.id}
                        nodes={nodes}
                      />
                      <Controls />
                    </ReactFlow>
                  </div>
                  {/* Bottom action bar removed as requested; use global Back/Continue */}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => {
              if (
                activeTab === "templates" &&
                showBuilder &&
                !hasExistingSequence
              ) {
                setShowBuilder(false);
                return;
              }
              back();
            }}
            className="flex items-center space-x-2 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>
              {activeTab === "templates" && showBuilder && !hasExistingSequence
                ? "Back to Templates"
                : "Back to Leads"}
            </span>
          </Button>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {selectedTemplate ? (
              <span className="text-black dark:text-white font-medium">
                Sequence ready: {selectedTemplate.steps.length} steps configured
              </span>
            ) : activeTab === "custom" && nodes.length > 1 ? (
              <span className="text-black dark:text-white font-medium">
                Custom sequence ready:{" "}
                {
                  nodes.filter(
                    node =>
                      node.data.command !== "NONE" &&
                      node.data.command !== "END"
                  ).length
                }{" "}
                steps configured
              </span>
            ) : (
              <span>Select a template or create custom sequence</span>
            )}
          </div>
          <Button
            onClick={async () => {
              try {
                // Ensure sequence has proper structure for backend validation
                const { nodes: fixedNodes, edges: fixedEdges } =
                  ensureSequenceStructure(nodes, edges);
                if (
                  fixedNodes.length !== nodes.length ||
                  fixedEdges.length !== edges.length
                ) {
                  setNodes(fixedNodes);
                  setEdges(fixedEdges);
                }

                // Validate sequence before proceeding
                const validation = await verifySequence(fixedNodes);
                if (!validation.isValid) {
                  toast.error(
                    validation.errorMessage ||
                      "Invalid sequence structure. Please fix the issues and try again."
                  );
                  // Highlight error nodes temporarily
                  if (
                    validation.errorNodeIds &&
                    validation.errorNodeIds.length > 0
                  ) {
                    errorNodesRef.current?.highlightErrorNodes(
                      validation.errorNodeIds,
                      5000
                    );
                  }
                  return;
                }

                if (
                  activeTab === "custom" &&
                  !selectedTemplate &&
                  fixedNodes.length > 1
                ) {
                  handleUseCustomSequence();
                }
                await submitSequence();
                next();
              } catch (error) {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Failed to submit sequence. Please try again."
                );
              }
            }}
            disabled={!canProceed}
            className="bg-black hover:bg-black/90 text-white px-8"
          >
            Continue to Schedule
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </ErrorNodesProvider>
  );
}
