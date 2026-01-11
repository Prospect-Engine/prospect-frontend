"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface Counts {
  leads: {
    total: number;
    customers: number;
    prospects: number;
    partnerships: number;
    network: number;
  };
  companies: {
    total: number;
    active: number;
    prospects: number;
    customers: number;
    partners: number;
  };
  deals: {
    total: number;
    open: number;
    won: number;
    lost: number;
    paused: number;
  };
  tasks: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
  };
  pipeline: {
    total: number;
    uniqueContacts?: number;
    uniqueCompanies?: number;
    pipelineCounts?: {
      [pipelineId: string]: {
        uniqueContacts: number;
        uniqueCompanies: number;
        totalUnique: number;
      };
    };
    categoryCounts?: {
      [categoryId: string]: {
        uniqueContacts: number;
        uniqueCompanies: number;
        totalUnique: number;
      };
    };
  };
}

interface CountsContextType {
  counts: Counts;
  updateCounts: (newCounts: Partial<Counts>) => void;
  incrementCount: (
    type: "leads" | "companies" | "deals",
    category: string,
    amount?: number
  ) => void;
  decrementCount: (
    type: "leads" | "companies" | "deals",
    category: string,
    amount?: number
  ) => void;
  resetCounts: () => void;
}

const defaultCounts: Counts = {
  leads: {
    total: 0,
    customers: 0,
    prospects: 0,
    partnerships: 0,
    network: 0,
  },
  companies: {
    total: 0,
    active: 0,
    prospects: 0,
    customers: 0,
    partners: 0,
  },
  deals: {
    total: 0,
    open: 0,
    won: 0,
    lost: 0,
    paused: 0,
  },
  tasks: {
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  },
  pipeline: {
    total: 0,
    uniqueContacts: 0,
    uniqueCompanies: 0,
    pipelineCounts: {},
    categoryCounts: {},
  },
};

const CountsContext = createContext<CountsContextType | undefined>(undefined);

export const CountsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [counts, setCounts] = useState<Counts>(defaultCounts);

  const updateCounts = useCallback((newCounts: Partial<Counts>) => {
    setCounts(prev => ({
      ...prev,
      ...newCounts,
    }));
  }, []);

  const incrementCount = useCallback(
    (
      type: "leads" | "companies" | "deals",
      category: string,
      amount: number = 1
    ) => {
      setCounts(prev => ({
        ...prev,
        [type]: {
          ...prev[type],
          [category]: Math.max(
            0,
            (prev[type] as Record<string, number>)[category] + amount
          ),
        },
      }));
    },
    []
  );

  const decrementCount = useCallback(
    (
      type: "leads" | "companies" | "deals",
      category: string,
      amount: number = 1
    ) => {
      //

      setCounts(prev => {
        const newCounts = {
          ...prev,
          [type]: {
            ...prev[type],
            [category]: Math.max(
              0,
              (prev[type] as Record<string, number>)[category] - amount
            ),
          },
        };
        //

        return newCounts;
      });
    },
    []
  );

  const resetCounts = useCallback(() => {
    setCounts(defaultCounts);
  }, []);

  return (
    <CountsContext.Provider
      value={{
        counts,
        updateCounts,
        incrementCount,
        decrementCount,
        resetCounts,
      }}
    >
      {children}
    </CountsContext.Provider>
  );
};

export const useCountsContext = () => {
  const context = useContext(CountsContext);
  if (context === undefined) {
    // During SSR, return default values
    if (typeof window === "undefined") {
      return {
        counts: defaultCounts,
        updateCounts: () => {},
        incrementCount: () => {},
        decrementCount: () => {},
        resetCounts: () => {},
      };
    }
    throw new Error("useCountsContext must be used within a CountsProvider");
  }
  return context;
};
