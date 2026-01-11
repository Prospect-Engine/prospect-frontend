"use client";

import React, { useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertCircle, RotateCcw, Maximize2, Lock } from "lucide-react";
import { DailyQuota, QuotaLimit, QuotaErrors } from "@/types/quota";

// Draggable Slider Component
interface DraggableSliderProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

const DraggableSlider: React.FC<DraggableSliderProps> = ({
  value,
  max,
  onChange,
  className = "",
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const percentage = (() => {
    if (max <= 0) return 0;
    const pct = (value / max) * 100;
    return Math.max(0, Math.min(100, pct));
  })();

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const newValue = Math.round((percentage / 100) * max);

      onChange(newValue);
    },
    [max, onChange]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isDragging) {
      updateValue(e.clientX);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = max / 20; // 5% steps
    let newValue = value;

    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        e.preventDefault();
        newValue = Math.max(0, value - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        e.preventDefault();
        newValue = Math.min(max, value + step);
        break;
      case "Home":
        e.preventDefault();
        newValue = 0;
        break;
      case "End":
        e.preventDefault();
        newValue = max;
        break;
      case "PageDown":
        e.preventDefault();
        newValue = Math.max(0, value - step * 4);
        break;
      case "PageUp":
        e.preventDefault();
        newValue = Math.min(max, value + step * 4);
        break;
      default:
        return;
    }

    onChange(Math.round(newValue));
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => {
        updateValue(e.clientX);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, updateValue]);

  return (
    <div
      ref={sliderRef}
      className={`relative w-full h-2 bg-input rounded-full cursor-pointer group transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={`Slider value ${value} of ${max}`}
    >
      <div
        className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-200 ease-out"
        style={{ width: `${percentage}%` }}
      />
      <div
        className={`absolute top-1/2 w-4 h-4 bg-primary rounded-full border-2 border-background shadow-xs transform -translate-y-1/2 transition-all duration-200 ease-out ${
          isDragging
            ? "scale-110 shadow-lg ring-2 ring-ring/50"
            : "group-hover:scale-105 group-hover:shadow-sm group-focus-visible:ring-2 group-focus-visible:ring-ring/50"
        }`}
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
};

// Keys to hide from the quota settings (profile views are implicit in campaign execution)
const HIDDEN_QUOTA_KEYS: (keyof DailyQuota)[] = ["profile_view_limit"];

type QuotaComponentProps = {
  dailyQuota: DailyQuota;
  setDailyQuota: React.Dispatch<React.SetStateAction<DailyQuota>>;
  quotaLimit: QuotaLimit;
  setQuotaLimit?: React.Dispatch<React.SetStateAction<QuotaLimit>>;
  errors: QuotaErrors;
  setErrors: React.Dispatch<React.SetStateAction<QuotaErrors>>;
  disabled?: boolean;
  disabledMessage?: string;
};

const QuotaComponent = ({
  dailyQuota,
  setDailyQuota,
  quotaLimit,
  errors,
  setErrors,
  disabled = false,
  disabledMessage,
}: QuotaComponentProps) => {
  const hasZeroQuotaLimit = !Object.values(quotaLimit).some(
    value => value !== 0
  );

  const resetQuota = () => {
    const preDefinedQuota = { ...quotaLimit };
    for (const key in quotaLimit) {
      preDefinedQuota[key] = Math.floor(quotaLimit[key] / 2);
    }
    setDailyQuota(preDefinedQuota as DailyQuota);
  };

  const setMaxQuota = () => {
    setDailyQuota(quotaLimit as DailyQuota);
  };

  const handleQuotaChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    const value = parseInt(event.target.value) || 0;

    if (isNaN(value) || value > quotaLimit[key]) {
      setErrors((prevErrors: QuotaErrors) => ({
        ...prevErrors,
        [key]: `Value must be in range 0 - ${quotaLimit[key]}`,
      }));
    } else {
      setErrors((prevErrors: QuotaErrors) => ({
        ...prevErrors,
        [key]: "",
      }));
    }

    setDailyQuota((prevQuota: DailyQuota) => ({
      ...prevQuota,
      [key]: value,
    }));
  };

  const handleSliderChange = (key: string, value: number) => {
    const clamped = Math.max(0, Math.min(value, quotaLimit[key] || 0));
    if (value > (quotaLimit[key] || 0)) {
      setErrors((prevErrors: QuotaErrors) => ({
        ...prevErrors,
        [key]: `Value must be in range 0 - ${quotaLimit[key]}`,
      }));
    } else {
      setErrors((prevErrors: QuotaErrors) => ({
        ...prevErrors,
        [key]: "",
      }));
    }

    setDailyQuota((prevQuota: DailyQuota) => ({
      ...prevQuota,
      [key]: clamped,
    }));
  };

  // Filter out hidden quota keys
  const quotaKeys = (Object.keys(dailyQuota) as (keyof DailyQuota)[]).filter(
    key => !HIDDEN_QUOTA_KEYS.includes(key)
  );

  const getQuotaLabel = (key: string) => {
    const labelMap: Record<string, string> = {
      connection_request_limit: "Connection Requests",
      message_limit: "Messages",
      skill_endorse_limit: "Skill Endorsements",
      like_limit: "Likes",
      profile_follow_limit: "Profile Follows",
      inmail_limit: "InMails",
    };
    return (
      labelMap[key] ||
      key
        .replace(/_/g, " ")
        .replace(/^\w/, c => c.toLowerCase())
        .replace(/\b\w/g, c => c.toUpperCase())
    );
  };

  return (
    <Card
      className={`w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-white/20 dark:border-gray-600 shadow-sm ${disabled ? "opacity-60" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Daily Quota Settings
              {disabled && <Lock className="w-4 h-4 text-amber-500" />}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-300">
              {disabled && disabledMessage
                ? disabledMessage
                : "Set daily limits for LinkedIn actions to stay within platform guidelines"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetQuota}
              disabled={disabled}
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={setMaxQuota}
              disabled={disabled}
              className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Maximize2 className="w-4 h-4" />
              Max
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasZeroQuotaLimit && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              No quota limits set. Please configure your quota limits in{" "}
              <Link
                href="/outreach/settings"
                className="text-amber-700 dark:text-amber-300 underline"
              >
                campaign settings
              </Link>{" "}
              to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          {quotaKeys.map(key => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getQuotaLabel(key)}
                </Label>
                <Badge
                  variant="outline"
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
                >
                  Max: {quotaLimit[key] || 0}
                </Badge>
              </div>

              <div
                className={`flex items-center gap-3 ${disabled ? "pointer-events-none" : ""}`}
              >
                <Input
                  type="number"
                  min="0"
                  max={quotaLimit[key] || 0}
                  value={dailyQuota[key]}
                  onChange={e => handleQuotaChange(e, key)}
                  disabled={disabled}
                  className={`w-24 ${errors[key] ? "border-red-300 focus:border-red-500" : ""}`}
                  placeholder="0"
                />
                <div className="flex-1">
                  <DraggableSlider
                    value={dailyQuota[key]}
                    max={quotaLimit[key] || 0}
                    onChange={value => handleSliderChange(key, value)}
                    className={disabled ? "opacity-50 pointer-events-none" : ""}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-right">
                  {quotaLimit[key]
                    ? Math.round((dailyQuota[key] / quotaLimit[key]) * 100)
                    : 0}
                  %
                </span>
              </div>

              {errors[key] && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <Info className="w-4 h-4" />
                  <span>{errors[key]}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total Daily Actions:
            </span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Object.values(dailyQuota).reduce((sum, value) => sum + value, 0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuotaComponent;
