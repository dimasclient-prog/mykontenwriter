import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MobileHeader } from './MobileHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row w-full bg-background">
      {/* Mobile Header */}
      <MobileHeader />
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
