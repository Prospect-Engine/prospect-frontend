"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Target, Send, Loader2, User, Bot, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface LeadQualifyChatProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    aiInstructions: string | null;
  };
}

export function LeadQualifyChat({ project }: LeadQualifyChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [contactInfo, setContactInfo] = useState<{ email: string; name: string } | null>(null);
  const [collectingEmail, setCollectingEmail] = useState(true);
  const [collectingName, setCollectingName] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Hi there! 👋 Welcome to ${project.name}. I'm here to learn about your needs and see how we can help.\n\nFirst, could you please share your email address so we can follow up with you?`,
        timestamp: new Date(),
      },
    ]);
  }, [project.name]);

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
          setContactInfo({ email: userMessage, name: "" });
          setCollectingEmail(false);
          setCollectingName(true);

          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "Great! And what's your name?",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "That doesn't look like a valid email address. Could you please provide a valid email?",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Handle name collection
      if (collectingName && contactInfo) {
        const name = userMessage;
        const email = contactInfo.email;
        setContactInfo({ email, name });
        setCollectingName(false);

        // Create the lead
        const createResponse = await fetch("/api/qualify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: project.id,
            email,
            name,
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create lead");
        }

        const { lead, sessionId: newSessionId } = await createResponse.json();
        setLeadId(lead.id);
        setSessionId(newSessionId);

        // Start the qualification conversation
        const chatResponse = await fetch("/api/qualify/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId: lead.id,
            sessionId: newSessionId,
            projectId: project.id,
            messages: [],
            isFirstMessage: true,
          }),
        });

        if (!chatResponse.ok) {
          throw new Error("Failed to start conversation");
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
        setIsLoading(false);
        return;
      }

      // Regular chat flow
      if (leadId && sessionId) {
        const response = await fetch("/api/qualify/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            leadId,
            sessionId,
            projectId: project.id,
            messages: [...messages.filter(m => m.role !== "system"), userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userMessage: userMessage,
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
          setIsComplete(true);
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
            <Target className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">{project.name}</span>
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
                    : "bg-gradient-to-br from-[#34c759] to-[#30d158]"
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#34c759] to-[#30d158] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#34c759] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#34c759] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#34c759] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#34c759]/10 text-[#34c759]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Conversation complete</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input */}
      {!isComplete && (
        <footer className="border-t border-black/[0.04] dark:border-white/[0.06] bg-white/80 dark:bg-black/80 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex gap-3">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  collectingEmail
                    ? "Enter your email address..."
                    : collectingName
                    ? "Enter your name..."
                    : "Type your message..."
                }
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-[#34c759] hover:bg-[#30d158]"
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
