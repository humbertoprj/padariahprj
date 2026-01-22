import { useState } from 'react';
import { FileText, Download, Calendar, Filter, TrendingUp, ShoppingCart, Package, DollarSign, Users, Factory } from 'lucide-react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';

const relatoriosDisponiveis = [
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart, descricao: 'Relatório detalhado de vendas por período' },
  { id: 'caixa', label: 'Movimentação de Caixa', icon: DollarSign, descricao: 'Entradas e saídas do caixa' },
  { id: 'estoque', label: 'Estoque', icon: Package, descricao: 'Posição de estoque e movimentações' },
  { id: 'financeiro', label: 'Financeiro', icon: TrendingUp, descricao: 'Fluxo de caixa, DRE e lucro' },
  { id: 'producao', label: 'Produção', icon: Factory, descricao: 'Ordens de produção e custos' },
  { id: 'clientes', label: 'Clientes', icon: Users, descricao: 'Análise de clientes e vendas' },
  { id: 'comissao', label: 'Comissões', icon: DollarSign, descricao: 'Comissões por vendedor' },
  { id: 'taxas', label: 'Taxas de Cartão', icon: DollarSign, descricao: 'Taxas pagas às operadoras' },
];

export default function Relatorios() {
  const { empresa } = useEmpresa();
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const gerarRelatorio = () => {
    alert(`Gerando relatório de ${relatorioSelecionado} de ${dataInicio} até ${dataFim}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios detalhados do seu negócio</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="stat-card">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium text-foreground mb-2 block">Tipo de Relatório</label>
            <select
              value={relatorioSelecionado || ''}
              onChange={(e) => setRelatorioSelecionado(e.target.value)}
              className="input-field"
            >
              <option value="">Selecione um relatório</option>
              {relatoriosDisponiveis.map((rel) => (
                <option key={rel.id} value={rel.id}>
                  {rel.label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="text-sm font-medium text-foreground mb-2 block">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="min-w-[150px]">
            <label className="text-sm font-medium text-foreground mb-2 block">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input-field"
            />
          </div>
          <button
            onClick={gerarRelatorio}
            disabled={!relatorioSelecionado || !dataInicio || !dataFim}
            className="btn-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatoriosDisponiveis.map((rel) => (
          <button
            key={rel.id}
            onClick={() => setRelatorioSelecionado(rel.id)}
            className={cn(
              'stat-card text-left hover:border-primary/50 transition-all',
              relatorioSelecionado === rel.id && 'border-primary bg-primary/5'
            )}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <rel.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{rel.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{rel.descricao}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Preview do Relatório */}
      {relatorioSelecionado && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-4">
              {empresa.logoUrl ? (
                <img src={empresa.logoUrl} alt={empresa.nome} className="w-16 h-16 object-contain" />
              ) : (
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-foreground">{empresa.nome}</h2>
                <p className="text-sm text-muted-foreground">{empresa.cnpj}</p>
              </div>
            </div>
            <button className="btn-secondary">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </button>
          </div>

          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Selecione as datas e clique em "Gerar Relatório" para visualizar</p>
          </div>
        </div>
      )}
    </div>
  );
}
