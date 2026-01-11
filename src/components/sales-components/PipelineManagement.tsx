"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Users,
  Building,
  Target,
  Eye,
  Thermometer,
  MessageCircle,
  CheckCircle,
  XCircle,
  Globe,
  Play,
  Pause,
  BarChart3,
  Activity,
} from "lucide-react";
import pipelineService, {
  PipelineCategory,
  Pipeline,
  PipelineStage,
  PipelineStats,
} from "../../services/sales-services/pipelineService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";

// Minimal Modal component matching Settings.tsx exactly
function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-all duration-300 ease-in-out ${
        open ? "opacity-100 backdrop-blur-sm" : "opacity-0 pointer-events-none"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md relative transition-all duration-300 ease-in-out transform ${
          open
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

// FormField component matching Settings.tsx
function FormField({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && (
          <span className="text-red-500 dark:text-red-400 ml-1">*</span>
        )}
      </label>
      {children}
    </div>
  );
}

const PipelineManagement: React.FC = () => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();

  // Data states
  const [categories, setCategories] = useState<PipelineCategory[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loading, setLoading] = useState(true);

  // UI states
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);

  // Form states
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showPipelineForm, setShowPipelineForm] = useState(false);
  const [showStageForm, setShowStageForm] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<PipelineCategory | null>(null);
  const [editingPipeline, setEditingPipeline] = useState<Pipeline | null>(null);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [selectedCategoryForPipeline, setSelectedCategoryForPipeline] =
    useState<string>("");
  const [selectedPipelineForStage, setSelectedPipelineForStage] =
    useState<string>("");

  // Form data
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
  });

  const [pipelineForm, setPipelineForm] = useState({
    name: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
    pipelineCategoryId: "",
  });

  const [stageForm, setStageForm] = useState({
    name: "",
    description: "",
    pipelineId: "",
    pipelineCategoryId: "",
  });

  // Available icons
  const availableIcons = [
    { name: "Target", component: Target },
    { name: "Eye", component: Eye },
    { name: "Thermometer", component: Thermometer },
    { name: "MessageCircle", component: MessageCircle },
    { name: "CheckCircle", component: CheckCircle },
    { name: "XCircle", component: XCircle },
    { name: "Users", component: Users },
    { name: "Building", component: Building },
    { name: "Globe", component: Globe },
    { name: "Activity", component: Activity },
  ];

  // Load data
  useEffect(() => {
    if (selectedWorkspace) {
      loadPipelineData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspace]);

  const loadPipelineData = async () => {
    try {
      const [categoriesData, pipelinesData, stagesData] = await Promise.all([
        pipelineService.getPipelineCategories(
          selectedWorkspace!.id,
          selectedOrganization?.id
        ),
        pipelineService.getPipelines(
          selectedWorkspace!.id,
          selectedOrganization?.id
        ),
        pipelineService.getPipelineStages(selectedWorkspace!.id),
      ]);

      setCategories(categoriesData);
      setPipelines(pipelinesData);
      setStages(stagesData);

      // Calculate stats from existing data instead of API call
      const calculatedStats: PipelineStats = {
        totalPipelines: pipelinesData.length,
        activePipelines: pipelinesData.filter(p => p.status === "ACTIVE")
          .length,
        inactivePipelines: pipelinesData.filter(p => p.status === "INACTIVE")
          .length,
        totalCategories: categoriesData.length,
        totalStages: stagesData.length,
        totalMappings: 0, // This would need a separate API call
        pipelinesByStatus: [
          {
            status: "ACTIVE",
            count: pipelinesData.filter(p => p.status === "ACTIVE").length,
          },
          {
            status: "INACTIVE",
            count: pipelinesData.filter(p => p.status === "INACTIVE").length,
          },
        ],
        categoriesWithPipelineCount: categoriesData.map(category => ({
          categoryId: category.id,
          categoryName: category.name,
          pipelineCount: pipelinesData.filter(
            p => p.pipelineCategoryId === category.id
          ).length,
        })),
      };

      setStats(calculatedStats);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  // Category CRUD
  const handleCreateCategory = async () => {
    try {
      const newCategory = await pipelineService.createPipelineCategory({
        name: categoryForm.name,
        description: categoryForm.description,
        workspaceId: selectedWorkspace!.id,
        organizationId: selectedOrganization?.id,
      });

      setCategories([...categories, newCategory]);
      setCategoryForm({ name: "", description: "" });
      setShowCategoryForm(false);
    } catch (error) {}
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const updatedCategory = await pipelineService.updatePipelineCategory(
        editingCategory.id,
        {
          name: categoryForm.name,
          description: categoryForm.description,
        }
      );

      setCategories(
        categories.map(cat =>
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      );
      setCategoryForm({ name: "", description: "" });
      setEditingCategory(null);
      setShowCategoryForm(false);
    } catch (error) {}
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this category? This will also delete all associated pipelines and stages."
      )
    )
      return;

    try {
      await pipelineService.deletePipelineCategory(
        categoryId,
        selectedWorkspace!.id,
        selectedOrganization?.id
      );
      setCategories(categories.filter(cat => cat.id !== categoryId));
      setPipelines(pipelines.filter(p => p.pipelineCategoryId !== categoryId));
    } catch (error) {}
  };

  // Pipeline CRUD
  const handleCreatePipeline = async () => {
    try {
      const newPipeline = await pipelineService.createPipeline({
        name: pipelineForm.name,
        description: pipelineForm.description,
        status: pipelineForm.status,
        pipelineCategoryId: pipelineForm.pipelineCategoryId,
        workspaceId: selectedWorkspace!.id,
        organizationId: selectedOrganization?.id,
      });

      setPipelines([...pipelines, newPipeline]);
      setPipelineForm({
        name: "",
        description: "",
        status: "ACTIVE",
        pipelineCategoryId: "",
      });
      setShowPipelineForm(false);
    } catch (error) {}
  };

  const handleUpdatePipeline = async () => {
    if (!editingPipeline) return;

    try {
      const updatedPipeline = await pipelineService.updatePipeline(
        editingPipeline.id,
        {
          name: pipelineForm.name,
          description: pipelineForm.description,
          status: pipelineForm.status,
          pipelineCategoryId: pipelineForm.pipelineCategoryId,
        },
        selectedWorkspace!.id,
        selectedOrganization?.id
      );

      setPipelines(
        pipelines.map(p => (p.id === editingPipeline.id ? updatedPipeline : p))
      );
      setPipelineForm({
        name: "",
        description: "",
        status: "ACTIVE",
        pipelineCategoryId: "",
      });
      setEditingPipeline(null);
      setShowPipelineForm(false);
    } catch (error) {}
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this pipeline? This will also delete all associated stages."
      )
    )
      return;

    try {
      await pipelineService.deletePipeline(
        pipelineId,
        selectedWorkspace!.id,
        selectedOrganization?.id
      );
      setPipelines(pipelines.filter(p => p.id !== pipelineId));
    } catch (error) {}
  };

  // Stage CRUD
  const handleCreateStage = async () => {
    try {
      const newStage = await pipelineService.createPipelineStage({
        name: stageForm.name,
        description: stageForm.description,
        pipelineId: selectedPipelineForStage,
        pipelineCategoryId: stageForm.pipelineCategoryId,
      });

      setStages([...stages, newStage]);
      setStageForm({
        name: "",
        description: "",
        pipelineId: "",
        pipelineCategoryId: "",
      });
      setShowStageForm(false);
    } catch (error) {}
  };

  const handleUpdateStage = async () => {
    if (!editingStage) return;

    try {
      const updatedStage = await pipelineService.updatePipelineStage(
        editingStage.id,
        {
          name: stageForm.name,
          description: stageForm.description,
          pipelineId: stageForm.pipelineId,
          pipelineCategoryId: stageForm.pipelineCategoryId,
        },
        selectedWorkspace!.id,
        selectedOrganization?.id
      );

      setStages(stages.map(s => (s.id === editingStage.id ? updatedStage : s)));
      setStageForm({
        name: "",
        description: "",
        pipelineId: "",
        pipelineCategoryId: "",
      });
      setEditingStage(null);
      setShowStageForm(false);
    } catch (error) {}
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm("Are you sure you want to delete this stage?")) return;

    try {
      await pipelineService.deletePipelineStage(
        stageId,
        selectedWorkspace!.id,
        selectedOrganization?.id
      );
      setStages(stages.filter(s => s.id !== stageId));
    } catch (error) {}
  };

  // Form handlers
  const openCategoryForm = (category?: PipelineCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "" });
    }
    setShowCategoryForm(true);
  };

  const openPipelineForm = (pipeline?: Pipeline) => {
    if (pipeline) {
      setEditingPipeline(pipeline);
      setPipelineForm({
        name: pipeline.name,
        description: pipeline.description || "",
        status: pipeline.status,
        pipelineCategoryId: pipeline.pipelineCategoryId,
      });
    } else {
      setEditingPipeline(null);
      setPipelineForm({
        name: "",
        description: "",
        status: "ACTIVE",
        pipelineCategoryId: "",
      });
    }
    setShowPipelineForm(true);
  };

  const openStageForm = (stage?: PipelineStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageForm({
        name: stage.name,
        description: stage.description || "",
        pipelineId: stage.pipelineId,
        pipelineCategoryId: stage.pipelineCategoryId,
      });
    } else {
      setEditingStage(null);
      setStageForm({
        name: "",
        description: "",
        pipelineId: "",
        pipelineCategoryId: "",
      });
    }
    setShowStageForm(true);
  };

  const getStatusIcon = (status: "ACTIVE" | "INACTIVE") => {
    return status === "ACTIVE" ? (
      <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    ) : (
      <Pause className="w-4 h-4 text-gray-400" />
    );
  };

  const getStatusBadge = (status: "ACTIVE" | "INACTIVE") => {
    return status === "ACTIVE" ? (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
        Active
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
        Inactive
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-b-2 border-gray-600 dark:border-gray-400 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Pipeline Management
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your pipeline categories, pipelines, and stages
          </p>
        </div>
        <button
          onClick={() => openCategoryForm()}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Pipelines
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPipelines}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Pipelines
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activePipelines}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Target className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Categories
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalCategories}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Stages
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalStages}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map(category => (
          <div
            key={category.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            {/* Category Header */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category.id ? null : category.id
                    )
                  }
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {expandedCategory === category.id ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {category.name}
                </h3>
                <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                  {
                    pipelines.filter(p => p.pipelineCategoryId === category.id)
                      .length
                  }{" "}
                  pipelines
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openCategoryForm(category)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Content */}
            {expandedCategory === category.id && (
              <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {category.description}
                  </p>
                )}

                {/* Pipelines in this category */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Pipelines
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedCategoryForPipeline(category.id);
                        openPipelineForm();
                      }}
                      className="flex items-center px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Pipeline
                    </button>
                  </div>

                  {pipelines
                    .filter(p => p.pipelineCategoryId === category.id)
                    .map(pipeline => (
                      <div
                        key={pipeline.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-800"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() =>
                                setExpandedPipeline(
                                  expandedPipeline === pipeline.id
                                    ? null
                                    : pipeline.id
                                )
                              }
                              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {expandedPipeline === pipeline.id ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(pipeline.status)}
                              <h5 className="font-medium text-gray-900 dark:text-white">
                                {pipeline.name}
                              </h5>
                              {getStatusBadge(pipeline.status)}
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                              {
                                stages.filter(s => s.pipelineId === pipeline.id)
                                  .length
                              }{" "}
                              stages
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openPipelineForm(pipeline)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePipeline(pipeline.id)}
                              className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Pipeline stages */}
                        {expandedPipeline === pipeline.id && (
                          <div className="mt-3 space-y-2">
                            <div className="flex justify-between items-center">
                              <h6 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                Stages
                              </h6>
                              <button
                                onClick={() => {
                                  setSelectedPipelineForStage(pipeline.id);
                                  setStageForm({
                                    ...stageForm,
                                    pipelineCategoryId: category.id,
                                  });
                                  openStageForm();
                                }}
                                className="flex items-center px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Stage
                              </button>
                            </div>

                            <div className="space-y-2">
                              {stages
                                .filter(s => s.pipelineId === pipeline.id)
                                .map(stage => (
                                  <div
                                    key={stage.id}
                                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {stage.name}
                                      </span>
                                      {stage.description && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          - {stage.description}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <button
                                        onClick={() => openStageForm(stage)}
                                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                      >
                                        <Edit className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDeleteStage(stage.id)
                                        }
                                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <Modal
          open={showCategoryForm}
          onClose={() => setShowCategoryForm(false)}
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingCategory ? "Edit Category" : "Create Category"}
          </h3>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (editingCategory) {
                handleUpdateCategory();
              } else {
                handleCreateCategory();
              }
            }}
            className="space-y-4"
          >
            <FormField label="Name" required>
              <input
                type="text"
                value={categoryForm.name}
                onChange={e =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter category name"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={categoryForm.description}
                onChange={e =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter category description"
                rows={3}
              />
            </FormField>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                {editingCategory ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Pipeline Form Modal */}
      {showPipelineForm && (
        <Modal
          open={showPipelineForm}
          onClose={() => setShowPipelineForm(false)}
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingPipeline ? "Edit Pipeline" : "Create Pipeline"}
          </h3>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (editingPipeline) {
                handleUpdatePipeline();
              } else {
                handleCreatePipeline();
              }
            }}
            className="space-y-4"
          >
            <FormField label="Category" required>
              <select
                value={pipelineForm.pipelineCategoryId}
                onChange={e =>
                  setPipelineForm({
                    ...pipelineForm,
                    pipelineCategoryId: e.target.value,
                  })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" required>
              <input
                type="text"
                value={pipelineForm.name}
                onChange={e =>
                  setPipelineForm({ ...pipelineForm, name: e.target.value })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter pipeline name"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={pipelineForm.description}
                onChange={e =>
                  setPipelineForm({
                    ...pipelineForm,
                    description: e.target.value,
                  })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter pipeline description"
                rows={3}
              />
            </FormField>

            <FormField label="Status" required>
              <select
                value={pipelineForm.status}
                onChange={e =>
                  setPipelineForm({
                    ...pipelineForm,
                    status: e.target.value as "ACTIVE" | "INACTIVE",
                  })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                required
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </FormField>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowPipelineForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                {editingPipeline ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Stage Form Modal */}
      {showStageForm && (
        <Modal open={showStageForm} onClose={() => setShowStageForm(false)}>
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            {editingStage ? "Edit Stage" : "Create Stage"}
          </h3>
          <form
            onSubmit={e => {
              e.preventDefault();
              if (editingStage) {
                handleUpdateStage();
              } else {
                handleCreateStage();
              }
            }}
            className="space-y-4"
          >
            <FormField label="Pipeline" required>
              <select
                value={stageForm.pipelineId}
                onChange={e =>
                  setStageForm({
                    ...stageForm,
                    pipelineId: e.target.value,
                  })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                required
              >
                <option value="">Select a pipeline</option>
                {pipelines.map(pipeline => (
                  <option key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="Name" required>
              <input
                type="text"
                value={stageForm.name}
                onChange={e =>
                  setStageForm({ ...stageForm, name: e.target.value })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter stage name"
                required
              />
            </FormField>

            <FormField label="Description">
              <textarea
                value={stageForm.description}
                onChange={e =>
                  setStageForm({ ...stageForm, description: e.target.value })
                }
                className="px-3 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                placeholder="Enter stage description"
                rows={3}
              />
            </FormField>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowStageForm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-gray-900 dark:bg-gray-700 rounded-md hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                {editingStage ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PipelineManagement;
