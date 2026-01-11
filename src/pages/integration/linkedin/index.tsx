"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Plus,
  Settings,
  MoreVertical,
  UserPlus,
  Link2Off,
  RefreshCw,
  Clock,
  Globe,
  Mail,
  ShieldCheck,
  Info,
  ChevronLeft,
  ChevronRight,
  Crown,
  MessageSquare,
  Send,
  ArrowLeft,
} from "lucide-react";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Real LinkedIn Logo Component
const LinkedInLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    className={className}
  >
    <path
      fill="currentColor"
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
    />
  </svg>
);

interface LinkedInAccount {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  is_connected: boolean;
  connection_status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  is_premium: boolean;
  campaigns_count: number;
  sending_limits: {
    connections: number;
    messages: number;
    inmails: number;
  };
  last_sync?: string;
}

const ITEMS_PER_PAGE = 10;

export default function LinkedInAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSeats, setTotalSeats] = useState(10);
  const [usedSeats, setUsedSeats] = useState(0);
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  // Fetch LinkedIn accounts
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const { data, status } = await apiCall({
        url: "/api/integration/list",
        method: "get",
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        const linkedInAccounts = (
          Array.isArray(data) ? data : data?.integrations || []
        )
          .filter((item: any) => item?.type === "LINKEDIN")
          .map((item: any) => ({
            id: item.id,
            name: item.account_name || item.name || item.email,
            email: item.email,
            profile_picture: item.propic_url,
            is_connected: item.connection_status === "CONNECTED",
            connection_status: item.connection_status || "DISCONNECTED",
            is_premium: Boolean(item.is_premium),
            campaigns_count: item.campaigns_count || 0,
            sending_limits: {
              connections: item.daily_connection_limit || 25,
              messages: item.daily_message_limit || 40,
              inmails: item.daily_inmail_limit || 40,
            },
            last_sync: item.last_sync,
          }));

        setAccounts(linkedInAccounts);
        setUsedSeats(linkedInAccounts.length);
      }
    } catch (error) {
      toast.error("Failed to fetch LinkedIn accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  // Filter and search accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        account.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "connected" && account.is_connected) ||
        (statusFilter === "disconnected" && !account.is_connected) ||
        (statusFilter === "in_campaign" && account.campaigns_count > 0) ||
        (statusFilter === "available" && account.campaigns_count === 0);

      return matchesSearch && matchesStatus;
    });
  }, [accounts, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / ITEMS_PER_PAGE);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDisconnect = async (accountId: string) => {
    try {
      const { status } = await apiCall({
        url: `/api/integration/disconnect`,
        method: "post",
        body: { integration_id: accountId },
        applyDefaultDomain: false,
      });

      if (isSuccessful(status)) {
        toast.success("Account disconnected successfully");
        fetchAccounts();
      }
    } catch (error) {
      toast.error("Failed to disconnect account");
    }
  };

  const handleResync = async (accountId: string) => {
    toast.info("Re-syncing account...");
    // API call for resync would go here
    setTimeout(() => {
      toast.success("Account re-synced successfully");
    }, 2000);
  };

  const getStatusBadge = (account: LinkedInAccount) => {
    if (!account.is_connected) {
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
        >
          Not connected
        </Badge>
      );
    }
    if (account.campaigns_count > 0) {
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
        >
          <Send className="w-3 h-3 mr-1" />
          In {account.campaigns_count} campaign{account.campaigns_count > 1 ? "s" : ""}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
        Available
      </Badge>
    );
  };

  // Table skeleton
  const TableSkeleton = () => (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="animate-pulse border-b border-gray-100 dark:border-gray-800">
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-40" />
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28" />
          </td>
          <td className="px-4 py-4">
            <div className="flex gap-4">
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
              <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </td>
          <td className="px-4 py-4">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          </td>
        </tr>
      ))}
    </>
  );

  return (
    <AuthGuard>
      <AppLayout activePage="Integration">
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => router.push("/integration")}
              className="mb-4 -ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Integrations
            </Button>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0A66C2] rounded-xl flex items-center justify-center">
                  <LinkedInLogo className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    LinkedIn Accounts
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Manage your connected LinkedIn accounts
                  </p>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  The LinkedIn accounts are called <strong>senders</strong> when put in a campaign.
                  Connect multiple LinkedIn sending accounts on one campaign to increase your daily
                  sending volume.
                </p>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search senders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64 bg-white dark:bg-gray-900 rounded-lg"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 bg-white dark:bg-gray-900 rounded-lg">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="connected">Connected</SelectItem>
                    <SelectItem value="disconnected">Disconnected</SelectItem>
                    <SelectItem value="in_campaign">In Campaign</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Seats and Actions */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  {totalSeats - usedSeats} seats available
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Purchase seats
                  </Button>
                  <Button
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg"
                    onClick={() => setShowConnectDialog(true)}
                  >
                    <LinkedInLogo className="w-4 h-4 mr-2" />
                    Connect account
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        LinkedIn Account
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Sending limits
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </span>
                    </th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {isLoading ? (
                    <TableSkeleton />
                  ) : paginatedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center">
                        <LinkedInLogo className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {searchQuery || statusFilter !== "all"
                            ? "No accounts match your filters"
                            : "No LinkedIn accounts connected"}
                        </p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {searchQuery || statusFilter !== "all"
                            ? "Try adjusting your search or filter"
                            : "Connect a LinkedIn account to start creating campaigns"}
                        </p>
                        {!searchQuery && statusFilter === "all" && (
                          <Button
                            className="mt-4 bg-[#0A66C2] hover:bg-[#004182] text-white rounded-lg"
                            onClick={() => setShowConnectDialog(true)}
                          >
                            <LinkedInLogo className="w-4 h-4 mr-2" />
                            Connect LinkedIn
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedAccounts.map((account) => (
                      <tr
                        key={account.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                      >
                        {/* Account Info */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800 shadow-sm">
                                <AvatarImage src={account.profile_picture} alt={account.name} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-medium">
                                  {account.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div
                                className={cn(
                                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900",
                                  account.is_connected ? "bg-emerald-500" : "bg-gray-400"
                                )}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {account.name}
                                </span>
                                {account.is_premium && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Crown className="w-4 h-4 text-amber-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p className="text-xs">LinkedIn Premium</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {account.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">{getStatusBadge(account)}</td>

                        {/* Sending Limits */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                    <UserPlus className="w-4 h-4" />
                                    <span>{account.sending_limits.connections}/day</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Connection requests per day</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                    <MessageSquare className="w-4 h-4" />
                                    <span>{account.sending_limits.messages}/day</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">Messages per day</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                    <Mail className="w-4 h-4" />
                                    <span>{account.sending_limits.inmails}/day</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs">InMails per day</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>

                        {/* Configure Button */}
                        <td className="px-4 py-4">
                          {account.is_connected ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg"
                              onClick={() => router.push(`/integration/linkedin/${account.id}/settings`)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Configure limits
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                              onClick={() => setShowConnectDialog(true)}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Re-connect
                            </Button>
                          )}
                        </td>

                        {/* Actions Menu */}
                        <td className="px-4 py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem
                                onClick={() => handleDisconnect(account.id)}
                                className="text-red-600 dark:text-red-400"
                              >
                                <Link2Off className="w-4 h-4 mr-2" />
                                Disconnect
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleResync(account.id)}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Re-sync
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/integration/linkedin/${account.id}/limits`)}
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Configure sending limits
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/integration/linkedin/${account.id}/schedule`)}
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Configure working hours
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/integration/linkedin/${account.id}/proxy`)}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Configure proxy
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => router.push(`/integration/linkedin/${account.id}/privacy`)}
                              >
                                <ShieldCheck className="w-4 h-4 mr-2" />
                                Inbox privacy configuration
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredAccounts.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAccounts.length)} of{" "}
                    {filteredAccounts.length}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connect Account Dialog */}
        <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <LinkedInLogo className="w-5 h-5 text-[#0A66C2]" />
                Connect LinkedIn Account
              </DialogTitle>
              <DialogDescription>
                Enter your LinkedIn credentials to connect your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input placeholder="your@email.com" type="email" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Input placeholder="••••••••" type="password" />
              </div>
              <Button className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white">
                Connect Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </AuthGuard>
  );
}
