/**
 * NEW CHATFORM
 * ============
 * Create a new AI-powered lead qualification chatform.
 */

import { useState } from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Plus,
  Trash2,
  Loader2,
  GripVertical,
  Globe,
  Calendar,
  ExternalLink,
  Check,
  Sparkles,
} from "lucide-react";
import {
  ChatformApiService,
  CreateChatformDto,
  ChatformType,
  ChatformQuestion,
  QuestionType,
} from "@/services/chatformApi";
import ShowShortMessage from "@/base-component/ShowShortMessage";
import { v4 as uuidv4 } from "uuid";

// Question type options
const questionTypes: { id: QuestionType; label: string; description: string }[] = [
  { id: "text", label: "Text", description: "Short text answer" },
  { id: "email", label: "Email", description: "Email address" },
  { id: "phone", label: "Phone", description: "Phone number" },
  { id: "number", label: "Number", description: "Numeric value" },
  { id: "select", label: "Single Select", description: "Choose one option" },
  { id: "multi_select", label: "Multi Select", description: "Choose multiple" },
  { id: "boolean", label: "Yes/No", description: "Boolean choice" },
  { id: "rating", label: "Rating", description: "1-5 or 1-10 scale" },
  { id: "company", label: "Company", description: "Company name" },
  { id: "job_title", label: "Job Title", description: "Job title/role" },
];

// Chatform type options
const chatformTypes: { id: ChatformType; title: string; description: string; icon: any }[] = [
  {
    id: "website",
    title: "Website Embed",
    description: "Embed on your website to qualify visitors",
    icon: Globe,
  },
  {
    id: "pre_meeting",
    title: "Pre-Meeting",
    description: "Qualify leads before calendar bookings",
    icon: Calendar,
  },
  {
    id: "standalone",
    title: "Standalone Link",
    description: "Share a direct link for qualification",
    icon: ExternalLink,
  },
];

// Default question template
const createDefaultQuestion = (): ChatformQuestion => ({
  id: uuidv4(),
  type: "text",
  question: "",
  required: true,
  aiFollowUp: false,
});

