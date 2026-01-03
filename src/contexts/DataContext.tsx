import { createContext, useContext, ReactNode } from 'react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { MasterSettings, Project, Article, StrategyPack, ProjectMode, ProjectLanguage } from '@/types/project';

interface DataContextType {
  masterSettings: MasterSettings;
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  updateMasterSettings: (settings: Partial<MasterSettings>) => Promise<void>;
  createProject: (name: string, mode: ProjectMode, language: ProjectLanguage, customLanguage?: string) => Promise<string | null>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
  setStrategyPack: (projectId: string, strategyPack: StrategyPack) => Promise<void>;
  addArticle: (projectId: string, title: string) => Promise<void>;
  updateArticle: (projectId: string, articleId: string, updates: Partial<Article>) => Promise<void>;
  deleteArticle: (projectId: string, articleId: string) => Promise<void>;
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
