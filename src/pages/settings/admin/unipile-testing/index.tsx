"use client";

import { useState, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import AppLayout from "@/components/layout/AppLayout";
import {
  Key,
  Play,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  User,
  MessageSquare,
  UserPlus,
  FileText,
  Search,
  Webhook,
  Code,
  ChevronDown,
  ChevronRight,
  Building2,
  Settings2,
  AlertCircle,
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

interface TestResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  errorCode?: string;
  durationMs?: number;
}

// API Helper
async function callAdminApi(
  endpoint: string,
  method: "GET" | "POST" | "DELETE",
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
          {entries.map(([key, value], index) => (
            <div key={key} className="py-0.5">
              <span className="text-gray-700">
                {isArray ? index : `"${key}"`}
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

// Test Card Component
function TestCard({
  title,
  description,
  onExecute,
  loading,
  response,
  children,
}: {
  title: string;
  description: string;
  onExecute: () => void;
  loading: boolean;
  response: TestResponse | null;
  children: React.ReactNode;
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

  return (
    <Card className="bg-card/60 backdrop-blur-xl border border-border/20 rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}

        <div className="flex items-center justify-between pt-2">
          <Button onClick={onExecute} disabled={loading} className="rounded-lg">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute
              </>
            )}
          </Button>

          {response && (
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
              Copy
            </Button>
          )}
        </div>

        {response && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Response</span>
              <div className="flex items-center gap-2">
                {response.durationMs && (
                  <Badge variant="secondary" className="text-xs">
                    {response.durationMs}ms
                  </Badge>
                )}
                <Badge
                  variant={response.success ? "default" : "destructive"}
                  className="text-xs"
                >
                  {response.success ? "Success" : "Failed"}
                </Badge>
              </div>
            </div>
            <ScrollArea className="h-64 rounded-lg border bg-slate-50 p-3">
              <JsonViewer data={response} collapsed={false} />
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
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

export default function UnipileTestingPage() {
  // State
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_api_key") || "";
    }
    return "";
  });
  const [accounts, setAccounts] = useState<UnipileAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [activeTab, setActiveTab] = useState("accounts");

  // Test states
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
  const [testResponses, setTestResponses] = useState<
    Record<string, TestResponse | null>
  >({});

  // Form states for various operations
  const [profileIdentifier, setProfileIdentifier] = useState("");
  const [companyIdentifier, setCompanyIdentifier] = useState("");
  const [messageText, setMessageText] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [inmailSubject, setInmailSubject] = useState("");
  const [inmailBody, setInmailBody] = useState("");
  const [inmailApiType, setInmailApiType] = useState<
    "classic" | "sales_navigator" | "recruiter"
  >("sales_navigator");
  const [invitationMessage, setInvitationMessage] = useState("");
  const [receivedInvitationId, setReceivedInvitationId] = useState("");
  const [sharedSecret, setSharedSecret] = useState("");
  const [searchKeywords, setSearchKeywords] = useState("");
  const [searchCategory, setSearchCategory] = useState("PEOPLE");
  const [rawRequestUrl, setRawRequestUrl] = useState(
    "https://www.linkedin.com/voyager/api/identity/dash/profiles"
  );
  const [rawRequestMethod, setRawRequestMethod] = useState("GET");
  const [rawRequestBody, setRawRequestBody] = useState("");
  const [rawRequestEncoding, setRawRequestEncoding] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSource, setWebhookSource] = useState("messaging");
  const [webhookName, setWebhookName] = useState("");

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
    const response = await callAdminApi("/accounts", "GET", apiKey);
    setLoadingAccounts(false);

    if (response.success && response.data) {
      // Handle nested data structure from backend wrapper
      const outerData = response.data as {
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
      toast.error(response.error || "Failed to load accounts");
    }
  }, [apiKey, selectedAccount]);

  // Execute test
  const executeTest = useCallback(
    async (
      testId: string,
      endpoint: string,
      method: "GET" | "POST" | "DELETE",
      body?: Record<string, unknown>
    ) => {
      if (!apiKey) {
        toast.error("Please enter an API key first");
        return;
      }

      setTestLoading(prev => ({ ...prev, [testId]: true }));
      const response = await callAdminApi(endpoint, method, apiKey, body);
      setTestLoading(prev => ({ ...prev, [testId]: false }));
      setTestResponses(prev => ({ ...prev, [testId]: response }));

      if (response.success) {
        toast.success("Test executed successfully");
      } else {
        toast.error(response.error || "Test failed");
      }
    },
    [apiKey]
  );

  return (
    <AppLayout activePage="Settings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Unipile API Testing</h1>
            <p className="text-muted-foreground">
              Test Unipile API operations with connected accounts
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            <Settings2 className="w-4 h-4 mr-1" />
            Admin Only
          </Badge>
        </div>

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
                Choose an account to test API operations
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

        {/* Warning if no API key */}
        {!apiKey && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-700">
                  Please enter your admin API key and load accounts before
                  testing
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Testing Tabs */}
        {apiKey && (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 gap-1 h-auto p-1 bg-muted/50 rounded-xl">
              <TabsTrigger
                value="accounts"
                className="rounded-lg text-xs py-2 px-3"
              >
                <User className="w-3 h-3 mr-1" />
                Accounts
              </TabsTrigger>
              <TabsTrigger
                value="profiles"
                className="rounded-lg text-xs py-2 px-3"
              >
                <User className="w-3 h-3 mr-1" />
                Profiles
              </TabsTrigger>
              <TabsTrigger
                value="messaging"
                className="rounded-lg text-xs py-2 px-3"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Messages
              </TabsTrigger>
              <TabsTrigger
                value="connections"
                className="rounded-lg text-xs py-2 px-3"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Connections
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="rounded-lg text-xs py-2 px-3"
              >
                <FileText className="w-3 h-3 mr-1" />
                Posts
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="rounded-lg text-xs py-2 px-3"
              >
                <Search className="w-3 h-3 mr-1" />
                Search
              </TabsTrigger>
              <TabsTrigger
                value="sales-nav"
                className="rounded-lg text-xs py-2 px-3"
              >
                <Building2 className="w-3 h-3 mr-1" />
                Sales Nav
              </TabsTrigger>
              <TabsTrigger
                value="raw-api"
                className="rounded-lg text-xs py-2 px-3"
              >
                <Code className="w-3 h-3 mr-1" />
                Raw API
              </TabsTrigger>
              <TabsTrigger
                value="webhooks"
                className="rounded-lg text-xs py-2 px-3"
              >
                <Webhook className="w-3 h-3 mr-1" />
                Webhooks
              </TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="List Accounts"
                  description="List all connected Unipile accounts"
                  onExecute={() =>
                    executeTest("list-accounts", "/accounts", "GET")
                  }
                  loading={testLoading["list-accounts"]}
                  response={testResponses["list-accounts"]}
                >
                  <p className="text-sm text-muted-foreground">
                    No parameters required
                  </p>
                </TestCard>

                <TestCard
                  title="Get Account Status"
                  description="Get status of selected account"
                  onExecute={() =>
                    executeTest(
                      "account-status",
                      `/accounts/${selectedAccount}`,
                      "GET"
                    )
                  }
                  loading={testLoading["account-status"]}
                  response={testResponses["account-status"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account ID: </span>
                    <span className="font-mono">
                      {selectedAccount || "None selected"}
                    </span>
                  </div>
                </TestCard>

                <TestCard
                  title="Trigger Resync"
                  description="Trigger account resync with Unipile"
                  onExecute={() =>
                    executeTest(
                      "resync",
                      `/accounts/${selectedAccount}/resync`,
                      "POST",
                      {}
                    )
                  }
                  loading={testLoading["resync"]}
                  response={testResponses["resync"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account ID: </span>
                    <span className="font-mono">
                      {selectedAccount || "None selected"}
                    </span>
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Profiles Tab */}
            <TabsContent value="profiles" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="Get Profile"
                  description="Get LinkedIn profile by URL or URN"
                  onExecute={() =>
                    executeTest("get-profile", "/linkedin/profile", "POST", {
                      accountId: selectedAccount,
                      identifier: profileIdentifier,
                    })
                  }
                  loading={testLoading["get-profile"]}
                  response={testResponses["get-profile"]}
                >
                  <div className="space-y-2">
                    <Label htmlFor="profile-id">Profile Identifier</Label>
                    <Input
                      id="profile-id"
                      placeholder="https://www.linkedin.com/in/johndoe or URN"
                      value={profileIdentifier}
                      onChange={e => setProfileIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>

                <TestCard
                  title="Get Own Profile"
                  description="Get your own LinkedIn profile"
                  onExecute={() =>
                    executeTest(
                      "own-profile",
                      "/linkedin/profile/own",
                      "POST",
                      {
                        accountId: selectedAccount,
                      }
                    )
                  }
                  loading={testLoading["own-profile"]}
                  response={testResponses["own-profile"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account ID: </span>
                    <span className="font-mono">
                      {selectedAccount || "None selected"}
                    </span>
                  </div>
                </TestCard>

                <TestCard
                  title="View Profile"
                  description="View profile (triggers notification to owner)"
                  onExecute={() =>
                    executeTest(
                      "view-profile",
                      "/linkedin/profile/view",
                      "POST",
                      {
                        accountId: selectedAccount,
                        identifier: profileIdentifier,
                      }
                    )
                  }
                  loading={testLoading["view-profile"]}
                  response={testResponses["view-profile"]}
                >
                  <div className="space-y-2">
                    <Label htmlFor="view-profile-id">Profile Identifier</Label>
                    <Input
                      id="view-profile-id"
                      placeholder="https://www.linkedin.com/in/johndoe"
                      value={profileIdentifier}
                      onChange={e => setProfileIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>

                <TestCard
                  title="Get Company Profile"
                  description="Get LinkedIn company profile"
                  onExecute={() =>
                    executeTest(
                      "company-profile",
                      "/linkedin/company",
                      "POST",
                      {
                        accountId: selectedAccount,
                        identifier: companyIdentifier,
                      }
                    )
                  }
                  loading={testLoading["company-profile"]}
                  response={testResponses["company-profile"]}
                >
                  <div className="space-y-2">
                    <Label htmlFor="company-id">Company Identifier</Label>
                    <Input
                      id="company-id"
                      placeholder="https://www.linkedin.com/company/microsoft"
                      value={companyIdentifier}
                      onChange={e => setCompanyIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>

                <TestCard
                  title="Check Connection Status"
                  description="Check if connected with a profile"
                  onExecute={() =>
                    executeTest(
                      "connection-status",
                      "/linkedin/connection-status",
                      "POST",
                      {
                        accountId: selectedAccount,
                        identifier: profileIdentifier,
                      }
                    )
                  }
                  loading={testLoading["connection-status"]}
                  response={testResponses["connection-status"]}
                >
                  <div className="space-y-2">
                    <Label>Profile Identifier</Label>
                    <Input
                      placeholder="https://www.linkedin.com/in/johndoe"
                      value={profileIdentifier}
                      onChange={e => setProfileIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Messaging Tab */}
            <TabsContent value="messaging" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="Send Message"
                  description="Send a LinkedIn message"
                  onExecute={() =>
                    executeTest(
                      "send-message",
                      "/linkedin/message/send",
                      "POST",
                      {
                        accountId: selectedAccount,
                        recipientProfileId: recipientId,
                        text: messageText,
                      }
                    )
                  }
                  loading={testLoading["send-message"]}
                  response={testResponses["send-message"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Recipient Profile ID</Label>
                      <Input
                        placeholder="urn:li:fsd_profile:ACoAABCD1234"
                        value={recipientId}
                        onChange={e => setRecipientId(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Message Text</Label>
                      <Textarea
                        placeholder="Hello! Nice to connect with you."
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        className="rounded-lg"
                        rows={3}
                      />
                    </div>
                  </div>
                </TestCard>

                <TestCard
                  title="Send InMail"
                  description="Send a LinkedIn InMail (requires credits)"
                  onExecute={() =>
                    executeTest(
                      "send-inmail",
                      "/linkedin/inmail/send",
                      "POST",
                      {
                        accountId: selectedAccount,
                        recipientProfileId: recipientId,
                        subject: inmailSubject,
                        body: inmailBody,
                        api: inmailApiType,
                      }
                    )
                  }
                  loading={testLoading["send-inmail"]}
                  response={testResponses["send-inmail"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Recipient Profile ID</Label>
                      <Input
                        placeholder="urn:li:fsd_profile:ACoAABCD1234"
                        value={recipientId}
                        onChange={e => setRecipientId(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input
                        placeholder="Exciting opportunity"
                        value={inmailSubject}
                        onChange={e => setInmailSubject(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Body</Label>
                      <Textarea
                        placeholder="Hello, I wanted to reach out about..."
                        value={inmailBody}
                        onChange={e => setInmailBody(e.target.value)}
                        className="rounded-lg"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>API Type</Label>
                      <Select
                        value={inmailApiType}
                        onValueChange={(
                          value: "classic" | "sales_navigator" | "recruiter"
                        ) => setInmailApiType(value)}
                      >
                        <SelectTrigger className="w-full rounded-lg">
                          <SelectValue placeholder="Select API type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">
                            Classic (Premium)
                          </SelectItem>
                          <SelectItem value="sales_navigator">
                            Sales Navigator
                          </SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Choose based on your LinkedIn subscription. Sales
                        Navigator is default.
                      </p>
                    </div>
                  </div>
                </TestCard>

                <TestCard
                  title="List Chats"
                  description="List LinkedIn conversations"
                  onExecute={() =>
                    executeTest("list-chats", "/linkedin/chats", "POST", {
                      accountId: selectedAccount,
                      limit: 20,
                    })
                  }
                  loading={testLoading["list-chats"]}
                  response={testResponses["list-chats"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Limit: </span>
                    <span>20 conversations</span>
                  </div>
                </TestCard>

                <TestCard
                  title="Get InMail Balance"
                  description="Check available InMail credits"
                  onExecute={() =>
                    executeTest(
                      "inmail-balance",
                      "/linkedin/inmail/balance",
                      "POST",
                      {
                        accountId: selectedAccount,
                      }
                    )
                  }
                  loading={testLoading["inmail-balance"]}
                  response={testResponses["inmail-balance"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Account ID: </span>
                    <span className="font-mono">
                      {selectedAccount || "None selected"}
                    </span>
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="Send Invitation"
                  description="Send connection invitation"
                  onExecute={() =>
                    executeTest(
                      "send-invitation",
                      "/linkedin/invitation/send",
                      "POST",
                      {
                        accountId: selectedAccount,
                        providerProfileId: recipientId,
                        message: invitationMessage || undefined,
                      }
                    )
                  }
                  loading={testLoading["send-invitation"]}
                  response={testResponses["send-invitation"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Profile ID</Label>
                      <Input
                        placeholder="urn:li:fsd_profile:ACoAABCD1234"
                        value={recipientId}
                        onChange={e => setRecipientId(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Message (optional, max 300 chars)</Label>
                      <Textarea
                        placeholder="Hi! I would like to connect with you."
                        value={invitationMessage}
                        onChange={e => setInvitationMessage(e.target.value)}
                        className="rounded-lg"
                        rows={2}
                        maxLength={300}
                      />
                    </div>
                  </div>
                </TestCard>

                <TestCard
                  title="List Sent Invitations"
                  description="List pending connection invitations"
                  onExecute={() =>
                    executeTest(
                      "list-invitations",
                      "/linkedin/invitations",
                      "POST",
                      {
                        accountId: selectedAccount,
                        limit: 50,
                      }
                    )
                  }
                  loading={testLoading["list-invitations"]}
                  response={testResponses["list-invitations"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Limit: </span>
                    <span>50 invitations</span>
                  </div>
                </TestCard>

                <TestCard
                  title="List Received Invitations"
                  description="List pending invitations from others"
                  onExecute={() =>
                    executeTest(
                      "list-received-invitations",
                      "/linkedin/invitations/received",
                      "POST",
                      {
                        accountId: selectedAccount,
                        limit: 50,
                      }
                    )
                  }
                  loading={testLoading["list-received-invitations"]}
                  response={testResponses["list-received-invitations"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Limit: </span>
                    <span>50 invitations</span>
                  </div>
                </TestCard>

                <TestCard
                  title="Accept Invitation"
                  description="Accept a pending invitation"
                  onExecute={() =>
                    executeTest(
                      "accept-invitation",
                      "/linkedin/invitation/accept",
                      "POST",
                      {
                        accountId: selectedAccount,
                        invitationId: receivedInvitationId,
                        sharedSecret: sharedSecret || undefined,
                      }
                    )
                  }
                  loading={testLoading["accept-invitation"]}
                  response={testResponses["accept-invitation"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Invitation ID</Label>
                      <Input
                        placeholder="invitation-id-from-list"
                        value={receivedInvitationId}
                        onChange={e => setReceivedInvitationId(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Shared Secret (optional)</Label>
                      <Input
                        placeholder="From invitation specifics"
                        value={sharedSecret}
                        onChange={e => setSharedSecret(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </TestCard>

                <TestCard
                  title="Decline Invitation"
                  description="Decline a pending invitation"
                  onExecute={() =>
                    executeTest(
                      "decline-invitation",
                      "/linkedin/invitation/decline",
                      "POST",
                      {
                        accountId: selectedAccount,
                        invitationId: receivedInvitationId,
                        sharedSecret: sharedSecret || undefined,
                      }
                    )
                  }
                  loading={testLoading["decline-invitation"]}
                  response={testResponses["decline-invitation"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Invitation ID</Label>
                      <Input
                        placeholder="invitation-id-from-list"
                        value={receivedInvitationId}
                        onChange={e => setReceivedInvitationId(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Shared Secret (optional)</Label>
                      <Input
                        placeholder="From invitation specifics"
                        value={sharedSecret}
                        onChange={e => setSharedSecret(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                </TestCard>

                <TestCard
                  title="List Relations"
                  description="List 1st-degree connections"
                  onExecute={() =>
                    executeTest(
                      "list-relations",
                      "/linkedin/relations",
                      "POST",
                      {
                        accountId: selectedAccount,
                        limit: 50,
                      }
                    )
                  }
                  loading={testLoading["list-relations"]}
                  response={testResponses["list-relations"]}
                >
                  <div className="text-sm">
                    <span className="text-muted-foreground">Limit: </span>
                    <span>50 connections</span>
                  </div>
                </TestCard>

                <TestCard
                  title="Follow Profile"
                  description="Follow a LinkedIn profile or company"
                  onExecute={() =>
                    executeTest("follow-profile", "/linkedin/follow", "POST", {
                      accountId: selectedAccount,
                      identifier: profileIdentifier,
                      isCompany: false,
                    })
                  }
                  loading={testLoading["follow-profile"]}
                  response={testResponses["follow-profile"]}
                >
                  <div className="space-y-2">
                    <Label>Profile/Company Identifier</Label>
                    <Input
                      placeholder="https://www.linkedin.com/in/johndoe"
                      value={profileIdentifier}
                      onChange={e => setProfileIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Posts Tab */}
            <TabsContent value="posts" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="List Posts"
                  description="List posts from a profile"
                  onExecute={() =>
                    executeTest("list-posts", "/linkedin/posts", "POST", {
                      accountId: selectedAccount,
                      identifier: profileIdentifier || undefined,
                      limit: 20,
                    })
                  }
                  loading={testLoading["list-posts"]}
                  response={testResponses["list-posts"]}
                >
                  <div className="space-y-2">
                    <Label>
                      Profile Identifier (optional, omit for own posts)
                    </Label>
                    <Input
                      placeholder="https://www.linkedin.com/in/johndoe"
                      value={profileIdentifier}
                      onChange={e => setProfileIdentifier(e.target.value)}
                      className="rounded-lg"
                    />
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="Classic LinkedIn Search"
                  description="Search people, companies, or posts"
                  onExecute={() =>
                    executeTest("search-linkedin", "/linkedin/search", "POST", {
                      accountId: selectedAccount,
                      keywords: searchKeywords,
                      category: searchCategory,
                      limit: 50,
                    })
                  }
                  loading={testLoading["search-linkedin"]}
                  response={testResponses["search-linkedin"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Keywords</Label>
                      <Input
                        placeholder="software engineer"
                        value={searchKeywords}
                        onChange={e => setSearchKeywords(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select
                        value={searchCategory}
                        onValueChange={setSearchCategory}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PEOPLE">People</SelectItem>
                          <SelectItem value="COMPANIES">Companies</SelectItem>
                          <SelectItem value="POSTS">Posts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Sales Navigator Tab */}
            <TabsContent value="sales-nav" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="Sales Navigator Search"
                  description="Advanced search with Sales Navigator filters"
                  onExecute={() =>
                    executeTest(
                      "sales-nav-search",
                      "/linkedin/search/sales-navigator",
                      "POST",
                      {
                        accountId: selectedAccount,
                        keywords: searchKeywords,
                        limit: 50,
                      }
                    )
                  }
                  loading={testLoading["sales-nav-search"]}
                  response={testResponses["sales-nav-search"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Keywords</Label>
                      <Input
                        placeholder="CEO tech startup"
                        value={searchKeywords}
                        onChange={e => setSearchKeywords(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requires Sales Navigator account. More filters available
                      in API.
                    </p>
                  </div>
                </TestCard>
              </div>
            </TabsContent>

            {/* Raw API Tab */}
            <TabsContent value="raw-api" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <TestCard
                  title="Execute Raw Voyager API Request"
                  description="Execute custom LinkedIn Voyager API requests"
                  onExecute={() => {
                    let body: unknown = undefined;
                    if (rawRequestBody) {
                      try {
                        body = JSON.parse(rawRequestBody);
                      } catch {
                        toast.error("Invalid JSON body");
                        return;
                      }
                    }
                    executeTest("raw-api", "/linkedin/raw", "POST", {
                      accountId: selectedAccount,
                      requestUrl: rawRequestUrl,
                      method: rawRequestMethod,
                      body,
                      encoding: rawRequestEncoding,
                    });
                  }}
                  loading={testLoading["raw-api"]}
                  response={testResponses["raw-api"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Request URL</Label>
                      <Input
                        placeholder="https://www.linkedin.com/voyager/api/..."
                        value={rawRequestUrl}
                        onChange={e => setRawRequestUrl(e.target.value)}
                        className="rounded-lg font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must start with https://www.linkedin.com/
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Method</Label>
                        <Select
                          value={rawRequestMethod}
                          onValueChange={setRawRequestMethod}
                        >
                          <SelectTrigger className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GET">GET</SelectItem>
                            <SelectItem value="POST">POST</SelectItem>
                            <SelectItem value="PUT">PUT</SelectItem>
                            <SelectItem value="PATCH">PATCH</SelectItem>
                            <SelectItem value="DELETE">DELETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch
                          id="encoding"
                          checked={rawRequestEncoding}
                          onCheckedChange={setRawRequestEncoding}
                        />
                        <Label htmlFor="encoding">Enable URL Encoding</Label>
                      </div>
                    </div>
                    <div>
                      <Label>Request Body (JSON, for POST/PUT/PATCH)</Label>
                      <Textarea
                        placeholder='{"key": "value"}'
                        value={rawRequestBody}
                        onChange={e => setRawRequestBody(e.target.value)}
                        className="rounded-lg font-mono text-sm"
                        rows={4}
                      />
                    </div>
                  </div>
                </TestCard>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Example Templates</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => {
                        setRawRequestUrl(
                          "https://www.linkedin.com/voyager/api/identity/dash/profiles"
                        );
                        setRawRequestMethod("GET");
                        setRawRequestBody("");
                      }}
                    >
                      Profile Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => {
                        setRawRequestUrl(
                          "https://www.linkedin.com/voyager/api/identity/socialSellingIndex"
                        );
                        setRawRequestMethod("GET");
                        setRawRequestBody("");
                      }}
                    >
                      SSI Score
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => {
                        setRawRequestUrl(
                          "https://www.linkedin.com/voyager/api/identity/wvmpCards"
                        );
                        setRawRequestMethod("GET");
                        setRawRequestBody("");
                      }}
                    >
                      Profile Viewers
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      onClick={() => {
                        setRawRequestUrl(
                          "https://www.linkedin.com/voyager/api/feed/updates"
                        );
                        setRawRequestMethod("GET");
                        setRawRequestBody("");
                      }}
                    >
                      Feed Updates
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <TestCard
                  title="List Webhooks"
                  description="List all registered webhooks"
                  onExecute={() =>
                    executeTest("list-webhooks", "/webhooks", "GET")
                  }
                  loading={testLoading["list-webhooks"]}
                  response={testResponses["list-webhooks"]}
                >
                  <p className="text-sm text-muted-foreground">
                    No parameters required
                  </p>
                </TestCard>

                <TestCard
                  title="Register Webhook"
                  description="Register a new webhook endpoint"
                  onExecute={() =>
                    executeTest("register-webhook", "/webhooks", "POST", {
                      name: webhookName || undefined,
                      requestUrl: webhookUrl,
                      source: webhookSource,
                      events:
                        webhookSource === "messaging"
                          ? ["message_received", "message_read"]
                          : webhookSource === "email"
                            ? ["mail_sent", "mail_received"]
                            : webhookSource === "email_tracking"
                              ? ["mail_opened", "mail_link_clicked"]
                              : undefined,
                    })
                  }
                  loading={testLoading["register-webhook"]}
                  response={testResponses["register-webhook"]}
                >
                  <div className="space-y-3">
                    <div>
                      <Label>Webhook Name (optional)</Label>
                      <Input
                        placeholder="my-webhook"
                        value={webhookName}
                        onChange={e => setWebhookName(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://api.example.com/webhooks/unipile"
                        value={webhookUrl}
                        onChange={e => setWebhookUrl(e.target.value)}
                        className="rounded-lg"
                      />
                    </div>
                    <div>
                      <Label>Source</Label>
                      <Select
                        value={webhookSource}
                        onValueChange={setWebhookSource}
                      >
                        <SelectTrigger className="rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="messaging">Messaging</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="email_tracking">
                            Email Tracking
                          </SelectItem>
                          <SelectItem value="account_status">
                            Account Status
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TestCard>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
