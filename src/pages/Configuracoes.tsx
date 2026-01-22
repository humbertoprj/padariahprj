import { useState } from 'react';
import { Building2, DollarSign, Upload, Save, CreditCard, Smartphone, Ticket } from 'lucide-react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2 },
  { id: 'financeiro', label: 'Taxas Financeiras', icon: DollarSign },
];

export default function Configuracoes() {
  const { empresa, setEmpresa, configFinanceira, setConfigFinanceira } = useEmpresa();
  const [activeTab, setActiveTab] = useState('empresa');
  const [saving, setSaving] = useState(false);

  const handleSaveEmpresa = async () => {
    setSaving(true);
    // Simular salvamento
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const handleSaveFinanceiro = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Configurações financeiras salvas com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dados da Empresa */}
      {activeTab === 'empresa' && (
        <div className="stat-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="md:col-span-2 flex gap-8">
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-foreground mb-2">Logo da Empresa</label>
                <div className="w-32 h-32 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {empresa.logoUrl ? (
                    <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Logo</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-center">
                <label className="text-sm font-medium text-foreground mb-2">Imagem de Capa</label>
                <div className="w-48 h-32 rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {empresa.capaUrl ? (
                    <img src={empresa.capaUrl} alt="Capa" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Capa</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome da Empresa</label>
              <input
                type="text"
                value={empresa.nome}
                onChange={(e) => setEmpresa({ ...empresa, nome: e.target.value })}
                className="input-field"
                placeholder="Nome fantasia"
              />
            </div>

            {/* Razão Social */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Razão Social</label>
              <input
                type="text"
                value={empresa.razaoSocial}
                onChange={(e) => setEmpresa({ ...empresa, razaoSocial: e.target.value })}
                className="input-field"
                placeholder="Razão social completa"
              />
            </div>

            {/* CNPJ */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">CNPJ</label>
              <input
                type="text"
                value={empresa.cnpj}
                onChange={(e) => setEmpresa({ ...empresa, cnpj: e.target.value })}
                className="input-field"
                placeholder="00.000.000/0001-00"
              />
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Telefone</label>
              <input
                type="text"
                value={empresa.telefone}
                onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                className="input-field"
                placeholder="(00) 0000-0000"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">WhatsApp</label>
              <input
                type="text"
                value={empresa.whatsapp}
                onChange={(e) => setEmpresa({ ...empresa, whatsapp: e.target.value })}
                className="input-field"
                placeholder="(00) 90000-0000"
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Endereço</label>
              <input
                type="text"
                value={empresa.endereco}
                onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                className="input-field"
                placeholder="Rua, número - Bairro - Cidade/UF"
              />
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-border">
            <button onClick={handleSaveEmpresa} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}

      {/* Taxas Financeiras */}
      {activeTab === 'financeiro' && (
        <div className="stat-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Taxas de Operadoras</h2>
            <p className="text-sm text-muted-foreground">
              Configure as taxas cobradas pelas operadoras de pagamento. Essas taxas serão descontadas automaticamente nos relatórios financeiros.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Débito */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Cartão Débito</p>
                  <p className="text-xs text-muted-foreground">Taxa por transação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configFinanceira.taxaDebito}
                  onChange={(e) =>
                    setConfigFinanceira({ ...configFinanceira, taxaDebito: Number(e.target.value) })
                  }
                  className="input-field text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* Crédito à Vista */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-chart-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Crédito à Vista</p>
                  <p className="text-xs text-muted-foreground">Taxa por transação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configFinanceira.taxaCreditoVista}
                  onChange={(e) =>
                    setConfigFinanceira({ ...configFinanceira, taxaCreditoVista: Number(e.target.value) })
                  }
                  className="input-field text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* Crédito Parcelado */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Crédito Parcelado</p>
                  <p className="text-xs text-muted-foreground">Taxa por transação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configFinanceira.taxaCreditoParcelado}
                  onChange={(e) =>
                    setConfigFinanceira({ ...configFinanceira, taxaCreditoParcelado: Number(e.target.value) })
                  }
                  className="input-field text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* PIX */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">PIX</p>
                  <p className="text-xs text-muted-foreground">Taxa por transação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configFinanceira.taxaPix}
                  onChange={(e) =>
                    setConfigFinanceira({ ...configFinanceira, taxaPix: Number(e.target.value) })
                  }
                  className="input-field text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>

            {/* Voucher */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-chart-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Voucher / Vale</p>
                  <p className="text-xs text-muted-foreground">Taxa por transação</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={configFinanceira.taxaVoucher}
                  onChange={(e) =>
                    setConfigFinanceira({ ...configFinanceira, taxaVoucher: Number(e.target.value) })
                  }
                  className="input-field text-right"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-accent rounded-lg">
            <h3 className="text-sm font-medium text-accent-foreground mb-2">Como funciona o cálculo?</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• <strong>Valor bruto da venda</strong>: Valor total cobrado do cliente</p>
              <p>• <strong>(-) Taxa da operadora</strong>: Percentual descontado pela operadora</p>
              <p>• <strong>(=) Valor líquido recebido</strong>: O que realmente entra no caixa</p>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-border">
            <button onClick={handleSaveFinanceiro} disabled={saving} className="btn-primary">
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
