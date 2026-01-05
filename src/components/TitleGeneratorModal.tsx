import { useState } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
  }) => void;
  isGenerating: boolean;
}

export function TitleGeneratorModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: TitleGeneratorModalProps) {
  const [selectedTypes, setSelectedTypes] = useState<ArticleType[]>([]);
  const [articleCount, setArticleCount] = useState(5);
  const [funnelType, setFunnelType] = useState<FunnelType>('tofu');

  const toggleArticleType = (type: ArticleType) => {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleGenerate = () => {
    if (selectedTypes.length === 0) {
      return;
    }
    onGenerate({
      articleTypes: selectedTypes,
      articleCount,
      funnelType,
    });
  };

  const resetForm = () => {
    setSelectedTypes([]);
    setArticleCount(5);
    setFunnelType('tofu');
  };

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
            Pilih tipe artikel, jumlah, dan funnel type untuk generate judul
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Article Types */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Step 1: Pilih Tipe Artikel <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Pilih satu atau lebih tipe artikel yang ingin di-generate
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
              <p className="text-sm text-destructive">Pilih minimal satu tipe artikel</p>
            )}
          </div>

          {/* Step 2: Article Count */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Step 2: Jumlah Artikel
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
              <span className="text-sm text-muted-foreground">judul artikel (1-50)</span>
            </div>
          </div>

          {/* Step 3: Funnel Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Step 3: Pilih Funnel Type
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
            Batal
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedTypes.length === 0 || isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lightbulb className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating...' : `Generate ${articleCount} Judul`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
