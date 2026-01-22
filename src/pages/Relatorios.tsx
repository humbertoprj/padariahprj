import { useState } from 'react';
import { FileText, Download, ShoppingCart, Package, DollarSign, Users, Factory, Loader2 } from 'lucide-react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

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

// Dados demo para relatórios
const dadosRelatorios: Record<string, RelatorioData> = {
  vendas: {
    tipo: 'vendas',
    dados: [
      { data: '22/01/2024', cliente: 'João Silva', produtos: 5, valor: 156.80, formaPagamento: 'Cartão Débito' },
      { data: '22/01/2024', cliente: 'Maria Santos', produtos: 3, valor: 89.50, formaPagamento: 'PIX' },
      { data: '21/01/2024', cliente: 'Pedro Costa', produtos: 8, valor: 234.00, formaPagamento: 'Dinheiro' },
      { data: '21/01/2024', cliente: 'Ana Oliveira', produtos: 2, valor: 45.90, formaPagamento: 'Cartão Crédito' },
      { data: '20/01/2024', cliente: 'Carlos Lima', produtos: 6, valor: 178.30, formaPagamento: 'PIX' },
    ],
    totais: { totalVendas: 5, totalValor: 704.50, ticketMedio: 140.90 }
  },
  estoque: {
    tipo: 'estoque',
    dados: [
      { produto: 'Coca-Cola 2L', categoria: 'Bebidas', estoque: 50, minimo: 20, status: 'OK' },
      { produto: 'Pão Francês', categoria: 'Padaria', estoque: 100, minimo: 30, status: 'OK' },
      { produto: 'Arroz 5kg', categoria: 'Mercearia', estoque: 5, minimo: 15, status: 'Baixo' },
      { produto: 'Leite 1L', categoria: 'Laticínios', estoque: 8, minimo: 30, status: 'Baixo' },
      { produto: 'Feijão 1kg', categoria: 'Mercearia', estoque: 45, minimo: 20, status: 'OK' },
    ],
    totais: { totalProdutos: 5, produtosBaixoEstoque: 2, valorEstoque: 12450.00 }
  },
  financeiro: {
    tipo: 'financeiro',
    dados: [
      { descricao: 'Receita Bruta', valor: 67450.00, tipo: 'receita' },
      { descricao: 'Taxas de Cartão', valor: -1685.00, tipo: 'despesa' },
      { descricao: 'Custo dos Produtos', valor: -28500.00, tipo: 'despesa' },
      { descricao: 'Despesas Operacionais', valor: -16700.00, tipo: 'despesa' },
      { descricao: 'Lucro Líquido', valor: 20565.00, tipo: 'lucro' },
    ],
    totais: { receitaBruta: 67450.00, despesasTotais: 46885.00, lucroLiquido: 20565.00 }
  },
  clientes: {
    tipo: 'clientes',
    dados: [
      { cliente: 'João Silva', compras: 15, valorTotal: 5680.00, ultimaCompra: '22/01/2024' },
      { cliente: 'Maria Santos', compras: 28, valorTotal: 12450.00, ultimaCompra: '21/01/2024' },
      { cliente: 'Pedro Costa', compras: 8, valorTotal: 1890.00, ultimaCompra: '20/01/2024' },
      { cliente: 'Ana Oliveira', compras: 22, valorTotal: 8920.00, ultimaCompra: '22/01/2024' },
    ],
    totais: { totalClientes: 4, totalCompras: 73, valorTotal: 28940.00 }
  },
  producao: {
    tipo: 'producao',
    dados: [
      { ordem: 'OP-001', produto: 'Pão Francês', quantidade: 50, status: 'Em Andamento', custoEstimado: 400.00 },
      { ordem: 'OP-002', produto: 'Bolo de Chocolate', quantidade: 10, status: 'Pendente', custoEstimado: 250.00 },
      { ordem: 'OP-003', produto: 'Croissant', quantidade: 30, status: 'Concluída', custoEstimado: 180.00 },
    ],
    totais: { ordensTotais: 3, ordensConcluidas: 1, custoTotal: 830.00 }
  },
  caixa: {
    tipo: 'caixa',
    dados: [
      { data: '22/01/2024', tipo: 'Entrada', descricao: 'Vendas do dia', valor: 2450.00 },
      { data: '22/01/2024', tipo: 'Saída', descricao: 'Pagamento Fornecedor', valor: -850.00 },
      { data: '21/01/2024', tipo: 'Entrada', descricao: 'Vendas do dia', valor: 1890.00 },
      { data: '21/01/2024', tipo: 'Saída', descricao: 'Despesas Operacionais', valor: -320.00 },
    ],
    totais: { entradas: 4340.00, saidas: 1170.00, saldo: 3170.00 }
  },
};

export default function Relatorios() {
  const { toast } = useToast();
  const { empresa } = useEmpresa();
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [relatorioGerado, setRelatorioGerado] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(false);

  const gerarRelatorio = async () => {
    if (!relatorioSelecionado || !dataInicio || !dataFim) return;
    
    setLoading(true);
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const dados = dadosRelatorios[relatorioSelecionado];
    setRelatorioGerado(dados || null);
    setLoading(false);
    
    toast({ 
      title: 'Relatório gerado', 
      description: `Relatório de ${relatoriosDisponiveis.find(r => r.id === relatorioSelecionado)?.label} gerado com sucesso.` 
    });
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
    
    return (
      <div className="space-y-4">
        {/* Totais */}
        {relatorioGerado.totais && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Object.entries(relatorioGerado.totais).map(([key, value]) => (
              <div key={key} className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-lg font-bold text-foreground">
                  {typeof value === 'number' && key.toLowerCase().includes('valor') 
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
                        : key === 'valor' || key === 'valorTotal' || key === 'custoEstimado'
                        ? typeof value === 'number' && value < 0 ? 'text-destructive' : 'text-success'
                        : ''
                    }>
                      {typeof value === 'number' && (key.toLowerCase().includes('valor') || key.toLowerCase().includes('custo'))
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
              </div>
            </div>
            {relatorioGerado && (
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
