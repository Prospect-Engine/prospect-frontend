"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertTriangle, Clock } from "lucide-react";

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "in_progress"
    | "completed"
    | "error"
    | "waiting_for_user_input";
  progress: number;
  message?: string;
  estimatedTime?: string;
}

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  currentStep?: string;
  className?: string;
}

export function ProgressIndicator({
  steps,
  currentStep,
  className,
}: ProgressIndicatorProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case "waiting_for_user_input":
        return <Clock className="w-5 h-5 text-amber-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStepStatusColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "border-green-200 bg-green-50";
      case "in_progress":
        return "border-blue-200 bg-blue-50";
      case "error":
        return "border-gray-200 bg-gray-50";
      case "waiting_for_user_input":
        return "border-gray-200 bg-gray-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const getTextColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "text-green-700";
      case "in_progress":
        return "text-blue-700";
      case "error":
        return "text-gray-700";
      case "waiting_for_user_input":
        return "text-amber-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300",
            getStepStatusColor(step),
            currentStep === step.id &&
              "ring-2 ring-blue-600 ring-opacity-50 dark:ring-blue-400"
          )}
        >
          <div className="flex-shrink-0 mt-0.5">{getStepIcon(step)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className={cn("text-sm font-semibold", getTextColor(step))}>
                {step.title}
              </h4>
              <div className="flex items-center space-x-2">
                {step.estimatedTime && step.status !== "completed" && (
                  <span className="text-xs text-muted-foreground">
                    {step.estimatedTime}
                  </span>
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {step.progress}%
                </span>
              </div>
            </div>

            <p className={cn("text-sm mb-2", getTextColor(step))}>
              {step.description}
            </p>

            {step.message && (
              <p
                className={cn(
                  "text-xs mb-3",
                  step.status === "error"
                    ? "text-destructive font-medium"
                    : "text-muted-foreground"
                )}
              >
                {step.message}
              </p>
            )}

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-500 ease-out",
                  step.status === "completed" && "bg-emerald-600",
                  step.status === "in_progress" && "bg-blue-600",
                  step.status === "error" && "bg-destructive",
                  step.status === "waiting_for_user_input" && "bg-amber-600",
                  step.status === "pending" && "bg-muted-foreground/30"
                )}
                style={{ width: `${step.progress}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
