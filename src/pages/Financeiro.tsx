import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Receipt, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const fluxoCaixaData = [
  { name: 'Jan', receitas: 45000, despesas: 32000 },
  { name: 'Fev', receitas: 52000, despesas: 38000 },
  { name: 'Mar', receitas: 48000, despesas: 35000 },
  { name: 'Abr', receitas: 61000, despesas: 42000 },
  { name: 'Mai', receitas: 55000, despesas: 39000 },
  { name: 'Jun', receitas: 67000, despesas: 45000 },
];

const despesasPorCategoria = [
  { name: 'Fornecedores', value: 35000, color: 'hsl(var(--primary))' },
  { name: 'Salários', value: 25000, color: 'hsl(var(--success))' },
  { name: 'Impostos', value: 12000, color: 'hsl(var(--warning))' },
  { name: 'Operacional', value: 8000, color: 'hsl(var(--chart-4))' },
  { name: 'Outros', value: 5000, color: 'hsl(var(--chart-5))' },
];

const contasReceber = [
  { id: '1', cliente: 'João Silva', valor: 1500, vencimento: '2024-01-25', status: 'pendente' },
  { id: '2', cliente: 'Maria Santos', valor: 2800, vencimento: '2024-01-22', status: 'vencido' },
  { id: '3', cliente: 'Pedro Costa', valor: 950, vencimento: '2024-01-28', status: 'pendente' },
];

const contasPagar = [
  { id: '1', fornecedor: 'Fornecedor ABC', valor: 5500, vencimento: '2024-01-23', status: 'pendente' },
  { id: '2', fornecedor: 'Distribuidora XYZ', valor: 3200, vencimento: '2024-01-22', status: 'vencido' },
  { id: '3', fornecedor: 'Energia Elétrica', valor: 1800, vencimento: '2024-01-30', status: 'pendente' },
];

export default function Financeiro() {
  const [activeTab, setActiveTab] = useState<'visao-geral' | 'receber' | 'pagar' | 'dre'>('visao-geral');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Financeiro</h1>
          <p className="text-muted-foreground">Controle financeiro completo</p>
        </div>
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
                  <p className="text-2xl font-bold text-success">R$ 67.450</p>
                  <div className="flex items-center gap-1 mt-1 text-success text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+12% vs mês anterior</span>
                  </div>
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
                  <p className="text-2xl font-bold text-destructive">R$ 45.200</p>
                  <div className="flex items-center gap-1 mt-1 text-destructive text-sm">
                    <ArrowDownRight className="w-4 h-4" />
                    <span>+5% vs mês anterior</span>
                  </div>
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
                  <p className="text-2xl font-bold text-primary">R$ 12.850</p>
                  <p className="text-sm text-muted-foreground mt-1">15 títulos</p>
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
                  <p className="text-2xl font-bold text-warning">R$ 8.340</p>
                  <p className="text-sm text-muted-foreground mt-1">8 títulos</p>
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
              <h2 className="text-lg font-semibold text-foreground mb-4">Fluxo de Caixa</h2>
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
                  />
                  <Area type="monotone" dataKey="receitas" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorReceitas)" strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="stat-card">
              <h2 className="text-lg font-semibold text-foreground mb-4">Despesas por Categoria</h2>
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
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {despesasPorCategoria.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-foreground">R$ {item.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'receber' && (
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contas a Receber</h2>
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
                  <td className="font-medium">{conta.cliente}</td>
                  <td className="text-right">R$ {conta.valor.toFixed(2).replace('.', ',')}</td>
                  <td>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="text-center">
                    <span className={conta.status === 'vencido' ? 'badge-destructive' : 'badge-warning'}>
                      {conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-success text-sm py-1 px-3">Receber</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'pagar' && (
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Contas a Pagar</h2>
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
                  <td className="font-medium">{conta.fornecedor}</td>
                  <td className="text-right">R$ {conta.valor.toFixed(2).replace('.', ',')}</td>
                  <td>{new Date(conta.vencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="text-center">
                    <span className={conta.status === 'vencido' ? 'badge-destructive' : 'badge-warning'}>
                      {conta.status === 'vencido' ? 'Vencido' : 'Pendente'}
                    </span>
                  </td>
                  <td>
                    <button className="btn-primary text-sm py-1 px-3">Pagar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'dre' && (
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Demonstrativo de Resultados (DRE)</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">Receita Bruta</span>
              <span className="font-bold text-foreground">R$ 67.450,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Taxas de Cartão</span>
              <span>R$ 1.685,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">(=) Receita Líquida</span>
              <span className="font-bold text-success">R$ 65.765,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Custo dos Produtos</span>
              <span>R$ 28.500,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="font-medium">(=) Lucro Bruto</span>
              <span className="font-bold text-success">R$ 37.265,00</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border text-muted-foreground">
              <span className="pl-4">(-) Despesas Operacionais</span>
              <span>R$ 16.700,00</span>
            </div>
            <div className="flex justify-between py-2 bg-success/10 rounded-lg px-3">
              <span className="font-bold text-success">(=) Lucro Líquido</span>
              <span className="font-bold text-success text-xl">R$ 20.565,00</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
