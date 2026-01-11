'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Star, ThumbsUp, ThumbsDown, Minus, CheckCircle } from 'lucide-react';

interface FeedbackFormProps {
  applicationId: string;
  existingFeedback?: {
    id: string;
    rating: number;
    strengths: string | null;
    concerns: string | null;
    recommendation: string;
    scorecard: object | null;
  };
  onSuccess?: () => void;
}

const SCORECARD_CRITERIA = [
  { key: 'technical', label: 'Technical Skills' },
  { key: 'communication', label: 'Communication' },
  { key: 'problemSolving', label: 'Problem Solving' },
  { key: 'cultureFit', label: 'Culture Fit' },
  { key: 'experience', label: 'Relevant Experience' },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'STRONG_YES', label: 'Strong Yes', icon: ThumbsUp, color: 'text-green-600' },
  { value: 'YES', label: 'Yes', icon: ThumbsUp, color: 'text-green-500' },
  { value: 'NEUTRAL', label: 'Neutral', icon: Minus, color: 'text-slate-500' },
  { value: 'NO', label: 'No', icon: ThumbsDown, color: 'text-orange-500' },
  { value: 'STRONG_NO', label: 'Strong No', icon: ThumbsDown, color: 'text-red-600' },
];

export function FeedbackForm({ applicationId, existingFeedback, onSuccess }: FeedbackFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [rating, setRating] = useState(existingFeedback?.rating || 3);
  const [strengths, setStrengths] = useState(existingFeedback?.strengths || '');
  const [concerns, setConcerns] = useState(existingFeedback?.concerns || '');
  const [recommendation, setRecommendation] = useState(existingFeedback?.recommendation || 'NEUTRAL');
  const [scorecard, setScorecard] = useState<Record<string, number>>(
    (existingFeedback?.scorecard as Record<string, number>) || {}
  );

  const handleScorecardChange = (key: string, value: number) => {
    setScorecard(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          rating,
          strengths: strengths || null,
          concerns: concerns || null,
          recommendation,
          scorecard: Object.keys(scorecard).length > 0 ? scorecard : null,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onSuccess?.();
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-6 text-center">
        <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Feedback Submitted</h3>
        <p className="text-slate-500">Your feedback has been recorded successfully.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Submit Your Feedback</h3>

      <div className="space-y-6">
        {/* Overall Rating */}
        <div className="space-y-2">
          <Label>Overall Rating</Label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`h-8 w-8 ${
                    value <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm text-slate-500">{rating}/5</span>
          </div>
        </div>

        {/* Scorecard */}
        <div className="space-y-3">
          <Label>Scorecard (Optional)</Label>
          {SCORECARD_CRITERIA.map(criteria => (
            <div key={criteria.key} className="flex items-center justify-between">
              <span className="text-sm">{criteria.label}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(value => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleScorecardChange(criteria.key, value)}
                    className={`h-8 w-8 rounded-full text-xs font-medium border transition-colors ${
                      scorecard[criteria.key] === value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Strengths */}
        <div className="space-y-2">
          <Label>Strengths</Label>
          <Textarea
            placeholder="What stood out positively about this candidate?"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
          />
        </div>

        {/* Concerns */}
        <div className="space-y-2">
          <Label>Concerns</Label>
          <Textarea
            placeholder="Any concerns or areas for improvement?"
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            rows={3}
          />
        </div>

        {/* Recommendation */}
        <div className="space-y-2">
          <Label>Recommendation</Label>
          <Select value={recommendation} onValueChange={setRecommendation}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECOMMENDATION_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className={`h-4 w-4 ${option.color}`} />
                    {option.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </Button>
      </div>
    </Card>
  );
}
