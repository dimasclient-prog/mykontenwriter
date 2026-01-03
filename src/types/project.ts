export type ProjectMode = 'auto' | 'advanced';

export type ProjectLanguage = 'indonesian' | 'english' | 'other';

export type AIProvider = 'openai' | 'gemini' | 'deepseek' | 'qwen';

export const AI_MODELS: Record<AIProvider, string[]> = {
  openai: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini', 'o4', 'o3', 'o3-mini'],
  gemini: ['gemini-3-pro', 'gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'],
  deepseek: ['deepseek-v2', 'deepseek-v2.5', 'deepseek-r1'],
  qwen: ['qwen2.5-72b-instruct', 'qwen2.5-32b-instruct', 'qwen2.5-14b-instruct'],
};

export const AI_PROVIDER_NAMES: Record<AIProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  deepseek: 'DeepSeek',
  qwen: 'Qwen',
};

export interface MasterSettings {
  aiProvider: AIProvider;
  apiKey: string;
  defaultModel: string;
  defaultArticleLength: number;
  defaultBrandVoice: string;
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
