import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  User,
  Building,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  notesService,
  Note,
  CreateNoteDto,
  UpdateNoteDto,
  QueryNoteDto,
} from "../../services/sales-services/notesService";
import { useWorkspace } from "../../hooks/sales-hooks/useWorkspace";
import authService from "../../services/sales-services/authService";
import { renderTextWithLinks } from "../../utils/sales-utils/linkDetection";

interface NotesSectionProps {
  entityId: string;
  entityType: "contact" | "company" | "deal";
  onRefresh?: () => void;
}

const NotesSection: React.FC<NotesSectionProps> = ({
  entityId,
  entityType,
  onRefresh,
}) => {
  const { selectedWorkspace, selectedOrganization } = useWorkspace();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const queryParams: QueryNoteDto = useMemo(
    () => ({
      workspaceId: selectedWorkspace?.id || "",
      organizationId: selectedOrganization?.id || "",
      [entityType === "contact"
        ? "contactId"
        : entityType === "company"
          ? "companyId"
          : "dealId"]: entityId,
    }),
    [selectedWorkspace?.id, selectedOrganization?.id, entityType, entityId]
  );

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      const response = await notesService.getNotes(
        queryParams,
        token as string
      );
      setNotes(response.data as unknown as Note[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    if (selectedWorkspace?.id && selectedOrganization?.id && entityId) {
      fetchNotes();
    }
  }, [selectedWorkspace?.id, selectedOrganization?.id, entityId, fetchNotes]);

  const handleCreateNote = async () => {
    try {
      const createData: CreateNoteDto = {
        title: formData.title || undefined,
        content: formData.content,
        [entityType === "contact"
          ? "contactId"
          : entityType === "company"
            ? "companyId"
            : "dealId"]: entityId,
      };

      const token = authService.getAccessToken();
      await notesService.createNote(createData, queryParams, token as string);
      setFormData({ title: "", content: "" });
      setShowCreateForm(false);
      fetchNotes();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    }
  };

  const handleUpdateNote = async (noteId: string, data: UpdateNoteDto) => {
    try {
      const token = authService.getAccessToken();
      await notesService.updateNote(noteId, data, queryParams, token as string);
      setEditingNote(null);
      fetchNotes();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const token = authService.getAccessToken();
      await notesService.deleteNote(noteId, queryParams, token as string);
      fetchNotes();
      onRefresh?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEntityIcon = () => {
    switch (entityType) {
      case "contact":
        return <User className="w-4 h-4 text-blue-600" />;
      case "company":
        return <Building className="w-4 h-4 text-green-600" />;
      case "deal":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium text-gray-900">Notes</h3>
          <button className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">
            <Plus className="mr-1 w-3 h-3" />
            Add Note
          </button>
        </div>
        <div className="py-8 text-center">
          <div className="mx-auto w-8 h-8 rounded-full border-b-2 border-blue-600 animate-spin"></div>
          <p className="mt-2 text-sm text-gray-500">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-gray-900">Notes</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
        >
          <Plus className="mr-1 w-3 h-3" />
          Add Note
        </button>
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Create Note Form */}
      {showCreateForm && (
        <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="mb-3 text-sm font-medium text-gray-900">
            Create New Note
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Title (optional)
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Note title..."
                maxLength={200}
              />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-700">
                Content *
              </label>
              <textarea
                value={formData.content}
                onChange={e =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter note content..."
                rows={4}
                maxLength={10000}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setFormData({ title: "", content: "" });
                }}
                className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNote}
                disabled={!formData.content.trim()}
                className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-3">
          {notes.map(note => (
            <div
              key={note.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {editingNote?.id === note.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Title (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Note title..."
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-700">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={e =>
                        setFormData({ ...formData, content: e.target.value })
                      }
                      className="px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter note content..."
                      rows={4}
                      maxLength={10000}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setEditingNote(null);
                        setFormData({ title: "", content: "" });
                      }}
                      className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateNote(note.id, {
                          title: formData.title || undefined,
                          content: formData.content,
                        })
                      }
                      disabled={!formData.content.trim()}
                      className="px-3 py-1 text-xs text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update Note
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {getEntityIcon()}
                      <span className="text-xs font-medium text-gray-700">
                        {note.author?.name || "Unknown Author"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(note.createdAt)}
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setEditingNote(note);
                          setFormData({
                            title: note.title || "",
                            content: note.content,
                          });
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit note"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {note.title && (
                    <h4 className="mb-2 text-sm font-medium text-gray-900">
                      {note.title}
                    </h4>
                  )}

                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {renderTextWithLinks(note.content)}
                  </p>

                  {note.updatedAt !== note.createdAt && (
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <Clock className="mr-1 w-3 h-3" />
                      <span>Updated {formatDate(note.updatedAt)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <MessageSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">No notes associated yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Create first note
          </button>
        </div>
      )}
    </div>
  );
};

export default NotesSection;
