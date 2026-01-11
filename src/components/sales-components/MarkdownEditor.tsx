import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit3, Eye } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your markdown here...",
  className = "",
  readOnly = false,
}) => {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div
      className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex justify-between items-center p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setMode("edit");
            }}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === "edit"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={e => {
              e.preventDefault();
              e.stopPropagation();
              setMode("preview");
            }}
            className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              mode === "preview"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[200px]">
        {mode === "edit" ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={readOnly}
            className="w-full h-full min-h-[200px] p-4 resize-none border-none focus:outline-none focus:ring-0 text-sm font-mono"
          />
        ) : (
          <div className="p-4 prose prose-sm max-w-none markdown-content">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-gray-500 italic">No content to preview</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
