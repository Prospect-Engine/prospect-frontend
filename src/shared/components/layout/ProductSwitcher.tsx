/**
 * PRODUCT SWITCHER COMPONENT
 * ==========================
 * Allows users to switch between Geniefy products.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Send,
  MessageSquare,
  DollarSign,
  Users,
  CheckSquare,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/theme";
import { modulesList, type ModuleId } from "@/modules";

// Icon mapping
const iconMap = {
  Send,
  MessageSquare,
  DollarSign,
  Users,
  CheckSquare,
};

interface ProductSwitcherProps {
  currentProduct?: ModuleId;
  collapsed?: boolean;
}

export function ProductSwitcher({ currentProduct, collapsed = false }: ProductSwitcherProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModule = modulesList.find((m) => m.id === currentProduct) || modulesList[0];
  const CurrentIcon = iconMap[currentModule.icon as keyof typeof iconMap] || Send;

  if (collapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl",
            "transition-all duration-200",
            "hover:bg-accent"
          )}
          style={{ backgroundColor: `${currentModule.color}15` }}
        >
          <CurrentIcon
            className="h-5 w-5"
            style={{ color: currentModule.color }}
          />
        </button>

        {isOpen && (
          <div className="absolute left-full top-0 ml-2 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg animate-scale-in z-50">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Switch Product
            </div>
            {modulesList.map((module) => {
              const Icon = iconMap[module.icon as keyof typeof iconMap] || Send;
              const isActive = module.id === currentProduct;
              return (
                <Link
                  key={module.id}
                  href={module.path}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 rounded-lg",
                    "transition-all duration-200",
                    isActive
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  )}
                >
                  <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ backgroundColor: `${module.color}15` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: module.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{module.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {module.description}
                    </div>
                  </div>
                  {isActive && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl",
          "transition-all duration-200",
          "hover:bg-accent"
        )}
      >
        <div
          className="flex items-center justify-center w-9 h-9 rounded-xl"
          style={{ backgroundColor: `${currentModule.color}15` }}
        >
          <CurrentIcon
            className="h-5 w-5"
            style={{ color: currentModule.color }}
          />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold">{currentModule.name}</div>
          <div className="text-xs text-muted-foreground">
            {currentModule.description}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-border bg-popover p-2 shadow-lg animate-scale-in z-50">
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            Switch Product
          </div>
          {modulesList.map((module) => {
            const Icon = iconMap[module.icon as keyof typeof iconMap] || Send;
            const isActive = module.id === currentProduct;
            return (
              <Link
                key={module.id}
                href={module.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-2 py-2 rounded-lg",
                  "transition-all duration-200",
                  isActive
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
              >
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-xl"
                  style={{ backgroundColor: `${module.color}15` }}
                >
                  <Icon className="h-5 w-5" style={{ color: module.color }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{module.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {module.description}
                  </div>
                </div>
                {isActive && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductSwitcher;
