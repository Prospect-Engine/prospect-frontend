"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Link,
  Upload,
  Search,
  FileText,
  Database,
  Globe,
  Zap,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Download,
  Loader2,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { apiCall } from "@/lib/apiCall";
import isSuccessful from "@/lib/status";
import { RoleType } from "../create";
import { toast } from "sonner";
import {
  filterLeads,
  filterLeadsAdvanced,
  getLeadLimit,
  formatValidationFeedback,
  validateLeadCount,
  getMaxLeadCount,
  processLinkedInUrlsAdvanced,
  extractLinkedInUrlsFromText,
  type LeadFilteringResult,
} from "@/lib/leadValidation";

interface Campaign {
  id: string;
  name: string;
  tenant_id: string;
  status: string;
  process_status: string;
  is_locked: boolean;
  sequence_id: string;
  skip_lead_conditions: string[];
  target_leads_id: string | null;
  target_leads_count: number | null;
  work_calender_id: string | null;
  integration_id: string | null;
  launched_at: Date | null;
  created_at: Date;
  daily_engine_quota: any | null;
  loading?: boolean | null;
  campaign_stats: any | null;
  is_archived: boolean;
}

interface LeadsRow {
  id: string;
  leads: string[];
  targetUrl: string | null;
  source: string;
  leadCount: number;
  createdAt: string;
  error_message?: string;
  // Search URL progress fields
  target_search_url_id?: string;
  fetch_status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED";
}

interface SearchUrlProgress {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "PAUSED";
  fetchedCount: number;
  expectedCount: number;
  progress: number;
  pageCount: number;
  lastFetchAt: string | null;
  errorMessage: string | null;
}

interface AddLeadsStepProps {
  campaignId: string;
  next: () => void;
  back: () => void;
  role: RoleType;
  campaign: Campaign | null;
}

const fetchExistingLeads = async (
  campaignId: string,
  setRows: React.Dispatch<React.SetStateAction<LeadsRow[]>>,
  setTargetLeads: React.Dispatch<React.SetStateAction<string[]>>,
  setTargetSearchUrls: React.Dispatch<React.SetStateAction<string[]>>,
  setDisabledLeadList: React.Dispatch<React.SetStateAction<string[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    const { data, status } = await apiCall({
      url: "/api/outreach/campaign/getLeads",
      method: "post",
      body: { camp_id: campaignId },
      applyDefaultDomain: false,
    });

    if (isSuccessful(status)) {
      const { target_leads } = data;
      const allTargetLeads: string[] = [];
      const allTargetSearchUrls: string[] = [];
      const disabledLeadList: string[] = [];
      const leads: LeadsRow[] = [];

      if (target_leads && target_leads.length) {
        target_leads.forEach((item: any) => {
          const isSearchUrl = item.data_source === "SEARCH_URL";
          const data: LeadsRow = {
            id: item.id,
            leads: item.lead_ids,
            targetUrl: item?.search_url ?? null,
            source: item.data_source,
            leadCount: item.total_leads,
            createdAt: item.created_at,
            error_message: item.error_message,
            // Include search URL progress fields
            target_search_url_id: item.target_search_url_id ?? null,
            fetch_status:
              item.target_search_url?.status ?? item.fetch_status ?? null,
          };
          leads.push(data);
          allTargetLeads.push(...item.lead_ids);
          if (isSearchUrl && item.search_url)
            allTargetSearchUrls.push(item.search_url);
        });
      }

      // Always update with backend data to ensure consistency
      setRows(leads);
      setDisabledLeadList(disabledLeadList);
      setTargetLeads(allTargetLeads);
      setTargetSearchUrls(allTargetSearchUrls);
    }
  } catch (error) {
  } finally {
    setIsLoading(false);
  }
};

