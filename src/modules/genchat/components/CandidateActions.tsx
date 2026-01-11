"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, MessageSquare, Trash2 } from "lucide-react";

interface CandidateActionsProps {
  applicationId: string;
  currentStatus: string;
  currentNotes: string | null;
}

const statuses = [
  { value: "OTP_PENDING", label: "OTP Pending" },
  { value: "OTP_VERIFIED", label: "Verified" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "EVALUATED", label: "Evaluated" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "HIRED", label: "Hired" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

export function CandidateActions({
  applicationId,
  currentStatus,
  currentNotes,
}: CandidateActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function updateStatus(newStatus: string) {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/candidates/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  }

  async function saveNotes() {
    setIsSavingNotes(true);
    try {
      const response = await fetch(`/api/admin/candidates/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSavingNotes(false);
    }
  }

  async function deleteApplication() {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/candidates/${applicationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/admin/candidates");
      }
    } catch (error) {
      console.error("Error deleting application:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Update Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={status}
            onValueChange={updateStatus}
            disabled={isUpdating}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="bg-green-500 hover:bg-green-600"
              onClick={() => updateStatus("SHORTLISTED")}
              disabled={isUpdating || status === "SHORTLISTED"}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Shortlist"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => updateStatus("REJECTED")}
              disabled={isUpdating || status === "REJECTED"}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
            </Button>
          </div>

          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-600"
            onClick={() => updateStatus("HIRED")}
            disabled={isUpdating || status === "HIRED"}
          >
            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark as Hired"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            className="min-h-[100px]"
            placeholder="Add internal notes about this candidate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            className="w-full mt-3"
            variant="outline"
            onClick={saveNotes}
            disabled={isSavingNotes}
          >
            {isSavingNotes ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Save Notes
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Application
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Application?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this application and all associated data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteApplication}
                  className="bg-red-500 hover:bg-red-600"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
