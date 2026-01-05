import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { 
  MasterSettings, 
  Project, 
  Article, 
  StrategyPack,
  ProjectMode,
  ProjectLanguage,
  AIProvider,
  ProviderApiKeys
} from '@/types/project';

const defaultProviderApiKeys: ProviderApiKeys = {
  openai: '',
  gemini: '',
  deepseek: '',
  qwen: '',
};

const defaultMasterSettings: MasterSettings = {
  aiProvider: 'openai',
  apiKey: '',
  providerApiKeys: defaultProviderApiKeys,
  defaultModel: 'gpt-4.1',
  defaultArticleLength: 500,
  defaultBrandVoice: 'Professional, informative, and helpful',
};

export function useSupabaseData() {
  const { user, loading: authLoading } = useAuth();
  const [masterSettings, setMasterSettings] = useState<MasterSettings>(defaultMasterSettings);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // Fetch master settings
  const fetchMasterSettings = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('master_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching master settings:', error);
      return;
    }

    if (data) {
      const dbData = data as Record<string, unknown>;
      const provider = data.ai_provider as AIProvider;
      
      // Build provider API keys object (we store encrypted, so we just track if they exist)
      const providerApiKeys: ProviderApiKeys = {
        openai: dbData.openai_api_key ? '••••••••' : '',
        gemini: dbData.gemini_api_key ? '••••••••' : '',
        deepseek: dbData.deepseek_api_key ? '••••••••' : '',
        qwen: dbData.qwen_api_key ? '••••••••' : '',
      };
      
      setMasterSettings({
        aiProvider: provider,
        apiKey: providerApiKeys[provider] || '',
        providerApiKeys,
        defaultModel: data.default_model,
        defaultArticleLength: data.default_article_length,
        defaultBrandVoice: data.default_brand_voice || '',
      });
    }
  }, [user]);

  // Fetch projects with articles (including shared projects)
  const fetchProjects = useCallback(async () => {
    if (!user) return;

    // Fetch own projects
    const { data: ownProjectsData, error: ownProjectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (ownProjectsError) {
      console.error('Error fetching own projects:', ownProjectsError);
      return;
    }

    // Fetch shared projects via project_shares table
    const { data: sharedProjectsData, error: sharedProjectsError } = await supabase
      .from('project_shares')
      .select('project_id, role')
      .or(`shared_with_user_id.eq.${user.id},shared_with_email.eq.${user.email}`);

    let sharedProjects: any[] = [];
    if (!sharedProjectsError && sharedProjectsData && sharedProjectsData.length > 0) {
      const sharedProjectIds = sharedProjectsData.map(s => s.project_id);
      const { data: projectsFromShares, error: projectsFromSharesError } = await supabase
        .from('projects')
        .select('*')
        .in('id', sharedProjectIds)
        .order('updated_at', { ascending: false });

      if (!projectsFromSharesError && projectsFromShares) {
        // Add share role info to projects
        sharedProjects = projectsFromShares.map(p => ({
          ...p,
          _shareRole: sharedProjectsData.find(s => s.project_id === p.id)?.role || 'viewer',
          _isShared: true,
        }));
      }
    }

    // Combine own projects and shared projects (avoiding duplicates)
    const ownProjectIds = new Set((ownProjectsData || []).map(p => p.id));
    const allProjectsData = [
      ...(ownProjectsData || []).map(p => ({ ...p, _isShared: false, _shareRole: null })),
      ...sharedProjects.filter(p => !ownProjectIds.has(p.id)),
    ];

    if (allProjectsData.length === 0) {
      setProjects([]);
      return;
    }

    // Fetch articles for all projects
    const { data: articlesData, error: articlesError } = await supabase
      .from('articles')
      .select('*')
      .in('project_id', allProjectsData.map(p => p.id))
      .order('created_at', { ascending: true });

    if (articlesError) {
      console.error('Error fetching articles:', articlesError);
    }

    const articlesMap = new Map<string, Article[]>();
    (articlesData || []).forEach(article => {
      const projectArticles = articlesMap.get(article.project_id) || [];
      projectArticles.push({
        id: article.id,
        title: article.title,
        content: article.content || undefined,
        status: article.status as Article['status'],
        wordCount: article.word_count || undefined,
        createdAt: new Date(article.created_at),
        updatedAt: new Date(article.updated_at),
      });
      articlesMap.set(article.project_id, projectArticles);
    });

    const mappedProjects: Project[] = allProjectsData.map(p => ({
      id: p.id,
      name: p.name,
      mode: p.mode as ProjectMode,
      language: p.language as ProjectLanguage,
      customLanguage: p.custom_language || undefined,
      brandVoice: p.brand_voice || undefined,
      websiteUrl: p.website_url || undefined,
      businessContext: p.business_context || undefined,
      product: p.product || undefined,
      targetMarket: p.target_market || undefined,
      persona: p.persona || undefined,
      painPoints: p.pain_points || undefined,
      valueProposition: p.value_proposition || undefined,
      // New fields
      keywords: (p as Record<string, unknown>).keywords as string[] || [],
      businessName: (p as Record<string, unknown>).business_name as string || undefined,
      businessAddress: (p as Record<string, unknown>).business_address as string || undefined,
      businessPhone: (p as Record<string, unknown>).business_phone as string || undefined,
      businessEmail: (p as Record<string, unknown>).business_email as string || undefined,
      referenceText: (p as Record<string, unknown>).reference_text as string || undefined,
      referenceFileUrl: (p as Record<string, unknown>).reference_file_url as string || undefined,
      // WordPress integration
      wordpressUrl: (p as Record<string, unknown>).wordpress_url as string || undefined,
      wordpressUsername: (p as Record<string, unknown>).wordpress_username as string || undefined,
      wordpressPassword: (p as Record<string, unknown>).wordpress_password as string || undefined,
      strategyPack: p.strategy_pack ? (p.strategy_pack as unknown as StrategyPack) : undefined,
      articles: articlesMap.get(p.id) || [],
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));

    setProjects(mappedProjects);
  }, [user]);

  // Initial data fetch
  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setMasterSettings(defaultMasterSettings);
      setProjects([]);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMasterSettings(), fetchProjects()]);
      setLoading(false);
    };

    loadData();
  }, [user, authLoading, fetchMasterSettings, fetchProjects]);

  // Update master settings
  const updateMasterSettings = async (settings: Partial<MasterSettings>) => {
    if (!user) return;

    const newSettings = { ...masterSettings, ...settings };
    
    // If provider API keys are being updated, merge them
    if (settings.providerApiKeys) {
      newSettings.providerApiKeys = { ...masterSettings.providerApiKeys, ...settings.providerApiKeys };
    }
    
    setMasterSettings(newSettings);

    // Build the update object
    const updateData: Record<string, unknown> = {
      user_id: user.id,
      ai_provider: newSettings.aiProvider,
      default_model: newSettings.defaultModel,
      default_article_length: newSettings.defaultArticleLength,
      default_brand_voice: newSettings.defaultBrandVoice,
    };

    // If API key is being updated for the current provider, encrypt and store it
    if (settings.apiKey !== undefined && settings.apiKey.trim() !== '' && !settings.apiKey.startsWith('••••')) {
      const { data: encryptedData, error: encryptError } = await supabase.rpc('encrypt_api_key', {
        plain_key: settings.apiKey
      });
      
      if (encryptError) {
        console.error('Error encrypting API key:', encryptError);
      } else {
        // Store encrypted key in the provider-specific column
        const keyColumn = `${newSettings.aiProvider}_api_key`;
        updateData[keyColumn] = encryptedData;
        
        // Also update the legacy api_key column for backwards compatibility
        updateData.api_key = encryptedData;
      }
    }

    const { error } = await supabase
      .from('master_settings')
      .upsert(updateData as any, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating master settings:', error);
    }
    
    // Refetch to get updated state
    await fetchMasterSettings();
  };

  // Create project
  const createProject = async (
    name: string, 
    mode: ProjectMode, 
    language: ProjectLanguage, 
    customLanguage?: string
  ): Promise<string | null> => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        mode,
        language,
        custom_language: customLanguage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return null;
    }

    await fetchProjects();
    return data.id;
  };

  // Update project
  const updateProject = async (id: string, updates: Partial<Project>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.mode !== undefined) dbUpdates.mode = updates.mode;
    if (updates.language !== undefined) dbUpdates.language = updates.language;
    if (updates.customLanguage !== undefined) dbUpdates.custom_language = updates.customLanguage;
    if (updates.brandVoice !== undefined) dbUpdates.brand_voice = updates.brandVoice;
    if (updates.websiteUrl !== undefined) dbUpdates.website_url = updates.websiteUrl;
    if (updates.businessContext !== undefined) dbUpdates.business_context = updates.businessContext;
    if (updates.product !== undefined) dbUpdates.product = updates.product;
    if (updates.targetMarket !== undefined) dbUpdates.target_market = updates.targetMarket;
    if (updates.persona !== undefined) dbUpdates.persona = updates.persona;
    if (updates.painPoints !== undefined) dbUpdates.pain_points = updates.painPoints;
    if (updates.valueProposition !== undefined) dbUpdates.value_proposition = updates.valueProposition;
    if (updates.strategyPack !== undefined) dbUpdates.strategy_pack = updates.strategyPack;
    // New fields
    if (updates.keywords !== undefined) dbUpdates.keywords = updates.keywords;
    if (updates.businessName !== undefined) dbUpdates.business_name = updates.businessName;
    if (updates.businessAddress !== undefined) dbUpdates.business_address = updates.businessAddress;
    if (updates.businessPhone !== undefined) dbUpdates.business_phone = updates.businessPhone;
    if (updates.businessEmail !== undefined) dbUpdates.business_email = updates.businessEmail;
    if (updates.referenceText !== undefined) dbUpdates.reference_text = updates.referenceText;
    if (updates.referenceFileUrl !== undefined) dbUpdates.reference_file_url = updates.referenceFileUrl;
    // WordPress integration
    if (updates.wordpressUrl !== undefined) dbUpdates.wordpress_url = updates.wordpressUrl;
    if (updates.wordpressUsername !== undefined) dbUpdates.wordpress_username = updates.wordpressUsername;
    if (updates.wordpressPassword !== undefined) dbUpdates.wordpress_password = updates.wordpressPassword;

    const { error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating project:', error);
      return;
    }

    // Update local state
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  };

  // Delete project
  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting project:', error);
      return;
    }

    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) setActiveProjectId(null);
  };

  // Set strategy pack (also creates articles)
  const setStrategyPack = async (projectId: string, strategyPack: StrategyPack) => {
    // Update project with strategy pack
    const { error: projectError } = await supabase
      .from('projects')
      .update({ strategy_pack: JSON.parse(JSON.stringify(strategyPack)) })
      .eq('id', projectId);

    if (projectError) {
      console.error('Error updating strategy pack:', projectError);
      return;
    }

    // Delete existing articles
    await supabase.from('articles').delete().eq('project_id', projectId);

    // Create new articles from titles
    const articlesToInsert = strategyPack.articleTitles.map(title => ({
      project_id: projectId,
      title,
      status: 'todo' as const,
    }));

    const { error: articlesError } = await supabase
      .from('articles')
      .insert(articlesToInsert);

    if (articlesError) {
      console.error('Error creating articles:', articlesError);
    }

    await fetchProjects();
  };

  // Add article
  const addArticle = async (projectId: string, title: string) => {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        project_id: projectId,
        title,
        status: 'todo',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding article:', error);
      return;
    }

    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            articles: [...p.articles, {
              id: data.id,
              title: data.title,
              status: 'todo' as const,
              createdAt: new Date(data.created_at),
              updatedAt: new Date(data.updated_at),
            }],
            updatedAt: new Date() 
          } 
        : p
    ));
  };

  // Update article
  const updateArticle = async (projectId: string, articleId: string, updates: Partial<Article>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.wordCount !== undefined) dbUpdates.word_count = updates.wordCount;

    const { error } = await supabase
      .from('articles')
      .update(dbUpdates)
      .eq('id', articleId);

    if (error) {
      console.error('Error updating article:', error);
      return;
    }

    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            articles: p.articles.map(a => 
              a.id === articleId ? { ...a, ...updates, updatedAt: new Date() } : a
            ),
            updatedAt: new Date() 
          } 
        : p
    ));
  };

  // Delete article
  const deleteArticle = async (projectId: string, articleId: string) => {
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Error deleting article:', error);
      return;
    }

    setProjects(prev => prev.map(p => 
      p.id === projectId 
        ? { 
            ...p, 
            articles: p.articles.filter(a => a.id !== articleId),
            updatedAt: new Date() 
          } 
        : p
    ));
  };

  // Get active project
  const getActiveProject = () => {
    return projects.find(p => p.id === activeProjectId) || null;
  };

  return {
    masterSettings,
    projects,
    activeProjectId,
    loading: loading || authLoading,
    updateMasterSettings,
    createProject,
    updateProject,
    deleteProject,
    setActiveProject: setActiveProjectId,
    setStrategyPack,
    addArticle,
    updateArticle,
    deleteArticle,
    getActiveProject,
    refetch: fetchProjects,
  };
}
