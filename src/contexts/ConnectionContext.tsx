import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/services/api';

export interface ConnectionState {
  isOnline: boolean;
  isApiAvailable: boolean;
  apiLatency: number | null;
  lastCheck: Date | null;
  isChecking: boolean;
  currentUrl: string;
  isUsingFallback: boolean;
}

interface ConnectionContextType extends ConnectionState {
  reconnect: () => void;
  checkConnection: () => Promise<void>;
}

const defaultConnectionState: ConnectionState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isApiAvailable: false,
  apiLatency: null,
  lastCheck: null,
  isChecking: false,
  currentUrl: '',
  isUsingFallback: false,
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

interface ConnectionProviderProps {
  children: ReactNode;
  checkInterval?: number;
}

export function ConnectionProvider({ children, checkInterval = 30000 }: ConnectionProviderProps) {
  const [state, setState] = useState<ConnectionState>(defaultConnectionState);
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

  const reconnect = useCallback(() => {
    checkConnection();
  }, [checkConnection]);

  // Monitorar eventos online/offline
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
    
    // Verificar imediatamente
    checkConnection();
    
    // Configurar intervalo
    intervalRef.current = window.setInterval(checkConnection, checkInterval);
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection, checkInterval]);

  const value: ConnectionContextType = {
    ...state,
    reconnect,
    checkConnection,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnectionContext() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error('useConnectionContext must be used within a ConnectionProvider');
  }
  return context;
}

// Export types
export type { ConnectionContextType };
