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
  Background,
  MarkerType,
  OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Save, ArrowLeft } from "lucide-react";

// Import template components
import getNode from "@/components/template/nodes/node";
import getTimer from "@/components/template/nodes/timer";
import ActionMenu from "@/components/template/menu";
import Modal from "@/components/template/modal";
import {
  actionItems,
  configurableCommands,
  configureItems,
} from "@/lib/template/options";
import {
  getNodesFromTemplate,
  saveSequence,
  verifySequence,
  getSequence,
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
import { toast } from "sonner";

export default function CreateTemplate() {
  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState(
    getNodesFromTemplate(null)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [templateName, setTemplateName] = useState("");
  const [templateNameError, setTemplateNameError] = useState("");
  const templateType = "LINKEDIN";

  const currentNode = useRef<NodeInfo | null>(null);
  const [actionMenuVisibility, setActionMenuVisibility] =
    useState<boolean>(false);
  const [menuItems, setMenuItems] = useState<MenueItemType[]>(actionItems);

  const [modalType, setModalType] = useState<ModalType>("Timer");
  const [modalVisibility, setModalVisibility] = useState<boolean>(false);

  const [disableBtn, setDisableBtn] = useState<{ save: boolean }>({
    save: false,
  });

  const anchorRef = useRef(null);
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

  const handleDisableButton = (state: "save", value: boolean) => {
    setDisableBtn(prev => {
      return { ...prev, [state]: value };
    });
  };

  // Initialize with root node - now handled in useNodesState initialization
  //

  // Monitor nodes changes
  // useEffect(() => {
  //
  //
  //
  // }, [nodes]);

  const showMenu = useCallback(
    (ref: any, node: NodeInfo, menuType: MenuType) => {
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
          if (node.id !== id) return node;
          return {
            ...node,
            data: {
              ...node.data,
              command: "END",
              value: { label: "End of the sequence" },
            },
          } as Node;
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
            } as Node;
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
          //
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
    const types = {
      root: getNode({ nodeType: "root", showMenu, isDraft: true }),
      leaf: getNode({
        nodeType: "leaf",
        showMenu,
        isDraft: true,
        dispatch,
        currentNode,
        anchorRef,
        setLeafToEnd,
        setEndToLeaf,
      }),
      unidirectional: getNode({
        nodeType: "unidirectional",
        showMenu,
        isDraft: true,
        dispatch,
        anchorRef,
        currentNode,
        setEndToLeaf,
      }),
      bidirectional: getNode({
        nodeType: "bidirectional",
        showMenu,
        isDraft: true,
        dispatch,
        anchorRef,
        currentNode,
        setEndToLeaf,
      }),
      timer: getTimer(showModal),
    };
    //
    return types;
  }, [dispatch, setLeafToEnd, setEndToLeaf, showMenu, showModal]);

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
    // Clear previous error
    setTemplateNameError("");

    if (!templateName.trim()) {
      setTemplateNameError("Template name is required");
      return;
    }

    const validation = await verifySequence(nodes);
    if (!validation.isValid) {
      // Instead of showing alert, we need to find the problematic node and open its configuration
      const sequence = getSequence(nodes);
      const problematicNode = sequence.find(node => {
        if (node.type === "MESSAGE") {
          return (
            !node.data?.message_template?.trim().length ||
            !node.data?.alternative_message?.trim().length
          );
        } else if (node.type === "INEMAIL") {
          return (
            !node.data?.subject_template?.trim().length ||
            !node.data?.message_template?.trim().length ||
            !node.data?.alternative_subject?.trim().length ||
            !node.data?.alternative_message?.trim().length
          );
        }
        return false;
      });

      if (problematicNode) {
        // Find the corresponding ReactFlow node
        const reactFlowNode = nodes.find(
          node => node.id === problematicNode.id.toString()
        );
        if (reactFlowNode) {
          // Set the current node and open the configuration modal
          currentNode.current = {
            id: reactFlowNode.id,
            data: reactFlowNode.data,
            type: reactFlowNode.type as any,
            position: reactFlowNode.position,
          };
          setModalVisibility(true);
          setModalType("Configure");
          return;
        }
      }

      // Fallback to alert if we can't find the node
      toast.error(validation.errorMessage);
      return;
    }

    handleDisableButton("save", true);
    await saveSequence(nodes, edges, templateName, templateType);
    router.push("/outreach/templates");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {configureModal}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Template
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Build a visual sequence for your outreach campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={disableBtn.save}
              className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {disableBtn.save ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Template Configuration */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Template Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-2 block">
                    Template Name
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={e => {
                      setTemplateName(e.target.value);
                      if (templateNameError) {
                        setTemplateNameError("");
                      }
                    }}
                    className={
                      templateNameError
                        ? "border-red-500 focus:border-red-500"
                        : ""
                    }
                  />
                  {templateNameError && (
                    <p className="text-red-500 text-sm mt-1">
                      {templateNameError}
                    </p>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium text-sm mb-2">Instructions</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Enter a unique template name</li>
                    <li>• Click on the Start node to add actions</li>
                    <li>• Click on action nodes to configure them</li>
                    <li>• Drag nodes to reposition them</li>
                    <li>• Connect nodes to create your sequence</li>
                    <li>• Save when ready to create your LinkedIn template</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sequence Builder */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Sequence Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[600px] border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{
                      padding: 0.5,
                      minZoom: 0.1,
                      maxZoom: 0.8,
                    }}
                    className="bg-transparent"
                    deleteKeyCode={[]}
                    defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
                    minZoom={0.4}
                    maxZoom={1}
                    onInit={instance => {
                      // Force fit view with zoomed out view
                      setTimeout(() => {
                        instance.fitView({ padding: 0.5, maxZoom: 0.5 });
                      }, 100);
                    }}
                  >
                    <ActionMenu
                      open={actionMenuVisibility}
                      setOpen={setActionMenuVisibility}
                      items={menuItems}
                      anchorRef={anchorRef}
                      dispatch={dispatch}
                      currentNodeId={currentNode.current?.id}
                      nodes={nodes}
                    />
                    <Background color="#94a3b8" gap={20} size={1} />
                    <Controls />
                  </ReactFlow>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
