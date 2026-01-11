'use client';

import { useState } from 'react';
import { Loader2, Sparkles, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface PreviewQuestion {
  id: string;
  questionText: string;
  category: string;
  weight: number;
  questionType: string;
  isRequired: boolean;
  order: number;
  options?: string[];
  minLength?: number | null;
  maxLength?: number | null;
  evaluationCriteria?: string | null;
}

interface AIQuestionsPreviewDialogProps {
  jobId: string;
  onQuestionsCreated: (questions: PreviewQuestion[]) => void;
  disabled?: boolean;
}

const questionCategories = [
  { value: "PERSONAL", label: "Personal" },
  { value: "EXPERIENCE", label: "Experience" },
  { value: "SKILLS", label: "Skills" },
  { value: "BEHAVIORAL", label: "Behavioral" },
  { value: "MOTIVATION", label: "Motivation" },
  { value: "SITUATIONAL", label: "Situational" },
  { value: "TECHNICAL", label: "Technical" },
  { value: "LOGISTICS", label: "Logistics" },
  { value: "GENERAL", label: "General" },
];

export function AIQuestionsPreviewDialog({ jobId, onQuestionsCreated, disabled }: AIQuestionsPreviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [count, setCount] = useState(10);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [previewQuestions, setPreviewQuestions] = useState<PreviewQuestion[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedQuestions, setEditedQuestions] = useState<Map<string, PreviewQuestion>>(new Map());

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-questions-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, count, categories: selectedCategories }),
      });

      const data = await response.json();

      if (data.success) {
        setPreviewQuestions(data.data);
        // Select all by default
        setSelectedIds(new Set(data.data.map((q: PreviewQuestion) => q.id)));
        setEditedQuestions(new Map());
        toast.success(`Generated ${data.data.length} questions`);
      } else {
        toast.error(data.error || 'Failed to generate questions');
      }
    } catch {
      toast.error('Failed to generate questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSelected = async () => {
    const selectedQuestions = previewQuestions
      .filter(q => selectedIds.has(q.id))
      .map(q => {
        const edited = editedQuestions.get(q.id);
        return edited || q;
      });

    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question');
      return;
    }

    setIsCreating(true);
    try {
      // Create questions one by one
      const createdQuestions: PreviewQuestion[] = [];

      for (let i = 0; i < selectedQuestions.length; i++) {
        const q = selectedQuestions[i];
        const response = await fetch(`/api/admin/jobs/${jobId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionText: q.questionText,
            questionType: q.questionType,
            category: q.category,
            weight: q.weight,
            isRequired: q.isRequired,
            order: i,
          }),
        });

        const result = await response.json();
        if (response.ok) {
          createdQuestions.push(result.data);
        }
      }

      if (createdQuestions.length > 0) {
        onQuestionsCreated(createdQuestions);
        toast.success(`Created ${createdQuestions.length} questions`);
        setOpen(false);
        setPreviewQuestions([]);
        setSelectedIds(new Set());
      }
    } catch {
      toast.error('Failed to create questions');
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(previewQuestions.map(q => q.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const updateQuestion = (id: string, updates: Partial<PreviewQuestion>) => {
    const original = previewQuestions.find(q => q.id === id);
    if (original) {
      const current = editedQuestions.get(id) || original;
      const updated = { ...current, ...updates };
      setEditedQuestions(new Map(editedQuestions.set(id, updated)));
    }
  };

  const removeFromPreview = (id: string) => {
    setPreviewQuestions(prev => prev.filter(q => q.id !== id));
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    editedQuestions.delete(id);
    setEditedQuestions(new Map(editedQuestions));
  };

  const getQuestion = (q: PreviewQuestion) => editedQuestions.get(q.id) || q;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          {disabled ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Question Generator
          </DialogTitle>
          <DialogDescription>
            Generate interview questions using AI. Preview, edit, and select which ones to add.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Configuration Section */}
          <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label className="text-sm mb-2 block">Number of questions: {count}</Label>
                <Slider
                  value={[count]}
                  onValueChange={([val]) => setCount(val)}
                  min={5}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="shrink-0"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate
                  </>
                )}
              </Button>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Focus on categories (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {questionCategories.map(cat => (
                  <Badge
                    key={cat.value}
                    variant={selectedCategories.includes(cat.value) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(cat.value)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {previewQuestions.length > 0 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {selectedIds.size} of {previewQuestions.length} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-lg">
                <div className="space-y-2 p-4">
                  {previewQuestions.map((question, index) => {
                    const q = getQuestion(question);
                    const isSelected = selectedIds.has(question.id);

                    return (
                      <div
                        key={question.id}
                        className={`p-4 rounded-lg border transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(question.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-500">
                                Q{index + 1}
                              </span>
                              <Select
                                value={q.category}
                                onValueChange={(val) => updateQuestion(question.id, { category: val })}
                              >
                                <SelectTrigger className="w-[140px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {questionCategories.map(cat => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={q.weight}
                                onChange={(e) => updateQuestion(question.id, { weight: parseInt(e.target.value) || 10 })}
                                className="w-20 h-8"
                                min={1}
                                max={100}
                                placeholder="Weight"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromPreview(question.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <Textarea
                              value={q.questionText}
                              onChange={(e) => updateQuestion(question.id, { questionText: e.target.value })}
                              className="min-h-[60px] resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Actions */}
          {previewQuestions.length > 0 && (
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSelected}
                disabled={isCreating || selectedIds.size === 0}
                className="gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create {selectedIds.size} Question{selectedIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
