import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { websiteUrl, businessContext, analysisMode, language, advancedData } = await req.json() as PersonaRequest;

    console.log(`Generating persona with mode: ${analysisMode}, language: ${language}`);

    const languageInstruction = language === 'other' 
      ? 'the specified language' 
      : language.charAt(0).toUpperCase() + language.slice(1);

    const systemPrompt = `You are an expert market researcher and customer persona specialist.
Your task is to generate a detailed customer persona based on business information.
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
    "businessName": "Extracted or inferred business name",
    "businessAddress": "If available from URL analysis",
    "businessPhone": "If available from URL analysis", 
    "businessEmail": "If available from URL analysis",
    "product": "Main product or service",
    "targetMarket": "Target market description",
    "valueProposition": "Core value proposition"
  }
}

Requirements:
- Create ONE primary persona that represents the ideal customer
- The persona should be realistic and detailed
- Pain points should be specific to the business/product context
- Generate 3-5 relevant pain points
- Concerns should reflect real customer worries
- Extract business information if analyzing a URL
- If information is not available, use "Not available" for businessInfo fields`;

    let userPrompt: string;
    if (websiteUrl && analysisMode === 'basic') {
      userPrompt = `Analyze this website and generate a customer persona:
Website URL: ${websiteUrl}

Based on what you can infer about this business:
1. Identify the type of business and what they offer
2. Determine who their ideal customer would be
3. Create a detailed persona representing that customer
4. Extract any business contact information visible on the website`;
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
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log("Persona generated successfully");

    // Parse the JSON response
    let result;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse persona:", parseError);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(result), {
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
