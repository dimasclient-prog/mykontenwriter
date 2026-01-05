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
import { AIProvider, AI_MODELS, AI_PROVIDER_NAMES, ProviderApiKeys } from '@/types/project';

export default function MasterSettings() {
  const { masterSettings, updateMasterSettings, loading } = useData();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(masterSettings);
  const [providerKeys, setProviderKeys] = useState<ProviderApiKeys>({
    openai: '',
    gemini: '',
    deepseek: '',
    qwen: '',
  });
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'failed'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);

  // Fetch decrypted API keys on mount
  useEffect(() => {
    const fetchApiKeys = async () => {
      setIsLoadingKeys(true);
      try {
        const { data, error } = await supabase.functions.invoke('get-api-keys');
        
        if (error) {
          console.error('Error fetching API keys:', error);
          return;
        }

        if (data) {
          setProviderKeys({
            openai: data.openai || '',
            gemini: data.gemini || '',
            deepseek: data.deepseek || '',
            qwen: data.qwen || '',
          });
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
      } finally {
        setIsLoadingKeys(false);
      }
    };

    fetchApiKeys();
  }, []);

  // Sync local settings when masterSettings changes
  useEffect(() => {
    setLocalSettings(masterSettings);
  }, [masterSettings]);

  // Get current API key for the selected provider
  const currentApiKey = providerKeys[localSettings.aiProvider] || '';

  const handleSave = async () => {
    const keyToSave = providerKeys[localSettings.aiProvider];
    
    if (!keyToSave.trim()) {
      toast.error(`Please enter an API key for ${AI_PROVIDER_NAMES[localSettings.aiProvider]}`);
      return;
    }

    setIsSaving(true);
    await updateMasterSettings({
      ...localSettings,
      apiKey: keyToSave,
    });
    setIsSaving(false);
    toast.success('Settings saved successfully');
  };

  const handleChange = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApiKeyChange = (value: string) => {
    setProviderKeys((prev) => ({
      ...prev,
      [localSettings.aiProvider]: value,
    }));
    setApiKeyStatus('idle');
  };

  const handleProviderChange = (provider: AIProvider) => {
    const models = AI_MODELS[provider];
    setLocalSettings((prev) => ({
      ...prev,
      aiProvider: provider,
      defaultModel: models[0],
    }));
    setApiKeyStatus('idle');
  };

  const handleTestApiKey = async () => {
    const keyToTest = providerKeys[localSettings.aiProvider];
    
    if (!keyToTest.trim()) {
      toast.error('Please enter an API key to test');
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

  if (loading || isLoadingKeys) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-fade-in">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                      const hasKey = !!providerKeys[value as AIProvider];
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
            {!currentApiKey && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No API key saved for {AI_PROVIDER_NAMES[localSettings.aiProvider]}. Please enter and save an API key to use this provider.
                </AlertDescription>
              </Alert>
            )}

            {currentApiKey && (
              <Alert>
                <CheckCircle className="h-4 w-4 text-success" />
                <AlertDescription>
                  API key for {AI_PROVIDER_NAMES[localSettings.aiProvider]} is configured.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">
                API Key ({AI_PROVIDER_NAMES[localSettings.aiProvider]})
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={currentApiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="Enter your API key"
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
                  disabled={apiKeyStatus === 'testing' || !currentApiKey.trim()}
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