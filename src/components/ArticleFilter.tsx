import { Check, FileText, Lightbulb, List } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export type ArticleFilterType = 'all' | 'generated' | 'ideas';

interface ArticleFilterProps {
  value: ArticleFilterType;
  onChange: (value: ArticleFilterType) => void;
  counts: {
    all: number;
    generated: number;
    ideas: number;
  };
}

export function ArticleFilter({ value, onChange, counts }: ArticleFilterProps) {
  return (
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
  );
}
