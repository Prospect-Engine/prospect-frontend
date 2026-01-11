"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Contact,
  Deal,
  Company,
  TaskWithRelations,
} from "../../types/sales-types";
import LeadDetailPanel from "../../components/sales-components/LeadDetailPanel";
import DealDetailPanel from "../../components/sales-components/DealDetailPanel";
import CompanyDetailPanel from "../../components/sales-components/CompanyDetailPanel";
import TaskDetailPanel from "../../components/sales-components/TaskDetailPanel";

interface DetailPanelContextType {
  openLeadDetail: (lead: Contact) => void;
  openDealDetail: (deal: Deal) => void;
  openCompanyDetail: (company: Company) => void;
  openTaskDetail: (task: TaskWithRelations) => void;
  closeDetailPanel: () => void;
  isDetailPanelOpen: boolean;
}

const DetailPanelContext = createContext<DetailPanelContextType | undefined>(
  undefined
);

interface DetailPanelProviderProps {
  children: ReactNode;
}

export const DetailPanelProvider: React.FC<DetailPanelProviderProps> = ({
  children,
}) => {
  const router = useRouter();
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Contact | null>(null);
  const [currentDeal, setCurrentDeal] = useState<Deal | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [currentTask, setCurrentTask] = useState<TaskWithRelations | null>(
    null
  );

  const openLeadDetail = (lead: Contact) => {
    setCurrentLead(lead);
    setCurrentDeal(null);
    setCurrentCompany(null);
    setCurrentTask(null);
    setIsDetailPanelOpen(true);
  };

  const openDealDetail = (deal: Deal) => {
    setCurrentDeal(deal);
    setCurrentLead(null);
    setCurrentCompany(null);
    setCurrentTask(null);
    setIsDetailPanelOpen(true);
  };

  const openCompanyDetail = (company: Company) => {
    setCurrentCompany(company);
    setCurrentLead(null);
    setCurrentDeal(null);
    setCurrentTask(null);
    setIsDetailPanelOpen(true);
  };

  const openTaskDetail = (task: TaskWithRelations) => {
    setCurrentTask(task);
    setCurrentLead(null);
    setCurrentDeal(null);
    setCurrentCompany(null);
    setIsDetailPanelOpen(true);
  };

  const closeDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setCurrentLead(null);
    setCurrentDeal(null);
    setCurrentCompany(null);
    setCurrentTask(null);
  };

  const handleLeadUpdate = (updatedLead: Contact) => {
    setCurrentLead(updatedLead);
  };

  const handleDealUpdate = (updatedDeal: Deal) => {
    setCurrentDeal(updatedDeal);
  };

  const handleCompanyUpdate = (updatedCompany: Company) => {
    setCurrentCompany(updatedCompany);
  };

  const handleTaskUpdate = (updatedTask: TaskWithRelations) => {
    setCurrentTask(updatedTask);
  };

  const handleTaskEdit = (taskId: string) => {
    router.push("/tasks");
  };

  const handleTaskDelete = () => {
    router.push("/tasks");
  };

  return (
    <DetailPanelContext.Provider
      value={{
        openLeadDetail,
        openDealDetail,
        openCompanyDetail,
        openTaskDetail,
        closeDetailPanel,
        isDetailPanelOpen,
      }}
    >
      {children}

      {/* Detail Panels */}
      {isDetailPanelOpen && currentLead && (
        <LeadDetailPanel
          lead={currentLead}
          onClose={closeDetailPanel}
          onUpdate={handleLeadUpdate}
        />
      )}

      {isDetailPanelOpen && currentDeal && (
        <DealDetailPanel
          deal={currentDeal}
          onClose={closeDetailPanel}
          onUpdate={handleDealUpdate}
        />
      )}

      {isDetailPanelOpen && currentCompany && (
        <CompanyDetailPanel
          company={currentCompany}
          onClose={closeDetailPanel}
          onUpdate={handleCompanyUpdate}
        />
      )}

      {isDetailPanelOpen && currentTask && (
        <TaskDetailPanel
          task={currentTask}
          onClose={closeDetailPanel}
          onUpdate={handleTaskUpdate}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDelete}
        />
      )}
    </DetailPanelContext.Provider>
  );
};

export const useDetailPanel = () => {
  const context = useContext(DetailPanelContext);
  if (context === undefined) {
    throw new Error("useDetailPanel must be used within a DetailPanelProvider");
  }
  return context;
};
