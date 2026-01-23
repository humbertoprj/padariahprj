// Hook para interagir com a fila de sincronização
import { useState, useEffect, useCallback } from 'react';
import { syncQueue, type SyncOperation, type SyncResult } from '@/services/syncQueue';

export interface SyncQueueState {
  queue: SyncOperation[];
  pendingCount: number;
  errorCount: number;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
}

export function useSyncQueue() {
  const [state, setState] = useState<SyncQueueState>({
    queue: [],
    pendingCount: 0,
    errorCount: 0,
    isSyncing: false,
    lastSyncResult: null,
  });
  
  // Atualizar estado quando a fila mudar
  useEffect(() => {
    const unsubscribe = syncQueue.subscribe((queue) => {
      const pendingCount = queue.filter(
        op => op.status === 'pending' || op.status === 'syncing'
      ).length;
      const errorCount = queue.filter(op => op.status === 'error').length;
      
      setState(prev => ({
        ...prev,
        queue,
        pendingCount,
        errorCount,
        isSyncing: syncQueue.getIsSyncing(),
      }));
    });
    
    return unsubscribe;
  }, []);
  
  // Adicionar operação à fila
  const addOperation = useCallback(async (
    type: SyncOperation['type'],
    table: string,
    payload: Record<string, unknown>,
    localId?: string
  ) => {
    return syncQueue.add(type, table, payload, localId);
  }, []);
  
  // Forçar sincronização
  const sync = useCallback(async () => {
    setState(prev => ({ ...prev, isSyncing: true }));
    const result = await syncQueue.sync();
    setState(prev => ({ ...prev, isSyncing: false, lastSyncResult: result }));
    return result;
  }, []);
  
  // Limpar fila
  const clear = useCallback(async () => {
    await syncQueue.clear();
  }, []);
  
  // Remover operação específica
  const remove = useCallback(async (id: string) => {
    await syncQueue.remove(id);
  }, []);
  
  // Retentar operação
  const retry = useCallback(async (id: string) => {
    await syncQueue.retry(id);
  }, []);
  
  // Retentar todas com erro
  const retryAll = useCallback(async () => {
    const errors = state.queue.filter(op => op.status === 'error');
    for (const op of errors) {
      await syncQueue.retry(op.id);
    }
  }, [state.queue]);
  
  return {
    ...state,
    addOperation,
    sync,
    clear,
    remove,
    retry,
    retryAll,
  };
}

// Helper hook para adicionar operações facilmente
export function useQueueOperation() {
  const { addOperation } = useSyncQueue();
  
  const insert = useCallback((table: string, payload: Record<string, unknown>, localId?: string) => {
    return addOperation('INSERT', table, payload, localId);
  }, [addOperation]);
  
  const update = useCallback((table: string, payload: Record<string, unknown>, localId?: string) => {
    return addOperation('UPDATE', table, payload, localId);
  }, [addOperation]);
  
  const remove = useCallback((table: string, payload: Record<string, unknown>, localId?: string) => {
    return addOperation('DELETE', table, payload, localId);
  }, [addOperation]);
  
  return { insert, update, remove };
}
