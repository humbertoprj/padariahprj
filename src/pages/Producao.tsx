import { useState } from 'react';
import { Plus, Factory, Clock, CheckCircle, AlertCircle, Play, Eye, ArrowLeft, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrdemProducaoForm, OrdemProducaoFormData } from '@/components/forms/OrdemProducaoForm';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface OrdemProducao {
  id: string;
  numero: string;
  produto: string;
  produtoId: string;
  quantidade: number;
  quantidadeProduzida: number;
  unidade: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  dataInicio: string;
  dataPrevisao: string;
  dataConclusao?: string;
  responsavel: string;
  etapaAtual: number;
  totalEtapas: number;
  observacoes?: string;
}

interface FichaTecnica {
  id: string;
  produtoId: string;
  produtoNome: string;
  insumos: { insumoNome: string; quantidade: number; unidade: string; perdaPercentual: number }[];
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'badge-warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-medium', icon: Play },
  concluida: { label: 'Concluída', color: 'badge-success', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'badge-destructive', icon: AlertCircle },
};

export default function Producao() {
  const { toast } = useToast();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [fichasTecnicas] = useState<FichaTecnica[]>([]);
  const [produtosFabricados] = useState<{ id: string; nome: string }[]>([]);
  const [view, setView] = useState<'ordens' | 'fichas'>('ordens');
  const [novaOrdemOpen, setNovaOrdemOpen] = useState(false);
  const [ordemDetalhes, setOrdemDetalhes] = useState<OrdemProducao | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'iniciar' | 'concluir'; ordem: OrdemProducao } | null>(null);

  const ordensPorStatus = {
    pendente: ordens.filter((o) => o.status === 'pendente'),
    em_andamento: ordens.filter((o) => o.status === 'em_andamento'),
    concluida: ordens.filter((o) => o.status === 'concluida'),
  };

  const handleCreateOrdem = (data: OrdemProducaoFormData) => {
    const produto = produtosFabricados.find(p => p.id === data.produtoId);
    if (!produto) return;

    const novaOrdem: OrdemProducao = {
      id: crypto.randomUUID(),
      numero: `OP-${String(ordens.length + 1).padStart(3, '0')}`,
      produto: produto.nome,
      produtoId: data.produtoId,
      quantidade: data.quantidade,
      quantidadeProduzida: 0,
      unidade: 'UN',
      status: 'pendente',
      dataInicio: new Date().toISOString(),
      dataPrevisao: data.dataPrevista,
      responsavel: 'Operador',
      etapaAtual: 0,
      totalEtapas: 4,
      observacoes: data.observacoes,
    };

    setOrdens([...ordens, novaOrdem]);
    setNovaOrdemOpen(false);
    toast({ title: 'Ordem criada', description: `${novaOrdem.numero} foi criada com sucesso.` });
  };

  const handleIniciarOrdem = (ordem: OrdemProducao) => {
    setOrdens(ordens.map(o => 
      o.id === ordem.id 
        ? { ...o, status: 'em_andamento' as const, dataInicio: new Date().toISOString(), etapaAtual: 1 }
        : o
    ));
    setConfirmAction(null);
    toast({ title: 'Produção iniciada', description: `${ordem.numero} está em andamento.` });
  };

  const handleConcluirOrdem = (ordem: OrdemProducao) => {
    setOrdens(ordens.map(o => 
      o.id === ordem.id 
        ? { 
            ...o, 
            status: 'concluida' as const, 
            dataConclusao: new Date().toISOString(), 
            etapaAtual: o.totalEtapas,
            quantidadeProduzida: o.quantidade 
          }
        : o
    ));
    setConfirmAction(null);
    toast({ title: 'Produção concluída', description: `${ordem.numero} foi finalizada.` });
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
          <button 
            className={cn("btn-secondary", view === 'fichas' && "bg-primary text-primary-foreground")}
            onClick={() => setView(view === 'ordens' ? 'fichas' : 'ordens')}
          >
            {view === 'fichas' ? (
              <>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </>
            ) : (
              <>
                <Factory className="w-4 h-4 mr-2" />
                Fichas Técnicas
              </>
            )}
          </button>
          {view === 'ordens' && (
            <button className="btn-primary" onClick={() => setNovaOrdemOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ordem
            </button>
          )}
        </div>
      </div>

      {view === 'ordens' ? (
        <>
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
                  <p className="text-2xl font-bold text-foreground">{ordens.length}</p>
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
                          <button 
                            className="btn-primary text-sm py-1.5 px-3"
                            onClick={() => setConfirmAction({ type: 'iniciar', ordem })}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Iniciar
                          </button>
                        )}
                        {ordem.status === 'em_andamento' && (
                          <button 
                            className="btn-success text-sm py-1.5 px-3"
                            onClick={() => setConfirmAction({ type: 'concluir', ordem })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Concluir
                          </button>
                        )}
                        <button 
                          className="btn-ghost text-sm py-1.5 px-3"
                          onClick={() => setOrdemDetalhes(ordem)}
                        >
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
        </>
      ) : (
        /* Fichas Técnicas */
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Fichas Técnicas</h2>
          <div className="space-y-4">
            {fichasTecnicas.map((ficha) => (
              <div key={ficha.id} className="p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{ficha.produtoNome}</p>
                    <p className="text-sm text-muted-foreground">{ficha.insumos.length} insumos</p>
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Insumo</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Quantidade</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Perda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ficha.insumos.map((insumo, idx) => (
                      <tr key={idx} className="border-b border-border/50 last:border-0">
                        <td className="py-2 text-foreground">{insumo.insumoNome}</td>
                        <td className="py-2 text-right text-foreground">{insumo.quantidade} {insumo.unidade}</td>
                        <td className="py-2 text-right text-muted-foreground">{insumo.perdaPercentual}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog Nova Ordem */}
      <Dialog open={novaOrdemOpen} onOpenChange={setNovaOrdemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
          </DialogHeader>
          <OrdemProducaoForm 
            produtos={produtosFabricados}
            onSubmit={handleCreateOrdem} 
            onCancel={() => setNovaOrdemOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Detalhes da Ordem */}
      <Dialog open={!!ordemDetalhes} onOpenChange={(open) => !open && setOrdemDetalhes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Ordem {ordemDetalhes?.numero}</DialogTitle>
          </DialogHeader>
          {ordemDetalhes && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{ordemDetalhes.produto}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade</p>
                  <p className="font-medium">{ordemDetalhes.quantidade} {ordemDetalhes.unidade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={statusConfig[ordemDetalhes.status].color}>
                    {statusConfig[ordemDetalhes.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{ordemDetalhes.responsavel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Produzido</p>
                  <p className="font-medium">{ordemDetalhes.quantidadeProduzida} / {ordemDetalhes.quantidade}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Progresso</p>
                  <p className="font-medium">{((ordemDetalhes.etapaAtual / ordemDetalhes.totalEtapas) * 100).toFixed(0)}%</p>
                </div>
              </div>
              {ordemDetalhes.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground">Observações</p>
                  <p className="text-foreground">{ordemDetalhes.observacoes}</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOrdemDetalhes(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Actions */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'iniciar' ? 'Iniciar Produção' : 'Concluir Produção'}
        description={
          confirmAction?.type === 'iniciar' 
            ? `Deseja iniciar a produção da ordem ${confirmAction.ordem.numero}?`
            : `Deseja concluir a ordem ${confirmAction?.ordem.numero}? Isso atualizará o estoque automaticamente.`
        }
        confirmText={confirmAction?.type === 'iniciar' ? 'Iniciar' : 'Concluir'}
        onConfirm={() => {
          if (confirmAction?.type === 'iniciar') {
            handleIniciarOrdem(confirmAction.ordem);
          } else if (confirmAction?.type === 'concluir') {
            handleConcluirOrdem(confirmAction.ordem);
          }
        }}
      />
    </div>
  );
}
