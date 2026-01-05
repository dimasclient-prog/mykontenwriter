import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { 
  ArrowLeft, 
  Pencil, 
  Sparkles, 
  FileText, 
  Check, 
  Clock, 
  AlertCircle,
  Globe,
  Languages,
  Trash2,
  Plus,
  Save,
  Loader2,
  Eye,
  Zap,
  Key,
  Lightbulb,
  RefreshCw,
  Send,
  ExternalLink,
  BarChart3,
  Target,
  Users,
  TrendingUp,
  Layers
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Article, Project, ProjectLanguage, ProjectMode, StrategyPack } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';
import { ArticleEditor } from '@/components/ArticleEditor';
import { KeywordsManager } from '@/components/KeywordsManager';
import { ReferenceFileUpload } from '@/components/ReferenceFileUpload';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    projects, 
    masterSettings,
    setActiveProject, 
    updateProject, 
    updateArticle,
    deleteArticle,
    addArticle,
    deleteProject,
    setStrategyPack,
    loading
  } = useData();
  
  const project = projects.find((p) => p.id === projectId);
  const [newArticleTitle, setNewArticleTitle] = useState('');
  
  // Local state for unsaved changes
  const [localProject, setLocalProject] = useState<Partial<Project>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  // AI generation states
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [generatingArticleId, setGeneratingArticleId] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [titleCount, setTitleCount] = useState(5);
  
  // Article editor state
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  // WordPress publishing state
  const [selectedArticles, setSelectedArticles] = useState<Set<string>>(new Set());
  const [isPublishingToWordPress, setIsPublishingToWordPress] = useState(false);

  // Initialize local state when project changes
  useEffect(() => {
    if (project) {
      setLocalProject({
        name: project.name,
        mode: project.mode,
        brandVoice: project.brandVoice,
        language: project.language,
        customLanguage: project.customLanguage,
        websiteUrl: project.websiteUrl,
        product: project.product,
        targetMarket: project.targetMarket,
        persona: project.persona,
        valueProposition: project.valueProposition,
        // New fields
        keywords: project.keywords || [],
        businessName: project.businessName,
        businessAddress: project.businessAddress,
        businessPhone: project.businessPhone,
        businessEmail: project.businessEmail,
        referenceText: project.referenceText,
        referenceFileUrl: project.referenceFileUrl,
        // WordPress settings
        wordpressUrl: project.wordpressUrl,
        wordpressUsername: project.wordpressUsername,
        wordpressPassword: project.wordpressPassword,
      });
      setIsDirty(false);
    }
  }, [project?.id]);

  // Block navigation when there are unsaved changes
  const blocker = useBlocker(isDirty);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowUnsavedDialog(true);
      setPendingNavigation(blocker.location.pathname);
    }
  }, [blocker.state]);

  useEffect(() => {
    if (projectId) {
      setActiveProject(projectId);
    }
  }, [projectId, setActiveProject]);

  const handleLocalChange = useCallback(<K extends keyof Project>(key: K, value: Project[K]) => {
    setLocalProject((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }, []);

  const handleSaveProject = async () => {
    if (!project) return;
    await updateProject(project.id, localProject);
    setIsDirty(false);
    toast.success('Project saved successfully');
  };

  const handleDiscardChanges = () => {
    if (project) {
      setLocalProject({
        name: project.name,
        mode: project.mode,
        brandVoice: project.brandVoice,
        language: project.language,
        customLanguage: project.customLanguage,
        websiteUrl: project.websiteUrl,
        product: project.product,
        targetMarket: project.targetMarket,
        persona: project.persona,
        valueProposition: project.valueProposition,
        // New fields
        keywords: project.keywords || [],
        businessName: project.businessName,
        businessAddress: project.businessAddress,
        businessPhone: project.businessPhone,
        businessEmail: project.businessEmail,
        referenceText: project.referenceText,
        referenceFileUrl: project.referenceFileUrl,
        // WordPress settings
        wordpressUrl: project.wordpressUrl,
        wordpressUsername: project.wordpressUsername,
        wordpressPassword: project.wordpressPassword,
      });
    }
    setIsDirty(false);
    setShowUnsavedDialog(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  };

  const handleStayOnPage = () => {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="link" onClick={() => navigate('/')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  const getLanguageLabel = () => {
    const lang = localProject.language || project.language;
    const customLang = localProject.customLanguage || project.customLanguage;
    if (lang === 'other' && customLang) {
      return customLang;
    }
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleDeleteProject = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(project.id);
      toast.success('Project deleted');
      navigate('/');
    }
  };

  const handleAddArticle = async () => {
    if (!newArticleTitle.trim()) return;
    await addArticle(project.id, newArticleTitle.trim());
    setNewArticleTitle('');
    toast.success('Article added to todo list');
  };

  const getProjectLanguage = () => {
    const lang = project.language;
    if (lang === 'other' && project.customLanguage) {
      return project.customLanguage;
    }
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleGenerateStrategy = async () => {
    setIsGeneratingStrategy(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: {
          projectData: {
            mode: project.mode,
            language: getProjectLanguage(),
            websiteUrl: localProject.websiteUrl || project.websiteUrl,
            product: localProject.product || project.product,
            targetMarket: localProject.targetMarket || project.targetMarket,
            persona: localProject.persona || project.persona,
            valueProposition: localProject.valueProposition || project.valueProposition,
            keywords: localProject.keywords || project.keywords || [],
            businessContext: project.businessContext,
          },
        },
      });

      if (error) {
        console.error('Strategy generation error:', error);
        const errorMessage = error.message || 'Failed to generate strategy pack';
        toast.error(errorMessage.includes('API key') ? errorMessage : 'Failed to generate strategy pack');
        return;
      }

      if (data?.strategyPack) {
        await setStrategyPack(project.id, data.strategyPack as StrategyPack);
        toast.success('Strategy pack generated successfully!');
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Strategy generation error:', err);
      toast.error('Failed to generate strategy pack');
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  const handleGenerateArticle = async (articleId: string, articleTitle: string) => {
    setGeneratingArticleId(articleId);
    await updateArticle(project.id, articleId, { status: 'in-progress' });

    try {
      const brandVoice = project.brandVoice || masterSettings.defaultBrandVoice;
      const targetWordCount = masterSettings.defaultArticleLength;

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          articleTitle,
          projectData: {
            language: getProjectLanguage(),
            brandVoice,
            targetWordCount,
            persona: project.strategyPack?.personaSummary || project.persona,
            painPoints: project.strategyPack?.corePainPoints,
            product: project.product,
            targetMarket: project.targetMarket,
            valueProposition: project.valueProposition,
            keywords: project.keywords || [],
            businessName: project.businessName,
            businessAddress: project.businessAddress,
            businessPhone: project.businessPhone,
            businessEmail: project.businessEmail,
            websiteUrl: project.websiteUrl,
          },
        },
      });

      if (error) {
        console.error('Article generation error:', error);
        await updateArticle(project.id, articleId, { status: 'todo' });
        const errorMessage = error.message || 'Failed to generate article';
        toast.error(errorMessage.includes('API key') ? errorMessage : 'Failed to generate article');
        return;
      }

      if (data?.content) {
        await updateArticle(project.id, articleId, {
          status: 'completed',
          content: data.content,
          wordCount: data.wordCount,
        });
        toast.success('Article generated successfully!');
      } else if (data?.error) {
        await updateArticle(project.id, articleId, { status: 'todo' });
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Article generation error:', err);
      await updateArticle(project.id, articleId, { status: 'todo' });
      toast.error('Failed to generate article');
    } finally {
      setGeneratingArticleId(null);
    }
  };

  const handleBatchGenerate = async () => {
    const todoArticles = project.articles.filter((a) => a.status === 'todo');
    if (todoArticles.length === 0) {
      toast.info('No articles to generate');
      return;
    }

    setIsBatchGenerating(true);
    let successCount = 0;
    let errorCount = 0;

    for (const article of todoArticles) {
      setGeneratingArticleId(article.id);
      await updateArticle(project.id, article.id, { status: 'in-progress' });

      try {
        const brandVoice = project.brandVoice || masterSettings.defaultBrandVoice;
        const targetWordCount = masterSettings.defaultArticleLength;

        const { data, error } = await supabase.functions.invoke('generate-article', {
          body: {
            articleTitle: article.title,
            projectData: {
              language: getProjectLanguage(),
              brandVoice,
              targetWordCount,
              persona: project.strategyPack?.personaSummary || project.persona,
              painPoints: project.strategyPack?.corePainPoints,
              product: project.product,
              targetMarket: project.targetMarket,
              valueProposition: project.valueProposition,
              keywords: project.keywords || [],
              businessName: project.businessName,
              businessAddress: project.businessAddress,
              businessPhone: project.businessPhone,
              businessEmail: project.businessEmail,
              websiteUrl: project.websiteUrl,
            },
          },
        });

        if (error || !data?.content) {
          await updateArticle(project.id, article.id, { status: 'todo' });
          errorCount++;
        } else {
          await updateArticle(project.id, article.id, {
            status: 'completed',
            content: data.content,
            wordCount: data.wordCount,
          });
          successCount++;
        }
      } catch (err) {
        await updateArticle(project.id, article.id, { status: 'todo' });
        errorCount++;
      }
    }

    setGeneratingArticleId(null);
    setIsBatchGenerating(false);

    if (errorCount === 0) {
      toast.success(`Generated ${successCount} articles successfully!`);
    } else {
      toast.warning(`Generated ${successCount} articles, ${errorCount} failed`);
    }
  };

  const handleGenerateTitles = async () => {
    if (titleCount < 1 || titleCount > 50) {
      toast.error('Please enter a number between 1 and 50');
      return;
    }

    setIsGeneratingTitles(true);

    try {
      const existingTitles = project.articles.map((a) => a.title);

      const { data, error } = await supabase.functions.invoke('generate-titles', {
        body: {
          count: titleCount,
          existingTitles,
          projectData: {
            language: getProjectLanguage(),
            keywords: project.keywords || [],
            topicClusters: project.strategyPack?.topicClusters,
            referenceText: project.referenceText,
            personaSummary: project.strategyPack?.personaSummary,
            corePainPoints: project.strategyPack?.corePainPoints,
            product: project.product,
            targetMarket: project.targetMarket,
          },
        },
      });

      if (error) {
        console.error('Title generation error:', error);
        const errorMessage = error.message || 'Failed to generate article titles';
        toast.error(errorMessage.includes('API key') ? errorMessage : 'Failed to generate article titles');
        return;
      }

      if (data?.titles && Array.isArray(data.titles)) {
        // Add all generated titles as new articles
        for (const title of data.titles) {
          await addArticle(project.id, title);
        }
        toast.success(`Generated ${data.titles.length} article titles!`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Title generation error:', err);
      toast.error('Failed to generate article titles');
    } finally {
      setIsGeneratingTitles(false);
    }
  };

  // WordPress publishing
  const handlePublishToWordPress = async () => {
    if (selectedArticles.size === 0) {
      toast.error('Please select at least one article to publish');
      return;
    }

    const wpUrl = localProject.wordpressUrl || project.wordpressUrl;
    const wpUsername = localProject.wordpressUsername || project.wordpressUsername;
    const wpPassword = localProject.wordpressPassword || project.wordpressPassword;

    if (!wpUrl || !wpUsername || !wpPassword) {
      toast.error('Please configure WordPress settings first');
      return;
    }

    setIsPublishingToWordPress(true);
    let successCount = 0;
    let errorCount = 0;

    const articlesToPublish = project.articles.filter(a => 
      selectedArticles.has(a.id) && a.status === 'completed' && a.content
    );

    for (const article of articlesToPublish) {
      try {
        const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
          body: {
            wordpressUrl: wpUrl,
            username: wpUsername,
            password: wpPassword,
            title: article.title,
            content: article.content,
            status: 'draft',
          },
        });

        if (error || !data?.success) {
          console.error('WordPress publish error:', error || data?.error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('WordPress publish error:', err);
        errorCount++;
      }
    }

    setIsPublishingToWordPress(false);
    setSelectedArticles(new Set());

    if (errorCount === 0) {
      toast.success(`Published ${successCount} article(s) as drafts to WordPress`);
    } else if (successCount > 0) {
      toast.warning(`Published ${successCount}, failed ${errorCount} article(s)`);
    } else {
      toast.error('Failed to publish articles to WordPress');
    }
  };

  const toggleArticleSelection = (articleId: string) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const selectAllCompletedArticles = () => {
    const completedIds = project.articles
      .filter(a => a.status === 'completed' && a.content)
      .map(a => a.id);
    setSelectedArticles(new Set(completedIds));
  };

  const handleSaveArticleContent = async (content: string) => {
    if (!editingArticle) return;
    const wordCount = content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    await updateArticle(project.id, editingArticle.id, { content, wordCount });
    setEditingArticle(null);
    toast.success('Article saved');
  };

  const getStatusIcon = (status: Article['status']) => {
    switch (status) {
      case 'completed':
        return <Check className="w-4 h-4 text-success" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: Article['status']) => {
    const variants = {
      completed: 'bg-success/20 text-success border-success/30',
      'in-progress': 'bg-warning/20 text-warning border-warning/30',
      todo: 'bg-muted text-muted-foreground border-border',
    };
    return (
      <Badge variant="outline" className={cn('capitalize', variants[status])}>
        {status.replace('-', ' ')}
      </Badge>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Unsaved changes dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save them before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleStayOnPage}>Stay</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDiscardChanges}>
              Discard Changes
            </Button>
            <AlertDialogAction onClick={() => {
              handleSaveProject();
              handleDiscardChanges();
            }}>
              Save & Leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        variant="ghost"
        className="mb-6 gap-2 text-muted-foreground"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      <PageHeader
        title={localProject.name || project.name}
        description={`${(localProject.mode || project.mode) === 'auto' ? 'Auto Mode' : 'Advanced Mode'} · ${getLanguageLabel()}`}
        action={
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                Unsaved Changes
              </Badge>
            )}
            <Button onClick={handleSaveProject} disabled={!isDirty} className="gap-2">
              <Save className="w-4 h-4" />
              Save Project
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDeleteProject}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords" className="gap-1">
            <Key className="w-3 h-3" />
            Keywords ({(localProject.keywords || []).length})
          </TabsTrigger>
          <TabsTrigger value="strategy">Market Insight</TabsTrigger>
          <TabsTrigger value="articles">Articles ({project.articles.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Dashboard */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold capitalize">
                  {(localProject.mode || project.mode) === 'auto' ? 'Auto' : 'Advanced'}
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Languages className="w-4 h-4" />
                  Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{getLanguageLabel()}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Articles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">
                  {project.articles.filter((a) => a.status === 'completed').length}
                  <span className="text-muted-foreground text-lg font-normal">/{project.articles.length}</span>
                </span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{(localProject.keywords || []).length}</span>
              </CardContent>
            </Card>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Article Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Article Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success" />
                      <span>Completed</span>
                    </div>
                    <Badge className="bg-success/20 text-success border-success/30">
                      {project.articles.filter((a) => a.status === 'completed').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <span>In Progress</span>
                    </div>
                    <Badge className="bg-warning/20 text-warning border-warning/30">
                      {project.articles.filter((a) => a.status === 'in-progress').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span>Todo</span>
                    </div>
                    <Badge variant="outline">
                      {project.articles.filter((a) => a.status === 'todo').length}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Insight Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Market Insight
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.strategyPack ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Persona</span>
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Pain Points</span>
                      <Badge variant="secondary">{project.strategyPack.corePainPoints.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Topic Clusters</span>
                      <Badge variant="secondary">{project.strategyPack.topicClusters.length}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-3">No market insight generated yet</p>
                    <Button 
                      size="sm"
                      onClick={handleGenerateStrategy}
                      disabled={isGeneratingStrategy}
                      className="gap-2"
                    >
                      {isGeneratingStrategy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      Generate
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Business Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Business Name</span>
                    <p className="font-medium">{localProject.businessName || project.businessName || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Website</span>
                    <p className="font-medium">
                      {localProject.websiteUrl || project.websiteUrl ? (
                        <a href={localProject.websiteUrl || project.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                          {localProject.websiteUrl || project.websiteUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : '-'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-muted-foreground">Product/Service</span>
                    <p className="font-medium">{localProject.product || project.product || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Target Market</span>
                    <p className="font-medium">{localProject.targetMarket || project.targetMarket || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {!project.strategyPack && (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate Market Insight</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {project.mode === 'auto' 
                    ? 'Enter your website URL to analyze and generate comprehensive market insights.'
                    : 'Fill in your business details to generate comprehensive market insights.'}
                </p>
                <Button 
                  className="gap-2" 
                  onClick={handleGenerateStrategy}
                  disabled={isGeneratingStrategy}
                >
                  {isGeneratingStrategy ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {isGeneratingStrategy ? 'Generating...' : 'Generate Market Insight'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          <KeywordsManager
            keywords={localProject.keywords || []}
            onChange={(keywords) => handleLocalChange('keywords', keywords)}
          />
        </TabsContent>

        {/* Market Insight Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {/* Generate/Regenerate Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    {project.strategyPack ? 'Regenerate Market Insight' : 'Generate Market Insight'}
                  </CardTitle>
                  <CardDescription>
                    {project.strategyPack 
                      ? 'Not satisfied with the results? Regenerate to get new insights'
                      : (localProject.mode || project.mode) === 'auto' 
                        ? 'Enter your website URL to analyze and generate market insights'
                        : 'Fill in business details in Settings tab first, then generate insights'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(localProject.mode || project.mode) === 'auto' && (
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    value={localProject.websiteUrl || ''}
                    onChange={(e) => handleLocalChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              )}
              <Button 
                className="gap-2"
                onClick={handleGenerateStrategy}
                disabled={isGeneratingStrategy}
              >
                {isGeneratingStrategy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : project.strategyPack ? (
                  <RefreshCw className="w-4 h-4" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isGeneratingStrategy ? 'Generating...' : project.strategyPack ? 'Regenerate' : 'Generate'}
              </Button>
            </CardContent>
          </Card>

          {project.strategyPack && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Persona Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{project.strategyPack.personaSummary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Core Pain Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {project.strategyPack.corePainPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                          {i + 1}
                        </span>
                        <span className="pt-1">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Topic Clusters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.strategyPack.topicClusters.map((cluster, i) => (
                      <Badge key={i} variant="secondary" className="text-sm py-1 px-3">{cluster}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {project.strategyPack.tofuSearchIntent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Top-of-Funnel Search Intent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{project.strategyPack.tofuSearchIntent}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!project.strategyPack && (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Market Insight Yet</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Generate market insights to understand your target persona, pain points, and topic clusters for content creation.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          {/* Generate Title Ideas Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Generate Article Ideas</CardTitle>
              </div>
              <CardDescription>
                Generate new article title ideas based on your keywords, topics, and reference context
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="titleCount" className="whitespace-nowrap">Number of titles:</Label>
                  <Input
                    id="titleCount"
                    type="number"
                    min={1}
                    max={50}
                    value={titleCount}
                    onChange={(e) => setTitleCount(parseInt(e.target.value) || 5)}
                    className="w-20"
                  />
                </div>
                <Button
                  onClick={handleGenerateTitles}
                  disabled={isGeneratingTitles || isBatchGenerating}
                  className="gap-2"
                >
                  {isGeneratingTitles ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                  {isGeneratingTitles ? 'Generating...' : 'Generate Ideas'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Add Article</CardTitle>
                <CardDescription>Add a new article to the todo list</CardDescription>
              </div>
              {project.articles.filter((a) => a.status === 'todo').length > 0 && (
                <Button
                  onClick={handleBatchGenerate}
                  disabled={isBatchGenerating || generatingArticleId !== null}
                  className="gap-2"
                >
                  {isBatchGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Generate All ({project.articles.filter((a) => a.status === 'todo').length})
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={newArticleTitle}
                  onChange={(e) => setNewArticleTitle(e.target.value)}
                  placeholder="Enter article title..."
                  onKeyDown={(e) => e.key === 'Enter' && handleAddArticle()}
                />
                <Button onClick={handleAddArticle} className="gap-2 shrink-0">
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WordPress Publish Section */}
          {(localProject.wordpressUrl || project.wordpressUrl) && project.articles.some(a => a.status === 'completed' && a.content) && (
            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">Publish to WordPress</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllCompletedArticles}
                    >
                      Select All Completed
                    </Button>
                    <Button
                      onClick={handlePublishToWordPress}
                      disabled={isPublishingToWordPress || selectedArticles.size === 0}
                      className="gap-2"
                    >
                      {isPublishingToWordPress ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      Publish as Draft ({selectedArticles.size})
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Select completed articles to save as drafts in WordPress
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          <div className="space-y-3">
            {project.articles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No articles yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Generate market insights to automatically create article titles, or add them manually above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              project.articles.map((article) => (
                <Card key={article.id} className={cn(
                  "group hover:border-primary/30 transition-colors",
                  selectedArticles.has(article.id) && "border-blue-500/50 bg-blue-500/5"
                )}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Selection checkbox for completed articles */}
                        {article.status === 'completed' && article.content && (localProject.wordpressUrl || project.wordpressUrl) && (
                          <Checkbox
                            checked={selectedArticles.has(article.id)}
                            onCheckedChange={() => toggleArticleSelection(article.id)}
                          />
                        )}
                        {generatingArticleId === article.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          getStatusIcon(article.status)
                        )}
                        <span className="font-medium truncate">{article.title}</span>
                        {article.wordCount && (
                          <span className="text-xs text-muted-foreground">
                            {article.wordCount} words
                          </span>
                        )}
                      </div>
                        <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(article.status)}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {article.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingArticle(article)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View/Edit
                            </Button>
                          )}
                          {article.status === 'todo' && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateArticle(article.id, article.title)}
                              disabled={generatingArticleId !== null || isBatchGenerating}
                            >
                              {generatingArticleId === article.id ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Sparkles className="w-3 h-3 mr-1" />
                              )}
                              Generate
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteArticle(project.id, article.id)}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Settings</CardTitle>
              <CardDescription>Configure settings specific to this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={localProject.name || ''}
                  onChange={(e) => handleLocalChange('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Project Mode</Label>
                <div className="flex flex-wrap gap-4">
                  {(['auto', 'advanced'] as ProjectMode[]).map((mode) => (
                    <label key={mode} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="mode"
                        checked={localProject.mode === mode}
                        onChange={() => handleLocalChange('mode', mode)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="capitalize">{mode === 'auto' ? 'Auto Mode' : 'Advanced Mode'}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {localProject.mode === 'auto' 
                    ? 'Auto Mode: Analyze website URL to extract business context automatically'
                    : 'Advanced Mode: Manually input all business details for precise control'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <div className="flex flex-wrap gap-4">
                  {(['indonesian', 'english', 'other'] as ProjectLanguage[]).map((lang) => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="language"
                        checked={localProject.language === lang}
                        onChange={() => handleLocalChange('language', lang)}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="capitalize">{lang}</span>
                    </label>
                  ))}
                </div>
                {localProject.language === 'other' && (
                  <Input
                    value={localProject.customLanguage || ''}
                    onChange={(e) => handleLocalChange('customLanguage', e.target.value)}
                    placeholder="Enter language name..."
                    className="mt-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandVoice">Brand Voice (Override)</Label>
                <Textarea
                  id="brandVoice"
                  value={localProject.brandVoice || ''}
                  onChange={(e) => handleLocalChange('brandVoice', e.target.value)}
                  placeholder="Leave empty to use Master Settings default..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Override the default brand voice for this project only
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Business Contact Details */}
          <Card>
            <CardHeader>
              <CardTitle>Business Contact Details</CardTitle>
              <CardDescription>Contact information used for article CTAs and content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessName">
                    Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    value={localProject.businessName || ''}
                    onChange={(e) => handleLocalChange('businessName', e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessWebsite">Website</Label>
                  <Input
                    id="businessWebsite"
                    value={localProject.websiteUrl || ''}
                    onChange={(e) => handleLocalChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Address</Label>
                <Input
                  id="businessAddress"
                  value={localProject.businessAddress || ''}
                  onChange={(e) => handleLocalChange('businessAddress', e.target.value)}
                  placeholder="Business address"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    value={localProject.businessPhone || ''}
                    onChange={(e) => handleLocalChange('businessPhone', e.target.value)}
                    placeholder="+62 xxx xxxx xxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={localProject.businessEmail || ''}
                    onChange={(e) => handleLocalChange('businessEmail', e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Mode Fields */}
          {localProject.mode === 'advanced' && (
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Detailed information for advanced content generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="settingsProduct">Product/Service</Label>
                    <Input
                      id="settingsProduct"
                      value={localProject.product || ''}
                      onChange={(e) => handleLocalChange('product', e.target.value)}
                      placeholder="What does the business sell?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settingsTargetMarket">Target Market</Label>
                    <Input
                      id="settingsTargetMarket"
                      value={localProject.targetMarket || ''}
                      onChange={(e) => handleLocalChange('targetMarket', e.target.value)}
                      placeholder="Who is the target audience?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settingsPersona">Persona</Label>
                  <Textarea
                    id="settingsPersona"
                    value={localProject.persona || ''}
                    onChange={(e) => handleLocalChange('persona', e.target.value)}
                    placeholder="Describe the ideal customer persona..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settingsValueProposition">Value Proposition</Label>
                  <Textarea
                    id="settingsValueProposition"
                    value={localProject.valueProposition || ''}
                    onChange={(e) => handleLocalChange('valueProposition', e.target.value)}
                    placeholder="What unique value does the business offer?"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Auto Mode URL Field */}
          {localProject.mode === 'auto' && (
            <Card>
              <CardHeader>
                <CardTitle>Website URL for Analysis</CardTitle>
                <CardDescription>Enter the website URL to analyze for auto-generating content strategy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="settingsWebsiteUrl">Website URL</Label>
                  <Input
                    id="settingsWebsiteUrl"
                    value={localProject.websiteUrl || ''}
                    onChange={(e) => handleLocalChange('websiteUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* WordPress Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                WordPress Integration
              </CardTitle>
              <CardDescription>
                Configure WordPress REST API credentials to publish articles as drafts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="wordpressUrl">WordPress Site URL</Label>
                <Input
                  id="wordpressUrl"
                  value={localProject.wordpressUrl || ''}
                  onChange={(e) => handleLocalChange('wordpressUrl', e.target.value)}
                  placeholder="https://your-site.com"
                />
                <p className="text-xs text-muted-foreground">
                  Your WordPress site URL (e.g., https://example.com)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wordpressUsername">Username</Label>
                  <Input
                    id="wordpressUsername"
                    value={localProject.wordpressUsername || ''}
                    onChange={(e) => handleLocalChange('wordpressUsername', e.target.value)}
                    placeholder="WordPress username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wordpressPassword">Application Password</Label>
                  <Input
                    id="wordpressPassword"
                    type="password"
                    value={localProject.wordpressPassword || ''}
                    onChange={(e) => handleLocalChange('wordpressPassword', e.target.value)}
                    placeholder="WordPress application password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Generate an application password in WordPress: Users → Profile → Application Passwords
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reference Context */}
          <ReferenceFileUpload
            referenceText={localProject.referenceText || ''}
            referenceFileUrl={localProject.referenceFileUrl}
            onReferenceTextChange={(text) => handleLocalChange('referenceText', text)}
            onReferenceFileChange={(url) => handleLocalChange('referenceFileUrl', url)}
            projectId={project.id}
          />
        </TabsContent>
      </Tabs>

      {/* Article Editor Dialog */}
      {editingArticle && (
        <ArticleEditor
          article={editingArticle}
          open={!!editingArticle}
          onClose={() => setEditingArticle(null)}
          onSave={handleSaveArticleContent}
        />
      )}
    </div>
  );
}
