import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { AIProvider, AI_PROVIDER_NAMES, AI_MODELS } from '@/types/project';

interface ProviderSwitchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentProvider: AIProvider;
  onSwitch: (provider: AIProvider) => Promise<void>;
}

interface ProviderStatus {
  provider: AIProvider;
  hasKey: boolean;
  name: string;
}

export function ProviderSwitchModal({
  open,
  onOpenChange,
  currentProvider,
  onSwitch,
}: ProviderSwitchModalProps) {
  const [availableProviders, setAvailableProviders] = useState<ProviderStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState<AIProvider | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableProviders();
    }
  }, [open]);

  const fetchAvailableProviders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-api-keys');
      
      if (error) {
        console.error('Error fetching API keys:', error);
        setAvailableProviders([]);
        return;
      }

      const providers: ProviderStatus[] = (Object.keys(AI_PROVIDER_NAMES) as AIProvider[])
        .filter((p) => p !== currentProvider)
        .map((provider) => ({
          provider,
          hasKey: !!(data?.[provider] && data[provider].trim()),
          name: AI_PROVIDER_NAMES[provider],
        }));

      setAvailableProviders(providers);
    } catch (err) {
      console.error('Error fetching providers:', err);
      setAvailableProviders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitch = async (provider: AIProvider) => {
    setIsSwitching(provider);
    try {
      await onSwitch(provider);
      onOpenChange(false);
    } catch (err) {
      console.error('Error switching provider:', err);
    } finally {
      setIsSwitching(null);
    }
  };

  const providersWithKeys = availableProviders.filter((p) => p.hasKey);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            API Limit Tercapai
          </DialogTitle>
          <DialogDescription>
            API key {AI_PROVIDER_NAMES[currentProvider]} sudah mencapai limit. Pilih provider lain untuk melanjutkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : providersWithKeys.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Provider tersedia:
              </p>
              {providersWithKeys.map(({ provider, name }) => (
                <Button
                  key={provider}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => handleSwitch(provider)}
                  disabled={isSwitching !== null}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {name}
                  </span>
                  {isSwitching === provider ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Tidak ada provider lain yang dikonfigurasi. Silakan tambahkan API key provider lain di{' '}
                <a href="/settings" className="text-primary underline">
                  Master Settings
                </a>
                .
              </AlertDescription>
            </Alert>
          )}

          {availableProviders.filter((p) => !p.hasKey).length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Provider belum dikonfigurasi:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableProviders
                  .filter((p) => !p.hasKey)
                  .map(({ provider, name }) => (
                    <span
                      key={provider}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="default" asChild>
            <a href="/settings">Buka Settings</a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
