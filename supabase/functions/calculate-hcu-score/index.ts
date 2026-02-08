import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HCUAuditInput {
  contentTitle: string;
  contentUrl: string;
  contentType: string;
  mainTopic: string;
  targetAudience: string;
  searchIntent: string;
  contentLanguage: string;
  hasAuthorName: boolean;
  hasAuthorProfile: boolean;
  hasAboutPage: boolean;
  authorType: string;
  hasReferences: boolean;
  sourceType: string;
  originalityScore: number;
  originalityNotes: string;
  completenessScore: number;
  completenessNotes: string;
  relevanceScore: number;
  relevanceNotes: string;
  structureScore: number;
  structureNotes: string;
  writingQualityScore: number;
  writingQualityNotes: string;
  experienceScore: number;
  experienceNotes: string;
  expertiseScore: number;
  expertiseNotes: string;
  authoritativenessScore: number;
  authoritativenessNotes: string;
  trustworthinessScore: number;
  trustworthinessNotes: string;
  isTooPromotional: boolean;
  noAuthor: boolean;
  claimsWithoutProof: boolean;
  massProduced: boolean;
  thinContent: boolean;
  aiGeneratedNoEdit: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, projectId, articleId } = await req.json();
    const auditInput = input as HCUAuditInput;

    // 1. Calculate Content Quality Score (40% weight)
    const contentQualityScore = (
      auditInput.originalityScore +
      auditInput.completenessScore +
      auditInput.relevanceScore +
      auditInput.structureScore +
      auditInput.writingQualityScore
    ) / 5;

    // 2. Calculate E-E-A-T Score (40% weight)
    const eeatScore = (
      auditInput.experienceScore +
      auditInput.expertiseScore +
      auditInput.authoritativenessScore +
      auditInput.trustworthinessScore
    ) / 4;

    // 3. Calculate Penalty Score (20% weight)
    let penaltyCount = 0;
    const penalties: string[] = [];

    if (auditInput.isTooPromotional) {
      penaltyCount++;
      penalties.push('Konten terlalu promosi');
    }
    if (auditInput.noAuthor) {
      penaltyCount++;
      penalties.push('Tidak ada penulis');
    }
    if (auditInput.claimsWithoutProof) {
      penaltyCount++;
      penalties.push('Klaim tanpa bukti');
    }
    if (auditInput.massProduced) {
      penaltyCount++;
      penalties.push('Konten mass-produced');
    }
    if (auditInput.thinContent) {
      penaltyCount++;
      penalties.push('Thin content');
    }
    if (auditInput.aiGeneratedNoEdit) {
      penaltyCount++;
      penalties.push('AI-generated tanpa editing');
    }

    // Penalty score: 5 - (penalty count * 0.5), minimum 1
    const penaltyScore = Math.max(1, 5 - (penaltyCount * 0.8));

    // 4. Calculate Final Score (weighted average)
    const finalScore = (
      (contentQualityScore * 0.4) +
      (eeatScore * 0.4) +
      (penaltyScore * 0.2)
    );

    // 5. Determine Status
    let status: 'safe' | 'needs-improvement' | 'at-risk';
    if (finalScore >= 4.0) {
      status = 'safe';
    } else if (finalScore >= 3.0) {
      status = 'needs-improvement';
    } else {
      status = 'at-risk';
    }

    // 6. Build Breakdown
    const breakdown = [
      {
        category: 'Kualitas Konten',
        score: contentQualityScore,
        weight: 0.4,
        notes: `Rata-rata dari 5 aspek: Originalitas (${auditInput.originalityScore}), Kelengkapan (${auditInput.completenessScore}), Relevansi (${auditInput.relevanceScore}), Struktur (${auditInput.structureScore}), Kualitas Penulisan (${auditInput.writingQualityScore})`,
      },
      {
        category: 'E-E-A-T',
        score: eeatScore,
        weight: 0.4,
        notes: `Rata-rata dari 4 aspek: Experience (${auditInput.experienceScore}), Expertise (${auditInput.expertiseScore}), Authoritativeness (${auditInput.authoritativenessScore}), Trustworthiness (${auditInput.trustworthinessScore})`,
      },
      {
        category: 'Penalti & Red Flags',
        score: penaltyScore,
        weight: 0.2,
        notes: penaltyCount > 0 
          ? `Ditemukan ${penaltyCount} red flag(s): ${penalties.join(', ')}`
          : 'Tidak ada red flags ditemukan',
      },
    ];

    // 7. Generate Recommendations
    const recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      category: string;
      issue: string;
      suggestion: string;
    }> = [];

    // Content Quality Recommendations
    if (auditInput.originalityScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Originalitas',
        issue: 'Konten kurang original dan tidak memberikan nilai tambah yang signifikan',
        suggestion: 'Tambahkan perspektif unik, data original, atau pengalaman langsung yang membedakan konten Anda dari kompetitor',
      });
    }

    if (auditInput.completenessScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Kelengkapan',
        issue: 'Topik tidak dibahas secara mendalam dan lengkap',
        suggestion: 'Perluas pembahasan dengan menambahkan subtopik penting, contoh praktis, dan menjawab pertanyaan umum pembaca',
      });
    }

    if (auditInput.relevanceScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Relevansi',
        issue: 'Konten kurang relevan dengan kebutuhan target audiens',
        suggestion: 'Fokuskan konten pada pain points spesifik audiens dan berikan solusi praktis yang dapat langsung diterapkan',
      });
    }

    if (auditInput.structureScore < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'Struktur',
        issue: 'Struktur konten tidak terorganisir dengan baik',
        suggestion: 'Gunakan heading hierarchy yang jelas (H1, H2, H3), tambahkan daftar bullet points, dan buat paragraf yang ringkas',
      });
    }

    if (auditInput.writingQualityScore < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'Kualitas Penulisan',
        issue: 'Kualitas penulisan perlu ditingkatkan',
        suggestion: 'Perbaiki grammar, gunakan bahasa yang natural, hindari jargon berlebihan, dan pastikan konten mudah dipahami',
      });
    }

    // E-E-A-T Recommendations
    if (auditInput.experienceScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Experience',
        issue: 'Kurang menunjukkan pengalaman langsung dengan topik',
        suggestion: 'Tambahkan cerita personal, case study, atau hasil testing yang menunjukkan pengalaman first-hand',
      });
    }

    if (auditInput.expertiseScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Expertise',
        issue: 'Keahlian penulis tidak terlihat jelas',
        suggestion: 'Tunjukkan kredensial, sertifikasi, atau pengalaman relevan penulis. Gunakan data dan referensi yang kredibel',
      });
    }

    if (auditInput.authoritativenessScore < 3) {
      recommendations.push({
        priority: 'medium',
        category: 'Authoritativeness',
        issue: 'Otoritas brand atau penulis perlu diperkuat',
        suggestion: 'Bangun backlink dari situs otoritatif, dapatkan mention dari expert, dan konsisten publish konten berkualitas',
      });
    }

    if (auditInput.trustworthinessScore < 3) {
      recommendations.push({
        priority: 'high',
        category: 'Trustworthiness',
        issue: 'Kepercayaan dan transparansi kurang',
        suggestion: 'Tambahkan informasi kontak, about page, privacy policy, dan referensi ke sumber terpercaya',
      });
    }

    // Credibility Recommendations
    if (!auditInput.hasAuthorName) {
      recommendations.push({
        priority: 'high',
        category: 'Kredibilitas',
        issue: 'Tidak ada nama penulis',
        suggestion: 'Tampilkan nama penulis yang jelas untuk meningkatkan accountability dan trust',
      });
    }

    if (!auditInput.hasAuthorProfile) {
      recommendations.push({
        priority: 'medium',
        category: 'Kredibilitas',
        issue: 'Tidak ada profil penulis',
        suggestion: 'Buat halaman profil penulis dengan bio, foto, dan kredensial untuk membangun kepercayaan',
      });
    }

    if (!auditInput.hasAboutPage) {
      recommendations.push({
        priority: 'medium',
        category: 'Kredibilitas',
        issue: 'Tidak ada halaman About Us',
        suggestion: 'Buat halaman About Us yang menjelaskan siapa Anda, misi, dan mengapa pembaca harus percaya pada konten Anda',
      });
    }

    if (!auditInput.hasReferences) {
      recommendations.push({
        priority: 'medium',
        category: 'Kredibilitas',
        issue: 'Tidak ada referensi atau sumber data',
        suggestion: 'Tambahkan link ke sumber data, penelitian, atau referensi yang mendukung klaim Anda',
      });
    }

    // Penalty Recommendations
    if (auditInput.isTooPromotional) {
      recommendations.push({
        priority: 'high',
        category: 'Red Flag',
        issue: 'Konten terlalu promosi',
        suggestion: 'Kurangi promosi produk/layanan. Fokus pada memberikan nilai edukatif terlebih dahulu sebelum soft-selling',
      });
    }

    if (auditInput.claimsWithoutProof) {
      recommendations.push({
        priority: 'high',
        category: 'Red Flag',
        issue: 'Klaim tanpa bukti',
        suggestion: 'Backup semua klaim dengan data, statistik, atau referensi dari sumber terpercaya',
      });
    }

    if (auditInput.thinContent) {
      recommendations.push({
        priority: 'high',
        category: 'Red Flag',
        issue: 'Thin content',
        suggestion: 'Perluas konten dengan informasi yang lebih mendalam, contoh praktis, dan pembahasan komprehensif',
      });
    }

    if (auditInput.massProduced) {
      recommendations.push({
        priority: 'high',
        category: 'Red Flag',
        issue: 'Konten mass-produced',
        suggestion: 'Personalisasi konten, tambahkan insight unik, dan pastikan setiap artikel memiliki value proposition yang jelas',
      });
    }

    if (auditInput.aiGeneratedNoEdit) {
      recommendations.push({
        priority: 'high',
        category: 'Red Flag',
        issue: 'AI-generated tanpa editing manusia',
        suggestion: 'Review dan edit konten AI dengan menambahkan perspektif manusia, fact-checking, dan personalisasi',
      });
    }

    // Sort recommendations by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    // 8. Build Result
    const result = {
      id: crypto.randomUUID(),
      projectId,
      articleId,
      input: auditInput,
      contentQualityScore: parseFloat(contentQualityScore.toFixed(2)),
      eeatScore: parseFloat(eeatScore.toFixed(2)),
      penaltyScore: parseFloat(penaltyScore.toFixed(2)),
      finalScore: parseFloat(finalScore.toFixed(2)),
      status,
      breakdown,
      recommendations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error calculating HCU score:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
