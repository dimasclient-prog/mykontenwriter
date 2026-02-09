import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Download, Network, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Project } from '@/types/project';
import {
  TopicalCoverageAnalysis,
  CoreTopic,
  TopicalExpansionGroup,
  SemanticNode,
  URLStructureItem,
  CoverageGap,
} from '@/types/topical-coverage';
import { CoreTopicSection } from './CoreTopicSection';
import { TopicalExpansionSection } from './TopicalExpansionSection';
import { SemanticNetworkView } from './SemanticNetworkView';
import { URLStructureSection } from './URLStructureSection';
import { CoverageGapsSection } from './CoverageGapsSection';
import { formatDistanceToNow } from 'date-fns';

interface TopicalCoverageTabProps {
  project: Project;
}

export function TopicalCoverageTab({ project }: TopicalCoverageTabProps) {
  const [analyses, setAnalyses] = useState<TopicalCoverageAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<TopicalCoverageAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalyses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('topical_coverage')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching analyses:', error);
        return;
      }

      if (data) {
        const mapped: TopicalCoverageAnalysis[] = data.map((row: any) => ({
          id: row.id,
          projectId: row.project_id,
          coreTopic: row.core_topic as CoreTopic,
          topicalExpansion: row.topical_expansion as TopicalExpansionGroup[],
          semanticNetwork: row.semantic_network as SemanticNode[],
          urlStructure: row.url_structure as URLStructureItem[],
          coverageGaps: row.coverage_gaps as CoverageGap[],
          websiteUrl: row.website_url || '',
          createdAt: new Date(row.created_at),
        }));

        setAnalyses(mapped);
        if (mapped.length > 0 && !selectedAnalysis) {
          setSelectedAnalysis(mapped[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching analyses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [project.id, selectedAnalysis]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleAnalyze = async () => {
    const websiteUrl = project.websiteUrl;
    if (!websiteUrl) {
      toast.error('Website URL belum diset. Silakan set di tab Settings terlebih dahulu.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const language = project.language === 'other' && project.customLanguage
        ? project.customLanguage
        : project.language === 'indonesian' ? 'Indonesian' : 'English';

      const { data, error } = await supabase.functions.invoke('analyze-topical-coverage', {
        body: {
          projectId: project.id,
          websiteUrl,
          language,
        },
      });

      if (error) {
        console.error('Analysis error:', error);
        toast.error(`Analisis gagal: ${error.message}`);
        return;
      }

      if (data?.success && data.data) {
        const analysis: TopicalCoverageAnalysis = {
          id: data.data.id,
          projectId: project.id,
          coreTopic: data.data.coreTopic,
          topicalExpansion: data.data.topicalExpansion,
          semanticNetwork: data.data.semanticNetwork,
          urlStructure: data.data.urlStructure,
          coverageGaps: data.data.coverageGaps,
          websiteUrl: data.data.websiteUrl,
          createdAt: new Date(data.data.createdAt),
        };

        setAnalyses(prev => [analysis, ...prev]);
        setSelectedAnalysis(analysis);
        toast.success('Topical coverage analysis completed!');
      } else {
        toast.error(data?.error || 'Analysis failed');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error('Failed to analyze topical coverage');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExportSheets = () => {
    if (!selectedAnalysis) return;

    try {
      // Dynamically import xlsx
      import('xlsx').then(XLSX => {
        const wb = XLSX.utils.book_new();

        // Sheet 1: Topical Overview
        const overviewData = selectedAnalysis.topicalExpansion.flatMap(group =>
          group.topics.map(t => ({
            'Core Topic': selectedAnalysis.coreTopic.topic,
            'Sub Topic': t.topic,
            'Category': group.label,
            'Semantic Role': t.semanticRole,
            'Intent': t.intentType,
            'Priority': t.priority,
          }))
        );
        const ws1 = XLSX.utils.json_to_sheet(overviewData);
        XLSX.utils.book_append_sheet(wb, ws1, 'Topical Overview');

        // Sheet 2: Semantic Network
        const networkData = selectedAnalysis.semanticNetwork.map(n => ({
          'Topic': n.topic,
          'Parent Topic': selectedAnalysis.semanticNetwork.find(p => p.id === n.parentId)?.topic || '',
          'Related Topics': n.relatedIds
            .map(id => selectedAnalysis.semanticNetwork.find(nn => nn.id === id)?.topic || '')
            .filter(Boolean)
            .join(', '),
          'Relationship Type': n.relationshipType,
          'Layer': n.layer,
        }));
        const ws2 = XLSX.utils.json_to_sheet(networkData);
        XLSX.utils.book_append_sheet(wb, ws2, 'Semantic Network');

        // Sheet 3: URL Structure
        const urlData = selectedAnalysis.urlStructure.map(u => ({
          'Suggested URL': u.suggestedUrl,
          'Topic': u.topic,
          'Intent Stage': u.intentStage,
          'Notes': u.notes,
        }));
        const ws3 = XLSX.utils.json_to_sheet(urlData);
        XLSX.utils.book_append_sheet(wb, ws3, 'URL Structure');

        // Sheet 4: Coverage Gaps
        const gapData = selectedAnalysis.coverageGaps.map(g => ({
          'Order': g.suggestedOrder,
          'Area': g.area,
          'Type': g.type,
          'Description': g.description,
        }));
        const ws4 = XLSX.utils.json_to_sheet(gapData);
        XLSX.utils.book_append_sheet(wb, ws4, 'Coverage Gaps');

        XLSX.writeFile(wb, `topical-coverage-${project.name.replace(/\s+/g, '-').toLowerCase()}.xlsx`);
        toast.success('Export berhasil!');
      });
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Gagal export data');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Empty state
  if (analyses.length === 0 && !isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Network className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-lg font-serif font-bold text-foreground">
                Topical Coverage Analysis
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Understand what topical authority your website should build — and how it should be structured semantically.
                This analysis is based on your project's website URL.
              </p>
            </div>
            {!project.websiteUrl ? (
              <p className="text-xs text-muted-foreground">
                Set a website URL in the Settings tab to begin analysis.
              </p>
            ) : (
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="gap-2">
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Network className="w-4 h-4" />
                )}
                Analyze Topical Coverage
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {analyses.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Snapshot:</span>
              <select
                className="text-xs border rounded px-2 py-1 bg-background text-foreground"
                value={selectedAnalysis?.id || ''}
                onChange={(e) => {
                  const found = analyses.find(a => a.id === e.target.value);
                  if (found) setSelectedAnalysis(found);
                }}
              >
                {analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    {formatDistanceToNow(a.createdAt, { addSuffix: true })} — {a.websiteUrl}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedAnalysis && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(selectedAnalysis.createdAt, { addSuffix: true })}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSheets}
            disabled={!selectedAnalysis}
            className="gap-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !project.websiteUrl}
            className="gap-1.5 text-xs"
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isAnalyzing ? 'Analyzing...' : 'Re-analyze'}
          </Button>
        </div>
      </div>

      {/* Analyzing state */}
      {isAnalyzing && (
        <Card className="border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-foreground">Analyzing topical coverage…</p>
              <p className="text-xs text-muted-foreground">
                Scraping website content and building semantic analysis. This may take a moment.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {selectedAnalysis && !isAnalyzing && (
        <div className="space-y-6">
          <p className="text-xs text-muted-foreground italic">
            This snapshot is saved for future reference. Re-analysis will not overwrite previous insights.
          </p>

          <CoreTopicSection coreTopic={selectedAnalysis.coreTopic} />
          <TopicalExpansionSection groups={selectedAnalysis.topicalExpansion} />
          <SemanticNetworkView nodes={selectedAnalysis.semanticNetwork} />
          <URLStructureSection items={selectedAnalysis.urlStructure} />
          <CoverageGapsSection gaps={selectedAnalysis.coverageGaps} />
        </div>
      )}
    </div>
  );
}
