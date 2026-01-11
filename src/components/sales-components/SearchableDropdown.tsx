"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface SearchableDropdownProps<T> {
  items: T[];
  selectedItem: T | null;
  onSelect: (item: T) => void;
  onClear?: () => void;
  placeholder: string;
  searchPlaceholder?: string;
  getDisplayValue: (item: T) => string;
  getSearchValue?: (item: T) => string;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  allowNullSelection?: boolean;
}

function SearchableDropdown<T>({
  items,
  selectedItem,
  onSelect,
  onClear,
  placeholder,
  searchPlaceholder = "Search...",
  getDisplayValue,
  getSearchValue = getDisplayValue,
  disabled = false,
  className = "",
  maxHeight = "max-h-60",
  allowNullSelection = false,
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    getSearchValue(item).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium border-2 border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen
            ? "border-blue-300 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
            : ""
        }`}
      >
        <span className="text-gray-600 dark:text-gray-300">
          {selectedItem ? getDisplayValue(selectedItem) : placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {selectedItem && onClear && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3 h-3 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 left-0 top-full z-50 mt-1 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 shadow-lg"
          style={{
            animation: "dropdownSlideIn 0.2s ease-out forwards",
            transformOrigin: "top",
            opacity: 0,
            transform: "translateY(-10px) scale(0.95)",
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 w-2.5 h-2.5 text-gray-400 dark:text-gray-500 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="py-1 pr-2 pl-6 w-full text-xs font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-500 focus:border-blue-300 dark:focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Items List */}
          <div className={`overflow-y-auto ${maxHeight}`}>
            {filteredItems.length === 0 ? (
              <div className="px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                {searchTerm ? "No items found" : "No items available"}
              </div>
            ) : (
              filteredItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(item)}
                  className="w-full px-3 py-1.5 text-xs text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none transition-colors duration-150"
                  style={{
                    animation: `dropdownItemSlideIn 0.15s ease-out ${index * 0.02}s forwards`,
                    opacity: 0,
                    transform: "translateY(-5px)",
                  }}
                >
                  {getDisplayValue(item)}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableDropdown;
