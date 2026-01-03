export type ProjectMode = 'auto' | 'manual';

export type ProjectLanguage = 'indonesian' | 'english' | 'other';

export interface MasterSettings {
  aiProvider: string;
  apiKey: string;
  defaultModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultArticleLength: number;
  defaultBrandVoice: string;
  defaultLanguage: ProjectLanguage;
}

export interface ProjectSettings {
  id: string;
  name: string;
  mode: ProjectMode;
  language: ProjectLanguage;
  customLanguage?: string;
  brandVoice?: string;
  websiteUrl?: string;
  businessContext?: string;
  product?: string;
  targetMarket?: string;
  persona?: string;
  painPoints?: string[];
  valueProposition?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyPack {
  personaSummary: string;
  corePainPoints: string[];
  tofuSearchIntent: string;
  topicClusters: string[];
  articleTitles: string[];
}

export interface Article {
  id: string;
  title: string;
  content?: string;
  status: 'todo' | 'in-progress' | 'completed';
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project extends ProjectSettings {
  strategyPack?: StrategyPack;
  articles: Article[];
}
