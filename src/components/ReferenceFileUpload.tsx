import { useState, useRef } from 'react';
import { Upload, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ReferenceFileUploadProps {
  referenceText: string;
  referenceFileUrl: string | undefined;
  onReferenceTextChange: (text: string) => void;
  onReferenceFileChange: (url: string | undefined) => void;
  projectId: string;
}

export function ReferenceFileUpload({
  referenceText,
  referenceFileUrl,
  onReferenceTextChange,
  onReferenceFileChange,
  projectId,
}: ReferenceFileUploadProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${user.id}/${projectId}/reference-${Date.now()}-${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(filePath);

      onReferenceFileChange(filePath);
      setFileName(file.name);
      toast.success('Reference file uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = async () => {
    if (!referenceFileUrl) return;

    try {
      const { error } = await supabase.storage
        .from('project-files')
        .remove([referenceFileUrl]);

      if (error) throw error;

      onReferenceFileChange(undefined);
      setFileName(null);
      toast.success('Reference file removed');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove file');
    }
  };

  const getFileDownloadUrl = () => {
    if (!referenceFileUrl) return null;
    const { data } = supabase.storage
      .from('project-files')
      .getPublicUrl(referenceFileUrl);
    return data.publicUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reference Context</CardTitle>
        <CardDescription>
          Provide reference material for training context. This will help generate more relevant content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="referenceText">Reference Text</Label>
          <Textarea
            id="referenceText"
            value={referenceText}
            onChange={(e) => onReferenceTextChange(e.target.value)}
            placeholder="Enter reference text, notes, or context information that will help generate better content..."
            rows={8}
          />
          <p className="text-xs text-muted-foreground">
            Add any relevant information about the business, industry terms, style guidelines, etc.
          </p>
        </div>

        <div className="space-y-4">
          <Label>Reference File</Label>
          {referenceFileUrl ? (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <FileText className="w-8 h-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{fileName || 'Reference file'}</p>
                <p className="text-sm text-muted-foreground">File uploaded</p>
              </div>
              <div className="flex items-center gap-2">
                {getFileDownloadUrl() && (
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={getFileDownloadUrl()!} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </a>
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveFile}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.doc,.docx,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="reference-file-upload"
              />
              <div className="flex flex-col items-center gap-4">
                {isUploading ? (
                  <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                ) : (
                  <FileText className="w-12 h-12 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium mb-1">Upload reference file</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports TXT, PDF, DOC, DOCX, MD files (max 10MB)
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? 'Uploading...' : 'Choose File'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
