import React from "react";
import { ModalType, NodeInfo } from "@/types/template";
import { Handle, NodeProps, Position } from "reactflow";
import { TIMER_WIDTH } from "@/lib/template/options";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNodeHasError } from "../ErrorNodesContext";

const getTimer = (showModal: (node: NodeInfo, menuType: ModalType) => void) => {
  const Timer = ({ id, data, isConnectable, xPos, yPos }: NodeProps) => {
    const hasError = useNodeHasError(id);
    const nodeInfo: NodeInfo = {
      id,
      type: "timer",
      data,
      position: { x: xPos, y: yPos },
    };

    const handleClick = () => {
      showModal(nodeInfo, "Timer");
    };

    return (
      <div
        className={cn(
          "border rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center p-3 shadow-sm cursor-pointer hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-all duration-300",
          hasError
            ? "border-red-500 border-2 ring-2 ring-red-500/30 animate-pulse"
            : "border-yellow-400 dark:border-yellow-500"
        )}
        style={{ width: `${TIMER_WIDTH}px` }}
        onClick={handleClick}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            {data.value?.count && data.value.count > 0
              ? `${data.value.count} ${data.value.unit}`
              : "No delay"}
          </span>
        </div>
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          isConnectable={isConnectable}
          className="w-3 h-3 bg-yellow-400 dark:bg-yellow-500"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          isConnectable={isConnectable}
          className="w-3 h-3 bg-yellow-400 dark:bg-yellow-500"
        />
      </div>
    );
  };
  return Timer;
};

export default getTimer;
