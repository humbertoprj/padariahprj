import { useState } from 'react';
import { 
  RefreshCw, 
  Trash2, 
  RotateCcw, 
  Check, 
  X, 
  Clock, 
  AlertCircle,
  Settings,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff
} from 'lucide-react';
import { useConnectionContext } from '@/contexts/ConnectionContext';
import { useSyncContext } from '@/contexts/SyncContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getApiConfig, setApiConfig } from '@/services/config';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncPanelProps {
  onClose?: () => void;
}

export function SyncPanel({ onClose }: SyncPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [baseUrl, setBaseUrl] = useState(getApiConfig().baseUrl);
  const [fallbackUrl, setFallbackUrl] = useState(getApiConfig().fallbackUrl);
  
  const { 
    isOnline, 
    isApiAvailable, 
    apiLatency, 
    lastCheck,
    reconnect,
    isChecking,
    currentUrl,
    isUsingFallback
  } = useConnectionContext();
  
  const { 
    queue, 
    pendingCount, 
    errorCount, 
    isSyncing,
    sync,
    clear,
    retry,
    retryAll
  } = useSyncContext();
  
  const handleSaveSettings = () => {
    setApiConfig({ baseUrl, fallbackUrl });
    setShowSettings(false);
    reconnect();
  };
  
  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-5 h-5 text-destructive" />;
    if (!isApiAvailable) return <CloudOff className="w-5 h-5 text-destructive" />;
    if (errorCount > 0) return <AlertCircle className="w-5 h-5 text-destructive" />;
    if (pendingCount > 0) return <Cloud className="w-5 h-5 text-yellow-500" />;
    return <Wifi className="w-5 h-5 text-green-500" />;
  };
  
  const getStatusText = () => {
    if (!isOnline) return 'Sem conexão de rede';
    if (!isApiAvailable) return 'Servidor indisponível';
    if (errorCount > 0) return `${errorCount} erro(s) de sincronização`;
    if (pendingCount > 0) return `${pendingCount} operação(ões) pendente(s)`;
    return 'Tudo sincronizado';
  };
  
  const getOperationIcon = (status: string) => {
    switch (status) {
      case 'synced':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-destructive" />;
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };
  
  if (showSettings) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Configurações do Servidor</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl">URL Principal</Label>
            <Input
              id="baseUrl"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:3333"
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="fallbackUrl">URL de Fallback (opcional)</Label>
            <Input
              id="fallbackUrl"
              value={fallbackUrl}
              onChange={(e) => setFallbackUrl(e.target.value)}
              placeholder="http://192.168.0.10:3333"
            />
            <p className="text-xs text-muted-foreground">
              Usado quando a URL principal não responde
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowSettings(false)}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSaveSettings}>
            Salvar
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-0">
      {/* Header com status */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium text-sm">{getStatusText()}</p>
              {lastCheck && (
                <p className="text-xs text-muted-foreground">
                  Verificado {formatDistanceToNow(lastCheck, { addSuffix: true, locale: ptBR })}
                </p>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Info do servidor */}
        {isApiAvailable && (
          <div className="text-xs space-y-1 p-2 bg-muted rounded-md">
            <p className="flex justify-between">
              <span className="text-muted-foreground">Servidor:</span>
              <span className="font-mono">{currentUrl}</span>
            </p>
            {apiLatency && (
              <p className="flex justify-between">
                <span className="text-muted-foreground">Latência:</span>
                <span className={apiLatency < 100 ? 'text-green-500' : apiLatency < 500 ? 'text-yellow-500' : 'text-destructive'}>
                  {apiLatency}ms
                </span>
              </p>
            )}
            {isUsingFallback && (
              <p className="text-yellow-500 mt-1">
                ⚠️ Usando servidor de fallback
              </p>
            )}
          </div>
        )}
        
        {/* Ações */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={reconnect}
            disabled={isChecking}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            Verificar
          </Button>
          
          {pendingCount > 0 && isApiAvailable && (
            <Button 
              variant="default" 
              size="sm" 
              className="flex-1"
              onClick={sync}
              disabled={isSyncing}
            >
              <Cloud className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-pulse' : ''}`} />
              Sincronizar
            </Button>
          )}
        </div>
      </div>
      
      <Separator />
      
      {/* Lista de operações */}
      <div className="p-2">
        <div className="flex items-center justify-between px-2 py-1">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Fila de Sincronização ({queue.length})
          </h4>
          
          {queue.length > 0 && (
            <div className="flex gap-1">
              {errorCount > 0 && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={retryAll}>
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Retentar
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive" onClick={clear}>
                <Trash2 className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            </div>
          )}
        </div>
        
        {queue.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma operação pendente</p>
          </div>
        ) : (
          <ScrollArea className="h-48">
            <div className="space-y-1 p-1">
              {queue.slice(0, 20).map((op) => (
                <div 
                  key={op.id}
                  className={`
                    flex items-center justify-between p-2 rounded-md text-xs
                    ${op.status === 'error' ? 'bg-destructive/10' : 'bg-muted/50'}
                  `}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getOperationIcon(op.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {op.type} {op.table}
                      </p>
                      {op.errorMessage && (
                        <p className="text-destructive truncate">{op.errorMessage}</p>
                      )}
                    </div>
                  </div>
                  
                  {op.status === 'error' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={() => retry(op.id)}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              
              {queue.length > 20 && (
                <p className="text-center text-xs text-muted-foreground py-2">
                  +{queue.length - 20} operações...
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
