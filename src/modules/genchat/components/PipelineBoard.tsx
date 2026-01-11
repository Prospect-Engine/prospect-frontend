'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Phone, Star, GripVertical, ExternalLink } from 'lucide-react';

interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  totalScore: number | null;
  scoreCategory: string | null;
  createdAt: string | Date;
  applicant: {
    id: string;
    email: string;
    name: string | null;
    phone: string;
  };
  job: {
    id: string;
    title: string;
    slug: string;
  };
}

interface PipelineBoardProps {
  initialApplications: Application[];
  jobs: { id: string; title: string }[];
}

const PIPELINE_STAGES = [
  { key: 'OTP_VERIFIED', label: 'New', color: 'bg-blue-500' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'COMPLETED', label: 'Completed', color: 'bg-purple-500' },
  { key: 'EVALUATED', label: 'Evaluated', color: 'bg-indigo-500' },
  { key: 'REVIEWED', label: 'Reviewed', color: 'bg-cyan-500' },
  { key: 'SHORTLISTED', label: 'Shortlisted', color: 'bg-green-500' },
  { key: 'REJECTED', label: 'Rejected', color: 'bg-red-500' },
  { key: 'HIRED', label: 'Hired', color: 'bg-emerald-500' },
];

export function PipelineBoard({ initialApplications, jobs }: PipelineBoardProps) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApplications);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const filteredApplications = selectedJob === 'all'
    ? applications
    : applications.filter(app => app.job.id === selectedJob);

  const getApplicationsByStage = useCallback((stageKey: string) => {
    return filteredApplications.filter(app => app.status === stageKey);
  }, [filteredApplications]);

  const handleDragStart = (e: React.DragEvent, applicationId: string) => {
    setDraggedItem(applicationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();

    if (!draggedItem || isMoving) return;

    const application = applications.find(app => app.id === draggedItem);
    if (!application || application.status === targetStage) {
      setDraggedItem(null);
      return;
    }

    setIsMoving(true);

    try {
      const response = await fetch('/api/admin/candidates/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: draggedItem,
          newStatus: targetStage,
          sendNotification: true,
        }),
      });

      if (response.ok) {
        setApplications(prev =>
          prev.map(app =>
            app.id === draggedItem ? { ...app, status: targetStage } : app
          )
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to move candidate:', error);
    } finally {
      setDraggedItem(null);
      setIsMoving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map(job => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-slate-500">
          {filteredApplications.length} candidates
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageApplications = getApplicationsByStage(stage.key);

          return (
            <div
              key={stage.key}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.key)}
            >
              <div className="bg-slate-100 rounded-lg p-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <span className="font-medium">{stage.label}</span>
                  </div>
                  <Badge variant="secondary">{stageApplications.length}</Badge>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[200px]">
                  {stageApplications.map(app => (
                    <CandidateCard
                      key={app.id}
                      application={app}
                      isDragging={draggedItem === app.id}
                      onDragStart={(e) => handleDragStart(e, app.id)}
                    />
                  ))}

                  {stageApplications.length === 0 && (
                    <div className="text-center text-slate-400 py-8 text-sm">
                      Drop candidates here
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CandidateCardProps {
  application: Application;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
}

function CandidateCard({ application, isDragging, onDragStart }: CandidateCardProps) {
  const router = useRouter();

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={`p-3 cursor-grab active:cursor-grabbing transition-opacity ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          {/* Name and Score */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 truncate">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-sm truncate">
                {application.applicant.name ||
                  application.applicant.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            </div>

            {application.totalScore !== null && (
              <div className="flex items-center gap-0.5 text-amber-500">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs font-medium">
                  {Math.round(application.totalScore)}
                </span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="flex items-center gap-1.5 mt-1">
            <Mail className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-500 truncate">
              {application.applicant.email}
            </span>
          </div>

          {/* Job Title */}
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              {application.job.title}
            </Badge>
          </div>

          {/* View Button */}
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs w-full"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/candidates/${application.id}`);
            }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