export default function NewChatformPage() {
  const router = useRouter();
  const { type: preselectedType } = router.query;

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<CreateChatformDto>({
    name: "",
    description: "",
    type: (preselectedType as ChatformType) || "website",
    questions: [createDefaultQuestion()],
    branding: {
      primaryColor: "#10b981",
      backgroundColor: "#ffffff",
      welcomeMessage: "Hi! Let's get to know you better.",
      completionMessage: "Thank you! We'll be in touch soon.",
    },
    qualificationThreshold: 50,
    notifyOnSubmission: true,
  });

  // Add question
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [...formData.questions, createDefaultQuestion()],
    });
  };

  // Remove question
  const removeQuestion = (index: number) => {
    if (formData.questions.length <= 1) return;
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  // Update question
  const updateQuestion = (index: number, updates: Partial<ChatformQuestion>) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setFormData({ ...formData, questions: newQuestions });
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      ShowShortMessage("Please enter a chatform name", "error");
      return;
    }

    if (formData.questions.some((q) => !q.question.trim())) {
      ShowShortMessage("Please fill in all question texts", "error");
      return;
    }

    setLoading(true);
    try {
      const { data, status } = await ChatformApiService.createChatform(formData);

      if (status >= 200 && status < 300) {
        ShowShortMessage("Chatform created successfully!", "success");
        router.push("/sales/chatforms");
      }
    } catch (error) {
      ShowShortMessage("Failed to create chatform", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout activePage="Chatforms">
      <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link
                href="/sales/chatforms"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Chatforms
              </Link>
              <h1 className="text-2xl font-bold text-foreground">
                Create Chatform
              </h1>
              <p className="text-muted-foreground mt-1">
                Build an AI-powered form to qualify leads automatically
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-4 mb-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s
                        ? "bg-[#10b981] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.04] text-muted-foreground"
                    }`}
                  >
                    {step > s ? <Check className="h-4 w-4" /> : s}
                  </div>
                  <span className={`text-sm ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                    {s === 1 ? "Basics" : s === 2 ? "Questions" : "Settings"}
                  </span>
                  {s < 3 && <div className="w-12 h-px bg-black/[0.08] dark:bg-white/[0.08]" />}
                </div>
              ))}
            </div>

            {/* Step 1: Basics */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Name */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Chatform Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Lead Qualification Form"
                    className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981]"
                  />
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this chatform..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20 focus:border-[#10b981] resize-none"
                  />
                </div>

                {/* Type Selection */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <label className="block text-sm font-medium text-foreground mb-4">
                    Chatform Type
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {chatformTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                          formData.type === type.id
                            ? "border-[#10b981] bg-[#10b981]/5"
                            : "border-black/[0.08] dark:border-white/[0.08] hover:border-black/[0.16] dark:hover:border-white/[0.16]"
                        }`}
                      >
                        <type.icon
                          className={`h-5 w-5 mb-2 ${
                            formData.type === type.id ? "text-[#10b981]" : "text-muted-foreground"
                          }`}
                        />
                        <p className={`font-medium ${formData.type === type.id ? "text-[#10b981]" : "text-foreground"}`}>
                          {type.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!formData.name.trim()}
                    className="px-6 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
                  >
                    Next: Add Questions
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Questions */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Questions</h2>
                      <p className="text-sm text-muted-foreground">
                        Add questions to qualify your leads
                      </p>
                    </div>
                    <button
                      onClick={addQuestion}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-[#10b981] hover:bg-[#10b981]/10 rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Question
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="p-4 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-3 cursor-grab">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-3">
                            {/* Question Text */}
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => updateQuestion(index, { question: e.target.value })}
                              placeholder="Enter your question..."
                              className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                            />

                            <div className="flex flex-wrap gap-3">
                              {/* Question Type */}
                              <select
                                value={question.type}
                                onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                                className="px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                              >
                                {questionTypes.map((type) => (
                                  <option key={type.id} value={type.id}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>

                              {/* Required Toggle */}
                              <label className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={question.required}
                                  onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                Required
                              </label>

                              {/* AI Follow-up Toggle */}
                              <label className="flex items-center gap-2 text-sm text-[#10b981]">
                                <input
                                  type="checkbox"
                                  checked={question.aiFollowUp}
                                  onChange={(e) => updateQuestion(index, { aiFollowUp: e.target.checked })}
                                  className="rounded border-[#10b981]"
                                />
                                <Sparkles className="h-3 w-3" />
                                AI Follow-up
                              </label>
                            </div>

                            {/* Options for select types */}
                            {(question.type === "select" || question.type === "multi_select") && (
                              <input
                                type="text"
                                value={question.options?.join(", ") || ""}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    options: e.target.value.split(",").map((o) => o.trim()),
                                  })
                                }
                                placeholder="Options (comma separated)"
                                className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#2c2c2e] text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                              />
                            )}
                          </div>

                          <button
                            onClick={() => removeQuestion(index)}
                            disabled={formData.questions.length <= 1}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 border border-black/[0.08] dark:border-white/[0.08] text-foreground rounded-xl font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={formData.questions.some((q) => !q.question.trim())}
                    className="px-6 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors disabled:opacity-50"
                  >
                    Next: Settings
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <div className="space-y-6">
                {/* Branding */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Branding</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Welcome Message
                      </label>
                      <input
                        type="text"
                        value={formData.branding?.welcomeMessage || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branding: { ...formData.branding!, welcomeMessage: e.target.value },
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Completion Message
                      </label>
                      <input
                        type="text"
                        value={formData.branding?.completionMessage || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            branding: { ...formData.branding!, completionMessage: e.target.value },
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.branding?.primaryColor || "#10b981"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              branding: { ...formData.branding!, primaryColor: e.target.value },
                            })
                          }
                          className="w-12 h-12 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.branding?.primaryColor || "#10b981"}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              branding: { ...formData.branding!, primaryColor: e.target.value },
                            })
                          }
                          className="px-3 py-2 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-sm w-28"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualification */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Qualification</h2>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Qualification Threshold (Score)
                    </label>
                    <input
                      type="number"
                      value={formData.qualificationThreshold || 50}
                      onChange={(e) =>
                        setFormData({ ...formData, qualificationThreshold: parseInt(e.target.value) || 0 })
                      }
                      min={0}
                      max={100}
                      className="w-32 px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leads scoring above this threshold will be marked as qualified
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 border border-black/[0.04] dark:border-white/[0.04]">
                  <h2 className="text-lg font-semibold text-foreground mb-4">Notifications</h2>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.notifyOnSubmission}
                        onChange={(e) =>
                          setFormData({ ...formData, notifyOnSubmission: e.target.checked })
                        }
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-foreground">Notify me on new submissions</span>
                    </label>
                    {formData.notifyOnSubmission && (
                      <input
                        type="email"
                        value={formData.notifyEmail || ""}
                        onChange={(e) => setFormData({ ...formData, notifyEmail: e.target.value })}
                        placeholder="Email for notifications"
                        className="w-full px-4 py-3 rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-transparent focus:outline-none focus:ring-2 focus:ring-[#10b981]/20"
                      />
                    )}
                  </div>
                </div>

                {/* Submit */}
                <div className="flex justify-between pt-4">
                  <button
                    onClick={() => setStep(2)}
                    className="px-6 py-3 border border-black/[0.08] dark:border-white/[0.08] text-foreground rounded-xl font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-3 bg-[#10b981] text-white rounded-xl font-medium hover:bg-[#059669] transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Bot className="h-5 w-5" />
                        Create Chatform
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
      </div>
    </AppLayout>
  );
}
