"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle, ArrowRight, Plus } from "lucide-react";

interface Job {
  id: string;
  title: string;
}

interface CSVUploadProps {
  jobs: Job[];
}

interface ColumnMapping {
  csvColumn: string;
  mappedTo: string; // 'name', 'email', 'phone', 'notes', 'skip', or 'custom:fieldName'
  customFieldName?: string;
}

interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
  message: string;
}

const SYSTEM_FIELDS = [
  { value: "email", label: "Email (Required)" },
  { value: "name", label: "Name" },
  { value: "phone", label: "Phone" },
  { value: "notes", label: "Notes" },
  { value: "skip", label: "Skip this column" },
  { value: "custom", label: "+ Create Custom Field" },
];

function parseCSVHeaders(text: string): { headers: string[]; preview: string[][] } {
  const lines = text.trim().split("\n");
  if (lines.length === 0) return { headers: [], preview: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["']|["']$/g, ""));
    return result;
  };

  const headers = parseRow(lines[0]);
  const preview: string[][] = [];

  for (let i = 1; i < Math.min(lines.length, 4); i++) {
    preview.push(parseRow(lines[i]));
  }

  return { headers, preview };
}

function guessMapping(header: string): string {
  const h = header.toLowerCase().replace(/[_\s-]/g, "");
  if (h.includes("email") || h.includes("mail")) return "email";
  if (h.includes("name") || h.includes("fullname")) return "name";
  if (h.includes("phone") || h.includes("mobile") || h.includes("contact") || h.includes("tel")) return "phone";
  if (h.includes("note") || h.includes("comment")) return "notes";
  return "skip";
}

export function CSVUpload({ jobs }: CSVUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "mapping" | "result">("upload");
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<string[][]>([]);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);

      const text = await selectedFile.text();
      setFileContent(text);

      const { headers: csvHeaders, preview: csvPreview } = parseCSVHeaders(text);
      setHeaders(csvHeaders);
      setPreview(csvPreview);

      // Auto-guess mappings
      const initialMappings: ColumnMapping[] = csvHeaders.map((header) => ({
        csvColumn: header,
        mappedTo: guessMapping(header),
      }));
      setMappings(initialMappings);
    }
  }

  function updateMapping(index: number, value: string) {
    const newMappings = [...mappings];
    if (value === "custom") {
      newMappings[index] = {
        ...newMappings[index],
        mappedTo: "custom",
        customFieldName: newMappings[index].csvColumn.replace(/[^a-zA-Z0-9]/g, "_"),
      };
    } else {
      newMappings[index] = {
        ...newMappings[index],
        mappedTo: value,
        customFieldName: undefined,
      };
    }
    setMappings(newMappings);
  }

  function updateCustomFieldName(index: number, name: string) {
    const newMappings = [...mappings];
    newMappings[index] = {
      ...newMappings[index],
      customFieldName: name,
    };
    setMappings(newMappings);
  }

  async function handleUpload() {
    if (!file || !selectedJob) return;

    // Validate email mapping exists
    const hasEmail = mappings.some((m) => m.mappedTo === "email");
    if (!hasEmail) {
      setResult({
        success: 0,
        failed: 0,
        errors: ["Email field mapping is required"],
        message: "Email field mapping is required",
      });
      return;
    }

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("jobId", selectedJob);
      formData.append("mappings", JSON.stringify(mappings));

      const response = await fetch("/api/admin/candidates/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setStep("result");
        if (data.success > 0) {
          router.refresh();
        }
      } else {
        setResult({
          success: 0,
          failed: 0,
          errors: [data.error || "Upload failed"],
          message: data.error || "Upload failed",
        });
      }
    } catch {
      setResult({
        success: 0,
        failed: 0,
        errors: ["Network error occurred"],
        message: "Network error occurred",
      });
    } finally {
      setIsUploading(false);
    }
  }

  function resetForm() {
    setFile(null);
    setFileContent("");
    setHeaders([]);
    setPreview([]);
    setMappings([]);
    setResult(null);
    setSelectedJob("");
    setStep("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function proceedToMapping() {
    if (file && headers.length > 0) {
      setStep("mapping");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import Candidates from CSV"}
            {step === "mapping" && "Map CSV Columns"}
            {step === "result" && "Import Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file with candidate information"}
            {step === "mapping" && "Map each CSV column to a field or create custom fields"}
            {step === "result" && "Review the import results"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {step === "upload" && (
            <div className="space-y-4 py-4 px-1">
              <div className="space-y-2">
                <Label>Job Position *</Label>
                <Select value={selectedJob} onValueChange={setSelectedJob}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>CSV File *</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileSpreadsheet className="h-8 w-8 text-green-500" />
                      <div className="text-left">
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-slate-500">
                          {headers.length} columns detected
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-600">Click to select CSV file</p>
                    </div>
                  )}
                </div>
              </div>

              {headers.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {headers.map((h, i) => (
                            <TableHead key={i} className="text-xs">{h}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.map((row, i) => (
                          <TableRow key={i}>
                            {row.map((cell, j) => (
                              <TableCell key={j} className="text-xs truncate max-w-[150px]">
                                {cell || "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-4 py-4 px-1">
              <Alert>
                <AlertDescription>
                  Map each CSV column to a system field or create custom fields for additional data.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {mappings.map((mapping, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{mapping.csvColumn}</p>
                      {preview[0] && preview[0][index] && (
                        <p className="text-xs text-slate-500 truncate">
                          e.g. {preview[0][index]}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                    <div className="flex-1 space-y-2">
                      <Select
                        value={mapping.mappedTo}
                        onValueChange={(v) => updateMapping(index, v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SYSTEM_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.value === "custom" && <Plus className="h-3 w-3 inline mr-1" />}
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {mapping.mappedTo === "custom" && (
                        <Input
                          placeholder="Custom field name"
                          value={mapping.customFieldName || ""}
                          onChange={(e) => updateCustomFieldName(index, e.target.value)}
                          className="text-sm"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "result" && result && (
            <div className="space-y-4 py-4 px-1">
              <Alert variant={result.success > 0 ? "default" : "destructive"}>
                {result.success > 0 ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <p className="font-medium text-lg">{result.message}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-green-600">{result.success} imported</span>
                    {result.failed > 0 && (
                      <span className="text-red-600">{result.failed} failed</span>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <Label>Errors</Label>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                    <ul className="text-xs text-red-600 space-y-1">
                      {result.errors.slice(0, 20).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {result.errors.length > 20 && (
                        <li>...and {result.errors.length - 20} more errors</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={proceedToMapping}
                disabled={!file || !selectedJob || headers.length === 0}
              >
                Next: Map Columns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "mapping" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Candidates
                  </>
                )}
              </Button>
            </>
          )}

          {step === "result" && (
            <Button onClick={() => setOpen(false)}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
