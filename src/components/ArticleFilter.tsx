import { Check, FileText, Lightbulb, List, Users } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Persona } from '@/types/project';

export type ArticleFilterType = 'all' | 'generated' | 'ideas';

interface ArticleFilterProps {
  value: ArticleFilterType;
  onChange: (value: ArticleFilterType) => void;
  counts: {
    all: number;
    generated: number;
    ideas: number;
  };
  personas?: Persona[];
  selectedPersonaId?: string | null;
  onPersonaChange?: (personaId: string | null) => void;
  personaCounts?: Record<string, number>;
}

export function ArticleFilter({ 
  value, 
  onChange, 
  counts,
  personas = [],
  selectedPersonaId,
  onPersonaChange,
  personaCounts = {},
}: ArticleFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      {/* Status Filter */}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={(v) => v && onChange(v as ArticleFilterType)}
        className="justify-start"
      >
        <ToggleGroupItem value="all" aria-label="All articles" className="gap-2 px-3">
          <List className="w-4 h-4" />
          <span>All</span>
          <span className="text-xs text-muted-foreground">({counts.all})</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="generated" aria-label="Generated articles" className="gap-2 px-3">
          <Check className="w-4 h-4" />
          <span>Generated</span>
          <span className="text-xs text-muted-foreground">({counts.generated})</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="ideas" aria-label="Title ideas" className="gap-2 px-3">
          <Lightbulb className="w-4 h-4" />
          <span>Title Ideas</span>
          <span className="text-xs text-muted-foreground">({counts.ideas})</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Persona Filter */}
      {personas.length > 0 && onPersonaChange && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <Select 
            value={selectedPersonaId || 'all'} 
            onValueChange={(value) => onPersonaChange(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by persona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <span>All Personas</span>
              </SelectItem>
              {personas.map((persona) => (
                <SelectItem key={persona.id} value={persona.id}>
                  <div className="flex items-center gap-2">
                    <span>{persona.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {personaCounts[persona.id] || 0}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
