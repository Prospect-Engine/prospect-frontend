"use client";

import React from "react";
import { Check, Crown, User, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface LinkedInProfile {
  id: string;
  name: string;
  email: string;
  profile_picture?: string;
  is_connected: boolean;
  connection_status: "active" | "inactive" | "error";
  last_sync?: string;
  is_premium: boolean;
}

interface ProfileSelectionCardProps {
  profile: LinkedInProfile;
  isSelected: boolean;
  onSelect: (profileId: string) => void;
  disabled?: boolean;
}

export default function ProfileSelectionCard({
  profile,
  isSelected,
  onSelect,
  disabled = false,
}: ProfileSelectionCardProps) {
  const isDisconnected = !profile.is_connected || profile.connection_status !== "active";
  const isClickable = !disabled && !isDisconnected;

  return (
    <div
      onClick={() => isClickable && onSelect(profile.id)}
      className={cn(
        "group relative p-4 rounded-2xl border-2 transition-all duration-200 ease-out",
        isSelected
          ? "border-black bg-gray-50 shadow-sm dark:border-white dark:bg-gray-800/50"
          : "border-transparent bg-white hover:border-gray-200 hover:shadow-md dark:bg-gray-900 dark:hover:border-gray-700",
        isClickable
          ? "cursor-pointer"
          : "cursor-not-allowed opacity-60",
        !isSelected && isClickable && "hover:translate-y-[-2px]"
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          "absolute top-4 right-4 w-6 h-6 rounded-full border-2",
          "flex items-center justify-center transition-all duration-200",
          isSelected
            ? "border-black bg-black dark:border-white dark:bg-white"
            : "border-gray-300 group-hover:border-gray-400 dark:border-gray-600 dark:group-hover:border-gray-500"
        )}
      >
        {isSelected && (
          <Check className="w-3.5 h-3.5 text-white dark:text-black" />
        )}
      </div>

      {/* Profile content */}
      <div className="flex items-center gap-4 pr-8">
        {/* Avatar */}
        <div className="relative">
          <Avatar className="w-14 h-14 ring-2 ring-white shadow-md dark:ring-gray-800">
            <AvatarImage src={profile.profile_picture} alt={profile.name} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-lg font-semibold">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Connection status dot */}
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900",
              "flex items-center justify-center",
              profile.connection_status === "active"
                ? "bg-emerald-500"
                : "bg-gray-400"
            )}
          >
            {profile.connection_status === "active" ? (
              <Wifi className="w-2 h-2 text-white" />
            ) : (
              <WifiOff className="w-2 h-2 text-white" />
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {profile.name}
            </span>
            {profile.is_premium && (
              <Badge className="bg-amber-100 text-amber-700 border-0 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-2 py-0.5">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {profile.email}
          </p>

          {/* Status badge */}
          <div className="mt-2">
            {profile.connection_status === "active" && profile.is_connected ? (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 text-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton loader for profile cards
export function ProfileSelectionCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border-2 border-transparent bg-white dark:bg-gray-900 animate-pulse">
      <div className="flex items-center gap-4">
        {/* Avatar skeleton */}
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />

        {/* Content skeleton */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
            <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-16" />
          </div>
          <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded w-48" />
          <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded w-24" />
        </div>

        {/* Selection indicator skeleton */}
        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
