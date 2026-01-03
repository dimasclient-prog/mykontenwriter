import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MasterSettings, Project, ProjectLanguage, ProjectMode, Article, StrategyPack } from '@/types/project';

interface AppState {
  masterSettings: MasterSettings;
  projects: Project[];
  activeProjectId: string | null;
  
  // Master settings actions
  updateMasterSettings: (settings: Partial<MasterSettings>) => void;
  
  // Project actions
  createProject: (name: string, mode: ProjectMode, language: ProjectLanguage, customLanguage?: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;
  
  // Strategy pack actions
  setStrategyPack: (projectId: string, strategyPack: StrategyPack) => void;
  
  // Article actions
  addArticle: (projectId: string, title: string) => void;
  updateArticle: (projectId: string, articleId: string, updates: Partial<Article>) => void;
  deleteArticle: (projectId: string, articleId: string) => void;
  
  // Getters
  getActiveProject: () => Project | null;
}

const defaultMasterSettings: MasterSettings = {
  aiProvider: 'openai',
  apiKey: '',
  defaultModel: 'gpt-4.1',
  defaultArticleLength: 500,
  defaultBrandVoice: 'Professional, informative, and helpful',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      masterSettings: defaultMasterSettings,
      projects: [],
      activeProjectId: null,

      updateMasterSettings: (settings) =>
        set((state) => ({
          masterSettings: { ...state.masterSettings, ...settings },
        })),

      createProject: (name, mode, language, customLanguage) => {
        const id = crypto.randomUUID();
        const newProject: Project = {
          id,
          name,
          mode,
          language,
          customLanguage,
          articles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          projects: [...state.projects, newProject],
          activeProjectId: id,
        }));
        return id;
      },

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),

      setActiveProject: (id) => set({ activeProjectId: id }),

      setStrategyPack: (projectId, strategyPack) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  strategyPack,
                  articles: strategyPack.articleTitles.map((title) => ({
                    id: crypto.randomUUID(),
                    title,
                    status: 'todo' as const,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  })),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),

      addArticle: (projectId, title) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  articles: [
                    ...p.articles,
                    {
                      id: crypto.randomUUID(),
                      title,
                      status: 'todo' as const,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    },
                  ],
                  updatedAt: new Date(),
                }
              : p
          ),
        })),

      updateArticle: (projectId, articleId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  articles: p.articles.map((a) =>
                    a.id === articleId ? { ...a, ...updates, updatedAt: new Date() } : a
                  ),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),

      deleteArticle: (projectId, articleId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  articles: p.articles.filter((a) => a.id !== articleId),
                  updatedAt: new Date(),
                }
              : p
          ),
        })),

      getActiveProject: () => {
        const state = get();
        return state.projects.find((p) => p.id === state.activeProjectId) || null;
      },
    }),
    {
      name: 'seo-content-app',
    }
  )
);
