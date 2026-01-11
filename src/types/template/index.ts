import { Connection, Edge, Node, XYPosition } from "reactflow";

export type ActionType =
  | "CreateTwoChild"
  | "CreateSingleChild"
  | "Delete"
  | "Configure";
export type NodeType =
  | "root"
  | "leaf"
  | "unidirectional"
  | "bidirectional"
  | "timer";
export type MenuType = "SetAction" | "Configure";
export type ModalType = "Timer" | "Configure";
export type TimerUnit = "Days" | "Hours";

export type DecisionCommand = "INVITE" | "INVITE_BY_EMAIL" | "FIND_EMAIL";
export type MenuCommand = "DELETE" | "Configure";
export type Command =
  | DecisionCommand
  | MenuCommand
  | "NONE"
  | "MESSAGE"
  | "FOLLOW"
  | "LIKE"
  | "DELAY"
  | "END"
  | "VIEW_PROFILE"
  | "ENDORSE"
  | "WITHDRAW_INVITE"
  | "INEMAIL";

export type MenueItemType = {
  title: string;
  icon: string;
  type: MenuType;
  action: ActionType;
  command: Command;
  verdict?: string[];
};

export type TimerData = { label: string; count: number; unit: TimerUnit };
export type NodeData = {
  label: string;
  icon?: string;
  message?: string;
  subject?: string;
  alternativeMessage?: string;
  alternativeSubject?: string;
  attachments?: Array<{
    data: string;
    name: string;
    type: string;
    size?: number;
    url?: string;
  }>;
};

export type NodeInfo = {
  id: string;
  type: NodeType;
  data: { value: null | NodeData | TimerData; command: Command };
  position: XYPosition;
};

export type NodeSequence = {
  id: number;
  type: string;
  name: string;
  data?: {
    delay_unit?: string;
    delay_value?: string;
    message_template?: string;
    alternative_message?: string;
    message?: string;
    subject_template?: string;
    alternative_subject?: string;
    attachments?: Array<{
      url: string;
      name: string;
      type: string;
    }>;
  };
};

export type SequenceEdge = Connection & {
  label?: string;
  labelStyle?: Record<string, string | number>;
  labelShowBg?: boolean;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  labelBgStyle?: Record<string, string | number>;
};

export type Diagram = {
  nodes: Node[];
  edges: Edge[];
};

export type Template = {
  name: string;
  sequence_type: string;
  sequence: NodeSequence[];
  id: string;
  created_at: string | Date;
  diagram: Diagram;
};

// Validation types for LinkedIn action sequence rules
export type ValidationErrorCode =
  | "MESSAGE_REQUIRES_INVITE"
  | "MESSAGE_REQUIRES_DELAY"
  | "WITHDRAW_REQUIRES_INVITE"
  | "INVITE_ALREADY_EXISTS"
  | "INEMAIL_ALREADY_EXISTS"
  | "INVITE_BY_EMAIL_REQUIRES_FIND_EMAIL"
  | "INVALID_ACTION_SEQUENCE";

export type ValidationError = {
  code: ValidationErrorCode;
  message: string;
  command: Command;
  severity: "error" | "warning";
};

export type ValidationState = {
  isValid: boolean;
  errors: ValidationError[];
  disabledCommands: Command[];
  hasInviteInAncestors: boolean;
  hasDelayAfterInvite: boolean;
  hasInEmailInPath: boolean;
};
