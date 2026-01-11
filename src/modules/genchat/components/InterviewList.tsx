'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  MessageSquare,
  Plus,
  User,
  Link as LinkIcon,
} from 'lucide-react';

interface Interview {
  id: string;
  scheduledAt: string | Date;
  duration: number;
  type: string;
  status: string;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
  application: {
    id: string;
    applicant: {
      email: string;
      name: string | null;
    };
    job: {
      id: string;
      title: string;
    };
  };
}

interface Application {
  id: string;
  applicant: {
    email: string;
    name: string | null;
  };
  job: {
    id: string;
    title: string;
  };
  interviews: {
    id: string;
    scheduledAt: string | Date;
  }[];
}

interface InterviewListProps {
  initialInterviews: Interview[];
  availableApplications: Application[];
}

const INTERVIEW_TYPES = [
  { value: 'AI_CHAT', label: 'AI Chat', icon: MessageSquare },
  { value: 'VIDEO', label: 'Video Call', icon: Video },
  { value: 'PHONE', label: 'Phone Call', icon: Phone },
  { value: 'ONSITE', label: 'On-site', icon: MapPin },
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-slate-100 text-slate-800',
  RESCHEDULED: 'bg-orange-100 text-orange-800',
};

export function InterviewList({ initialInterviews, availableApplications }: InterviewListProps) {
  const router = useRouter();
  const [interviews, setInterviews] = useState(initialInterviews);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState('VIDEO');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleScheduleInterview = async () => {
    if (!selectedApplication || !scheduledDate || !scheduledTime) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);

      const response = await fetch('/api/admin/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedApplication,
          scheduledAt: scheduledAt.toISOString(),
          duration: parseInt(duration),
          type,
          meetingLink: meetingLink || undefined,
          location: location || undefined,
          notes: notes || undefined,
          sendInvitation: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setInterviews(prev => [...prev, result.data]);
        setIsDialogOpen(false);
        resetForm();
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to schedule interview:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (interviewId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/interviews/${interviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setInterviews(prev =>
          prev.map(interview =>
            interview.id === interviewId
              ? { ...interview, status: newStatus }
              : interview
          )
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const resetForm = () => {
    setSelectedApplication('');
    setScheduledDate('');
    setScheduledTime('');
    setDuration('30');
    setType('VIDEO');
    setMeetingLink('');
    setLocation('');
    setNotes('');
  };

  const getTypeIcon = (interviewType: string) => {
    const typeConfig = INTERVIEW_TYPES.find(t => t.value === interviewType);
    const Icon = typeConfig?.icon || Video;
    return <Icon className="h-4 w-4" />;
  };

  // Group interviews by date
  const groupedInterviews = interviews.reduce((acc, interview) => {
    const date = new Date(interview.scheduledAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(interview);
    return acc;
  }, {} as Record<string, Interview[]>);

  return (
    <div className="space-y-6">
      {/* Schedule Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Application Selection */}
              <div className="space-y-2">
                <Label>Candidate</Label>
                <Select value={selectedApplication} onValueChange={setSelectedApplication}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableApplications.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.applicant.name || app.applicant.email} - {app.job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Duration and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duration (min)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVIEW_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Meeting Link or Location */}
              {(type === 'VIDEO' || type === 'AI_CHAT') && (
                <div className="space-y-2">
                  <Label>Meeting Link</Label>
                  <Input
                    type="url"
                    placeholder="https://zoom.us/..."
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
              )}

              {type === 'ONSITE' && (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Office address..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes / Instructions</Label>
                <Textarea
                  placeholder="Any additional instructions for the candidate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                className="w-full"
                onClick={handleScheduleInterview}
                disabled={isSubmitting || !selectedApplication || !scheduledDate || !scheduledTime}
              >
                {isSubmitting ? 'Scheduling...' : 'Schedule Interview'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Interview List */}
      {Object.entries(groupedInterviews).length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No interviews scheduled</h3>
          <p className="text-slate-500">Schedule your first interview to get started</p>
        </Card>
      ) : (
        Object.entries(groupedInterviews).map(([date, dayInterviews]) => (
          <div key={date} className="space-y-3">
            <h3 className="text-sm font-medium text-slate-500">
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            <div className="space-y-2">
              {dayInterviews.map(interview => (
                <Card key={interview.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Time */}
                      <div className="text-center min-w-[60px]">
                        <div className="text-lg font-semibold">
                          {new Date(interview.scheduledAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {interview.duration} min
                        </div>
                      </div>

                      <div className="border-l pl-4">
                        {/* Candidate Info */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-400" />
                          <span className="font-medium">
                            {interview.application.applicant.name || interview.application.applicant.email}
                          </span>
                        </div>

                        {/* Job Title */}
                        <div className="text-sm text-slate-500 mt-1">
                          {interview.application.job.title}
                        </div>

                        {/* Type and Link */}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            {getTypeIcon(interview.type)}
                            {INTERVIEW_TYPES.find(t => t.value === interview.type)?.label}
                          </Badge>

                          {interview.meetingLink && (
                            <a
                              href={interview.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="h-3 w-3" />
                              Join
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-3">
                      <Select
                        value={interview.status}
                        onValueChange={(value) => handleStatusChange(interview.id, value)}
                      >
                        <SelectTrigger className="w-[140px]">
                          <Badge className={STATUS_COLORS[interview.status] || 'bg-slate-100'}>
                            {interview.status.replace('_', ' ')}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="COMPLETED">Completed</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                          <SelectItem value="NO_SHOW">No Show</SelectItem>
                          <SelectItem value="RESCHEDULED">Rescheduled</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/candidates/${interview.application.id}`)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
