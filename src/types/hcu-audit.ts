export type ContentType = 'article' | 'landing-page' | 'case-study' | 'product-page' | 'blog-post' | 'other';
export type SearchIntent = 'informational' | 'navigational' | 'transactional' | 'commercial';
export type AuthorType = 'practitioner' | 'brand' | 'media' | 'anonymous';
export type SourceType = 'direct-experience' | 'internal-data' | 'external-source' | 'mixed';
export type AuditStatus = 'safe' | 'needs-improvement' | 'at-risk';

export interface HCUAuditInput {
  // A. Informasi Dasar Konten
  contentTitle: string;
  contentUrl: string;
  contentType: ContentType;
  mainTopic: string;
  targetAudience: string;
  searchIntent: SearchIntent;
  contentLanguage: string;

  // B. Sumber & Kredibilitas Konten (E-E-A-T)
  hasAuthorName: boolean;
  hasAuthorProfile: boolean;
  hasAboutPage: boolean;
  authorType: AuthorType;
  hasReferences: boolean;
  sourceType: SourceType;

  // C. Penilaian Content & Quality (Skor 1–5)
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

  // D. Penilaian E-E-A-T (Skor 1–5)
  experienceScore: number;
  experienceNotes: string;
  expertiseScore: number;
  expertiseNotes: string;
  authoritativenessScore: number;
  authoritativenessNotes: string;
  trustworthinessScore: number;
  trustworthinessNotes: string;

  // E. Penalti & Red Flags
  isTooPromotional: boolean;
  noAuthor: boolean;
  claimsWithoutProof: boolean;
  massProduced: boolean;
  thinContent: boolean;
  aiGeneratedNoEdit: boolean;
}

export interface BreakdownDetail {
  name: string;
  score: number;
  notes: string;
}

export interface BreakdownItem {
  category: string;
  score: number;
  weight: number;
  notes: string;
  details?: BreakdownDetail[];
}

export interface FinalAssessment {
  betterThanSERP: boolean;
  worthBookmarking: boolean;
  showsGenuineCare: boolean;
  summary: string;
}

export interface HCUAuditResult {
  id: string;
  projectId: string;
  articleId?: string;
  input: HCUAuditInput;
  
  // Skor per kategori
  contentQualityScore: number;
  eeatScore: number;
  penaltyScore: number;
  
  // Skor final
  finalScore: number;
  status: AuditStatus;
  
  // Penilaian Akhir HCU
  finalAssessment?: FinalAssessment;
  
  // Breakdown & rekomendasi
  breakdown: BreakdownItem[];
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    suggestion: string;
  }[];
  
  createdAt: string;
  updatedAt: string;
}
