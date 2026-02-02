import { useState, useEffect } from 'react';
import { FileText, Download, ShoppingCart, Package, DollarSign, Users, Factory, Loader2 } from 'lucide-react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';

interface RelatorioData {
  tipo: string;
  dados: any[];
  totais?: Record<string, number>;
}

const relatoriosDisponiveis = [
  { id: 'vendas', label: 'Vendas', icon: ShoppingCart, descricao: 'Relatório detalhado de vendas por período' },
  { id: 'caixa', label: 'Movimentação de Caixa', icon: DollarSign, descricao: 'Entradas e saídas do caixa' },
  { id: 'estoque', label: 'Estoque', icon: Package, descricao: 'Posição de estoque e movimentações' },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign, descricao: 'Fluxo de caixa, DRE e lucro' },
  { id: 'producao', label: 'Produção', icon: Factory, descricao: 'Ordens de produção e custos' },
  { id: 'clientes', label: 'Clientes', icon: Users, descricao: 'Análise de clientes e vendas' },
];

// Função para obter primeiro e último dia do mês atual
const getDefaultDates = () => {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  
  return {
    inicio: primeiroDia.toISOString().split('T')[0],
    fim: ultimoDia.toISOString().split('T')[0],
  };
};

export default function Relatorios() {
  const { toast } = useToast();
  const { empresa } = useEmpresa();
  const defaultDates = getDefaultDates();
  
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState(defaultDates.inicio);
  const [dataFim, setDataFim] = useState(defaultDates.fim);
  const [relatorioGerado, setRelatorioGerado] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(false);

  const gerarRelatorio = async () => {
    if (!relatorioSelecionado || !dataInicio || !dataFim) return;
    
    setLoading(true);
    
    try {
      let dados: any[] = [];
      let totais: Record<string, number> = {};

      // Buscar dados da API baseado no tipo de relatório
      switch (relatorioSelecionado) {
        case 'vendas': {
          const res = await api.get<any[]>(`${API_ENDPOINTS.vendas}?data_inicio=${dataInicio}&data_fim=${dataFim}`);
          if (res.data) {
            dados = res.data.map(v => ({
              data: new Date(v.created_at).toLocaleDateString('pt-BR'),
              cliente: v.cliente_nome || 'Avulso',
              formaPagamento: v.forma_pagamento,
              valorBruto: v.valor_bruto || 0,
              desconto: v.desconto || 0,
              valorLiquido: v.valor_liquido || 0,
            }));
            totais = {
              totalVendas: dados.length,
              valorBruto: dados.reduce((s, v) => s + v.valorBruto, 0),
              valorLiquido: dados.reduce((s, v) => s + v.valorLiquido, 0),
            };
          }
          break;
        }
        case 'caixa': {
          const res = await api.get<any[]>(`${API_ENDPOINTS.vendas}?data_inicio=${dataInicio}&data_fim=${dataFim}`);
          if (res.data) {
            dados = res.data.map(v => ({
              data: new Date(v.created_at).toLocaleDateString('pt-BR'),
              hora: new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              tipo: 'Entrada',
              descricao: `Venda ${v.forma_pagamento}`,
              valor: v.valor_liquido || 0,
            }));
            totais = {
              totalMovimentos: dados.length,
              totalEntradas: dados.reduce((s, v) => s + v.valor, 0),
              totalSaidas: 0,
            };
          }
          break;
        }
        case 'estoque': {
          const res = await api.get<any[]>(API_ENDPOINTS.produtos);
          if (res.data) {
            dados = res.data.map(p => ({
              produto: p.nome,
              categoria: p.categoria || '-',
              estoqueAtual: p.estoque_atual || 0,
              estoqueMinimo: p.estoque_minimo || 0,
              status: (p.estoque_atual || 0) <= (p.estoque_minimo || 0) ? 'Baixo' : 'OK',
              valorEstoque: (p.estoque_atual || 0) * (p.preco || 0),
            }));
            totais = {
              totalProdutos: dados.length,
              produtosBaixoEstoque: dados.filter(p => p.status === 'Baixo').length,
              valorTotalEstoque: dados.reduce((s, p) => s + p.valorEstoque, 0),
            };
          }
          break;
        }
        case 'financeiro': {
          // Buscar vendas e contas
          const [vendasRes, contasRes] = await Promise.all([
            api.get<any[]>(`${API_ENDPOINTS.vendas}?data_inicio=${dataInicio}&data_fim=${dataFim}`),
            api.get<any[]>(API_ENDPOINTS.contas),
          ]);
          
          const vendas = vendasRes.data || [];
          const contas = (contasRes.data || []).filter((c: any) => {
            const data = c.data_vencimento || c.created_at;
            return data >= dataInicio && data <= dataFim;
          });
          
          // Resumo financeiro
          const receitaBruta = vendas.reduce((s: number, v: any) => s + (v.valor_bruto || 0), 0);
          const taxasCartao = vendas.reduce((s: number, v: any) => s + (v.taxa_operadora || 0), 0);
          const receitaLiquida = vendas.reduce((s: number, v: any) => s + (v.valor_liquido || 0), 0);
          const despesas = contas.filter((c: any) => c.tipo === 'pagar').reduce((s: number, c: any) => s + (c.valor || 0), 0);
          
          dados = [
            { item: 'Receita Bruta (Vendas)', valor: receitaBruta },
            { item: '(-) Taxas de Cartão', valor: -taxasCartao },
            { item: '(=) Receita Líquida', valor: receitaLiquida },
            { item: '(-) Despesas/Contas a Pagar', valor: -despesas },
            { item: '(=) Lucro Líquido', valor: receitaLiquida - despesas },
          ];
          
          totais = {
            receitaBruta,
            receitaLiquida,
            lucroLiquido: receitaLiquida - despesas,
          };
          break;
        }
        case 'producao': {
          const res = await api.get<any[]>(API_ENDPOINTS.ordens);
          if (res.data) {
            dados = res.data
              .filter((o: any) => {
                const data = o.created_at?.split('T')[0];
                return data >= dataInicio && data <= dataFim;
              })
              .map((o: any) => ({
                ordem: `OP-${o.id?.slice(0, 6)}`,
                produto: o.produto_nome || 'Produto',
                quantidade: o.quantidade || 0,
                status: o.status || 'pendente',
                dataPrevista: o.data_prevista ? new Date(o.data_prevista).toLocaleDateString('pt-BR') : '-',
              }));
            totais = {
              totalOrdens: dados.length,
              concluidas: dados.filter(o => o.status === 'concluida').length,
              pendentes: dados.filter(o => o.status === 'pendente').length,
            };
          }
          break;
        }
        case 'clientes': {
          const res = await api.get<any[]>(API_ENDPOINTS.clientes);
          if (res.data) {
            dados = res.data.map(c => ({
              nome: c.nome,
              telefone: c.telefone || '-',
              email: c.email || '-',
              saldoFiado: c.saldo_fiado || 0,
              pontos: c.pontos || 0,
            }));
            totais = {
              totalClientes: dados.length,
              totalFiado: dados.reduce((s, c) => s + c.saldoFiado, 0),
              totalPontos: dados.reduce((s, c) => s + c.pontos, 0),
            };
          }
          break;
        }
        default:
          dados = [];
          break;
      }

      setRelatorioGerado({ tipo: relatorioSelecionado, dados, totais });
      
      toast({ 
        title: 'Relatório gerado', 
        description: `Relatório de ${relatoriosDisponiveis.find(r => r.id === relatorioSelecionado)?.label} gerado com sucesso.` 
      });
    } catch (error) {
      toast({ 
        title: 'Erro', 
        description: 'Falha ao gerar relatório. Verifique a conexão com o servidor.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    toast({ 
      title: 'Exportando PDF', 
      description: 'O download do relatório em PDF será iniciado.' 
    });
    // Em produção, usar biblioteca como jsPDF ou react-to-print
  };

  const renderRelatorioContent = () => {
    if (!relatorioGerado) return null;

    const relInfo = relatoriosDisponiveis.find(r => r.id === relatorioSelecionado);
    
    if (relatorioGerado.dados.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Nenhum dado encontrado para o período selecionado</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Totais */}
        {relatorioGerado.totais && Object.keys(relatorioGerado.totais).length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(relatorioGerado.totais).map(([key, value]) => (
              <div key={key} className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-lg font-bold text-foreground">
                  {typeof value === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('fiado'))
                    ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : value.toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabela de dados */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {Object.keys(relatorioGerado.dados[0] || {}).map((key) => (
                  <th key={key} className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {relatorioGerado.dados.map((row, idx) => (
                <tr key={idx}>
                  {Object.entries(row).map(([key, value], cellIdx) => (
                    <td key={cellIdx} className={
                      key === 'status' 
                        ? value === 'Baixo' || value === 'Vencido' ? 'text-destructive' 
                        : value === 'OK' || value === 'Concluída' ? 'text-success' 
                        : 'text-warning'
                        : key === 'valor' || key === 'valorTotal' || key === 'custoEstimado' || key === 'valorLiquido' || key === 'valorBruto' || key === 'valorEstoque' || key === 'saldoFiado'
                        ? typeof value === 'number' && value < 0 ? 'text-destructive' : 'text-success'
                        : ''
                    }>
                      {typeof value === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('custo') || key.toLowerCase().includes('fiado'))
                        ? `R$ ${Math.abs(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        : String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
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
              onChange={(e) => {
                setRelatorioSelecionado(e.target.value);
                setRelatorioGerado(null);
              }}
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
            disabled={!relatorioSelecionado || !dataInicio || !dataFim || loading}
            className="btn-primary"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Gerar Relatório
          </button>
        </div>
      </div>

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatoriosDisponiveis.map((rel) => (
          <button
            key={rel.id}
            onClick={() => {
              setRelatorioSelecionado(rel.id);
              setRelatorioGerado(null);
            }}
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
                <p className="text-sm text-muted-foreground">
                  Relatório: {relatoriosDisponiveis.find(r => r.id === relatorioSelecionado)?.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  Período: {new Date(dataInicio).toLocaleDateString('pt-BR')} a {new Date(dataFim).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            {relatorioGerado && relatorioGerado.dados.length > 0 && (
              <button className="btn-secondary" onClick={exportarPDF}>
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </button>
            )}
          </div>

          {relatorioGerado ? (
            renderRelatorioContent()
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione as datas e clique em "Gerar Relatório" para visualizar</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
