'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Pin, Lock, MoreVertical, Trash2, Edit2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Note {
  id: string;
  content: string;
  isPinned: boolean;
  isPrivate: boolean;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
}

interface CandidateNotesProps {
  applicantId: string;
}

export function CandidateNotes({ applicantId }: CandidateNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchNotes();
  }, [applicantId]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/admin/crm/notes?applicantId=${applicantId}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId,
          content: newNote,
          isPinned,
          isPrivate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes([data.data, ...notes]);
        setNewNote('');
        setIsPinned(false);
        setIsPrivate(false);
        toast.success('Note added');
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/crm/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, content: editContent }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.map(n => n.id === noteId ? data.data : n));
        setEditingId(null);
        toast.success('Note updated');
      }
    } catch {
      toast.error('Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await fetch(`/api/admin/crm/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.filter(n => n.id !== noteId));
        toast.success('Note deleted');
      }
    } catch {
      toast.error('Failed to delete note');
    }
  };

  const handleTogglePin = async (noteId: string, currentPinned: boolean) => {
    try {
      const res = await fetch('/api/admin/crm/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, isPinned: !currentPinned }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes(notes.map(n => n.id === noteId ? data.data : n)
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }));
        toast.success(currentPinned ? 'Note unpinned' : 'Note pinned');
      }
    } catch {
      toast.error('Failed to update note');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notes</span>
          <Badge variant="outline">{notes.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a note about this candidate..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={isPinned ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
              >
                <Pin className="h-3 w-3 mr-1" />
                Pin
              </Button>
              <Button
                variant={isPrivate ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPrivate(!isPrivate)}
              >
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Button>
            </div>
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || saving}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Note
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-4 text-slate-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No notes yet</div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notes.map(note => (
              <div
                key={note.id}
                className={`p-3 rounded-lg border ${note.isPinned ? 'bg-yellow-50 border-yellow-200' : 'bg-slate-50'}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {note.author.name?.charAt(0) || note.author.email.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{note.author.name}</span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {note.isPinned && <Pin className="h-3 w-3 text-yellow-600" />}
                    {note.isPrivate && <Lock className="h-3 w-3 text-slate-400" />}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTogglePin(note.id, note.isPinned)}>
                          <Pin className="h-3 w-3 mr-2" />
                          {note.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setEditingId(note.id);
                          setEditContent(note.content);
                        }}>
                          <Edit2 className="h-3 w-3 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateNote(note.id)}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
