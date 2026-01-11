"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Building,
  Mail,
  Phone,
  Linkedin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Target,
  Eye,
  Thermometer,
  CheckCircle,
  XCircle,
  Globe,
  Search,
  X,
  Settings,
} from "lucide-react";
import { Contact, Company, FilterState } from "../../types/sales-types";
import contactService from "../../services/sales-services/contactService";
import companyService from "../../services/sales-services/companyService";
import pipelineService from "../../services/sales-services/pipelineService";
import type {
  PipelineCategory,
  Pipeline,
  PipelineStage,
  PipelineMap,
  CreatePipelineMapDto,
} from "../../services/sales-services/pipelineService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import { useCountsContext } from "../../contexts/sales-contexts/CountsContext";
import { useDetailPanel } from "../../contexts/sales-contexts/DetailPanelContext";
import NestedFilterDropdown from "./NestedFilterDropdown";
import SearchableDropdown from "./SearchableDropdown";

interface PipelineItem {
  id: string;
  type: "contact" | "company";
  data: Contact | Company;
  status: string;
  pipelineMapId?: string;
}

interface PipelineColumn {
  id: string;
  title: string;
  items: PipelineItem[];
  color: string;
  bgColor: string;
  stage: PipelineStage;
}

const Pipeline: React.FC = () => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { counts } = useCountsContext();
  const { openLeadDetail, openCompanyDetail } = useDetailPanel();

  // Pipeline selection states
  const [pipelineCategories, setPipelineCategories] = useState<
    PipelineCategory[]
  >([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<PipelineCategory | null>(null);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(
    null
  );
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [pipelineMaps, setPipelineMaps] = useState<PipelineMap[]>([]);

  // Data states
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<Record<string, PipelineColumn>>({});
  const [draggedItem, setDraggedItem] = useState<PipelineItem | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // UI states
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedStageForAdd, setSelectedStageForAdd] = useState<string | null>(
    null
  );
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [companySearchTerm, setCompanySearchTerm] = useState("");
  const [contactSearchFocused, setContactSearchFocused] = useState(false);
  const [companySearchFocused, setCompanySearchFocused] = useState(false);
  const [contactDropdownVisible, setContactDropdownVisible] = useState(false);
  const [companyDropdownVisible, setCompanyDropdownVisible] = useState(false);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: [],
    priority: [],
    tags: [],
    owner: [],
    connection: [],
    dateRange: {},
    valueRange: [],
  });

  // Available filter options
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableOwners, setAvailableOwners] = useState<string[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  // Dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdownId &&
        !(event.target as Element).closest(".dropdown-container")
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdownId]);

  // Selected filter chips helpers
  const buildSelectedChips = useCallback((): Array<{
    key: keyof FilterState;
    value?: string;
    label: string;
  }> => {
    const chips: Array<{
      key: keyof FilterState;
      value?: string;
      label: string;
    }> = [];

    const pushArray = (key: keyof FilterState, values?: string[]) => {
      if (Array.isArray(values)) {
        values.forEach(v =>
          chips.push({ key, value: v, label: `${String(key)}: ${v}` })
        );
      }
    };

    pushArray("status", filters.status);
    pushArray("priority", filters.priority);
    pushArray("tags", filters.tags);
    pushArray("owner", filters.owner);
    pushArray("connection", filters.connection as string[]);
    pushArray("industry", filters.industry as string[]);
    pushArray("source", filters.source as string[]);
    pushArray("leadType", filters.leadType as string[]);
    pushArray("leadScore", filters.leadScore as string[]);

    // Date range chip
    if (
      filters.dateRange &&
      (filters.dateRange.selectedOption ||
        (filters.dateRange as any).start ||
        (filters.dateRange as any).end)
    ) {
      const { selectedOption, start, end } = filters.dateRange as any;
      let label = "dateRange: ";
      if (selectedOption) label += String(selectedOption);
      else if (start || end) {
        const fmt = (d?: Date) => (d ? new Date(d).toLocaleDateString() : "");
        label += `${fmt(start)}${start && end ? " - " : ""}${fmt(end)}`;
      }
      chips.push({ key: "dateRange", label });
    }

    return chips;
  }, [filters]);

  const removeFilterChip = useCallback(
    (key: keyof FilterState, value?: string) => {
      if (key === "dateRange") {
        setFilters(prev => ({ ...prev, dateRange: {} }));
        return;
      }
      setFilters(prev => {
        const current = (prev[key] as string[]) || [];
        const next = value ? current.filter(v => v !== value) : [];
        return { ...prev, [key]: next } as FilterState;
      });
    },
    []
  );

  // Filtering logic applied to each pipeline item
  const matchesFilters = useCallback(
    (item: PipelineItem): boolean => {
      const entity: any = item.data as any;

      // Search filter (name, email, industry, phone, website)
      if (filters.search && filters.search.trim() !== "") {
        const q = filters.search.trim().toLowerCase();
        const haystack = [
          entity.name,
          entity.email,
          entity.phoneNumber,
          entity.industry,
          entity.websiteUrl,
        ]
          .filter(Boolean)
          .map((v: string) => v.toLowerCase());

        const inTags = Array.isArray(entity.tags)
          ? entity.tags
              .map((t: any) =>
                (t?.tag?.name ?? t?.name ?? "").toString().toLowerCase()
              )
              .some((n: string) => n.includes(q))
          : false;

        if (!haystack.some((v: string) => v.includes(q)) && !inTags) {
          return false;
        }
      }

      // Status filter
      if (Array.isArray(filters.status) && filters.status.length > 0) {
        const currentStatus: string | undefined = item.status || entity.status;
        if (!currentStatus || !filters.status.includes(currentStatus)) {
          return false;
        }
      }

      // Priority filter
      if (Array.isArray(filters.priority) && filters.priority.length > 0) {
        const currentPriority: string | undefined = entity.priority;
        if (!currentPriority || !filters.priority.includes(currentPriority)) {
          return false;
        }
      }

      // Tags filter (at least one tag must match)
      if (Array.isArray(filters.tags) && filters.tags.length > 0) {
        const tagNames: string[] = Array.isArray(entity.tags)
          ? entity.tags
              .map((t: any) => (t?.tag?.name ?? t?.name ?? "").toString())
              .filter((n: string) => n)
          : [];
        if (tagNames.length === 0) return false;
        const intersects = tagNames.some((t: string) =>
          filters.tags.includes(t)
        );
        if (!intersects) return false;
      }

      // Owner filter
      if (Array.isArray(filters.owner) && filters.owner.length > 0) {
        const ownerName: string = entity?.owner?.name ?? "Unassigned";
        if (!filters.owner.includes(ownerName)) return false;
      }

      // Connection filter (if entity exposes a connection field)
      if (Array.isArray(filters.connection) && filters.connection.length > 0) {
        const connectionVal: string | undefined =
          entity?.connection ?? entity?.connectionStatus;
        if (!connectionVal || !filters.connection.includes(connectionVal))
          return false;
      }

      // Date range filter (defaults to createdAt if field unspecified)
      const dateRange: any = filters.dateRange as any;
      if (dateRange && (dateRange.from || dateRange.to)) {
        const field: string = dateRange.field || "createdAt";
        const value = entity?.[field] ?? entity?.createdAt;
        if (!value) return false;
        const d = new Date(value);
        if (dateRange.from && d < new Date(dateRange.from)) return false;
        if (dateRange.to && d > new Date(dateRange.to)) return false;
      }

      // Value range filter (applies to leadScore if present, else "value")
      if (
        Array.isArray(filters.valueRange) &&
        filters.valueRange.length === 2
      ) {
        const [min, max] = filters.valueRange as unknown as [
          number | undefined,
          number | undefined,
        ];
        const numeric: number | undefined =
          typeof entity.leadScore === "number"
            ? entity.leadScore
            : typeof entity.value === "number"
              ? entity.value
              : undefined;
        // If filtering by value range and entity has no numeric value, exclude
        if (numeric === undefined) return false;
        if (typeof min === "number" && numeric < min) return false;
        if (typeof max === "number" && numeric > max) return false;
      }

      return true;
    },
    [filters]
  );

  // Load pipeline categories and pipelines
  const loadPipelineData = useCallback(async () => {
    if (!selectedWorkspace) return;

    try {
      const [categoriesData, pipelinesData] = await Promise.all([
        pipelineService.getPipelineCategories(
          selectedWorkspace.id,
          selectedOrganization?.id
        ),
        pipelineService.getPipelines(
          selectedWorkspace.id,
          selectedOrganization?.id
        ),
      ]);

      setPipelineCategories(categoriesData);
      setPipelines(pipelinesData);

      // Auto-select first category and pipeline if available
      if (categoriesData.length > 0 && !selectedCategory) {
        const firstCategory = categoriesData[0];
        setSelectedCategory(firstCategory);

        const categoryPipelines = pipelinesData.filter(
          p => p.pipelineCategoryId === firstCategory.id
        );
        if (categoryPipelines.length > 0) {
          setSelectedPipeline(categoryPipelines[0]);
        }
      }
    } catch (err) {
      setError("Failed to load pipeline data");
    }
  }, [selectedWorkspace, selectedOrganization, selectedCategory]);

  // Load pipeline stages and maps when pipeline is selected
  const loadPipelineStagesAndMaps = useCallback(async () => {
    if (!selectedWorkspace || !selectedPipeline) {
      return;
    }

    try {
      const [stagesData, mapsData] = await Promise.all([
        pipelineService.getPipelineStages(
          selectedWorkspace.id,
          selectedPipeline.id
        ),
        pipelineService.getPipelineMaps(
          selectedWorkspace.id,
          selectedPipeline.id
        ),
      ]);

      setPipelineStages(stagesData);
      setPipelineMaps(mapsData);
    } catch (err) {
      setError("Failed to load pipeline stages");
    }
  }, [selectedWorkspace, selectedPipeline]);

  // Load contacts and companies
  const loadContactsAndCompanies = useCallback(async () => {
    if (!selectedWorkspace || !selectedOrganization) return;

    try {
      const token = localStorage.getItem("crm_access_token");
      if (!token) {
        setError("No authentication token found");
        return;
      }

      const [contactsResponse, companiesResponse] = await Promise.all([
        contactService.getContacts(
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        ),
        companyService.getCompanies(
          selectedWorkspace.id,
          selectedOrganization.id,
          token
        ),
      ]);

      if (contactsResponse.success && contactsResponse.data) {
        setContacts(contactsResponse.data);
      }

      if (companiesResponse.success && companiesResponse.data) {
        setCompanies(companiesResponse.data);
      }

      // Extract filter options
      const allContacts = contactsResponse.success
        ? contactsResponse.data || []
        : [];
      const allCompanies = companiesResponse.success
        ? companiesResponse.data || []
        : [];

      const contactTags = allContacts.flatMap(
        contact =>
          contact.tags?.map(
            (tag: Record<string, unknown>) => (tag.tag as { name: string }).name
          ) || []
      );
      const companyTags = allCompanies.flatMap(
        company =>
          company.tags?.map(
            (tag: Record<string, unknown>) => (tag.tag as { name: string }).name
          ) || []
      );
      const uniqueTags = [...new Set([...contactTags, ...companyTags])];
      setAvailableTags(uniqueTags);

      const contactOwners = allContacts.map(
        contact => contact.owner?.name || "Unassigned"
      );
      const companyOwners = allCompanies.map(
        company => company.owner?.name || "Unassigned"
      );
      const uniqueOwners = [...new Set([...contactOwners, ...companyOwners])];
      setAvailableOwners(uniqueOwners);

      const contactStatuses = allContacts.map(contact => contact.status);
      const companyStatuses = allCompanies.map(company => company.status);
      const uniqueStatuses = [
        ...new Set([...contactStatuses, ...companyStatuses]),
      ];
      setAvailableStatuses(uniqueStatuses);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace, selectedOrganization]);

  // Initialize data
  useEffect(() => {
    loadPipelineData();
  }, [loadPipelineData]);

  useEffect(() => {
    loadPipelineStagesAndMaps();
  }, [loadPipelineStagesAndMaps]);

  useEffect(() => {
    loadContactsAndCompanies();
  }, [loadContactsAndCompanies]);

  // Create columns from pipeline stages and organize pipeline maps
  useEffect(() => {
    if (pipelineStages.length === 0) {
      setColumns({});
      return;
    }

    const newColumns: Record<string, PipelineColumn> = {};

    // Create columns from pipeline stages
    pipelineStages.forEach((stage, index) => {
      const colors = [
        {
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-700",
        },
        {
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-900/30",
        },
        {
          color: "text-orange-600 dark:text-orange-400",
          bgColor: "bg-orange-50 dark:bg-orange-900/30",
        },
        {
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-50 dark:bg-purple-900/30",
        },
        {
          color: "text-indigo-600 dark:text-indigo-400",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/30",
        },
        {
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-900/30",
        },
        {
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-700",
        },
      ];

      const colorIndex = index % colors.length;

      newColumns[stage.id] = {
        id: stage.id,
        title: stage.name,
        items: [],
        color: colors[colorIndex].color,
        bgColor: colors[colorIndex].bgColor,
        stage: stage,
      };
    });

    // Organize pipeline maps into columns if available
    if (pipelineMaps.length > 0) {
      pipelineMaps.forEach(map => {
        const stageId = map.stageId;
        if (newColumns[stageId]) {
          // Find the corresponding contact or company
          let item: PipelineItem | null = null;

          if (map.contactId) {
            const contact = contacts.find(c => c.id === map.contactId);
            if (contact) {
              item = {
                id: `contact-${contact.id}`,
                type: "contact",
                data: contact,
                status: contact.status,
                pipelineMapId: map.id,
              };
            }
          } else if (map.companyId) {
            const company = companies.find(c => c.id === map.companyId);
            if (company) {
              item = {
                id: `company-${company.id}`,
                type: "company",
                data: company,
                status: company.status,
                pipelineMapId: map.id,
              };
            }
          }

          if (item && matchesFilters(item)) {
            newColumns[stageId].items.push(item);
          }
        }
      });
    }

    setColumns(newColumns);
  }, [pipelineStages, pipelineMaps, contacts, companies, matchesFilters]);

  // Handle category selection
  const handleCategorySelect = (category: PipelineCategory) => {
    setSelectedCategory(category);

    // Filter pipelines for this category
    const categoryPipelines = pipelines.filter(
      p => p.pipelineCategoryId === category.id
    );
    if (categoryPipelines.length > 0) {
      setSelectedPipeline(categoryPipelines[0]);
    } else {
      setSelectedPipeline(null);
    }
  };

  // Handle pipeline selection
  const handlePipelineSelect = (pipeline: Pipeline) => {
    setSelectedPipeline(pipeline);
  };

  // Add item to pipeline stage
  const handleAddItemToStage = async (stageId: string) => {
    setSelectedStageForAdd(stageId);
    setShowAddItemModal(true);
  };

  // Add item to pipeline
  const handleAddItemToPipeline = async (
    itemId: string,
    type: "contact" | "company"
  ) => {
    if (!selectedPipeline || !selectedStageForAdd) return;

    try {
      const mapData: CreatePipelineMapDto = {
        pipelineId: selectedPipeline.id,
        stageId: selectedStageForAdd,
        ...(type === "contact" ? { contactId: itemId } : { companyId: itemId }),
      };

      await pipelineService.createPipelineMap(mapData);

      // Reload pipeline maps
      await loadPipelineStagesAndMaps();

      setShowAddItemModal(false);
      setSelectedStageForAdd(null);
    } catch (error) {}
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: PipelineItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", item.id);
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedItem || !draggedItem.pipelineMapId) {
      setDraggedItem(null);
      return;
    }

    try {
      // Update pipeline map
      await pipelineService.movePipelineMap(
        draggedItem.pipelineMapId,
        newStageId,
        selectedWorkspace!.id,
        selectedOrganization?.id
      );

      // Reload pipeline maps
      await loadPipelineStagesAndMaps();
    } catch (error) {
    } finally {
      setDraggedItem(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "lead":
        return <Target className="w-3 h-3 text-yellow-600" />;
      case "interested":
        return <Eye className="w-3 h-3 text-indigo-600" />;
      case "warm":
        return <Thermometer className="w-3 h-3 text-orange-600" />;
      case "engaged":
        return <MessageCircle className="w-3 h-3 text-purple-600" />;
      case "prospect":
        return <Users className="w-3 h-3 text-blue-600" />;
      case "customer":
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case "closed":
        return <XCircle className="w-3 h-3 text-gray-500" />;
      default:
        return <Target className="w-3 h-3 text-blue-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              loadPipelineData();
              loadContactsAndCompanies();
            }}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Pipeline
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage your leads and companies across the sales pipeline
            </p>
          </div>
        </div>

        {/* Pipeline Selection */}
        <div className="flex items-center space-x-4">
          {/* Category Dropdown */}
          <SearchableDropdown
            items={pipelineCategories}
            selectedItem={selectedCategory}
            onSelect={handleCategorySelect}
            placeholder="Select Category"
            searchPlaceholder="Search categories..."
            getDisplayValue={category => {
              const categoryCount =
                counts.pipeline?.categoryCounts?.[category.id];
              const count = categoryCount ? categoryCount.totalUnique : 0;
              return `${category.name} (${count})`;
            }}
            className="w-50"
          />

          {/* Pipeline Dropdown */}
          {selectedCategory && (
            <SearchableDropdown
              items={pipelines.filter(
                p => p.pipelineCategoryId === selectedCategory.id
              )}
              selectedItem={selectedPipeline}
              onSelect={handlePipelineSelect}
              placeholder="Select Pipeline"
              searchPlaceholder="Search pipelines..."
              getDisplayValue={pipeline => {
                const pipelineCount =
                  counts.pipeline?.pipelineCounts?.[pipeline.id];
                const count = pipelineCount ? pipelineCount.totalUnique : 0;
                return `${pipeline.name} (${count})`;
              }}
              className="w-50"
            />
          )}

          {/* Settings */}
          <button className="p-2 text-gray-400 dark:text-gray-500 rounded-md hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {/* Row 1: Left search, right dropdowns */}
        <div className="flex justify-between items-center">
          {/* Left: Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search contacts and companies..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              className="block py-2 pr-3 pl-10 w-full leading-5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 rounded-md border border-gray-300 dark:border-gray-600 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 sm:text-sm"
            />
          </div>

          {/* Right: Filter Dropdowns */}
          <div className="flex items-center space-x-2">
            <NestedFilterDropdown
              filters={filters}
              onUpdateFilters={setFilters}
              availableTags={availableTags}
              availableOwners={availableOwners}
              availableStatuses={availableStatuses}
              entityType="leads"
            />
          </div>
        </div>

        {/* Row 2: Selected filter chips pinned under bar */}
        <div className="flex flex-wrap gap-2 mt-3">
          {buildSelectedChips().map(chip => (
            <span
              key={`${String(chip.key)}-${chip.value ?? "date"}`}
              className="inline-flex items-center px-2 py-1 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 rounded-full border border-blue-300 dark:border-blue-700"
            >
              {chip.label}
              <button
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                onClick={() => removeFilterChip(chip.key, chip.value)}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Pipeline Board */}
      {selectedPipeline ? (
        <div className="overflow-x-auto flex-1">
          <div className="flex p-6 space-x-6 h-full">
            {Object.values(columns).map(column => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div
                  className={`h-full rounded-lg border-2 border-dashed transition-colors ${
                    dragOverColumn === column.id
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-gray-200 dark:border-gray-600"
                  }`}
                  onDragOver={e => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, column.id)}
                >
                  {/* Column Header */}
                  <div className={`p-4 ${column.bgColor} rounded-t-lg`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(column.title.toLowerCase())}
                        <h3 className={`font-semibold ${column.color}`}>
                          {column.title}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-white dark:bg-gray-800 rounded-full">
                          {column.items.length}
                        </span>
                      </div>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600"
                        onClick={() => handleAddItemToStage(column.id)}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-b-lg min-h-[calc(100vh-200px)]">
                    {column.items.length === 0 ? (
                      <div className="flex flex-col justify-center items-center h-32 text-gray-400">
                        <Target className="mb-2 w-8 h-8" />
                        <p className="text-sm">No items</p>
                      </div>
                    ) : (
                      column.items.map(item => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={e => handleDragStart(e, item)}
                          className={`p-4 mb-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm cursor-move transition-all duration-200 hover:shadow-md ${
                            draggedItem?.id === item.id ? "opacity-50" : ""
                          }`}
                        >
                          {/* Header */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(item.status)}
                              {item.type === "contact" ? (
                                <Users className="w-4 h-4 text-blue-500" />
                              ) : (
                                <Building className="w-4 h-4 text-green-500" />
                              )}
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                {item.type === "contact"
                                  ? "Contact"
                                  : "Company"}
                              </span>
                            </div>
                            <div className="relative dropdown-container">
                              <button
                                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-md transition-all duration-200 ease-in-out"
                                onClick={() =>
                                  setOpenDropdownId(
                                    openDropdownId === item.id ? null : item.id
                                  )
                                }
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu */}
                              {openDropdownId === item.id && (
                                <div
                                  className="absolute right-0 z-50 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg transition-all duration-200 ease-in-out"
                                  style={{
                                    animation:
                                      "dropdownSlideIn 0.2s ease-out forwards",
                                    opacity: 0,
                                    transform: "translateY(-10px) scale(0.95)",
                                  }}
                                >
                                  <button
                                    className="px-3 py-2 w-full text-xs text-left text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                    onClick={() => {
                                      if (item.type === "contact") {
                                        openLeadDetail(item.data as Contact);
                                      } else {
                                        openCompanyDetail(item.data as Company);
                                      }
                                      setOpenDropdownId(null);
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Eye className="w-3 h-3" />
                                      <span>View Details</span>
                                    </div>
                                  </button>
                                  <button
                                    className="px-3 py-2 w-full text-xs text-left text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30"
                                    onClick={async () => {
                                      if (
                                        item.pipelineMapId &&
                                        selectedWorkspace &&
                                        selectedOrganization
                                      ) {
                                        try {
                                          await pipelineService.deletePipelineMap(
                                            item.pipelineMapId,
                                            selectedWorkspace.id,
                                            selectedOrganization.id
                                          );
                                          // Reload pipeline maps to reflect the change
                                          await loadPipelineStagesAndMaps();
                                          setOpenDropdownId(null);
                                        } catch (error) {
                                          // Error is already handled by toast service
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <X className="w-3 h-3" />
                                      <span>Remove from Pipeline</span>
                                    </div>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Name and Avatar */}
                          <div className="flex items-center mb-3 space-x-3">
                            <div className="flex justify-center items-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full">
                              <span className="text-sm font-bold text-white">
                                {item.data.name?.charAt(0).toUpperCase() || "?"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {item.data.name || "Unnamed"}
                              </h3>
                              {item.type === "contact" &&
                                (item.data as Contact).email && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {(item.data as Contact).email}
                                  </p>
                                )}
                              {item.type === "company" &&
                                (item.data as Company).industry && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {(item.data as Company).industry}
                                  </p>
                                )}
                            </div>
                          </div>

                          {/* Tags and Priority */}
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex space-x-1">
                              {item.type === "contact" &&
                                (item.data as Contact).leadType && (
                                  <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
                                    {(item.data as Contact).leadType}
                                  </span>
                                )}
                              {item.type === "company" &&
                                (item.data as Company).size && (
                                  <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
                                    {(item.data as Company).size}
                                  </span>
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                              {item.data.priority && (
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.data.priority === "HOT"
                                      ? "bg-red-500"
                                      : item.data.priority === "WARM"
                                        ? "bg-orange-500"
                                        : "bg-gray-400"
                                  }`}
                                />
                              )}
                              {item.data.leadScore && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Score: {item.data.leadScore}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                              {/* Contact-specific actions */}
                              {item.type === "contact" && (
                                <>
                                  {/* Email */}
                                  <button
                                    className={`p-1 transition-colors ${
                                      (item.data as Contact).email
                                        ? "text-blue-500 hover:text-blue-600 cursor-pointer"
                                        : "text-gray-200 cursor-not-allowed"
                                    }`}
                                    title={
                                      (item.data as Contact).email
                                        ? "Send Email"
                                        : "No email available"
                                    }
                                    onClick={() => {
                                      if ((item.data as Contact).email) {
                                        window.open(
                                          `mailto:${(item.data as Contact).email}`,
                                          "_blank"
                                        );
                                      }
                                    }}
                                  >
                                    <Mail className="w-3 h-3" />
                                  </button>

                                  {/* Phone */}
                                  <button
                                    className={`p-1 transition-colors ${
                                      (item.data as Contact).phoneNumber
                                        ? "text-green-500 hover:text-green-600 cursor-pointer"
                                        : "text-gray-200 cursor-not-allowed"
                                    }`}
                                    title={
                                      (item.data as Contact).phoneNumber
                                        ? "Call"
                                        : "No phone available"
                                    }
                                    onClick={() => {
                                      if ((item.data as Contact).phoneNumber) {
                                        window.open(
                                          `tel:${(item.data as Contact).phoneNumber}`,
                                          "_blank"
                                        );
                                      }
                                    }}
                                  >
                                    <Phone className="w-3 h-3" />
                                  </button>

                                  {/* LinkedIn */}
                                  <button
                                    className={`p-1 transition-colors ${
                                      (item.data as Contact).linkedinUrl
                                        ? "text-blue-600 hover:text-blue-700 cursor-pointer"
                                        : "text-gray-200 cursor-not-allowed"
                                    }`}
                                    title={
                                      (item.data as Contact).linkedinUrl
                                        ? "LinkedIn Profile"
                                        : "No LinkedIn available"
                                    }
                                    onClick={() => {
                                      if ((item.data as Contact).linkedinUrl) {
                                        window.open(
                                          (item.data as Contact).linkedinUrl!,
                                          "_blank"
                                        );
                                      }
                                    }}
                                  >
                                    <Linkedin className="w-3 h-3" />
                                  </button>

                                  {/* Website */}
                                  <button
                                    className={`p-1 transition-colors ${
                                      (item.data as Contact).websiteUrl
                                        ? "text-purple-500 hover:text-purple-600 cursor-pointer"
                                        : "text-gray-200 cursor-not-allowed"
                                    }`}
                                    title={
                                      (item.data as Contact).websiteUrl
                                        ? "Website"
                                        : "No website available"
                                    }
                                    onClick={() => {
                                      if ((item.data as Contact).websiteUrl) {
                                        window.open(
                                          (item.data as Contact).websiteUrl!,
                                          "_blank"
                                        );
                                      }
                                    }}
                                  >
                                    <Globe className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 justify-center items-center">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
              Select a Pipeline
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Choose a pipeline category and pipeline to get started
            </p>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div
          className="flex fixed inset-0 z-50 justify-center items-center bg-black/50 backdrop-blur-sm"
          style={{
            animation: "modalAppear 0.3s ease-out forwards",
            opacity: 0,
            transform: "scale(0.95) translateY(4px)",
          }}
          onClick={e => {
            if (e.target === e.currentTarget) {
              setShowAddItemModal(false);
              setSelectedStageForAdd(null);
            }
          }}
        >
          <div
            className="overflow-y-auto p-6 w-96 max-h-full bg-white dark:bg-gray-800 rounded-lg shadow-xl"
            style={{
              animation: "dropdownSlideIn 0.2s ease-out 0.1s forwards",
              opacity: 0,
              transform: "translateY(-10px) scale(0.95)",
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Add Item to Pipeline
              </h3>
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedStageForAdd(null);
                }}
                className="p-1 text-gray-400 transition-colors hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="overflow-hidden space-y-4 transition-all duration-300 ease-out"
              style={{
                maxHeight:
                  contactDropdownVisible || companyDropdownVisible
                    ? "320px"
                    : "200px",
                minHeight:
                  contactDropdownVisible || companyDropdownVisible
                    ? "320px"
                    : "200px",
              }}
            >
              <div
                className="flex-1 min-h-0 transition-all duration-300 ease-out"
                style={{
                  height: contactDropdownVisible ? "160px" : "60px",
                }}
              >
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contacts
                </h4>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearchTerm}
                    onChange={e => setContactSearchTerm(e.target.value)}
                    onFocus={() => {
                      setContactSearchFocused(true);
                      setContactDropdownVisible(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setContactSearchFocused(false);
                        setContactDropdownVisible(false);
                      }, 200);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/30 transition-all duration-200"
                  />
                </div>
                {contactDropdownVisible && (
                  <div
                    className="overflow-y-auto bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-out"
                    style={{
                      animation: "dropdownSlideIn 0.2s ease-out forwards",
                      opacity: 0,
                      transform: "translateY(-10px) scale(0.95)",
                      maxHeight: "160px",
                      height: "160px",
                    }}
                  >
                    {contacts
                      .filter(contact => {
                        const isInPipeline = pipelineMaps.some(
                          map => map.contactId === contact.id
                        );
                        const matchesSearch =
                          (contact.name &&
                            contact.name
                              .toLowerCase()
                              .includes(contactSearchTerm.toLowerCase())) ||
                          (contact.email &&
                            contact.email
                              .toLowerCase()
                              .includes(contactSearchTerm.toLowerCase()));
                        return !isInPipeline && matchesSearch;
                      })
                      .map((contact, index) => (
                        <button
                          key={contact.id}
                          onClick={() =>
                            handleAddItemToPipeline(contact.id, "contact")
                          }
                          className="w-full px-3 py-1.5 text-xs text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:bg-gray-50 dark:focus:bg-gray-600 focus:outline-none transition-colors duration-150 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          style={{
                            animation: `dropdownItemSlideIn 0.15s ease-out ${index * 0.02}s forwards`,
                            opacity: 0,
                            transform: "translateY(-5px)",
                          }}
                        >
                          <div className="font-medium">
                            {contact.name || "Unnamed Contact"}
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {contact.email}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div
                className="flex-1 min-h-0 transition-all duration-300 ease-out"
                style={{
                  height: companyDropdownVisible ? "160px" : "60px",
                }}
              >
                <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Companies
                </h4>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 w-3 h-3 text-gray-400 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={companySearchTerm}
                    onChange={e => setCompanySearchTerm(e.target.value)}
                    onFocus={() => {
                      setCompanySearchFocused(true);
                      setCompanyDropdownVisible(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => {
                        setCompanySearchFocused(false);
                        setCompanyDropdownVisible(false);
                      }, 200);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-0 focus:border-blue-300 dark:focus:border-blue-500 focus:bg-blue-50 dark:focus:bg-blue-900/30 transition-all duration-200"
                  />
                </div>
                {companyDropdownVisible && (
                  <div
                    className="overflow-y-auto bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-out"
                    style={{
                      animation: "dropdownSlideIn 0.2s ease-out forwards",
                      opacity: 0,
                      transform: "translateY(-10px) scale(0.95)",
                      maxHeight: "160px",
                      height: "160px",
                    }}
                  >
                    {companies
                      .filter(company => {
                        const isInPipeline = pipelineMaps.some(
                          map => map.companyId === company.id
                        );
                        const matchesSearch =
                          company.name
                            .toLowerCase()
                            .includes(companySearchTerm.toLowerCase()) ||
                          (company.industry &&
                            company.industry
                              .toLowerCase()
                              .includes(companySearchTerm.toLowerCase()));
                        return !isInPipeline && matchesSearch;
                      })
                      .map((company, index) => (
                        <button
                          key={company.id}
                          onClick={() =>
                            handleAddItemToPipeline(company.id, "company")
                          }
                          className="w-full px-3 py-1.5 text-xs text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:bg-gray-50 dark:focus:bg-gray-600 focus:outline-none transition-colors duration-150 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                          style={{
                            animation: `dropdownItemSlideIn 0.15s ease-out ${index * 0.02}s forwards`,
                            opacity: 0,
                            transform: "translateY(-5px)",
                          }}
                        >
                          <div className="font-medium">{company.name}</div>
                          <div className="text-gray-500 dark:text-gray-400">
                            {company.industry}
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setShowAddItemModal(false);
                  setSelectedStageForAdd(null);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 transition-colors hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
