"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Briefcase } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadDetailModalProps {
  lead: any;
  isOpen: boolean;
  onClose: () => void;
  userActivityData?: any;
  isLoadingDetails?: boolean;
}

export function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  userActivityData,
  isLoadingDetails,
}: LeadDetailModalProps) {
  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-50 border-b border-gray-100">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                <AvatarImage
                  src={lead.person?.profile_pic_url || "/placeholder.svg"}
                  alt={lead.person?.name}
                />
                <AvatarFallback className="text-base font-semibold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  {lead.person?.name
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("") || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {lead.person?.name || "Unknown"}
                    </h2>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                      <span className="font-medium text-sm">
                        {lead.person?.position || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm">
                        {lead.person?.company || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span>{lead.person?.location || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {lead.person?.headline || "No headline available"}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-blue-50 rounded-md">
                    <Briefcase className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">
                      Current Position
                    </p>
                    <p className="text-xs text-gray-900 font-semibold truncate">
                      {lead.person?.position || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 bg-green-50 rounded-md">
                    <Building2 className="h-3 w-3 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">
                      Current Company
                    </p>
                    <p className="text-xs text-gray-900 font-semibold truncate">
                      {lead.person?.company || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-100 rounded-lg p-3 text-center">
            <h3 className="font-semibold text-blue-900 mb-1 text-sm">
              Campaign: {lead.campaignName}
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-900 text-sm">Activity</h4>
              <h4 className="font-semibold text-gray-900 text-sm">Date</h4>
            </div>

            {isLoadingDetails ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
                  >
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : userActivityData?.activityDetails ? (
              <div className="space-y-2">
                {userActivityData.activityDetails.map(
                  (activity: any, index: number) => (
                    <div
                      key={activity.id || index}
                      className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-gray-600 text-sm">
                        {activity.description}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(activity.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No activity data available
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
