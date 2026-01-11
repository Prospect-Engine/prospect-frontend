'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Tag,
  Mail,
  Calendar,
  MessageSquare,
  CheckCircle,
  UserPlus,
  ArrowRight,
  Activity as ActivityIcon,
  ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  performedBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CandidateActivityProps {
  applicantId: string;
}

const activityIcons: Record<string, React.ReactNode> = {
  APPLICATION_CREATED: <UserPlus className="h-4 w-4" />,
  STATUS_CHANGED: <ArrowRight className="h-4 w-4" />,
  NOTE_ADDED: <FileText className="h-4 w-4" />,
  TAG_ADDED: <Tag className="h-4 w-4" />,
  TAG_REMOVED: <Tag className="h-4 w-4" />,
  EMAIL_SENT: <Mail className="h-4 w-4" />,
  EMAIL_RECEIVED: <Mail className="h-4 w-4" />,
  INTERVIEW_SCHEDULED: <Calendar className="h-4 w-4" />,
  INTERVIEW_COMPLETED: <CheckCircle className="h-4 w-4" />,
  FEEDBACK_SUBMITTED: <MessageSquare className="h-4 w-4" />,
  POOL_ADDED: <UserPlus className="h-4 w-4" />,
  POOL_REMOVED: <UserPlus className="h-4 w-4" />,
  TASK_CREATED: <CheckCircle className="h-4 w-4" />,
  TASK_COMPLETED: <CheckCircle className="h-4 w-4" />,
  CUSTOM: <ActivityIcon className="h-4 w-4" />,
};

const activityColors: Record<string, string> = {
  APPLICATION_CREATED: 'bg-green-100 text-green-600',
  STATUS_CHANGED: 'bg-blue-100 text-blue-600',
  NOTE_ADDED: 'bg-slate-100 text-slate-600',
  TAG_ADDED: 'bg-purple-100 text-purple-600',
  TAG_REMOVED: 'bg-purple-100 text-purple-600',
  EMAIL_SENT: 'bg-cyan-100 text-cyan-600',
  EMAIL_RECEIVED: 'bg-cyan-100 text-cyan-600',
  INTERVIEW_SCHEDULED: 'bg-orange-100 text-orange-600',
  INTERVIEW_COMPLETED: 'bg-green-100 text-green-600',
  FEEDBACK_SUBMITTED: 'bg-yellow-100 text-yellow-600',
  POOL_ADDED: 'bg-indigo-100 text-indigo-600',
  POOL_REMOVED: 'bg-indigo-100 text-indigo-600',
  TASK_CREATED: 'bg-pink-100 text-pink-600',
  TASK_COMPLETED: 'bg-green-100 text-green-600',
  CUSTOM: 'bg-slate-100 text-slate-600',
};

export function CandidateActivity({ applicantId }: CandidateActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchActivities();
  }, [applicantId, limit]);

  const fetchActivities = async () => {
    try {
      const res = await fetch(`/api/admin/crm/activities?applicantId=${applicantId}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Activity Timeline</span>
          <Badge variant="outline">{total} events</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-slate-500">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No activity recorded</div>
        ) : (
          <div className="space-y-0">
            {activities.map((activity, index) => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${activityColors[activity.type] || 'bg-slate-100 text-slate-600'}`}>
                    {activityIcons[activity.type] || <ActivityIcon className="h-4 w-4" />}
                  </div>
                  {index < activities.length - 1 && (
                    <div className="w-px h-full bg-slate-200 my-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{activity.title}</p>
                  </div>
                  {activity.description && (
                    <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {activity.performedBy && (
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px]">
                            {activity.performedBy.name?.charAt(0) || activity.performedBy.email.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-slate-500">{activity.performedBy.name}</span>
                      </div>
                    )}
                    <span className="text-xs text-slate-400">
                      {format(new Date(activity.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {total > activities.length && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLimit(limit + 10)}
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Load more ({total - activities.length} remaining)
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
