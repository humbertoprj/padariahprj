// Gerenciador de Fila de Sincronização
import { 
  getSyncQueue, 
  addToSyncQueue, 
  updateSyncOperation, 
  removeSyncOperation,
  clearSyncQueue,
  getPendingSyncCount,
  type SyncOperation 
} from './indexedDB';
import { api, API_ENDPOINTS } from './api';
import { getApiConfig } from './config';

export type { SyncOperation };

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

class SyncQueueManager {
  private isSyncing: boolean = false;
  private listeners: Set<(queue: SyncOperation[]) => void> = new Set();
  private syncInterval: number | null = null;
  
  // Adicionar operação à fila
  async add(
    type: SyncOperation['type'],
    table: string,
    payload: Record<string, unknown>,
    localId?: string
  ): Promise<SyncOperation> {
    const operation = await addToSyncQueue({
      type,
      table,
      payload,
      localId,
    });
    
    this.notifyListeners();
    
    // Tentar sincronizar imediatamente
    this.processQueue();
    
    return operation;
  }
  
  // Obter todas as operações pendentes
  async getPending(): Promise<SyncOperation[]> {
    const queue = await getSyncQueue();
    return queue.filter(op => op.status === 'pending' || op.status === 'error');
  }
  
  // Obter contagem de pendentes
  async getPendingCount(): Promise<number> {
    return getPendingSyncCount();
  }
  
  // Processar fila
  async processQueue(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: true, synced: 0, failed: 0, errors: [] };
    }
    
    this.isSyncing = true;
    const result: SyncResult = { success: true, synced: 0, failed: 0, errors: [] };
    
    try {
      const pending = await this.getPending();
      
      if (pending.length === 0) {
        return result;
      }
      
      const config = getApiConfig();
      
      for (const operation of pending) {
        try {
          await updateSyncOperation(operation.id, { status: 'syncing' });
          this.notifyListeners();
          
          // Enviar para API de sync
          const response = await api.post<{ success: boolean }>(API_ENDPOINTS.sync, {
            operations: [operation],
          });
          
          if (response.error) {
            throw new Error(response.error);
          }
          
          // Sucesso - remover da fila
          await removeSyncOperation(operation.id);
          result.synced++;
          
        } catch (e) {
          const errorMessage = e instanceof Error ? e.message : 'Erro desconhecido';
          const newRetryCount = operation.retryCount + 1;
          
          if (newRetryCount >= config.retryAttempts) {
            // Máximo de tentativas atingido
            await updateSyncOperation(operation.id, {
              status: 'error',
              retryCount: newRetryCount,
              errorMessage,
            });
            result.failed++;
            result.errors.push({ id: operation.id, error: errorMessage });
          } else {
            // Ainda pode tentar novamente
            await updateSyncOperation(operation.id, {
              status: 'pending',
              retryCount: newRetryCount,
              errorMessage,
            });
          }
          
          result.success = false;
        }
      }
      
      this.notifyListeners();
      return result;
      
    } finally {
      this.isSyncing = false;
    }
  }
  
  // Forçar sincronização
  async sync(): Promise<SyncResult> {
    return this.processQueue();
  }
  
  // Limpar toda a fila
  async clear(): Promise<void> {
    await clearSyncQueue();
    this.notifyListeners();
  }
  
  // Remover operação específica
  async remove(id: string): Promise<void> {
    await removeSyncOperation(id);
    this.notifyListeners();
  }
  
  // Retentar operação com erro
  async retry(id: string): Promise<void> {
    await updateSyncOperation(id, {
      status: 'pending',
      retryCount: 0,
      errorMessage: undefined,
    });
    this.notifyListeners();
    this.processQueue();
  }
  
  // Obter estado atual
  async getQueue(): Promise<SyncOperation[]> {
    return getSyncQueue();
  }
  
  // Status de sincronização
  getIsSyncing(): boolean {
    return this.isSyncing;
  }
  
  // Iniciar sincronização periódica
  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = window.setInterval(() => {
      this.processQueue();
    }, intervalMs);
    
    // Processar imediatamente
    this.processQueue();
  }
  
  // Parar sincronização periódica
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  
  // Listeners para mudanças na fila
  subscribe(callback: (queue: SyncOperation[]) => void): () => void {
    this.listeners.add(callback);
    
    // Notificar imediatamente com estado atual
    this.getQueue().then(queue => callback(queue));
    
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  private async notifyListeners(): Promise<void> {
    const queue = await this.getQueue();
    this.listeners.forEach(listener => listener(queue));
  }
}

// Instância singleton
export const syncQueue = new SyncQueueManager();
