import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StrategyRequest {
  apiKey: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'qwen';
  model: string;
  projectData: {
    mode: 'auto' | 'manual';
    language: string;
    websiteUrl?: string;
    product?: string;
    targetMarket?: string;
    persona?: string;
    valueProposition?: string;
  };
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  // Map model names to actual OpenAI model IDs
  const modelMap: Record<string, string> = {
    'gpt-4.1': 'gpt-4.1-2025-04-14',
    'gpt-4.1-mini': 'gpt-4.1-mini-2025-04-14',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o4': 'o4-mini-2025-04-16',
    'o3': 'o3-2025-04-16',
    'o3-mini': 'o3-mini',
  };

  const actualModel = modelMap[model] || 'gpt-4o-mini';
  const isNewModel = ['gpt-4.1', 'gpt-4.1-mini', 'o4', 'o3', 'o3-mini'].includes(model);

  const body: Record<string, unknown> = {
    model: actualModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

  // Use max_completion_tokens for newer models, max_tokens for legacy
  if (isNewModel) {
    body.max_completion_tokens = 4000;
  } else {
    body.max_tokens = 4000;
    body.temperature = 0.7;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    'gemini-3-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-3-flash': 'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash': 'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash-preview-05-20',
    'gemini-2.5-pro': 'gemini-2.5-pro-preview-06-05',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash',
  };

  const actualModel = modelMap[model] || 'gemini-2.0-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callDeepSeek(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    'deepseek-v2': 'deepseek-chat',
    'deepseek-v2.5': 'deepseek-chat',
    'deepseek-r1': 'deepseek-reasoner',
  };

  const actualModel = modelMap[model] || 'deepseek-chat';

  const response = await fetch('https://api.deepseek.com/chat/completions', {
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
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callQwen(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    'qwen2.5-72b-instruct': 'qwen2.5-72b-instruct',
    'qwen2.5-32b-instruct': 'qwen2.5-32b-instruct',
    'qwen2.5-14b-instruct': 'qwen2.5-14b-instruct',
  };

  const actualModel = modelMap[model] || 'qwen2.5-72b-instruct';

  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Qwen API error:', errorText);
    throw new Error(`Qwen API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, provider, model, projectData } = await req.json() as StrategyRequest;

    console.log(`Generating strategy pack using ${provider}/${model}`);

    const languageInstruction = projectData.language === 'other' 
      ? projectData.language 
      : projectData.language.charAt(0).toUpperCase() + projectData.language.slice(1);

    const systemPrompt = `You are an expert SEO strategist and content marketing specialist. 
Your task is to generate a comprehensive SEO Strategy Pack based on business information.
ALL OUTPUT MUST BE IN ${languageInstruction.toUpperCase()} LANGUAGE. DO NOT MIX LANGUAGES.

You must respond with a valid JSON object containing:
{
  "personaSummary": "A detailed summary of the target persona (2-3 sentences)",
  "corePainPoints": ["pain point 1", "pain point 2", "pain point 3", "pain point 4", "pain point 5"],
  "tofuSearchIntent": "Description of top-of-funnel search intent for this audience",
  "topicClusters": ["cluster 1", "cluster 2", "cluster 3", "cluster 4", "cluster 5"],
  "articleTitles": ["SEO-friendly article title 1", "title 2", "title 3", "title 4", "title 5", "title 6", "title 7", "title 8", "title 9", "title 10"]
}

Requirements:
- Generate exactly 3-5 core pain points
- Generate exactly 5 topic clusters
- Generate exactly 10 SEO-friendly article titles
- All content must be educational and TOFU (Top of Funnel) focused
- Titles must be search-intent optimized`;

    let userPrompt: string;
    if (projectData.mode === 'auto') {
      userPrompt = `Analyze this website and generate a strategy pack:
Website URL: ${projectData.websiteUrl || 'Not provided'}

Based on what you can infer about this business from the URL, create a comprehensive SEO strategy.`;
    } else {
      userPrompt = `Generate a strategy pack for this business:
Product/Service: ${projectData.product || 'Not specified'}
Target Market: ${projectData.targetMarket || 'Not specified'}
Persona: ${projectData.persona || 'Not specified'}
Value Proposition: ${projectData.valueProposition || 'Not specified'}`;
    }

    let result: string;
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
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log('Strategy pack generated successfully');

    // Parse the JSON response
    let strategyPack;
    try {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategyPack = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse strategy pack:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify({ strategyPack }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating strategy:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
