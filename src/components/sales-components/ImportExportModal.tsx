import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import toastService from "@/services/sales-services/toastService";
import {
  X,
  Upload,
  Download,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import * as XLSX from "xlsx";
import contactService from "../../services/sales-services/contactService";
import companyService from "../../services/sales-services/companyService";
import dealService from "../../services/sales-services/dealService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "import" | "export";
  entityType?: "contacts" | "companies" | "deals" | "leads";
}

interface ImportResult {
  totalRecords: number;
  imported: number;
  failed: number;
  updated: number;
  created: number;
  tagsCreated: number;
  companiesCreated: number;
  errors: Array<{
    row: number;
    error: string;
    data: Record<string, unknown>;
  }>;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  entityType = "contacts",
}) => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"CSV" | "EXCEL">("CSV");
  const [importOptions, setImportOptions] = useState<Record<string, unknown>>(
    entityType === "companies"
      ? {
          skipHeader: true,
          updateExisting: false,
          createMissingTags: true,
          defaultStatus: "ACTIVE",
          defaultSize: "SMALL",
        }
      : entityType === "deals"
        ? {
            skipHeader: true,
            updateExisting: false,
            createMissingTags: true,
            createMissingCompanies: true,
            createMissingContacts: true,
            defaultStatus: "OPEN",
            defaultCurrency: "USD",
            defaultProbability: 50,
          }
        : entityType === "leads"
          ? {
              skipHeader: true,
              updateExisting: false,
              createMissingTags: true,
              createMissingCompanies: true,
              defaultLeadType: "COLD",
              defaultStatus: "ACTIVE",
            }
          : {
              skipHeader: true,
              updateExisting: false,
              createMissingTags: true,
              createMissingCompanies: true,
              defaultLeadType: "COLD",
              defaultStatus: "ACTIVE",
            }
  );
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Export state
  const [exportFormat, setExportFormat] = useState<"CSV" | "EXCEL">("EXCEL");
  const [exportFields, setExportFields] = useState<string[]>(
    entityType === "companies"
      ? [
          // All Company fields from Prisma schema + relational fields (excluding id)
          "name",
          "email",
          "phoneNumber",
          "domain",
          "websiteUrl",
          "industry",
          "size",
          "revenue",
          "description",
          "linkedinUrl",
          "twitterUrl",
          "whatsappNumber",
          "source",
          "preferredChannel",
          "logo",
          "address",
          "city",
          "state",
          "country",
          "zipCode",
          "status",
          "leadScore",
          "priority",
          "ownerId",
          "createdAt",
          "updatedAt",
          // Relational fields for import compatibility
          "contactsCount",
          "tags",
          "recentActivities",
          "recentDeals",
          "recentNotes",
          "recentTasks",
        ]
      : entityType === "deals"
        ? [
            // All Deal fields from Prisma schema + relational fields (excluding id)
            "title",
            "description",
            "value",
            "currency",
            "probability",
            "expectedCloseDate",
            "actualCloseDate",
            "status",
            "ownerId",
            "contactId",
            "companyId",
            "createdAt",
            "updatedAt",
            // Relational fields for import compatibility
            "source",
            "stage",
            "companyName",
            "companyWebsite",
            "companyIndustry",
            "contactName",
            "contactEmail",
            "contactPhone",
            "ownerName",
            "notes",
          ]
        : entityType === "leads"
          ? [
              // All Contact fields from Prisma schema (excluding id)
              "name",
              "email",
              "phoneNumber",
              "whatsappNumber",
              "linkedinUrl",
              "twitterUrl",
              "websiteUrl",
              "jobTitle",
              "industry",
              "leadType",
              "leadScore",
              "status",
              "priority",
              "source",
              "avatar",
              "preferredChannel",
              "enrichmentScore",
              "lastEnrichedAt",
              "lastContactedAt",
              "nextFollowUpAt",
              "ownerId",
              "companyId",
              "createdAt",
              "updatedAt",
            ]
          : [
              // All Contact fields from Prisma schema (same as leads, excluding id)
              "name",
              "email",
              "phoneNumber",
              "whatsappNumber",
              "linkedinUrl",
              "twitterUrl",
              "websiteUrl",
              "jobTitle",
              "industry",
              "leadType",
              "leadScore",
              "status",
              "priority",
              "source",
              "avatar",
              "preferredChannel",
              "enrichmentScore",
              "lastEnrichedAt",
              "lastContactedAt",
              "nextFollowUpAt",
              "ownerId",
              "companyId",
              "createdAt",
              "updatedAt",
            ]
  );
  const [exportOptions, setExportOptions] = useState(
    entityType === "companies"
      ? {
          includeHeaders: true,
          includeContacts: false,
          includeTags: true,
          includeActivities: false,
          includeDeals: false,
          includeNotes: false,
          includeTasks: false,
          dateFormat: "YYYY-MM-DD",
        }
      : entityType === "deals"
        ? {
            includeHeaders: true,
            includeCompany: true,
            includeContact: true,
            includeTags: true,
            includeActivities: false,
            includeNotes: false,
            includeTasks: false,
            dateFormat: "YYYY-MM-DD",
          }
        : entityType === "leads"
          ? {
              includeHeaders: true,
              includeCompany: true,
              includeTags: true,
              includeActivities: false,
              includeDeals: false,
              includeNotes: false,
              includeTasks: false,
              dateFormat: "YYYY-MM-DD",
            }
          : {
              includeHeaders: true,
              includeCompany: true,
              includeTags: true,
              includeActivities: false,
              includeDeals: false,
              includeNotes: false,
              includeTasks: false,
              dateFormat: "YYYY-MM-DD",
            }
  );
  const [isExporting, setIsExporting] = useState(false);

  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const availableFields =
    entityType === "companies"
      ? [
          // All Company fields from Prisma schema + relational fields (excluding id)
          { value: "name", label: "Name" },
          { value: "email", label: "Email" },
          { value: "phoneNumber", label: "Phone Number" },
          { value: "domain", label: "Domain" },
          { value: "websiteUrl", label: "Website URL" },
          { value: "industry", label: "Industry" },
          { value: "size", label: "Size" },
          { value: "revenue", label: "Revenue" },
          { value: "description", label: "Description" },
          { value: "linkedinUrl", label: "LinkedIn URL" },
          { value: "twitterUrl", label: "Twitter URL" },
          { value: "whatsappNumber", label: "WhatsApp Number" },
          { value: "source", label: "Source" },
          { value: "preferredChannel", label: "Preferred Channel" },
          { value: "logo", label: "Logo" },
          { value: "address", label: "Address" },
          { value: "city", label: "City" },
          { value: "state", label: "State" },
          { value: "country", label: "Country" },
          { value: "zipCode", label: "Zip Code" },
          { value: "status", label: "Status" },
          { value: "leadScore", label: "Lead Score" },
          { value: "priority", label: "Priority" },
          { value: "ownerId", label: "Owner ID" },
          { value: "createdAt", label: "Created At" },
          { value: "updatedAt", label: "Updated At" },
          // Relational fields for import compatibility
          { value: "contactsCount", label: "Contacts Count" },
          { value: "tags", label: "Tags" },
          { value: "recentActivities", label: "Recent Activities" },
          { value: "recentDeals", label: "Recent Deals" },
          { value: "recentNotes", label: "Recent Notes" },
          { value: "recentTasks", label: "Recent Tasks" },
        ]
      : entityType === "deals"
        ? [
            // All Deal fields from Prisma schema + relational fields (excluding id)
            { value: "title", label: "Title" },
            { value: "description", label: "Description" },
            { value: "value", label: "Value" },
            { value: "currency", label: "Currency" },
            { value: "probability", label: "Probability" },
            { value: "expectedCloseDate", label: "Expected Close Date" },
            { value: "actualCloseDate", label: "Actual Close Date" },
            { value: "status", label: "Status" },
            { value: "ownerId", label: "Owner ID" },
            { value: "contactId", label: "Contact ID" },
            { value: "companyId", label: "Company ID" },
            { value: "createdAt", label: "Created At" },
            { value: "updatedAt", label: "Updated At" },
            // Relational fields for import compatibility
            { value: "source", label: "Source" },
            { value: "stage", label: "Stage" },
            { value: "companyName", label: "Company Name" },
            { value: "companyWebsite", label: "Company Website" },
            { value: "companyIndustry", label: "Company Industry" },
            { value: "contactName", label: "Contact Name" },
            { value: "contactEmail", label: "Contact Email" },
            { value: "contactPhone", label: "Contact Phone" },
            { value: "ownerName", label: "Owner Name" },
            { value: "notes", label: "Notes" },
          ]
        : entityType === "leads"
          ? [
              // All Contact fields from Prisma schema + relational fields (excluding id)
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phoneNumber", label: "Phone Number" },
              { value: "whatsappNumber", label: "WhatsApp Number" },
              { value: "linkedinUrl", label: "LinkedIn URL" },
              { value: "twitterUrl", label: "Twitter URL" },
              { value: "websiteUrl", label: "Website URL" },
              { value: "jobTitle", label: "Job Title" },
              { value: "industry", label: "Industry" },
              { value: "leadType", label: "Lead Type" },
              { value: "leadScore", label: "Lead Score" },
              { value: "status", label: "Status" },
              { value: "priority", label: "Priority" },
              { value: "source", label: "Source" },
              { value: "avatar", label: "Avatar" },
              { value: "preferredChannel", label: "Preferred Channel" },
              { value: "enrichmentScore", label: "Enrichment Score" },
              { value: "lastEnrichedAt", label: "Last Enriched" },
              { value: "lastContactedAt", label: "Last Contacted" },
              { value: "nextFollowUpAt", label: "Next Follow-up" },
              { value: "ownerId", label: "Owner ID" },
              { value: "companyId", label: "Company ID" },
              { value: "createdAt", label: "Created At" },
              { value: "updatedAt", label: "Updated At" },
              // LinkedIn Profile Fields
              { value: "linkedinUrnId", label: "LinkedIn URN ID" },
              { value: "linkedinPublicId", label: "LinkedIn Public ID" },
              { value: "linkedinLocation", label: "LinkedIn Location" },
              { value: "linkedinHeadline", label: "LinkedIn Headline" },
              { value: "linkedinAbout", label: "LinkedIn About" },
              { value: "linkedinJoined", label: "LinkedIn Joined" },
              { value: "linkedinBirthday", label: "LinkedIn Birthday" },
              { value: "linkedinConnected", label: "LinkedIn Connected" },
              { value: "linkedinAddress", label: "LinkedIn Address" },
              { value: "linkedinIsOpenToWork", label: "LinkedIn Open to Work" },
              {
                value: "linkedinProfilePhoto",
                label: "LinkedIn Profile Photo",
              },
              {
                value: "linkedinProfileUpdated",
                label: "LinkedIn Profile Updated",
              },
              {
                value: "linkedinContactInfoUpdated",
                label: "LinkedIn Contact Info Updated",
              },
              // LinkedIn Complex Fields
              { value: "linkedinExperience", label: "LinkedIn Experience" },
              { value: "linkedinSkills", label: "LinkedIn Skills" },
              {
                value: "linkedinJobPreferences",
                label: "LinkedIn Job Preferences",
              },
              { value: "linkedinWebsites", label: "LinkedIn Websites" },
              {
                value: "linkedinVerifications",
                label: "LinkedIn Verifications",
              },
              {
                value: "linkedinRecommendations",
                label: "LinkedIn Recommendations",
              },
              { value: "linkedinPosts", label: "LinkedIn Posts" },
              {
                value: "linkedinFeaturedSections",
                label: "LinkedIn Featured Sections",
              },
              {
                value: "linkedinMutualContacts",
                label: "LinkedIn Mutual Contacts",
              },
              // Relational fields for import compatibility
              { value: "companyName", label: "Company Name" },
              { value: "companyWebsite", label: "Company Website" },
              { value: "companyIndustry", label: "Company Industry" },
              { value: "tags", label: "Tags" },
            ]
          : [
              // All Contact fields from Prisma schema + relational fields (same as leads, excluding id)
              { value: "name", label: "Name" },
              { value: "email", label: "Email" },
              { value: "phoneNumber", label: "Phone Number" },
              { value: "whatsappNumber", label: "WhatsApp Number" },
              { value: "linkedinUrl", label: "LinkedIn URL" },
              { value: "twitterUrl", label: "Twitter URL" },
              { value: "websiteUrl", label: "Website URL" },
              { value: "jobTitle", label: "Job Title" },
              { value: "industry", label: "Industry" },
              { value: "leadType", label: "Lead Type" },
              { value: "leadScore", label: "Lead Score" },
              { value: "status", label: "Status" },
              { value: "priority", label: "Priority" },
              { value: "source", label: "Source" },
              { value: "avatar", label: "Avatar" },
              { value: "preferredChannel", label: "Preferred Channel" },
              { value: "enrichmentScore", label: "Enrichment Score" },
              { value: "lastEnrichedAt", label: "Last Enriched" },
              { value: "lastContactedAt", label: "Last Contacted" },
              { value: "nextFollowUpAt", label: "Next Follow-up" },
              { value: "ownerId", label: "Owner ID" },
              { value: "companyId", label: "Company ID" },
              { value: "createdAt", label: "Created At" },
              { value: "updatedAt", label: "Updated At" },
              // LinkedIn Profile Fields
              { value: "linkedinUrnId", label: "LinkedIn URN ID" },
              { value: "linkedinPublicId", label: "LinkedIn Public ID" },
              { value: "linkedinLocation", label: "LinkedIn Location" },
              { value: "linkedinHeadline", label: "LinkedIn Headline" },
              { value: "linkedinAbout", label: "LinkedIn About" },
              { value: "linkedinJoined", label: "LinkedIn Joined" },
              { value: "linkedinBirthday", label: "LinkedIn Birthday" },
              { value: "linkedinConnected", label: "LinkedIn Connected" },
              { value: "linkedinAddress", label: "LinkedIn Address" },
              { value: "linkedinIsOpenToWork", label: "LinkedIn Open to Work" },
              {
                value: "linkedinProfilePhoto",
                label: "LinkedIn Profile Photo",
              },
              {
                value: "linkedinProfileUpdated",
                label: "LinkedIn Profile Updated",
              },
              {
                value: "linkedinContactInfoUpdated",
                label: "LinkedIn Contact Info Updated",
              },
              // LinkedIn Complex Fields
              { value: "linkedinExperience", label: "LinkedIn Experience" },
              { value: "linkedinSkills", label: "LinkedIn Skills" },
              {
                value: "linkedinJobPreferences",
                label: "LinkedIn Job Preferences",
              },
              { value: "linkedinWebsites", label: "LinkedIn Websites" },
              {
                value: "linkedinVerifications",
                label: "LinkedIn Verifications",
              },
              {
                value: "linkedinRecommendations",
                label: "LinkedIn Recommendations",
              },
              { value: "linkedinPosts", label: "LinkedIn Posts" },
              {
                value: "linkedinFeaturedSections",
                label: "LinkedIn Featured Sections",
              },
              {
                value: "linkedinMutualContacts",
                label: "LinkedIn Mutual Contacts",
              },
              // Relational fields for import compatibility
              { value: "companyName", label: "Company Name" },
              { value: "companyWebsite", label: "Company Website" },
              { value: "companyIndustry", label: "Company Industry" },
              { value: "tags", label: "Tags" },
            ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportFormat(file.name.endsWith(".csv") ? "CSV" : "EXCEL");
      parseFileForColumns(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file) {
      // Check if file is valid
      const validTypes = [".csv", ".xlsx", ".xls"];
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."));

      if (validTypes.includes(fileExtension)) {
        setImportFile(file);
        setImportFormat(file.name.endsWith(".csv") ? "CSV" : "EXCEL");
        parseFileForColumns(file);
        setError(null);
      } else {
        setError("Please select a valid CSV or Excel file");
      }
    }
  };

  const parseFileForColumns = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = e.target?.result as string;
        let columns: string[] = [];

        if (file.name.endsWith(".csv")) {
          const lines = content.split("\n");
          if (lines.length > 0) {
            columns = lines[0]
              .split(",")
              .map(col => col.trim().replace(/"/g, ""));
          }
        } else {
          const workbook = XLSX.read(content, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (jsonData.length > 0) {
            columns = (jsonData[0] as string[]).map(col => col.trim());
          }
        }

        setAvailableColumns(columns);

        // Auto-map columns
        const autoMapping: Record<string, string> = {};
        columns.forEach(col => {
          const field = availableFields.find(
            f =>
              f.label.toLowerCase().includes(col.toLowerCase()) ||
              f.value.toLowerCase().includes(col.toLowerCase())
          );
          if (field) {
            autoMapping[field.value] = col;
          }
        });
        setColumnMapping(autoMapping);
      } catch (error) {}
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    if (!importFile || !selectedWorkspace || !selectedOrganization) {
      setError("Please select a file to import");
      return;
    }

    setIsImporting(true);
    setError(null);
    try {
      const fileContent = await readFileAsBase64(importFile);

      // Filter options based on entity type
      const filteredOptions =
        entityType === "companies"
          ? {
              skipHeader: importOptions.skipHeader as boolean,
              updateExisting: importOptions.updateExisting as boolean,
              createMissingTags: importOptions.createMissingTags as boolean,
              createMissingCompanies: true,
              createMissingContacts: true,
              defaultStatus: importOptions.defaultStatus as string,
              defaultCurrency: "USD",
              defaultProbability: 50,
              defaultSize: (importOptions.defaultSize as string) || "SMALL",
            }
          : entityType === "deals"
            ? {
                skipHeader: importOptions.skipHeader as boolean,
                updateExisting: importOptions.updateExisting as boolean,
                createMissingTags: importOptions.createMissingTags as boolean,
                createMissingCompanies:
                  (importOptions.createMissingCompanies as boolean) || true,
                createMissingContacts:
                  (importOptions.createMissingContacts as boolean) || true,
                defaultStatus: importOptions.defaultStatus as string,
                defaultCurrency:
                  (importOptions.defaultCurrency as string) || "USD",
                defaultProbability:
                  (importOptions.defaultProbability as number) || 50,
              }
            : {
                skipHeader: importOptions.skipHeader as boolean,
                updateExisting: importOptions.updateExisting as boolean,
                createMissingTags: importOptions.createMissingTags as boolean,
                createMissingCompanies:
                  (importOptions.createMissingCompanies as boolean) || true,
                createMissingContacts: true,
                defaultStatus: importOptions.defaultStatus as string,
                defaultCurrency: "USD",
                defaultProbability: 50,
              };

      const importData = {
        format: importFormat.toLowerCase() as "csv" | "excel",
        fileContent,
        columnMapping,
        options: filteredOptions,
      };

      const result =
        entityType === "companies"
          ? await companyService.importCompanies(
              selectedWorkspace.id,
              selectedOrganization.id,
              importData,
              localStorage.getItem("crm_access_token") || ""
            )
          : entityType === "deals"
            ? await dealService.importDeals(
                selectedWorkspace.id,
                selectedOrganization.id,
                importData,
                localStorage.getItem("crm_access_token") || ""
              )
            : entityType === "leads"
              ? await contactService.importContacts(
                  selectedWorkspace.id,
                  selectedOrganization.id,
                  importData,
                  localStorage.getItem("crm_access_token") || ""
                )
              : await contactService.importContacts(
                  selectedWorkspace.id,
                  selectedOrganization.id,
                  importData,
                  localStorage.getItem("crm_access_token") || ""
                );

      if (result.success && result.data && typeof result.data === "object") {
        const importResult: ImportResult = {
          totalRecords: 0,
          imported: 0,
          failed: 0,
          updated: 0,
          created: 0,
          tagsCreated: 0,
          companiesCreated: 0,
          errors: [],
          ...result.data,
        };
        setImportResult(importResult);
        if (importResult.failed === 0) {
          onSuccess();
          onClose();
          toastService.success("Import completed successfully");
        }
      } else {
        toastService.error(result.error || "Import failed");
        setError(result.error || "Import failed");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Import failed: Unknown error"
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    if (!selectedWorkspace || !selectedOrganization) {
      setError("Workspace and organization are required");
      return;
    }

    setIsExporting(true);
    setError(null);
    try {
      const exportData = {
        format: exportFormat.toLowerCase() as "csv" | "excel",
        fields: exportFields,
        options: exportOptions,
      };

      const result =
        entityType === "companies"
          ? await companyService.exportCompanies(
              selectedWorkspace.id,
              selectedOrganization.id,
              exportData,
              localStorage.getItem("crm_access_token") || ""
            )
          : entityType === "deals"
            ? await dealService.exportDeals(
                selectedWorkspace.id,
                selectedOrganization.id,
                exportFormat as "CSV" | "EXCEL",
                exportFields,
                {
                  includeHeaders: exportOptions.includeHeaders,
                  includeCompany: true,
                  includeContact: true,
                  includeTags: exportOptions.includeTags,
                  includeActivities: exportOptions.includeActivities,
                  includeNotes: exportOptions.includeNotes,
                  includeTasks: exportOptions.includeTasks,
                  dateFormat: exportOptions.dateFormat,
                },
                localStorage.getItem("crm_access_token") || ""
              )
            : entityType === "leads"
              ? await contactService.exportContacts(
                  selectedWorkspace.id,
                  selectedOrganization.id,
                  exportData,
                  localStorage.getItem("crm_access_token") || ""
                )
              : await contactService.exportContacts(
                  selectedWorkspace.id,
                  selectedOrganization.id,
                  exportData,
                  localStorage.getItem("crm_access_token") || ""
                );

      if (result.success && result.data) {
        onSuccess();
        onClose();
        toastService.success("Export completed successfully");
      } else {
        toastService.error(result.error || "Export failed");
        setError(result.error || "Export failed");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Export failed: Unknown error"
      );
    } finally {
      setIsExporting(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract just the base64 content from the data URL
        const base64Content = result.split(",")[1];
        resolve(base64Content);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const toggleField = (field: string) => {
    setExportFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const resetForm = () => {
    setImportFile(null);
    setImportResult(null);
    setError(null);
    setColumnMapping({});
    setAvailableColumns([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === "import"
              ? `Import ${entityType}`
              : `Export ${entityType}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Error Message */}
          {error && (
            <div className="p-4 mb-4 bg-red-50 rounded-md border border-red-200">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Import Result */}
          {mode === "import" && importResult && (
            <div className="p-4 mb-4 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {importResult.failed === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Import Results
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>Total Records: {importResult.totalRecords}</p>
                    <p>Successfully Imported: {importResult.imported}</p>
                    <p>Created: {importResult.created}</p>
                    <p>Updated: {importResult.updated}</p>
                    <p>Failed: {importResult.failed}</p>
                    {importResult.failed > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="mt-1 list-disc list-inside">
                          {importResult.errors.map((error, index) => (
                            <li key={index} className="text-red-600">
                              Row {error.row}: {error.error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rest of the modal content */}
          {mode === "import" ? (
            <div className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select File
                </label>
                <div
                  className={`p-6 text-center rounded-lg border-2 border-dashed transition-colors duration-200 ${
                    isDragOver
                      ? "bg-blue-50 border-blue-400"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                  >
                    <Upload className="w-5 h-5" />
                    <span>Choose file or drag and drop</span>
                  </button>
                  <p className="mt-2 text-sm text-gray-500">
                    CSV, Excel files up to 10MB
                  </p>
                  {isDragOver && (
                    <p className="mt-2 text-sm font-medium text-blue-600">
                      Drop your file here
                    </p>
                  )}
                </div>
                {importFile && (
                  <div className="flex items-center mt-2 space-x-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{importFile.name}</span>
                    <span>
                      ({(importFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Format Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  File Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      value="CSV"
                      checked={importFormat === "CSV"}
                      onChange={e =>
                        setImportFormat(e.target.value as "CSV" | "EXCEL")
                      }
                      className="mr-2"
                    />
                    <FileText className="mr-1 w-4 h-4" />
                    CSV
                  </label>
                  <label className="flex items-center text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      value="EXCEL"
                      checked={importFormat === "EXCEL"}
                      onChange={e =>
                        setImportFormat(e.target.value as "CSV" | "EXCEL")
                      }
                      className="mr-2"
                    />
                    <FileSpreadsheet className="mr-1 w-4 h-4" />
                    Excel
                  </label>
                </div>
              </div>

              {/* Column Mapping */}
              {availableColumns.length > 0 && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Column Mapping
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {availableFields.map(field => (
                      <div key={field.value} className="flex flex-col">
                        <label className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                          {field.label}
                        </label>
                        <select
                          value={columnMapping[field.value] || ""}
                          onChange={e =>
                            setColumnMapping(prev => ({
                              ...prev,
                              [field.value]: e.target.value,
                            }))
                          }
                          className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-300"
                        >
                          <option value="">Not mapped</option>
                          {availableColumns.map(col => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showAdvancedOptions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span>Advanced Options</span>
                </button>

                {showAdvancedOptions && (
                  <div className="p-4 mt-4 space-y-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={importOptions.skipHeader as boolean}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              skipHeader: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Skip header row
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={importOptions.updateExisting as boolean}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              updateExisting: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Update existing contacts
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={importOptions.createMissingTags as boolean}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              createMissingTags: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Create missing tags
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={
                            importOptions.createMissingCompanies as boolean
                          }
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              createMissingCompanies: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Create missing companies
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
                          Default Lead Type
                        </label>
                        <select
                          value={importOptions.defaultLeadType as string}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              defaultLeadType: e.target.value,
                            }))
                          }
                          className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-300"
                        >
                          <option value="COLD">Cold</option>
                          <option value="WARM">Warm</option>
                          <option value="HOT">Hot</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
                          Default Status
                        </label>
                        <select
                          value={importOptions.defaultStatus as string}
                          onChange={e =>
                            setImportOptions(prev => ({
                              ...prev,
                              defaultStatus: e.target.value,
                            }))
                          }
                          className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-300"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="PROSPECT">Prospect</option>
                          <option value="CUSTOMER">Customer</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Result */}
              {importResult && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h3 className="mb-2 font-medium text-gray-900 dark:text-white">
                    Import Results
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
                    <div>Total Records: {importResult.totalRecords}</div>
                    <div>Imported: {importResult.imported}</div>
                    <div>Created: {importResult.created}</div>
                    <div>Updated: {importResult.updated}</div>
                    <div>Failed: {importResult.failed}</div>
                    <div>Tags Created: {importResult.tagsCreated}</div>
                    <div>
                      Companies Created: {importResult.companiesCreated}
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="mb-2 font-medium text-red-600">
                        Errors ({importResult.errors.length})
                      </h4>
                      <div className="overflow-y-auto space-y-1 max-h-32">
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs text-red-600">
                            Row {error.row}: {error.error}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs text-gray-500">
                            ... and {importResult.errors.length - 5} more errors
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Format Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Export Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      value="CSV"
                      checked={exportFormat === "CSV"}
                      onChange={e =>
                        setExportFormat(e.target.value as "CSV" | "EXCEL")
                      }
                      className="mr-2"
                    />
                    <FileText className="mr-1 w-4 h-4" />
                    CSV
                  </label>
                  <label className="flex items-center text-gray-700 dark:text-gray-300">
                    <input
                      type="radio"
                      value="EXCEL"
                      checked={exportFormat === "EXCEL"}
                      onChange={e =>
                        setExportFormat(e.target.value as "CSV" | "EXCEL")
                      }
                      className="mr-2"
                    />
                    <FileSpreadsheet className="mr-1 w-4 h-4" />
                    Excel
                  </label>
                </div>
              </div>

              {/* Field Selection */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fields to Export
                </label>
                <div className="grid overflow-y-auto grid-cols-3 gap-2 max-h-48">
                  {availableFields.map(field => (
                    <label
                      key={field.value}
                      className="flex items-center text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={exportFields.includes(field.value)}
                        onChange={() => toggleField(field.value)}
                        className="mr-2"
                      />
                      <span className="text-sm">{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  {showAdvancedOptions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span>Advanced Options</span>
                </button>

                {showAdvancedOptions && (
                  <div className="p-4 mt-4 space-y-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeHeaders}
                          onChange={e =>
                            setExportOptions(prev => ({
                              ...prev,
                              includeHeaders: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Include headers
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeCompany}
                          onChange={e =>
                            setExportOptions(
                              prev =>
                                ({
                                  ...prev,
                                  includeCompany: e.target.checked,
                                }) as typeof prev
                            )
                          }
                          className="mr-2"
                        />
                        Include company data
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeTags}
                          onChange={e =>
                            setExportOptions(prev => ({
                              ...prev,
                              includeTags: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Include tags
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeActivities}
                          onChange={e =>
                            setExportOptions(prev => ({
                              ...prev,
                              includeActivities: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Include activities count
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeDeals}
                          onChange={e =>
                            setExportOptions(
                              prev =>
                                ({
                                  ...prev,
                                  includeDeals: e.target.checked,
                                }) as typeof prev
                            )
                          }
                          className="mr-2"
                        />
                        Include deals count
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeNotes}
                          onChange={e =>
                            setExportOptions(prev => ({
                              ...prev,
                              includeNotes: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Include notes count
                      </label>
                      <label className="flex items-center text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeTasks}
                          onChange={e =>
                            setExportOptions(prev => ({
                              ...prev,
                              includeTasks: e.target.checked,
                            }))
                          }
                          className="mr-2"
                        />
                        Include tasks count
                      </label>
                    </div>

                    <div>
                      <label className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
                        Date Format
                      </label>
                      <select
                        value={exportOptions.dateFormat}
                        onChange={e =>
                          setExportOptions(prev => ({
                            ...prev,
                            dateFormat: e.target.value,
                          }))
                        }
                        className="px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-gray-300"
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 space-x-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          {mode === "import" && (
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Reset
            </button>
          )}
          <button
            onClick={mode === "import" ? handleImport : handleExport}
            disabled={
              mode === "import" ? !importFile || isImporting : isExporting
            }
            className={`px-4 py-2 text-white rounded-md flex items-center ${
              (mode === "import" ? !importFile || isImporting : isExporting)
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {mode === "import" ? (
              isImporting ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 w-4 h-4" />
                  Import{" "}
                  {entityType === "companies"
                    ? "Companies"
                    : entityType === "deals"
                      ? "Deals"
                      : entityType === "leads"
                        ? "Leads"
                        : "Contacts"}
                </>
              )
            ) : isExporting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Export{" "}
                {entityType === "companies"
                  ? "Companies"
                  : entityType === "deals"
                    ? "Deals"
                    : entityType === "leads"
                      ? "Leads"
                      : "Contacts"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImportExportModal;
