"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Users, MessageSquare, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface JobActionsProps {
  jobId: string;
  jobSlug: string;
  status: string;
}

export function JobActions({ jobId, jobSlug, status }: JobActionsProps) {
  const handleCopyLink = () => {
    const url = `${window.location.origin}/apply/${jobSlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/jobs/${jobId}`}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/jobs/${jobId}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Job
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/jobs/${jobId}/questions`}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Manage Questions
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/admin/jobs/${jobId}/candidates`}>
            <Users className="mr-2 h-4 w-4" />
            View Candidates
          </Link>
        </DropdownMenuItem>
        {status === "PUBLISHED" && (
          <>
            <DropdownMenuItem onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Apply Link
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/apply/${jobSlug}`} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
