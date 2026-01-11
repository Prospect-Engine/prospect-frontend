"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Loader2, User, Bot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface FeedbackChatProps {
  survey: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    aiInstructions: string | null;
    feedbackType: "NPS" | "CSAT" | "CES" | "CUSTOM";
  };
}

export function FeedbackChat({ survey }: FeedbackChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [collectingEmail, setCollectingEmail] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [showNPSScale, setShowNPSScale] = useState(false);
  const [npsScore, setNpsScore] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting based on feedback type
    const getGreeting = () => {
      switch (survey.feedbackType) {
        case "NPS":
          return `Hi there! Thank you for taking the time to share your feedback about ${survey.name}. First, on a scale of 0-10, how likely are you to recommend us to a friend or colleague?`;
        case "CSAT":
          return `Hi there! We'd love to hear about your experience with ${survey.name}. How satisfied were you with your recent interaction? (1-5, where 5 is very satisfied)`;
        case "CES":
          return `Hi there! Thank you for your time. On a scale of 1-7, how easy was it to get your issue resolved with ${survey.name}?`;
        default:
          return `Hi there! Thank you for taking the time to share your feedback about ${survey.name}. We'd love to hear your thoughts.`;
      }
    };

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: getGreeting(),
        timestamp: new Date(),
      },
    ]);

    if (survey.feedbackType === "NPS") {
      setShowNPSScale(true);
    }
  }, [survey.name, survey.feedbackType]);

  const handleNPSSelect = async (score: number) => {
    setNpsScore(score);
    setShowNPSScale(false);

    // Add user message showing their score
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `${score} out of 10`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Create the feedback response
      const createResponse = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveyId: survey.id,
          feedbackType: survey.feedbackType,
          npsScore: score,
        }),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create feedback response");
      }

      const { response } = await createResponse.json();
      setResponseId(response.id);

      // Get AI follow-up based on score
      const chatResponse = await fetch("/api/feedback/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId: response.id,
          surveyId: survey.id,
          messages: [],
          npsScore: score,
          isFirstMessage: true,
        }),
      });

      if (!chatResponse.ok) {
        throw new Error("Failed to get AI response");
      }

      const { message } = await chatResponse.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: message,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Handle email collection
      if (collectingEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(userMessage)) {
          setEmail(userMessage);
          setCollectingEmail(false);

          // Update response with email
          if (responseId) {
            await fetch("/api/feedback/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                responseId,
                surveyId: survey.id,
                email: userMessage,
                isComplete: true,
              }),
            });
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "Thank you so much for your feedback! We really appreciate you taking the time to share your thoughts with us. Have a great day!",
              timestamp: new Date(),
            },
          ]);
          setIsComplete(true);
          setIsLoading(false);
          return;
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "That doesn't look like a valid email. Could you please provide a valid email address, or say 'skip' to finish without providing one?",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Check if user wants to skip email
      if (collectingEmail && userMessage.toLowerCase() === "skip") {
        setCollectingEmail(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "No problem! Thank you so much for your feedback. We really appreciate you taking the time to share your thoughts with us. Have a great day!",
            timestamp: new Date(),
          },
        ]);
        setIsComplete(true);
        setIsLoading(false);
        return;
      }

      // Regular chat flow
      if (responseId) {
        const response = await fetch("/api/feedback/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            responseId,
            surveyId: survey.id,
            messages: [...messages.filter((m) => m.role !== "system"), userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userMessage,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          },
        ]);

        if (data.isComplete) {
          setCollectingEmail(true);
          setMessages((prev) => [
            ...prev,
            {
              id: `email-request-${Date.now()}`,
              role: "assistant",
              content: "Before you go, would you like to share your email so we can follow up with you? (You can also say 'skip' to finish)",
              timestamp: new Date(),
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "I'm sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfd] dark:bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-black/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#af52de] to-[#5856d6] flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">{survey.name}</span>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                  message.role === "user"
                    ? "bg-[#0071e3]"
                    : "bg-gradient-to-br from-[#af52de] to-[#5856d6]"
                )}
              >
                {message.role === "user" ? (
                  <User className="h-4 w-4 text-white" />
                ) : (
                  <Bot className="h-4 w-4 text-white" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  message.role === "user"
                    ? "bg-[#0071e3] text-white rounded-br-md"
                    : "bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] rounded-bl-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {/* NPS Scale */}
          {showNPSScale && !isLoading && (
            <div className="flex justify-center">
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-4">
                <p className="text-center text-sm text-muted-foreground mb-3">
                  Select your score
                </p>
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleNPSSelect(score)}
                      className={cn(
                        "w-10 h-10 rounded-xl font-medium text-sm transition-all duration-200",
                        score <= 6
                          ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20"
                          : score <= 8
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20"
                          : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20"
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#af52de] to-[#5856d6] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#af52de] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#af52de] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#af52de] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#af52de]/10 text-[#af52de]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Thank you for your feedback!</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      {!isComplete && !showNPSScale && (
        <footer className="border-t border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  collectingEmail
                    ? "Enter your email or type 'skip'..."
                    : "Share your thoughts..."
                }
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-[#af52de] hover:bg-[#9b47c7]"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </footer>
      )}
    </div>
  );
}
