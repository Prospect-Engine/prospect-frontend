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

interface ResearchChatProps {
  studyId: string;
  studyName: string;
  studySlug: string;
  studyType: string;
  aiInstructions?: string;
}

export function ResearchChat({
  studyId,
  studyName,
  studySlug,
  studyType,
  aiInstructions,
}: ResearchChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [collectingEmail, setCollectingEmail] = useState(false);
  const [participantName, setParticipantName] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initial greeting based on study type
    const getGreeting = () => {
      switch (studyType) {
        case "DISCOVERY":
          return `Hi there! Thank you for participating in our research study "${studyName}". I'm here to have a conversation with you to understand your experiences and perspectives. Before we begin, could you please tell me your first name?`;
        case "USABILITY":
          return `Hello! Thank you for helping us improve our product through this usability study. I'll be asking you about your experience and any challenges you've encountered. First, may I know your name?`;
        case "CONCEPT_TEST":
          return `Hi! Thanks for joining us to test some new concepts we're exploring. Your honest feedback will help us make better decisions. What's your first name?`;
        case "CARD_SORT":
          return `Welcome! Thank you for participating in this study to help us understand how you organize information. Before we start, could you tell me your name?`;
        case "SURVEY":
          return `Hi there! Thank you for taking the time to answer our research questions. Your input is valuable to us. What's your first name?`;
        case "DIARY":
          return `Welcome to our diary study! I'll be checking in with you periodically to understand your experiences over time. Let's start with your name - what should I call you?`;
        default:
          return `Hi there! Thank you for participating in our research study "${studyName}". I'm excited to hear your thoughts. First, could you tell me your name?`;
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
  }, [studyName, studyType]);

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
      // Handle email collection at the end
      if (collectingEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(userMessage) || userMessage.toLowerCase() === "skip") {
          const email = userMessage.toLowerCase() === "skip" ? null : userMessage;

          if (sessionId) {
            await fetch("/api/research/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                studyId,
                email,
                isComplete: true,
              }),
            });
          }

          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: "Thank you so much for your time and insights! Your feedback is incredibly valuable to our research. Have a wonderful day!",
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
              content: "That doesn't look like a valid email. Please enter a valid email address, or type 'skip' to finish without providing one.",
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
          return;
        }
      }

      // Check if this is the first user response (name collection)
      if (!sessionId && !participantName) {
        // This is the participant's name
        setParticipantName(userMessage);

        // Create the research session
        const createResponse = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studyId,
            participantName: userMessage,
          }),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create research session");
        }

        const { session } = await createResponse.json();
        setSessionId(session.id);

        // Get the first research question
        const chatResponse = await fetch("/api/research/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            studyId,
            messages: [],
            participantName: userMessage,
            isFirstMessage: true,
            studyType,
            aiInstructions,
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
        setIsLoading(false);
        return;
      }

      // Regular research conversation
      if (sessionId) {
        const response = await fetch("/api/research/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            studyId,
            messages: [...messages.filter((m) => m.role !== "system"), userMsg].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            userMessage,
            studyType,
            aiInstructions,
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

        // Check if we should wrap up the interview
        if (data.isComplete) {
          setCollectingEmail(true);
          setTimeout(() => {
            setMessages((prev) => [
              ...prev,
              {
                id: `email-request-${Date.now()}`,
                role: "assistant",
                content:
                  "Thank you for sharing all of that! Before we wrap up, would you like to leave your email address in case we have any follow-up questions? (You can also type 'skip' to finish)",
                timestamp: new Date(),
              },
            ]);
          }, 1000);
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff9500] to-[#ff6b00] flex items-center justify-center">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm">{studyName}</span>
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
                    : "bg-gradient-to-br from-[#ff9500] to-[#ff6b00]"
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
                    ? "bg-[#ff9500] text-white rounded-br-md"
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
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#ff9500] to-[#ff6b00] flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-[#ff9500] animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-[#ff9500] animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-[#ff9500] animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff9500]/10 text-[#ff9500]">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Interview Complete</span>
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
                    ? "Enter your email or type 'skip'..."
                    : participantName
                    ? "Share your thoughts..."
                    : "Enter your name..."
                }
                disabled={isLoading}
                className="flex-1 h-12 rounded-xl"
                autoFocus
              />
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="h-12 w-12 rounded-xl bg-[#ff9500] hover:bg-[#e68600]"
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
