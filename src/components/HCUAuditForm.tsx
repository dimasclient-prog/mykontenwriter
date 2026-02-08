import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { HCUAuditInput, ContentType, SearchIntent, AuthorType, SourceType } from '@/types/hcu-audit';

interface HCUAuditFormProps {
  onSubmit: (input: HCUAuditInput) => Promise<void>;
  isSubmitting: boolean;
  initialData?: Partial<HCUAuditInput>;
}

export function HCUAuditForm({ onSubmit, isSubmitting, initialData }: HCUAuditFormProps) {
  const [formData, setFormData] = useState<HCUAuditInput>({
    // A. Informasi Dasar
    contentTitle: initialData?.contentTitle || '',
    contentUrl: initialData?.contentUrl || '',
    contentType: initialData?.contentType || 'article',
    mainTopic: initialData?.mainTopic || '',
    targetAudience: initialData?.targetAudience || '',
    searchIntent: initialData?.searchIntent || 'informational',
    contentLanguage: initialData?.contentLanguage || 'Indonesian',

    // B. Sumber & Kredibilitas
    hasAuthorName: initialData?.hasAuthorName ?? false,
    hasAuthorProfile: initialData?.hasAuthorProfile ?? false,
    hasAboutPage: initialData?.hasAboutPage ?? false,
    authorType: initialData?.authorType || 'anonymous',
    hasReferences: initialData?.hasReferences ?? false,
    sourceType: initialData?.sourceType || 'external-source',

    // C. Content Quality
    originalityScore: initialData?.originalityScore || 3,
    originalityNotes: initialData?.originalityNotes || '',
    completenessScore: initialData?.completenessScore || 3,
    completenessNotes: initialData?.completenessNotes || '',
    relevanceScore: initialData?.relevanceScore || 3,
    relevanceNotes: initialData?.relevanceNotes || '',
    structureScore: initialData?.structureScore || 3,
    structureNotes: initialData?.structureNotes || '',
    writingQualityScore: initialData?.writingQualityScore || 3,
    writingQualityNotes: initialData?.writingQualityNotes || '',

    // D. E-E-A-T
    experienceScore: initialData?.experienceScore || 3,
    experienceNotes: initialData?.experienceNotes || '',
    expertiseScore: initialData?.expertiseScore || 3,
    expertiseNotes: initialData?.expertiseNotes || '',
    authoritativenessScore: initialData?.authoritativenessScore || 3,
    authoritativenessNotes: initialData?.authoritativenessNotes || '',
    trustworthinessScore: initialData?.trustworthinessScore || 3,
    trustworthinessNotes: initialData?.trustworthinessNotes || '',

    // E. Penalti
    isTooPromotional: initialData?.isTooPromotional ?? false,
    noAuthor: initialData?.noAuthor ?? false,
    claimsWithoutProof: initialData?.claimsWithoutProof ?? false,
    massProduced: initialData?.massProduced ?? false,
    thinContent: initialData?.thinContent ?? false,
    aiGeneratedNoEdit: initialData?.aiGeneratedNoEdit ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const ScoreSlider = ({ 
    label, 
    value, 
    onChange, 
    notes, 
    onNotesChange 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void;
    notes: string;
    onNotesChange: (value: string) => void;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Badge variant={value >= 4 ? 'default' : value >= 3 ? 'secondary' : 'destructive'}>
          {value}/5
        </Badge>
      </div>
      <Slider
        value={[value]}
        onValueChange={(vals) => onChange(vals[0])}
        min={1}
        max={5}
        step={1}
        className="w-full"
      />
      <Textarea
        placeholder="Catatan penilaian..."
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={2}
        className="text-sm"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* A. Informasi Dasar Konten */}
      <Card>
        <CardHeader>
          <CardTitle>A. Informasi Dasar Konten</CardTitle>
          <CardDescription>Informasi umum tentang konten yang akan diaudit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contentTitle">Judul Konten *</Label>
            <Input
              id="contentTitle"
              value={formData.contentTitle}
              onChange={(e) => setFormData({ ...formData, contentTitle: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentUrl">URL Konten *</Label>
            <Input
              id="contentUrl"
              type="url"
              value={formData.contentUrl}
              onChange={(e) => setFormData({ ...formData, contentUrl: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Jenis Konten</Label>
              <Select
                value={formData.contentType}
                onValueChange={(value: ContentType) => setFormData({ ...formData, contentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Artikel</SelectItem>
                  <SelectItem value="landing-page">Landing Page</SelectItem>
                  <SelectItem value="case-study">Studi Kasus</SelectItem>
                  <SelectItem value="product-page">Product Page</SelectItem>
                  <SelectItem value="blog-post">Blog Post</SelectItem>
                  <SelectItem value="other">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="searchIntent">Search Intent</Label>
              <Select
                value={formData.searchIntent}
                onValueChange={(value: SearchIntent) => setFormData({ ...formData, searchIntent: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informational">Informational</SelectItem>
                  <SelectItem value="navigational">Navigational</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mainTopic">Topik Utama</Label>
            <Input
              id="mainTopic"
              value={formData.mainTopic}
              onChange={(e) => setFormData({ ...formData, mainTopic: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audiens</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentLanguage">Bahasa Konten</Label>
            <Input
              id="contentLanguage"
              value={formData.contentLanguage}
              onChange={(e) => setFormData({ ...formData, contentLanguage: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* B. Sumber & Kredibilitas */}
      <Card>
        <CardHeader>
          <CardTitle>B. Sumber & Kredibilitas Konten (E-E-A-T)</CardTitle>
          <CardDescription>Informasi tentang penulis dan sumber konten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAuthorName"
                checked={formData.hasAuthorName}
                onCheckedChange={(checked) => setFormData({ ...formData, hasAuthorName: checked as boolean })}
              />
              <Label htmlFor="hasAuthorName" className="font-normal cursor-pointer">
                Nama penulis tersedia
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAuthorProfile"
                checked={formData.hasAuthorProfile}
                onCheckedChange={(checked) => setFormData({ ...formData, hasAuthorProfile: checked as boolean })}
              />
              <Label htmlFor="hasAuthorProfile" className="font-normal cursor-pointer">
                Profil penulis tersedia
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasAboutPage"
                checked={formData.hasAboutPage}
                onCheckedChange={(checked) => setFormData({ ...formData, hasAboutPage: checked as boolean })}
              />
              <Label htmlFor="hasAboutPage" className="font-normal cursor-pointer">
                Halaman About Us tersedia
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasReferences"
                checked={formData.hasReferences}
                onCheckedChange={(checked) => setFormData({ ...formData, hasReferences: checked as boolean })}
              />
              <Label htmlFor="hasReferences" className="font-normal cursor-pointer">
                Referensi atau sumber data tersedia
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorType">Jenis Penulis</Label>
              <Select
                value={formData.authorType}
                onValueChange={(value: AuthorType) => setFormData({ ...formData, authorType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practitioner">Praktisi</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="anonymous">Anonim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceType">Jenis Sumber</Label>
              <Select
                value={formData.sourceType}
                onValueChange={(value: SourceType) => setFormData({ ...formData, sourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct-experience">Pengalaman Langsung</SelectItem>
                  <SelectItem value="internal-data">Data Internal</SelectItem>
                  <SelectItem value="external-source">Sumber Eksternal</SelectItem>
                  <SelectItem value="mixed">Campuran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* C. Content Quality */}
      <Card>
        <CardHeader>
          <CardTitle>C. Penilaian Content & Quality</CardTitle>
          <CardDescription>Berikan skor 1-5 untuk setiap aspek kualitas konten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreSlider
            label="Originalitas & Nilai Tambah"
            value={formData.originalityScore}
            onChange={(val) => setFormData({ ...formData, originalityScore: val })}
            notes={formData.originalityNotes}
            onNotesChange={(val) => setFormData({ ...formData, originalityNotes: val })}
          />

          <ScoreSlider
            label="Kelengkapan & Kedalaman Topik"
            value={formData.completenessScore}
            onChange={(val) => setFormData({ ...formData, completenessScore: val })}
            notes={formData.completenessNotes}
            onNotesChange={(val) => setFormData({ ...formData, completenessNotes: val })}
          />

          <ScoreSlider
            label="Relevansi & Manfaat bagi Pembaca"
            value={formData.relevanceScore}
            onChange={(val) => setFormData({ ...formData, relevanceScore: val })}
            notes={formData.relevanceNotes}
            onNotesChange={(val) => setFormData({ ...formData, relevanceNotes: val })}
          />

          <ScoreSlider
            label="Judul & Struktur Konten"
            value={formData.structureScore}
            onChange={(val) => setFormData({ ...formData, structureScore: val })}
            notes={formData.structureNotes}
            onNotesChange={(val) => setFormData({ ...formData, structureNotes: val })}
          />

          <ScoreSlider
            label="Kualitas Penulisan & Produksi"
            value={formData.writingQualityScore}
            onChange={(val) => setFormData({ ...formData, writingQualityScore: val })}
            notes={formData.writingQualityNotes}
            onNotesChange={(val) => setFormData({ ...formData, writingQualityNotes: val })}
          />
        </CardContent>
      </Card>

      {/* D. E-E-A-T */}
      <Card>
        <CardHeader>
          <CardTitle>D. Penilaian E-E-A-T</CardTitle>
          <CardDescription>Experience, Expertise, Authoritativeness, Trustworthiness</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ScoreSlider
            label="Experience (Pengalaman Langsung)"
            value={formData.experienceScore}
            onChange={(val) => setFormData({ ...formData, experienceScore: val })}
            notes={formData.experienceNotes}
            onNotesChange={(val) => setFormData({ ...formData, experienceNotes: val })}
          />

          <ScoreSlider
            label="Expertise (Keahlian Topik)"
            value={formData.expertiseScore}
            onChange={(val) => setFormData({ ...formData, expertiseScore: val })}
            notes={formData.expertiseNotes}
            onNotesChange={(val) => setFormData({ ...formData, expertiseNotes: val })}
          />

          <ScoreSlider
            label="Authoritativeness (Otoritas Brand/Penulis)"
            value={formData.authoritativenessScore}
            onChange={(val) => setFormData({ ...formData, authoritativenessScore: val })}
            notes={formData.authoritativenessNotes}
            onNotesChange={(val) => setFormData({ ...formData, authoritativenessNotes: val })}
          />

          <ScoreSlider
            label="Trustworthiness (Kepercayaan & Transparansi)"
            value={formData.trustworthinessScore}
            onChange={(val) => setFormData({ ...formData, trustworthinessScore: val })}
            notes={formData.trustworthinessNotes}
            onNotesChange={(val) => setFormData({ ...formData, trustworthinessNotes: val })}
          />
        </CardContent>
      </Card>

      {/* E. Penalti & Red Flags */}
      <Card>
        <CardHeader>
          <CardTitle>E. Penalti & Red Flags</CardTitle>
          <CardDescription>Centang jika konten memiliki masalah berikut</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isTooPromotional"
              checked={formData.isTooPromotional}
              onCheckedChange={(checked) => setFormData({ ...formData, isTooPromotional: checked as boolean })}
            />
            <Label htmlFor="isTooPromotional" className="font-normal cursor-pointer">
              Konten terlalu promosi
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="noAuthor"
              checked={formData.noAuthor}
              onCheckedChange={(checked) => setFormData({ ...formData, noAuthor: checked as boolean })}
            />
            <Label htmlFor="noAuthor" className="font-normal cursor-pointer">
              Tidak ada penulis
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="claimsWithoutProof"
              checked={formData.claimsWithoutProof}
              onCheckedChange={(checked) => setFormData({ ...formData, claimsWithoutProof: checked as boolean })}
            />
            <Label htmlFor="claimsWithoutProof" className="font-normal cursor-pointer">
              Klaim tanpa bukti
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="massProduced"
              checked={formData.massProduced}
              onCheckedChange={(checked) => setFormData({ ...formData, massProduced: checked as boolean })}
            />
            <Label htmlFor="massProduced" className="font-normal cursor-pointer">
              Konten mass-produced
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="thinContent"
              checked={formData.thinContent}
              onCheckedChange={(checked) => setFormData({ ...formData, thinContent: checked as boolean })}
            />
            <Label htmlFor="thinContent" className="font-normal cursor-pointer">
              Thin content
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="aiGeneratedNoEdit"
              checked={formData.aiGeneratedNoEdit}
              onCheckedChange={(checked) => setFormData({ ...formData, aiGeneratedNoEdit: checked as boolean })}
            />
            <Label htmlFor="aiGeneratedNoEdit" className="font-normal cursor-pointer">
              AI-generated tanpa editing manusia
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Mengaudit...' : 'Audit Konten'}
        </Button>
      </div>
    </form>
  );
}
