import { useState } from 'react';
import { 
  Settings, 
  FolderKanban, 
  Plus, 
  FileText, 
  Sparkles,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function AppSidebar() {
  const [projectsOpen, setProjectsOpen] = useState(true);
  const { projects, activeProjectId, setActiveProject } = useAppStore();
  const navigate = useNavigate();

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-effect">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-foreground">SEO Content</h1>
            <p className="text-xs text-muted-foreground">Agency Tool</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )
          }
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )
          }
        >
          <Settings className="w-4 h-4" />
          Master Settings
        </NavLink>

        {/* Projects Section */}
        <Collapsible open={projectsOpen} onOpenChange={setProjectsOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <div className="flex items-center gap-3">
              <FolderKanban className="w-4 h-4" />
              Projects
            </div>
            <ChevronDown className={cn('w-4 h-4 transition-transform', projectsOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2 pl-10 rounded-lg text-sm transition-colors text-left',
                  activeProjectId === project.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">{project.name}</span>
              </button>
            ))}
            <NavLink
              to="/project/new"
              className="flex items-center gap-3 w-full px-3 py-2 pl-10 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </NavLink>
          </CollapsibleContent>
        </Collapsible>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => navigate('/project/new')}
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>
    </aside>
  );
}
