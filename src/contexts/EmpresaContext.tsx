import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, API_ENDPOINTS } from '@/services/api';
import { getLocalData, setLocalData } from '@/services/indexedDB';

interface Empresa {
  id: string;
  nome: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  whatsapp: string;
  endereco: string;
  logoUrl: string;
  capaUrl: string;
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCreditoParcelado: number;
  taxaPix: number;
  taxaVoucher: number;
}

interface ConfigFinanceira {
  taxaDebito: number;
  taxaCreditoVista: number;
  taxaCreditoParcelado: number;
  taxaPix: number;
  taxaVoucher: number;
}

interface EmpresaContextType {
  empresa: Empresa;
  setEmpresa: (empresa: Empresa) => void;
  configFinanceira: ConfigFinanceira;
  setConfigFinanceira: (config: ConfigFinanceira) => void;
  loading: boolean;
  error: string | null;
  connectionStatus: 'testing' | 'connected' | 'error';
  testConnection: () => Promise<boolean>;
}

const defaultEmpresa: Empresa = {
  id: '1',
  nome: 'PDV Local',
  razaoSocial: 'PDV Local LTDA',
  cnpj: '00.000.000/0001-00',
  telefone: '(11) 0000-0000',
  whatsapp: '(11) 90000-0000',
  endereco: 'Rua Exemplo, 123 - Centro',
  logoUrl: '',
  capaUrl: '',
  taxaDebito: 1.5,
  taxaCreditoVista: 2.5,
  taxaCreditoParcelado: 3.5,
  taxaPix: 0,
  taxaVoucher: 5.0,
};

const defaultConfigFinanceira: ConfigFinanceira = {
  taxaDebito: 1.5,
  taxaCreditoVista: 2.5,
  taxaCreditoParcelado: 3.5,
  taxaPix: 0,
  taxaVoucher: 5.0,
};

const EmpresaContext = createContext<EmpresaContextType | undefined>(undefined);

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const [empresa, setEmpresaState] = useState<Empresa>(defaultEmpresa);
  const [configFinanceira, setConfigFinanceira] = useState<ConfigFinanceira>(defaultConfigFinanceira);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');

  const setEmpresa = (newEmpresa: Empresa) => {
    setEmpresaState(newEmpresa);
    // Persistir localmente
    setLocalData('empresa', newEmpresa);
    // Atualizar config financeira
    setConfigFinanceira({
      taxaDebito: newEmpresa.taxaDebito,
      taxaCreditoVista: newEmpresa.taxaCreditoVista,
      taxaCreditoParcelado: newEmpresa.taxaCreditoParcelado,
      taxaPix: newEmpresa.taxaPix,
      taxaVoucher: newEmpresa.taxaVoucher,
    });
  };

  const testConnection = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('testing');
      
      // Testar conexão com API local
      const health = await api.checkHealth();
      
      if (!health.ok) {
        console.log('⚠️ API local indisponível, usando dados locais');
        setConnectionStatus('error');
        return false;
      }
      
      console.log('✅ Conexão com API local OK! Latência:', health.latency, 'ms');
      setConnectionStatus('connected');
      
      // Tentar buscar dados da empresa (404 é tratado graciosamente)
      const response = await api.get<Empresa>(API_ENDPOINTS.empresa);
      if (response.data && !Array.isArray(response.data)) {
        setEmpresa(response.data);
      }
      
      // Disparar sincronização inicial automaticamente
      try {
        console.log('🔄 Disparando sincronização inicial...');
        const syncResponse = await api.post<{ success: boolean }>(API_ENDPOINTS.sync, {
          action: 'pull',
          timestamp: new Date().toISOString(),
        });
        if (syncResponse.data?.success) {
          console.log('✅ Sincronização inicial concluída');
        } else if (syncResponse.error) {
          console.log('⚠️ Sync inicial falhou (endpoint pode não existir):', syncResponse.error);
        }
      } catch (syncErr) {
        console.log('⚠️ Sincronização inicial não disponível:', syncErr);
      }
      
      return true;
    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      setError(`Erro inesperado: ${err}`);
      setConnectionStatus('error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados locais e testar conexão ao montar
  useEffect(() => {
    const init = async () => {
      // Primeiro, carregar dados locais
      const localEmpresa = await getLocalData<Empresa>('empresa');
      if (localEmpresa) {
        setEmpresaState(localEmpresa);
        setConfigFinanceira({
          taxaDebito: localEmpresa.taxaDebito,
          taxaCreditoVista: localEmpresa.taxaCreditoVista,
          taxaCreditoParcelado: localEmpresa.taxaCreditoParcelado,
          taxaPix: localEmpresa.taxaPix,
          taxaVoucher: localEmpresa.taxaVoucher,
        });
      }
      
      // Depois, testar conexão (atualiza dados se disponível)
      testConnection();
    };
    
    init();
  }, []);

  return (
    <EmpresaContext.Provider value={{ 
      empresa, 
      setEmpresa, 
      configFinanceira, 
      setConfigFinanceira,
      loading, 
      error, 
      connectionStatus,
      testConnection 
    }}>
      {children}
    </EmpresaContext.Provider>
  );
}

export function useEmpresa() {
  const context = useContext(EmpresaContext);
  if (context === undefined) {
    throw new Error('useEmpresa must be used within an EmpresaProvider');
  }
  return context;
}
