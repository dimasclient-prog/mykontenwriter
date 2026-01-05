import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Users, Eye, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type ShareRole = 'viewer' | 'editor';

interface ProjectShare {
  id: string;
  shared_with_email: string;
  role: ShareRole;
  created_at: string;
}

interface ProjectShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

export function ProjectShareModal({ open, onOpenChange, projectId, projectName }: ProjectShareModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [shares, setShares] = useState<ProjectShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(true);

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open, projectId]);

  const fetchShares = async () => {
    setIsLoadingShares(true);
    try {
      const { data, error } = await supabase
        .from('project_shares')
        .select('id, shared_with_email, role, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data as ProjectShare[] || []);
    } catch (err) {
      console.error('Error fetching shares:', err);
      toast.error('Failed to load project shares');
    } finally {
      setIsLoadingShares(false);
    }
  };

  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already shared
      const existingShare = shares.find(s => s.shared_with_email.toLowerCase() === email.toLowerCase());
      if (existingShare) {
        toast.error('This project is already shared with this email');
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('project_shares')
        .insert({
          project_id: projectId,
          shared_with_email: email.toLowerCase(),
          role: role,
          invited_by: user.id,
        });

      if (error) throw error;

      toast.success(`Project shared with ${email}`);
      setEmail('');
      setRole('viewer');
      fetchShares();
    } catch (err: any) {
      console.error('Error sharing project:', err);
      if (err.code === '23505') {
        toast.error('This project is already shared with this email');
      } else {
        toast.error('Failed to share project');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string, shareEmail: string) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast.success(`Removed access for ${shareEmail}`);
      setShares(shares.filter(s => s.id !== shareId));
    } catch (err) {
      console.error('Error removing share:', err);
      toast.error('Failed to remove access');
    }
  };

  const handleUpdateRole = async (shareId: string, newRole: ShareRole) => {
    try {
      const { error } = await supabase
        .from('project_shares')
        .update({ role: newRole })
        .eq('id', shareId);

      if (error) throw error;

      toast.success('Access level updated');
      setShares(shares.map(s => s.id === shareId ? { ...s, role: newRole } : s));
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Failed to update access level');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share Project
          </DialogTitle>
          <DialogDescription>
            Share "{projectName}" with other users
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invite Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
              />
            </div>

            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <Label>Access Level</Label>
                <Select value={role} onValueChange={(v: ShareRole) => setRole(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span>View Only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="editor">
                      <div className="flex items-center gap-2">
                        <Pencil className="w-4 h-4" />
                        <span>Editor</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Invite
              </Button>
            </div>
          </div>

          {/* Shared Users List */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">People with access</Label>
            {isLoadingShares ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Not shared with anyone yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {share.shared_with_email[0].toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{share.shared_with_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={share.role}
                        onValueChange={(v: ShareRole) => handleUpdateRole(share.id, v)}
                      >
                        <SelectTrigger className="w-[110px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <div className="flex items-center gap-2">
                              <Eye className="w-3 h-3" />
                              <span>Viewer</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="editor">
                            <div className="flex items-center gap-2">
                              <Pencil className="w-3 h-3" />
                              <span>Editor</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleRemoveShare(share.id, share.shared_with_email)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
