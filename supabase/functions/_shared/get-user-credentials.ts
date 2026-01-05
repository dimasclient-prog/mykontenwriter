import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

interface UserCredentials {
  apiKey: string;
  provider: string;
  model: string;
}

export async function getUserCredentials(authHeader: string | null): Promise<UserCredentials> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  if (!authHeader) {
    throw new Error('Missing authorization header');
  }

  // Create client with user's auth to get their user_id
  const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Not authenticated');
  }

  // Create service role client to access the decryption function
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Get decrypted API key using the database function
  const { data, error } = await supabaseAdmin.rpc('get_user_api_key', {
    p_user_id: user.id
  });

  if (error) {
    console.error('Error fetching user credentials:', error);
    throw new Error('Failed to fetch API credentials');
  }

  if (!data || data.length === 0) {
    throw new Error('No API key configured. Please set up your API key in Master Settings.');
  }

  const credentials = data[0];
  
  if (!credentials.api_key) {
    throw new Error('No API key configured. Please set up your API key in Master Settings.');
  }

  return {
    apiKey: credentials.api_key,
    provider: credentials.ai_provider,
    model: credentials.default_model,
  };
}
