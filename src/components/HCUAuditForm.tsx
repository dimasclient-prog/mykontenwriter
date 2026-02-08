import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Globe, User } from 'lucide-react';
import { Persona } from '@/types/project';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface HCUAuditFormProps {
  onSubmit: (url: string, personaId: string) => Promise<void>;
  isSubmitting: boolean;
  personas: Persona[];
}

export function HCUAuditForm({ onSubmit, isSubmitting, personas }: HCUAuditFormProps) {
  const [url, setUrl] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !selectedPersonaId) return;
    await onSubmit(url.trim(), selectedPersonaId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Audit Konten dengan AI
          </CardTitle>
          <CardDescription>
            Masukkan URL konten dan pilih persona target. AI akan menganalisis konten dan memberikan skor HCU beserta rekomendasi perbaikan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contentUrl">URL Konten *</Label>
            <Input
              id="contentUrl"
              type="url"
              placeholder="https://example.com/artikel-anda"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Masukkan URL lengkap artikel atau halaman yang ingin diaudit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="persona">Target Persona *</Label>
            <Select
              value={selectedPersonaId}
              onValueChange={setSelectedPersonaId}
              disabled={isSubmitting || personas.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih persona target" />
              </SelectTrigger>
              <SelectContent>
                {personas.map((persona) => (
                  <SelectItem key={persona.id} value={persona.id}>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{persona.name}</span>
                      {persona.role && (
                        <span className="text-xs text-muted-foreground">- {persona.role}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pilih persona untuk mengevaluasi relevansi konten dengan target audiens
            </p>
          </div>

          {personas.length === 0 && (
            <Alert>
              <AlertDescription>
                Belum ada persona. Buat persona terlebih dahulu di tab Market Insight untuk menggunakan fitur ini.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button 
          type="submit" 
          disabled={isSubmitting || !url.trim() || !selectedPersonaId || personas.length === 0} 
          className="gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Menganalisis Konten...' : 'Audit dengan AI'}
        </Button>
      </div>

      {isSubmitting && (
        <Alert>
          <Loader2 className="w-4 h-4 animate-spin" />
          <AlertDescription>
            AI sedang membaca dan menganalisis konten dari URL... Proses ini membutuhkan waktu 30-60 detik.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
