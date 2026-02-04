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
  baseUrl: 'http://192.168.3.100:3333',
  fallbackUrl: '', // Sem fallback - apenas servidor real
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

// Endpoints da API - Ajustados para o servidor local
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
  
  // Produção (Ajustado para o servidor local)
  ordens: '/api/producao/ordens',
  ordem: (id: string) => `/api/producao/ordens/${id}`,
  fichasTecnicas: '/api/producao/receitas',
  fichaTecnica: (id: string) => `/api/producao/receitas/${id}`,
  
  // Financeiro
  contas: '/api/financeiro/resumo',
  conta: (id: string) => `/api/financeiro/${id}`,
  
  // Empresa
  empresa: '/api/empresa',
  
  // Sincronização
  sync: '/api/sync',
  syncStatus: '/api/sync/status',
} as const;
