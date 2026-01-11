import React, { useState, useEffect, useRef } from "react";
import { X, Edit, User, Building, Calendar, Zap, Trash2 } from "lucide-react";
import { TaskWithRelations } from "../../types/sales-types";

interface TaskDetailPanelProps {
  task: TaskWithRelations;
  onClose: () => void;
  onUpdate?: (task: TaskWithRelations) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [currentTask, setCurrentTask] = useState<TaskWithRelations>(task);
  const panelRef = useRef<HTMLDivElement>(null);

  // Update currentTask when task prop changes
  useEffect(() => {
    setCurrentTask(task);
  }, [task]);

  const priorityColors = {
    high: "text-red-600 bg-red-50",
    medium: "text-yellow-600 bg-yellow-50",
    low: "text-green-600 bg-green-50",
    urgent: "text-red-600 bg-red-50",
  };

  const priorityIcons = {
    high: "🔴",
    medium: "🟡",
    low: "🟢",
    urgent: "🚨",
  };

  const getDueDateColor = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "text-red-600"; // Overdue
    } else if (diffDays <= 3) {
      return "text-orange-600"; // Due soon
    } else {
      return "text-green-600"; // On track
    }
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleEdit = () => {
    // Close the detail panel first
    onClose();
    // Call the edit callback if provided
    if (onEdit) {
      onEdit(currentTask.id);
    }
  };

  const handleDelete = () => {
    // Close the detail panel first
    onClose();
    // Call the delete callback if provided
    if (onDelete) {
      onDelete(currentTask.id);
    }
  };

  return (
    <div className="flex fixed inset-0 z-50 justify-end" onClick={onClose}>
      <div
        className="fixed inset-y-0 right-0 z-50 w-[700px] bg-white border-l border-gray-200 shadow-2xl transform transition-transform duration-300 ease-in-out"
        onClick={e => e.stopPropagation()}
        ref={panelRef}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h2 className="mb-2 text-xl font-semibold text-gray-900">
                  {currentTask.title}
                </h2>
                {currentTask.description && (
                  <div className="mt-3">
                    <div className="mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      {currentTask.description}
                    </div>
                  </div>
                )}
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      currentTask.status === "PENDING"
                        ? "bg-gray-100 text-gray-800"
                        : currentTask.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : currentTask.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : currentTask.status === "CANCELLED"
                              ? "bg-red-100 text-red-800"
                              : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {currentTask.status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[currentTask.priority as keyof typeof priorityColors]}`}
                  >
                    {
                      priorityIcons[
                        currentTask.priority as keyof typeof priorityIcons
                      ]
                    }
                    <span className="ml-1 capitalize">
                      {currentTask.priority}
                    </span>
                  </span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Assignee
                </label>
                {currentTask.assignee ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex justify-center items-center w-8 h-8 bg-gray-300 rounded-full">
                      <span className="text-sm font-medium text-gray-700">
                        {currentTask.assignee.name
                          ? currentTask.assignee.name
                              .split(" ")
                              .map(n => n[0])
                              .join("")
                          : "U"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {currentTask.assignee.name}
                      </p>
                      {currentTask.assignee.email && (
                        <p className="text-sm text-gray-600">
                          {currentTask.assignee.email}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="italic text-gray-500">Unassigned</p>
                )}
              </div>

              {/* Associated Contact/Company */}
              {(currentTask.contact || currentTask.company) && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Associated
                  </label>
                  {currentTask.contact && (
                    <div className="flex items-center p-3 space-x-3 bg-blue-50 rounded-lg">
                      <User className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {currentTask.contact.name}
                        </p>
                        {currentTask.contact.email && (
                          <p className="text-sm text-gray-600">
                            {currentTask.contact.email}
                          </p>
                        )}
                        {currentTask.contact.phoneNumber && (
                          <p className="text-sm text-gray-600">
                            {currentTask.contact.phoneNumber}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {currentTask.company && (
                    <div className="flex items-center p-3 space-x-3 bg-blue-50 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {currentTask.company.name}
                        </p>
                        {currentTask.company.industry && (
                          <p className="text-sm text-gray-600">
                            {currentTask.company.industry}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Due Date */}
              {currentTask.dueDate && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <div
                    className={`flex items-center space-x-2 ${getDueDateColor(new Date(currentTask.dueDate))}`}
                  >
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(currentTask.dueDate).toLocaleDateString()}
                    </span>
                    <span className="text-sm">
                      ({getDaysUntilDue(new Date(currentTask.dueDate))} days)
                    </span>
                  </div>
                </div>
              )}

              {/* Completion Date */}
              {currentTask.completedAt && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Completed
                  </label>
                  <div className="flex items-center space-x-2 text-green-600">
                    <Calendar className="w-5 h-5" />
                    <span className="font-medium">
                      {new Date(currentTask.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Automation */}
              {currentTask.isAutomated && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Automation
                  </label>
                  <div className="flex items-center p-3 space-x-2 bg-purple-50 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-800">
                      Automated Task
                    </span>
                  </div>
                  {currentTask.automationRule && (
                    <div className="p-3 mt-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Trigger:</span>{" "}
                        {currentTask.automationRule.trigger as string}
                      </p>
                      {Boolean(currentTask.automationRule.conditions) && (
                        <p className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Conditions:</span>{" "}
                          {JSON.stringify(
                            currentTask.automationRule.conditions as string
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Workspace and Organization */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Workspace
                  </label>
                  <p className="text-gray-900">{currentTask.workspace?.name}</p>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Organization
                  </label>
                  <p className="text-gray-900">
                    {currentTask.organization?.name}
                  </p>
                </div>
              </div>

              {/* Created/Updated Info */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Created:</span>
                  <p>{new Date(currentTask.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium">Updated:</span>
                  <p>{new Date(currentTask.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex space-x-3">
              <button
                onClick={handleEdit}
                className="flex flex-1 justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Edit className="mr-2 w-4 h-4" />
                Edit Task
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white rounded-md border border-red-300 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPanel;
