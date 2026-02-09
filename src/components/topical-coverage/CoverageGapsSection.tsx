import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { CoverageGap } from '@/types/topical-coverage';

interface CoverageGapsSectionProps {
  gaps: CoverageGap[];
}

const typeConfig = {
  missing: {
    icon: AlertCircle,
    label: 'Missing',
    style: 'bg-destructive/10 text-destructive border-destructive/20',
    cardStyle: 'border-destructive/15 bg-destructive/5',
  },
  weak: {
    icon: TrendingUp,
    label: 'Weak Cluster',
    style: 'bg-warning/10 text-warning border-warning/20',
    cardStyle: 'border-warning/15 bg-warning/5',
  },
  opportunity: {
    icon: Lightbulb,
    label: 'Opportunity',
    style: 'bg-info/10 text-info border-info/20',
    cardStyle: 'border-info/15 bg-info/5',
  },
};

export function CoverageGapsSection({ gaps }: CoverageGapsSectionProps) {
  if (gaps.length === 0) return null;

  const sortedGaps = [...gaps].sort((a, b) => a.suggestedOrder - b.suggestedOrder);

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="w-5 h-5 text-primary" />
          Coverage Gaps & Strategic Notes
        </CardTitle>
        <CardDescription className="text-xs">
          Covering these areas may improve contextual authority. Listed in suggested order of coverage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedGaps.map((gap, i) => {
            const config = typeConfig[gap.type] || typeConfig.opportunity;
            const Icon = config.icon;

            return (
              <div
                key={i}
                className={`rounded-md border p-4 transition-colors duration-200 hover:bg-accent/20 ${config.cardStyle}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="text-xs font-mono text-muted-foreground w-5 text-right">
                      {gap.suggestedOrder}
                    </span>
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground">{gap.area}</h4>
                      <Badge variant="outline" className={`text-[10px] ${config.style}`}>
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {gap.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
