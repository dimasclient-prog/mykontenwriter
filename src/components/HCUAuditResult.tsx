import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { HCUAuditResult, AuditStatus } from '@/types/hcu-audit';

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
        };
      case 'needs-improvement':
        return {
          icon: AlertTriangle,
          label: 'Perlu Perbaikan',
          color: 'text-warning',
          bgColor: 'bg-warning/20',
          borderColor: 'border-warning/30',
        };
      case 'at-risk':
        return {
          icon: XCircle,
          label: 'Risiko Tinggi',
          color: 'text-destructive',
          bgColor: 'bg-destructive/20',
          borderColor: 'border-destructive/30',
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

  return (
    <div className="space-y-6">
      {/* Header dengan Skor Final */}
      <Card className={`border-2 ${statusConfig.borderColor}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">Hasil Audit HCU</CardTitle>
              <CardDescription>{result.input.contentTitle}</CardDescription>
              <a 
                href={result.input.contentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {result.input.contentUrl}
              </a>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-bold ${getScoreColor(result.finalScore)}`}>
                {result.finalScore.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">dari 5.0</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">Status: {statusConfig.label}</span>
                <Badge variant="outline" className={`${statusConfig.bgColor} ${statusConfig.color} ${statusConfig.borderColor}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <Progress 
                value={(result.finalScore / 5) * 100} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown Skor per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Breakdown Skor per Kategori
          </CardTitle>
          <CardDescription>Detail penilaian untuk setiap aspek konten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.breakdown.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Bobot: {(item.weight * 100).toFixed(0)}%</span>
                  <Badge variant="outline" className={getScoreColor(item.score)}>
                    {item.score.toFixed(1)}/5
                  </Badge>
                </div>
              </div>
              <Progress value={(item.score / 5) * 100} className="h-2" />
              {item.notes && (
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

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
                Konten Anda sudah sangat baik! Tidak ada rekomendasi perbaikan saat ini.
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
            <span className="text-muted-foreground">Jenis Konten:</span>
            <span className="font-medium capitalize">{result.input.contentType.replace('-', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Search Intent:</span>
            <span className="font-medium capitalize">{result.input.searchIntent}</span>
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
