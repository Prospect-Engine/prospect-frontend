"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  editLabel?: string;
  icon?: string;
}

interface HorizontalStepperProps {
  steps: Step[];
  activeStep: number;
  completedSteps: Set<number>;
  onStepClick?: (stepNumber: number) => void;
}

export default function HorizontalStepper({
  steps,
  activeStep,
  completedSteps,
  onStepClick,
}: HorizontalStepperProps) {
  return (
    <div className="w-full">
      {/* Desktop stepper */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.has(stepNumber) || stepNumber < activeStep;
          const isCurrent = stepNumber === activeStep;
          const isClickable = isCompleted || isCurrent || stepNumber < activeStep;

          return (
            <React.Fragment key={stepNumber}>
              <div
                onClick={() => isClickable && onStepClick?.(stepNumber)}
                className={cn(
                  "flex flex-col items-center gap-2 group",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed"
                )}
              >
                {/* Step circle */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                    "transition-all duration-300 ease-out",
                    isCompleted
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : isCurrent
                        ? "bg-black text-white ring-4 ring-black/10 dark:bg-white dark:text-black dark:ring-white/20"
                        : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
                    isClickable && !isCurrent && "group-hover:scale-110"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step label */}
                <span
                  className={cn(
                    "text-xs font-medium transition-colors duration-200",
                    isCurrent
                      ? "text-gray-900 dark:text-white"
                      : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "w-16 lg:w-24 h-0.5 mx-2 transition-colors duration-300",
                    stepNumber < activeStep || completedSteps.has(stepNumber)
                      ? "bg-emerald-500"
                      : "bg-gray-200 dark:bg-gray-700"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile stepper - simplified */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between px-4">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {steps[activeStep - 1]?.label}
          </span>
          <div className="flex items-center gap-1">
            {steps.map((_, index) => {
              const stepNumber = index + 1;
              const isCompleted = completedSteps.has(stepNumber) || stepNumber < activeStep;
              const isCurrent = stepNumber === activeStep;

              return (
                <div
                  key={stepNumber}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    isCompleted
                      ? "bg-emerald-500"
                      : isCurrent
                        ? "bg-black dark:bg-white w-4"
                        : "bg-gray-300 dark:bg-gray-600"
                  )}
                />
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-black dark:bg-white transition-all duration-500 ease-out"
            style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