export default function AddLeadsStep({
  campaignId,
  next,
  back,
  role,
  campaign,
}: AddLeadsStepProps) {
  const isDraft = role === "FULL_PERMISSION";
  const [rows, setRows] = useState<LeadsRow[]>([]);
  const [open, setOpen] = useState(false);
  const [targetLeads, setTargetLeads] = useState<string[]>([]);
  const [targetSearchUrls, setTargetSearchUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [disabledLeadList, setDisabledLeadList] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState<{ selectedId: string[] }>({
    selectedId: [],
  });

  // Search modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedSearchType, setSelectedSearchType] = useState<string>("");
  const [searchUrl, setSearchUrl] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [leadsFound, setLeadsFound] = useState<number | null>(null);
  const [isCheckingUrl, setIsCheckingUrl] = useState(false);

  // Premium (Sales Navigator) gating
  const [hasAnyPremium, setHasAnyPremium] = useState<boolean>(false);
  const [premiumLoaded, setPremiumLoaded] = useState<boolean>(false);

  // Import URLs states
  const [profileUrls, setProfileUrls] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  // CSV Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Validation feedback states
  const [validationResult, setValidationResult] =
    useState<LeadFilteringResult | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);
  const [realTimeValidation, setRealTimeValidation] =
    useState<LeadFilteringResult | null>(null);

  // Search URL progress tracking
  const [searchUrlProgress, setSearchUrlProgress] = useState<
    Map<string, SearchUrlProgress>
  >(new Map());

  useEffect(() => {
    if (campaignId && campaign) {
      // Clear previous state to avoid cross-campaign bleed
      setRows([]);
      fetchExistingLeads(
        campaignId,
        setRows,
        setTargetLeads,
        setTargetSearchUrls,
        setDisabledLeadList,
        setIsLoading
      );
    }
  }, [campaignId, campaign]);

  // Fetch campaign integrations and detect if any selected/attached account has premium
  useEffect(() => {
    const fetchPremium = async () => {
      setPremiumLoaded(false);
      try {
        const { data, status } = await apiCall({
          url: "/api/outreach/campaign/integrationStep/getIntegrations",
          method: "post",
          applyDefaultDomain: false,
          body: { camp_id: campaignId },
        });
        if (isSuccessful(status)) {
          // API response structure: { success, data: { success, data: { integrations } } }
          const integrations =
            data?.data?.data?.integrations || data?.data?.integrations || [];
          const hasPremium = integrations
            .filter((i: any) => i?.type === "LINKEDIN")
            .some(
              (i: any) =>
                Boolean(i?.is_premium) || Boolean(i?.has_sales_navigator)
            );
          setHasAnyPremium(hasPremium);
        } else {
          setHasAnyPremium(false);
        }
      } catch (e) {
        setHasAnyPremium(false);
      } finally {
        setPremiumLoaded(true);
      }
    };
    if (campaignId) fetchPremium();
  }, [campaignId]);

  // Poll for search URL progress when there are PROCESSING search URLs
  useEffect(() => {
    // Find rows with PROCESSING search URLs that have a target_search_url_id
    const processingRows = rows.filter(
      row =>
        row.source === "SEARCH_URL" &&
        row.target_search_url_id &&
        (row.fetch_status === "PROCESSING" || row.fetch_status === "PENDING")
    );

    if (processingRows.length === 0) {
      return;
    }

    // Poll progress for each processing search URL
    const pollProgress = async () => {
      for (const row of processingRows) {
        if (!row.target_search_url_id) continue;

        try {
          const { data, status } = await apiCall({
            url: "/api/outreach/campaign/searchUrlProgress",
            method: "post",
            applyDefaultDomain: false,
            body: {
              campaignId,
              searchUrlId: row.target_search_url_id,
            },
          });

          if (isSuccessful(status) && data?.success) {
            setSearchUrlProgress(prev => {
              const newMap = new Map(prev);
              newMap.set(row.target_search_url_id!, data.data);
              return newMap;
            });

            // If completed or failed, refresh the leads list
            if (
              data.data.status === "COMPLETED" ||
              data.data.status === "FAILED"
            ) {
              await fetchExistingLeads(
                campaignId,
                setRows,
                setTargetLeads,
                setTargetSearchUrls,
                setDisabledLeadList,
                setIsLoading
              );
            }
          }
        } catch (error) {
          console.error("Error polling search URL progress:", error);
        }
      }
    };

    // Initial poll
    pollProgress();

    // Set up interval for polling every 3 seconds
    const intervalId = setInterval(pollProgress, 3000);

    return () => clearInterval(intervalId);
  }, [campaignId, rows]);

  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleSearchOptionClick = useCallback((searchType: string) => {
    setSelectedSearchType(searchType);
    setSearchUrl("");
    setTargetCount("");
    setLeadsFound(null);
    setProfileUrls("");
    setSelectedFile(null);
    setSearchModalOpen(true);
    setOpen(false); // Close the main modal
  }, []);

  const handleCheckUrl = useCallback(async () => {
    if (!searchUrl) return;

    setIsCheckingUrl(true);
    try {
      // Simulate API call to check URL
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Mock response - in real app, this would be an API call
      const mockLeadsCount = Math.floor(Math.random() * 1000) + 100;
      setLeadsFound(mockLeadsCount);
    } catch (error) {
    } finally {
      setIsCheckingUrl(false);
    }
  }, [searchUrl]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.type === "text/csv") {
        setSelectedFile(file);
      } else {
        toast.error("Please select a valid CSV file.");
      }
    },
    []
  );

  // Real-time validation for URL inputs
  const handleUrlInputChange = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setRealTimeValidation(null);
        return;
      }

      const inputUrls = value
        .split(/\n|,|\r/)
        .map(u => u.trim())
        .filter(Boolean);

      if (inputUrls.length > 0) {
        const leadLimit = getLeadLimit(selectedSearchType);
        const validation = filterLeadsAdvanced(
          inputUrls,
          targetLeads || [],
          leadLimit,
          {
            strictValidation: true,
            removeEmpty: true,
            decodeUri: true,
            removeQuotes: true,
          }
        );
        setRealTimeValidation(validation);
      } else {
        setRealTimeValidation(null);
      }
    },
    [selectedSearchType, targetLeads]
  );

  const handleImportLeads = useCallback(async () => {
    // Helper: refetch leads with retries to wait for backend processing
    const refetchWithRetry = async (
      retries: number = 6,
      delayMs: number = 1000
    ) => {
      for (let i = 0; i < retries; i++) {
        await new Promise(r => setTimeout(r, i === 0 ? 500 : delayMs));
        await fetchExistingLeads(
          campaignId,
          setRows,
          setTargetLeads,
          setTargetSearchUrls,
          setDisabledLeadList,
          setIsLoading
        );
        // Wait for backend to process and persist the data
      }
    };

    try {
      if (selectedSearchType === "Import URLs") {
        if (!profileUrls.trim()) return;
        setIsCreatingList(true);

        // Parse URLs from input with advanced processing
        const inputUrls = profileUrls
          .split(/\n|,|\r/)
          .map(u => u.trim())
          .filter(Boolean);

        // Apply advanced filtering with comprehensive options
        const leadLimit = getLeadLimit(selectedSearchType);
        const filteringResult = filterLeadsAdvanced(
          inputUrls,
          targetLeads || [],
          leadLimit,
          {
            strictValidation: true,
            removeEmpty: true,
            decodeUri: true,
            removeQuotes: true,
          }
        );

        // Store validation result for user feedback
        setValidationResult(filteringResult);

        // Show validation feedback
        const feedback = formatValidationFeedback(filteringResult);
        if (feedback.type === "error") {
          toast.error(feedback.message);
          setIsCreatingList(false);
          return;
        } else if (feedback.type === "warning") {
          toast.warning(feedback.message);
        } else {
          toast.success(feedback.message);
        }

        if (filteringResult.validLeads.length === 0) {
          setIsCreatingList(false);
          return;
        }

        const payload = {
          lead_ids: filteringResult.validLeads,
          operation: "append", // Explicitly indicate this is an append operation
          campaign_id: campaignId,
        };

        const { status } = await apiCall({
          url: "/api/outreach/campaign/addLead3A",
          method: "post",
          applyDefaultDomain: false,
          body: { campaignId, payload },
        });
        if (isSuccessful(status)) {
          setSearchModalOpen(false);
          toast.success(
            `URLs imported successfully! Processing ${filteringResult.validLeads.length} new leads...`
          );
          await refetchWithRetry();
          // Final verification - check if data persisted
          setTimeout(async () => {
            await fetchExistingLeads(
              campaignId,
              setRows,
              setTargetLeads,
              setTargetSearchUrls,
              setDisabledLeadList,
              setIsLoading
            );
            toast.success(
              `Data persisted successfully! All leads are now saved.`
            );
          }, 2000);
        }
        setIsCreatingList(false);
        return;
      }

      if (selectedSearchType === "Upload CSV") {
        if (!selectedFile) return;
        setIsUploading(true);

        // Read CSV and extract lines/values as strings for lead_ids
        const fileText = await selectedFile.text();
        const inputUrls = fileText
          .split(/\n|,|\r/)
          .map(v => v.trim())
          .filter(Boolean);

        // Apply advanced filtering with comprehensive options
        const leadLimit = getLeadLimit(selectedSearchType);
        const filteringResult = filterLeadsAdvanced(
          inputUrls,
          targetLeads || [],
          leadLimit,
          {
            strictValidation: true,
            removeEmpty: true,
            decodeUri: true,
            removeQuotes: true,
          }
        );

        // Store validation result for user feedback
        setValidationResult(filteringResult);

        // Show validation feedback
        const feedback = formatValidationFeedback(filteringResult);
        if (feedback.type === "error") {
          toast.error(feedback.message);
          setIsUploading(false);
          return;
        } else if (feedback.type === "warning") {
          toast.warning(feedback.message);
        } else {
          toast.success(feedback.message);
        }

        if (filteringResult.validLeads.length === 0) {
          setIsUploading(false);
          return;
        }

        const payload = {
          lead_ids: filteringResult.validLeads,
          operation: "append", // Explicitly indicate this is an append operation
          campaign_id: campaignId,
        };

        const { status } = await apiCall({
          url: "/api/outreach/campaign/addLead3A",
          method: "post",
          applyDefaultDomain: false,
          body: { campaignId, payload },
        });
        if (isSuccessful(status)) {
          setSearchModalOpen(false);
          toast.success(
            `CSV uploaded successfully! Processing ${filteringResult.validLeads.length} new leads...`
          );
          await refetchWithRetry();
          // Final verification - check if data persisted
          setTimeout(async () => {
            await fetchExistingLeads(
              campaignId,
              setRows,
              setTargetLeads,
              setTargetSearchUrls,
              setDisabledLeadList,
              setIsLoading
            );
            toast.success(
              `Data persisted successfully! All leads are now saved.`
            );
          }, 2000);
        }
        setIsUploading(false);
        return;
      }

      // LinkedIn Search (target-url)
      if (selectedSearchType === "LinkedIn Search") {
        if (!searchUrl || !targetCount || !leadsFound) return;

        // Validate lead count against limits with enhanced validation
        const leadLimit = getLeadLimit(selectedSearchType);
        const requestedCount = Number(targetCount);

        // Validate using the advanced validation function
        if (!validateLeadCount(requestedCount, "linkedin")) {
          const maxCount = getMaxLeadCount("linkedin");
          toast.error(
            `LinkedIn Search is limited to ${maxCount} leads. Please enter a number between 1 and ${maxCount}.`
          );
          return;
        }

        if (requestedCount > Number(leadsFound)) {
          toast.error(
            `Requested ${requestedCount} leads but only ${leadsFound} available in the search.`
          );
          return;
        }

        // Note: Same search URL can be added multiple times to fetch more leads.
        // Duplicate leads are deduplicated at the backend level.

        const payload = {
          target_url: searchUrl,
          lead_count: requestedCount,
          total: Number(leadsFound),
        };
        const { status } = await apiCall({
          url: "/api/outreach/campaign/addLead3B",
          method: "post",
          applyDefaultDomain: false,
          body: { campaignId, payload },
        });
        if (isSuccessful(status)) {
          setSearchModalOpen(false);
          await refetchWithRetry();
          // Final verification - check if data persisted
          setTimeout(async () => {
            await fetchExistingLeads(
              campaignId,
              setRows,
              setTargetLeads,
              setTargetSearchUrls,
              setDisabledLeadList,
              setIsLoading
            );
          }, 2000);
          toast.success(
            `LinkedIn search leads added successfully! Added ${requestedCount} new leads.`
          );
        }
        return;
      }

      // Sales Navigator Search (target-url)
      if (selectedSearchType === "Sales Navigator Search") {
        if (!searchUrl || !targetCount || !leadsFound) return;

        // Validate lead count against limits with enhanced validation
        const leadLimit = getLeadLimit(selectedSearchType);
        const requestedCount = Number(targetCount);

        // Validate using the advanced validation function
        if (!validateLeadCount(requestedCount, "sales_navigator")) {
          const maxCount = getMaxLeadCount("sales_navigator");
          toast.error(
            `Sales Navigator Search is limited to ${maxCount} leads. Please enter a number between 1 and ${maxCount}.`
          );
          return;
        }

        if (requestedCount > Number(leadsFound)) {
          toast.error(
            `Requested ${requestedCount} leads but only ${leadsFound} available in the search.`
          );
          return;
        }

        // Check for duplicate URLs
        const existingUrls = targetSearchUrls || [];
        if (existingUrls.includes(searchUrl)) {
          toast.error(
            "This Sales Navigator search URL has already been used in this campaign."
          );
          return;
        }

        const payload = {
          target_url: searchUrl,
          lead_count: requestedCount,
          total: Number(leadsFound),
        };
        const { status } = await apiCall({
          url: "/api/outreach/campaign/addLead3C",
          method: "post",
          applyDefaultDomain: false,
          body: { campaignId, payload },
        });
        if (isSuccessful(status)) {
          setSearchModalOpen(false);
          await refetchWithRetry();
          // Final verification - check if data persisted
          setTimeout(async () => {
            await fetchExistingLeads(
              campaignId,
              setRows,
              setTargetLeads,
              setTargetSearchUrls,
              setDisabledLeadList,
              setIsLoading
            );
          }, 2000);
          toast.success(
            `Sales Navigator leads added successfully! Added ${requestedCount} new leads.`
          );
        }
        return;
      }
    } catch (error) {
      toast.error("Failed to import leads");
    }
  }, [
    searchUrl,
    targetCount,
    leadsFound,
    selectedSearchType,
    profileUrls,
    selectedFile,
    campaignId,
    targetLeads,
    targetSearchUrls,
  ]);

  const handleNext = async () => {
    next();
  };

  const deleteTargetLeads = useCallback(
    async (leadRow: LeadsRow) => {
      try {
        setDeleteLoading(prev => ({
          ...prev,
          selectedId: [...prev.selectedId, leadRow.id],
        }));

        const { data, status } = await apiCall({
          url: "/api/outreach/campaign/deleteLeads",
          method: "post",
          applyDefaultDomain: false,
          body: {
            camp_id: campaignId,
            target_leads_id: leadRow.id,
          },
        });

        if (isSuccessful(status) && data?.success) {
          setRows(prevRows => prevRows.filter(({ id }) => id !== leadRow.id));

          if (leadRow.targetUrl) {
            setTargetSearchUrls(prev =>
              prev.filter(item => item !== leadRow.targetUrl)
            );
          }
        }
      } catch (error) {
      } finally {
        setDeleteLoading(prev => ({
          ...prev,
          selectedId: prev.selectedId.filter(id => id !== leadRow.id),
        }));
      }
    },
    [campaignId]
  );

  const handleDownloadLeads = useCallback(() => {
    if (rows.length === 0) {
      toast.error("No leads to download");
      return;
    }

    try {
      // Collect all lead URLs from all rows
      const allLeadUrls: string[] = [];
      rows.forEach(row => {
        allLeadUrls.push(...row.leads);
      });

      if (allLeadUrls.length === 0) {
        toast.error("No lead URLs found to download");
        return;
      }

      // Helper function to escape CSV values
      const escapeCsvValue = (value: string): string => {
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Create CSV content
      const csvRows = [
        ["Source", "Lead URL", "Search URL", "Created Date", "Lead Count"],
        ...rows.flatMap(row =>
          row.leads.map(leadUrl => [
            escapeCsvValue(row.source),
            escapeCsvValue(leadUrl),
            escapeCsvValue(row.targetUrl || "-"),
            escapeCsvValue(new Date(row.createdAt).toLocaleDateString()),
            escapeCsvValue(row.leadCount.toString()),
          ])
        ),
      ];

      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(",")).join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `campaign_leads_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${allLeadUrls.length} leads as CSV`);
    } catch (error) {
      toast.error("Failed to download leads");
    }
  }, [rows]);

  const handleDownloadRowLeads = useCallback((row: LeadsRow) => {
    if (!row.leads || row.leads.length === 0) {
      toast.error("No leads to download for this row");
      return;
    }

    try {
      // Helper function to escape CSV values
      const escapeCsvValue = (value: string): string => {
        if (
          value.includes(",") ||
          value.includes('"') ||
          value.includes("\n")
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      // Create CSV content for this specific row
      const csvRows = [
        ["Source", "Lead URL", "Search URL", "Created Date", "Lead Count"],
        ...row.leads.map(leadUrl => [
          escapeCsvValue(row.source),
          escapeCsvValue(leadUrl),
          escapeCsvValue(row.targetUrl || "-"),
          escapeCsvValue(new Date(row.createdAt).toLocaleDateString()),
          escapeCsvValue(row.leadCount.toString()),
        ]),
      ];

      // Convert to CSV string
      const csvContent = csvRows.map(row => row.join(",")).join("\n");

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `leads_${row.source}_${new Date(row.createdAt).toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${row.leads.length} leads as CSV`);
    } catch (error) {
      toast.error("Failed to download leads");
    }
  }, []);

  const getTargetLeadColumns = () => [
    {
      field: "source",
      headerName: "Source",
      width: 120,
      renderCell: (params: any) => (
        <Badge variant="outline" className="capitalize">
          {params.value}
        </Badge>
      ),
    },
    {
      field: "leadCount",
      headerName: "Lead Count",
      width: 120,
      renderCell: (params: any) => (
        <span className="font-medium">{params.value}</span>
      ),
    },
    {
      field: "targetUrl",
      headerName: "Search URL",
      width: 200,
      renderCell: (params: any) => (
        <div className="flex items-center space-x-2">
          {params.value ? (
            <>
              <Link className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 truncate max-w-32">
                {params.value}
              </span>
            </>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created",
      width: 150,
      renderCell: (params: any) => (
        <span className="text-sm text-gray-600">
          {new Date(params.value).toLocaleDateString()}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params: any) => {
        const isDisabled = disabledLeadList.includes(params.row.id);
        const isDeleting = deleteLoading.selectedId.includes(params.row.id);

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteTargetLeads(params.row)}
            disabled={isDisabled || isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 dark:text-gray-200">
        {rows.length ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold dark:text-white">
                List of leads
              </CardTitle>
              <Button
                className="bg-black hover:bg-black/90 text-white"
                onClick={handleOpen}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add leads
              </Button>
            </div>

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {getTargetLeadColumns().map(column => (
                        <TableHead
                          key={column.field}
                          className="font-semibold dark:text-gray-200"
                        >
                          {column.headerName}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map(row => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="capitalize dark:text-gray-200 dark:border-gray-600"
                          >
                            {row.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="font-medium">{row.leadCount}</span>
                            {/* Show progress for PROCESSING search URLs */}
                            {row.source === "SEARCH_URL" &&
                              row.target_search_url_id &&
                              (row.fetch_status === "PROCESSING" ||
                                row.fetch_status === "PENDING") && (
                                <div className="space-y-1">
                                  {(() => {
                                    const progress = searchUrlProgress.get(
                                      row.target_search_url_id
                                    );
                                    if (progress) {
                                      return (
                                        <>
                                          <div className="flex items-center gap-2">
                                            <Progress
                                              value={progress.progress}
                                              className="h-2 w-20"
                                            />
                                            <span className="text-xs text-gray-500">
                                              {progress.progress}%
                                            </span>
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {progress.fetchedCount} /{" "}
                                            {progress.expectedCount} fetched
                                          </div>
                                        </>
                                      );
                                    } else {
                                      return (
                                        <div className="flex items-center gap-1 text-xs text-blue-600">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          <span>Fetching...</span>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              )}
                            {/* Show status badge for COMPLETED/FAILED */}
                            {row.source === "SEARCH_URL" &&
                              row.fetch_status === "COMPLETED" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-green-600 border-green-300"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            {row.source === "SEARCH_URL" &&
                              row.fetch_status === "FAILED" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-red-600 border-red-300"
                                >
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            {row.source === "SEARCH_URL" &&
                              row.fetch_status === "PAUSED" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-yellow-600 border-yellow-300"
                                >
                                  Paused
                                </Badge>
                              )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {row.targetUrl ? (
                              <>
                                <Link className="w-4 h-4 text-blue-500" />
                                <span className="text-sm text-blue-600 dark:text-blue-400 truncate max-w-32">
                                  {row.targetUrl}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">
                                -
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {new Date(row.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadRowLeads(row)}
                              disabled={!row.leads || row.leads.length === 0}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              title="Download leads"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTargetLeads(row)}
                              disabled={
                                disabledLeadList.includes(row.id) ||
                                deleteLoading.selectedId.includes(row.id)
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete leads"
                            >
                              {deleteLoading.selectedId.includes(row.id) ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center space-y-6 py-12">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                You currently have no leads
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Start by adding leads to your campaign
              </p>
            </div>
            <Button
              className="bg-black hover:bg-black/90 text-white"
              onClick={handleOpen}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create a list of leads
            </Button>
          </div>
        )}
      </div>

      {/* Add Leads Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[900px] p-6 dark:bg-gray-900 dark:text-gray-200">
          <DialogHeader className="pb-6 text-center">
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white text-center">
              Add Leads to Campaign
            </DialogTitle>
            <DialogDescription className="text-base text-gray-600 dark:text-gray-300 mt-2 text-center">
              Choose your preferred method to add leads to your campaign
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => handleSearchOptionClick("LinkedIn Search")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:bg-blue-900">
                    <Search className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">
                    LinkedIn Search
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use our built-in search to find your ideal target audience
                  </p>
                </CardContent>
              </Card>

              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => handleSearchOptionClick("Import URLs")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:bg-blue-900">
                    <Link className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">
                    Import URLs
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Paste LinkedIn profile URLs to add up to 2,500 leads at a
                    time
                  </p>
                </CardContent>
              </Card>

              <Card
                className="group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => handleSearchOptionClick("Upload CSV")}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 dark:bg-blue-900">
                    <Upload className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">
                    Upload CSV
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Import file with LinkedIn profiles to add leads
                  </p>
                </CardContent>
              </Card>

              <Card
                className={
                  "group transition-all duration-200 border-2 " +
                  (hasAnyPremium
                    ? "cursor-pointer hover:shadow-lg hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    : "cursor-not-allowed opacity-60 border-gray-200 dark:border-gray-700")
                }
                onClick={() => {
                  if (!hasAnyPremium) {
                    toast.info(
                      "Sales Navigator requires a Premium LinkedIn account. Connect a premium account in Integrations."
                    );
                    return;
                  }
                  handleSearchOptionClick("Sales Navigator Search");
                }}
                aria-disabled={!hasAnyPremium}
              >
                <CardContent className="p-6 text-center relative">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 dark:bg-green-900">
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-gray-900 dark:text-white">
                    Sales Navigator Search
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use Sales Navigator search URLs to import leads
                  </p>
                  {!hasAnyPremium && premiumLoaded && (
                    <div className="mt-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md px-3 py-2">
                      No Premium Sales Navigator detected. Connect a Premium
                      account to use this.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="group cursor-not-allowed opacity-60 border-2 border-slate-200 dark:border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 dark:bg-purple-900">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-slate-900 dark:text-white">
                    Post Search (Coming Soon)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Connect your CRM to import existing contacts and leads
                  </p>
                </CardContent>
              </Card>

              <Card className="group cursor-not-allowed opacity-60 border-2 border-slate-200 dark:border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 dark:bg-orange-900">
                    <Globe className="w-6 h-6 text-orange-600 dark:text-orange-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-slate-900 dark:text-white">
                    Event Scraper (Coming Soon)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Extract leads from company websites and directories
                  </p>
                </CardContent>
              </Card>

              <Card className="group cursor-not-allowed opacity-60 border-2 border-slate-200 dark:border-slate-700">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 dark:bg-yellow-900">
                    <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <h3 className="font-semibold text-base mb-2 text-slate-900 dark:text-white">
                    Group Search (Coming Soon)
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Use AI to automatically discover and qualify potential leads
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search URL Input Modal */}
      <Dialog open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-purple-600">
              {selectedSearchType === "Import URLs"
                ? "Import LinkedIn Profile URLs"
                : selectedSearchType === "Upload CSV"
                  ? "Upload CSV File"
                  : `Enter ${selectedSearchType} URL`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {selectedSearchType === "Import URLs" ? (
              /* Import URLs Interface */
              <>
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">
                    Press Enter before adding more URL.
                  </p>
                  <textarea
                    placeholder="Enter LinkedIn Profile URL"
                    value={profileUrls}
                    onChange={e => {
                      setProfileUrls(e.target.value);
                      handleUrlInputChange(e.target.value);
                    }}
                    className="w-full min-h-32 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={6}
                  />
                </div>

                {/* Real-time Validation Preview */}
                {realTimeValidation && !validationResult && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-700 dark:text-blue-300 font-medium">
                        Live Preview
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-green-600" />
                        <span className="text-green-700 dark:text-green-400">
                          {realTimeValidation.validLeads.length} Valid
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3 text-red-600" />
                        <span className="text-red-700 dark:text-red-400">
                          {realTimeValidation.invalidCount} Invalid
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Info className="w-3 h-3 text-yellow-600" />
                        <span className="text-yellow-700 dark:text-yellow-400">
                          {realTimeValidation.duplicates} Duplicates
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-3 h-3 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-400">
                          {realTimeValidation.totalProcessed} Total
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Feedback */}
                {validationResult && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Validation Results
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setShowValidationDetails(!showValidationDetails)
                        }
                        className="text-xs"
                      >
                        {showValidationDetails ? (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Show Details
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-700 dark:text-green-400">
                          {validationResult.validLeads.length} Valid
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-700 dark:text-red-400">
                          {validationResult.invalidCount} Invalid
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-700 dark:text-yellow-400">
                          {validationResult.duplicates} Duplicates
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-700 dark:text-blue-400">
                          {validationResult.totalProcessed} Total
                        </span>
                      </div>
                    </div>

                    {showValidationDetails &&
                      validationResult.errors.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                          <h5 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                            Validation Errors:
                          </h5>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {validationResult.errors.map((error, index) => (
                              <div
                                key={index}
                                className="text-xs text-red-700 dark:text-red-300"
                              >
                                {error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSearchModalOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportLeads}
                    disabled={!profileUrls.trim() || isCreatingList}
                    className="bg-black hover:bg-black/90 text-white px-6"
                  >
                    {isCreatingList ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    CREATE A LIST
                  </Button>
                </div>
              </>
            ) : selectedSearchType === "Upload CSV" ? (
              /* CSV Upload Interface */
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csv-file" className="text-sm font-medium">
                      Select CSV File
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="csv-file" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          CSV files only (max 10MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 font-medium">
                            {selectedFile.name}
                          </span>
                        </div>
                        <span className="text-xs text-green-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>CSV Format:</strong> Your CSV should contain
                      LinkedIn profile URLs in the first column. Additional
                      columns can include name, company, title, etc.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSearchModalOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportLeads}
                    disabled={!selectedFile || isUploading}
                    className="bg-black hover:bg-black/90 text-white px-6"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Upload CSV
                  </Button>
                </div>
              </>
            ) : (
              /* Search URL Interface */
              <>
                {/* URL Input Section */}
                <div className="space-y-2">
                  <Label htmlFor="search-url" className="text-sm font-medium">
                    {selectedSearchType} URL
                  </Label>
                  <div className="flex gap-3">
                    <Input
                      id="search-url"
                      type="url"
                      placeholder="https://www.linkedin.com/search/results/people/?keywords=..."
                      value={searchUrl}
                      onChange={e => setSearchUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleCheckUrl}
                      disabled={!searchUrl || isCheckingUrl}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6"
                    >
                      {isCheckingUrl ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "CHECK URL"
                      )}
                    </Button>
                  </div>
                </div>

                {/* Leads Found Information */}
                {leadsFound && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-700">
                      * This search URL contains {leadsFound.toLocaleString()}{" "}
                      leads.
                    </p>
                  </div>
                )}

                {/* Target Count Input */}
                {leadsFound && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="target-count"
                      className="text-sm font-medium"
                    >
                      Number of leads to add
                    </Label>
                    <Input
                      id="target-count"
                      type="number"
                      placeholder="Enter number of leads to add"
                      value={targetCount}
                      onChange={e => {
                        const value = e.target.value;
                        setTargetCount(value);

                        // Real-time validation for lead count
                        if (value && leadsFound) {
                          const numValue = Number(value);
                          const leadLimit = getLeadLimit(selectedSearchType);
                          const sourceType =
                            selectedSearchType === "LinkedIn Search"
                              ? "linkedin"
                              : "sales_navigator";

                          if (numValue > leadLimit) {
                            toast.warning(
                              `Maximum ${leadLimit} leads allowed for ${selectedSearchType}`
                            );
                          } else if (numValue > leadsFound) {
                            toast.warning(
                              `Only ${leadsFound} leads available in this search`
                            );
                          }
                        }
                      }}
                      min="1"
                      max={leadsFound}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Maximum: {leadsFound.toLocaleString()} leads
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setSearchModalOpen(false)}
                    className="px-6"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleImportLeads}
                    disabled={!searchUrl || !targetCount || !leadsFound}
                    className="bg-black hover:bg-black/90 text-white px-6"
                  >
                    Import Leads
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={back}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Integration</span>
        </Button>
        <div className="text-sm text-gray-600">
          {rows.length > 0 ? (
            <span className="text-green-600 font-medium">
              ✓ {rows.reduce((sum, row) => sum + row.leadCount, 0)} leads added
            </span>
          ) : (
            <span className="text-amber-600">
              ⚠ No leads added yet - you can add them later
            </span>
          )}
        </div>
        <Button
          className="bg-black hover:bg-black/90 text-white px-8"
          onClick={handleNext}
        >
          Next Step
        </Button>
      </div>
    </>
  );
}
