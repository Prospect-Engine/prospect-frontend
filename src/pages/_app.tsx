import type { AppProps } from "next/app";
import Head from "next/head";
import "../pages/globals.css";
import { Toaster } from "@/components/ui/sonner";
import MaintenanceMode from "@/components/maintenance/MaintenanceMode";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { ChatProvider } from "@/context/ChatContext";
// CRM Providers - WorkspaceProvider needed for inbox/CRM pages
import CrmProviders from "@/components/sales-components/Providers";
import { useAuthSync } from "@/hooks/useAuthSync";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ChatLayoutWrapper } from "@/components/chat/ChatLayoutWrapper";

function AppWithAuthSync({ Component, pageProps }: AppProps) {
  // Initialize cross-tab authentication synchronization
  useAuthSync();

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <meta name="msapplication-TileImage" content="/favicon.png" />
        <meta name="theme-color" content="#000000" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={true}
        disableTransitionOnChange={false}
        storageKey="theme"
      >
        <MaintenanceMode>
          <AuthProvider>
            <SocketProvider>
              <CrmProviders>
                <ChatProvider>
                  <ChatLayoutWrapper>
                    <Component {...pageProps} />
                  </ChatLayoutWrapper>
                  <Toaster />
                </ChatProvider>
              </CrmProviders>
            </SocketProvider>
          </AuthProvider>
        </MaintenanceMode>
      </ThemeProvider>
    </>
  );
}

export default function App(props: AppProps) {
  return <AppWithAuthSync {...props} />;
}
