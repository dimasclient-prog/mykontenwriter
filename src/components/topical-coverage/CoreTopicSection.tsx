import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass } from 'lucide-react';
import { CoreTopic } from '@/types/topical-coverage';

interface CoreTopicSectionProps {
  coreTopic: CoreTopic;
}

export function CoreTopicSection({ coreTopic }: CoreTopicSectionProps) {
  const confidenceColor = {
    high: 'bg-success/15 text-success border-success/30',
    medium: 'bg-warning/15 text-warning border-warning/30',
    low: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Compass className="w-5 h-5 text-primary" />
            Core Topic Recommendation
          </CardTitle>
          <Badge variant="outline" className={confidenceColor[coreTopic.confidence as keyof typeof confidenceColor] || confidenceColor.medium}>
            {coreTopic.confidence} confidence
          </Badge>
        </div>
        <CardDescription className="text-xs">
          Based on your current content signals, this website appears to center around…
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-accent/50 border border-primary/10 p-5">
          <h3 className="text-xl font-serif font-bold text-foreground mb-2">
            {coreTopic.topic}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {coreTopic.description}
          </p>
        </div>

        {coreTopic.entities && coreTopic.entities.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Dominant Entities & Concepts
            </p>
            <div className="flex flex-wrap gap-2">
              {coreTopic.entities.map((entity, i) => (
                <Badge key={i} variant="secondary" className="font-normal text-xs">
                  {entity}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
