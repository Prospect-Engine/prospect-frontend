import { Command, MenueItemType } from "@/types/template";

export const configureItems: MenueItemType[] = [
  {
    title: "Configure",
    icon: "iconamoon:edit",
    type: "Configure",
    action: "Configure",
    command: "Configure",
  },
  {
    title: "Delete",
    icon: "mdi:trash-can-outline",
    type: "Configure",
    action: "Delete",
    command: "DELETE",
  },
];

export const actionItems: MenueItemType[] = [
  {
    title: "Send an invite",
    icon: "mdi:account-plus",
    action: "CreateTwoChild",
    type: "SetAction",
    command: "INVITE",
    verdict: ["Still Not Connected", "Connected"],
  },
  // {
  //   title: "Invite by email",
  //   icon: "mdi:email-plus-outline",
  //   action: "CreateTwoChild",
  //   type: "SetAction",
  //   command: "INVITE_BY_EMAIL",
  //   verdict: ["Still Not Connected", "Connected"],
  // },
  // {
  //   title: "View Profile",
  //   icon: "mdi:account-eye-outline",
  //   action: "CreateSingleChild",
  //   type: "SetAction",
  //   command: "VIEW_PROFILE",
  // },
  {
    title: "Inmail",
    icon: "mdi:email-edit-outline",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "INEMAIL",
  },
  {
    title: "Send Message",
    icon: "mdi:chat-processing-outline",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "MESSAGE",
  },
  // {
  //   title: "Find email",
  //   icon: "mdi:email-search-outline",
  //   action: "CreateTwoChild",
  //   type: "SetAction",
  //   command: "FIND_EMAIL",
  //   verdict: ["Email Not Found", "Email has been found"],
  // },

  {
    title: "Endorse Skill",
    icon: "mdi:draw-pen",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "ENDORSE",
  },
  {
    title: "Follow",
    icon: "mdi:transit-connection-variant",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "FOLLOW",
  },
  {
    title: "Like post",
    icon: "mdi:thumb-up-outline",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "LIKE",
  },
  {
    title: "Withdraw Invite",
    icon: "mdi:account-cancel-outline",
    action: "CreateSingleChild",
    type: "SetAction",
    command: "WITHDRAW_INVITE",
  },
];

export const messageVariables: { label: string; value: string }[] = [
  { label: "First name", value: "{{first_name}}" },
  { label: "Last name", value: "{{last_name}}" },
  { label: "Position", value: "{{position}}" },
  { label: "Company", value: "{{company}}" },
];

export const configurableCommands: Command[] = [
  "INVITE",
  "INVITE_BY_EMAIL",
  "INEMAIL",
  "MESSAGE",
];
export const commandsHaveTitle: Command[] = ["INVITE_BY_EMAIL", "INEMAIL"];
export const NODE_WIDTH = 266;
export const TIMER_WIDTH = 150;
export const X_DISTANCE_OF_CHILD = 300;
