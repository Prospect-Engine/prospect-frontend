import React, { useEffect, useRef } from "react";
import { Search, User, Building, Tag, Star, MapPin, Mail } from "lucide-react";

interface SearchSuggestion {
  id: string;
  type:
    | "name"
    | "email"
    | "company"
    | "tag"
    | "status"
    | "owner"
    | "industry"
    | "source"
    | "jobTitle";
  value: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SearchSuggestionsProps {
  searchTerm: string;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
  suggestions: SearchSuggestion[];
  isOpen: boolean;
  entityType: "leads" | "companies" | "deals" | "tasks";
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  searchTerm,
  onSuggestionSelect,
  onClose,
  suggestions,
  isOpen,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !searchTerm.trim()) {
    return null;
  }

  const getIconForType = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "name":
        return <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "email":
        return <Mail className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case "company":
        return (
          <Building className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        );
      case "tag":
        return <Tag className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case "status":
        return (
          <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        );
      case "owner":
        return (
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        );
      case "industry":
        return (
          <Building className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        );
      case "source":
        return <MapPin className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "jobTitle":
        return <User className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getTypeLabel = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "name":
        return "Name";
      case "email":
        return "Email";
      case "company":
        return "Company";
      case "tag":
        return "Tag";
      case "status":
        return "Status";
      case "owner":
        return "Owner";
      case "industry":
        return "Industry";
      case "source":
        return "Source";
      case "jobTitle":
        return "Job Title";
      default:
        return "Other";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="overflow-y-auto absolute right-0 left-0 top-full z-50 mt-1 max-h-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg min-w-[400px] max-w-[600px] backdrop-blur-xl"
    >
      {suggestions.length > 0 ? (
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.value}-${index}`}
              onClick={() => onSuggestionSelect(suggestion)}
              className="flex items-start px-3 py-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors"
            >
              <div className="flex flex-1 items-start min-w-0">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconForType(suggestion.type)}
                </div>
                <div className="flex-1 ml-3 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white break-words">
                    {suggestion.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {getTypeLabel(suggestion.type)}
                    {suggestion.count && ` (${suggestion.count})`}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">
          No suggestions found for &quot;{searchTerm}&quot;
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
