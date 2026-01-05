import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  wordpressUrl: string;
  username: string;
  password: string;
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
    const { wordpressUrl, username, password, title, content, status = 'draft' } = await req.json() as PublishRequest;

    if (!wordpressUrl || !username || !password) {
      return new Response(
        JSON.stringify({ error: 'WordPress credentials are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!title || !content) {
      return new Response(
        JSON.stringify({ error: 'Title and content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
