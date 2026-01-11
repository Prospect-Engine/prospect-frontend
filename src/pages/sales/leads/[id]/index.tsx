/**
 * LEAD DETAIL PAGE
 * ================
 * View and manage individual contact details.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import { CrmApiService, Contact } from "@/services/crmApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Globe,
  Building2,
  Briefcase,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  Clock,
  ExternalLink,
  MoreHorizontal,
  CheckCircle,
  User,
  Activity,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Status colors
const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-gray-100 text-gray-700",
  PROSPECT: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-purple-100 text-purple-700",
  LOST: "bg-red-100 text-red-700",
  LEAD: "bg-yellow-100 text-yellow-700",
  ENGAGED: "bg-cyan-100 text-cyan-700",
};

// Priority colors
const priorityColors: Record<string, string> = {
  HOT: "bg-red-500 text-white",
  WARM: "bg-orange-500 text-white",
  COLD: "bg-blue-500 text-white",
};

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);

  // Fetch contact data
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchContact = async () => {
      setLoading(true);
      try {
        const { data, status } = await CrmApiService.getContact(id);
        if (status >= 200 && status < 300 && data) {
          setContact(data);
        }
      } catch (error) {
        ShowShortMessage("Failed to load contact", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  // Fetch related data
  useEffect(() => {
    if (!id || typeof id !== "string") return;

    const fetchRelatedData = async () => {
      try {
        // Fetch activities
        const activitiesRes = await CrmApiService.getActivities(id);
        if (activitiesRes.status >= 200 && activitiesRes.status < 300) {
          setActivities(activitiesRes.data || []);
        }

        // Fetch notes
        const notesRes = await CrmApiService.getNotes(id);
        if (notesRes.status >= 200 && notesRes.status < 300) {
          setNotes(notesRes.data || []);
        }

        // Fetch tasks
        const tasksRes = await CrmApiService.getTasks(id, "contact");
        if (tasksRes.status >= 200 && tasksRes.status < 300) {
          setTasks(tasksRes.data || []);
        }

        // Fetch deals
        const dealsRes = await CrmApiService.getDeals(id, "contact");
        if (dealsRes.status >= 200 && dealsRes.status < 300) {
          setDeals(dealsRes.data || []);
        }
      } catch (error) {
        console.error("Error fetching related data:", error);
      }
    };

    fetchRelatedData();
  }, [id]);

  // Delete contact
  const handleDelete = async () => {
    if (!id || typeof id !== "string") return;
    if (!confirm("Are you sure you want to delete this contact?")) return;

    setDeleting(true);
    try {
      const { status } = await CrmApiService.deleteContact(id);
      if (status >= 200 && status < 300) {
        ShowShortMessage("Contact deleted successfully", "success");
        router.push("/sales/leads");
      }
    } catch (error) {
      ShowShortMessage("Failed to delete contact", "error");
    } finally {
      setDeleting(false);
    }
  };

  // Get initials
  const getInitials = (contact: Contact) => {
    if (contact.name) {
      return contact.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return contact.email?.[0]?.toUpperCase() || "?";
  };

  // Check if from outreach
  const isFromOutreach = (contact: Contact) => {
    return contact.source === "LINKEDIN_OUTREACH" || contact.linkedinUrnId;
  };

  if (loading) {
    return (
      <AuthGuard checkSubscription={true}>
        <AppLayout activePage="Leads">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl col-span-2" />
            </div>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  if (!contact) {
    return (
      <AuthGuard checkSubscription={true}>
        <AppLayout activePage="Leads">
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Contact not found</p>
            <Link href="/sales/leads" className="text-[#3b82f6] hover:underline">
              Back to Leads
            </Link>
          </div>
        </AppLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard checkSubscription={true}>
      <AppLayout activePage="Leads">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Link
                href="/sales/leads"
                className="mt-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Avatar className="h-20 w-20">
                {contact.linkedinProfilePhoto || contact.avatar ? (
                  <AvatarImage
                    src={contact.linkedinProfilePhoto || contact.avatar}
                    alt={contact.name || ""}
                  />
                ) : null}
                <AvatarFallback className="bg-[#3b82f6]/10 text-[#3b82f6] text-2xl font-semibold">
                  {getInitials(contact)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {contact.name || "Unnamed Contact"}
                  </h1>
                  {contact.priority && (
                    <Badge className={cn("text-xs", priorityColors[contact.priority])}>
                      {contact.priority}
                    </Badge>
                  )}
                  <Badge
                    className={cn(
                      "rounded-full text-xs",
                      statusColors[contact.status || "LEAD"]
                    )}
                  >
                    {contact.status || "Lead"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {contact.jobTitle && (
                    <span>
                      {contact.jobTitle}
                      {contact.company?.name && ` at ${contact.company.name}`}
                    </span>
                  )}
                </p>
                {contact.linkedinHeadline && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {contact.linkedinHeadline}
                  </p>
                )}
                {isFromOutreach(contact) && (
                  <Badge className="mt-2 bg-[#0077b5]/10 text-[#0077b5] border-[#0077b5]/20">
                    <Linkedin className="h-3 w-3 mr-1" />
                    From LinkedIn Outreach
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push(`/sales/leads/${id}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-xl px-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
                  {contact.email && (
                    <DropdownMenuItem
                      onClick={() => window.open(`mailto:${contact.email}`)}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Send Email
                    </DropdownMenuItem>
                  )}
                  {contact.linkedinUrl && (
                    <DropdownMenuItem
                      onClick={() => window.open(contact.linkedinUrl, "_blank")}
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      View LinkedIn
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Contact
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Contact Info */}
            <div className="space-y-6">
              {/* Contact Details */}
              <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm hover:text-[#3b82f6]"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  {contact.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${contact.phoneNumber}`}
                        className="text-sm hover:text-[#3b82f6]"
                      >
                        {contact.phoneNumber}
                      </a>
                    </div>
                  )}
                  {contact.whatsappNumber && (
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.whatsappNumber}</span>
                    </div>
                  )}
                  {contact.linkedinUrl && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-[#3b82f6] flex items-center gap-1"
                      >
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {contact.twitterUrl && (
                    <div className="flex items-center gap-3">
                      <Twitter className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contact.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-[#3b82f6] flex items-center gap-1"
                      >
                        Twitter
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {contact.websiteUrl && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={contact.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:text-[#3b82f6] flex items-center gap-1"
                      >
                        Website
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {contact.linkedinLocation && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{contact.linkedinLocation}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company */}
              {contact.company && (
                <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                  <CardHeader>
                    <CardTitle className="text-lg">Company</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{contact.company.name}</p>
                        {contact.company.industry && (
                          <p className="text-sm text-muted-foreground">
                            {contact.company.industry}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tags */}
              {contact.tags && contact.tags.length > 0 && (
                <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {contact.tags.map((tagRelation) => (
                        <Badge
                          key={tagRelation.id}
                          variant="secondary"
                          className="rounded-full"
                          style={{
                            backgroundColor: tagRelation.tag.color
                              ? `${tagRelation.tag.color}20`
                              : undefined,
                            color: tagRelation.tag.color,
                          }}
                        >
                          {tagRelation.tag.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                <CardHeader>
                  <CardTitle className="text-lg">Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span>{contact.source || "Manual"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lead Score</span>
                    <span>{contact.leadScore || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>
                      {new Date(contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {contact.lastContactedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Contacted</span>
                      <span>
                        {new Date(contact.lastContactedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Activity, Notes, Tasks, Deals */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="activity" className="space-y-4">
                <TabsList className="bg-muted/30 rounded-xl p-1">
                  <TabsTrigger value="activity" className="rounded-lg">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="rounded-lg">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Notes ({notes.length})
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="rounded-lg">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tasks ({tasks.length})
                  </TabsTrigger>
                  <TabsTrigger value="deals" className="rounded-lg">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Deals ({deals.length})
                  </TabsTrigger>
                </TabsList>

                {/* Activity Tab */}
                <TabsContent value="activity">
                  <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                    <CardHeader>
                      <CardTitle>Activity Timeline</CardTitle>
                      <CardDescription>
                        Recent interactions and events
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No activity yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activities.slice(0, 10).map((activity, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-sm">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                  <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Notes</CardTitle>
                        <CardDescription>
                          Add and manage notes for this contact
                        </CardDescription>
                      </div>
                      <Button size="sm" className="rounded-xl">
                        Add Note
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {notes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No notes yet</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notes.map((note, i) => (
                            <div
                              key={i}
                              className="p-4 bg-muted/30 rounded-xl"
                            >
                              {note.title && (
                                <p className="font-medium mb-1">{note.title}</p>
                              )}
                              <p className="text-sm">{note.content}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(note.createdAt).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks">
                  <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Tasks</CardTitle>
                        <CardDescription>
                          Manage tasks related to this contact
                        </CardDescription>
                      </div>
                      <Button size="sm" className="rounded-xl">
                        Add Task
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No tasks yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tasks.map((task, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl"
                            >
                              <CheckCircle
                                className={cn(
                                  "h-5 w-5",
                                  task.status === "COMPLETED"
                                    ? "text-green-500"
                                    : "text-muted-foreground"
                                )}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{task.title}</p>
                                {task.dueDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {task.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Deals Tab */}
                <TabsContent value="deals">
                  <Card className="bg-white dark:bg-[#2c2c2e] rounded-2xl border border-black/[0.04] dark:border-white/[0.04]">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Deals</CardTitle>
                        <CardDescription>
                          Deals associated with this contact
                        </CardDescription>
                      </div>
                      <Button size="sm" className="rounded-xl">
                        Add Deal
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {deals.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No deals yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {deals.map((deal, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                            >
                              <div>
                                <p className="font-medium">{deal.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {deal.stage}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  ${deal.value?.toLocaleString() || 0}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {deal.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
