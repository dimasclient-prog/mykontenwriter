import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const { projects, setActiveProject } = useAppStore();
  const navigate = useNavigate();

  const handleProjectClick = (projectId: string) => {
    setActiveProject(projectId);
    navigate(`/project/${projectId}`);
  };

  const getProjectStats = (project: typeof projects[0]) => {
    const total = project.articles.length;
    const completed = project.articles.filter(a => a.status === 'completed').length;
    const inProgress = project.articles.filter(a => a.status === 'in-progress').length;
    return { total, completed, inProgress };
  };

  const getLanguageLabel = (project: typeof projects[0]) => {
    if (project.language === 'other' && project.customLanguage) {
      return project.customLanguage;
    }
    return project.language.charAt(0).toUpperCase() + project.language.slice(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Manage your SEO content projects"
        action={
          <Button onClick={() => navigate('/project/new')} className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Create your first project to start generating SEO-optimized content for your clients.
            </p>
            <Button onClick={() => navigate('/project/new')} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const stats = getProjectStats(project);
            return (
              <Card
                key={project.id}
                className="group cursor-pointer hover:border-primary/50 transition-all duration-300 animate-slide-up"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {project.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {project.mode}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getLanguageLabel(project)}</Badge>
                    {project.strategyPack && (
                      <Badge className="bg-primary/20 text-primary border-0">
                        Strategy Ready
                      </Badge>
                    )}
                  </div>
                  
                  {stats.total > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Articles</span>
                        <span className="font-medium">{stats.completed}/{stats.total}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-success" />
                          {stats.completed} done
                        </span>
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-warning" />
                          {stats.inProgress} in progress
                        </span>
                      </div>
                    </div>
                  )}

                  {stats.total === 0 && (
                    <p className="text-sm text-muted-foreground">
                      {project.strategyPack ? 'Ready to generate articles' : 'Generate a strategy pack to get started'}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
