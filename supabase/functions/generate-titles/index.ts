import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TitlesRequest {
  count: number;
  existingTitles: string[];
  projectData: {
    language: string;
    keywords?: string[];
    topicClusters?: string[];
    referenceText?: string;
    personaSummary?: string;
    corePainPoints?: string[];
    product?: string;
    targetMarket?: string;
  };
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
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

  if (isNewModel) {
    body.max_completion_tokens = 2000;
  } else {
    body.max_tokens = 2000;
    body.temperature = 0.8;
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
          temperature: 0.8,
          maxOutputTokens: 2000,
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
      max_tokens: 2000,
      temperature: 0.8,
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
      max_tokens: 2000,
      temperature: 0.8,
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
    // Get user credentials from database (encrypted API key)
    const authHeader = req.headers.get('Authorization');
    const { apiKey, provider, model } = await getUserCredentials(authHeader);

    const { count, existingTitles, projectData } = await req.json() as TitlesRequest;

    console.log(`Generating ${count} article titles using ${provider}/${model}`);

    const languageInstruction = projectData.language.charAt(0).toUpperCase() + projectData.language.slice(1);

    // Build context from various sources
    let contextInfo = '';
    
    if (projectData.keywords && projectData.keywords.length > 0) {
      contextInfo += `\nPRIMARY KEYWORDS (MUST be used as main topics):\n${projectData.keywords.map((k, i) => `${i + 1}. ${k}`).join('\n')}\n`;
    }

    if (projectData.topicClusters && projectData.topicClusters.length > 0) {
      contextInfo += `\nTOPIC CLUSTERS:\n${projectData.topicClusters.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n`;
    }

    if (projectData.personaSummary) {
      contextInfo += `\nTARGET PERSONA:\n${projectData.personaSummary}\n`;
    }

    if (projectData.corePainPoints && projectData.corePainPoints.length > 0) {
      contextInfo += `\nCORE PAIN POINTS:\n${projectData.corePainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`;
    }

    if (projectData.product) {
      contextInfo += `\nPRODUCT/SERVICE: ${projectData.product}\n`;
    }

    if (projectData.targetMarket) {
      contextInfo += `\nTARGET MARKET: ${projectData.targetMarket}\n`;
    }

    if (projectData.referenceText) {
      const truncatedRef = projectData.referenceText.substring(0, 2000);
      contextInfo += `\nREFERENCE CONTEXT:\n${truncatedRef}${projectData.referenceText.length > 2000 ? '...' : ''}\n`;
    }

    // Build existing titles exclusion
    const existingTitlesInfo = existingTitles.length > 0
      ? `\n\nEXISTING TITLES (DO NOT create similar or duplicate titles):\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
      : '';

    const systemPrompt = `You are an expert SEO content strategist. Your task is to generate unique, SEO-optimized article titles.

ALL OUTPUT MUST BE IN ${languageInstruction.toUpperCase()} LANGUAGE.

You must respond with a valid JSON object containing:
{
  "titles": ["title 1", "title 2", "title 3", ...]
}

Requirements:
- Generate exactly ${count} unique article titles
- Titles must be SEO-friendly and search-intent optimized
- Titles must be TOFU (Top of Funnel) focused - educational and informative
- Each title must be different from existing titles (not similar in meaning or phrasing)
- Use the provided keywords, topics, and reference context as inspiration
- Titles should be engaging and click-worthy while remaining informative
- Avoid clickbait - focus on delivering value`;

    const userPrompt = `Generate ${count} unique SEO article titles based on this context:
${contextInfo}
${existingTitlesInfo}

Remember: All titles must be in ${languageInstruction} language and must NOT be similar to any existing titles.`;

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

    console.log('Article titles generated successfully');

    // Parse the JSON response
    let parsedResult;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse titles:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    return new Response(JSON.stringify({ titles: parsedResult.titles }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating titles:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
