'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  UserPlus,
  Crown,
  Shield,
  UserCircle,
  Eye,
  Briefcase,
  Trash2,
} from 'lucide-react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface TeamMember {
  id: string;
  role: string;
  admin: Admin;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  members: TeamMember[];
}

interface TeamManagementProps {
  initialTeams: Team[];
  availableAdmins: Admin[];
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  OWNER: <Crown className="h-4 w-4 text-amber-500" />,
  ADMIN: <Shield className="h-4 w-4 text-blue-500" />,
  RECRUITER: <UserCircle className="h-4 w-4 text-green-500" />,
  HIRING_MANAGER: <Briefcase className="h-4 w-4 text-purple-500" />,
  VIEWER: <Eye className="h-4 w-4 text-slate-400" />,
};

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RECRUITER: 'Recruiter',
  HIRING_MANAGER: 'Hiring Manager',
  VIEWER: 'Viewer',
};

export function TeamManagement({ initialTeams, availableAdmins }: TeamManagementProps) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create team form state
  const [newTeamName, setNewTeamName] = useState('');

  // Add member form state
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [memberRole, setMemberRole] = useState('RECRUITER');

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      });

      if (response.ok) {
        const result = await response.json();
        setTeams(prev => [result.data, ...prev]);
        setNewTeamName('');
        setIsCreateDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedAdmin) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/team/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: selectedAdmin,
          role: memberRole,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTeams(prev =>
          prev.map(team =>
            team.id === selectedTeam.id
              ? { ...team, members: [...team.members, result.data] }
              : team
          )
        );
        setSelectedAdmin('');
        setMemberRole('RECRUITER');
        setIsAddMemberDialogOpen(false);
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to add member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const response = await fetch(`/api/admin/team/${teamId}/members?memberId=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeams(prev =>
          prev.map(team =>
            team.id === teamId
              ? { ...team, members: team.members.filter(m => m.id !== memberId) }
              : team
          )
        );
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const openAddMemberDialog = (team: Team) => {
    setSelectedTeam(team);
    setIsAddMemberDialogOpen(true);
  };

  // Get admins not already in the selected team
  const getAvailableAdminsForTeam = () => {
    if (!selectedTeam) return availableAdmins;
    const memberIds = selectedTeam.members.map(m => m.admin.id);
    return availableAdmins.filter(admin => !memberIds.includes(admin.id));
  };

  return (
    <div className="space-y-6">
      {/* Create Team Button */}
      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Team Name</Label>
                <Input
                  placeholder="e.g., Engineering Hiring"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleCreateTeam}
                disabled={isSubmitting || !newTeamName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select User</Label>
              <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableAdminsForTeam().map(admin => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name} ({admin.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={memberRole} onValueChange={setMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="RECRUITER">Recruiter</SelectItem>
                  <SelectItem value="HIRING_MANAGER">Hiring Manager</SelectItem>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleAddMember}
              disabled={isSubmitting || !selectedAdmin}
            >
              {isSubmitting ? 'Adding...' : 'Add Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Teams List */}
      {teams.length === 0 ? (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p className="text-slate-500">Create your first team to start collaborating</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {teams.map(team => (
            <Card key={team.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{team.name}</h3>
                    <p className="text-sm text-slate-500">{team.members.length} members</p>
                  </div>
                </div>

                <Button variant="outline" onClick={() => openAddMemberDialog(team)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-2">
                {team.members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      {ROLE_ICONS[member.role]}
                      <div>
                        <p className="font-medium">{member.admin.name}</p>
                        <p className="text-sm text-slate-500">{member.admin.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                      {member.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500"
                          onClick={() => handleRemoveMember(team.id, member.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
