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
  Loader2
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Article, Project, ProjectLanguage, StrategyPack } from '@/types/project';
import { supabase } from '@/integrations/supabase/client';

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
    setStrategyPack
  } = useAppStore();
  
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

  // Initialize local state when project changes
  useEffect(() => {
    if (project) {
      setLocalProject({
        name: project.name,
        brandVoice: project.brandVoice,
        language: project.language,
        customLanguage: project.customLanguage,
        websiteUrl: project.websiteUrl,
        product: project.product,
        targetMarket: project.targetMarket,
        persona: project.persona,
        valueProposition: project.valueProposition,
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

  const handleSaveProject = () => {
    if (!project) return;
    updateProject(project.id, localProject);
    setIsDirty(false);
    toast.success('Project saved successfully');
  };

  const handleDiscardChanges = () => {
    if (project) {
      setLocalProject({
        name: project.name,
        brandVoice: project.brandVoice,
        language: project.language,
        customLanguage: project.customLanguage,
        websiteUrl: project.websiteUrl,
        product: project.product,
        targetMarket: project.targetMarket,
        persona: project.persona,
        valueProposition: project.valueProposition,
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

  const handleDeleteProject = () => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteProject(project.id);
      toast.success('Project deleted');
      navigate('/');
    }
  };

  const handleAddArticle = () => {
    if (!newArticleTitle.trim()) return;
    addArticle(project.id, newArticleTitle.trim());
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
    if (!masterSettings.apiKey) {
      toast.error('Please configure your API key in Master Settings first');
      return;
    }

    setIsGeneratingStrategy(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: {
          apiKey: masterSettings.apiKey,
          provider: masterSettings.aiProvider,
          model: masterSettings.defaultModel,
          projectData: {
            mode: project.mode,
            language: getProjectLanguage(),
            websiteUrl: localProject.websiteUrl || project.websiteUrl,
            product: localProject.product || project.product,
            targetMarket: localProject.targetMarket || project.targetMarket,
            persona: localProject.persona || project.persona,
            valueProposition: localProject.valueProposition || project.valueProposition,
          },
        },
      });

      if (error) {
        console.error('Strategy generation error:', error);
        toast.error('Failed to generate strategy pack');
        return;
      }

      if (data?.strategyPack) {
        setStrategyPack(project.id, data.strategyPack as StrategyPack);
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
    if (!masterSettings.apiKey) {
      toast.error('Please configure your API key in Master Settings first');
      return;
    }

    setGeneratingArticleId(articleId);
    updateArticle(project.id, articleId, { status: 'in-progress' });

    try {
      const brandVoice = project.brandVoice || masterSettings.defaultBrandVoice;
      const targetWordCount = masterSettings.defaultArticleLength;

      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          apiKey: masterSettings.apiKey,
          provider: masterSettings.aiProvider,
          model: masterSettings.defaultModel,
          articleTitle,
          projectData: {
            language: getProjectLanguage(),
            brandVoice,
            targetWordCount,
            persona: project.strategyPack?.personaSummary || project.persona,
            painPoints: project.strategyPack?.corePainPoints,
            product: project.product,
            valueProposition: project.valueProposition,
          },
        },
      });

      if (error) {
        console.error('Article generation error:', error);
        updateArticle(project.id, articleId, { status: 'todo' });
        toast.error('Failed to generate article');
        return;
      }

      if (data?.content) {
        updateArticle(project.id, articleId, {
          status: 'completed',
          content: data.content,
          wordCount: data.wordCount,
        });
        toast.success('Article generated successfully!');
      } else if (data?.error) {
        updateArticle(project.id, articleId, { status: 'todo' });
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Article generation error:', err);
      updateArticle(project.id, articleId, { status: 'todo' });
      toast.error('Failed to generate article');
    } finally {
      setGeneratingArticleId(null);
    }
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
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
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
        description={`${project.mode === 'auto' ? 'Auto Mode' : 'Manual Mode'} · ${getLanguageLabel()}`}
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
          <TabsTrigger value="strategy">Strategy Pack</TabsTrigger>
          <TabsTrigger value="articles">Articles ({project.articles.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mode</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                {project.mode === 'auto' ? (
                  <Globe className="w-5 h-5 text-primary" />
                ) : (
                  <Pencil className="w-5 h-5 text-primary" />
                )}
                <span className="font-semibold capitalize">{project.mode} Mode</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Language</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <Languages className="w-5 h-5 text-primary" />
                <span className="font-semibold">{getLanguageLabel()}</span>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Articles</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {project.articles.filter((a) => a.status === 'completed').length}/
                  {project.articles.length} completed
                </span>
              </CardContent>
            </Card>
          </div>

          {!project.strategyPack && (
            <Card className="border-dashed border-2">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Generate Strategy Pack</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {project.mode === 'auto' 
                    ? 'Enter your website URL to analyze and generate a comprehensive SEO strategy.'
                    : 'Fill in your business details to generate a comprehensive SEO strategy.'}
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
                  {isGeneratingStrategy ? 'Generating...' : 'Generate Strategy'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Strategy Pack Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {project.mode === 'auto' ? (
            <Card>
              <CardHeader>
                <CardTitle>Website Analysis</CardTitle>
                <CardDescription>Enter the website URL to analyze</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="websiteUrl"
                      value={localProject.websiteUrl || ''}
                      onChange={(e) => handleLocalChange('websiteUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                    <Button 
                      className="gap-2 shrink-0"
                      onClick={handleGenerateStrategy}
                      disabled={isGeneratingStrategy}
                    >
                      {isGeneratingStrategy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {isGeneratingStrategy ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Business Details</CardTitle>
                <CardDescription>Provide detailed information about the business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="product">Product/Service</Label>
                    <Input
                      id="product"
                      value={localProject.product || ''}
                      onChange={(e) => handleLocalChange('product', e.target.value)}
                      placeholder="What does the business sell?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetMarket">Target Market</Label>
                    <Input
                      id="targetMarket"
                      value={localProject.targetMarket || ''}
                      onChange={(e) => handleLocalChange('targetMarket', e.target.value)}
                      placeholder="Who is the target audience?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona">Persona</Label>
                  <Textarea
                    id="persona"
                    value={localProject.persona || ''}
                    onChange={(e) => handleLocalChange('persona', e.target.value)}
                    placeholder="Describe the ideal customer persona..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valueProposition">Value Proposition</Label>
                  <Textarea
                    id="valueProposition"
                    value={localProject.valueProposition || ''}
                    onChange={(e) => handleLocalChange('valueProposition', e.target.value)}
                    placeholder="What unique value does the business offer?"
                    rows={3}
                  />
                </div>

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
                  {isGeneratingStrategy ? 'Generating...' : 'Generate Strategy Pack'}
                </Button>
              </CardContent>
            </Card>
          )}

          {project.strategyPack && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persona Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{project.strategyPack.personaSummary}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Core Pain Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {project.strategyPack.corePainPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs text-primary shrink-0">
                          {i + 1}
                        </span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Topic Clusters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {project.strategyPack.topicClusters.map((cluster, i) => (
                      <Badge key={i} variant="secondary">{cluster}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Article</CardTitle>
              <CardDescription>Add a new article to the todo list</CardDescription>
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

          <div className="space-y-3">
            {project.articles.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No articles yet</h3>
                  <p className="text-muted-foreground text-sm">
                    Generate a strategy pack to automatically create article titles, or add them manually above.
                  </p>
                </CardContent>
              </Card>
            ) : (
              project.articles.map((article) => (
                <Card key={article.id} className="group hover:border-primary/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
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
                          {article.status === 'todo' && (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateArticle(article.id, article.title)}
                              disabled={generatingArticleId !== null}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
