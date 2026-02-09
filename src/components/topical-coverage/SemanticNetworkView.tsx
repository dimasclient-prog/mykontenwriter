import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';
import { SemanticNode } from '@/types/topical-coverage';

interface SemanticNetworkViewProps {
  nodes: SemanticNode[];
}

const layerColors = [
  'border-primary bg-primary/10 text-primary',
  'border-info bg-info/10 text-info',
  'border-warning bg-warning/10 text-warning',
  'border-success bg-success/10 text-success',
  'border-muted bg-muted/10 text-muted-foreground',
];

const relationshipBadge: Record<string, string> = {
  core: 'bg-primary/15 text-primary border-primary/30',
  child: 'bg-info/15 text-info border-info/30',
  sibling: 'bg-warning/15 text-warning border-warning/30',
  lateral: 'bg-muted text-muted-foreground border-border',
};

export function SemanticNetworkView({ nodes }: SemanticNetworkViewProps) {
  const layers = useMemo(() => {
    const layerMap = new Map<number, SemanticNode[]>();
    nodes.forEach(node => {
      const layer = node.layer || 0;
      if (!layerMap.has(layer)) layerMap.set(layer, []);
      layerMap.get(layer)!.push(node);
    });
    return Array.from(layerMap.entries()).sort(([a], [b]) => a - b);
  }, [nodes]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, SemanticNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);

  if (nodes.length === 0) return null;

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Network className="w-5 h-5 text-primary" />
          Semantic Content Network
        </CardTitle>
        <CardDescription className="text-xs">
          Topics structured as a network — parent–child relationships and lateral semantic connections, layered by priority.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {layers.map(([layer, layerNodes]) => (
            <div key={layer} className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-px flex-1 ${layer === 0 ? 'bg-primary/30' : 'bg-border'}`} />
                <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  {layer === 0 ? 'Core Layer' : `Layer ${layer}`}
                </span>
                <div className={`h-px flex-1 ${layer === 0 ? 'bg-primary/30' : 'bg-border'}`} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {layerNodes.map((node) => {
                  const colorClass = layerColors[Math.min(layer, layerColors.length - 1)];
                  const parentNode = node.parentId ? nodeMap.get(node.parentId) : null;

                  return (
                    <div
                      key={node.id}
                      className={`rounded-md border p-3 space-y-1.5 transition-all duration-200 hover:shadow-sm ${colorClass}`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-sm font-medium leading-tight">{node.topic}</h4>
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${relationshipBadge[node.relationshipType] || relationshipBadge.lateral}`}
                        >
                          {node.relationshipType}
                        </Badge>
                      </div>
                      {parentNode && (
                        <p className="text-[10px] text-muted-foreground">
                          ↑ {parentNode.topic}
                        </p>
                      )}
                      {node.relatedIds.length > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          ↔ {node.relatedIds.length} connection{node.relatedIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
