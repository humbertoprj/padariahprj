// Cliente HTTP para API Local
import { getApiConfig, getBaseUrl, getFallbackUrl, API_ENDPOINTS } from './config';
import { getCachedData, setCachedData } from './indexedDB';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  fromCache: boolean;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: boolean;
  cacheTTL?: number; // em milissegundos
  timeout?: number;
}

class ApiClient {
  private currentBaseUrl: string;
  private isUsingFallback: boolean = false;
  
  constructor() {
    this.currentBaseUrl = getBaseUrl();
  }
  
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (e) {
      clearTimeout(timeoutId);
      throw e;
    }
  }
  
  private async tryRequest(endpoint: string, options: RequestInit, timeout: number): Promise<Response> {
    const primaryUrl = `${getBaseUrl()}${endpoint}`;
    const fallbackUrl = getFallbackUrl();
    
    try {
      // Tentar URL primária
      const response = await this.fetchWithTimeout(primaryUrl, options, timeout);
      this.currentBaseUrl = getBaseUrl();
      this.isUsingFallback = false;
      return response;
    } catch (e) {
      // Se houver URL de fallback, tentar
      if (fallbackUrl) {
        try {
          const response = await this.fetchWithTimeout(`${fallbackUrl}${endpoint}`, options, timeout);
          this.currentBaseUrl = fallbackUrl;
          this.isUsingFallback = true;
          return response;
        } catch {
          throw new Error('Servidor local indisponível');
        }
      }
      throw new Error('Servidor local indisponível');
    }
  }
  
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const config = getApiConfig();
    const {
      method = 'GET',
      body,
      headers = {},
      cache = method === 'GET',
      cacheTTL = 5 * 60 * 1000, // 5 minutos padrão
      timeout = config.timeout,
    } = options;
    
    const cacheKey = `api:${method}:${endpoint}`;
    
    // Para GET, verificar cache primeiro
    if (method === 'GET' && cache) {
      const cached = await getCachedData<T>(cacheKey);
      if (cached !== undefined) {
        // Tentar atualizar em background
        this.backgroundRefresh<T>(endpoint, cacheKey, cacheTTL, timeout);
        return {
          data: cached,
          error: null,
          status: 200,
          fromCache: true,
        };
      }
    }
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    
    if (body && method !== 'GET') {
      requestOptions.body = JSON.stringify(body);
    }
    
    try {
      const response = await this.tryRequest(endpoint, requestOptions, timeout);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          data: null,
          error: errorData.message || `Erro ${response.status}`,
          status: response.status,
          fromCache: false,
        };
      }
      
      const data = await response.json() as T;
      
      // Salvar no cache para GETs
      if (method === 'GET' && cache) {
        await setCachedData(cacheKey, data, cacheTTL);
      }
      
      return {
        data,
        error: null,
        status: response.status,
        fromCache: false,
      };
    } catch (e) {
      // Se falhou e é GET, tentar retornar do cache
      if (method === 'GET') {
        const cached = await getCachedData<T>(cacheKey);
        if (cached !== undefined) {
          return {
            data: cached,
            error: null,
            status: 200,
            fromCache: true,
          };
        }
      }
      
      return {
        data: null,
        error: e instanceof Error ? e.message : 'Erro desconhecido',
        status: 0,
        fromCache: false,
      };
    }
  }
  
  private async backgroundRefresh<T>(endpoint: string, cacheKey: string, cacheTTL: number, timeout: number): Promise<void> {
    try {
      const response = await this.tryRequest(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }, timeout);
      
      if (response.ok) {
        const data = await response.json() as T;
        await setCachedData(cacheKey, data, cacheTTL);
      }
    } catch {
      // Silenciosamente falhar no background refresh
    }
  }
  
  // Métodos de conveniência
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }
  
  async post<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }
  
  async put<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }
  
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
  
  async patch<T>(endpoint: string, body: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }
  
  // Health check
  async checkHealth(): Promise<{ ok: boolean; latency: number }> {
    const start = Date.now();
    try {
      const response = await this.request<{ status: string }>(API_ENDPOINTS.health, {
        cache: false,
        timeout: 5000,
      });
      return {
        ok: response.data !== null && response.error === null,
        latency: Date.now() - start,
      };
    } catch {
      return { ok: false, latency: Date.now() - start };
    }
  }
  
  // Getters
  getCurrentBaseUrl(): string {
    return this.currentBaseUrl;
  }
  
  isUsingFallbackUrl(): boolean {
    return this.isUsingFallback;
  }
}

// Instância singleton
export const api = new ApiClient();

// Re-exportar endpoints para conveniência
export { API_ENDPOINTS };
