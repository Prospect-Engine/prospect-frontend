"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AppLayout from "@/components/layout/AppLayout";
import {
  Key,
  Play,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  User,
  AlertTriangle,
  Settings2,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Cog,
  Variable,
  Plus,
  Trash2,
  RotateCcw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

// Types
interface UnipileAccount {
  id: string;
  provider: string;
  status: string;
  name?: string;
  email?: string;
  linkedinProduct?: string;
}

interface ActionTypeMetadata {
  type: string;
  platform: string;
  category: string;
  description: string;
  configFields: ConfigField[];
  requiresTarget: boolean;
}

interface ConfigField {
  name: string;
  type: "text" | "textarea" | "boolean" | "select";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  hint?: string;
}

interface Lead {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  linkedinUrl?: string;
  company?: string;
  headline?: string;
}

interface ExecuteResponse {
  success: boolean;
  executionMode?: string;
  preflightResult?: Record<string, unknown>;
  actionResult?: {
    status: string;
    message?: string;
    metadata?: Record<string, unknown>;
  };
  events?: unknown[];
  durationMs?: number;
  error?: string;
}

interface TestResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  durationMs?: number;
}

// Action type definitions with their config fields
const ACTION_TYPES: ActionTypeMetadata[] = [
  {
    type: "INVITE",
    platform: "LINKEDIN",
    category: "CONNECTION",
    description: "Send a connection invitation to a LinkedIn profile",
    requiresTarget: true,
    configFields: [
      {
        name: "message",
        type: "textarea",
        label: "Invitation Message (optional)",
        required: false,
        placeholder: "Hi {{firstName}}, I would like to connect with you!",
        hint: "Max 300 characters. Leave empty to send without message.",
      },
    ],
  },
  {
    type: "INVITE_BY_EMAIL",
    platform: "LINKEDIN",
    category: "CONNECTION",
    description: "Send a connection invitation using email address",
    requiresTarget: true,
    configFields: [
      {
        name: "email",
        type: "text",
        label: "Email Address",
        required: true,
        placeholder: "john@company.com",
      },
      {
        name: "message",
        type: "textarea",
        label: "Invitation Message (optional)",
        required: false,
        placeholder: "Hi {{firstName}}, I would like to connect with you!",
        hint: "Max 300 characters.",
      },
    ],
  },
  {
    type: "MESSAGE",
    platform: "LINKEDIN",
    category: "MESSAGING",
    description: "Send a direct message to a 1st-degree connection",
    requiresTarget: true,
    configFields: [
      {
        name: "message",
        type: "textarea",
        label: "Message Text",
        required: true,
        placeholder: "Hello {{firstName}}, I wanted to reach out about...",
      },
    ],
  },
  {
    type: "INEMAIL",
    platform: "LINKEDIN",
    category: "MESSAGING",
    description: "Send an InMail message (requires Premium/Sales Navigator)",
    requiresTarget: true,
    configFields: [
      {
        name: "subject",
        type: "text",
        label: "Subject",
        required: true,
        placeholder: "Exciting opportunity at {{company}}",
      },
      {
        name: "body",
        type: "textarea",
        label: "Message Body",
        required: true,
        placeholder: "Dear {{firstName}},\n\nI am reaching out because...",
      },
    ],
  },
  {
    type: "VIEW_PROFILE",
    platform: "LINKEDIN",
    category: "ENGAGEMENT",
    description: "View a LinkedIn profile (triggers profile view notification)",
    requiresTarget: true,
    configFields: [],
  },
  {
    type: "FOLLOW",
    platform: "LINKEDIN",
    category: "ENGAGEMENT",
    description: "Follow a LinkedIn profile or company",
    requiresTarget: true,
    configFields: [],
  },
  {
    type: "LIKE",
    platform: "LINKEDIN",
    category: "ENGAGEMENT",
    description: "Like a LinkedIn post",
    requiresTarget: false,
    configFields: [
      {
        name: "postUrn",
        type: "text",
        label: "Post URN",
        required: true,
        placeholder: "urn:li:activity:7123456789012345678",
        hint: "The LinkedIn post URN to like",
      },
    ],
  },
  {
    type: "ENDORSE",
    platform: "LINKEDIN",
    category: "ENGAGEMENT",
    description: "Endorse a skill on a LinkedIn profile",
    requiresTarget: true,
    configFields: [
      {
        name: "skillName",
        type: "text",
        label: "Skill Name",
        required: true,
        placeholder: "JavaScript",
        hint: "The exact skill name to endorse",
      },
    ],
  },
  {
    type: "WITHDRAW_INVITE",
    platform: "LINKEDIN",
    category: "CONNECTION",
    description: "Withdraw a pending connection invitation",
    requiresTarget: false,
    configFields: [
      {
        name: "invitationId",
        type: "text",
        label: "Invitation ID",
        required: true,
        placeholder: "invitation-id-from-list",
        hint: "The ID of the pending invitation to withdraw",
      },
    ],
  },
];

