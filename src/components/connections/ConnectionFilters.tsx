"use client";

import { Integration } from "@/types/integration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ConnectionFiltersProps {
  integrations: Integration[];
  onIntegrationChange: (id: string | undefined) => void;
  onExcludedChange: (excluded: boolean | undefined) => void;
  onOrderByChange: (orderBy: "connected_on" | "created_at" | "name") => void;
  onSortTypeChange: (sortType: "asc" | "desc") => void;
}

export function ConnectionFilters({
  integrations,
  onIntegrationChange,
  onExcludedChange,
  onOrderByChange,
  onSortTypeChange,
}: ConnectionFiltersProps) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* Integration filter - only show if multiple integrations */}
      {integrations.length > 1 && (
        <Select
          onValueChange={v => onIntegrationChange(v === "all" ? undefined : v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Integrations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Integrations</SelectItem>
            {integrations.map(integration => (
              <SelectItem key={integration.id} value={integration.id}>
                {integration.account_name || integration.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Sort by dropdown */}
      <Select
        defaultValue="connected_on"
        onValueChange={v =>
          onOrderByChange(v as "connected_on" | "created_at" | "name")
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="connected_on">Connected Date</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="created_at">Added Date</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort direction dropdown */}
      <Select
        defaultValue="desc"
        onValueChange={v => onSortTypeChange(v as "asc" | "desc")}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Order" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="desc">Newest</SelectItem>
          <SelectItem value="asc">Oldest</SelectItem>
        </SelectContent>
      </Select>

      {/* Show excluded toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="show-excluded"
          onCheckedChange={checked =>
            onExcludedChange(checked ? true : undefined)
          }
        />
        <Label htmlFor="show-excluded" className="text-sm">
          Excluded only
        </Label>
      </div>
    </div>
  );
}
