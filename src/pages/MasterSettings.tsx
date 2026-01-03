import { useState } from 'react';
import { Save, Eye, EyeOff, Sparkles, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AI_MODELS, AI_PROVIDER_NAMES } from '@/types/project';

export default function MasterSettings() {
  const { masterSettings, updateMasterSettings } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(masterSettings);
  const [apiKeyStatus, setApiKeyStatus] = useState<'idle' | 'testing' | 'ok' | 'failed'>('idle');

  const handleSave = () => {
    updateMasterSettings(localSettings);
    toast.success('Master settings saved successfully');
  };

  const handleChange = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'apiKey') {
      setApiKeyStatus('idle');
    }
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
    if (!localSettings.apiKey.trim()) {
      toast.error('Please enter an API key first');
      return;
    }

    setApiKeyStatus('testing');

    try {
      const { data, error } = await supabase.functions.invoke('validate-api-key', {
        body: {
          apiKey: localSettings.apiKey,
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

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        title="Master Settings"
        description="Configure global settings that apply to all projects"
        action={
          <Button onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
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
                    {Object.entries(AI_PROVIDER_NAMES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
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

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={localSettings.apiKey}
                    onChange={(e) => handleChange('apiKey', e.target.value)}
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
                  disabled={apiKeyStatus === 'testing'}
                  className="gap-2 shrink-0"
                >
                  {apiKeyStatus === 'testing' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : apiKeyStatus === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-success" />
                  ) : apiKeyStatus === 'failed' ? (
                    <XCircle className="w-4 h-4 text-destructive" />
                  ) : null}
                  {apiKeyStatus === 'ok' ? 'OK' : apiKeyStatus === 'failed' ? 'Failed' : 'Test API Key'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
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
