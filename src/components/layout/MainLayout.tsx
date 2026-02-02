import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MixedContentWarning, MixedContentBanner } from '@/components/MixedContentWarning';
import { useConnectionContext } from '@/contexts/ConnectionContext';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const { isOnline, isApiAvailable } = useConnectionContext();
  const [showFullWarning, setShowFullWarning] = useState(true);

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

  // Mostrar aviso completo apenas uma vez na sessão
  useEffect(() => {
    if (isOnline && isApiAvailable) {
      setShowFullWarning(false);
    }
  }, [isOnline, isApiAvailable]);

  const isMixedContentBlocked = isOnline && !isApiAvailable;

  return (
    <div className="min-h-screen bg-background">
      {/* Aviso de Mixed Content (modal completo na primeira vez) */}
      {isMixedContentBlocked && showFullWarning && (
        <MixedContentWarning onRetry={() => setShowFullWarning(false)} />
      )}
      
      <Sidebar />
      <div className="transition-all duration-300" style={{ marginLeft: sidebarWidth }}>
        {/* Banner compacto de Mixed Content */}
        {isMixedContentBlocked && !showFullWarning && (
          <MixedContentBanner />
        )}
        <Header />
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
