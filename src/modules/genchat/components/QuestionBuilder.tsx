"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Save,
} from "lucide-react";
import { AIQuestionsPreviewDialog } from "./AIQuestionsPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { questionSchema, type QuestionInput } from "@/lib/validators";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  category: string;
  options?: string[];
  isRequired: boolean;
  minLength?: number | null;
  maxLength?: number | null;
  weight: number;
  evaluationCriteria?: string | null;
  order: number;
}

interface QuestionBuilderProps {
  jobId: string;
  initialQuestions: Question[];
}

const questionTypes = [
  { value: "TEXT", label: "Short Text" },
  { value: "TEXTAREA", label: "Long Text" },
  { value: "SELECT", label: "Single Select" },
  { value: "MULTISELECT", label: "Multiple Select" },
  { value: "NUMBER", label: "Number" },
  { value: "FILE", label: "File Upload" },
  { value: "DATE", label: "Date" },
  { value: "BOOLEAN", label: "Yes/No" },
];

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

export function QuestionBuilder({ jobId, initialQuestions }: QuestionBuilderProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<QuestionInput>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: "",
      questionType: "TEXT",
      category: "GENERAL",
      isRequired: true,
      weight: 10,
      order: questions.length,
    },
  });

  async function onSubmit(data: QuestionInput) {
    setIsLoading(true);
    try {
      const url = editingQuestion
        ? `/api/admin/questions/${editingQuestion.id}`
        : `/api/admin/jobs/${jobId}/questions`;
      const method = editingQuestion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, order: editingQuestion?.order ?? questions.length }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save question");
      }

      if (editingQuestion) {
        setQuestions(questions.map((q) => (q.id === editingQuestion.id ? result.data : q)));
      } else {
        setQuestions([...questions, result.data]);
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      form.reset();
      router.refresh();
    } catch (error) {
      console.error("Error saving question:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(questionId: string) {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete question");
      }

      setQuestions(questions.filter((q) => q.id !== questionId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  }

  function handleEdit(question: Question) {
    setEditingQuestion(question);
    form.reset({
      questionText: question.questionText,
      questionType: question.questionType as QuestionInput["questionType"],
      category: question.category as QuestionInput["category"],
      options: question.options,
      isRequired: question.isRequired,
      minLength: question.minLength ?? undefined,
      maxLength: question.maxLength ?? undefined,
      weight: question.weight,
      evaluationCriteria: question.evaluationCriteria ?? undefined,
      order: question.order,
    });
    setIsDialogOpen(true);
  }

  const handleQuestionsCreated = (newQuestions: Question[]) => {
    setQuestions([...questions, ...newQuestions]);
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Interview Questions</h2>
          <p className="text-slate-600">
            {questions.length} question{questions.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <div className="flex gap-2">
          <AIQuestionsPreviewDialog
            jobId={jobId}
            onQuestionsCreated={handleQuestionsCreated}
          />
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingQuestion(null);
              form.reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? "Edit Question" : "Add New Question"}
                </DialogTitle>
                <DialogDescription>
                  Configure the interview question settings
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your question..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {questionTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {questionCategories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  {cat.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (1-100)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Length</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="evaluationCriteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Evaluation Criteria</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What should the AI look for when evaluating responses?"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Required</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      {editingQuestion ? "Update" : "Add"} Question
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">No questions added yet</p>
            <div className="flex justify-center gap-2">
              <AIQuestionsPreviewDialog
                jobId={jobId}
                onQuestionsCreated={handleQuestionsCreated}
              />
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manually
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GripVertical className="h-5 w-5 cursor-move" />
                    <span className="font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{question.questionText}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{question.questionType}</Badge>
                      <Badge variant="outline">{question.category}</Badge>
                      {question.isRequired && (
                        <Badge variant="destructive">Required</Badge>
                      )}
                      <span className="text-sm text-slate-500">
                        Weight: {question.weight}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(question)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
