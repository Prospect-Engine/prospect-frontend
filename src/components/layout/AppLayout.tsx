"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
  activePage?: string;
  className?: string;
  isLoading?: boolean;
}

export default function AppLayout({
  children,
  activePage = "Analytics",
  className,
  isLoading = false,
}: AppLayoutProps) {
  return (
    <div className="h-screen flex flex-col transition-colors duration-300 bg-[#f5f5f7] dark:bg-[#000000]">
      {/* Universal Top Bar - Full Width */}
      <TopBar />

      {/* Main Area - Sidebar + Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Sidebar */}
        <Sidebar activePage={activePage} />

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto p-6 ${className}`}>
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