// API Helper
async function callAdminApi(
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
  apiKey: string,
  body?: Record<string, unknown>
): Promise<TestResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const url = `${baseUrl}/admin/test/campaign-actions${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Also need the accounts endpoint from unipile
async function callUnipileApi(
  endpoint: string,
  method: "GET" | "POST",
  apiKey: string,
  body?: Record<string, unknown>
): Promise<TestResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  const url = `${baseUrl}/admin/test/unipile${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// JSON Viewer Component
function JsonViewer({
  data,
  collapsed = false,
}: {
  data: unknown;
  collapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  if (data === null || data === undefined) {
    return <span className="text-gray-400">null</span>;
  }

  if (typeof data !== "object") {
    if (typeof data === "string") {
      return <span className="text-green-600">&quot;{data}&quot;</span>;
    }
    if (typeof data === "number") {
      return <span className="text-blue-600">{data}</span>;
    }
    if (typeof data === "boolean") {
      return <span className="text-purple-600">{data.toString()}</span>;
    }
    return <span>{String(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const entries = Object.entries(data);
  const isEmpty = entries.length === 0;

  if (isEmpty) {
    return <span className="text-gray-400">{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <div className="font-mono text-sm">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="inline-flex items-center text-gray-500 hover:text-gray-700"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        <span className="ml-1">
          {isArray ? `[${entries.length}]` : `{${entries.length}}`}
        </span>
      </button>
      {!isCollapsed && (
        <div className="ml-4 border-l border-gray-200 pl-2">
          {entries.map(([key, value]) => (
            <div key={key} className="py-0.5">
              <span className="text-gray-700">
                {isArray ? key : `"${key}"`}
              </span>
              <span className="text-gray-500">: </span>
              <JsonViewer data={value} collapsed={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Account Selector Component
function AccountSelector({
  accounts,
  selectedAccount,
  onSelect,
  loading,
  onRefresh,
}: {
  accounts: UnipileAccount[];
  selectedAccount: string;
  onSelect: (id: string) => void;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Select value={selectedAccount} onValueChange={onSelect}>
          <SelectTrigger className="w-full rounded-lg">
            <SelectValue placeholder="Select an account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map(account => (
              <SelectItem key={account.id} value={account.id}>
                <div className="flex items-center gap-2">
                  <span>{account.name || account.email || account.id}</span>
                  <Badge variant="secondary" className="text-xs">
                    {account.linkedinProduct || account.provider}
                  </Badge>
                  <Badge
                    variant={
                      account.status === "OK" ? "default" : "destructive"
                    }
                    className="text-xs"
                  >
                    {account.status}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="rounded-lg"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RefreshCw className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

// Action Type Selector Component
function ActionTypeSelector({
  selectedType,
  onSelect,
}: {
  selectedType: string;
  onSelect: (type: string) => void;
}) {
  const selectedAction = ACTION_TYPES.find(a => a.type === selectedType);

  return (
    <div className="space-y-3">
      <Select value={selectedType} onValueChange={onSelect}>
        <SelectTrigger className="w-full rounded-lg">
          <SelectValue placeholder="Select action type" />
        </SelectTrigger>
        <SelectContent>
          {ACTION_TYPES.map(action => (
            <SelectItem key={action.type} value={action.type}>
              <div className="flex items-center gap-2">
                <span>{action.type}</span>
                <Badge variant="outline" className="text-xs">
                  {action.category}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedAction && (
        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{selectedAction.platform}</Badge>
            <Badge variant="outline">{selectedAction.category}</Badge>
            {selectedAction.requiresTarget && (
              <Badge variant="default" className="bg-blue-500">
                Requires Target
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {selectedAction.description}
          </p>
        </div>
      )}
    </div>
  );
}

// Target Selector Component
function TargetSelector({
  targetType,
  onTargetTypeChange,
  profileIdentifier,
  onProfileIdentifierChange,
  selectedLead,
  onLeadSelect,
  leads,
  onSearchLeads,
  searchLoading,
  searchQuery,
  onSearchQueryChange,
}: {
  targetType: "MANUAL" | "LEAD";
  onTargetTypeChange: (type: "MANUAL" | "LEAD") => void;
  profileIdentifier: string;
  onProfileIdentifierChange: (value: string) => void;
  selectedLead: Lead | null;
  onLeadSelect: (lead: Lead | null) => void;
  leads: Lead[];
  onSearchLeads: () => void;
  searchLoading: boolean;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label className="flex items-center gap-2">
          <input
            type="radio"
            name="targetType"
            checked={targetType === "MANUAL"}
            onChange={() => onTargetTypeChange("MANUAL")}
            className="rounded"
          />
          Manual Entry
        </Label>
        <Label className="flex items-center gap-2">
          <input
            type="radio"
            name="targetType"
            checked={targetType === "LEAD"}
            onChange={() => onTargetTypeChange("LEAD")}
            className="rounded"
          />
          Search Lead
        </Label>
      </div>

      {targetType === "MANUAL" ? (
        <div className="space-y-2">
          <Label htmlFor="profile-identifier">Profile Identifier</Label>
          <Input
            id="profile-identifier"
            placeholder="https://www.linkedin.com/in/username or URN"
            value={profileIdentifier}
            onChange={e => onProfileIdentifierChange(e.target.value)}
            className="rounded-lg"
          />
          <p className="text-xs text-muted-foreground">
            Enter a LinkedIn profile URL, URN, or provider profile ID
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search leads by name, email, or LinkedIn URL..."
              value={searchQuery}
              onChange={e => onSearchQueryChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSearchLeads()}
              className="rounded-lg flex-1"
            />
            <Button
              onClick={onSearchLeads}
              disabled={searchLoading}
              variant="outline"
              className="rounded-lg"
            >
              {searchLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {leads.length > 0 && (
            <ScrollArea className="h-48 rounded-lg border">
              <div className="p-2 space-y-1">
                {leads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => onLeadSelect(lead)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedLead?.id === lead.id
                        ? "bg-primary/10 border border-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">
                      {lead.firstName} {lead.lastName}
                    </div>
                    {lead.headline && (
                      <div className="text-sm text-muted-foreground truncate">
                        {lead.headline}
                      </div>
                    )}
                    {lead.company && (
                      <div className="text-xs text-muted-foreground">
                        {lead.company}
                      </div>
                    )}
                    {lead.linkedinUrl && (
                      <div className="text-xs text-blue-600 truncate">
                        {lead.linkedinUrl}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedLead && (
            <div className="p-3 bg-primary/5 rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {selectedLead.firstName} {selectedLead.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedLead.linkedinUrl || selectedLead.email}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLeadSelect(null)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Config Editor Component
function ConfigEditor({
  actionType,
  config,
  onConfigChange,
}: {
  actionType: string;
  config: Record<string, unknown>;
  onConfigChange: (config: Record<string, unknown>) => void;
}) {
  const action = ACTION_TYPES.find(a => a.type === actionType);

  if (!action || action.configFields.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
        No configuration required for this action type.
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    onConfigChange({ ...config, [fieldName]: value });
  };

  return (
    <div className="space-y-4">
      {action.configFields.map(field => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>

          {field.type === "text" && (
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={(config[field.name] as string) || ""}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              className="rounded-lg"
            />
          )}

          {field.type === "textarea" && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={(config[field.name] as string) || ""}
              onChange={e => handleFieldChange(field.name, e.target.value)}
              className="rounded-lg"
              rows={4}
            />
          )}

          {field.type === "boolean" && (
            <Switch
              id={field.name}
              checked={(config[field.name] as boolean) || false}
              onCheckedChange={value => handleFieldChange(field.name, value)}
            />
          )}

          {field.type === "select" && field.options && (
            <Select
              value={(config[field.name] as string) || ""}
              onValueChange={value => handleFieldChange(field.name, value)}
            >
              <SelectTrigger className="rounded-lg">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {field.hint && (
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// Variables Editor Component
function VariablesEditor({
  variables,
  onVariablesChange,
  usePersonalization,
  onUsePersonalizationChange,
}: {
  variables: Record<string, string>;
  onVariablesChange: (variables: Record<string, string>) => void;
  usePersonalization: boolean;
  onUsePersonalizationChange: (value: boolean) => void;
}) {
  const [newVarName, setNewVarName] = useState("");
  const [newVarValue, setNewVarValue] = useState("");

  const commonPresets = [
    { name: "firstName", value: "John" },
    { name: "lastName", value: "Doe" },
    { name: "company", value: "Acme Inc" },
    { name: "headline", value: "Software Engineer" },
    { name: "location", value: "San Francisco, CA" },
  ];

  const addVariable = () => {
    if (newVarName && newVarValue) {
      onVariablesChange({ ...variables, [newVarName]: newVarValue });
      setNewVarName("");
      setNewVarValue("");
    }
  };

  const removeVariable = (name: string) => {
    const newVars = { ...variables };
    delete newVars[name];
    onVariablesChange(newVars);
  };

  const applyPreset = (preset: { name: string; value: string }) => {
    onVariablesChange({ ...variables, [preset.name]: preset.value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Switch
            checked={usePersonalization}
            onCheckedChange={onUsePersonalizationChange}
          />
          Enable Personalization Variables
        </Label>
      </div>

      {usePersonalization && (
        <>
          <div className="flex flex-wrap gap-2">
            {commonPresets.map(preset => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                className="rounded-lg text-xs"
                onClick={() => applyPreset(preset)}
                disabled={variables[preset.name] !== undefined}
              >
                <Plus className="w-3 h-3 mr-1" />
                {preset.name}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            {Object.entries(variables).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <Input
                  value={name}
                  disabled
                  className="rounded-lg w-32 font-mono text-sm"
                />
                <Input
                  value={value}
                  onChange={e =>
                    onVariablesChange({ ...variables, [name]: e.target.value })
                  }
                  className="rounded-lg flex-1"
                  placeholder="Value"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVariable(name)}
                  className="rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              placeholder="Variable name"
              value={newVarName}
              onChange={e => setNewVarName(e.target.value)}
              className="rounded-lg w-32 font-mono text-sm"
            />
            <Input
              placeholder="Value"
              value={newVarValue}
              onChange={e => setNewVarValue(e.target.value)}
              className="rounded-lg flex-1"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={addVariable}
              disabled={!newVarName || !newVarValue}
              className="rounded-lg"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// Options Panel Component
function OptionsPanel({
  options,
  onOptionsChange,
}: {
  options: {
    respectWarmupLimits: boolean;
    emitEvents: boolean;
    maxRetries: number;
  };
  onOptionsChange: (options: {
    respectWarmupLimits: boolean;
    emitEvents: boolean;
    maxRetries: number;
  }) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">Respect Warmup Limits</Label>
          <p className="text-xs text-muted-foreground">
            Check daily/weekly limits before execution
          </p>
        </div>
        <Switch
          checked={options.respectWarmupLimits}
          onCheckedChange={value =>
            onOptionsChange({ ...options, respectWarmupLimits: value })
          }
        />
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">Emit Events</Label>
          <p className="text-xs text-muted-foreground">
            Emit domain events (may affect analytics)
          </p>
        </div>
        <Switch
          checked={options.emitEvents}
          onCheckedChange={value =>
            onOptionsChange({ ...options, emitEvents: value })
          }
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="font-medium">Max Retries</Label>
        <Select
          value={options.maxRetries.toString()}
          onValueChange={value =>
            onOptionsChange({ ...options, maxRetries: parseInt(value) })
          }
        >
          <SelectTrigger className="w-full rounded-lg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 (No retries)</SelectItem>
            <SelectItem value="1">1 retry</SelectItem>
            <SelectItem value="2">2 retries</SelectItem>
            <SelectItem value="3">3 retries</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Number of retry attempts on failure
        </p>
      </div>
    </div>
  );
}

// Result Viewer Component
function ResultViewer({
  response,
  onClear,
}: {
  response: ExecuteResponse | null;
  onClear: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyResponse = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Copied to clipboard");
    }
  }, [response]);

  if (!response) return null;

  return (
    <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Execution Result
          </CardTitle>
          <div className="flex items-center gap-2">
            {response.durationMs && (
              <Badge variant="secondary" className="text-xs">
                {response.durationMs}ms
              </Badge>
            )}
            {response.executionMode && (
              <Badge variant="outline" className="text-xs">
                {response.executionMode}
              </Badge>
            )}
            <Badge
              variant={response.success ? "default" : "destructive"}
              className="text-xs"
            >
              {response.success
                ? "Success"
                : response.actionResult?.status || "Failed"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {response.actionResult && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Action Result</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant={
                    response.actionResult.status === "SUCCESS"
                      ? "default"
                      : response.actionResult.status === "SKIPPED"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {response.actionResult.status}
                </Badge>
                {response.actionResult.message && (
                  <span className="text-sm">
                    {response.actionResult.message}
                  </span>
                )}
              </div>
              {response.actionResult.metadata && (
                <JsonViewer
                  data={response.actionResult.metadata}
                  collapsed={true}
                />
              )}
            </div>
          </div>
        )}

        {response.preflightResult && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preflight Check</Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <JsonViewer data={response.preflightResult} collapsed={true} />
            </div>
          </div>
        )}

        {response.events && response.events.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Emitted Events ({response.events.length})
            </Label>
            <div className="p-3 bg-muted/50 rounded-lg">
              <JsonViewer data={response.events} collapsed={true} />
            </div>
          </div>
        )}

        {response.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{response.error}</AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Full Response</Label>
          <ScrollArea className="h-48 rounded-lg border bg-slate-50 p-3">
            <JsonViewer data={response} collapsed={false} />
          </ScrollArea>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyResponse}
            className="rounded-lg"
          >
            {copied ? (
              <Check className="w-4 h-4 mr-1" />
            ) : (
              <Copy className="w-4 h-4 mr-1" />
            )}
            Copy Response
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="rounded-lg"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page Component
export default function CampaignActionTestingPage() {
  // API Key state
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_api_key") || "";
    }
    return "";
  });

  // Account state
  const [accounts, setAccounts] = useState<UnipileAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Action configuration state
  const [selectedActionType, setSelectedActionType] = useState("");
  const [executionMode, setExecutionMode] = useState<
    "FULL_PIPELINE" | "DIRECT_HANDLER"
  >("FULL_PIPELINE");

  // Target state
  const [targetType, setTargetType] = useState<"MANUAL" | "LEAD">("MANUAL");
  const [profileIdentifier, setProfileIdentifier] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Config state
  const [config, setConfig] = useState<Record<string, unknown>>({});

  // Variables state
  const [usePersonalization, setUsePersonalization] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Options state
  const [options, setOptions] = useState({
    respectWarmupLimits: true,
    emitEvents: false,
    maxRetries: 0,
  });

  // Execution state
  const [executing, setExecuting] = useState(false);
  const [response, setResponse] = useState<ExecuteResponse | null>(null);

  // Reset config when action type changes
  useEffect(() => {
    setConfig({});
  }, [selectedActionType]);

  // Save API key
  const saveApiKey = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_api_key", apiKey);
      toast.success("API key saved");
    }
  }, [apiKey]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    if (!apiKey) {
      toast.error("Please enter an API key first");
      return;
    }

    setLoadingAccounts(true);
    const result = await callUnipileApi("/accounts", "GET", apiKey);
    setLoadingAccounts(false);

    if (result.success && result.data) {
      const outerData = result.data as {
        data?: { items?: UnipileAccount[] };
        items?: UnipileAccount[];
      };
      const items = outerData.data?.items || outerData.items || [];
      setAccounts(items);
      if (items.length > 0 && !selectedAccount) {
        setSelectedAccount(items[0].id);
      }
      toast.success(`Loaded ${items.length} accounts`);
    } else {
      toast.error(result.error || "Failed to load accounts");
    }
  }, [apiKey, selectedAccount]);

  // Search leads
  const searchLeads = useCallback(async () => {
    if (!apiKey || !searchQuery) {
      return;
    }

    setSearchLoading(true);
    const result = await callAdminApi("/leads/search", "POST", apiKey, {
      query: searchQuery,
      limit: 10,
    });
    setSearchLoading(false);

    if (result.success && result.data) {
      const leadData = result.data as { leads?: Lead[] } | Lead[];
      const leadsList = Array.isArray(leadData)
        ? leadData
        : leadData.leads || [];
      setLeads(leadsList);
      if (leadsList.length === 0) {
        toast.info("No leads found");
      }
    } else {
      toast.error(result.error || "Failed to search leads");
    }
  }, [apiKey, searchQuery]);

  // Get selected action metadata
  const selectedAction = useMemo(
    () => ACTION_TYPES.find(a => a.type === selectedActionType),
    [selectedActionType]
  );

  // Validate form
  const canExecute = useMemo(() => {
    if (!selectedAccount || !selectedActionType) return false;

    // Check if target is required and provided
    if (selectedAction?.requiresTarget) {
      if (targetType === "MANUAL" && !profileIdentifier) return false;
      if (targetType === "LEAD" && !selectedLead) return false;
    }

    // Check required config fields
    if (selectedAction?.configFields) {
      for (const field of selectedAction.configFields) {
        if (field.required && !config[field.name]) return false;
      }
    }

    return true;
  }, [
    selectedAccount,
    selectedActionType,
    selectedAction,
    targetType,
    profileIdentifier,
    selectedLead,
    config,
  ]);

  // Execute action
  const executeAction = useCallback(async () => {
    if (!canExecute) return;

    const target = selectedAction?.requiresTarget
      ? {
          type: targetType,
          ...(targetType === "MANUAL"
            ? { profileIdentifier }
            : { leadId: selectedLead?.id }),
        }
      : undefined;

    const payload = {
      accountId: selectedAccount,
      actionType: selectedActionType,
      executionMode,
      target,
      config,
      variables: usePersonalization ? variables : undefined,
      options,
    };

    setExecuting(true);
    const result = await callAdminApi("/execute", "POST", apiKey, payload);
    setExecuting(false);

    if (result.success) {
      setResponse(result.data as ExecuteResponse);
      toast.success("Action executed");
    } else {
      setResponse({
        success: false,
        error: result.error || "Execution failed",
      });
      toast.error(result.error || "Execution failed");
    }
  }, [
    canExecute,
    selectedAction,
    targetType,
    profileIdentifier,
    selectedLead,
    selectedAccount,
    selectedActionType,
    executionMode,
    config,
    usePersonalization,
    variables,
    options,
    apiKey,
  ]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        canExecute &&
        !executing
      ) {
        e.preventDefault();
        executeAction();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canExecute, executing, executeAction]);

  // Clear response
  const clearResponse = () => setResponse(null);

  return (
    <AppLayout activePage="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campaign Action Testing</h1>
            <p className="text-muted-foreground">
              Test campaign actions exactly as they execute in real campaigns
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Settings2 className="w-4 h-4 mr-1" />
            Admin Only
          </Badge>
        </div>

        {/* Warning Banner */}
        <Alert variant="destructive" className="border-orange-500 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">
            Real Account Actions
          </AlertTitle>
          <AlertDescription className="text-orange-700">
            Actions executed here will affect real LinkedIn accounts. Connection
            invitations, messages, and other actions are permanent. Use with
            caution and only on test accounts when possible.
          </AlertDescription>
        </Alert>

        {/* API Key Configuration */}
        <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Key Configuration
            </CardTitle>
            <CardDescription>
              Enter your admin API key to access testing endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Input
                  type="password"
                  placeholder="Enter your admin API key"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="rounded-lg"
                />
              </div>
              <Button
                onClick={saveApiKey}
                variant="outline"
                className="rounded-lg"
              >
                Save Key
              </Button>
              <Button
                onClick={loadAccounts}
                disabled={loadingAccounts}
                className="rounded-lg"
              >
                {loadingAccounts ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Load Accounts
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Selector */}
        {accounts.length > 0 && (
          <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Select Account
              </CardTitle>
              <CardDescription>
                Choose a LinkedIn account to execute actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountSelector
                accounts={accounts}
                selectedAccount={selectedAccount}
                onSelect={setSelectedAccount}
                loading={loadingAccounts}
                onRefresh={loadAccounts}
              />
            </CardContent>
          </Card>
        )}

        {/* Main Configuration - Only show when account is selected */}
        {apiKey && selectedAccount && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - Action Configuration */}
            <div className="space-y-6">
              {/* Action Type Selection */}
              <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Action Type
                  </CardTitle>
                  <CardDescription>
                    Select the action type to test
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ActionTypeSelector
                    selectedType={selectedActionType}
                    onSelect={setSelectedActionType}
                  />
                </CardContent>
              </Card>

              {/* Execution Mode */}
              {selectedActionType && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      Execution Mode
                    </CardTitle>
                    <CardDescription>
                      Choose how to execute the action
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="executionMode"
                          checked={executionMode === "FULL_PIPELINE"}
                          onChange={() => setExecutionMode("FULL_PIPELINE")}
                          className="rounded"
                        />
                        Full Pipeline
                      </Label>
                      <Label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="executionMode"
                          checked={executionMode === "DIRECT_HANDLER"}
                          onChange={() => setExecutionMode("DIRECT_HANDLER")}
                          className="rounded"
                        />
                        Direct Handler
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {executionMode === "FULL_PIPELINE"
                        ? "Uses ActionDispatcherService with preflight checks, events, and error normalization"
                        : "Calls action handler directly, bypassing dispatcher logic"}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Target Selection */}
              {selectedAction?.requiresTarget && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Target Selection
                    </CardTitle>
                    <CardDescription>
                      Select the target profile for this action
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TargetSelector
                      targetType={targetType}
                      onTargetTypeChange={setTargetType}
                      profileIdentifier={profileIdentifier}
                      onProfileIdentifierChange={setProfileIdentifier}
                      selectedLead={selectedLead}
                      onLeadSelect={setSelectedLead}
                      leads={leads}
                      onSearchLeads={searchLeads}
                      searchLoading={searchLoading}
                      searchQuery={searchQuery}
                      onSearchQueryChange={setSearchQuery}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Action Config */}
              {selectedActionType && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cog className="w-5 h-5" />
                      Action Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure action-specific parameters
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ConfigEditor
                      actionType={selectedActionType}
                      config={config}
                      onConfigChange={setConfig}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Variables, Options, Execute */}
            <div className="space-y-6">
              {/* Personalization Variables */}
              {selectedActionType && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Variable className="w-5 h-5" />
                      Personalization Variables
                    </CardTitle>
                    <CardDescription>
                      Define variables for message personalization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <VariablesEditor
                      variables={variables}
                      onVariablesChange={setVariables}
                      usePersonalization={usePersonalization}
                      onUsePersonalizationChange={setUsePersonalization}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Test Options */}
              {selectedActionType && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings2 className="w-5 h-5" />
                      Test Options
                    </CardTitle>
                    <CardDescription>
                      Configure execution behavior
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OptionsPanel
                      options={options}
                      onOptionsChange={setOptions}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Execute Button */}
              {selectedActionType && (
                <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <Button
                        onClick={executeAction}
                        disabled={!canExecute || executing}
                        className="w-full rounded-lg h-12 text-lg"
                        size="lg"
                      >
                        {executing ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Executing...
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5 mr-2" />
                            Execute Action
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Press Ctrl+Enter to execute
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Result Viewer */}
              {response && (
                <ResultViewer response={response} onClear={clearResponse} />
              )}
            </div>
          </div>
        )}

        {/* Warning if no API key */}
        {!apiKey && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-700">
                  Please enter your admin API key and load accounts before
                  testing campaign actions
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
