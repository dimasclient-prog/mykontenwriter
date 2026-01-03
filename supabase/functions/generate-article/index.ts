import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArticleRequest {
  apiKey: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'qwen';
  model: string;
  articleTitle: string;
  projectData: {
    language: string;
    brandVoice: string;
    targetWordCount: number;
    persona?: string;
    painPoints?: string[];
    product?: string;
    targetMarket?: string;
    valueProposition?: string;
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
    body.max_completion_tokens = 8000;
  } else {
    body.max_tokens = 8000;
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
          maxOutputTokens: 8000,
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
      max_tokens: 8000,
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
      max_tokens: 8000,
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
    const { apiKey, provider, model, articleTitle, projectData } = await req.json() as ArticleRequest;

    console.log(`Generating article "${articleTitle}" using ${provider}/${model}`);

    const languageInstruction = projectData.language;

    // Increase target word count by 20%
    const adjustedWordCount = Math.round(projectData.targetWordCount * 1.2);

    // Build business context for soft CTA
    const businessDetails = {
      product: projectData.product || '',
      targetMarket: projectData.targetMarket || '',
      persona: projectData.persona || '',
      valueProposition: projectData.valueProposition || '',
    };

    const hasBusinessDetails = businessDetails.product || businessDetails.valueProposition;

    const softCtaInstruction = hasBusinessDetails 
      ? `\nSOFT CTA SECTION (MANDATORY):
- At the end of the article, before or after FAQ, include a soft call-to-action section
- Use <h2> for the CTA heading
- The CTA should be helpful and non-pushy, relating to the reader's needs
- Reference the product/service naturally: "${businessDetails.product}"
- Highlight the value proposition: "${businessDetails.valueProposition}"
- Target audience context: "${businessDetails.targetMarket || businessDetails.persona}"
- Example tone: "If you're looking for [solution to pain point], [product] might be worth exploring..."
- Keep it educational and helpful, not salesy`
      : '';

    const systemPrompt = `You are an expert SEO content writer specializing in TOFU (Top of Funnel) educational content.
Your task is to write a comprehensive, SEO-optimized article.

CRITICAL: ALL OUTPUT MUST BE IN ${languageInstruction.toUpperCase()} LANGUAGE. DO NOT MIX LANGUAGES.

BRAND VOICE: ${projectData.brandVoice}

OUTPUT FORMAT (MANDATORY):
- Output MUST be valid HTML only
- DO NOT include <html>, <head>, or <body> tags
- Allowed tags ONLY: <h1>, <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>

STRUCTURE RULES (STRICT):
- Exactly 1 <h1> (the article title)
- Minimum 3 <h2> sections for comprehensive coverage
- Minimum 2 <h3> subsections
- FAQ section is MANDATORY:
  - FAQ title uses <h2>
  - Each question uses <h3>
  - Each answer uses <p>
  - Include at least 4-5 FAQ items
${softCtaInstruction}

CONTENT RULES:
- Article type: TOFU (educational, informative)
- Focus on user pain points and solutions
- Educational and non-salesy tone
- Soft promotion only - NO hard CTA except in designated soft CTA section
- Natural keyword usage
- Search-intent optimized headings
- Concise FAQ answers suitable for featured snippets
- Write in-depth paragraphs with detailed explanations
- Include practical examples and actionable tips

TARGET LENGTH: ${adjustedWordCount} words (±10% tolerance) - Write comprehensively to meet this target`;

    const painPointsText = projectData.painPoints?.length 
      ? `\nUser Pain Points to Address:\n${projectData.painPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`
      : '';

    const userPrompt = `Write a comprehensive, in-depth article with this title: "${articleTitle}"

Context:
- Target Persona: ${projectData.persona || 'General audience'}
- Target Market: ${projectData.targetMarket || 'Not specified'}
- Product/Service: ${projectData.product || 'Not specified'}
- Value Proposition: ${projectData.valueProposition || 'Not specified'}
${painPointsText}

IMPORTANT: 
- Write at least ${adjustedWordCount} words
- Include detailed explanations and practical examples
- Cover the topic thoroughly with multiple subsections
- Output valid HTML only with the structure specified
- Write entirely in ${languageInstruction}
${hasBusinessDetails ? '- Include a soft, helpful CTA section that naturally mentions the product/service' : ''}`;

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

    console.log('Article generated successfully');

    // Clean the result - remove markdown code blocks if present
    let cleanedContent = result
      .replace(/```html\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();

    // Count words (rough estimate)
    const wordCount = cleanedContent.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;

    return new Response(JSON.stringify({ content: cleanedContent, wordCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error generating article:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
