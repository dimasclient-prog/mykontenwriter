import { useState } from 'react';
import { Lightbulb, Loader2, User, Tag, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Persona } from '@/types/project';

export type ArticleType = 
  | 'pov'
  | 'review'
  | 'expert-opinion'
  | 'listicle'
  | 'comparison'
  | 'how-to'
  | 'myth-vs-fact'
  | 'case-breakdown'
  | 'trend-analysis'
  | 'problem-solution';

export type FunnelType = 'tofu' | 'mofu' | 'bofu';

const ARTICLE_TYPES: { value: ArticleType; label: string; description: string }[] = [
  { value: 'pov', label: 'POV (Point of View)', description: 'Opini sudut pandang unik' },
  { value: 'review', label: 'Review', description: 'Ulasan produk/layanan' },
  { value: 'expert-opinion', label: 'Expert Opinion', description: 'Pendapat ahli/pakar' },
  { value: 'listicle', label: 'Listicle', description: 'Artikel berbentuk daftar' },
  { value: 'comparison', label: 'Comparison', description: 'Perbandingan produk/layanan' },
  { value: 'how-to', label: 'How-to / Tutorial', description: 'Panduan langkah demi langkah' },
  { value: 'myth-vs-fact', label: 'Myth vs Fact', description: 'Membongkar mitos vs fakta' },
  { value: 'case-breakdown', label: 'Case Breakdown', description: 'Analisis studi kasus' },
  { value: 'trend-analysis', label: 'Trend Analysis', description: 'Analisis tren industri' },
  { value: 'problem-solution', label: 'Problem–Solution Story', description: 'Cerita masalah & solusi' },
];

const FUNNEL_TYPES: { value: FunnelType; label: string; description: string }[] = [
  { value: 'tofu', label: 'Top of Funnel (TOFU)', description: 'Edukasi & awareness' },
  { value: 'mofu', label: 'Middle of Funnel (MOFU)', description: 'Perbandingan & pertimbangan' },
  { value: 'bofu', label: 'Bottom of Funnel (BOFU)', description: 'Solusi (soft, non-salesy)' },
];

interface TitleGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: {
    articleTypes: ArticleType[];
    articleCount: number;
    funnelType: FunnelType;
    personaId: string;
    selectedKeywords: string[];
  }) => void;
  isGenerating: boolean;
  personas: Persona[];
  projectKeywords?: string[];
}

