import { User, MapPin, Briefcase, AlertTriangle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Persona } from '@/types/project';
import { cn } from '@/lib/utils';

interface PersonaCardProps {
  persona: Persona;
  onClick?: () => void;
  onDelete?: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function PersonaCard({ 
  persona, 
  onClick, 
  onDelete, 
  isSelected = false,
  compact = false 
}: PersonaCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        )}
        onClick={onClick}
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{persona.name}</p>
          {persona.role && (
            <p className="text-sm text-muted-foreground truncate">{persona.role}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card 
      className={cn(
        'group hover:border-primary/30 transition-all cursor-pointer',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{persona.name}</CardTitle>
              {persona.role && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {persona.role}
                </div>
              )}
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {persona.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {persona.location}
          </div>
        )}

        {persona.painPoints.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <AlertTriangle className="w-3.5 h-3.5" />
              Pain Points
            </div>
            <div className="flex flex-wrap gap-1.5">
              {persona.painPoints.slice(0, 2).map((point, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {point.length > 30 ? point.slice(0, 30) + '...' : point}
                </Badge>
              ))}
              {persona.painPoints.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{persona.painPoints.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {persona.concerns && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {persona.concerns}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
