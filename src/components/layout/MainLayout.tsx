import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256);

  useEffect(() => {
    const handleResize = () => {
      // Check sidebar collapsed state
      const sidebar = document.querySelector('aside');
      if (sidebar) {
        setSidebarWidth(sidebar.offsetWidth);
      }
    };

    const observer = new ResizeObserver(handleResize);
    const sidebar = document.querySelector('aside');
    if (sidebar) {
      observer.observe(sidebar);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="transition-all duration-300" style={{ marginLeft: sidebarWidth }}>
        <Header />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
