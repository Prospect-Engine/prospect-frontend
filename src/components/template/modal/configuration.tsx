import React, { useState, useRef, useEffect } from "react";
import { NodeData } from "@/types/template";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { messageVariables, commandsHaveTitle } from "@/lib/template/options";
import {
  Upload,
  X,
  File,
  Image,
  FileText,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type ConfigureComponentProps = {
  initialData: { value: NodeData | null; command: string };
  submit: (value: NodeData) => void;
};

const MAX_FILES = 5;
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  // Images
  "image/gif",
  "image/heif",
  "image/heic",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  // Documents
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.text",
  "application/pdf",
  "application/rtf",
  "text/plain",
  "application/x-iwork-pages-sffpages",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/x-iwork-numbers-sffnumbers",
  "text/csv",
  "application/xml",
  // Presentations
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow",
  "application/vnd.oasis.opendocument.presentation",
  "application/x-iwork-keynote-sffkey",
  // Media
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
  "video/x-matroska",
  "video/x-ms-wmv",
  "video/vc1",
  "video/mpeg",
  // Audio
  "audio/aac",
  "audio/mpeg",
  "audio/mp3",
  "audio/adpcm",
  "audio/alac",
  "audio/amr-nb",
  "audio/flac",
  "audio/wav",
  "audio/x-ms-wma",
  "audio/opus",
  "audio/pcm",
  "audio/vorbis",
  "audio/ogg",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

export default function ConfigureComponent({
  initialData,
  submit,
}: ConfigureComponentProps) {
  const [message, setMessage] = useState(initialData.value?.message || "");
  const [alternativeMessage, setAlternativeMessage] = useState(
    initialData.value?.alternativeMessage || ""
  );
  const [subject, setSubject] = useState(initialData.value?.subject || "");
  const [alternativeSubject, setAlternativeSubject] = useState(
    initialData.value?.alternativeSubject || ""
  );
  const [activeField, setActiveField] = useState<string>("message");
  const [attachments, setAttachments] = useState<any[]>(
    initialData.value?.attachments || []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isPremiumIntegration, setIsPremiumIntegration] =
    useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const subjectTextAreaRef = useRef<HTMLTextAreaElement>(null);

  // Check premium integration for INVITE nodes
  useEffect(() => {
    const checkPremiumIntegration = async () => {
      if (initialData.command === "INVITE") {
        try {
          const access_token = document.cookie
            .split("; ")
            .find(row => row.startsWith("access_token="))
            ?.split("=")[1];

          if (access_token) {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/campaigns/check-premium-integration`,
              {
                headers: {
                  Authorization: `Bearer ${access_token}`,
                },
              }
            );
            if (response.ok) {
              const data = await response.json();
              setIsPremiumIntegration(data);
            }
          }
        } catch (error) {
          setIsPremiumIntegration(false);
        }
      }
    };

    checkPremiumIntegration();
  }, [initialData.command]);

  const maxLength =
    initialData.command === "INVITE"
      ? isPremiumIntegration
        ? 250
        : 200
      : initialData.command === "INEMAIL"
        ? 1800
        : 5000;

  const isValidFileType = (file: File): boolean => {
    return (
      ALLOWED_FILE_TYPES.includes(file.type.toLowerCase()) ||
      ALLOWED_FILE_TYPES.some(type =>
        file.name.toLowerCase().endsWith(`.${type.split("/")[1]}`)
      )
    );
  };

  const validateFiles = (files: File[]) => {
    const errors: string[] = [];
    const valid: File[] = [];
    let totalSize = attachments.reduce(
      (sum, att) => sum + (att.file?.size || 0),
      0
    );

    if (files.length + attachments.length > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} files allowed`);
      return { valid, errors };
    }

    for (const file of files) {
      if (!isValidFileType(file)) {
        errors.push(`${file.name} has an unsupported file type`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 1MB limit`);
        continue;
      }

      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        errors.push("Total size exceeds 50MB limit");
        break;
      }

      totalSize += file.size;
      valid.push(file);
    }
    return { valid, errors };
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const { valid, errors } = validateFiles(Array.from(files));

    if (errors.length) {
      setErrors(errors);
      return;
    }

    setIsUploading(true);
    setErrors([]);

    const processedFiles = await Promise.all(
      valid.map(async file => {
        const path = URL.createObjectURL(file);
        const data = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          file,
          type: file.type,
          name: file.name,
          path,
          data,
        };
      })
    );

    setAttachments(prev => [...prev, ...processedFiles]);
    setIsUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = prev.filter((_, i) => i !== index);
      // Only revoke URL if it's not an existing attachment (doesn't have url property)
      if (!prev[index].url) {
        URL.revokeObjectURL(prev[index].path);
      }
      return newAttachments;
    });
  };

  // Enhanced snippet validation
  function isInvalidSnippet(text: string, isAlternative = false): boolean {
    if (!text) {
      return false;
    }

    // For alternative message, any snippet-like pattern is invalid
    if (isAlternative) {
      // Check for any snippet patterns - both complete and incomplete
      const snippetPattern = /{{[^}]*}?}?/g;
      const hasSnippets = snippetPattern.test(text);

      // Also check for any standalone braces
      const hasSingleBraces = text.includes("{") || text.includes("}");

      return hasSnippets || hasSingleBraces;
    }

    // For main message validation
    // Count complete and incomplete snippet patterns
    const openCount = (text.match(/{{/g) || []).length;
    const closeCount = (text.match(/}}/g) || []).length;

    // Check for unmatched pairs
    if (openCount !== closeCount) {
      return true;
    }

    // Check for single braces and malformed snippets
    if (text.includes("{") || text.includes("}")) {
      const validSnippetPattern = /{{[^{}]*}}/g;
      const textWithoutValidSnippets = text.replace(validSnippetPattern, "");

      if (
        textWithoutValidSnippets.includes("{") ||
        textWithoutValidSnippets.includes("}")
      ) {
        return true;
      }
    }

    // Validate complete snippet content
    if (text.includes("{{") || text.includes("}}")) {
      const regex = /{{[\s\w]*}}/g;
      const foundPlaceholders = text.match(regex);
      if (!foundPlaceholders) return false;
      return foundPlaceholders.some(
        placeholder =>
          !messageVariables.map(p => p.value).includes(placeholder.trim())
      );
    }

    return false;
  }

  const disableSaveButton = !commandsHaveTitle.includes(
    initialData.command as any
  )
    ? !message?.trim().length ||
      !alternativeMessage?.trim().length ||
      isInvalidSnippet(message, false) ||
      isInvalidSnippet(alternativeMessage, true)
    : !subject?.trim().length ||
      !message?.trim().length ||
      !alternativeMessage?.trim().length ||
      isInvalidSnippet(message, false) ||
      isInvalidSnippet(alternativeMessage, true);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4" />;
    if (type.startsWith("text/")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleSubmit = () => {
    // Validate required fields based on command type
    if (initialData.command === "MESSAGE" || initialData.command === "INVITE") {
      if (!message.trim()) {
        toast.error("Please enter a message");
        return;
      }
      if (!alternativeMessage.trim()) {
        toast.error("Please enter an alternative message");
        return;
      }
    }

    if (initialData.command === "INEMAIL") {
      if (!subject.trim()) {
        toast.error("Please enter a subject");
        return;
      }
      if (!message.trim()) {
        toast.error("Please enter a message");
        return;
      }
      if (!alternativeSubject.trim()) {
        toast.error("Please enter an alternative subject");
        return;
      }
      if (!alternativeMessage.trim()) {
        toast.error("Please enter an alternative message");
        return;
      }
    }

    const value: NodeData = {
      label: initialData.value?.label || "",
      message,
      alternativeMessage,
      subject,
      alternativeSubject,
      attachments,
    };
    submit(value);
  };

  const insertVariable = (variable: string) => {
    const insertAtCursor = (
      currentValue: string,
      setter: (value: string) => void,
      textAreaRef: React.RefObject<HTMLTextAreaElement | null>
    ) => {
      const textarea = textAreaRef.current;
      if (!textarea) {
        setter(currentValue + variable);
        return;
      }

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      const newText = before + variable + after;
      setter(newText);

      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd =
          start + variable.length;
      }, 0);
    };

    switch (activeField) {
      case "message":
        insertAtCursor(message, setMessage, messageTextAreaRef);
        break;
      case "alternative-message":
        insertAtCursor(
          alternativeMessage,
          setAlternativeMessage,
          messageTextAreaRef
        );
        break;
      case "subject":
        insertAtCursor(subject, setSubject, subjectTextAreaRef);
        break;
      case "alternative-subject":
        insertAtCursor(
          alternativeSubject,
          setAlternativeSubject,
          subjectTextAreaRef
        );
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Create a dynamic{" "}
          {commandsHaveTitle.includes(initialData.command as any)
            ? "InMail"
            : "message"}{" "}
          template
        </h3>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {commandsHaveTitle.includes(initialData.command as any) && (
              <div>
                <Label htmlFor="subject" className="mb-2 block font-medium">
                  Subject Template
                </Label>
                <Input
                  id="subject"
                  placeholder="Write subject"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onFocus={() => setActiveField("subject")}
                  maxLength={180}
                  className={cn(
                    "w-full",
                    isInvalidSnippet(subject) && "border-red-500"
                  )}
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-xs text-slate-500">
                    {subject.length} / 180
                  </p>
                  {isInvalidSnippet(subject) && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Snippet error!
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="message" className="mb-2 block font-medium">
                Message Template
              </Label>
              <Textarea
                id="message"
                placeholder="Write message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                onFocus={() => setActiveField("message")}
                ref={messageTextAreaRef}
                rows={
                  commandsHaveTitle.includes(initialData.command as any) ? 5 : 8
                }
                maxLength={maxLength}
                className={cn(
                  "w-full",
                  isInvalidSnippet(message) && "border-red-500"
                )}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {message.length} / {maxLength}
                  {initialData.command === "INVITE" && (
                    <span className="ml-2 text-slate-400">
                      {isPremiumIntegration
                        ? "(Premium: 250 characters)"
                        : "(Standard: 200 characters)"}
                    </span>
                  )}
                </p>
                {isInvalidSnippet(message) && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Snippet error!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Variable insertion panel */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Snippets
              </span>
            </div>
            <div className="space-y-2">
              {messageVariables.map(({ label, value }) => (
                <Button
                  key={label}
                  variant="outline"
                  size="sm"
                  onClick={() => insertVariable(value)}
                  className="w-full justify-start text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="text-sm text-slate-600 dark:text-slate-400">
        If any of the specified parameters are unavailable, the corresponding
        message will not be sent to the user. In such a scenario, you have the
        option to send an alternative{" "}
        {commandsHaveTitle.includes(initialData.command as any)
          ? "subject & "
          : ""}
        message as shown below.
      </div>

      <div>
        <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Alternative{" "}
          {commandsHaveTitle.includes(initialData.command as any)
            ? "Subject & "
            : ""}
          Message
        </h4>

        <div className="space-y-4">
          {commandsHaveTitle.includes(initialData.command as any) && (
            <div>
              <Label
                htmlFor="alternative-subject"
                className="mb-2 block font-medium"
              >
                Alternative Subject
              </Label>
              <Input
                id="alternative-subject"
                placeholder="Write alternative subject"
                value={alternativeSubject}
                onChange={e => setAlternativeSubject(e.target.value)}
                onFocus={() => setActiveField("alternative-subject")}
                maxLength={180}
                className={cn(
                  "w-full",
                  isInvalidSnippet(alternativeSubject, true) && "border-red-500"
                )}
              />
              <div className="mt-2 flex justify-between items-center">
                <p className="text-xs text-slate-500">
                  {alternativeSubject.length} / 180
                </p>
                {isInvalidSnippet(alternativeSubject, true) && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Snippets not allowed in alternative message
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label
              htmlFor="alternative-message"
              className="mb-2 block font-medium"
            >
              Alternative Message
            </Label>
            <Textarea
              id="alternative-message"
              placeholder="Write alternative message"
              value={alternativeMessage}
              onChange={e => setAlternativeMessage(e.target.value)}
              onFocus={() => setActiveField("alternative-message")}
              rows={3}
              maxLength={maxLength}
              className={cn(
                "w-full",
                isInvalidSnippet(alternativeMessage, true) && "border-red-500"
              )}
            />
            <div className="mt-2 flex justify-between items-center">
              <p className="text-xs text-slate-500">
                {alternativeMessage.length} / {maxLength}
              </p>
              {isInvalidSnippet(alternativeMessage, true) && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Snippets not allowed in alternative message
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* File Attachments */}
      {(initialData.command === "MESSAGE" ||
        initialData.command === "INEMAIL") && (
        <div>
          <Label className="mb-2 block font-medium">File Attachments</Label>
          <p className="text-xs text-slate-500 mb-3">
            • Max 5 files allowed • Max file size: 1MB • Supported formats:
            Images, Documents, Media files, Audio, ZIP
          </p>

          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              accept={ALLOWED_FILE_TYPES.join(",")}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading..." : "Attach Files"}
            </Button>
          </div>

          {errors.length > 0 && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              {errors.map((error, index) => (
                <p
                  key={index}
                  className="text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </p>
              ))}
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Attached Files:
              </p>
              <div
                className="space-y-2 max-h-48 overflow-y-scroll pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ scrollBehavior: "smooth" }}
              >
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded-md border"
                  >
                    <div className="flex items-center space-x-2">
                      {getFileIcon(attachment.type)}
                      <div>
                        <p className="text-sm font-medium">{attachment.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(attachment.size || 0)}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {disableSaveButton && (
        <div className="text-center">
          <p className="text-sm text-red-500 flex items-center justify-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Please insert{" "}
            {commandsHaveTitle.includes(initialData.command as any)
              ? "subject, "
              : ""}
            message and alternative message.
          </p>
        </div>
      )}

      <div className="flex justify-center gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => submit(initialData.value || { label: "" })}
        >
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={disableSaveButton}>
          Save
        </Button>
      </div>
    </div>
  );
}
