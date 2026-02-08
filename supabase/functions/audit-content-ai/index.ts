import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getUserCredentials } from "../_shared/get-user-credentials.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchPageContent(url: string): Promise<string> {
  try {
    console.log(`Fetching content from: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      redirect: 'follow',
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const html = await response.text();
    console.log(`Fetched ${html.length} characters of HTML`);
    
    // Simple HTML to text conversion - remove scripts, styles, and tags
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log(`Extracted ${text.length} characters of text`);
    
    // Limit to first 8000 characters to avoid token limits
    if (text.length > 8000) {
      text = text.substring(0, 8000) + '...';
      console.log('Content truncated to 8000 characters');
    }
    
    if (text.length < 100) {
      throw new Error('Content too short or failed to extract text from page');
    }
    
    return text;
  } catch (error) {
    console.error('Error fetching page content:', error);
    throw error;
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
    body.max_completion_tokens = 3000;
  } else {
    body.max_tokens = 3000;
    body.temperature = 0.3;
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
          temperature: 0.3,
          maxOutputTokens: 3000,
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
      max_tokens: 3000,
      temperature: 0.3,
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
      max_tokens: 3000,
      temperature: 0.3,
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
    console.log('=== HCU Audit AI Function Started ===');
    
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    const { apiKey, provider, model } = await getUserCredentials(authHeader);
    console.log(`Credentials retrieved: ${provider}/${model}`);

    const body = await req.json();
    console.log('Request body keys:', Object.keys(body));
    
    const { url, personaData, projectId } = body;
    
    if (!url) {
      throw new Error('URL is required');
    }
    
    if (!personaData) {
      throw new Error('Persona data is required');
    }

    console.log(`Auditing content from URL: ${url}`);
    console.log(`Persona: ${personaData.name}`);
    console.log(`Using ${provider}/${model}`);

    // 1. Fetch page content
    const pageContent = await fetchPageContent(url);
    console.log(`Fetched ${pageContent.length} characters from URL`);

    // 2. Build AI prompt
    const systemPrompt = `You are an expert SEO content auditor specializing in Google's Helpful Content Update (HCU) guidelines. Your task is to analyze web content and provide a comprehensive HCU audit score with detailed recommendations.

You must respond with a valid JSON object with this exact structure:
{
  "contentTitle": "extracted title",
  "contentType": "article|landing-page|blog-post|product-page|other",
  "mainTopic": "main topic of content",
  "searchIntent": "informational|navigational|transactional|commercial",
  "scores": {
    "originality": { "score": 1-5, "notes": "detailed explanation" },
    "completeness": { "score": 1-5, "notes": "detailed explanation" },
    "relevance": { "score": 1-5, "notes": "detailed explanation" },
    "structure": { "score": 1-5, "notes": "detailed explanation" },
    "writingQuality": { "score": 1-5, "notes": "detailed explanation" },
    "experience": { "score": 1-5, "notes": "detailed explanation" },
    "expertise": { "score": 1-5, "notes": "detailed explanation" },
    "authoritativeness": { "score": 1-5, "notes": "detailed explanation" },
    "trustworthiness": { "score": 1-5, "notes": "detailed explanation" }
  },
  "credibility": {
    "hasAuthorName": true|false,
    "hasAuthorProfile": true|false,
    "hasAboutPage": true|false,
    "authorType": "practitioner|brand|media|anonymous",
    "hasReferences": true|false,
    "sourceType": "direct-experience|internal-data|external-source|mixed"
  },
  "redFlags": {
    "isTooPromotional": true|false,
    "noAuthor": true|false,
    "claimsWithoutProof": true|false,
    "massProduced": true|false,
    "thinContent": true|false,
    "aiGeneratedNoEdit": true|false
  }
}

SCORING GUIDELINES (1-5 scale):
5 = Excellent - Exceeds HCU standards
4 = Good - Meets HCU standards well
3 = Average - Meets basic HCU standards
2 = Below Average - Needs improvement
1 = Poor - Fails HCU standards

EVALUATION CRITERIA:

1. ORIGINALITY (1-5): Does content provide unique value?
   - Original insights, data, or perspectives
   - Not just rehashing existing content
   - Adds something new to the topic

2. COMPLETENESS (1-5): Is the topic covered thoroughly?
   - Comprehensive coverage of the topic
   - Answers common questions
   - Provides depth, not just surface-level info

3. RELEVANCE (1-5): Is it useful for the target audience?
   - Addresses real user needs/pain points
   - Provides actionable information
   - Matches search intent

4. STRUCTURE (1-5): Is content well-organized?
   - Clear headings and hierarchy
   - Easy to scan and read
   - Logical flow of information

5. WRITING QUALITY (1-5): Is it well-written?
   - Clear, natural language
   - Good grammar and spelling
   - Professional presentation

6. EXPERIENCE (1-5): Shows first-hand experience?
   - Personal stories or case studies
   - Real-world testing/usage
   - Practical examples

7. EXPERTISE (1-5): Demonstrates subject expertise?
   - Deep knowledge of topic
   - Accurate information
   - Credible sources cited

8. AUTHORITATIVENESS (1-5): Is the source authoritative?
   - Recognized in the field
   - Quality backlinks/mentions
   - Established reputation

9. TRUSTWORTHINESS (1-5): Can users trust this content?
   - Transparent about sources
   - Contact information available
   - No misleading claims

RED FLAGS (check if present):
- Too promotional: Excessive product pushing
- No author: Anonymous content
- Claims without proof: Unsubstantiated statements
- Mass-produced: Generic, templated content
- Thin content: Lacks depth or substance
- AI without editing: Obviously AI-generated without human touch`;

    const userPrompt = `Analyze this web content for HCU compliance:

URL: ${url}

TARGET PERSONA:
Name: ${personaData.name}
Role: ${personaData.role || 'Target Customer'}
Demographics: ${personaData.demographics || 'N/A'}
Pain Points: ${(personaData.painPoints || personaData.pain_points || []).join(', ') || 'N/A'}
Goals: ${(personaData.goals || []).join(', ') || 'N/A'}
Challenges: ${(personaData.challenges || personaData.concerns || []).join(', ') || personaData.concerns || 'N/A'}

CONTENT TO ANALYZE:
${pageContent}

Provide a comprehensive HCU audit considering:
1. How well does this content serve the target persona?
2. Does it address their pain points and goals?
3. Is it genuinely helpful or just SEO-optimized fluff?
4. Does it demonstrate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)?
5. Are there any red flags that could trigger HCU penalties?

Return your analysis as a JSON object following the exact structure specified in the system prompt.`;

    // 3. Call AI
    let aiResponse: string;
    switch (provider) {
      case 'openai':
        aiResponse = await callOpenAI(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'gemini':
        aiResponse = await callGemini(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'deepseek':
        aiResponse = await callDeepSeek(apiKey, model, systemPrompt, userPrompt);
        break;
      case 'qwen':
        aiResponse = await callQwen(apiKey, model, systemPrompt, userPrompt);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    console.log('AI Response received, length:', aiResponse.length);
    console.log('AI Response preview:', aiResponse.substring(0, 200));

    // 4. Parse AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to find JSON in AI response');
      console.error('Full AI response:', aiResponse);
      throw new Error('Failed to parse AI response as JSON - no JSON object found in response');
    }

    console.log('JSON extracted, parsing...');
    const analysis = JSON.parse(jsonMatch[0]);
    console.log('Analysis parsed successfully');
    console.log('Analysis keys:', Object.keys(analysis));

    // 5. Calculate scores
    console.log('Calculating scores...');
    const contentQualityScore = (
      analysis.scores.originality.score +
      analysis.scores.completeness.score +
      analysis.scores.relevance.score +
      analysis.scores.structure.score +
      analysis.scores.writingQuality.score
    ) / 5;

    const eeatScore = (
      analysis.scores.experience.score +
      analysis.scores.expertise.score +
      analysis.scores.authoritativeness.score +
      analysis.scores.trustworthiness.score
    ) / 4;

    console.log(`Content Quality Score: ${contentQualityScore}`);
    console.log(`E-E-A-T Score: ${eeatScore}`);

    let penaltyCount = 0;
    const penalties: string[] = [];
    
    if (analysis.redFlags.isTooPromotional) { penaltyCount++; penalties.push('Terlalu promosi'); }
    if (analysis.redFlags.noAuthor) { penaltyCount++; penalties.push('Tidak ada penulis'); }
    if (analysis.redFlags.claimsWithoutProof) { penaltyCount++; penalties.push('Klaim tanpa bukti'); }
    if (analysis.redFlags.massProduced) { penaltyCount++; penalties.push('Mass-produced'); }
    if (analysis.redFlags.thinContent) { penaltyCount++; penalties.push('Thin content'); }
    if (analysis.redFlags.aiGeneratedNoEdit) { penaltyCount++; penalties.push('AI tanpa editing'); }

    const penaltyScore = Math.max(1, 5 - (penaltyCount * 0.8));

    const finalScore = (
      (contentQualityScore * 0.4) +
      (eeatScore * 0.4) +
      (penaltyScore * 0.2)
    );

    let status: 'safe' | 'needs-improvement' | 'at-risk';
    if (finalScore >= 4.0) status = 'safe';
    else if (finalScore >= 3.0) status = 'needs-improvement';
    else status = 'at-risk';

    // 6. Build result
    const result = {
      id: crypto.randomUUID(),
      projectId,
      input: {
        contentTitle: analysis.contentTitle,
        contentUrl: url,
        contentType: analysis.contentType,
        mainTopic: analysis.mainTopic,
        targetAudience: `${personaData.name} - ${personaData.role || 'Target Customer'}`,
        searchIntent: analysis.searchIntent,
        contentLanguage: 'Indonesian',
        ...analysis.credibility,
        originalityScore: analysis.scores.originality.score,
        originalityNotes: analysis.scores.originality.notes,
        completenessScore: analysis.scores.completeness.score,
        completenessNotes: analysis.scores.completeness.notes,
        relevanceScore: analysis.scores.relevance.score,
        relevanceNotes: analysis.scores.relevance.notes,
        structureScore: analysis.scores.structure.score,
        structureNotes: analysis.scores.structure.notes,
        writingQualityScore: analysis.scores.writingQuality.score,
        writingQualityNotes: analysis.scores.writingQuality.notes,
        experienceScore: analysis.scores.experience.score,
        experienceNotes: analysis.scores.experience.notes,
        expertiseScore: analysis.scores.expertise.score,
        expertiseNotes: analysis.scores.expertise.notes,
        authoritativenessScore: analysis.scores.authoritativeness.score,
        authoritativenessNotes: analysis.scores.authoritativeness.notes,
        trustworthinessScore: analysis.scores.trustworthiness.score,
        trustworthinessNotes: analysis.scores.trustworthiness.notes,
        ...analysis.redFlags,
      },
      contentQualityScore: parseFloat(contentQualityScore.toFixed(2)),
      eeatScore: parseFloat(eeatScore.toFixed(2)),
      penaltyScore: parseFloat(penaltyScore.toFixed(2)),
      finalScore: parseFloat(finalScore.toFixed(2)),
      status,
      breakdown: [
        {
          category: 'Kualitas Konten',
          score: contentQualityScore,
          weight: 0.4,
          notes: `Originalitas (${analysis.scores.originality.score}), Kelengkapan (${analysis.scores.completeness.score}), Relevansi (${analysis.scores.relevance.score}), Struktur (${analysis.scores.structure.score}), Kualitas Penulisan (${analysis.scores.writingQuality.score})`,
        },
        {
          category: 'E-E-A-T',
          score: eeatScore,
          weight: 0.4,
          notes: `Experience (${analysis.scores.experience.score}), Expertise (${analysis.scores.expertise.score}), Authoritativeness (${analysis.scores.authoritativeness.score}), Trustworthiness (${analysis.scores.trustworthiness.score})`,
        },
        {
          category: 'Penalti & Red Flags',
          score: penaltyScore,
          weight: 0.2,
          notes: penaltyCount > 0 ? `${penaltyCount} red flag(s): ${penalties.join(', ')}` : 'Tidak ada red flags',
        },
      ],
      recommendations: [], // Will be generated by calculate-hcu-score function
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('Result built successfully');
    console.log(`Final Score: ${result.finalScore}, Status: ${result.status}`);
    console.log('=== HCU Audit AI Function Completed ===');

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in audit-content-ai:', error);
    
    let errorMessage = 'Unknown error occurred';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    console.error('Error details:', errorDetails);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
