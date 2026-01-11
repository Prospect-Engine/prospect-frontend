'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Phone, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Communication {
  id: string;
  type: 'EMAIL' | 'PHONE' | 'SMS' | 'CHAT' | 'OTHER';
  direction: 'INBOUND' | 'OUTBOUND';
  subject?: string;
  content: string;
  status?: string;
  createdAt: string;
  sentBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CandidateCommunicationProps {
  applicantId: string;
  candidateEmail?: string;
}

const typeIcons = {
  EMAIL: <Mail className="h-4 w-4" />,
  PHONE: <Phone className="h-4 w-4" />,
  SMS: <MessageSquare className="h-4 w-4" />,
  CHAT: <MessageSquare className="h-4 w-4" />,
  OTHER: <MessageSquare className="h-4 w-4" />,
};

const typeColors = {
  EMAIL: 'bg-blue-100 text-blue-600',
  PHONE: 'bg-green-100 text-green-600',
  SMS: 'bg-purple-100 text-purple-600',
  CHAT: 'bg-orange-100 text-orange-600',
  OTHER: 'bg-slate-100 text-slate-600',
};

export function CandidateCommunication({ applicantId, candidateEmail }: CandidateCommunicationProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [newComm, setNewComm] = useState({
    type: 'EMAIL' as Communication['type'],
    direction: 'OUTBOUND' as Communication['direction'],
    subject: '',
    content: '',
    sendEmail: false,
  });

  useEffect(() => {
    fetchCommunications();
  }, [applicantId, limit]);

  const fetchCommunications = async () => {
    try {
      const res = await fetch(`/api/admin/crm/communications?applicantId=${applicantId}&limit=${limit}`);
      const data = await res.json();
      if (data.success) {
        setCommunications(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommunication = async () => {
    if (!newComm.content.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin/crm/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId,
          ...newComm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCommunications([data.data, ...communications]);
        setNewComm({
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: '',
          content: '',
          sendEmail: false,
        });
        setDialogOpen(false);
        toast.success(newComm.sendEmail ? 'Email sent' : 'Communication logged');
      }
    } catch {
      toast.error('Failed to send communication');
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Communications</span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{total}</Badge>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-1" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Log Communication</DialogTitle>
                </DialogHeader>
                <Tabs defaultValue="email" className="pt-4">
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="email" onClick={() => setNewComm({ ...newComm, type: 'EMAIL' })}>
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" onClick={() => setNewComm({ ...newComm, type: 'PHONE' })}>
                      Phone
                    </TabsTrigger>
                    <TabsTrigger value="sms" onClick={() => setNewComm({ ...newComm, type: 'SMS' })}>
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="other" onClick={() => setNewComm({ ...newComm, type: 'OTHER' })}>
                      Other
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="email" className="space-y-4 pt-4">
                    <div>
                      <Input
                        placeholder="Subject"
                        value={newComm.subject}
                        onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Email content..."
                        value={newComm.content}
                        onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                        className="min-h-[150px]"
                      />
                    </div>
                    {candidateEmail && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sendEmail"
                          checked={newComm.sendEmail}
                          onChange={(e) => setNewComm({ ...newComm, sendEmail: e.target.checked })}
                          className="rounded"
                        />
                        <label htmlFor="sendEmail" className="text-sm">
                          Actually send email to {candidateEmail}
                        </label>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="phone" className="space-y-4 pt-4">
                    <div>
                      <Select
                        value={newComm.direction}
                        onValueChange={(value) => setNewComm({ ...newComm, direction: value as typeof newComm.direction })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Direction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OUTBOUND">Outbound (I called)</SelectItem>
                          <SelectItem value="INBOUND">Inbound (They called)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Textarea
                        placeholder="Call notes..."
                        value={newComm.content}
                        onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                        className="min-h-[150px]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="sms" className="space-y-4 pt-4">
                    <div>
                      <Textarea
                        placeholder="SMS content..."
                        value={newComm.content}
                        onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="other" className="space-y-4 pt-4">
                    <div>
                      <Input
                        placeholder="Subject/Title"
                        value={newComm.subject}
                        onChange={(e) => setNewComm({ ...newComm, subject: e.target.value })}
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Details..."
                        value={newComm.content}
                        onChange={(e) => setNewComm({ ...newComm, content: e.target.value })}
                        className="min-h-[150px]"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <Button
                  onClick={handleSendCommunication}
                  disabled={!newComm.content.trim() || sending}
                  className="w-full mt-4"
                >
                  {newComm.sendEmail ? 'Send Email' : 'Log Communication'}
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4 text-slate-500">Loading communications...</div>
        ) : communications.length === 0 ? (
          <div className="text-center py-4 text-slate-500">No communications yet</div>
        ) : (
          <div className="space-y-3">
            {communications.map(comm => (
              <div
                key={comm.id}
                className="p-3 rounded-lg border bg-slate-50"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${typeColors[comm.type]}`}>
                    {typeIcons[comm.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={comm.direction === 'OUTBOUND' ? 'default' : 'secondary'}>
                        {comm.direction === 'OUTBOUND' ? 'Sent' : 'Received'}
                      </Badge>
                      {comm.subject && (
                        <span className="font-medium text-sm">{comm.subject}</span>
                      )}
                      {comm.status && (
                        <Badge variant="outline" className={comm.status === 'SENT' ? 'text-green-600' : ''}>
                          {comm.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-2">{comm.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      {comm.sentBy && (
                        <span className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {comm.sentBy.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {comm.sentBy.name}
                        </span>
                      )}
                      <span>{format(new Date(comm.createdAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {total > communications.length && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLimit(limit + 10)}
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                Load more ({total - communications.length} remaining)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
