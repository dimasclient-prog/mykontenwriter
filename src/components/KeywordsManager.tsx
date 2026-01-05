import { useState, useRef } from 'react';
import { Upload, Plus, X, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface KeywordsManagerProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export function KeywordsManager({ keywords, onChange }: KeywordsManagerProps) {
  const [newKeyword, setNewKeyword] = useState('');
  const [bulkKeywords, setBulkKeywords] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    const keyword = newKeyword.trim();
    if (keywords.includes(keyword)) {
      toast.error('Keyword already exists');
      return;
    }
    onChange([...keywords, keyword]);
    setNewKeyword('');
  };

  const handleBulkAdd = () => {
    if (!bulkKeywords.trim()) return;
    const newKeywords = bulkKeywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k && !keywords.includes(k));
    
    if (newKeywords.length === 0) {
      toast.info('No new keywords to add');
      return;
    }
    
    onChange([...keywords, ...newKeywords]);
    setBulkKeywords('');
    toast.success(`Added ${newKeywords.length} keywords`);
  };

  const handleRemoveKeyword = (keyword: string) => {
    onChange(keywords.filter(k => k !== keyword));
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to remove all keywords?')) {
      onChange([]);
      toast.success('All keywords cleared');
    }
  };

  const parseFile = async (file: File): Promise<string[]> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'txt') {
      const text = await file.text();
      return text.split('\n').map(k => k.trim()).filter(Boolean);
    }
    
    if (ext === 'csv') {
      const text = await file.text();
      // Parse CSV - handle both single column and comma-separated
      const lines = text.split('\n');
      const keywords: string[] = [];
      lines.forEach(line => {
        // Try to split by comma first
        const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        keywords.push(...parts.filter(Boolean));
      });
      return keywords;
    }
    
    if (ext === 'xlsx' || ext === 'xls') {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
      
      // Flatten and get all non-empty cells
      const keywords: string[] = [];
      data.forEach(row => {
        row.forEach(cell => {
          if (cell && typeof cell === 'string') {
            keywords.push(cell.trim());
          } else if (cell && typeof cell === 'number') {
            keywords.push(String(cell));
          }
        });
      });
      return keywords;
    }
    
    throw new Error('Unsupported file type');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsedKeywords = await parseFile(file);
      const newKeywords = parsedKeywords.filter(k => !keywords.includes(k));
      
      if (newKeywords.length === 0) {
        toast.info('No new keywords found in file');
      } else {
        onChange([...keywords, ...newKeywords]);
        toast.success(`Imported ${newKeywords.length} keywords from ${file.name}`);
      }
    } catch (error) {
      console.error('File parse error:', error);
      toast.error('Failed to parse file. Please check the format.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Keywords</CardTitle>
          <CardDescription>
            Add keywords that will be used as main topics for article generation.
            Total: {keywords.length} keywords
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single">Add Single</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Enter keyword..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword} className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="bulk" className="space-y-4">
              <div className="space-y-2">
                <Label>Enter keywords (one per line)</Label>
                <Textarea
                  value={bulkKeywords}
                  onChange={(e) => setBulkKeywords(e.target.value)}
                  placeholder="keyword 1&#10;keyword 2&#10;keyword 3"
                  rows={6}
                />
              </div>
              <Button onClick={handleBulkAdd} className="gap-2">
                <Plus className="w-4 h-4" />
                Add All
              </Button>
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="keyword-file-upload"
                />
                <div className="flex flex-col items-center gap-4">
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
                  ) : (
                    <FileText className="w-12 h-12 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium mb-1">Upload keyword file</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Supports TXT, CSV, and Excel files (.xlsx, .xls)
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {keywords.length > 0 && (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Keyword List ({keywords.length})</CardTitle>
              <CardDescription>Click on a keyword to remove it</CardDescription>
            </div>
            <Button variant="destructive" size="sm" onClick={handleClearAll} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto">
              {keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors group py-1.5 px-3"
                  onClick={() => handleRemoveKeyword(keyword)}
                >
                  {keyword}
                  <X className="w-3 h-3 ml-2 opacity-50 group-hover:opacity-100" />
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
