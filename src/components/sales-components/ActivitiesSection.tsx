import React, { useState, useEffect } from "react";
import {
  Activity,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  FileText,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Activity as ActivityType } from "@/types/sales-types";
import activitiesService from "@/services/sales-services/activitiesService";
import { useWorkspace } from "@/hooks/sales-hooks/useWorkspace";
import { useAuth } from "@/hooks/sales-hooks/useAuth";

interface ActivitiesSectionProps {
  entityId: string;
  entityType: "contact" | "company" | "deal";
  onRefresh?: () => void;
}

const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  entityId,
  entityType,
  onRefresh,
}) => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(
    null
  );

  // Helper function to convert Activity type to service DTO type
  const convertActivityTypeToService = (type: ActivityType["type"]) => {
    switch (type) {
      case "call":
        return "CALL";
      case "email":
        return "EMAIL";
      case "meeting":
        return "MEETING";
      case "task":
        return "TASK";
      case "note":
        return "NOTE";
      case "CUSTOM":
        return "CUSTOM";
      default:
        return "CALL";
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "call" as ActivityType["type"],
    channel: "PHONE" as ActivityType["channel"],
    outcome: "SUCCESSFUL" as ActivityType["outcome"],
    duration: "",
    scheduledAt: "",
    completedAt: "",
  });

  // Load activities
  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedWorkspace?.id || !user) return;

      try {
        setLoading(true);
        setError(null);

        let activitiesData: ActivityType[] = [];

        switch (entityType) {
          case "contact":
            activitiesData = await activitiesService.getContactActivities(
              entityId,
              selectedWorkspace.id,
              selectedOrganization?.id
            );
            break;
          case "company":
            activitiesData = await activitiesService.getCompanyActivities(
              entityId,
              selectedWorkspace.id,
              selectedOrganization?.id
            );
            break;
          case "deal":
            activitiesData = await activitiesService.getDealActivities(
              entityId,
              selectedWorkspace.id,
              selectedOrganization?.id
            );
            break;
        }

        setActivities(activitiesData);
      } catch (err) {
        setError("Failed to load activities");
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
  }, [
    entityId,
    entityType,
    selectedWorkspace?.id,
    selectedOrganization?.id,
    user,
  ]);

  const getActivityIcon = (type: ActivityType["type"]) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Calendar className="w-4 h-4" />;
      case "task":
        return <CheckSquare className="w-4 h-4" />;
      case "note":
        return <FileText className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getOutcomeIcon = (outcome: ActivityType["outcome"]) => {
    switch (outcome) {
      case "SUCCESSFUL":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "NO_RESPONSE":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "RESCHEDULED":
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace?.id || !user) return;

    try {
      const activityData = {
        title: formData.title,
        description: formData.description,
        type: convertActivityTypeToService(formData.type) as
          | "CALL"
          | "EMAIL"
          | "MEETING"
          | "TASK"
          | "NOTE"
          | "CUSTOM",
        channel: formData.channel as
          | "PHONE"
          | "EMAIL"
          | "WHATSAPP"
          | "LINKEDIN"
          | "OTHER",
        outcome: formData.outcome as
          | "SUCCESSFUL"
          | "FAILED"
          | "NO_RESPONSE"
          | "RESCHEDULED",
        [entityType === "contact"
          ? "contactId"
          : entityType === "company"
            ? "companyId"
            : "dealId"]: entityId,
        workspaceId: selectedWorkspace.id,
        organizationId: selectedOrganization?.id,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        scheduledAt: formData.scheduledAt || undefined,
        completedAt: formData.completedAt || undefined,
      };

      if (editingActivity) {
        await activitiesService.updateActivity(
          editingActivity.id,
          activityData,
          selectedWorkspace.id,
          selectedOrganization?.id
        );
      } else {
        await activitiesService.createActivity(activityData);
      }

      // Reset form and reload activities
      setFormData({
        title: "",
        description: "",
        type: "call",
        channel: "PHONE",
        outcome: "SUCCESSFUL",
        duration: "",
        scheduledAt: "",
        completedAt: "",
      });
      setShowAddForm(false);
      setEditingActivity(null);

      // Reload activities
      const activitiesData = await activitiesService.getActivities({
        workspaceId: selectedWorkspace.id,
        organizationId: selectedOrganization?.id,
        [entityType === "contact"
          ? "contactId"
          : entityType === "company"
            ? "companyId"
            : "dealId"]: entityId,
      });
      setActivities(activitiesData);

      onRefresh?.();
    } catch (err) {
      setError("Failed to save activity");
    }
  };

  const handleDelete = async (activityId: string) => {
    if (!selectedWorkspace?.id) return;

    try {
      await activitiesService.deleteActivity(
        activityId,
        selectedWorkspace.id,
        selectedOrganization?.id
      );

      // Reload activities
      const activitiesData = await activitiesService.getActivities({
        workspaceId: selectedWorkspace.id,
        organizationId: selectedOrganization?.id,
        [entityType === "contact"
          ? "contactId"
          : entityType === "company"
            ? "companyId"
            : "dealId"]: entityId,
      });
      setActivities(activitiesData);

      onRefresh?.();
    } catch (err) {
      setError("Failed to delete activity");
    }
  };

  const handleEdit = (activity: ActivityType) => {
    setEditingActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description || "",
      type: activity.type,
      channel: (activity.channel as ActivityType["channel"]) || "PHONE",
      outcome: (activity.outcome as ActivityType["outcome"]) || "SUCCESSFUL",
      duration: activity.duration?.toString() || "",
      scheduledAt: activity.scheduledAt || "",
      completedAt: activity.completedAt || "",
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-center items-center py-8">
          <div className="w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="py-8 text-center text-red-500">
          <AlertCircle className="mx-auto mb-2 w-8 h-8" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Activities</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="mr-1 w-4 h-4" />
          Add Activity
        </button>
      </div>

      {/* Add/Edit Activity Form */}
      {showAddForm && (
        <div className="p-4 mb-6 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900 text-md">
              {editingActivity ? "Edit Activity" : "Add New Activity"}
            </h4>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingActivity(null);
                setFormData({
                  title: "",
                  description: "",
                  type: "call",
                  channel: "PHONE",
                  outcome: "SUCCESSFUL",
                  duration: "",
                  scheduledAt: "",
                  completedAt: "",
                });
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      type: e.target.value as ActivityType["type"],
                    })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="task">Task</option>
                  <option value="note">Note</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Channel
                </label>
                <select
                  value={formData.channel}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      channel: e.target.value as ActivityType["channel"],
                    })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PHONE">Phone</option>
                  <option value="EMAIL">Email</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LINKEDIN">LinkedIn</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Outcome
                </label>
                <select
                  value={formData.outcome}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      outcome: e.target.value as ActivityType["outcome"],
                    })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="SUCCESSFUL">Successful</option>
                  <option value="FAILED">Failed</option>
                  <option value="NO_RESPONSE">No Response</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={e =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">
                  Scheduled At
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={e =>
                    setFormData({ ...formData, scheduledAt: e.target.value })
                  }
                  className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="px-3 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingActivity(null);
                }}
                className="px-4 py-2 text-sm text-gray-600 rounded-md border border-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingActivity ? "Update Activity" : "Add Activity"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Activity className="mx-auto mb-2 w-8 h-8 text-gray-400" />
            <p className="text-sm">No activities found for this {entityType}</p>
          </div>
        ) : (
          activities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start p-4 bg-white rounded-lg border border-gray-200 transition-shadow hover:shadow-sm"
            >
              <div className="flex-shrink-0 mt-1 mr-3">
                {getActivityIcon(activity.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    {activity.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {activity.description}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="mr-1 w-3 h-3" />
                        {formatDate(activity.createdAt)}
                      </span>
                      {activity.duration && (
                        <span className="flex items-center">
                          <Activity className="mr-1 w-3 h-3" />
                          {formatDuration(activity.duration)}
                        </span>
                      )}
                      {activity.outcome && (
                        <span className="flex items-center">
                          {getOutcomeIcon(activity.outcome)}
                          <span className="ml-1 capitalize">
                            {activity.outcome.toLowerCase()}
                          </span>
                        </span>
                      )}
                      {activity.user && (
                        <span className="flex items-center">
                          <User className="mr-1 w-3 h-3" />
                          {activity.user.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center ml-4 space-x-2">
                    <button
                      onClick={() => handleEdit(activity)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Edit activity"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(activity.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivitiesSection;
