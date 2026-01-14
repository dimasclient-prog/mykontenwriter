import { User, MapPin, Briefcase, Users, AlertTriangle, MessageSquare, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Persona } from '@/types/project';

interface PersonaDetailModalProps {
  persona: Persona | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (persona: Persona) => void;
}

export function PersonaDetailModal({ persona, open, onOpenChange, onEdit }: PersonaDetailModalProps) {
  if (!persona) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{persona.name}</DialogTitle>
                {persona.role && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Briefcase className="w-4 h-4" />
                    {persona.role}
                  </div>
                )}
              </div>
            </div>
            {onEdit && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onEdit(persona)}
                className="gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Location & Family Status */}
          <div className="grid grid-cols-2 gap-4">
            {persona.location && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-foreground">{persona.location}</p>
              </div>
            )}
            {persona.familyStatus && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <Users className="w-4 h-4" />
                  Family Status
                </div>
                <p className="text-foreground">{persona.familyStatus}</p>
              </div>
            )}
          </div>

          {/* Pain Points */}
          {persona.painPoints.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="w-4 h-4" />
                Business Pain Points
              </div>
              <div className="flex flex-wrap gap-2">
                {persona.painPoints.map((point, i) => (
                  <Badge key={i} variant="secondary" className="py-1.5">
                    {point}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Concerns */}
          {persona.concerns && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                Concerns
              </div>
              <p className="text-foreground bg-muted/50 rounded-lg p-3">
                {persona.concerns}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
