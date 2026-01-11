"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Check,
  X,
  Clock,
  Shield,
  AlertTriangle,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TransferRequest {
  id: string;
  memberName: string;
  memberEmail: string;
  memberAvatar?: string;
  sourceTeam: string;
  destinationTeam: string;
  permissions: string[];
  requestedAt: string;
  status: "pending" | "accepted" | "rejected";
  requestedBy: string;
  requestedById: string;
  type?: "incoming" | "outgoing";
}

export function TransferRequestsView() {
  const [incomingRequests, setIncomingRequests] = useState<TransferRequest[]>(
    []
  );
  const [outgoingRequests, setOutgoingRequests] = useState<TransferRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add loading states for individual requests
  const [approvingRequests, setApprovingRequests] = useState<Set<string>>(
    new Set()
  );
  const [rejectingRequests, setRejectingRequests] = useState<Set<string>>(
    new Set()
  );

  // Fetch transfer requests from API
  useEffect(() => {
    const fetchTransferRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/team/member/get-transfer-request");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch transfer requests"
          );
        }

        // Handle the API response structure
        let requests: TransferRequest[] = [];

        if (result.data) {
          requests = Array.isArray(result.data) ? result.data : [];
        } else if (Array.isArray(result)) {
          requests = result;
        } else if (result.incoming && result.outgoing) {
          // If API returns separate arrays for incoming and outgoing
          setIncomingRequests(result.incoming || []);
          setOutgoingRequests(result.outgoing || []);
          return; // Exit early for this case
        } else {
          // Fallback: treat all as incoming if structure is unclear
          setIncomingRequests(Array.isArray(result) ? result : []);
          setOutgoingRequests([]);
          return; // Exit early for fallback case
        }

        // Get current user info from localStorage (following the same pattern as AuthContext)
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(";").shift();
          return null;
        };

        const userData = localStorage.getItem("userData");
        let currentUserId: string | null = null;

        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            currentUserId = parsedUserData.user_id;
            // currentUserName = parsedUserData.name || parsedUserData.username;
          } catch (error) {}
        }

        // Fallback to cookies if localStorage doesn't have user data
        if (!currentUserId) {
          getCookie("name") || null;
          currentUserId = getCookie("user_id") || null;
        }

        const incoming: TransferRequest[] = [];
        const outgoing: TransferRequest[] = [];

        requests.forEach((request: TransferRequest) => {
          // Sort requests based on who requested the transfer:
          // - If current user requested the transfer (requestedById matches user ID from cookie) → OUTGOING
          // - If someone else requested the transfer → INCOMING

          if (currentUserId && request.requestedById === currentUserId) {
            outgoing.push(request);
          } else {
            incoming.push(request);
          }
        });

        // If no user ID found in cookies, treat all as incoming (safe fallback)
        if (!currentUserId) {
          setIncomingRequests(requests);
          setOutgoingRequests([]);
        } else {
          setIncomingRequests(incoming);
          setOutgoingRequests(outgoing);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch transfer requests"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransferRequests();
  }, []);

  const handleApproveRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      setApprovingRequests(prev => new Set(prev).add(requestId));

      const requestBody = { transferRequestId: requestId };

      const response = await fetch(`/api/team/member/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message ||
          errorData.err ||
          "Failed to accept transfer request";

        // Handle the specific foreign key constraint error
        if (
          errorMessage.includes("Foreign key constraint violated") ||
          errorMessage.includes("TransferRequest_member_id_fkey")
        ) {
          throw new Error(
            "Unable to process transfer request due to database constraints. Please try again later or contact support."
          );
        }

        throw new Error(errorMessage);
      }

      // Update local state on success
      setIncomingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: "accepted" as const } : req
        )
      );
      setOutgoingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: "accepted" as const } : req
        )
      );

      toast.success("Transfer request approved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to accept transfer request"
      );
    } finally {
      // Clear loading state for this specific request
      setApprovingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      // Set loading state for this specific request
      setRejectingRequests(prev => new Set(prev).add(requestId));

      const requestBody = { transferRequestId: requestId };

      const response = await fetch(`/api/team/member/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage =
          errorData.message ||
          errorData.err ||
          "Failed to reject transfer request";

        // Handle the specific foreign key constraint error
        if (
          errorMessage.includes("Foreign key constraint violated") ||
          errorMessage.includes("TransferRequest_member_id_fkey")
        ) {
          throw new Error(
            "Unable to process transfer request due to database constraints. Please try again later or contact support."
          );
        }

        throw new Error(errorMessage);
      }

      // Update local state on success
      setIncomingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: "rejected" as const } : req
        )
      );
      setOutgoingRequests(prev =>
        prev.map(req =>
          req.id === requestId ? { ...req, status: "rejected" as const } : req
        )
      );

      toast.success("Transfer request rejected successfully");
    } catch (err) {
      toast.error("Failed to reject transfer request");
    } finally {
      // Clear loading state for this specific request
      setRejectingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "accepted":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <Check className="h-3 w-3 mr-1" />
            Accepted
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const renderTransferRequest = (request: TransferRequest) => {
    // Get current user ID to check if they requested this transfer
    const userData = localStorage.getItem("userData");
    let currentUserId: string | null = null;

    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        currentUserId = parsedUserData.user_id;
      } catch (error) {}
    }

    // Check if current user requested this transfer
    const isRequestedByCurrentUser = currentUserId === request.requestedById;

    // Check loading states for this specific request
    const isApproving = approvingRequests.has(request.id);
    const isRejecting = rejectingRequests.has(request.id);

    return (
      <Card key={request.id} className="border border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={request.memberAvatar}
                  alt={request.memberName}
                />
                <AvatarFallback>
                  {request.memberName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{request.memberName}</CardTitle>
                <CardDescription className="text-sm">
                  {request.memberEmail}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(request.status)}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">From:</span>
              <span className="font-medium">{request.sourceTeam}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">To:</span>
              <span className="font-medium">{request.destinationTeam}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Permissions:</span>
              <div className="flex gap-1">
                {request.permissions.map((permission, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500">
                Requested {new Date(request.requestedAt).toLocaleDateString()}{" "}
                by {request.requestedBy}
              </div>

              {request.status === "pending" && (
                <div className="flex gap-2">
                  {isRequestedByCurrentUser ? (
                    // Show only Reject button for request creator
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request.id)}
                      disabled={isRejecting}
                      className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </>
                      )}
                    </Button>
                  ) : (
                    // Show both Approve and Reject buttons for others
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={isRejecting || isApproving}
                        className="text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        {isRejecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={isApproving || isRejecting}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {isApproving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-8 w-48" />
        </div>

        {/* Alert Skeleton */}
        <Skeleton className="h-16 w-full" />

        {/* Tabs Skeleton */}
        <div className="w-full">
          <div className="grid w-full grid-cols-2 mb-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Transfer Request Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="border border-gray-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-1" />
                        <Skeleton className="h-4 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-12" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-3 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-6 w-6 text-gray-600" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Transfer Requests
          </h2>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="h-6 w-6 text-gray-600" />
        <h2 className="text-2xl font-semibold text-gray-900">
          Transfer Requests
        </h2>
      </div>

      {incomingRequests.filter(req => req.status === "pending").length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50 backdrop-blur-sm rounded-2xl">
          <AlertTriangle className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <AlertDescription className="text-yellow-800">
            You have{" "}
            {incomingRequests.filter(req => req.status === "pending").length}{" "}
            pending transfer request(s) that require your attention.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="incoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="incoming">
            Incoming Requests ({incomingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="outgoing">
            Outgoing Requests ({outgoingRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incoming" className="mt-6">
          <div className="space-y-4">
            {incomingRequests.length === 0 ? (
              <Card className="border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Shield className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No incoming transfer requests
                  </p>
                  <p className="text-sm text-gray-400 text-center mt-1">
                    Transfer requests from other teams will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              incomingRequests.map(request => renderTransferRequest(request))
            )}
          </div>
        </TabsContent>

        <TabsContent value="outgoing" className="mt-6">
          <div className="space-y-4">
            {outgoingRequests.length === 0 ? (
              <Card className="border-dashed border-gray-300 dark:border-gray-600">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-center">
                    No outgoing transfer requests
                  </p>
                  <p className="text-sm text-gray-400 text-center mt-1">
                    Your transfer requests to other teams will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              outgoingRequests.map(request => renderTransferRequest(request))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
