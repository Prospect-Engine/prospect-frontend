import { Dispatch, SetStateAction } from "react";
import { NodeInfo, ModalType, TimerData } from "@/types/template";
import { Node } from "reactflow";
import TimerComponent from "./timer";
import ConfigureComponent from "./configuration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ModalProps = {
  show: boolean;
  handleClose: () => void;
  setNodes: Dispatch<SetStateAction<Node[]>>;
  targetNode: NodeInfo | null;
  modalType: ModalType;
};

const Modal = ({
  show,
  handleClose,
  modalType,
  setNodes,
  targetNode,
}: ModalProps) => {
  if (!targetNode) return <></>;

  const submit = (value: any) => {
    if (!targetNode) return;
    setNodes((prevNodes: Node[]) => {
      return prevNodes.map((node: Node) => {
        if (node.id === targetNode.id) {
          // Create a completely new node object to ensure ReactFlow detects the change
          return {
            ...node,
            data: {
              ...node.data,
              value: value,
            },
          };
        }
        return node;
      });
    });
    handleClose();
  };

  let body = <></>;
  switch (modalType) {
    case "Timer":
      body = (
        <TimerComponent
          initialValue={targetNode.data.value as TimerData | null}
          submit={submit}
        />
      );
      break;
    case "Configure":
      body = (
        <ConfigureComponent initialData={targetNode.data} submit={submit} />
      );
      break;
  }

  return (
    <Dialog open={show} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            Configure {modalType === "Timer" ? "Timer" : "Action"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 overflow-y-auto flex-1 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {body}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Modal;
