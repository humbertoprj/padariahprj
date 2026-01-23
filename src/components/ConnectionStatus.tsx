import { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useConnectionContext } from '@/contexts/ConnectionContext';
import { useSyncContext } from '@/contexts/SyncContext';
import { SyncPanel } from './SyncPanel';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ConnectionStatusProps {
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ConnectionStatus({ showLabel = false, size = 'md' }: ConnectionStatusProps) {
  const [showPanel, setShowPanel] = useState(false);
  const { isOnline, isApiAvailable, apiLatency, isChecking } = useConnectionContext();
  const { pendingCount, errorCount, isSyncing } = useSyncContext();
  
  const getStatus = () => {
    if (!isOnline) {
      return {
        color: 'bg-destructive',
        textColor: 'text-destructive',
        icon: WifiOff,
        label: 'Offline',
        description: 'Sem conexão de rede',
      };
    }
    
    if (!isApiAvailable) {
      return {
        color: 'bg-destructive',
        textColor: 'text-destructive',
        icon: CloudOff,
        label: 'Servidor indisponível',
        description: 'API local não responde',
      };
    }
    
    if (errorCount > 0) {
      return {
        color: 'bg-destructive',
        textColor: 'text-destructive',
        icon: AlertCircle,
        label: `${errorCount} erro(s)`,
        description: 'Erros de sincronização',
      };
    }
    
    if (pendingCount > 0) {
      return {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-500',
        icon: Cloud,
        label: `${pendingCount} pendente(s)`,
        description: 'Aguardando sincronização',
      };
    }
    
    return {
      color: 'bg-green-500',
      textColor: 'text-green-500',
      icon: Wifi,
      label: 'Conectado',
      description: apiLatency ? `Latência: ${apiLatency}ms` : 'Tudo sincronizado',
    };
  };
  
  const status = getStatus();
  const Icon = status.icon;
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  
  return (
    <Popover open={showPanel} onOpenChange={setShowPanel}>
      <PopoverTrigger asChild>
        <button
          className={`
            flex items-center gap-2 px-2 py-1.5 rounded-lg
            hover:bg-accent transition-colors cursor-pointer
            ${size === 'sm' ? 'text-xs' : 'text-sm'}
          `}
          title={status.description}
        >
          <div className="relative">
            {isSyncing || isChecking ? (
              <RefreshCw className={`${iconSize} ${status.textColor} animate-spin`} />
            ) : (
              <Icon className={`${iconSize} ${status.textColor}`} />
            )}
            <span 
              className={`
                absolute -top-0.5 -right-0.5 ${dotSize} rounded-full ${status.color}
                ${(isSyncing || isChecking) ? 'animate-pulse' : ''}
              `} 
            />
          </div>
          
          {showLabel && (
            <span className={`${status.textColor} font-medium`}>
              {status.label}
            </span>
          )}
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <SyncPanel onClose={() => setShowPanel(false)} />
      </PopoverContent>
    </Popover>
  );
}
