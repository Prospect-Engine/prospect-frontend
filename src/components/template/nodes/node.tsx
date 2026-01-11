import React, { MutableRefObject, useRef } from "react";
import {
  Command,
  MenuType,
  MenueItemType,
  NodeInfo,
  NodeType,
} from "@/types/template";
import { Handle, NodeProps, Position } from "reactflow";
import { Button } from "@/components/ui/button";
import {
  NODE_WIDTH,
  configurableCommands,
  configureItems,
} from "@/lib/template/options";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  UserPlus,
  Award,
  ThumbsUp,
  UserMinus,
  Mail,
  Settings,
  Trash2,
  Square,
} from "lucide-react";
import { useNodeHasError } from "../ErrorNodesContext";

type GetNodeProps = {
  nodeType: NodeType;
  showMenu: (
    ref: any,
    node: NodeInfo,
    menuType: MenuType,
    event?: React.MouseEvent
  ) => void;
  isDraft: boolean;
  dispatch?: (item: MenueItemType) => void;
  setLeafToEnd?: (id: string) => void;
  setEndToLeaf?: (id: string) => void;
  anchorRef?: any;
  currentNode?: MutableRefObject<NodeInfo | null>;
};

const getNode = ({
  nodeType,
  showMenu,
  isDraft,
  dispatch,
  setLeafToEnd,
  setEndToLeaf,
  anchorRef,
  currentNode,
}: GetNodeProps) => {
  const Node = ({ id, data, isConnectable, xPos, yPos }: NodeProps) => {
    const hasError = useNodeHasError(id);
    const actionRef = useRef(null);
    const configRef = useRef(null);

    const nodeInfo: NodeInfo = {
      id,
      type: nodeType,
      data,
      position: { x: xPos, y: yPos },
    };

    const command: Command = nodeInfo.data.command;
    const configurable = configurableCommands.find(c => c === command);
    const configMenuItems =
      nodeType == "root"
        ? []
        : configurable
          ? isDraft
            ? configureItems
            : [configureItems[0]]
          : isDraft
            ? [configureItems[1]]
            : [];

    const handleActionClick = (event: React.MouseEvent) => {
      // Only show menu for root node or nodes with NONE command
      // Don't show menu for already configured action nodes
      if (nodeType === "root" || command === "NONE") {
        showMenu(actionRef, nodeInfo, "SetAction", event);
      }
    };

    const handleSetEndClick = () => {
      if (setLeafToEnd) setLeafToEnd(nodeInfo.id);
    };

    const handleToggleEndClick = () => {
      if (setEndToLeaf) setEndToLeaf(nodeInfo.id);
    };

    const getIcon = (command: Command) => {
      switch (command) {
        case "MESSAGE":
          return <MessageSquare className="w-4 h-4" />;
        case "INVITE":
          return <UserPlus className="w-4 h-4" />;
        case "INEMAIL":
          return <Mail className="w-4 h-4" />;
        case "ENDORSE":
          return <Award className="w-4 h-4" />;
        case "FOLLOW":
          return <UserPlus className="w-4 h-4" />;
        case "LIKE":
          return <ThumbsUp className="w-4 h-4" />;
        case "WITHDRAW_INVITE":
          return <UserMinus className="w-4 h-4" />;
        case "END":
          return <Square className="w-4 h-4" />;
        default:
          return <MessageSquare className="w-4 h-4" />;
      }
    };

    let nonRootComponent = null;

    if (nodeType !== "root") {
      if (data.command === "END") {
        // END nodes get a toggle button to convert back to leaf
        nonRootComponent = (
          <div ref={configRef}>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3 rounded-l-none border-l-0 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 dark:border-red-700 dark:text-red-200"
              onClick={handleToggleEndClick}
              title="Continue sequence"
            >
              Continue
            </Button>
          </div>
        );
      } else {
        // Regular nodes get End button (leaf) or config/delete buttons (others)
        nonRootComponent = (
          <div ref={configRef}>
            {nodeType === "leaf" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 px-3 rounded-l-none border-l-0 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-200"
                onClick={handleSetEndClick}
              >
                End
              </Button>
            ) : (
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-l-none border-l-0">
                {configMenuItems.map((item, index) => {
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
                      onClick={() => {
                        if (!!dispatch && !!currentNode) {
                          anchorRef.current = configRef;
                          currentNode.current = nodeInfo;
                          dispatch(item);
                        }
                      }}
                    >
                      {item.command === "Configure" ? (
                        <Settings className="w-4 h-4" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }
    }

    return (
      <div
        ref={actionRef}
        className={cn(
          "border rounded-md bg-white dark:bg-gray-800 flex items-center min-w-[200px] shadow-sm transition-all duration-300",
          nodeType === "leaf"
            ? "bg-gray-50 dark:bg-gray-700"
            : "bg-white dark:bg-gray-800",
          hasError
            ? "border-red-500 border-2 ring-2 ring-red-500/30 animate-pulse"
            : "border-gray-300 dark:border-gray-600"
        )}
        style={{ width: `${NODE_WIDTH}px`, minWidth: `${NODE_WIDTH}px` }}
      >
        <div
          className="flex-1 flex items-center justify-center gap-2 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-md"
          onClick={handleActionClick}
        >
          {data.command === "END" ? (
            <>
              <Square className="w-4 h-4 text-red-500 dark:text-red-400" />
              <span className="text-sm font-medium dark:text-gray-200">
                End of the sequence
              </span>
            </>
          ) : (
            <>
              {getIcon(data.command)}
              <span className="text-sm font-medium dark:text-gray-200">
                {data.value?.label || "Set Action"}
              </span>
            </>
          )}
        </div>
        {nonRootComponent}
        {nodeType !== "root" && (
          <Handle
            type="target"
            position={Position.Top}
            id="top"
            isConnectable={isConnectable}
            className="w-3 h-3 bg-gray-400 dark:bg-gray-500"
          />
        )}
        {nodeType !== "leaf" && nodeType !== "bidirectional" && (
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            isConnectable={isConnectable}
            className="w-3 h-3 bg-gray-400 dark:bg-gray-500"
          />
        )}
        {nodeType == "bidirectional" && (
          <>
            <Handle
              type="source"
              position={Position.Left}
              id="left"
              isConnectable={isConnectable}
              className="w-3 h-3 bg-gray-400 dark:bg-gray-500"
            />
            <Handle
              type="source"
              position={Position.Right}
              id="right"
              isConnectable={isConnectable}
              className="w-3 h-3 bg-gray-400 dark:bg-gray-500"
            />
          </>
        )}
      </div>
    );
  };
  return Node;
};

export default getNode;
