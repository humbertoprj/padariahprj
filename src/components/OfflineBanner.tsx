import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useConnectionContext } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { getBaseUrl } from '@/services/config';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { isOnline, isApiAvailable, reconnect, isChecking } = useConnectionContext();
  
  // Não mostrar se tudo estiver OK
  if (isOnline && isApiAvailable) {
    return null;
  }
  
  const isNetworkOffline = !isOnline;
  const isServerOffline = isOnline && !isApiAvailable;
  
  return (
    <div 
      className={`
        flex items-center justify-between gap-4 px-4 py-2
        ${isNetworkOffline ? 'bg-destructive/10 border-destructive/20' : 'bg-yellow-500/10 border-yellow-500/20'}
        border-b ${className}
      `}
    >
      <div className="flex items-center gap-3">
        {isNetworkOffline ? (
          <WifiOff className="w-4 h-4 text-destructive shrink-0" />
        ) : (
          <CloudOff className="w-4 h-4 text-yellow-600 shrink-0" />
        )}
        
        <div className="text-sm">
          {isNetworkOffline ? (
            <>
              <span className="font-medium text-destructive">Você está offline</span>
              <span className="text-muted-foreground ml-2">
                — As operações serão salvas e sincronizadas quando a conexão voltar
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-yellow-600">Servidor local indisponível</span>
              <span className="text-muted-foreground ml-2">
                — Verifique se o servidor está rodando em {getBaseUrl()}
              </span>
            </>
          )}
        </div>
      </div>
      
      <Button 
        variant="outline" 
        size="sm"
        onClick={reconnect}
        disabled={isChecking || isNetworkOffline}
        className="shrink-0"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
        Reconectar
      </Button>
    </div>
  );
}

// Versão compacta para o PDV
export function OfflineIndicator() {
  const { isOnline, isApiAvailable } = useConnectionContext();
  
  if (isOnline && isApiAvailable) {
    return null;
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-full">
      {!isOnline ? (
        <>
          <WifiOff className="w-4 h-4 text-destructive" />
          <span className="text-xs font-medium text-destructive">Offline</span>
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4 text-yellow-600" />
          <span className="text-xs font-medium text-yellow-600">Servidor offline</span>
        </>
      )}
    </div>
  );
}
