// Hook para monitorar status de conexão
import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';

export interface ConnectionState {
  isOnline: boolean;           // Navegador tem conexão de rede
  isApiAvailable: boolean;     // API local está respondendo
  apiLatency: number | null;   // Latência da última verificação (ms)
  lastCheck: Date | null;      // Timestamp da última verificação
  isChecking: boolean;         // Verificando conexão agora
  currentUrl: string;          // URL atual sendo usada
  isUsingFallback: boolean;    // Usando URL de fallback
}

interface UseConnectionOptions {
  checkInterval?: number;      // Intervalo entre verificações (ms)
  enabled?: boolean;           // Ativar monitoramento automático
}

const defaultOptions: UseConnectionOptions = {
  checkInterval: 30000, // 30 segundos
  enabled: true,
};

export function useConnection(options: UseConnectionOptions = {}) {
  const { checkInterval, enabled } = { ...defaultOptions, ...options };
  
  const [state, setState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    isApiAvailable: false,
    apiLatency: null,
    lastCheck: null,
    isChecking: false,
    currentUrl: '',
    isUsingFallback: false,
  });
  
  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  
  const checkConnection = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState(prev => ({ ...prev, isChecking: true }));
    
    try {
      const result = await api.checkHealth();
      
      if (!isMountedRef.current) return;
      
      setState(prev => ({
        ...prev,
        isApiAvailable: result.ok,
        apiLatency: result.latency,
        lastCheck: new Date(),
        isChecking: false,
        currentUrl: api.getCurrentBaseUrl(),
        isUsingFallback: api.isUsingFallbackUrl(),
      }));
    } catch {
      if (!isMountedRef.current) return;
      
      setState(prev => ({
        ...prev,
        isApiAvailable: false,
        apiLatency: null,
        lastCheck: new Date(),
        isChecking: false,
      }));
    }
  }, []);
  
  // Monitorar eventos online/offline do navegador
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      checkConnection();
    };
    
    const handleOffline = () => {
      setState(prev => ({ 
        ...prev, 
        isOnline: false, 
        isApiAvailable: false 
      }));
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);
  
  // Verificação periódica
  useEffect(() => {
    isMountedRef.current = true;
    
    if (enabled) {
      // Verificar imediatamente
      checkConnection();
      
      // Configurar intervalo
      intervalRef.current = window.setInterval(checkConnection, checkInterval);
    }
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection, checkInterval, enabled]);
  
  const reconnect = useCallback(() => {
    checkConnection();
  }, [checkConnection]);
  
  return {
    ...state,
    reconnect,
    checkConnection,
  };
}

// Hook simplificado para verificar se está offline
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOffline;
}
