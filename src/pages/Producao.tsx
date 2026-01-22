import { useState } from 'react';
import { Plus, Factory, Clock, CheckCircle, AlertCircle, Play, Pause, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrdemProducao {
  id: string;
  numero: string;
  produto: string;
  quantidade: number;
  unidade: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  dataInicio: string;
  dataPrevisao: string;
  dataConclusao?: string;
  responsavel: string;
  etapaAtual: number;
  totalEtapas: number;
}

const ordensDemo: OrdemProducao[] = [
  { id: '1', numero: 'OP-001', produto: 'Pão Francês', quantidade: 50, unidade: 'KG', status: 'em_andamento', dataInicio: '2024-01-22 06:00', dataPrevisao: '2024-01-22 10:00', responsavel: 'João Silva', etapaAtual: 2, totalEtapas: 4 },
  { id: '2', numero: 'OP-002', produto: 'Bolo de Chocolate', quantidade: 10, unidade: 'UN', status: 'pendente', dataInicio: '2024-01-22 08:00', dataPrevisao: '2024-01-22 14:00', responsavel: 'Maria Santos', etapaAtual: 0, totalEtapas: 5 },
  { id: '3', numero: 'OP-003', produto: 'Croissant', quantidade: 30, unidade: 'UN', status: 'concluida', dataInicio: '2024-01-21 05:00', dataPrevisao: '2024-01-21 09:00', dataConclusao: '2024-01-21 08:45', responsavel: 'Pedro Costa', etapaAtual: 3, totalEtapas: 3 },
];

const statusConfig = {
  pendente: { label: 'Pendente', color: 'badge-warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-medium', icon: Play },
  concluida: { label: 'Concluída', color: 'badge-success', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'badge-destructive', icon: AlertCircle },
};

export default function Producao() {
  const [ordens] = useState<OrdemProducao[]>(ordensDemo);

  const ordensPorStatus = {
    pendente: ordens.filter((o) => o.status === 'pendente'),
    em_andamento: ordens.filter((o) => o.status === 'em_andamento'),
    concluida: ordens.filter((o) => o.status === 'concluida'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Produção (PCP)</h1>
          <p className="text-muted-foreground">Controle de produção e ordens de fabricação</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Factory className="w-4 h-4 mr-2" />
            Fichas Técnicas
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nova Ordem
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-warning">{ordensPorStatus.pendente.length}</p>
            </div>
            <Clock className="w-8 h-8 text-warning/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-primary">{ordensPorStatus.em_andamento.length}</p>
            </div>
            <Play className="w-8 h-8 text-primary/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Concluídas Hoje</p>
              <p className="text-2xl font-bold text-success">{ordensPorStatus.concluida.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total do Mês</p>
              <p className="text-2xl font-bold text-foreground">47</p>
            </div>
            <Factory className="w-8 h-8 text-muted-foreground/50" />
          </div>
        </div>
      </div>

      {/* Lista de Ordens */}
      <div className="stat-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Ordens de Produção</h2>
        <div className="space-y-4">
          {ordens.map((ordem) => {
            const config = statusConfig[ordem.status];
            const StatusIcon = config.icon;
            const progresso = (ordem.etapaAtual / ordem.totalEtapas) * 100;

            return (
              <div
                key={ordem.id}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Factory className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{ordem.numero}</span>
                        <span className={config.color}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{ordem.produto}</p>
                      <p className="text-sm text-muted-foreground">
                        {ordem.quantidade} {ordem.unidade} • {ordem.responsavel}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {ordem.status === 'pendente' && (
                      <button className="btn-primary text-sm py-1.5 px-3">
                        <Play className="w-4 h-4 mr-1" />
                        Iniciar
                      </button>
                    )}
                    {ordem.status === 'em_andamento' && (
                      <button className="btn-success text-sm py-1.5 px-3">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Concluir
                      </button>
                    )}
                    <button className="btn-ghost text-sm py-1.5 px-3">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {ordem.status !== 'concluida' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Etapa {ordem.etapaAtual} de {ordem.totalEtapas}</span>
                      <span>{progresso.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${progresso}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span>Início: {new Date(ordem.dataInicio).toLocaleString('pt-BR')}</span>
                  <span>Previsão: {new Date(ordem.dataPrevisao).toLocaleString('pt-BR')}</span>
                  {ordem.dataConclusao && (
                    <span className="text-success">Concluído: {new Date(ordem.dataConclusao).toLocaleString('pt-BR')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
