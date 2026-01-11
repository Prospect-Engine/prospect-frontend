/**
 * Unit tests for LinkedIn action validation rules
 * Tests: MESSAGE blocked without INVITE, WITHDRAW_INVITE validation, INEMAIL availability
 */

import {
  canAddMessageNode,
  canAddInMailNode,
  canAddWithdrawInvite,
  canAddInviteNode,
  hasInviteInAncestors,
  hasDelayAfterInvite,
} from "../sequenceHelper";
import { Node } from "reactflow";

// Mock node factory
const createNode = (
  id: string,
  command: string,
  type: string = "unidirectional"
): Node => ({
  id,
  type,
  position: { x: 0, y: 0 },
  data: { command },
});

describe("LinkedIn Action Validation Rules", () => {
  describe("canAddMessageNode", () => {
    it("should block MESSAGE when no INVITE in ancestors", () => {
      // Nodes: 1 (root) -> 2 (FOLLOW) -> 4 (leaf)
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "FOLLOW"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddMessageNode("4", nodes, false);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("INVITE");
    });

    it("should allow MESSAGE when INVITE exists in ancestors", () => {
      // Nodes: 1 (root) -> 2 (INVITE) -> 4 (DELAY) -> 8 (leaf)
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "DELAY", "timer"),
        createNode("8", "NONE", "leaf"),
      ];

      const result = canAddMessageNode("8", nodes, false);
      expect(result.allowed).toBe(true);
    });

    it("should allow MESSAGE for already connected leads (no INVITE required)", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "FOLLOW"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddMessageNode("4", nodes, true); // isAlreadyConnected = true
      expect(result.allowed).toBe(true);
    });

    it("should warn when MESSAGE without DELAY after INVITE", () => {
      // Nodes: 1 (root) -> 2 (INVITE) -> 4 (leaf, no delay)
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddMessageNode("4", nodes, false);
      expect(result.allowed).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe("canAddWithdrawInvite", () => {
    it("should block WITHDRAW_INVITE when no INVITE in ancestors", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "FOLLOW"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddWithdrawInvite("4", nodes);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("INVITE");
    });

    it("should allow WITHDRAW_INVITE when INVITE exists in ancestors", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "DELAY", "timer"),
        createNode("8", "NONE", "leaf"),
      ];

      const result = canAddWithdrawInvite("8", nodes);
      expect(result.allowed).toBe(true);
    });
  });

  describe("canAddInMailNode", () => {
    it("should allow INEMAIL without connection (does not require INVITE)", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "FOLLOW"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddInMailNode("4", nodes);
      expect(result.allowed).toBe(true);
    });

    it("should block duplicate INEMAIL in same path", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INEMAIL", "bidirectional"),
        createNode("4", "NONE", "leaf"),
      ];

      const result = canAddInMailNode("4", nodes);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("one InMail");
    });
  });

  describe("canAddInviteNode", () => {
    it("should block duplicate INVITE in same path", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "DELAY", "timer"),
        createNode("8", "NONE", "leaf"),
      ];

      const result = canAddInviteNode("8", nodes);
      expect(result.allowed).toBe(false);
    });

    it("should allow INVITE when no prior INVITE", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "NONE", "leaf"),
      ];

      const result = canAddInviteNode("2", nodes);
      expect(result.allowed).toBe(true);
    });
  });

  describe("hasInviteInAncestors", () => {
    it("should detect INVITE in ancestor chain", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "DELAY", "timer"),
        createNode("8", "NONE", "leaf"),
      ];

      expect(hasInviteInAncestors("8", nodes)).toBe(true);
    });

    it("should return false when no INVITE in chain", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "FOLLOW"),
        createNode("4", "NONE", "leaf"),
      ];

      expect(hasInviteInAncestors("4", nodes)).toBe(false);
    });
  });

  describe("hasDelayAfterInvite", () => {
    it("should detect DELAY between node and INVITE", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "DELAY", "timer"),
        createNode("8", "NONE", "leaf"),
      ];

      expect(hasDelayAfterInvite("8", nodes)).toBe(true);
    });

    it("should return false when no DELAY after INVITE", () => {
      const nodes: Node[] = [
        createNode("1", "NONE", "root"),
        createNode("2", "INVITE", "bidirectional"),
        createNode("4", "NONE", "leaf"),
      ];

      expect(hasDelayAfterInvite("4", nodes)).toBe(false);
    });
  });
});
