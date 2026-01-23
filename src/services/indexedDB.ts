// IndexedDB wrapper usando idb-keyval
import { get, set, del, keys, clear, createStore } from 'idb-keyval';

// Stores separados para diferentes tipos de dados
const cacheStore = createStore('pdv-cache', 'cache');
const syncStore = createStore('pdv-sync', 'queue');
const dataStore = createStore('pdv-data', 'data');

// ============ CACHE STORE ============
// Para cache de dados da API

export async function getCachedData<T>(key: string): Promise<T | undefined> {
  try {
    const cached = await get<{ data: T; timestamp: number }>(key, cacheStore);
    return cached?.data;
  } catch (e) {
    console.warn('Erro ao ler cache:', e);
    return undefined;
  }
}

export async function setCachedData<T>(key: string, data: T, ttlMs?: number): Promise<void> {
  try {
    await set(key, { data, timestamp: Date.now(), ttl: ttlMs }, cacheStore);
  } catch (e) {
    console.error('Erro ao salvar cache:', e);
  }
}

export async function deleteCachedData(key: string): Promise<void> {
  try {
    await del(key, cacheStore);
  } catch (e) {
    console.warn('Erro ao deletar cache:', e);
  }
}

export async function clearCache(): Promise<void> {
  try {
    await clear(cacheStore);
  } catch (e) {
    console.error('Erro ao limpar cache:', e);
  }
}

export async function getCacheKeys(): Promise<string[]> {
  try {
    return (await keys(cacheStore)) as string[];
  } catch (e) {
    console.warn('Erro ao listar keys do cache:', e);
    return [];
  }
}

// ============ SYNC STORE ============
// Para fila de sincronização

export interface SyncOperation {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  payload: Record<string, unknown>;
  timestamp: number;
  status: 'pending' | 'syncing' | 'synced' | 'error';
  retryCount: number;
  errorMessage?: string;
  localId?: string; // ID local para referência
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  try {
    const allKeys = await keys(syncStore);
    const operations: SyncOperation[] = [];
    
    for (const key of allKeys) {
      const op = await get<SyncOperation>(key, syncStore);
      if (op) {
        operations.push(op);
      }
    }
    
    // Ordenar por timestamp (mais antigo primeiro)
    return operations.sort((a, b) => a.timestamp - b.timestamp);
  } catch (e) {
    console.error('Erro ao ler fila de sync:', e);
    return [];
  }
}

export async function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<SyncOperation> {
  const op: SyncOperation = {
    ...operation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };
  
  try {
    await set(op.id, op, syncStore);
    return op;
  } catch (e) {
    console.error('Erro ao adicionar à fila de sync:', e);
    throw e;
  }
}

export async function updateSyncOperation(id: string, updates: Partial<SyncOperation>): Promise<void> {
  try {
    const op = await get<SyncOperation>(id, syncStore);
    if (op) {
      await set(id, { ...op, ...updates }, syncStore);
    }
  } catch (e) {
    console.error('Erro ao atualizar operação de sync:', e);
  }
}

export async function removeSyncOperation(id: string): Promise<void> {
  try {
    await del(id, syncStore);
  } catch (e) {
    console.warn('Erro ao remover operação de sync:', e);
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    await clear(syncStore);
  } catch (e) {
    console.error('Erro ao limpar fila de sync:', e);
  }
}

export async function getPendingSyncCount(): Promise<number> {
  try {
    const queue = await getSyncQueue();
    return queue.filter(op => op.status === 'pending' || op.status === 'error').length;
  } catch (e) {
    return 0;
  }
}

// ============ DATA STORE ============
// Para dados locais offline

export async function getLocalData<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key, dataStore);
  } catch (e) {
    console.warn('Erro ao ler dados locais:', e);
    return undefined;
  }
}

export async function setLocalData<T>(key: string, data: T): Promise<void> {
  try {
    await set(key, data, dataStore);
  } catch (e) {
    console.error('Erro ao salvar dados locais:', e);
  }
}

export async function deleteLocalData(key: string): Promise<void> {
  try {
    await del(key, dataStore);
  } catch (e) {
    console.warn('Erro ao deletar dados locais:', e);
  }
}

export async function clearLocalData(): Promise<void> {
  try {
    await clear(dataStore);
  } catch (e) {
    console.error('Erro ao limpar dados locais:', e);
  }
}

export async function getLocalDataKeys(): Promise<string[]> {
  try {
    return (await keys(dataStore)) as string[];
  } catch (e) {
    console.warn('Erro ao listar keys de dados locais:', e);
    return [];
  }
}
