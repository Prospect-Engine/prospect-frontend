"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ErrorNodesContextType {
  errorNodeIds: string[];
  setErrorNodeIds: (ids: string[]) => void;
  clearErrorNodes: () => void;
  highlightErrorNodes: (ids: string[], durationMs?: number) => void;
}

const ErrorNodesContext = createContext<ErrorNodesContextType | undefined>(
  undefined
);

export function ErrorNodesProvider({ children }: { children: ReactNode }) {
  const [errorNodeIds, setErrorNodeIdsState] = useState<string[]>([]);

  const setErrorNodeIds = useCallback((ids: string[]) => {
    setErrorNodeIdsState(ids);
  }, []);

  const clearErrorNodes = useCallback(() => {
    setErrorNodeIdsState([]);
  }, []);

  const highlightErrorNodes = useCallback(
    (ids: string[], durationMs = 5000) => {
      setErrorNodeIdsState(ids);
      if (durationMs > 0) {
        setTimeout(() => {
          setErrorNodeIdsState([]);
        }, durationMs);
      }
    },
    []
  );

  return (
    <ErrorNodesContext.Provider
      value={{
        errorNodeIds,
        setErrorNodeIds,
        clearErrorNodes,
        highlightErrorNodes,
      }}
    >
      {children}
    </ErrorNodesContext.Provider>
  );
}

export function useErrorNodes() {
  const context = useContext(ErrorNodesContext);
  if (context === undefined) {
    throw new Error("useErrorNodes must be used within an ErrorNodesProvider");
  }
  return context;
}

export function useNodeHasError(nodeId: string): boolean {
  const { errorNodeIds } = useErrorNodes();
  return errorNodeIds.includes(nodeId);
}
