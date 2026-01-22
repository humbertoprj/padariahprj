import React, { createContext, useContext, useState, ReactNode } from 'react';

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

  return (
    <EmpresaContext.Provider value={{ empresa, setEmpresa, configFinanceira, setConfigFinanceira }}>
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
