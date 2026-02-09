import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callAI(provider: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string): Promise<string> {
  let url: string;
  let headers: Record<string, string>;
  let body: unknown;

  switch (provider) {
    case 'openai': {
      const modelMap: Record<string, string> = {
        'gpt-5.2': 'gpt-4.1-2025-04-14',
        'gpt-5': 'gpt-4.1-2025-04-14',
        'gpt-5-mini': 'gpt-4.1-mini-2025-04-14',
        'gpt-4.1': 'gpt-4.1-2025-04-14',
        'gpt-4.1-mini': 'gpt-4.1-mini-2025-04-14',
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
      };
      url = 'https://api.openai.com/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = {
        model: modelMap[model] || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 6000,
      };
      break;
    }
    case 'gemini': {
      const modelMap: Record<string, string> = {
        'gemini-3-pro': 'gemini-2.5-pro',
        'gemini-3-flash': 'gemini-2.5-flash',
        'gemini-2.5-flash': 'gemini-2.5-flash',
        'gemini-2.5-pro': 'gemini-2.5-pro',
        'gemini-2.0-flash': 'gemini-2.0-flash',
      };
      const actualModel = modelMap[model] || 'gemini-2.0-flash';
      url = `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature: 0.6, maxOutputTokens: 6000 },
      };
      break;
    }
    case 'deepseek': {
      url = 'https://api.deepseek.com/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 6000,
        temperature: 0.6,
      };
      break;
    }
    case 'qwen': {
      url = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
      headers = { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
      body = {
        model: model || 'qwen2.5-72b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 6000,
        temperature: 0.6,
      };
      break;
    }
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider} API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  if (provider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
  return data.choices?.[0]?.message?.content || '';
}

async function scrapeWithFirecrawl(websiteUrl: string): Promise<string> {
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!firecrawlKey) {
    // Fallback: simple fetch
    console.log('No Firecrawl key, using simple fetch');
    const response = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok) throw new Error(`Failed to fetch website: ${response.status}`);
    const html = await response.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);
  }

  console.log('Scraping with Firecrawl:', websiteUrl);
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firecrawlKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: websiteUrl,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    console.error('Firecrawl error, falling back to simple fetch');
    const fallbackResponse = await fetch(websiteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!fallbackResponse.ok) throw new Error(`Failed to fetch website: ${fallbackResponse.status}`);
    const html = await fallbackResponse.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 8000);
  }

  const data = await response.json();
  const markdown = data.data?.markdown || data.markdown || '';
  return markdown.substring(0, 8000);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const { apiKey, provider, model } = await getUserCredentials(authHeader);

    const { projectId, websiteUrl, language } = await req.json();

    if (!websiteUrl) {
      throw new Error('Website URL is required');
    }

    console.log(`Analyzing topical coverage for: ${websiteUrl}`);

    // Scrape website content
    const content = await scrapeWithFirecrawl(websiteUrl);
    console.log(`Scraped content length: ${content.length}`);

    const systemPrompt = `You are a Holistic SEO strategist inspired by Koray Tuğberk GÜBÜR. You analyze websites and produce strategic topical recommendations focused on semantic completeness and topical authority.

Your tone is: calm, precise, advisory. Use "recommended", "suggested", "can be adjusted". Avoid hype, guarantees, or absolutist language.

Always respond with valid JSON only, no markdown formatting, no code blocks.`;

    const userPrompt = `Analyze this website content and provide a comprehensive topical coverage analysis.

Website URL: ${websiteUrl}
Content:
${content}

Language for output: ${language || 'english'}

Provide the analysis as a JSON object with these exact fields:

{
  "coreTopic": {
    "topic": "The single core topic this website should be recognized for",
    "description": "2-3 sentence factual description of why this is the core topic, based on content signals",
    "confidence": "high/medium/low",
    "entities": ["array of 5-8 dominant entities/concepts found in the content"]
  },
  "topicalExpansion": [
    {
      "category": "foundational",
      "label": "Foundational Topics",
      "description": "Mandatory topics for building topical authority in this domain",
      "topics": [
        {
          "topic": "Topic name",
          "semanticRole": "How this topic relates semantically to the core (e.g., 'definitional foundation', 'core process', 'prerequisite knowledge')",
          "intentType": "informational/navigational/transactional/commercial",
          "relationship": "Brief description of relationship to core topic",
          "priority": "high/medium/low"
        }
      ]
    },
    {
      "category": "supporting",
      "label": "Supporting Topics",
      "description": "Topics that provide context and reincement to the core authority",
      "topics": [...]
    },
    {
      "category": "comparative",
      "label": "Comparative & Decision Topics",
      "description": "Topics that help users make informed decisions in this domain",
      "topics": [...]
    },
    {
      "category": "advanced",
      "label": "Advanced & Expert Topics",
      "description": "Deep expertise topics that demonstrate mastery",
      "topics": [...]
    }
  ],
  "semanticNetwork": [
    {
      "id": "unique-id-1",
      "topic": "Topic name",
      "parentId": null,
      "relatedIds": ["id-2", "id-3"],
      "relationshipType": "core/child/sibling/lateral",
      "layer": 0
    }
  ],
  "urlStructure": [
    {
      "suggestedUrl": "/parent/child-topic/",
      "topic": "Topic this URL covers",
      "intentStage": "awareness/consideration/decision/retention",
      "notes": "Brief rationale for this URL path"
    }
  ],
  "coverageGaps": [
    {
      "area": "Missing area name",
      "description": "Why covering this area may improve contextual authority",
      "suggestedOrder": 1,
      "type": "missing/weak/opportunity"
    }
  ]
}

Rules:
- Generate 5-8 topics per expansion category
- Generate 15-25 nodes for the semantic network
- Generate 15-25 URL structure suggestions
- Generate 5-10 coverage gaps
- Think in meaning and relationships, not keywords
- All topics should have clear semantic roles
- URL structure should be scalable and follow parent-child logic
- Frame everything as recommendations, never as requirements`;

    const result = await callAI(provider, apiKey, model, systemPrompt, userPrompt);

    // Parse JSON response
    const jsonText = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let analysis;
    try {
      analysis = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', jsonText.substring(0, 500));
      throw new Error('Failed to parse AI analysis response');
    }

    // Save to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader! } }
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();

    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedData, error: saveError } = await supabaseAdmin
      .from('topical_coverage')
      .insert({
        project_id: projectId,
        user_id: user.id,
        core_topic: analysis.coreTopic || {},
        topical_expansion: analysis.topicalExpansion || [],
        semantic_network: analysis.semanticNetwork || [],
        url_structure: analysis.urlStructure || [],
        coverage_gaps: analysis.coverageGaps || [],
        website_url: websiteUrl,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      // Still return the analysis even if save fails
    }

    console.log('Topical coverage analysis complete');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedData?.id || crypto.randomUUID(),
          coreTopic: analysis.coreTopic,
          topicalExpansion: analysis.topicalExpansion,
          semanticNetwork: analysis.semanticNetwork,
          urlStructure: analysis.urlStructure,
          coverageGaps: analysis.coverageGaps,
          websiteUrl,
          createdAt: savedData?.created_at || new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-topical-coverage:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
