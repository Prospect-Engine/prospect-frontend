import React, { useEffect, useRef, useMemo } from "react";
import { MenueItemType, Command } from "@/types/template";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  UserPlus,
  Mail,
  MessageSquare,
  Award,
  ThumbsUp,
  UserMinus,
  AlertCircle,
} from "lucide-react";
import { Node as ReactFlowNode } from "reactflow";
import {
  canAddMessageNode,
  canAddInMailNode,
  canAddWithdrawInvite,
  canAddInviteNode,
  canAddInviteByEmailNode,
} from "@/lib/template/sequenceHelper";

type MenuProps = {
  items: MenueItemType[];
  anchorRef: React.RefObject<any>;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dispatch: (item: MenueItemType) => void;
  clickPosition?: { x: number; y: number };
  currentNodeId?: string;
  nodes?: ReactFlowNode[];
  isAlreadyConnected?: boolean;
};

export default function ActionMenu({
  open,
  setOpen,
  items,
  anchorRef,
  dispatch,
  clickPosition,
  currentNodeId,
  nodes = [],
  isAlreadyConnected = false,
}: MenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Compute validation state for each action command
  const validationState = useMemo(() => {
    if (!currentNodeId || nodes.length === 0) {
      // If no node context, all items are valid (fallback behavior)
      return {};
    }

    const state: Record<
      string,
      { allowed: boolean; reason?: string; warning?: string }
    > = {};

    // Validate each command type
    state["MESSAGE"] = canAddMessageNode(
      currentNodeId,
      nodes,
      isAlreadyConnected
    );
    state["INEMAIL"] = canAddInMailNode(currentNodeId, nodes);
    state["WITHDRAW_INVITE"] = canAddWithdrawInvite(currentNodeId, nodes);
    state["INVITE"] = canAddInviteNode(currentNodeId, nodes);
    state["INVITE_BY_EMAIL"] = canAddInviteByEmailNode(currentNodeId, nodes);

    // These actions are always allowed (no special validation rules)
    state["FOLLOW"] = { allowed: true };
    state["LIKE"] = { allowed: true };
    state["ENDORSE"] = { allowed: true };
    state["VIEW_PROFILE"] = { allowed: true };

    return state;
  }, [currentNodeId, nodes, isAlreadyConnected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    if (open) {
      // Use a small delay to prevent immediate closure
      const timeoutId = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, setOpen]);

  const getIcon = (command: string) => {
    switch (command) {
      case "INVITE":
        return <UserPlus className="w-4 h-4" />;
      case "INEMAIL":
        return <Mail className="w-4 h-4" />;
      case "MESSAGE":
        return <MessageSquare className="w-4 h-4" />;
      case "ENDORSE":
        return <Award className="w-4 h-4" />;
      case "FOLLOW":
        return <UserPlus className="w-4 h-4" />;
      case "LIKE":
        return <ThumbsUp className="w-4 h-4" />;
      case "WITHDRAW_INVITE":
        return <UserMinus className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (!open) return null;

  // Position modal below the parent button/node within ReactFlow
  const getModalPosition = () => {
    // Try to find the ReactFlow container first
    const reactFlowContainer = document.querySelector(".react-flow");

    if (reactFlowContainer && clickPosition) {
      const rect = (reactFlowContainer as HTMLElement).getBoundingClientRect();
      const menuWidth = 240;
      const menuHeight = 300;

      // Calculate position relative to ReactFlow container
      let left = clickPosition.x - rect.left - menuWidth / 2 + 20; // Center horizontally on click relative to ReactFlow, offset right
      let top = clickPosition.y - rect.top + 30; // Small offset below the click point relative to ReactFlow, offset down

      // Ensure menu stays within ReactFlow bounds
      if (left < 10) {
        left = 10;
      } else if (left + menuWidth > rect.width - 10) {
        left = rect.width - menuWidth - 10;
      }

      if (top + menuHeight > rect.height - 10) {
        // If menu would go off bottom, position it above the click point
        top = clickPosition.y - rect.top - menuHeight - 10;
      }

      // Ensure top doesn't go above ReactFlow container
      if (top < 10) {
        top = 10;
      }

      return {
        left: `${left}px`,
        top: `${top}px`,
        transform: "none",
      };
    }

    // Fallback: If we have click position but no ReactFlow container
    if (clickPosition) {
      const menuWidth = 240;
      const menuHeight = 320;

      // Get viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate position below the click point
      let left = clickPosition.x - menuWidth / 2; // Center horizontally on click
      let top = clickPosition.y + 10; // Small offset below the click point

      // Ensure menu stays within viewport bounds
      if (left < 10) {
        left = 10;
      } else if (left + menuWidth > viewportWidth - 10) {
        left = viewportWidth - menuWidth - 10;
      }

      if (top + menuHeight > viewportHeight - 10) {
        // If menu would go off bottom, position it above the click point
        top = clickPosition.y - menuHeight - 10;
      }

      // Ensure top doesn't go above viewport
      if (top < 10) {
        top = 10;
      }

      return {
        left: `${left}px`,
        top: `${top}px`,
        transform: "none",
      };
    }

    // Final fallback: Try to find ReactFlow container and center within it
    if (reactFlowContainer) {
      const rect = (reactFlowContainer as HTMLElement).getBoundingClientRect();
      const menuWidth = 240;
      const estimatedMenuHeight = 320;

      // Position at center of ReactFlow as fallback
      const left = Math.max(
        10,
        Math.min((rect.width - menuWidth) / 2, rect.width - menuWidth - 10)
      );
      const top = Math.max(
        10,
        Math.min(
          (rect.height - estimatedMenuHeight) / 2,
          rect.height - estimatedMenuHeight - 10
        )
      );

      return {
        left: `${left}px`,
        top: `${top}px`,
        transform: "none",
      };
    }

    // Final fallback: center on screen
    return {
      left: "50%",
      top: "50%",
      transform: "translate(-50%, -50%)",
    };
  };

  // Helper to check if an item is disabled based on validation
  const isItemDisabled = (command: Command): boolean => {
    const validation = validationState[command];
    return validation ? !validation.allowed : false;
  };

  // Helper to get the reason for disabled state
  const getDisabledReason = (command: Command): string | undefined => {
    const validation = validationState[command];
    return validation?.reason;
  };

  // Helper to get warning message
  const getWarningMessage = (command: Command): string | undefined => {
    const validation = validationState[command];
    return validation?.warning;
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Backdrop overlay to capture clicks outside */}
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      <div
        ref={menuRef}
        className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-1.5 w-[240px]"
        style={getModalPosition()}
      >
        <div className="space-y-0.5">
          {items?.map((item, index) => {
            const disabled = isItemDisabled(item.command);
            const reason = getDisabledReason(item.command);
            const warning = getWarningMessage(item.command);

            const buttonContent = (
              <Button
                key={index}
                variant="ghost"
                disabled={disabled}
                className={`w-full justify-start gap-2 h-auto py-1.5 px-2 rounded transition-colors ${
                  disabled
                    ? "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                } text-slate-700 dark:text-slate-200`}
                onClick={() => {
                  if (!disabled) {
                    dispatch(item);
                    setOpen(false);
                  }
                }}
              >
                <div className="flex-shrink-0">{getIcon(item.command)}</div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {item.title}
                    </span>
                    {warning && !disabled && (
                      <AlertCircle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  {item.verdict && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight">
                      {item.verdict[0]}
                      {item.verdict[1] && (
                        <>
                          {" / "}
                          <span className="text-green-600 dark:text-green-400">
                            {item.verdict[1]}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                {disabled && (
                  <AlertCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </Button>
            );

            // Wrap with tooltip if there's a reason or warning to show
            if (reason || warning) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div>{buttonContent}</div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className={`max-w-[200px] ${
                      disabled
                        ? "bg-slate-900 dark:bg-slate-700"
                        : "bg-amber-600 dark:bg-amber-700"
                    }`}
                  >
                    <p className="text-xs">{reason || warning}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return buttonContent;
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
