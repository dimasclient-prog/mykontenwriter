import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create client with user's auth to get their user_id
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    // Create service role client to access encrypted keys
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch master settings with all API keys including legacy
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('master_settings')
      .select('openai_api_key, gemini_api_key, deepseek_api_key, qwen_api_key, api_key, ai_provider')
      .eq('user_id', user.id)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw new Error('Failed to fetch API keys');
    }

    if (!settings) {
      return new Response(JSON.stringify({
        openai: '',
        gemini: '',
        deepseek: '',
        qwen: '',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if we have provider-specific keys or need to fall back to legacy
    const hasProviderKeys = settings.openai_api_key || settings.gemini_api_key || 
                           settings.deepseek_api_key || settings.qwen_api_key;
    
    // If no provider-specific keys exist but legacy api_key exists, use it for current provider
    const legacyKey = settings.api_key;
    const currentProvider = settings.ai_provider as string;

    // Decrypt each API key using the database function
    const decryptKey = async (encryptedKey: string | null): Promise<string> => {
      if (!encryptedKey) return '';
      
      const { data, error } = await supabaseAdmin.rpc('decrypt_api_key', {
        encrypted_key: encryptedKey
      });
      
      if (error) {
        console.error('Error decrypting key:', error);
        return '';
      }
      
      return data || '';
    };

    // Decrypt provider-specific keys
    const [openaiKey, geminiKey, deepseekKey, qwenKey] = await Promise.all([
      decryptKey(settings.openai_api_key),
      decryptKey(settings.gemini_api_key),
      decryptKey(settings.deepseek_api_key),
      decryptKey(settings.qwen_api_key),
    ]);

    // Decrypt legacy key if it exists
    const decryptedLegacyKey = legacyKey ? await decryptKey(legacyKey) : '';

    // Build response - use provider-specific keys if available, otherwise fall back to legacy
    const response = {
      openai: openaiKey || (currentProvider === 'openai' ? decryptedLegacyKey : ''),
      gemini: geminiKey || (currentProvider === 'gemini' ? decryptedLegacyKey : ''),
      deepseek: deepseekKey || (currentProvider === 'deepseek' ? decryptedLegacyKey : ''),
      qwen: qwenKey || (currentProvider === 'qwen' ? decryptedLegacyKey : ''),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-api-keys:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});