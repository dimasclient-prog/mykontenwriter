import { useState } from 'react';
import { User, Plus, X, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PersonaFormData {
  name: string;
  role: string;
  location: string;
  familyStatus: string;
  painPoints: string[];
  concerns: string;
}

interface PersonaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PersonaFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PersonaFormModal({ open, onOpenChange, onSubmit, isLoading }: PersonaFormModalProps) {
  const [formData, setFormData] = useState<PersonaFormData>({
    name: '',
    role: '',
    location: '',
    familyStatus: '',
    painPoints: [],
    concerns: '',
  });
  const [painPointInput, setPainPointInput] = useState('');

  const handleAddPainPoint = () => {
    if (painPointInput.trim() && !formData.painPoints.includes(painPointInput.trim())) {
      setFormData(prev => ({
        ...prev,
        painPoints: [...prev.painPoints, painPointInput.trim()],
      }));
      setPainPointInput('');
    }
  };

  const handleRemovePainPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      painPoints: prev.painPoints.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    await onSubmit(formData);
    // Reset form after successful submit
    setFormData({
      name: '',
      role: '',
      location: '',
      familyStatus: '',
      painPoints: [],
      concerns: '',
    });
    setPainPointInput('');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      location: '',
      familyStatus: '',
      painPoints: [],
      concerns: '',
    });
    setPainPointInput('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Add New Persona
          </DialogTitle>
          <DialogDescription>
            Create a new target persona for your content strategy
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Sarah the Marketing Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Job / Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Marketing Manager at a Tech Startup"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Jakarta, Indonesia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyStatus">Family Status</Label>
              <Input
                id="familyStatus"
                value={formData.familyStatus}
                onChange={(e) => setFormData(prev => ({ ...prev, familyStatus: e.target.value }))}
                placeholder="e.g., Married, 2 kids"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Business Pain Points</Label>
            <div className="flex gap-2">
              <Input
                value={painPointInput}
                onChange={(e) => setPainPointInput(e.target.value)}
                placeholder="Enter a pain point..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPainPoint())}
              />
              <Button type="button" onClick={handleAddPainPoint} variant="outline" size="icon">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.painPoints.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.painPoints.map((point, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 py-1">
                    {point}
                    <button
                      type="button"
                      onClick={() => handleRemovePainPoint(i)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="concerns">Concerns (optional)</Label>
            <Textarea
              id="concerns"
              value={formData.concerns}
              onChange={(e) => setFormData(prev => ({ ...prev, concerns: e.target.value }))}
              placeholder="What are their main concerns or worries?"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name.trim() || isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Add Persona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
