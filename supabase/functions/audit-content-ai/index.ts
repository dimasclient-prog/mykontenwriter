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
  },
  "finalAssessment": {
    "betterThanSERP": true|false,
    "worthBookmarking": true|false,
    "showsGenuineCare": true|false,
    "summary": "2-3 sentence overall assessment"
  }
}

SCORING GUIDELINES (1-5 scale):
5 = Excellent - Exceeds HCU standards, exceptional quality
4 = Good - Meets HCU standards well, minor improvements possible
3 = Average - Meets basic HCU standards but nothing remarkable
2 = Below Average - Significant improvements needed
1 = Poor - Fails HCU standards completely

═══════════════════════════════════════════════════════
A. CONTENT & QUALITY (Kualitas & Nilai Konten)
═══════════════════════════════════════════════════════

1. ORIGINALITY & VALUE (Originalitas & Nilai Tambah) → scores.originality
   Evaluate these questions:
   - Apakah konten menyajikan informasi, analisis, atau sudut pandang original?
   - Apakah konten tidak sekadar mengulang apa yang sudah banyak dibahas di internet?
   - Apakah ada pengalaman nyata, studi kasus, atau insight praktis?
   - Jika mengacu ke sumber lain, apakah ada nilai tambah yang jelas?

2. COMPLETENESS & DEPTH (Kelengkapan & Kedalaman Topik) → scores.completeness
   Evaluate these questions:
   - Apakah topik dibahas menyeluruh dan tidak setengah-setengah?
   - Apakah pembaca mendapatkan jawaban tuntas, bukan hanya pengantar?
   - Apakah ada contoh, penjelasan, atau penerapan nyata?
   - Apakah konten lebih bernilai dibanding hasil pencarian lain dengan topik serupa?

3. RELEVANCE & BENEFIT (Relevansi & Manfaat bagi Pembaca) → scores.relevance
   Evaluate these questions:
   - Apakah konten benar-benar membantu target audiens?
   - Apakah pembaca akan: Menyimpan (bookmark)? Membagikan ke orang lain? Merekomendasikan sebagai referensi?
   - Apakah konten terasa dibuat untuk manusia, bukan mesin pencari?

4. TITLE & STRUCTURE (Judul & Struktur Konten) → scores.structure
   Evaluate these questions:
   - Apakah judul deskriptif dan jelas?
   - Apakah judul mewakili isi konten secara akurat?
   - Apakah judul tidak clickbait atau berlebihan?
   - Apakah struktur konten rapi (heading, subheading, alur logis)?

5. WRITING & PRODUCTION QUALITY (Kualitas Penulisan & Produksi) → scores.writingQuality
   Evaluate these questions:
   - Apakah bahasa mudah dipahami, konsisten, dan profesional?
   - Apakah ada kesalahan ejaan, typo, atau kalimat berulang?
   - Apakah konten terasa diproduksi dengan niat dan perhatian, bukan terburu-buru?
   - Apakah konten terlihat mass-produced atau generik?

═══════════════════════════════════════════════════════
B. E-E-A-T (Expertise, Experience, Authoritativeness, Trust)
═══════════════════════════════════════════════════════

6. EXPERIENCE (Pengalaman) → scores.experience
   Evaluate these questions:
   - Apakah penulis/brand menunjukkan pengalaman langsung di topik tersebut?
   - Apakah ada cerita nyata, praktik lapangan, atau hasil implementasi?

7. EXPERTISE (Keahlian) → scores.expertise
   Evaluate these questions:
   - Apakah konten menunjukkan pemahaman mendalam, bukan opini dangkal?
   - Apakah pembahasan terdengar seperti ditulis oleh praktisi, pelaku bisnis, atau orang yang benar-benar paham topik?

8. AUTHORITATIVENESS (Otoritas) → scores.authoritativeness
   Evaluate these questions:
   - Apakah brand atau penulis dikenal di niche-nya?
   - Apakah brand punya positioning yang jelas?
   - Apakah ada indikasi bahwa situs ini layak dijadikan rujukan?

9. TRUSTWORTHINESS (Kepercayaan) → scores.trustworthiness
   Evaluate these questions:
   - Apakah ada halaman About Us, profil penulis, dan informasi kontak yang jelas?
   - Apakah klaim yang dibuat masuk akal dan tidak menyesatkan?
   - Apakah tidak ada kesalahan fakta yang mudah diverifikasi?

═══════════════════════════════════════════════════════
C. FINAL HCU ASSESSMENT (Penilaian Akhir)
═══════════════════════════════════════════════════════

