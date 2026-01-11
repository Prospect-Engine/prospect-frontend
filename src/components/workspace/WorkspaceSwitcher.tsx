"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ChevronDown, User, Building2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import ShowShortMessage from "@/base-component/ShowShortMessage";

interface WorkspaceSwitcherProps {
  className?: string;
  variant?: "dropdown" | "select";
  showSearch?: boolean;
  placeholder?: string;
}

export function WorkspaceSwitcher({
  className,
  variant = "dropdown",
  showSearch = true,
  placeholder = "Switch workspace...",
}: WorkspaceSwitcherProps) {
  const { switchableAccounts, switchWorkspace, switchOrganization, isLoading } =
    useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Helper to get workspace ID
  const getWorkspaceId = (account: any) => account.workspace_id;

  // Helper to get workspace name
  const getWorkspaceName = (account: any) => account.workspace_name;

  // Helper to get organization ID
  const getOrganizationId = (account: any) => account.organization_id;

  // Filter accounts based on search query
  const filteredAccounts = switchableAccounts.filter(
    account =>
      account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getWorkspaceName(account)
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleAccountSwitch = async (account: any) => {
    const workspaceId = getWorkspaceId(account);
    const organizationId = getOrganizationId(account);

    setIsSwitching(true);
    try {
      if (!workspaceId && organizationId) {
        const result = await switchOrganization(organizationId);
        if (result.needsWorkspaceCreation) {
          ShowShortMessage("Please create a workspace to continue", "info");
        } else {
          ShowShortMessage("Successfully switched organization", "success");
        }
      } else if (workspaceId) {
        await switchWorkspace(workspaceId);
        ShowShortMessage("Successfully switched workspace", "success");
      } else {
        ShowShortMessage("No workspace or organization ID found", "error");
        return;
      }
      setIsOpen(false);
    } catch (error) {
      ShowShortMessage("Failed to switch", "error");
    } finally {
      setIsSwitching(false);
    }
  };

  if (variant === "select") {
    return (
      <div className={cn("w-full", className)}>
        <Select
          value=""
          onValueChange={value => {
            const account = switchableAccounts.find(
              acc => `${acc.user_id}-${getWorkspaceId(acc) || ""}` === value
            );
            if (account) {
              handleAccountSwitch(account);
            }
          }}
          disabled={isLoading || isSwitching}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
            {isSwitching && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </SelectTrigger>
          <SelectContent>
            {filteredAccounts.map(account => (
              <SelectItem
                key={`${account.user_id}-${getWorkspaceId(account) || ""}`}
                value={`${account.user_id}-${getWorkspaceId(account) || ""}`}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{account.name}</p>
                    <p className="text-xs text-gray-500">
                      {getWorkspaceName(account)}
                    </p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={isLoading || isSwitching}
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-gray-600" />
              </div>
              <span className="text-sm">
                {isLoading ? "Loading..." : "Switch Account"}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
            {isSwitching && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-80 p-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 shadow-xl rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50">
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  Switch Account
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Switch to a different workspace
                </p>
              </div>
            </div>

            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search accounts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-500"
                />
              </div>
            )}
          </div>

          {/* Accounts List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery ? "No accounts found" : "No accounts available"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredAccounts.map(account => (
                  <div
                    key={`${account.user_id}-${getWorkspaceId(account) || ""}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => handleAccountSwitch(account)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">
                          {account.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {getWorkspaceName(account)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {getWorkspaceId(account) && (
                        <Badge variant="secondary" className="text-xs">
                          Workspace
                        </Badge>
                      )}
                      <ChevronDown className="w-3 h-3 text-gray-400 rotate-[-90deg]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {filteredAccounts.length} account
              {filteredAccounts.length !== 1 ? "s" : ""} available
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Legacy alias for backward compatibility
export const TeamSwitcher = WorkspaceSwitcher;

export default WorkspaceSwitcher;
