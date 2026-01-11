'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Users, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Pool {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  _count: {
    candidates: number;
  };
}

interface CandidatePoolsProps {
  applicantId: string;
  initialPools?: Pool[];
}

export function CandidatePools({ applicantId, initialPools = [] }: CandidatePoolsProps) {
  const [pools, setPools] = useState<Pool[]>(initialPools);
  const [allPools, setAllPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [newPoolName, setNewPoolName] = useState('');
  const [newPoolColor, setNewPoolColor] = useState('#8b5cf6');

  useEffect(() => {
    fetchAllPools();
    fetchCandidatePools();
  }, [applicantId]);

  const fetchAllPools = async () => {
    try {
      const res = await fetch('/api/admin/crm/pools');
      const data = await res.json();
      if (data.success) {
        setAllPools(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pools:', error);
    }
  };

  const fetchCandidatePools = async () => {
    try {
      const res = await fetch(`/api/admin/crm/pools?applicantId=${applicantId}`);
      const data = await res.json();
      if (data.success) {
        setPools(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch candidate pools:', error);
    }
  };

  const handleAddToPool = async (poolId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/pools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, applicantId, action: 'add' }),
      });
      const data = await res.json();
      if (data.success) {
        const addedPool = allPools.find(p => p.id === poolId);
        if (addedPool) {
          setPools([...pools, addedPool]);
        }
        toast.success('Added to pool');
      }
    } catch {
      toast.error('Failed to add to pool');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromPool = async (poolId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/pools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poolId, applicantId, action: 'remove' }),
      });
      const data = await res.json();
      if (data.success) {
        setPools(pools.filter(p => p.id !== poolId));
        toast.success('Removed from pool');
      }
    } catch {
      toast.error('Failed to remove from pool');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePool = async () => {
    if (!newPoolName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/crm/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPoolName, color: newPoolColor }),
      });
      const data = await res.json();
      if (data.success) {
        setAllPools([...allPools, data.data]);
        await handleAddToPool(data.data.id);
        setNewPoolName('');
        toast.success('Pool created');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  const availablePools = allPools.filter(p => !pools.some(assigned => assigned.id === p.id));

  const colors = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pools
          </span>
          <Badge variant="outline">{pools.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pools.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-2">Not in any pools</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {pools.map(pool => (
                <div
                  key={pool.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-white"
                  style={{ backgroundColor: pool.color }}
                >
                  <span>{pool.name}</span>
                  <button
                    onClick={() => handleRemoveFromPool(pool.id)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add to Pool
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="start">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Manage Pools
                </div>

                {availablePools.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500">Available pools</p>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {availablePools.map(pool => (
                        <button
                          key={pool.id}
                          onClick={() => handleAddToPool(pool.id)}
                          disabled={loading}
                          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-sm hover:bg-slate-100 transition"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: pool.color }}
                            />
                            {pool.name}
                          </span>
                          <span className="text-xs text-slate-400">
                            {pool._count.candidates}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t">
                  <p className="text-xs text-slate-500">Create new pool</p>
                  <Input
                    placeholder="Pool name"
                    value={newPoolName}
                    onChange={(e) => setNewPoolName(e.target.value)}
                    className="h-8"
                  />
                  <div className="flex flex-wrap gap-1">
                    {colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewPoolColor(color)}
                        className={`w-5 h-5 rounded-full ${newPoolColor === color ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    onClick={handleCreatePool}
                    disabled={!newPoolName.trim() || loading}
                    className="w-full"
                  >
                    Create Pool
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
}
