"use client";

import React from "react";
import AuthProvider from "./AuthProvider";
import { WorkspaceProvider } from "../../contexts/sales-contexts/WorkspaceContext";
import { CountsProvider } from "../../contexts/sales-contexts/CountsContext";
import { DetailPanelProvider } from "../../contexts/sales-contexts/DetailPanelContext";
import { GlobalMessageProvider } from "../../contexts/sales-contexts/GlobalMessageContext";
import { GlobalWhatsAppStatusProvider } from "../../contexts/sales-contexts/GlobalWhatsAppStatusContext";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <GlobalMessageProvider>
          <GlobalWhatsAppStatusProvider>
            <CountsProvider>
              <DetailPanelProvider>{children}</DetailPanelProvider>
            </CountsProvider>
          </GlobalWhatsAppStatusProvider>
        </GlobalMessageProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default Providers;
