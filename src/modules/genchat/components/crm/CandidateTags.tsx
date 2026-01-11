'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Plus, X, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface CandidateTag {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface CandidateTagsProps {
  applicantId: string;
  initialTags?: CandidateTag[];
}

export function CandidateTags({ applicantId, initialTags = [] }: CandidateTagsProps) {
  const [tags, setTags] = useState<CandidateTag[]>(initialTags);
  const [allTags, setAllTags] = useState<CandidateTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  useEffect(() => {
    fetchAllTags();
  }, []);

  const fetchAllTags = async () => {
    try {
      const res = await fetch('/api/admin/crm/tags');
      const data = await res.json();
      if (data.success) {
        setAllTags(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const handleAssignTag = async (tagId: string, tagData?: CandidateTag) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, tagId, action: 'assign' }),
      });
      const data = await res.json();
      if (data.success) {
        // Use provided tagData or find from allTags
        const assignedTag = tagData || allTags.find(t => t.id === tagId);
        if (assignedTag) {
          setTags(prev => {
            // Avoid duplicates
            if (prev.some(t => t.id === assignedTag.id)) return prev;
            return [...prev, assignedTag];
          });
        }
        if (!data.alreadyAssigned) {
          toast.success('Tag assigned');
        }
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to assign tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, tagId, action: 'remove' }),
      });
      const data = await res.json();
      if (data.success) {
        setTags(tags.filter(t => t.id !== tagId));
        toast.success('Tag removed');
      }
    } catch {
      toast.error('Failed to remove tag');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setLoading(true);
    try {
      // Create the tag
      const createRes = await fetch('/api/admin/crm/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName, color: newTagColor }),
      });
      const createData = await createRes.json();
      if (!createData.success) {
        toast.error(createData.error);
        return;
      }

      const newTag = createData.data;
      setAllTags(prev => [...prev, newTag]);

      // Assign the tag
      const assignRes = await fetch('/api/admin/crm/tags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId, tagId: newTag.id, action: 'assign' }),
      });
      const assignData = await assignRes.json();
      if (assignData.success) {
        // Directly add the new tag to tags state
        setTags(prev => [...prev, newTag]);
        setNewTagName('');
        toast.success('Tag created and assigned');
      } else {
        toast.error(assignData.error);
      }
    } catch {
      toast.error('Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const availableTags = allTags.filter(t => !tags.some(assigned => assigned.id === t.id));

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map(tag => (
          <Badge
            key={tag.id}
            style={{ backgroundColor: tag.color }}
            className="text-white flex items-center gap-1"
          >
            {tag.name}
            <button
              onClick={() => handleRemoveTag(tag.id)}
              className="ml-1 hover:bg-white/20 rounded-full p-0.5"
              disabled={loading}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3 mr-1" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Tag className="h-4 w-4" />
                Manage Tags
              </div>

              {availableTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Existing tags</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleAssignTag(tag.id)}
                        disabled={loading}
                        className="px-2 py-0.5 rounded text-xs text-white hover:opacity-80 transition"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs text-slate-500">Create new tag</p>
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="h-8"
                />
                <div className="flex flex-wrap gap-1">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-5 h-5 rounded-full ${newTagColor === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim() || loading}
                  className="w-full"
                >
                  Create & Assign
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
