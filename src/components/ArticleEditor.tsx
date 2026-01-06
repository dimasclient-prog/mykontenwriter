import { useState, useEffect, useCallback } from 'react';
import { Eye, Code, Save, Send, Loader2, ExternalLink, AlertCircle, CheckCircle2, Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Heading3, Link as LinkIcon, Undo, Redo, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Article } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExtension from '@tiptap/extension-underline';
import LinkExtension from '@tiptap/extension-link';

interface ArticleEditorProps {
  article: Article;
  open: boolean;
  onClose: () => void;
  onSave: (content: string) => void;
  onTitleChange?: (title: string) => void;
  wordpressConfig?: {
    url: string;
    username: string;
    password: string;
  } | null;
}

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';

export function ArticleEditor({ article, open, onClose, onSave, onTitleChange, wordpressConfig }: ArticleEditorProps) {
  const [content, setContent] = useState(article.content || '');
  const [isDirty, setIsDirty] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(article.title);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('visual');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      setIsDirty(html !== article.content);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  // Sync content when switching tabs
  useEffect(() => {
    if (editor && activeTab === 'visual') {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content, { emitUpdate: false });
      }
    }
  }, [activeTab, content, editor]);

  // Reset state when article changes
  useEffect(() => {
    setContent(article.content || '');
    setEditedTitle(article.title);
    setIsEditingTitle(false);
    setIsDirty(false);
    setPublishStatus('idle');
    setPublishError(null);
    setPublishedUrl(null);
    if (editor) {
      editor.commands.setContent(article.content || '', { emitUpdate: false });
    }
  }, [article.id, article.content, article.title, editor]);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== article.title && onTitleChange) {
      onTitleChange(editedTitle.trim());
      toast.success('Title updated');
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitleEdit = () => {
    setEditedTitle(article.title);
    setIsEditingTitle(false);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsDirty(value !== article.content);
  };

  const handleSave = () => {
    // Sync from editor if in visual mode
    if (editor && activeTab === 'visual') {
      const html = editor.getHTML();
      onSave(html);
    } else {
      onSave(content);
    }
    setIsDirty(false);
  };

  const handlePublishToWordPress = async () => {
    if (!wordpressConfig) {
      setPublishStatus('error');
      setPublishError('WordPress belum dikonfigurasi. Silakan atur WordPress di Project Settings.');
      return;
    }

    if (!content) {
      setPublishStatus('error');
      setPublishError('Tidak ada konten untuk dipublish');
      return;
    }

    setPublishStatus('publishing');
    setPublishError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
        body: {
          wordpressUrl: wordpressConfig.url,
          username: wordpressConfig.username,
          password: wordpressConfig.password,
          title: article.title,
          content: activeTab === 'visual' && editor ? editor.getHTML() : content,
          status: 'draft',
        },
      });

      if (error) {
        console.error('WordPress publish error:', error);
        setPublishStatus('error');
        setPublishError(`Gagal mengirim: ${error.message}. Cek kembali pengaturan WordPress di Settings.`);
        return;
      }

      if (data?.success) {
        setPublishedUrl(data.postUrl);
        setPublishStatus('success');
        toast.success('Artikel berhasil dikirim sebagai draft ke WordPress!');
      } else if (data?.error) {
        setPublishStatus('error');
        setPublishError(`WordPress error: ${data.error}. Pastikan URL, Username, dan Application Password sudah benar di Settings.`);
      }
    } catch (err: any) {
      console.error('WordPress publish error:', err);
      setPublishStatus('error');
      setPublishError('Gagal mengirim ke WordPress. Cek koneksi internet dan pengaturan WordPress di Settings.');
    }
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            {/* Editable Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelTitleEdit();
                  }}
                  className="text-lg font-semibold flex-1"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="w-4 h-4 text-success" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelTitleEdit}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 min-w-0">
                <DialogTitle className="text-xl truncate">{article.title}</DialogTitle>
                {onTitleChange && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingTitle(true)}
                    className="shrink-0"
                    title="Edit title"
                  >
                    <Pencil className="w-3 h-3 text-muted-foreground hover:text-primary" />
                  </Button>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{wordCount} words</Badge>
              {isDirty && (
                <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                  Unsaved
                </Badge>
              )}
              {publishStatus === 'success' && publishedUrl && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  <Badge className="bg-success/20 text-success border-success/30 gap-1 cursor-pointer hover:bg-success/30">
                    <ExternalLink className="w-3 h-3" />
                    View on WordPress
                  </Badge>
                </a>
              )}
              <Button onClick={handleSave} disabled={!isDirty} size="sm" className="gap-2">
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button 
                onClick={handlePublishToWordPress} 
                disabled={publishStatus === 'publishing' || !content}
                size="sm" 
                variant="outline"
                className="gap-2"
              >
                {publishStatus === 'publishing' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Draft to WP
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Publish Status Feedback */}
        {publishStatus === 'success' && (
          <Alert className="bg-success/10 border-success/30 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Artikel berhasil dikirim sebagai draft ke WordPress!{' '}
              {publishedUrl && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  Lihat artikel →
                </a>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {publishStatus === 'error' && publishError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{publishError}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit">
            <TabsTrigger value="visual" className="gap-2">
              <Eye className="w-4 h-4" />
              Visual Editor
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-2">
              <Code className="w-4 h-4" />
              Edit HTML
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="flex-1 overflow-hidden mt-4 flex flex-col">
            {/* Toolbar */}
            {editor && (
              <div className="flex flex-wrap items-center gap-1 p-2 border rounded-t-lg bg-muted/50">
                <Toggle
                  size="sm"
                  pressed={editor.isActive('bold')}
                  onPressedChange={() => editor.chain().focus().toggleBold().run()}
                  aria-label="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('italic')}
                  onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                  aria-label="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('underline')}
                  onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                  aria-label="Underline"
                >
                  <Underline className="h-4 w-4" />
                </Toggle>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <Toggle
                  size="sm"
                  pressed={editor.isActive('heading', { level: 1 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  aria-label="Heading 1"
                >
                  <Heading1 className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('heading', { level: 2 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  aria-label="Heading 2"
                >
                  <Heading2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('heading', { level: 3 })}
                  onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  aria-label="Heading 3"
                >
                  <Heading3 className="h-4 w-4" />
                </Toggle>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <Toggle
                  size="sm"
                  pressed={editor.isActive('bulletList')}
                  onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                  aria-label="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                  size="sm"
                  pressed={editor.isActive('orderedList')}
                  onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                  aria-label="Ordered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Toggle>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <Toggle
                  size="sm"
                  pressed={editor.isActive('link')}
                  onPressedChange={setLink}
                  aria-label="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </Toggle>
                
                <Separator orientation="vertical" className="mx-1 h-6" />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  className="h-8 w-8 p-0"
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  className="h-8 w-8 p-0"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Editor Content */}
            <div className="flex-1 overflow-auto border border-t-0 rounded-b-lg bg-background">
              <EditorContent editor={editor} className="min-h-[400px]" />
            </div>
          </TabsContent>

          <TabsContent value="html" className="flex-1 min-h-0 mt-4">
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
