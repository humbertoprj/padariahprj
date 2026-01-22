import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';

const vendaData = [
  { name: 'Seg', valor: 4000 },
  { name: 'Ter', valor: 3000 },
  { name: 'Qua', valor: 5000 },
  { name: 'Qui', valor: 2780 },
  { name: 'Sex', valor: 6890 },
  { name: 'Sáb', valor: 8390 },
  { name: 'Dom', valor: 4490 },
];

const produtosData = [
  { name: 'Produto A', vendas: 120 },
  { name: 'Produto B', vendas: 98 },
  { name: 'Produto C', vendas: 86 },
  { name: 'Produto D', vendas: 72 },
  { name: 'Produto E', vendas: 65 },
];

const alertas = [
  { tipo: 'estoque', mensagem: '5 produtos com estoque baixo', urgencia: 'alta' },
  { tipo: 'financeiro', mensagem: '3 contas vencem hoje', urgencia: 'media' },
  { tipo: 'producao', mensagem: '2 ordens de produção pendentes', urgencia: 'baixa' },
];

const ultimasVendas = [
  { id: 'V001', cliente: 'João Silva', valor: 250.00, forma: 'PIX', hora: '10:30' },
  { id: 'V002', cliente: 'Maria Santos', valor: 180.50, forma: 'Crédito', hora: '10:15' },
  { id: 'V003', cliente: 'Pedro Costa', valor: 320.00, forma: 'Débito', hora: '09:45' },
  { id: 'V004', cliente: 'Ana Oliveira', valor: 95.00, forma: 'Dinheiro', hora: '09:20' },
];

export default function Dashboard() {
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
              <p className="text-2xl font-bold text-foreground mt-1">R$ 12.450,00</p>
              <div className="flex items-center gap-1 mt-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+12%</span>
                <span className="text-xs text-muted-foreground">vs ontem</span>
              </div>
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
              <p className="text-2xl font-bold text-foreground mt-1">48</p>
              <div className="flex items-center gap-1 mt-2 text-success">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-medium">+8%</span>
                <span className="text-xs text-muted-foreground">vs ontem</span>
              </div>
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
              <p className="text-2xl font-bold text-foreground mt-1">324</p>
              <div className="flex items-center gap-1 mt-2 text-warning">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">5 baixo estoque</span>
              </div>
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
              <p className="text-2xl font-bold text-foreground mt-1">1.284</p>
              <div className="flex items-center gap-1 mt-2 text-primary">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">+23 este mês</span>
              </div>
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
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={vendaData}>
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
        </div>

        {/* Alerts */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Alertas</h2>
            <span className="badge-warning">{alertas.length}</span>
          </div>
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
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={produtosData} layout="vertical">
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
                  R$ {venda.valor.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
