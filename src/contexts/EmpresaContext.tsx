import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  nome: 'Minha Empresa',
  razaoSocial: 'Minha Empresa LTDA',
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
  const [empresa, setEmpresa] = useState<Empresa>(defaultEmpresa);
  const [configFinanceira, setConfigFinanceira] = useState<ConfigFinanceira>(defaultConfigFinanceira);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');

  const testConnection = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setConnectionStatus('testing');
      
      // Testar conexão com query simples
      const { error: queryError } = await supabase
        .from('empresas')
        .select('id')
        .limit(1);
      
      if (queryError) {
        console.error('❌ Erro na conexão:', queryError.message);
        setError(`Erro na conexão: ${queryError.message}`);
        setConnectionStatus('error');
        return false;
      }
      
      console.log('✅ Conexão com Lovable Cloud OK!');
      setConnectionStatus('connected');
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

  // Testar conexão ao montar
  useEffect(() => {
    testConnection();
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
