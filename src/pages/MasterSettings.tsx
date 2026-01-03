import { useState } from 'react';
import { Save, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

export default function MasterSettings() {
  const { masterSettings, updateMasterSettings } = useAppStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [localSettings, setLocalSettings] = useState(masterSettings);

  const handleSave = () => {
    updateMasterSettings(localSettings);
    toast.success('Master settings saved successfully');
  };

  const handleChange = <K extends keyof typeof localSettings>(
    key: K,
    value: typeof localSettings[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

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
                  onValueChange={(value) => handleChange('aiProvider', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
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
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
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
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Temperature</Label>
                  <span className="text-sm text-muted-foreground">{localSettings.defaultTemperature}</span>
                </div>
                <Slider
                  value={[localSettings.defaultTemperature]}
                  onValueChange={([value]) => handleChange('defaultTemperature', value)}
                  min={0}
                  max={2}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground">
                  Controls randomness. Lower = more focused, higher = more creative
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Max Tokens</Label>
                  <span className="text-sm text-muted-foreground">{localSettings.defaultMaxTokens}</span>
                </div>
                <Slider
                  value={[localSettings.defaultMaxTokens]}
                  onValueChange={([value]) => handleChange('defaultMaxTokens', value)}
                  min={500}
                  max={8000}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of generated content
                </p>
              </div>
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
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="defaultArticleLength">Default Article Length (words)</Label>
                <Input
                  id="defaultArticleLength"
                  type="number"
                  value={localSettings.defaultArticleLength}
                  onChange={(e) => handleChange('defaultArticleLength', parseInt(e.target.value) || 500)}
                  min={200}
                  max={5000}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultLanguage">Default Language</Label>
                <Select
                  value={localSettings.defaultLanguage}
                  onValueChange={(value: 'indonesian' | 'english' | 'other') => 
                    handleChange('defaultLanguage', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indonesian">Indonesian</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