Answer these final questions in "finalAssessment":
- betterThanSERP: Apakah konten ini lebih baik daripada konten rata-rata di SERP?
- worthBookmarking: Apakah konten ini pantas dijadikan referensi jangka panjang, masuk buku, modul, atau panduan praktis?
- showsGenuineCare: Apakah konten ini membantu Google memahami bahwa "Website ini dibuat oleh orang yang benar-benar tahu dan peduli dengan topiknya"?
- summary: Ringkasan penilaian keseluruhan dalam 2-3 kalimat.

RED FLAGS (periksa apakah ada):
- isTooPromotional: Terlalu banyak promosi produk/jasa
- noAuthor: Tidak ada identitas penulis
- claimsWithoutProof: Klaim tanpa bukti pendukung
- massProduced: Konten generik/template yang diproduksi massal
- thinContent: Konten dangkal tanpa substansi
- aiGeneratedNoEdit: Jelas ditulis AI tanpa sentuhan manusia`;

    const userPrompt = `Analyze this web content for HCU compliance:

URL: ${url}

TARGET PERSONA:
Name: ${personaData.name}
Role: ${personaData.role || 'Target Customer'}
Demographics: ${personaData.demographics || 'N/A'}
Pain Points: ${(personaData.painPoints || personaData.pain_points || []).join(', ') || 'N/A'}
Goals: ${(personaData.goals || []).join(', ') || 'N/A'}
Challenges: ${Array.isArray(personaData.challenges) ? personaData.challenges.join(', ') : (personaData.concerns || 'N/A')}

CONTENT TO ANALYZE:
${pageContent}

Provide a comprehensive HCU audit using ALL criteria from sections A, B, and C:

A. CONTENT & QUALITY:
1. Originalitas & Nilai Tambah - Is the content original with real value?
2. Kelengkapan & Kedalaman - Is the topic covered thoroughly?
3. Relevansi & Manfaat - Does it truly help the target persona?
4. Judul & Struktur - Is the title accurate and structure clean?
5. Kualitas Penulisan - Is it well-written and not mass-produced?

B. E-E-A-T:
6. Experience - Does it show first-hand experience?
7. Expertise - Does it demonstrate deep knowledge?
8. Authoritativeness - Is the source authoritative in this niche?
9. Trustworthiness - Can users trust this content?

C. FINAL ASSESSMENT:
- Is this content better than average SERP results?
- Is it worth bookmarking as a long-term reference?
- Does it show genuine care and expertise from the creator?

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
      finalAssessment: analysis.finalAssessment || {
        betterThanSERP: false,
        worthBookmarking: false,
        showsGenuineCare: false,
        summary: '',
      },
      breakdown: [
        {
          category: 'Kualitas Konten',
          score: contentQualityScore,
          weight: 0.4,
          details: [
            { name: 'Originalitas & Nilai Tambah', score: analysis.scores.originality.score, notes: analysis.scores.originality.notes },
            { name: 'Kelengkapan & Kedalaman', score: analysis.scores.completeness.score, notes: analysis.scores.completeness.notes },
            { name: 'Relevansi & Manfaat', score: analysis.scores.relevance.score, notes: analysis.scores.relevance.notes },
            { name: 'Judul & Struktur', score: analysis.scores.structure.score, notes: analysis.scores.structure.notes },
            { name: 'Kualitas Penulisan', score: analysis.scores.writingQuality.score, notes: analysis.scores.writingQuality.notes },
          ],
          notes: `Originalitas (${analysis.scores.originality.score}), Kelengkapan (${analysis.scores.completeness.score}), Relevansi (${analysis.scores.relevance.score}), Struktur (${analysis.scores.structure.score}), Kualitas Penulisan (${analysis.scores.writingQuality.score})`,
        },
        {
          category: 'E-E-A-T',
          score: eeatScore,
          weight: 0.4,
          details: [
            { name: 'Experience (Pengalaman)', score: analysis.scores.experience.score, notes: analysis.scores.experience.notes },
            { name: 'Expertise (Keahlian)', score: analysis.scores.expertise.score, notes: analysis.scores.expertise.notes },
            { name: 'Authoritativeness (Otoritas)', score: analysis.scores.authoritativeness.score, notes: analysis.scores.authoritativeness.notes },
            { name: 'Trustworthiness (Kepercayaan)', score: analysis.scores.trustworthiness.score, notes: analysis.scores.trustworthiness.notes },
          ],
          notes: `Experience (${analysis.scores.experience.score}), Expertise (${analysis.scores.expertise.score}), Authoritativeness (${analysis.scores.authoritativeness.score}), Trustworthiness (${analysis.scores.trustworthiness.score})`,
        },
        {
          category: 'Penalti & Red Flags',
          score: penaltyScore,
          weight: 0.2,
          notes: penaltyCount > 0 ? `${penaltyCount} red flag(s): ${penalties.join(', ')}` : 'Tidak ada red flags',
        },
      ],
      recommendations: [],
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
