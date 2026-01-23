import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useSyncQueue, type SyncQueueState } from '@/hooks/useSyncQueue';
import { syncQueue, type SyncResult } from '@/services/syncQueue';
import { useConnectionContext } from './ConnectionContext';

interface SyncContextType extends SyncQueueState {
  sync: () => Promise<SyncResult>;
  clear: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  retryAll: () => Promise<void>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
  autoSyncInterval?: number;
}

export function SyncProvider({ children, autoSyncInterval = 30000 }: SyncProviderProps) {
  const syncState = useSyncQueue();
  
  // Usar try-catch para evitar crash se ConnectionContext não estiver disponível
  let isApiAvailable = false;
  try {
    const connectionContext = useConnectionContext();
    isApiAvailable = connectionContext.isApiAvailable;
  } catch {
    console.warn('SyncProvider: ConnectionContext não disponível');
  }
  
  // Iniciar sincronização automática quando API estiver disponível
  useEffect(() => {
    if (isApiAvailable) {
      syncQueue.startAutoSync(autoSyncInterval);
    } else {
      syncQueue.stopAutoSync();
    }
    
    return () => {
      syncQueue.stopAutoSync();
    };
  }, [isApiAvailable, autoSyncInterval]);
  
  // Sincronizar quando conexão for restabelecida
  useEffect(() => {
    if (isApiAvailable && syncState.pendingCount > 0) {
      syncState.sync();
    }
  }, [isApiAvailable]);
  
  return (
    <SyncContext.Provider value={syncState}>
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncContext() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
}

// Export types
export type { SyncContextType };
