import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DataProvider } from "./contexts/DataContext";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import MasterSettings from "./pages/MasterSettings";
import NewProject from "./pages/NewProject";
import ProjectDetail from "./pages/ProjectDetail";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

const RootLayout = () => (
  <ProtectedRoute>
    <AppLayout>
      <Outlet />
    </AppLayout>
  </ProtectedRoute>
);

const router = createBrowserRouter([
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Index /> },
      { path: "settings", element: <MasterSettings /> },
      { path: "project/new", element: <NewProject /> },
      { path: "project/:projectId", element: <ProjectDetail /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
