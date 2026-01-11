"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { aiConfigSchema, type AIConfigInput } from "@/lib/validators";
import { PROVIDER_MODELS } from "@/lib/ai/constants";

interface AIConfigFormProps {
  initialConfig?: {
    id?: string;
    provider: string;
    model: string;
    apiKey: string;
    settings?: {
      temperature?: number;
      maxTokens?: number;
    };
  };
}

const providers = [
  { value: "OPENAI", label: "OpenAI" },
  { value: "ANTHROPIC", label: "Anthropic (Claude)" },
  { value: "GOOGLE", label: "Google (Gemini)" },
  { value: "GROQ", label: "Groq" },
  { value: "MISTRAL", label: "Mistral" },
  { value: "CUSTOM", label: "Custom Endpoint" },
];

export function AIConfigForm({ initialConfig }: AIConfigFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const form = useForm<AIConfigInput>({
    resolver: zodResolver(aiConfigSchema),
    defaultValues: {
      provider: (initialConfig?.provider as AIConfigInput["provider"]) || "OPENAI",
      model: initialConfig?.model || "",
      apiKey: initialConfig?.apiKey || "",
      settings: {
        temperature: initialConfig?.settings?.temperature ?? 0.7,
        maxTokens: initialConfig?.settings?.maxTokens ?? 1000,
      },
    },
  });

  const selectedProvider = form.watch("provider");
  const models = PROVIDER_MODELS[selectedProvider] || [];

  async function onSubmit(data: AIConfigInput) {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/settings/ai", {
        method: initialConfig?.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          id: initialConfig?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save configuration");
      }

      router.refresh();
    } catch (error) {
      console.error("Error saving AI config:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function testConnection() {
    setIsTesting(true);
    setTestResult(null);

    try {
      const data = form.getValues();
      const response = await fetch("/api/admin/settings/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      setTestResult({
        success: response.ok,
        message: response.ok ? "Connection successful!" : result.error || "Connection failed",
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      });
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Provider Configuration</CardTitle>
            <CardDescription>
              Configure the AI provider for conducting interviews and evaluating candidates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Provider</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset model when provider changes
                      const providerModels = PROVIDER_MODELS[value as keyof typeof PROVIDER_MODELS];
                      if (providerModels?.length > 0) {
                        form.setValue("model", providerModels[0].value);
                      }
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showApiKey ? "text" : "password"}
                        placeholder="Enter your API key"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Your API key is stored encrypted and never exposed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Settings</CardTitle>
            <CardDescription>
              Fine-tune the AI behavior for interviews
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="settings.temperature"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Temperature</FormLabel>
                    <span className="text-sm text-slate-500">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={2}
                      step={0.1}
                      value={[field.value || 0.7]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Lower values make responses more focused, higher values more creative
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.maxTokens"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Tokens</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={100}
                      max={8000}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                    />
                  </FormControl>
                  <FormDescription>
                    Maximum length of AI responses (100-8000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={testConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
