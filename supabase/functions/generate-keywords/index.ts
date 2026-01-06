import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface KeywordRequest {
  seedKeyword: string;
  language: string;
}

interface GeneratedKeyword {
  keyword: string;
  type: 'short-tail' | 'long-tail' | 'lsi' | 'transactional';
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'gpt-5.2': 'gpt-4.1',
    'gpt-5': 'gpt-4.1',
    'gpt-5-mini': 'gpt-4.1-mini',
    'gpt-5-nano': 'gpt-4.1-mini',
    'gpt-4.1': 'gpt-4.1',
    'gpt-4.1-mini': 'gpt-4.1-mini',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o4': 'o4-mini',
    'o3': 'o3-mini',
    'o3-mini': 'o3-mini',
  };
  const actualModel = modelMap[model] || 'gpt-4.1-mini';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'gemini-3-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-3-flash': 'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-lite-preview-06-17',
    'gemini-2.5-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
  };
  const actualModel = modelMap[model] || 'gemini-2.5-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 4000 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callDeepSeek(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'deepseek-v2': 'deepseek-chat',
    'deepseek-v2.5': 'deepseek-chat',
    'deepseek-r1': 'deepseek-reasoner',
  };
  const actualModel = modelMap[model] || 'deepseek-chat';

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: actualModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

async function callQwen(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'qwen2.5-72b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Qwen API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const credentials = await getUserCredentials(authHeader);
    
    if (!credentials || !credentials.apiKey) {
      return new Response(
        JSON.stringify({ error: 'No API key configured. Please set up your API key in Master Settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { seedKeyword, language } = await req.json() as KeywordRequest;

    if (!seedKeyword) {
      return new Response(
        JSON.stringify({ error: 'Seed keyword is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an SEO keyword research expert. Generate 100 keyword ideas from a seed keyword/topic.

IMPORTANT RULES:
1. Generate exactly 100 keywords total, divided into 4 types:
   - 25 short-tail keywords (1-2 words, high search volume, broad intent)
   - 25 long-tail keywords (3+ words, specific, lower competition)
   - 25 LSI keywords (Latent Semantic Indexing - related/synonymous terms)
   - 25 transactional keywords (buyer intent - includes words like buy, price, review, best, cheap, etc.)

2. All keywords MUST be in ${language} language
3. Keywords should be relevant to the seed topic
4. Make keywords natural and commonly searched
5. Avoid duplicate or very similar keywords

Return ONLY a valid JSON array with this exact format:
[
  {"keyword": "example keyword", "type": "short-tail"},
  {"keyword": "another keyword example", "type": "long-tail"},
  ...
]

No explanation, no markdown, ONLY the JSON array.`;

    const userPrompt = `Generate 100 SEO keyword ideas from this seed keyword/topic: "${seedKeyword}"

Language: ${language}

Remember: 25 short-tail, 25 long-tail, 25 LSI, 25 transactional keywords.`;

    let result = '';
    const { provider, apiKey, model } = credentials;

    switch (provider) {
      case 'openai':
        result = await callOpenAI(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'gemini':
        result = await callGemini(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'deepseek':
        result = await callDeepSeek(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'qwen':
        result = await callQwen(apiKey, model, systemPrompt, userPrompt);
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported AI provider: ${provider}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Parse the result
    let keywords: GeneratedKeyword[] = [];
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse keywords:', parseError);
      console.error('Raw result:', result);
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and filter keywords
    keywords = keywords.filter(k => 
      k.keyword && 
      typeof k.keyword === 'string' && 
      ['short-tail', 'long-tail', 'lsi', 'transactional'].includes(k.type)
    );

    return new Response(
      JSON.stringify({ keywords }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Generate keywords error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate keywords';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
