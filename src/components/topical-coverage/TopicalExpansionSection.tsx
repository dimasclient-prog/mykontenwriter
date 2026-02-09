import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Layers, BookOpen, Scale, GraduationCap } from 'lucide-react';
import { TopicalExpansionGroup } from '@/types/topical-coverage';

interface TopicalExpansionSectionProps {
  groups: TopicalExpansionGroup[];
}

const categoryIcons = {
  foundational: BookOpen,
  supporting: Layers,
  comparative: Scale,
  advanced: GraduationCap,
};

const categoryColors = {
  foundational: 'text-primary',
  supporting: 'text-info',
  comparative: 'text-warning',
  advanced: 'text-success',
};

const priorityStyles = {
  high: 'bg-primary/10 text-primary border-primary/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border',
};

const intentStyles = {
  informational: 'bg-info/10 text-info border-info/20',
  navigational: 'bg-primary/10 text-primary border-primary/20',
  transactional: 'bg-success/10 text-success border-success/20',
  commercial: 'bg-warning/10 text-warning border-warning/20',
};

export function TopicalExpansionSection({ groups }: TopicalExpansionSectionProps) {
  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Layers className="w-5 h-5 text-primary" />
          Holistic Topical Expansion
        </CardTitle>
        <CardDescription className="text-xs">
          Semantic content network grouped by strategic role — think in meaning and relationships, not keywords.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" defaultValue={['foundational']} className="space-y-2">
          {groups.map((group) => {
            const Icon = categoryIcons[group.category] || Layers;
            const colorClass = categoryColors[group.category] || 'text-primary';

            return (
              <AccordionItem
                key={group.category}
                value={group.category}
                className="border rounded-lg px-4 bg-card/50"
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-left">
                    <Icon className={`w-4 h-4 ${colorClass} shrink-0`} />
                    <div>
                      <span className="font-medium text-sm">{group.label}</span>
                      <Badge variant="outline" className="ml-2 text-xs font-normal">
                        {group.topics.length}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <p className="text-xs text-muted-foreground mb-4">{group.description}</p>
                  <div className="space-y-3">
                    {group.topics.map((topic, i) => (
                      <div
                        key={i}
                        className="rounded-md border bg-background/50 p-3 space-y-2 transition-colors duration-200 hover:bg-accent/30"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-foreground">{topic.topic}</h4>
                          <div className="flex gap-1.5 shrink-0">
                            <Badge variant="outline" className={`text-[10px] ${priorityStyles[topic.priority] || ''}`}>
                              {topic.priority}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] ${intentStyles[topic.intentType as keyof typeof intentStyles] || ''}`}>
                              {topic.intentType}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Semantic role:</span> {topic.semanticRole}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Relationship:</span> {topic.relationship}
                        </p>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
