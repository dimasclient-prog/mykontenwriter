import { useState } from 'react';
import { X, Eye, Code, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Article } from '@/types/project';

interface ArticleEditorProps {
  article: Article;
  open: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
}

export function ArticleEditor({ article, open, onClose, onSave }: ArticleEditorProps) {
  const [content, setContent] = useState(article.content || '');
  const [isDirty, setIsDirty] = useState(false);

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsDirty(value !== article.content);
  };

  const handleSave = () => {
    onSave(content);
    setIsDirty(false);
  };

  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl">{article.title}</DialogTitle>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{wordCount} words</Badge>
              {isDirty && (
                <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                  Unsaved
                </Badge>
              )}
              <Button onClick={handleSave} disabled={!isDirty} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2">
              <Code className="w-4 h-4" />
              Edit HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            <div className="border rounded-lg bg-background min-h-full overflow-hidden">
              <iframe
                srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.7;
      padding: 24px;
      margin: 0;
      color: #1a1a1a;
      background: #fff;
    }
    h1 { font-size: 2em; font-weight: 700; margin: 0 0 1em; line-height: 1.2; }
    h2 { font-size: 1.5em; font-weight: 600; margin: 1.5em 0 0.75em; line-height: 1.3; }
    h3 { font-size: 1.25em; font-weight: 600; margin: 1.25em 0 0.5em; line-height: 1.4; }
    p { margin: 0 0 1em; }
    ul, ol { margin: 0 0 1em; padding-left: 1.5em; }
    li { margin: 0.25em 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
  </style>
</head>
<body>${content}</body>
</html>`}
                className="w-full h-full min-h-[500px] border-0"
                title="Article Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </TabsContent>

          <TabsContent value="edit" className="flex-1 min-h-0 mt-4">
            <Textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="h-full font-mono text-sm resize-none"
              placeholder="Enter HTML content..."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
