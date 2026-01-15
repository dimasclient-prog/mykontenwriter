import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PersonaRequest {
  websiteUrl?: string;
  businessContext?: string;
  analysisMode: 'basic' | 'advanced';
  language: string;
  advancedData?: {
    product?: string;
    targetMarket?: string;
    valueProposition?: string;
  };
  generateMultiple?: boolean; // Flag to generate 3 personas
  product?: string;
  targetMarket?: string;
}

async function scrapeWebsite(url: string): Promise<string | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not configured, skipping website scrape');
    return null;
  }

  try {
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log('Scraping website with Firecrawl:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ['markdown'],
        onlyMainContent: false, // Get full page including contact info
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', errorText);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown;
    
    console.log('Website scraped successfully, content length:', markdown?.length || 0);
    return markdown || null;
  } catch (error) {
    console.error('Error scraping website:', error);
    return null;
  }
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
  const modelMap: Record<string, string> = {
    'gpt-5.2': 'gpt-5-2025-08-07',
    'gpt-5': 'gpt-5-2025-08-07',
    'gpt-5-mini': 'gpt-5-mini-2025-08-07',
    'gpt-5-nano': 'gpt-5-nano-2025-08-07',
    'gpt-4.1': 'gpt-4.1-2025-04-14',
    'gpt-4.1-mini': 'gpt-4.1-mini-2025-04-14',
    'gpt-4o': 'gpt-4o',
    'gpt-4o-mini': 'gpt-4o-mini',
    'o4': 'o4-mini-2025-04-16',
    'o3': 'o3-2025-04-16',
    'o3-mini': 'o3-mini',
  };

  const actualModel = modelMap[model] || 'gpt-4o-mini';
  const isNewModel = ['gpt-5.2', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'o4', 'o3', 'o3-mini'].includes(model);

  const body: Record<string, unknown> = {
    model: actualModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  };

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
    'gemini-3-pro': 'gemini-2.5-pro',
    'gemini-3-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite': 'gemini-2.0-flash-lite',
    'gemini-2.5-pro': 'gemini-2.5-pro',
    'gemini-2.0-flash': 'gemini-2.0-flash',
    'gemini-2.0-flash-lite': 'gemini-2.0-flash-lite',
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

async function callLovableAI(systemPrompt: string, userPrompt: string) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limits exceeded, please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required, please add credits.");
    }
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl, businessContext, analysisMode, language, advancedData, generateMultiple, product, targetMarket } = await req.json() as PersonaRequest;

    console.log(`Generating persona with mode: ${analysisMode}, language: ${language}, multiple: ${generateMultiple}`);

    const languageInstruction = language === 'other' 
      ? 'the specified language' 
      : language.charAt(0).toUpperCase() + language.slice(1);

    // Scrape website content if URL provided and in basic mode
    let websiteContent: string | null = null;
    if (websiteUrl && analysisMode === 'basic') {
      websiteContent = await scrapeWebsite(websiteUrl);
    }

    // Different prompt for generating multiple personas
    const systemPrompt = generateMultiple 
      ? `You are an expert market researcher and customer persona specialist.
Your task is to generate 3 DIFFERENT and DIVERSE customer personas.
ALL OUTPUT MUST BE IN ${languageInstruction.toUpperCase()} LANGUAGE.

You must respond with a valid JSON object containing:
{
  "personas": [
    {
      "name": "A realistic full name for persona 1",
      "role": "Job title or profession",
      "description": "Brief description of this persona type",
      "location": "City, Region or Country",
      "familyStatus": "e.g., Single, Married with 2 kids, etc.",
      "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
      "goals": ["goal 1", "goal 2", "goal 3"],
      "concerns": "A brief summary of their main concerns"
    },
    {
      "name": "A realistic full name for persona 2",
      "role": "Different job title or profession",
      "description": "Brief description of this persona type",
      "location": "Different location",
      "familyStatus": "Different family status",
      "painPoints": ["different pain point 1", "different pain point 2", "different pain point 3"],
      "goals": ["different goal 1", "different goal 2", "different goal 3"],
      "concerns": "Different concerns"
    },
    {
      "name": "A realistic full name for persona 3",
      "role": "Another different job title",
      "description": "Brief description of this persona type",
      "location": "Another location",
      "familyStatus": "Another family status",
      "painPoints": ["another pain point 1", "another pain point 2", "another pain point 3"],
      "goals": ["another goal 1", "another goal 2", "another goal 3"],
      "concerns": "Another set of concerns"
    }
  ]
}

CRITICAL REQUIREMENTS:
- Create 3 DISTINCT personas with DIFFERENT demographics, pain points, and goals
- Each persona should represent a different segment of the target market
- Make personas realistic and detailed
- Vary age groups, professions, and life situations`
      : `You are an expert market researcher and customer persona specialist.
Your task is to generate a detailed customer persona AND extract comprehensive business information.
ALL OUTPUT MUST BE IN ${languageInstruction.toUpperCase()} LANGUAGE.

You must respond with a valid JSON object containing:
{
  "persona": {
    "name": "A realistic full name for this persona",
    "role": "Job title or profession",
    "location": "City, Region or Country",
    "familyStatus": "e.g., Single, Married with 2 kids, etc.",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3", "pain point 4"],
    "concerns": "A brief summary of their main concerns and what they're looking for"
  },
  "businessInfo": {
    "businessName": "Extract the exact business/company name from the website",
    "businessAddress": "Extract the full physical address if available",
    "businessPhone": "Extract phone number(s) if available", 
    "businessEmail": "Extract email address(es) if available",
    "product": "Main products or services offered (be specific and comprehensive)",
    "targetMarket": "Who are the target customers",
    "valueProposition": "Core value proposition or unique selling points"
  }
}

CRITICAL REQUIREMENTS:
- For businessInfo, extract REAL information from the website content provided
- Look for contact pages, footer information, about pages for business details
- Phone numbers often appear in headers, footers, or contact sections
- Addresses may be in footer or contact page
- Email addresses may be in contact forms or listed explicitly
- If a field cannot be found in the website, use "Tidak ditemukan" or "Not found"
- DO NOT make up business contact information - only use what's actually on the website
- For product/service, list ALL main offerings you can identify`;

    let userPrompt: string;
    
    if (generateMultiple) {
      // Prompt for generating multiple personas
      const contextInfo: string[] = [];
      if (websiteUrl) contextInfo.push(`Website: ${websiteUrl}`);
      if (product || advancedData?.product) contextInfo.push(`Product/Service: ${product || advancedData?.product}`);
      if (targetMarket || advancedData?.targetMarket) contextInfo.push(`Target Market: ${targetMarket || advancedData?.targetMarket}`);
      if (businessContext) contextInfo.push(`Business Context: ${businessContext}`);
      
      userPrompt = `Generate 3 DIFFERENT customer personas for this business:

${contextInfo.join('\n')}

Create 3 distinct personas that represent different segments of potential customers:
1. One persona could be a primary/ideal customer
2. One could be a secondary customer segment  
3. One could be an emerging or aspirational customer segment

Make each persona unique with different demographics, pain points, and goals.`;
    } else if (websiteUrl && analysisMode === 'basic') {
      if (websiteContent) {
        userPrompt = `Analyze this website content and generate a customer persona WITH extracted business information:

Website URL: ${websiteUrl}

=== WEBSITE CONTENT START ===
${websiteContent.substring(0, 15000)}
=== WEBSITE CONTENT END ===

Based on the website content above:
1. EXTRACT all business contact information (name, address, phone, email)
2. IDENTIFY all products and services offered
3. DETERMINE the target market
4. CREATE a detailed customer persona representing the ideal customer

IMPORTANT: Only include business information that is ACTUALLY present in the website content. Do not fabricate contact details.`;
      } else {
        userPrompt = `Analyze this website and generate a customer persona:
Website URL: ${websiteUrl}

Based on what you can infer about this business:
1. Identify the type of business and what they offer
2. Determine who their ideal customer would be
3. Create a detailed persona representing that customer
4. Note: Website content could not be scraped, so business contact details may not be available`;
      }
    } else if (websiteUrl && analysisMode === 'advanced') {
      userPrompt = `Generate a customer persona for this business:
Website URL: ${websiteUrl}
Product/Service: ${advancedData?.product || 'Not specified'}
Target Market: ${advancedData?.targetMarket || 'Not specified'}
Value Proposition: ${advancedData?.valueProposition || 'Not specified'}

Create a detailed persona based on this business context.`;
    } else {
      userPrompt = `Generate a customer persona based on this business context:
${businessContext}

Create a detailed persona that would be the ideal customer for this business.`;
    }

    let result: string;
    
    // Try to use user's configured AI provider first
    const authHeader = req.headers.get('Authorization');
    let usedProvider = 'lovable-ai';
    
    try {
      const { apiKey, provider, model } = await getUserCredentials(authHeader);
      console.log(`Using user's ${provider}/${model} for persona generation`);
      usedProvider = provider;
      
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
    } catch (credError) {
      // Fall back to Lovable AI if no user credentials or error
      console.log('Falling back to Lovable AI:', credError instanceof Error ? credError.message : 'Unknown error');
      result = await callLovableAI(systemPrompt, userPrompt);
    }

    if (!result) {
      throw new Error("No content in AI response");
    }

    console.log(`Persona generated successfully using ${usedProvider}`);

    // Parse the JSON response
    let parsedResult;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse persona:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(parsedResult), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating persona:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
