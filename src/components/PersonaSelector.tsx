import { User, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Persona } from '@/types/project';

interface PersonaSelectorProps {
  personas: Persona[];
  selectedPersonaId: string | null;
  onSelect: (personaId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  allowAll?: boolean;
}

export function PersonaSelector({
  personas,
  selectedPersonaId,
  onSelect,
  placeholder = 'Select a persona',
  disabled = false,
  allowAll = false,
}: PersonaSelectorProps) {
  return (
    <Select
      value={selectedPersonaId || (allowAll ? 'all' : undefined)}
      onValueChange={(value) => onSelect(value === 'all' ? null : value)}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {allowAll && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              All Personas
            </div>
          </SelectItem>
        )}
        {personas.map((persona) => (
          <SelectItem key={persona.id} value={persona.id}>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span>{persona.name}</span>
                {persona.role && (
                  <span className="text-xs text-muted-foreground">{persona.role}</span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
