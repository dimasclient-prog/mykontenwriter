import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, AlertCircle, 
  BookOpen, Shield, Flag, Star, ThumbsUp, ThumbsDown,
  FileCheck
} from 'lucide-react';
import { HCUAuditResult, AuditStatus, BreakdownDetail } from '@/types/hcu-audit';

interface HCUAuditResultProps {
  result: HCUAuditResult;
}

export function HCUAuditResultDisplay({ result }: HCUAuditResultProps) {
  const getStatusConfig = (status: AuditStatus) => {
    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle2,
          label: 'Aman',
          color: 'text-success',
          bgColor: 'bg-success/20',
          borderColor: 'border-success/30',
          description: 'Konten Anda memenuhi standar HCU dengan baik.',
        };
      case 'needs-improvement':
        return {
          icon: AlertTriangle,
          label: 'Perlu Perbaikan',
          color: 'text-warning',
          bgColor: 'bg-warning/20',
          borderColor: 'border-warning/30',
          description: 'Konten memenuhi standar dasar tapi ada ruang perbaikan.',
        };
      case 'at-risk':
        return {
          icon: XCircle,
          label: 'Risiko Tinggi',
          color: 'text-destructive',
          bgColor: 'bg-destructive/20',
          borderColor: 'border-destructive/30',
          description: 'Konten berisiko terkena penalti HCU. Perlu perbaikan segera.',
        };
    }
  };

  const statusConfig = getStatusConfig(result.status);
  const StatusIcon = statusConfig.icon;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'text-success';
    if (score >= 3) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 4) return 'bg-success/10';
    if (score >= 3) return 'bg-warning/10';
    return 'bg-destructive/10';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4) return 'Good';
    if (score >= 3) return 'Average';
    if (score >= 2) return 'Below Average';
    return 'Poor';
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const variants = {
      high: 'bg-destructive/20 text-destructive border-destructive/30',
      medium: 'bg-warning/20 text-warning border-warning/30',
      low: 'bg-muted text-muted-foreground border-border',
    };
    return (
      <Badge variant="outline" className={variants[priority]}>
        {priority === 'high' ? 'Prioritas Tinggi' : priority === 'medium' ? 'Prioritas Sedang' : 'Prioritas Rendah'}
      </Badge>
    );
  };

  const renderScoreBar = (detail: BreakdownDetail) => (
    <div key={detail.name} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{detail.name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${getScoreColor(detail.score)}`}>
            {detail.score}/5
          </span>
          <span className={`text-xs px-1.5 py-0.5 rounded ${getScoreBg(detail.score)} ${getScoreColor(detail.score)}`}>
            {getScoreLabel(detail.score)}
          </span>
        </div>
      </div>
      <Progress value={(detail.score / 5) * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{detail.notes}</p>
    </div>
  );

  const redFlagItems = [
    { key: 'isTooPromotional', label: 'Terlalu Promosi', desc: 'Konten terlalu banyak mendorong produk/jasa', value: result.input.isTooPromotional },
    { key: 'noAuthor', label: 'Tidak Ada Penulis', desc: 'Tidak ada identitas penulis yang jelas', value: result.input.noAuthor },
    { key: 'claimsWithoutProof', label: 'Klaim Tanpa Bukti', desc: 'Ada klaim yang tidak didukung data/fakta', value: result.input.claimsWithoutProof },
    { key: 'massProduced', label: 'Mass-Produced', desc: 'Konten terlihat generik/template', value: result.input.massProduced },
    { key: 'thinContent', label: 'Thin Content', desc: 'Konten dangkal tanpa substansi', value: result.input.thinContent },
    { key: 'aiGeneratedNoEdit', label: 'AI Tanpa Editing', desc: 'Jelas ditulis AI tanpa sentuhan manusia', value: result.input.aiGeneratedNoEdit },
  ];

  const activeRedFlags = redFlagItems.filter(f => f.value);

  return (
    <div className="space-y-6">
      {/* Header dengan Skor Final */}
      <Card className={`border-2 ${statusConfig.borderColor}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1 min-w-0">
              <CardTitle className="text-2xl">Hasil Audit HCU</CardTitle>
              <CardDescription className="truncate">{result.input.contentTitle}</CardDescription>
              <a 
                href={result.input.contentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block truncate"
              >
                {result.input.contentUrl}
              </a>
            </div>
            <div className="text-right ml-4 shrink-0">
              <div className={`text-5xl font-bold ${getScoreColor(result.finalScore)}`}>
                {result.finalScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">dari 5.0</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 shrink-0 ${statusConfig.color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Status: {statusConfig.label}</span>
                <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <Progress value={(result.finalScore / 5) * 100} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">{statusConfig.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skor Ringkasan 3 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className={`text-3xl font-bold ${getScoreColor(result.contentQualityScore)}`}>
              {result.contentQualityScore.toFixed(1)}
            </div>
            <p className="text-sm font-medium mt-1">Kualitas Konten</p>
            <p className="text-xs text-muted-foreground">Bobot 40%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className={`text-3xl font-bold ${getScoreColor(result.eeatScore)}`}>
              {result.eeatScore.toFixed(1)}
            </div>
            <p className="text-sm font-medium mt-1">E-E-A-T</p>
            <p className="text-xs text-muted-foreground">Bobot 40%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Flag className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className={`text-3xl font-bold ${getScoreColor(result.penaltyScore)}`}>
              {result.penaltyScore.toFixed(1)}
            </div>
            <p className="text-sm font-medium mt-1">Penalti & Red Flags</p>
            <p className="text-xs text-muted-foreground">Bobot 20%</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Breakdown per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Detail Penilaian per Kriteria
          </CardTitle>
          <CardDescription>Klik kategori untuk melihat detail penilaian setiap aspek</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['content-quality', 'eeat']}>
            {result.breakdown.map((item, index) => {
              const accordionKey = index === 0 ? 'content-quality' : index === 1 ? 'eeat' : 'penalties';
              const CategoryIcon = index === 0 ? BookOpen : index === 1 ? Shield : Flag;
              
              return (
                <AccordionItem key={index} value={accordionKey}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-primary" />
                        <span className="font-medium">{item.category}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Bobot: {(item.weight * 100).toFixed(0)}%</span>
                        <Badge variant="outline" className={getScoreColor(item.score)}>
                          {item.score.toFixed(1)}/5
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {item.details && item.details.length > 0 ? (
                      <div className="space-y-4 pt-2">
                        {item.details.map(renderScoreBar)}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{item.notes}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Red Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Red Flags
          </CardTitle>
          <CardDescription>
            {activeRedFlags.length === 0 
              ? 'Tidak ada red flag yang terdeteksi' 
              : `${activeRedFlags.length} red flag terdeteksi`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {redFlagItems.map((flag) => (
              <div
                key={flag.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  flag.value 
                    ? 'border-destructive/30 bg-destructive/5' 
                    : 'border-border bg-muted/30'
                }`}
              >
                {flag.value ? (
                  <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm font-medium ${flag.value ? 'text-destructive' : 'text-foreground'}`}>
                    {flag.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{flag.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Penilaian Akhir HCU */}
      {result.finalAssessment && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Penilaian Akhir HCU
            </CardTitle>
            <CardDescription>Kesimpulan apakah konten layak menurut standar Google HCU</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <AssessmentCard
                label="Lebih Baik dari SERP?"
                description="Apakah konten ini lebih baik dari rata-rata hasil pencarian?"
                value={result.finalAssessment.betterThanSERP}
              />
              <AssessmentCard
                label="Layak di-Bookmark?"
                description="Apakah pantas dijadikan referensi jangka panjang?"
                value={result.finalAssessment.worthBookmarking}
              />
              <AssessmentCard
                label="Menunjukkan Kepedulian?"
                description="Apakah terlihat dibuat oleh orang yang peduli topiknya?"
                value={result.finalAssessment.showsGenuineCare}
              />
            </div>
            {result.finalAssessment.summary && (
              <div className="bg-muted/50 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-primary mb-1">📋 Ringkasan:</p>
                <p className="text-sm text-foreground leading-relaxed">{result.finalAssessment.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rekomendasi Perbaikan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Rekomendasi Perbaikan
          </CardTitle>
          <CardDescription>
            {result.recommendations.length} rekomendasi untuk meningkatkan skor HCU
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.recommendations.length === 0 ? (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Belum ada rekomendasi spesifik. Lihat detail penilaian di atas untuk area perbaikan.
              </AlertDescription>
            </Alert>
          ) : (
            result.recommendations.map((rec, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{rec.category}</span>
                      {getPriorityBadge(rec.priority)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rec.issue}</p>
                    <div className="bg-muted/50 rounded p-3">
                      <p className="text-sm font-medium text-primary">💡 Saran:</p>
                      <p className="text-sm mt-1">{rec.suggestion}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Informasi Audit */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Audit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Topik Utama:</span>
            <span className="font-medium">{result.input.mainTopic}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Konten:</span>
            <span className="font-medium capitalize">{result.input.contentType.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Search Intent:</span>
            <span className="font-medium capitalize">{result.input.searchIntent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Target Audiens:</span>
            <span className="font-medium">{result.input.targetAudience}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jenis Penulis:</span>
            <span className="font-medium capitalize">{result.input.authorType.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tanggal Audit:</span>
            <span className="font-medium">{new Date(result.createdAt).toLocaleDateString('id-ID')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentCard({ label, description, value }: { label: string; description: string; value: boolean }) {
  return (
    <div className={`p-4 rounded-lg border text-center ${
      value 
        ? 'border-success/30 bg-success/5' 
        : 'border-destructive/30 bg-destructive/5'
    }`}>
      {value ? (
        <ThumbsUp className="w-8 h-8 mx-auto mb-2 text-success" />
      ) : (
        <ThumbsDown className="w-8 h-8 mx-auto mb-2 text-destructive" />
      )}
      <p className={`text-sm font-semibold ${value ? 'text-success' : 'text-destructive'}`}>
        {value ? 'Ya' : 'Tidak'}
      </p>
      <p className="text-xs font-medium mt-1">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}
