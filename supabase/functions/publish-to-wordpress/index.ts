import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  projectId: string;
  wordpressUrl: string;
  username: string;
  title: string;
  content: string;
  status?: 'draft' | 'publish';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, wordpressUrl, username, title, content, status = 'draft' } = await req.json() as PublishRequest;

    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Project ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!wordpressUrl || !username) {
      return new Response(
        JSON.stringify({ error: 'WordPress URL and username are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Supabase client with service role to access decryption function
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get decrypted WordPress password from database
    const { data: passwordData, error: passwordError } = await supabase.rpc('get_wordpress_password', {
      p_project_id: projectId
    });

    if (passwordError) {
      console.error('Error fetching WordPress password:', passwordError);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve WordPress credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!passwordData) {
      return new Response(
        JSON.stringify({ error: 'WordPress password not configured for this project' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const password = passwordData;

    // Normalize WordPress URL
    let apiUrl = wordpressUrl.replace(/\/$/, '');
    if (!apiUrl.includes('/wp-json/wp/v2')) {
      apiUrl = `${apiUrl}/wp-json/wp/v2`;
    }

    // Create Basic Auth header
    const authHeader = btoa(`${username}:${password}`);

    // Create post via WordPress REST API
    const response = await fetch(`${apiUrl}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        content,
        status,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WordPress API error:', errorText);
      
      let errorMessage = 'Failed to publish to WordPress';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
      } catch {
        errorMessage = `WordPress API error: ${response.status}`;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const postData = await response.json();

    return new Response(
      JSON.stringify({
        success: true,
        postId: postData.id,
        postUrl: postData.link,
        editUrl: `${wordpressUrl.replace(/\/$/, '')}/wp-admin/post.php?post=${postData.id}&action=edit`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error publishing to WordPress:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
