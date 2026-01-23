import { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import { api, API_ENDPOINTS } from '@/services/api';
import { getCachedData, setCachedData } from '@/services/indexedDB';

interface DashboardStats {
  vendasHoje: number;
  numeroVendas: number;
  totalProdutos: number;
  produtosBaixoEstoque: number;
  totalClientes: number;
}

interface VendaSemanal {
  name: string;
  valor: number;
}

interface ProdutoMaisVendido {
  name: string;
  vendas: number;
}

interface UltimaVenda {
  id: string;
  cliente: string;
  valor: number;
  forma: string;
  hora: string;
}

interface Alerta {
  tipo: string;
  mensagem: string;
  urgencia: 'alta' | 'media' | 'baixa';
}

const defaultStats: DashboardStats = {
  vendasHoje: 0,
  numeroVendas: 0,
  totalProdutos: 0,
  produtosBaixoEstoque: 0,
  totalClientes: 0,
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>(defaultStats);
  const [vendaSemana, setVendaSemana] = useState<VendaSemanal[]>([]);
  const [produtosMaisVendidos, setProdutosMaisVendidos] = useState<ProdutoMaisVendido[]>([]);
  const [ultimasVendas, setUltimasVendas] = useState<UltimaVenda[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    
    try {
      // Tentar carregar do cache primeiro
      const cachedStats = await getCachedData<DashboardStats>('dashboard_stats');
      if (cachedStats) {
        setStats(cachedStats);
      }

      // Buscar dados frescos da API local
      const [
        produtosRes,
        clientesRes,
        vendasRes,
      ] = await Promise.all([
        api.get<{ id: string; estoque_atual: number; estoque_minimo: number }[]>(API_ENDPOINTS.produtos),
        api.get<{ id: string }[]>(API_ENDPOINTS.clientes),
        api.get<{ id: string; valor_liquido: number; forma_pagamento: string; created_at: string; cliente_nome?: string }[]>(API_ENDPOINTS.vendas),
      ]);

      const produtos = produtosRes.data || [];
      const clientes = clientesRes.data || [];
      const vendas = vendasRes.data || [];

      // Calcular estatísticas
      const hoje = new Date().toISOString().split('T')[0];
      const vendasHoje = vendas.filter(v => v.created_at?.startsWith(hoje));
      const produtosBaixoEstoque = produtos.filter(p => (p.estoque_atual || 0) <= (p.estoque_minimo || 0));

      const newStats: DashboardStats = {
        vendasHoje: vendasHoje.reduce((acc, v) => acc + (v.valor_liquido || 0), 0),
        numeroVendas: vendasHoje.length,
        totalProdutos: produtos.length,
        produtosBaixoEstoque: produtosBaixoEstoque.length,
        totalClientes: clientes.length,
      };
      
      setStats(newStats);
      await setCachedData('dashboard_stats', newStats, 5 * 60 * 1000); // Cache 5 min

      // Vendas da semana (últimos 7 dias)
      const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const vendasPorDia: VendaSemanal[] = [];
      for (let i = 6; i >= 0; i--) {
        const data = new Date();
        data.setDate(data.getDate() - i);
        const dataStr = data.toISOString().split('T')[0];
        const vendasDoDia = vendas.filter(v => v.created_at?.startsWith(dataStr));
        vendasPorDia.push({
          name: dias[data.getDay()],
          valor: vendasDoDia.reduce((acc, v) => acc + (v.valor_liquido || 0), 0),
        });
      }
      setVendaSemana(vendasPorDia);

      // Últimas vendas
      const ultimas = vendasHoje
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 4)
        .map(v => ({
          id: v.id.slice(0, 8),
          cliente: v.cliente_nome || 'Cliente',
          valor: v.valor_liquido || 0,
          forma: v.forma_pagamento || '-',
          hora: new Date(v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        }));
      setUltimasVendas(ultimas);

      // Alertas
      const novosAlertas: Alerta[] = [];
      if (produtosBaixoEstoque.length > 0) {
        novosAlertas.push({
          tipo: 'estoque',
          mensagem: `${produtosBaixoEstoque.length} produto(s) com estoque baixo`,
          urgencia: 'alta',
        });
      }
      setAlertas(novosAlertas);

      // Produtos mais vendidos (placeholder - precisa de dados de venda_itens)
      setProdutosMaisVendidos([]);

    } catch (error) {
      console.warn('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <Link to="/pdv" className="btn-primary">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Abrir PDV
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vendas Hoje</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                R$ {stats.vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {stats.vendasHoje > 0 && (
                <div className="flex items-center gap-1 mt-2 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.numeroVendas} vendas</span>
                </div>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Nº de Vendas</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.numeroVendas}</p>
              <p className="text-xs text-muted-foreground mt-2">Hoje</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Produtos</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalProdutos}</p>
              {stats.produtosBaixoEstoque > 0 && (
                <div className="flex items-center gap-1 mt-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.produtosBaixoEstoque} baixo estoque</span>
                </div>
              )}
              {stats.produtosBaixoEstoque === 0 && (
                <p className="text-xs text-muted-foreground mt-2">Cadastrados</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clientes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats.totalClientes}</p>
              <p className="text-xs text-muted-foreground mt-2">Cadastrados</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-chart-4/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-chart-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 stat-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Vendas da Semana</h2>
              <p className="text-sm text-muted-foreground">Faturamento diário</p>
            </div>
          </div>
          {vendaSemana.length > 0 && vendaSemana.some(v => v.valor > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={vendaSemana}>
                <defs>
                  <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
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
                  formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="hsl(var(--primary))"
                  fillOpacity={1}
                  fill="url(#colorVendas)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-4 opacity-50" />
              <p>Nenhuma venda registrada esta semana</p>
              <Link to="/pdv" className="mt-4 text-primary hover:underline">
                Abrir PDV para vender
              </Link>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Alertas</h2>
            {alertas.length > 0 && <span className="badge-warning">{alertas.length}</span>}
          </div>
          {alertas.length > 0 ? (
            <div className="space-y-3">
              {alertas.map((alerta, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <AlertTriangle
                    className={`w-5 h-5 mt-0.5 ${
                      alerta.urgencia === 'alta'
                        ? 'text-destructive'
                        : alerta.urgencia === 'media'
                        ? 'text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{alerta.mensagem}</p>
                    <p className="text-xs text-muted-foreground capitalize">{alerta.tipo}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum alerta no momento</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Produtos Mais Vendidos</h2>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
          </div>
          {produtosMaisVendidos.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={produtosMaisVendidos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma venda registrada</p>
              <Link to="/estoque" className="mt-3 text-primary hover:underline text-sm">
                Cadastrar produtos
              </Link>
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Últimas Vendas</h2>
              <p className="text-sm text-muted-foreground">Hoje</p>
            </div>
            <Link to="/relatorios" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {ultimasVendas.length > 0 ? (
            <div className="space-y-1">
              {ultimasVendas.map((venda) => (
                <div key={venda.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-sm font-medium text-accent-foreground">
                        {venda.cliente.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{venda.cliente}</p>
                      <p className="text-xs text-muted-foreground">{venda.forma} • {venda.hora}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma venda hoje</p>
              <Link to="/pdv" className="mt-2 text-primary hover:underline text-sm">
                Realizar primeira venda
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
