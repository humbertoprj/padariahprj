import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, Plus, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ContaForm, ContaFormData } from '@/components/forms/ContaForm';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { api, API_ENDPOINTS } from '@/services/api';

interface Conta {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'vencido' | 'pago';
  tipo: 'receber' | 'pagar';
  categoria?: string;
  dataPagamento?: string;
}

interface VendaAPI {
  id: string;
  valor_bruto: number;
  valor_liquido: number;
  taxa_operadora: number;
  forma_pagamento: string;
  created_at: string;
}

interface DREData {
  receitaBruta: number;
  taxasCartao: number;
  receitaLiquida: number;
  custoProdutos: number;
  lucroBruto: number;
  despesasOperacionais: number;
  lucroLiquido: number;
}

interface FluxoCaixaItem {
  name: string;
  receitas: number;
  despesas: number;
}

const ERRO_SERVIDOR_OFFLINE = 'Erro: Servidor Local não encontrado. Certifique-se de que o CMD está aberto no computador principal.';

export default function Financeiro() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'receber' | 'pagar' | 'dre'>('visao-geral');
  const [contas, setContas] = useState<Conta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  // Dados calculados da API
  const [receitasMes, setReceitasMes] = useState(0);
  const [despesasMes, setDespesasMes] = useState(0);
  const [fluxoCaixaData, setFluxoCaixaData] = useState<FluxoCaixaItem[]>([]);
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<{ name: string; value: number; color: string }[]>([]);
  const [dreData, setDreData] = useState<DREData>({
    receitaBruta: 0,
    taxasCartao: 0,
    receitaLiquida: 0,
    custoProdutos: 0,
    lucroBruto: 0,
    despesasOperacionais: 0,
    lucroLiquido: 0,
  });
  
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [novaContaTipo, setNovaContaTipo] = useState<'receber' | 'pagar'>('receber');
  const [confirmAction, setConfirmAction] = useState<{ tipo: 'receber' | 'pagar'; conta: Conta } | null>(null);

  // Carregar dados financeiros da API local
  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    
    try {
      // Buscar vendas e contas em paralelo
      const [vendasRes, contasRes] = await Promise.all([
        api.get<VendaAPI[]>(API_ENDPOINTS.vendas),
        api.get<any[]>(API_ENDPOINTS.contas),
      ]);
      
      if (vendasRes.error && vendasRes.status === 0) {
        setErro(ERRO_SERVIDOR_OFFLINE);
        setLoading(false);
        return;
      }
      
      const vendas = vendasRes.data || [];
      const contasAPI = contasRes.data || [];
      
      // Mapear contas
      const contasMapeadas: Conta[] = contasAPI.map((c: any) => ({
        id: c.id,
        descricao: c.descricao,
        valor: c.valor || 0,
        vencimento: c.data_vencimento,
        status: c.status || 'pendente',
        tipo: c.tipo as 'receber' | 'pagar',
        categoria: c.categoria,
        dataPagamento: c.data_pagamento,
      }));
      setContas(contasMapeadas);
      
      // Filtrar vendas do mês atual
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const vendasMes = vendas.filter(v => new Date(v.created_at) >= inicioMes);
      
      // Calcular receitas do mês (valor bruto das vendas)
      const totalReceitasMes = vendasMes.reduce((acc, v) => acc + (v.valor_bruto || 0), 0);
      setReceitasMes(totalReceitasMes);
      
      // Calcular taxas de cartão
      const totalTaxas = vendasMes.reduce((acc, v) => acc + (v.taxa_operadora || 0), 0);
      
      // Calcular despesas (contas a pagar pagas no mês)
      const despesasPagas = contasMapeadas
        .filter(c => c.tipo === 'pagar' && c.status === 'pago' && c.dataPagamento && new Date(c.dataPagamento) >= inicioMes)
        .reduce((acc, c) => acc + c.valor, 0);
      setDespesasMes(despesasPagas);
      
      // DRE
      const receitaLiquida = totalReceitasMes - totalTaxas;
      const lucroBruto = receitaLiquida; // Sem custo de produtos ainda
      const lucroLiquido = lucroBruto - despesasPagas;
      
      setDreData({
        receitaBruta: totalReceitasMes,
        taxasCartao: totalTaxas,
        receitaLiquida,
        custoProdutos: 0, // Seria calculado com fichas técnicas
        lucroBruto,
        despesasOperacionais: despesasPagas,
        lucroLiquido,
      });
      
      // Fluxo de caixa (últimos 7 dias)
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const fluxo: FluxoCaixaItem[] = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        
        const receitasDia = vendas
          .filter(v => v.created_at?.startsWith(dataStr))
          .reduce((acc, v) => acc + (v.valor_liquido || 0), 0);
          
        const despesasDia = contasMapeadas
          .filter(c => c.dataPagamento?.startsWith(dataStr) && c.tipo === 'pagar')
          .reduce((acc, c) => acc + c.valor, 0);
        
        fluxo.push({
          name: dias[data.getDay()],
          receitas: receitasDia,
          despesas: despesasDia,
        });
      }
      setFluxoCaixaData(fluxo);
      
      // Despesas por categoria
      const categorias: Record<string, number> = {};
      contasMapeadas
        .filter(c => c.tipo === 'pagar')
        .forEach(c => {
          const cat = c.categoria || 'Outros';
          categorias[cat] = (categorias[cat] || 0) + c.valor;
        });
      
      const cores = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];
      const despesasCat = Object.entries(categorias).map(([name, value], idx) => ({
        name,
        value,
        color: cores[idx % cores.length],
      }));
      setDespesasPorCategoria(despesasCat);
      
    } catch (error) {
      console.error('Erro ao carregar financeiro:', error);
      setErro('Falha ao carregar dados financeiros.');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const contasReceber = contas.filter(c => c.tipo === 'receber' && c.status !== 'pago');
  const contasPagar = contas.filter(c => c.tipo === 'pagar' && c.status !== 'pago');

  const handleAddConta = async (data: ContaFormData) => {
    const payload = {
      descricao: data.descricao,
      valor: data.valor,
      data_vencimento: data.dataVencimento,
      tipo: novaContaTipo,
      categoria: data.categoria,
      status: 'pendente',
    };
    
    const response = await api.post<any>(API_ENDPOINTS.contas, payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao criar conta', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarDados();
      setNovaContaOpen(false);
      toast({ 
        title: novaContaTipo === 'receber' ? 'Conta a receber criada' : 'Conta a pagar criada',
        description: `${data.descricao} - R$ ${data.valor.toFixed(2).replace('.', ',')}` 
      });
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirmAction) return;
    
    const response = await api.patch<any>(API_ENDPOINTS.conta(confirmAction.conta.id), {
      status: 'pago',
      data_pagamento: new Date().toISOString(),
    });
    
    if (response.error) {
      toast({ 
        title: 'Erro', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarDados();
      toast({ 
        title: confirmAction.tipo === 'receber' ? 'Pagamento recebido' : 'Pagamento efetuado',
        description: `${confirmAction.conta.descricao} - R$ ${confirmAction.conta.valor.toFixed(2).replace('.', ',')}` 
      });
    }
    
    setConfirmAction(null);
  };

  const openNovaContaDialog = (tipo: 'receber' | 'pagar') => {
    setNovaContaTipo(tipo);
    setNovaContaOpen(true);
  };

  // Tela de erro
  if (erro && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Erro de Conexão</h2>
        <p className="text-muted-foreground text-center max-w-md">{erro}</p>
        <button className="btn-primary" onClick={carregarDados}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro completo</p>
        </div>
        <button className="btn-secondary" onClick={carregarDados}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-4">
        {[
          { id: 'visao-geral', label: 'Visão Geral' },
          { id: 'receber', label: 'Contas a Receber' },
          { id: 'pagar', label: 'Contas a Pagar' },
          { id: 'dre', label: 'DRE' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              'px-4 py-2.5 rounded-lg font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'visao-geral' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Receitas (Mês)</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {receitasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Vendas do mês</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Despesas (Mês)</p>
                  <p className="text-2xl font-bold text-destructive">
                    R$ {despesasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Contas pagas</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Receber</p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {contasReceber.reduce((t, c) => t + c.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{contasReceber.length} títulos</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">A Pagar</p>
                  <p className="text-2xl font-bold text-warning">
                    R$ {contasPagar.reduce((t, c) => t + c.valor, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{contasPagar.length} títulos</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 stat-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa (7 dias)</h2>
              {fluxoCaixaData.some(d => d.receitas > 0 || d.despesas > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={fluxoCaixaData}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    />
                    <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} name="Receitas" />
                    <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} name="Despesas" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <DollarSign className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma movimentação nos últimos 7 dias</p>
                </div>
              )}
            </div>

            <div className="stat-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h2>
              {despesasPorCategoria.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <RePieChart>
                      <Pie
                        data={despesasPorCategoria}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {despesasPorCategoria.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                    </RePieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {despesasPorCategoria.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-muted-foreground">{item.name}</span>
                        </div>
                        <span className="font-medium text-foreground">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <CreditCard className="w-10 h-10 mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma despesa registrada</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'receber' && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Contas a Receber</h2>
            <button className="btn-primary" onClick={() => openNovaContaDialog('receber')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </button>
          </div>
          {contasReceber.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th className="text-right">Valor</th>
                  <th>Vencimento</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contasReceber.map((conta) => (
                  <tr key={conta.id}>
                    <td className="font-medium">{conta.descricao}</td>
                    <td className="text-right">R$ {conta.valor.toFixed(2).replace('.', ',')}</td>
                    <td>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="text-center">
                      <span className={conta.status === 'vencido' ? 'badge-destructive' : 'badge-warning'}>
                        {conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-success text-sm py-1 px-3"
                        onClick={() => setConfirmAction({ tipo: 'receber', conta })}
                      >
                        Receber
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta a receber pendente</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pagar' && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Contas a Pagar</h2>
            <button className="btn-primary" onClick={() => openNovaContaDialog('pagar')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conta
            </button>
          </div>
          {contasPagar.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th className="text-right">Valor</th>
                  <th>Vencimento</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contasPagar.map((conta) => (
                  <tr key={conta.id}>
                    <td className="font-medium">{conta.descricao}</td>
                    <td className="text-right">R$ {conta.valor.toFixed(2).replace('.', ',')}</td>
                    <td>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</td>
                    <td className="text-center">
                      <span className={conta.status === 'vencido' ? 'badge-destructive' : 'badge-warning'}>
                        {conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-primary text-sm py-1 px-3"
                        onClick={() => setConfirmAction({ tipo: 'pagar', conta })}
                      >
                        Pagar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma conta a pagar pendente</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'dre' && (
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Demonstrativo de Resultados (DRE) - Mês Atual</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">Receita Bruta</span>
              <span className="font-bold text-foreground">R$ {dreData.receitaBruta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Taxas de Cartão</span>
              <span>R$ {dreData.taxasCartao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">(=) Receita Líquida</span>
              <span className="font-bold text-success">R$ {dreData.receitaLiquida.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Custo dos Produtos</span>
              <span>R$ {dreData.custoProdutos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">(=) Lucro Bruto</span>
              <span className="font-bold text-success">R$ {dreData.lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Despesas Operacionais</span>
              <span>R$ {dreData.despesasOperacionais.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 bg-muted/50 rounded-lg px-3">
              <span className="font-bold text-foreground">(=) Lucro Líquido</span>
              <span className={`font-bold text-xl ${dreData.lucroLiquido >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {dreData.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Nova Conta */}
      <Dialog open={novaContaOpen} onOpenChange={setNovaContaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {novaContaTipo === 'receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}
            </DialogTitle>
          </DialogHeader>
          <ContaForm 
            tipo={novaContaTipo}
            onSubmit={handleAddConta} 
            onCancel={() => setNovaContaOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Payment Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.tipo === 'receber' ? 'Confirmar Recebimento' : 'Confirmar Pagamento'}
        description={
          confirmAction?.tipo === 'receber' 
            ? `Confirma o recebimento de R$ ${confirmAction?.conta.valor.toFixed(2).replace('.', ',')} de ${confirmAction?.conta.descricao}?`
            : `Confirma o pagamento de R$ ${confirmAction?.conta.valor.toFixed(2).replace('.', ',')} para ${confirmAction?.conta.descricao}?`
        }
        confirmText={confirmAction?.tipo === 'receber' ? 'Receber' : 'Pagar'}
        onConfirm={handleConfirmPayment}
      />
    </div>
  );
}
