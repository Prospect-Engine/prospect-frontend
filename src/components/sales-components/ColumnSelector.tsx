import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Eye, EyeOff, GripVertical } from "lucide-react";

interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  visible: boolean;
  width?: string;
}

interface ColumnSelectorProps {
  columns: TableColumn[];
  onUpdateColumns: (columns: TableColumn[]) => void;
  onClose: () => void;
}

const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  onUpdateColumns,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Wait for exit animation before calling onClose
    setTimeout(() => onClose(), 300);
  };
  const toggleColumnVisibility = (key: string) => {
    const updatedColumns = columns.map(col =>
      col.key === key ? { ...col, visible: !col.visible } : col
    );
    onUpdateColumns(updatedColumns);
  };

  const moveColumn = (fromIndex: number, toIndex: number) => {
    const updatedColumns = [...columns];

    // Get the filtered columns (excluding checkbox, title, actions)
    const filteredColumns = updatedColumns.filter(
      col => !["checkbox", "title", "actions"].includes(col.key)
    );

    // Get the actual column to move
    const columnToMove = filteredColumns[fromIndex];

    // Find the actual index in the full columns array
    const actualFromIndex = updatedColumns.findIndex(
      col => col.key === columnToMove.key
    );

    // Calculate the actual to index (after the fixed columns)
    const actualToIndex = toIndex + 3; // +3 because we have checkbox, title, actions at the beginning

    // Move the column
    const [movedColumn] = updatedColumns.splice(actualFromIndex, 1);
    updatedColumns.splice(actualToIndex, 0, movedColumn);

    onUpdateColumns(updatedColumns);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveColumn(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return ReactDOM.createPortal(
    <div
      className={`flex fixed inset-0 z-50 justify-center items-center transition-all duration-300 ease-in-out backdrop-blur-sm ${
        isVisible ? "bg-black/50" : "bg-black/0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden transition-all duration-300 ease-in-out transform ${
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Customize Columns
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4">
          <div className="p-2 mb-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Note:</strong> Checkbox, Title, and Actions columns are
              fixed and cannot be reordered.
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              Drag columns to reorder or use the up/down arrows.
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              ✓ Settings are automatically saved and will persist across page
              reloads.
            </p>
          </div>
          <div className="overflow-y-auto space-y-2 max-h-96">
            {columns
              .filter(
                col => !["checkbox", "title", "actions"].includes(col.key)
              )
              .map((column, index) => (
                <div
                  key={column.key}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, index)}
                  className={`flex items-center p-2 space-x-3 rounded-lg border transition-all duration-200 ease-in-out cursor-move ${
                    draggedIndex === index
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 opacity-50"
                      : dragOverIndex === index
                        ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="cursor-move">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                  </div>

                  <button
                    onClick={e => {
                      e.stopPropagation();
                      toggleColumnVisibility(column.key);
                    }}
                    className="flex flex-1 items-center space-x-2 text-left"
                  >
                    {column.visible ? (
                      <Eye className="w-4 h-4 text-green-600 transition-all duration-200 ease-in-out" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400 transition-all duration-200 ease-in-out" />
                    )}
                    <span
                      className={`text-sm transition-all duration-200 ease-in-out ${column.visible ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}
                    >
                      {column.label}
                    </span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        moveColumn(index, Math.max(0, index - 1));
                      }}
                      disabled={index === 0}
                      className="p-1 rounded transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                    >
                      ↑
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const filteredColumns = columns.filter(
                          col =>
                            !["checkbox", "title", "actions"].includes(col.key)
                        );
                        moveColumn(
                          index,
                          Math.min(filteredColumns.length - 1, index + 1)
                        );
                      }}
                      disabled={
                        index ===
                        columns.filter(
                          col =>
                            !["checkbox", "title", "actions"].includes(col.key)
                        ).length -
                          1
                      }
                      className="p-1 rounded transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <button
              onClick={e => {
                e.stopPropagation();
                const resetColumns = columns.map(col => ({
                  ...col,
                  visible: true,
                }));
                onUpdateColumns(resetColumns);
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show All
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                // Detect table type and provide appropriate default columns
                const hasTitle = columns.some(col => col.key === "title");
                const hasName = columns.some(col => col.key === "name");

                let defaultColumns;
                if (hasTitle) {
                  // Deals table
                  defaultColumns = [
                    {
                      key: "checkbox",
                      label: "",
                      sortable: false,
                      visible: true,
                      width: "50px",
                    },
                    {
                      key: "title",
                      label: "Title",
                      sortable: true,
                      visible: true,
                      width: "300px",
                    },
                    {
                      key: "company",
                      label: "Company",
                      sortable: true,
                      visible: true,
                      width: "200px",
                    },
                    {
                      key: "contact",
                      label: "Contact",
                      sortable: true,
                      visible: true,
                      width: "200px",
                    },
                    {
                      key: "value",
                      label: "Value",
                      sortable: true,
                      visible: true,
                      width: "150px",
                    },
                    {
                      key: "probability",
                      label: "Probability",
                      sortable: true,
                      visible: true,
                      width: "150px",
                    },
                    {
                      key: "status",
                      label: "Status",
                      sortable: true,
                      visible: true,
                      width: "120px",
                    },
                    {
                      key: "expectedCloseDate",
                      label: "Expected Close",
                      sortable: true,
                      visible: true,
                      width: "150px",
                    },
                    {
                      key: "owner",
                      label: "Owner",
                      sortable: true,
                      visible: true,
                      width: "150px",
                    },
                    {
                      key: "createdAt",
                      label: "Created",
                      sortable: true,
                      visible: true,
                      width: "120px",
                    },
                    {
                      key: "actions",
                      label: "Actions",
                      sortable: false,
                      visible: true,
                      width: "100px",
                    },
                  ];
                } else if (hasName) {
                  // Companies or Leads table
                  const isCompanies = columns.some(col => col.key === "size");
                  if (isCompanies) {
                    defaultColumns = [
                      {
                        key: "checkbox",
                        label: "",
                        sortable: false,
                        visible: true,
                        width: "50px",
                      },
                      {
                        key: "name",
                        label: "Companies",
                        sortable: true,
                        visible: true,
                        width: "250px",
                      },
                      {
                        key: "status",
                        label: "Status",
                        sortable: true,
                        visible: true,
                        width: "120px",
                      },
                      {
                        key: "tags",
                        label: "Tags",
                        sortable: false,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "owner",
                        label: "Owners",
                        sortable: true,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "lastInteraction",
                        label: "Last interaction",
                        sortable: true,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "size",
                        label: "Size",
                        sortable: true,
                        visible: true,
                        width: "120px",
                      },
                      {
                        key: "industry",
                        label: "Industry",
                        sortable: true,
                        visible: true,
                        width: "100px",
                      },
                      {
                        key: "email",
                        label: "Email",
                        sortable: true,
                        visible: false,
                        width: "200px",
                      },
                      {
                        key: "phone",
                        label: "Phone",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "website",
                        label: "Website",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "location",
                        label: "Location",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "revenue",
                        label: "Revenue",
                        sortable: true,
                        visible: false,
                        width: "120px",
                      },
                      {
                        key: "actions",
                        label: "Actions",
                        sortable: false,
                        visible: true,
                        width: "120px",
                      },
                    ];
                  } else {
                    defaultColumns = [
                      {
                        key: "checkbox",
                        label: "",
                        sortable: false,
                        visible: true,
                        width: "50px",
                      },
                      {
                        key: "name",
                        label: "Leads",
                        sortable: true,
                        visible: true,
                        width: "250px",
                      },
                      {
                        key: "status",
                        label: "Status",
                        sortable: true,
                        visible: true,
                        width: "120px",
                      },
                      {
                        key: "tags",
                        label: "Tags",
                        sortable: false,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "owner",
                        label: "Owners",
                        sortable: true,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "lastInteraction",
                        label: "Last interaction",
                        sortable: true,
                        visible: true,
                        width: "150px",
                      },
                      {
                        key: "connection",
                        label: "Connection",
                        sortable: true,
                        visible: true,
                        width: "120px",
                      },
                      {
                        key: "leadScore",
                        label: "Lead",
                        sortable: true,
                        visible: true,
                        width: "100px",
                      },
                      {
                        key: "company",
                        label: "Company",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "email",
                        label: "Email",
                        sortable: true,
                        visible: false,
                        width: "200px",
                      },
                      {
                        key: "phone",
                        label: "Phone",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "industry",
                        label: "Industry",
                        sortable: true,
                        visible: false,
                        width: "120px",
                      },
                      {
                        key: "location",
                        label: "Location",
                        sortable: true,
                        visible: false,
                        width: "150px",
                      },
                      {
                        key: "actions",
                        label: "Actions",
                        sortable: false,
                        visible: true,
                        width: "120px",
                      },
                    ];
                  }
                } else {
                  // Fallback to current columns
                  defaultColumns = columns;
                }
                onUpdateColumns(defaultColumns);
              }}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Reset to Default
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Apply changes and close smoothly
                onUpdateColumns(columns);
                handleClose();
              }}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ColumnSelector;
