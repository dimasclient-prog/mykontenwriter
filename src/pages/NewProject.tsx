import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, FileText, Languages, Loader2, Zap, Settings2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { ProjectLanguage } from '@/types/project';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type AnalysisMode = 'basic' | 'advanced';

type LoadingStep = 'idle' | 'scraping' | 'analyzing' | 'generating' | 'saving';

const loadingStepMessages: Record<LoadingStep, { title: string; description: string }> = {
  idle: { title: '', description: '' },
  scraping: { title: 'Membaca Website', description: 'Mengekstrak konten dan informasi dari halaman website...' },
  analyzing: { title: 'Menganalisis Bisnis', description: 'AI sedang memahami produk, layanan, dan target pasar...' },
  generating: { title: 'Membuat Persona', description: 'Menghasilkan persona pelanggan berdasarkan analisis...' },
  saving: { title: 'Menyimpan Project', description: 'Menyimpan data project dan persona...' },
};

export default function NewProject() {
  const navigate = useNavigate();
  const { createProject, addPersona } = useData();
  
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [businessContext, setBusinessContext] = useState('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('basic');
  const [language, setLanguage] = useState<ProjectLanguage>('english');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  
  // Advanced mode fields
  const [product, setProduct] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [valueProposition, setValueProposition] = useState('');

  const hasWebsiteUrl = websiteUrl.trim().length > 0;
  
  // Calculate total steps based on whether URL is provided
  const totalSteps = hasWebsiteUrl ? 4 : 4; // Step 3 is conditional content
  
  const handleCreate = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (language === 'other' && !customLanguage.trim()) {
      toast.error('Please enter a custom language');
      return;
    }

    setIsCreating(true);
    setLoadingStep(hasWebsiteUrl && analysisMode === 'basic' ? 'scraping' : 'analyzing');
    
    try {
      // Determine mode based on analysis mode selection
      const mode = hasWebsiteUrl && analysisMode === 'basic' ? 'auto' : 'advanced';
      
      // Simulate step progression for UX
      if (hasWebsiteUrl && analysisMode === 'basic') {
        setTimeout(() => setLoadingStep('analyzing'), 2000);
        setTimeout(() => setLoadingStep('generating'), 5000);
      } else {
        setTimeout(() => setLoadingStep('generating'), 2000);
      }
      
      const { data: personaData, error: personaError } = await supabase.functions.invoke('generate-persona', {
        body: {
          websiteUrl: hasWebsiteUrl ? websiteUrl.trim() : undefined,
          businessContext: !hasWebsiteUrl ? businessContext.trim() : undefined,
          analysisMode,
          language: language === 'other' ? customLanguage.trim() : language,
          advancedData: analysisMode === 'advanced' ? {
            product,
            targetMarket,
            valueProposition
          } : undefined
        }
      });

      if (personaError) {
        console.error('Persona generation error:', personaError);
        toast.error('Failed to generate persona, creating project with default persona');
      }

      const generatedPersona = personaData?.persona;
      const businessInfo = personaData?.businessInfo;

      setLoadingStep('saving');
      
      // Create project with extracted business info
      const projectId = await createProject(
        projectName.trim(),
        mode,
        language,
        language === 'other' ? customLanguage.trim() : undefined,
        hasWebsiteUrl ? websiteUrl.trim() : undefined,
        !hasWebsiteUrl ? businessContext.trim() : undefined
      );
      
      if (projectId) {
        // Update project with extracted business information
        if (businessInfo) {
          const { updateProject } = await import('@/contexts/DataContext').then(m => {
            // We need to use the hook context, but since we're in a callback,
            // we'll update via direct supabase call
            return { updateProject: null };
          });
          
          // Update project with business info directly
          await supabase
            .from('projects')
            .update({
              business_name: businessInfo.businessName !== 'Not available' ? businessInfo.businessName : null,
              business_address: businessInfo.businessAddress !== 'Not available' ? businessInfo.businessAddress : null,
              business_phone: businessInfo.businessPhone !== 'Not available' ? businessInfo.businessPhone : null,
              business_email: businessInfo.businessEmail !== 'Not available' ? businessInfo.businessEmail : null,
              product: businessInfo.product !== 'Not available' ? businessInfo.product : product || null,
              target_market: businessInfo.targetMarket !== 'Not available' ? businessInfo.targetMarket : targetMarket || null,
              value_proposition: businessInfo.valueProposition !== 'Not available' ? businessInfo.valueProposition : valueProposition || null,
            })
            .eq('id', projectId);
        }

        // Add generated persona or fallback
        const persona = generatedPersona || {
          name: 'Primary Customer',
          role: targetMarket || 'Potential Customer',
          location: '',
          familyStatus: '',
          painPoints: ['Understanding the product/service', 'Finding the right solution'],
          concerns: 'Looking for reliable solutions'
        };
        
        await addPersona(projectId, {
          name: persona.name,
          role: persona.role,
          location: persona.location || '',
          familyStatus: persona.familyStatus || '',
          painPoints: persona.painPoints || [],
          concerns: persona.concerns
        });
        
        toast.success('Project created with AI-generated persona!');
        navigate(`/project/${projectId}`);
      } else {
        toast.error('Failed to create project');
      }
    } catch (error) {
      console.error('Project creation error:', error);
      toast.error('An error occurred while creating the project');
    }
    
    setIsCreating(false);
    setLoadingStep('idle');
  };

  const canProceed = () => {
    if (step === 1) return projectName.trim().length > 0;
    if (step === 2) return true; // URL is optional
    if (step === 3) {
      if (!hasWebsiteUrl) {
        return businessContext.trim().length > 0;
      }
      return true; // Analysis mode selection is always valid
    }
    if (step === 4) return language !== 'other' || customLanguage.trim().length > 0;
    return true;
  };

  const getStepTitle = (stepNum: number) => {
    if (stepNum === 1) return 'Name';
    if (stepNum === 2) return 'URL';
    if (stepNum === 3) return hasWebsiteUrl ? 'Mode' : 'Context';
    if (stepNum === 4) return 'Language';
    return '';
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto animate-fade-in">
      <Button
        variant="ghost"
        className="mb-6 gap-2 text-muted-foreground"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <PageHeader
        title="Create New Project"
        description="Set up a new SEO content project for your client"
      />

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {s}
              </div>
              <span className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {getStepTitle(s)}
              </span>
            </div>
            {s < 4 && (
              <div className={cn('w-8 md:w-16 h-0.5', step > s ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Project Name */}
      {step === 1 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Project Name</CardTitle>
            <CardDescription>
              Enter a name for your project (usually the client or website name)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">
                  Project Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Acme Corp, TechStartup Blog"
                  autoFocus
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Website URL */}
      {step === 2 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Website URL (Optional)</CardTitle>
            <CardDescription>
              Provide a website URL to automatically analyze business context, or skip to enter manually
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  type="url"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {websiteUrl.trim() 
                  ? "We'll analyze this website to understand your business" 
                  : "Leave empty to describe your business manually in the next step"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Conditional - Business Context OR Analysis Mode */}
      {step === 3 && (
        <Card className="animate-slide-up">
          {!hasWebsiteUrl ? (
            // No URL - Ask for business context
            <>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Business Context
                </CardTitle>
                <CardDescription>
                  Describe your business so we can generate relevant content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessContext">
                      Describe Your Business <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="businessContext"
                      value={businessContext}
                      onChange={(e) => setBusinessContext(e.target.value)}
                      placeholder="Please describe:
• Business industry
• Products or services offered
• Target customers
• Problems you solve for customers"
                      rows={8}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      The more detail you provide, the better we can tailor content for your audience
                    </p>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            // Has URL - Ask for analysis mode
            <>
              <CardHeader>
                <CardTitle>Analysis Mode</CardTitle>
                <CardDescription>
                  Choose how to analyze your website for content generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={analysisMode} onValueChange={(v) => setAnalysisMode(v as AnalysisMode)}>
                  <div className="space-y-4">
                    <label
                      htmlFor="mode-basic"
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        analysisMode === 'basic' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="basic" id="mode-basic" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Basic Analysis</h3>
                            <p className="text-sm text-muted-foreground">Quick & automatic</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground pl-13">
                          AI will automatically analyze your website to infer business type, 
                          products/services, target audience, and value proposition.
                        </p>
                      </div>
                    </label>

                    <label
                      htmlFor="mode-advanced"
                      className={cn(
                        'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        analysisMode === 'advanced' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <RadioGroupItem value="advanced" id="mode-advanced" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Settings2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Advanced Mode</h3>
                            <p className="text-sm text-muted-foreground">Manual details</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground pl-13">
                          Manually input product/service details, target market, and 
                          value proposition for precise control over content generation.
                        </p>
                      </div>
                    </label>
                  </div>
                </RadioGroup>

                {/* Advanced mode fields */}
                {analysisMode === 'advanced' && (
                  <div className="mt-6 space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="product">Product/Service</Label>
                      <Input
                        id="product"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="What does your business offer?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetMarket">Target Market</Label>
                      <Input
                        id="targetMarket"
                        value={targetMarket}
                        onChange={(e) => setTargetMarket(e.target.value)}
                        placeholder="Who is your target audience?"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valueProposition">Value Proposition</Label>
                      <Textarea
                        id="valueProposition"
                        value={valueProposition}
                        onChange={(e) => setValueProposition(e.target.value)}
                        placeholder="What unique value do you provide?"
                        rows={3}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      )}

      {/* Step 4: Language Selection */}
      {step === 4 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Languages className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>Content Language</CardTitle>
                <CardDescription>All generated content will be in this language</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup value={language} onValueChange={(v) => setLanguage(v as ProjectLanguage)}>
              <div className="space-y-3">
                <label
                  htmlFor="lang-indonesian"
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    language === 'indonesian' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="indonesian" id="lang-indonesian" />
                  <span className="font-medium">Indonesian</span>
                  <span className="text-sm text-muted-foreground">(Bahasa Indonesia)</span>
                </label>

                <label
                  htmlFor="lang-english"
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    language === 'english' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="english" id="lang-english" />
                  <span className="font-medium">English</span>
                </label>

                <label
                  htmlFor="lang-other"
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    language === 'other' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="other" id="lang-other" className="mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <span className="font-medium">Other Language</span>
                    {language === 'other' && (
                      <Input
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        placeholder="Enter language name (e.g., Spanish, Japanese)"
                        autoFocus
                      />
                    )}
                  </div>
                </label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 animate-slide-up">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Animated Loading Icon */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                  <div className="absolute -inset-2 rounded-full border-2 border-primary/30 animate-pulse" />
                </div>

                {/* Loading Step Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    {loadingStepMessages[loadingStep].title}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {loadingStepMessages[loadingStep].description}
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 w-full max-w-xs">
                  {(['scraping', 'analyzing', 'generating', 'saving'] as LoadingStep[]).map((s, index) => {
                    const stepOrder = ['scraping', 'analyzing', 'generating', 'saving'];
                    const currentIndex = stepOrder.indexOf(loadingStep);
                    const isActive = stepOrder.indexOf(s) === currentIndex;
                    const isCompleted = stepOrder.indexOf(s) < currentIndex;
                    const isVisible = hasWebsiteUrl && analysisMode === 'basic' ? true : s !== 'scraping';
                    
                    if (!isVisible) return null;
                    
                    return (
                      <div key={s} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            'w-full h-1.5 rounded-full transition-all duration-500',
                            isCompleted ? 'bg-primary' : isActive ? 'bg-primary/50 animate-pulse' : 'bg-muted'
                          )}
                        />
                        <span className={cn(
                          'text-[10px] capitalize transition-colors',
                          isActive ? 'text-primary font-medium' : isCompleted ? 'text-primary/70' : 'text-muted-foreground'
                        )}>
                          {s === 'scraping' ? 'Scrape' : s === 'analyzing' ? 'Analisis' : s === 'generating' ? 'Persona' : 'Simpan'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Mohon tunggu, proses ini memerlukan waktu beberapa saat...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1 || isCreating}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < 4 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed() || isCreating}>
            {step === 2 && !hasWebsiteUrl ? 'Skip' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={!canProceed() || isCreating}>
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Create Project
            {!isCreating && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        )}
      </div>
    </div>
  );
}
