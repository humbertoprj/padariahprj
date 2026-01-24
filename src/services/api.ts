// Cliente HTTP para API Local
import { getApiConfig, getBaseUrl, getFallbackUrl, API_ENDPOINTS } from './config';
import { setCachedData } from './indexedDB';

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
  cacheTTL?: number;
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
      const response = await this.fetchWithTimeout(primaryUrl, options, timeout);
      this.currentBaseUrl = getBaseUrl();
      this.isUsingFallback = false;
      return response;
    } catch (e) {
      if (fallbackUrl) {
        try {
          const response = await this.fetchWithTimeout(`${fallbackUrl}${endpoint}`, options, timeout);
          this.currentBaseUrl = fallbackUrl;
          this.isUsingFallback = true;
          return response;
        } catch {
          throw new Error('Servidor Local Indisponível');
        }
      }
      throw new Error('Servidor Local Indisponível');
    }
  }
  
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const config = getApiConfig();
    const {
      method = 'GET',
      body,
      headers = {},
      cache = method === 'GET',
      cacheTTL = 5 * 60 * 1000,
      timeout = config.timeout,
    } = options;
    
    const cacheKey = `api:${method}:${endpoint}`;
    
    // DESATIVADO: Não usar cache para fingir conexão
    // O sistema SEMPRE deve consultar o servidor real primeiro
    
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
      
      // Tratamento para 404 - endpoint não existe
      if (response.status === 404) {
        return {
          data: null,
          error: 'Endpoint não encontrado',
          status: 404,
          fromCache: false,
        };
      }
      
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
      
      // Salvar no cache apenas após sucesso real do servidor
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
      // FORÇAR ERRO: Não usar cache como fallback
      // O usuário precisa saber que o servidor está indisponível
      return {
        data: null,
        error: e instanceof Error ? e.message : 'Servidor Local Indisponível',
        status: 0,
        fromCache: false,
      };
    }
  }
  
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
  
  getCurrentBaseUrl(): string {
    return this.currentBaseUrl;
  }
  
  isUsingFallbackUrl(): boolean {
    return this.isUsingFallback;
  }
}

export const api = new ApiClient();

export { API_ENDPOINTS };
