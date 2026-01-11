"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

// Generate time slots in 30-minute increments, plus 23:59
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
    }
  }
  // Add 23:59 as the last option for end-of-day selection
  slots.push("23:59");
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// Format time for display (e.g., "09:00" -> "9:00 AM")
const formatTimeDisplay = (time: string): string => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

// Validate and normalize time input
const normalizeTime = (input: string): string | null => {
  // Remove any non-digit/colon characters
  const cleaned = input.replace(/[^\d:]/g, "");

  // Try to parse HH:MM format
  const match = cleaned.match(/^(\d{1,2}):?(\d{0,2})$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2] || "0", 10);

  // Validate ranges
  if (hours > 23) hours = 23;
  if (minutes > 59) minutes = 59;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

export function TimePicker({
  value,
  onChange,
  className,
  disabled = false,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value || "00:00");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync input value with prop value
  React.useEffect(() => {
    setInputValue(value || "00:00");
  }, [value]);

  // Scroll to selected time when popover opens
  React.useEffect(() => {
    if (open && scrollRef.current && value) {
      const selectedIndex = TIME_SLOTS.indexOf(value);
      if (selectedIndex !== -1) {
        const itemHeight = 32; // h-8 = 32px
        scrollRef.current.scrollTop = Math.max(
          0,
          selectedIndex * itemHeight - 64
        );
      }
    }
  }, [open, value]);

  const handleSelect = (time: string) => {
    onChange(time);
    setInputValue(time);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
  };

  const handleInputBlur = () => {
    const normalized = normalizeTime(inputValue);
    if (normalized) {
      onChange(normalized);
      setInputValue(normalized);
    } else {
      // Reset to previous valid value
      setInputValue(value || "00:00");
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleInputBlur();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        placeholder="00:00"
        className={cn(
          "w-12 h-6 px-1 text-xs text-center font-medium rounded border-0 bg-transparent",
          "text-slate-700 dark:text-slate-300",
          "focus:outline-none focus:ring-1 focus:ring-slate-400 dark:focus:ring-slate-500",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className="h-6 w-6 p-0 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-0" align="end" sideOffset={4}>
          <div className="p-2 border-b border-slate-200 dark:border-slate-700">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Select time
            </div>
          </div>
          <div ref={scrollRef} className="max-h-[200px] overflow-y-auto p-1">
            {TIME_SLOTS.map(time => (
              <button
                key={time}
                onClick={() => handleSelect(time)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-md transition-colors",
                  time === value
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                )}
              >
                <span className="font-medium">{time}</span>
                <span
                  className={cn(
                    "text-[10px]",
                    time === value
                      ? "text-slate-300 dark:text-slate-600"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {formatTimeDisplay(time)}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
