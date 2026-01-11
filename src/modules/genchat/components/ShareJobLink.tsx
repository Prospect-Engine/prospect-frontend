"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, ExternalLink, Share2, QrCode } from "lucide-react";

interface ShareJobLinkProps {
  jobSlug: string;
  jobTitle: string;
  isPublished: boolean;
}

export function ShareJobLink({ jobSlug, jobTitle, isPublished }: ShareJobLinkProps) {
  const [copied, setCopied] = useState(false);
  const applyUrl = typeof window !== "undefined"
    ? `${window.location.origin}/apply/${jobSlug}`
    : `/apply/${jobSlug}`;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(applyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  if (!isPublished) {
    return (
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="py-4">
          <p className="text-sm text-yellow-800">
            Publish this job to get a shareable link for candidates.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share Application Link
        </CardTitle>
        <CardDescription>
          Share this link with candidates to let them apply
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={applyUrl}
            readOnly
            className="font-mono text-sm bg-slate-50"
          />
          <Button onClick={copyToClipboard} variant="outline">
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={copyToClipboard} className="flex-1">
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
          <Button variant="outline" asChild>
            <a href={applyUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </a>
          </Button>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-slate-600 mb-2">
            Candidates who visit this link will:
          </p>
          <ol className="text-sm text-slate-500 space-y-1 list-decimal list-inside">
            <li>See the job details</li>
            <li>Enter their email & phone</li>
            <li>Receive and verify OTP</li>
            <li>Chat with AI interviewer</li>
            <li>See their score after completion</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}

export function CopyLinkButton({ jobSlug }: { jobSlug: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    const url = `${window.location.origin}/apply/${jobSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <Button onClick={copyToClipboard} variant="outline" size="sm">
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy Link
        </>
      )}
    </Button>
  );
}
