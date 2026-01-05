import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Sparkles, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AI_MODELS, AI_PROVIDER_NAMES } from '@/types/project';

export default function MasterSettings() {
  const { masterSettings, updateMasterSettings, loading } = useData();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(masterSettings);
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState('');
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'failed'>('idle');
  const [isSaving, setIsSaving] = useState(false);

  // Check if current provider has an API key saved
  const hasApiKeyForProvider = (provider: AIProvider) => {
    return localSettings.providerApiKeys[provider] !== '';
  };

  // Sync local settings when masterSettings changes
  useEffect(() => {
    setLocalSettings(masterSettings);
    // Reset the input field when settings change
    setCurrentApiKeyInput('');
    setApiKeyStatus('idle');
  }, [masterSettings]);

  const handleSave = async () => {
    // Check if we need to save a new API key
    if (currentApiKeyInput.trim() && !currentApiKeyInput.startsWith('••••')) {
      setIsSaving(true);
      await updateMasterSettings({
        ...localSettings,
        apiKey: currentApiKeyInput,
      });
      setCurrentApiKeyInput('');
      setIsSaving(false);
      toast.success('Settings saved successfully');
    } else if (!hasApiKeyForProvider(localSettings.aiProvider)) {
      toast.error(`Please enter an API key for ${AI_PROVIDER_NAMES[localSettings.aiProvider]}`);
      return;
    } else {
      setIsSaving(true);
      await updateMasterSettings(localSettings);
      setIsSaving(false);
      toast.success('Settings saved successfully');
    }
  };

  const handleChange = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleProviderChange = (provider: AIProvider) => {
    const models = AI_MODELS[provider];
    setLocalSettings((prev) => ({
      ...prev,
      aiProvider: provider,
      defaultModel: models[0],
      apiKey: prev.providerApiKeys[provider] || '',
    }));
    setCurrentApiKeyInput('');
    setApiKeyStatus('idle');
  };

  const handleTestApiKey = async () => {
    const keyToTest = currentApiKeyInput.trim() || '';
    
    if (!keyToTest || keyToTest.startsWith('••••')) {
      toast.error('Please enter a new API key to test');
      return;
    }

    setApiKeyStatus('testing');

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: {
          apiKey: keyToTest,
          provider: localSettings.aiProvider,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        setApiKeyStatus('failed');
        toast.error('Failed to validate API key');
        return;
      }

      const isValid = data?.valid === true;
      setApiKeyStatus(isValid ? 'ok' : 'failed');
      
      if (isValid) {
        toast.success('API key is valid');
      } else {
        toast.error(data?.error || 'API key validation failed');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setApiKeyStatus('failed');
      toast.error('Failed to validate API key');
    }
  };

  const currentModels = AI_MODELS[localSettings.aiProvider];
  const currentProviderHasKey = hasApiKeyForProvider(localSettings.aiProvider);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Master Settings"
        description="Configure global settings that apply to all projects"
        action={
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Settings
          </Button>
        }
      />

      <div className="space-y-6">
        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>Configure your AI provider and model settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="aiProvider">AI Provider</Label>
                <Select
                  value={localSettings.aiProvider}
                  onValueChange={(value: AIProvider) => handleProviderChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AI_PROVIDER_NAMES).map(([value, label]) => {
                      const hasKey = hasApiKeyForProvider(value as AIProvider);
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {label}
                            {hasKey && (
                              <CheckCircle className="w-3 h-3 text-success" />
                            )}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultModel">Default Model</Label>
                <Select
                  value={localSettings.defaultModel}
                  onValueChange={(value) => handleChange('defaultModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* API Key Status Alert */}
            {!currentProviderHasKey && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No API key saved for {AI_PROVIDER_NAMES[localSettings.aiProvider]}. Please enter and save an API key to use this provider.
                </AlertDescription>
              </Alert>
            )}

            {currentProviderHasKey && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  API key for {AI_PROVIDER_NAMES[localSettings.aiProvider]} is configured. Enter a new key below to update it.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                {currentProviderHasKey ? 'Update API Key' : 'API Key'} ({AI_PROVIDER_NAMES[localSettings.aiProvider]})
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={currentApiKeyInput}
                    onChange={(e) => {
                      setCurrentApiKeyInput(e.target.value);
                      setApiKeyStatus('idle');
                    }}
                    placeholder={currentProviderHasKey ? 'Enter new API key to update...' : 'Enter your API key'}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestApiKey}
                  disabled={apiKeyStatus === 'testing' || !currentApiKeyInput.trim()}
                  className="gap-2 shrink-0"
                >
                  {apiKeyStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : apiKeyStatus === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : apiKeyStatus === 'failed' ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : null}
                  {apiKeyStatus === 'ok' ? 'Valid' : apiKeyStatus === 'failed' ? 'Invalid' : 'Test Key'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Each AI provider has its own API key. Your keys are encrypted and stored securely.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Defaults */}
        <Card>
          <CardHeader>
            <CardTitle>Content Defaults</CardTitle>
            <CardDescription>Default settings for article generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="defaultArticleLength">Default Article Length (words)</Label>
              <Input
                id="defaultArticleLength"
                type="number"
                value={localSettings.defaultArticleLength}
                onChange={(e) => handleChange('defaultArticleLength', parseInt(e.target.value) || 500)}
                min={200}
                max={5000}
                className="max-w-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultBrandVoice">Default Brand Voice</Label>
              <Textarea
                id="defaultBrandVoice"
                value={localSettings.defaultBrandVoice}
                onChange={(e) => handleChange('defaultBrandVoice', e.target.value)}
                placeholder="Describe the default tone and style for generated content..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This will be used as fallback when a project doesn't have a custom brand voice
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}