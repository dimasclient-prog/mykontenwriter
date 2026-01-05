import { useState } from 'react';
import { Globe, Check, X, Loader2, Unplug, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed';

interface WordPressConnectorProps {
  wordpressUrl: string;
  wordpressUsername: string;
  wordpressPassword: string;
  onUrlChange: (url: string) => void;
  onUsernameChange: (username: string) => void;
  onPasswordChange: (password: string) => void;
}

export function WordPressConnector({
  wordpressUrl,
  wordpressUsername,
  wordpressPassword,
  onUrlChange,
  onUsernameChange,
  onPasswordChange,
}: WordPressConnectorProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');

  const handleTestConnection = async () => {
    if (!wordpressUrl || !wordpressUsername || !wordpressPassword) {
      toast.error('Please fill in all WordPress credentials');
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError('');

    try {
      const { data, error } = await supabase.functions.invoke('publish-to-wordpress', {
        body: {
          wordpressUrl,
          username: wordpressUsername,
          password: wordpressPassword,
          // Use a test call - we'll create a test that just validates credentials
          title: '__connection_test__',
          content: '__test__',
          status: 'draft',
        },
      });

      if (error) {
        console.error('WordPress connection error:', error);
        setConnectionStatus('failed');
        setConnectionError(error.message || 'Connection failed');
        toast.error('WordPress connection failed');
        return;
      }

      if (data?.success) {
        // Delete the test post
        setConnectionStatus('connected');
        toast.success('WordPress connected successfully!');
      } else if (data?.error) {
        setConnectionStatus('failed');
        setConnectionError(data.error);
        toast.error(`WordPress connection failed: ${data.error}`);
      }
    } catch (err: any) {
      console.error('WordPress connection error:', err);
      setConnectionStatus('failed');
      setConnectionError(err.message || 'Connection failed');
      toast.error('Failed to connect to WordPress');
    }
  };

  const handleDisconnect = () => {
    setConnectionStatus('disconnected');
    setConnectionError('');
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <Check className="w-3 h-3" />
            Connected
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <X className="w-3 h-3" />
            Failed
          </Badge>
        );
      case 'connecting':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Connecting...
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Unplug className="w-3 h-3" />
            Not Connected
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            <CardTitle>WordPress Integration</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Configure WordPress REST API credentials to publish articles as drafts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="wordpressUrl">WordPress Site URL</Label>
          <Input
            id="wordpressUrl"
            value={wordpressUrl}
            onChange={(e) => {
              onUrlChange(e.target.value);
              if (connectionStatus !== 'disconnected') setConnectionStatus('disconnected');
            }}
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
              value={wordpressUsername}
              onChange={(e) => {
                onUsernameChange(e.target.value);
                if (connectionStatus !== 'disconnected') setConnectionStatus('disconnected');
              }}
              placeholder="WordPress username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wordpressPassword">Application Password</Label>
            <Input
              id="wordpressPassword"
              type="password"
              value={wordpressPassword}
              onChange={(e) => {
                onPasswordChange(e.target.value);
                if (connectionStatus !== 'disconnected') setConnectionStatus('disconnected');
              }}
              placeholder="WordPress application password"
            />
            <p className="text-xs text-muted-foreground">
              Generate an application password in WordPress: Users → Profile → Application Passwords
            </p>
          </div>
        </div>

        {connectionError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
            <p className="text-sm text-destructive">{connectionError}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={handleTestConnection}
            disabled={connectionStatus === 'connecting' || !wordpressUrl || !wordpressUsername || !wordpressPassword}
            className="gap-2"
          >
            {connectionStatus === 'connecting' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plug className="w-4 h-4" />
            )}
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Test Connection'}
          </Button>
          {connectionStatus === 'connected' && (
            <Button variant="outline" onClick={handleDisconnect} className="gap-2">
              <Unplug className="w-4 h-4" />
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
