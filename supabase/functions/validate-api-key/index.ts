import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, provider } = await req.json();

    if (!apiKey || typeof apiKey !== 'string') {
      console.log('Validation failed: Missing or invalid API key');
      return new Response(JSON.stringify({ valid: false, error: 'API key is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Validating API key for provider: ${provider}`);

    let isValid = false;
    let errorMessage = '';

    switch (provider) {
      case 'openai': {
        // Make a lightweight authenticated request to OpenAI API
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        isValid = response.status === 200;
        if (!isValid) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          console.log(`OpenAI API key validation failed: ${errorMessage}`);
        } else {
          console.log('OpenAI API key validation successful');
        }
        break;
      }

      case 'gemini': {
        // Validate Google Gemini API key by listing models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
          method: 'GET',
        });

        isValid = response.status === 200;
        if (!isValid) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          console.log(`Gemini API key validation failed: ${errorMessage}`);
        } else {
          console.log('Gemini API key validation successful');
        }
        break;
      }

      case 'deepseek': {
        // Validate DeepSeek API key
        const response = await fetch('https://api.deepseek.com/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        isValid = response.status === 200;
        if (!isValid) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          console.log(`DeepSeek API key validation failed: ${errorMessage}`);
        } else {
          console.log('DeepSeek API key validation successful');
        }
        break;
      }

      case 'qwen': {
        // Validate Qwen/Alibaba Cloud API key via DashScope
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });

        isValid = response.status === 200;
        if (!isValid) {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.error?.message || `HTTP ${response.status}`;
          console.log(`Qwen API key validation failed: ${errorMessage}`);
        } else {
          console.log('Qwen API key validation successful');
        }
        break;
      }

      default:
        console.log(`Unknown provider: ${provider}`);
        return new Response(JSON.stringify({ valid: false, error: 'Unknown provider' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify({ valid: isValid, error: isValid ? null : errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in validate-api-key function:', errorMessage);
    return new Response(JSON.stringify({ valid: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
