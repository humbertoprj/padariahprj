// Configurações da API Local

const STORAGE_KEY = 'pdv_api_config';

export interface ApiConfig {
  baseUrl: string;
  fallbackUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

const defaultConfig: ApiConfig = {
  baseUrl: 'http://localhost:3333',
  fallbackUrl: '',
  timeout: 10000, // 10 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
};

export function getApiConfig(): ApiConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.warn('Erro ao ler configurações da API:', e);
  }
  return defaultConfig;
}

export function setApiConfig(config: Partial<ApiConfig>): void {
  try {
    const current = getApiConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Erro ao salvar configurações da API:', e);
  }
}

export function getBaseUrl(): string {
  const config = getApiConfig();
  return config.baseUrl;
}

export function getFallbackUrl(): string {
  const config = getApiConfig();
  return config.fallbackUrl;
}

export function setBaseUrl(url: string): void {
  setApiConfig({ baseUrl: url });
}

export function setFallbackUrl(url: string): void {
  setApiConfig({ fallbackUrl: url });
}

// Endpoints da API
export const API_ENDPOINTS = {
  // Health check
  health: '/api/health',
  
  // Produtos
  produtos: '/api/produtos',
  produto: (id: string) => `/api/produtos/${id}`,
  
  // Clientes
  clientes: '/api/clientes',
  cliente: (id: string) => `/api/clientes/${id}`,
  
  // Comandas
  comandas: '/api/comandas',
  comanda: (id: string) => `/api/comandas/${id}`,
  comandaItens: (id: string) => `/api/comandas/${id}/itens`,
  
  // Vendas
  vendas: '/api/vendas',
  venda: (id: string) => `/api/vendas/${id}`,
  
  // Ordens de Produção
  ordens: '/api/ordens',
  ordem: (id: string) => `/api/ordens/${id}`,
  
  // Fichas Técnicas
  fichasTecnicas: '/api/fichas-tecnicas',
  fichaTecnica: (id: string) => `/api/fichas-tecnicas/${id}`,
  
  // Contas (Financeiro)
  contas: '/api/contas',
  conta: (id: string) => `/api/contas/${id}`,
  
  // Empresa
  empresa: '/api/empresa',
  
  // Sincronização
  sync: '/api/sync',
  syncStatus: '/api/sync/status',
} as const;
