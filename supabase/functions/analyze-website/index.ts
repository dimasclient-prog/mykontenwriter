import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Provider Functions
async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'gpt-4.1': 'gpt-4.1-2025-04-14',
    'gpt-4.1-mini': 'gpt-4.1-mini-2025-04-14',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
  };
  const actualModel = modelMap[model] || 'gpt-4o-mini';

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
      temperature: 0.7,
      max_tokens: 2500,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const modelMap: Record<string, string> = {
    'gemini-3-pro': 'gemini-2.5-pro',
    'gemini-3-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.0-flash': 'gemini-2.0-flash',
  };
  const actualModel = modelMap[model] || 'gemini-2.0-flash';

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2500 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function callDeepSeek(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callQwen(apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
      max_tokens: 2500,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Qwen API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get user credentials from master settings
    const authHeader = req.headers.get('Authorization');
    const { apiKey, provider, model } = await getUserCredentials(authHeader);

    const { websiteUrl, language } = await req.json();

    if (!websiteUrl) {
      throw new Error('Website URL is required');
    }

    console.log(`Analyzing website: ${websiteUrl} using ${provider}/${model}`);

    // Fetch website content
    const response = await fetch(websiteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website: ${response.status}`);
    }

    const html = await response.text();

    // Extract meta information
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                          html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
    const metaKeywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);

    const title = titleMatch?.[1] || ogTitleMatch?.[1] || '';
    const description = metaDescMatch?.[1] || ogDescMatch?.[1] || '';
    const metaKeywords = metaKeywordsMatch?.[1] || '';

    // Extract text content
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 3000);

    console.log('Extracted:', { title, descLength: description.length, contentLength: textContent.length });

    // Build AI prompts
    const systemPrompt = `You are a business analyst expert. Analyze websites and extract business information. Always respond with valid JSON only, no markdown formatting.`;

    const userPrompt = `Analyze this website and provide structured data in JSON format.

Website URL: ${websiteUrl}
Website Title: ${title}
Meta Description: ${description}
Meta Keywords: ${metaKeywords}
Content Preview: ${textContent}

Please provide (respond in ${language || 'english'}):
1. businessName: Extract or infer the business/brand name
2. product: What product or service they offer (1-2 sentences)
3. targetMarket: Who is their target audience (1-2 sentences)
4. keywords: Generate 10 relevant SEO keywords based on the content (array of strings)
5. personas: Create 3 customer personas, each with:
   - name: persona name (e.g., "Budget-Conscious Parent")
   - description: brief description of this persona
   - painPoints: array of 3-4 pain points
   - goals: array of 3-4 goals
6. brandVoice: Analyze and describe the brand voice/tone in 2-3 sentences

Respond ONLY with valid JSON object, no markdown code blocks.`;

    // Call AI based on provider from master settings
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

    // Clean and parse response
    const jsonText = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', jsonText);
      throw new Error('Failed to parse AI analysis');
    }

    console.log('Analysis complete:', Object.keys(analysis));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          businessName: analysis.businessName || '',
          product: analysis.product || '',
          targetMarket: analysis.targetMarket || '',
          keywords: analysis.keywords || [],
          personas: analysis.personas || [],
          brandVoice: analysis.brandVoice || '',
          websiteTitle: title,
          websiteDescription: description,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-website:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
