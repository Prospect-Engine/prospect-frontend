'use client';

import { useState } from 'react';
import { Loader2, Sparkles, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { toast } from 'sonner';

interface GeneratedContent {
  description: string;
  requirements: string;
  responsibilities: string;
}

interface AIJobPostDialogProps {
  currentTitle?: string;
  onApply: (content: GeneratedContent) => void;
}

export function AIJobPostDialog({ currentTitle, onApply }: AIJobPostDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [title, setTitle] = useState(currentTitle || '');
  const [keyRequirements, setKeyRequirements] = useState('');
  const [tone, setTone] = useState('professional');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Please enter a job title');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-job-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, keyRequirements, tone }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedContent(data.data);
        toast.success('Job post generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate job post');
      }
    } catch {
      toast.error('Failed to generate job post');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedContent) {
      onApply(generatedContent);
      setOpen(false);
      setGeneratedContent(null);
      toast.success('Content applied to form');
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && currentTitle) {
      setTitle(currentTitle);
    }
    if (!newOpen) {
      // Reset state when closing
      setGeneratedContent(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Job Post Generator
          </DialogTitle>
          <DialogDescription>
            Enter the job title and key requirements, and AI will generate a complete job posting for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Section */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="ai-title">Job Title *</Label>
              <Input
                id="ai-title"
                placeholder="e.g., Senior Software Engineer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-requirements">Key Requirements / Notes (Optional)</Label>
              <Textarea
                id="ai-requirements"
                placeholder="Add any specific requirements, skills, or notes about the role..."
                value={keyRequirements}
                onChange={(e) => setKeyRequirements(e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex items-end gap-4">
              <div className="space-y-2 flex-1">
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual & Friendly</SelectItem>
                    <SelectItem value="startup">Startup & Energetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !title.trim()}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : generatedContent ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Section */}
          {generatedContent && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Preview</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-600">Description</Label>
                  <div className="p-4 bg-white border rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{generatedContent.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-600">Requirements</Label>
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="whitespace-pre-wrap text-sm">{generatedContent.requirements}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-600">Responsibilities</Label>
                    <div className="p-4 bg-white border rounded-lg">
                      <p className="whitespace-pre-wrap text-sm">{generatedContent.responsibilities}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleApply} className="gap-2">
                  <Check className="h-4 w-4" />
                  Apply to Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
