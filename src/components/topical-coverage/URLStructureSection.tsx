import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderTree } from 'lucide-react';
import { URLStructureItem } from '@/types/topical-coverage';

interface URLStructureSectionProps {
  items: URLStructureItem[];
}

const intentStageStyles: Record<string, string> = {
  awareness: 'bg-info/10 text-info border-info/20',
  consideration: 'bg-warning/10 text-warning border-warning/20',
  decision: 'bg-success/10 text-success border-success/20',
  retention: 'bg-primary/10 text-primary border-primary/20',
};

export function URLStructureSection({ items }: URLStructureSectionProps) {
  if (items.length === 0) return null;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderTree className="w-5 h-5 text-primary" />
          Suggested URL Structure
        </CardTitle>
        <CardDescription className="text-xs">
          Recommended URL hierarchy based on the semantic network — advisory, not prescriptive. Can be adjusted to fit your existing structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto_1fr] gap-0 text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/30 border-b px-4 py-2">
            <span>URL</span>
            <span>Topic</span>
            <span>Stage</span>
            <span>Notes</span>
          </div>
          <div className="divide-y">
            {items.map((item, i) => {
              const depth = (item.suggestedUrl.match(/\//g) || []).length - 1;
              return (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_auto_1fr] gap-0 items-center px-4 py-2.5 transition-colors duration-200 hover:bg-accent/20"
                >
                  <code
                    className="text-xs font-mono text-foreground"
                    style={{ paddingLeft: `${Math.max(0, depth - 1) * 12}px` }}
                  >
                    {item.suggestedUrl}
                  </code>
                  <span className="text-xs text-foreground">{item.topic}</span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${intentStageStyles[item.intentStage] || ''}`}
                  >
                    {item.intentStage}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{item.notes}</span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
