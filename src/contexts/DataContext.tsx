import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { MasterSettings, Project, Article, Persona, StrategyPack, ProjectMode, ProjectLanguage } from '@/types/project';

interface DataContextType {
  masterSettings: MasterSettings;
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  updateMasterSettings: (settings: Partial<MasterSettings>) => Promise<void>;
  createProject: (
    name: string, 
    mode: ProjectMode, 
    language: ProjectLanguage, 
    customLanguage?: string,
    websiteUrl?: string,
    businessContext?: string
  ) => Promise<string | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
  setStrategyPack: (projectId: string, strategyPack: StrategyPack) => Promise<void>;
  addArticle: (
    projectId: string, 
    title: string, 
    personaId?: string,
    funnelType?: string,
    articleType?: string,
    usedKeywords?: string[]
  ) => Promise<void>;
  updateArticle: (projectId: string, articleId: string, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (projectId: string, articleId: string) => Promise<void>;
  addPersona: (projectId: string, personaData: {
    name: string;
    role?: string;
    location?: string;
    familyStatus?: string;
    painPoints?: string[];
    concerns?: string;
  }) => Promise<Persona | null>;
  updatePersona: (projectId: string, personaId: string, updates: {
    name?: string;
    role?: string;
    location?: string;
    familyStatus?: string;
    painPoints?: string[];
    concerns?: string;
  }) => Promise<Persona | null>;
  deletePersona: (projectId: string, personaId: string) => Promise<void>;
  getActiveProject: () => Project | null;
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const data = useSupabaseData();

  return (
    <DataContext.Provider value={data}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
