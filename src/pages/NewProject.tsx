import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Globe, Pencil, Languages } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { ProjectMode, ProjectLanguage } from '@/types/project';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function NewProject() {
  const navigate = useNavigate();
  const { createProject } = useAppStore();
  
  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [mode, setMode] = useState<ProjectMode>('auto');
  const [language, setLanguage] = useState<ProjectLanguage>('english');
  const [customLanguage, setCustomLanguage] = useState('');

  const handleCreate = () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    if (language === 'other' && !customLanguage.trim()) {
      toast.error('Please enter a custom language');
      return;
    }

    const projectId = createProject(
      projectName.trim(),
      mode,
      language,
      language === 'other' ? customLanguage.trim() : undefined
    );
    
    toast.success('Project created successfully');
    navigate(`/project/${projectId}`);
  };

  const canProceed = () => {
    if (step === 1) return projectName.trim().length > 0;
    if (step === 2) return true;
    if (step === 3) return language !== 'other' || customLanguage.trim().length > 0;
    return true;
  };

  return (
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
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
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              {s}
            </div>
            {s < 3 && (
              <div className={cn('w-16 h-0.5', step > s ? 'bg-primary' : 'bg-muted')} />
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
                <Label htmlFor="projectName">Project Name</Label>
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

      {/* Step 2: Mode Selection */}
      {step === 2 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Project Mode</CardTitle>
            <CardDescription>
              Choose how you want to provide business information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ProjectMode)}>
              <div className="space-y-4">
                <label
                  htmlFor="mode-auto"
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    mode === 'auto' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="auto" id="mode-auto" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Auto Mode (URL)</h3>
                        <p className="text-sm text-muted-foreground">Analyze website automatically</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pl-13">
                      Provide a website URL and we'll automatically extract business type, products, 
                      target audience, and value proposition.
                    </p>
                  </div>
                </label>

                <label
                  htmlFor="mode-manual"
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    mode === 'manual' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="manual" id="mode-manual" />
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Pencil className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Advanced Mode (Manual)</h3>
                        <p className="text-sm text-muted-foreground">Enter details manually</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground pl-13">
                      Manually input product/service details, target market, persona, pain points, 
                      and value proposition for precise control.
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Language Selection */}
      {step === 3 && (
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

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={!canProceed()}>
            Create Project
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