export function TitleGeneratorModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  personas,
  projectKeywords = [],
}: TitleGeneratorModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<ArticleType[]>([]);
  const [articleCount, setArticleCount] = useState(5);
  const [funnelType, setFunnelType] = useState<FunnelType>('tofu');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [keywordSearch, setKeywordSearch] = useState('');

  const toggleArticleType = (type: ArticleType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : [...prev, keyword]
    );
  };

  const removeKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => prev.filter((k) => k !== keyword));
  };

  const selectAllKeywords = () => {
    setSelectedKeywords([...projectKeywords]);
  };

  const clearAllKeywords = () => {
    setSelectedKeywords([]);
  };

  const filteredKeywords = projectKeywords.filter((keyword) =>
    keyword.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  const handleGenerate = () => {
    if (selectedTypes.length === 0 || !selectedPersonaId) {
      return;
    }
    onGenerate({
      articleTypes: selectedTypes,
      articleCount,
      funnelType,
      personaId: selectedPersonaId,
      selectedKeywords,
    });
  };

  const resetForm = () => {
    setSelectedTypes([]);
    setArticleCount(5);
    setFunnelType('tofu');
    setSelectedPersonaId('');
    setSelectedKeywords([]);
    setKeywordSearch('');
  };

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Generate Article Ideas
          </DialogTitle>
          <DialogDescription>
            Select a target persona, article types, keywords, and funnel stage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 0: Persona Selection (MANDATORY) */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Target Persona <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Select which persona this content is for
            </p>
            {personas.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-destructive/50 bg-destructive/5">
                <p className="text-sm text-destructive">
                  No personas available. Please create a persona in the Market Insight tab first.
                </p>
              </div>
            ) : (
              <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId}>
                <SelectTrigger className={!selectedPersonaId ? 'border-destructive/50' : ''}>
                  <SelectValue placeholder="Select a persona..." />
                </SelectTrigger>
                <SelectContent>
                  {personas.map((persona) => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{persona.name}</span>
                        {persona.role && (
                          <span className="text-muted-foreground">({persona.role})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {selectedPersona && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedPersona.name}</span>
                </div>
                {selectedPersona.role && (
                  <p className="text-sm text-muted-foreground">{selectedPersona.role}</p>
                )}
                {selectedPersona.painPoints.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Pain points: {selectedPersona.painPoints.slice(0, 2).join(', ')}
                    {selectedPersona.painPoints.length > 2 && '...'}
                  </p>
                )}
              </div>
            )}
            {!selectedPersonaId && personas.length > 0 && (
              <p className="text-sm text-destructive">Please select a persona</p>
            )}
          </div>

          {/* Step 1: Article Types */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Article Types <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Select one or more article types to generate
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ARTICLE_TYPES.map((type) => (
                <div
                  key={type.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedTypes.includes(type.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleArticleType(type.value)}
                >
                  <Checkbox
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => toggleArticleType(type.value)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedTypes.length === 0 && (
              <p className="text-sm text-destructive">Select at least one article type</p>
            )}
          </div>

          {/* Step 2: Article Count */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Number of Articles
            </Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                max={50}
                value={articleCount}
                onChange={(e) => setArticleCount(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">article titles (1-50)</span>
            </div>
          </div>

          {/* Step 2.5: Keyword Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Target Keywords
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select keywords to be used as title & heading references
                </p>
              </div>
              {projectKeywords.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllKeywords}
                    disabled={selectedKeywords.length === projectKeywords.length}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllKeywords}
                    disabled={selectedKeywords.length === 0}
                  >
                    Clear
                  </Button>
                </div>
              )}
            </div>

            {/* Selected Keywords */}
            {selectedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                {selectedKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {projectKeywords.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  No keywords saved in this project. Add keywords in the Keywords tab first.
                </p>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Search keywords..."
                  value={keywordSearch}
                  onChange={(e) => setKeywordSearch(e.target.value)}
                  className="w-full"
                />
                <ScrollArea className="h-32 rounded-lg border p-2">
                  <div className="flex flex-wrap gap-2">
                    {filteredKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant={selectedKeywords.includes(keyword) ? 'default' : 'outline'}
                        className="cursor-pointer transition-colors hover:bg-primary/20"
                        onClick={() => toggleKeyword(keyword)}
                      >
                        {selectedKeywords.includes(keyword) ? (
                          <span className="mr-1">✓</span>
                        ) : (
                          <Plus className="w-3 h-3 mr-1" />
                        )}
                        {keyword}
                      </Badge>
                    ))}
                    {filteredKeywords.length === 0 && (
                      <p className="text-sm text-muted-foreground w-full text-center py-2">
                        No keywords match your search
                      </p>
                    )}
                  </div>
                </ScrollArea>
                {selectedKeywords.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {selectedKeywords.length} keyword(s) selected - semantic variations will be generated
                  </p>
                )}
              </>
            )}
          </div>

          {/* Step 3: Funnel Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Funnel Stage
            </Label>
            <RadioGroup
              value={funnelType}
              onValueChange={(value) => setFunnelType(value as FunnelType)}
              className="space-y-2"
            >
              {FUNNEL_TYPES.map((funnel) => (
                <div
                  key={funnel.value}
                  className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    funnelType === funnel.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setFunnelType(funnel.value)}
                >
                  <RadioGroupItem value={funnel.value} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{funnel.label}</p>
                    <p className="text-xs text-muted-foreground">{funnel.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedTypes.length === 0 || !selectedPersonaId || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : `Generate ${articleCount} Titles`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
