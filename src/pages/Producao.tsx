import { useState, useEffect } from 'react';
import { Plus, Factory, Clock, CheckCircle, AlertCircle, Play, Eye, ArrowLeft, Package, Loader2, RefreshCw, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { OrdemProducaoForm, OrdemProducaoFormData } from '@/components/forms/OrdemProducaoForm';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, API_ENDPOINTS } from '@/services/api';

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
  insumos: { insumoId: string; insumoNome: string; quantidade: number; unidade: string; perdaPercentual: number; custo: number }[];
  custoTotal: number;
}

interface ProdutoFabricado {
  id: string;
  nome: string;
  unidade: string;
  custo: number;
  preco: number;
}

interface Insumo {
  id: string;
  nome: string;
  unidade: string;
  custo: number;
  estoque: number;
}

const statusConfig = {
  pendente: { label: 'Pendente', color: 'badge-warning', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-xs font-medium', icon: Play },
  concluida: { label: 'Concluída', color: 'badge-success', icon: CheckCircle },
  cancelada: { label: 'Cancelada', color: 'badge-destructive', icon: AlertCircle },
};

const ERRO_SERVIDOR_OFFLINE = 'Erro: Servidor Local não encontrado. Certifique-se de que o CMD está aberto no computador principal.';

export default function Producao() {
  const { toast } = useToast();
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [fichasTecnicas, setFichasTecnicas] = useState<FichaTecnica[]>([]);
  const [produtosFabricados, setProdutosFabricados] = useState<ProdutoFabricado[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  
  const [view, setView] = useState<'ordens' | 'fichas'>('ordens');
  const [novaOrdemOpen, setNovaOrdemOpen] = useState(false);
  const [novaFichaOpen, setNovaFichaOpen] = useState(false);
  const [ordemDetalhes, setOrdemDetalhes] = useState<OrdemProducao | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'iniciar' | 'concluir'; ordem: OrdemProducao } | null>(null);

  // Estado para nova ficha técnica
  const [novaProdutoFichaId, setNovaProdutoFichaId] = useState('');
  const [novaFichaInsumos, setNovaFichaInsumos] = useState<{ insumoId: string; quantidade: number; perda: number }[]>([]);

  // Carregar dados da API local
  const carregarDados = async () => {
    setLoading(true);
    setErro(null);
    
    try {
      // Buscar produtos, ordens e fichas técnicas
      const [produtosRes, ordensRes, fichasRes] = await Promise.all([
        api.get<any[]>(API_ENDPOINTS.produtos),
        api.get<any[]>(API_ENDPOINTS.ordens),
        api.get<any[]>(API_ENDPOINTS.fichasTecnicas),
      ]);
      
      if (produtosRes.error && produtosRes.status === 0) {
        setErro(ERRO_SERVIDOR_OFFLINE);
        setLoading(false);
        return;
      }
      
      const produtos = produtosRes.data || [];
      
      // Separar produtos fabricados (que podem ser produzidos) e insumos (matéria-prima)
      const fabricados = produtos
        .filter((p: any) => p.fabricado === true || p.fabricado === 1)
        .map((p: any) => ({
          id: p.id,
          nome: p.nome,
          unidade: p.unidade || 'UN',
          custo: p.custo || 0,
          preco: p.preco || 0,
        }));
      setProdutosFabricados(fabricados);
      
      // Insumos são produtos que não são fabricados (matéria-prima)
      const insumosLista = produtos
        .filter((p: any) => !p.fabricado || p.fabricado === 0)
        .map((p: any) => ({
          id: p.id,
          nome: p.nome,
          unidade: p.unidade || 'UN',
          custo: p.custo || 0,
          estoque: p.estoque_atual || 0,
        }));
      setInsumos(insumosLista);
      
      // Mapear ordens de produção
      const ordensData = ordensRes.data || [];
      const ordensMapeadas: OrdemProducao[] = ordensData.map((o: any, idx: number) => {
        const produto = fabricados.find((p: any) => p.id === o.produto_id);
        return {
          id: o.id,
          numero: `OP-${String(idx + 1).padStart(3, '0')}`,
          produto: produto?.nome || o.produto_nome || 'Produto',
          produtoId: o.produto_id,
          quantidade: o.quantidade || 0,
          quantidadeProduzida: o.quantidade_produzida || 0,
          unidade: produto?.unidade || 'UN',
          status: o.status || 'pendente',
          dataInicio: o.data_inicio || o.created_at,
          dataPrevisao: o.data_prevista || o.created_at,
          dataConclusao: o.data_conclusao,
          responsavel: 'Operador',
          etapaAtual: o.status === 'concluida' ? 4 : o.status === 'em_andamento' ? 2 : 0,
          totalEtapas: 4,
          observacoes: o.observacoes,
        };
      });
      setOrdens(ordensMapeadas);
      
      // Mapear fichas técnicas
      const fichasData = fichasRes.data || [];
      // Agrupar por produto
      const fichasAgrupadas: Record<string, FichaTecnica> = {};
      fichasData.forEach((f: any) => {
        const produto = fabricados.find((p: any) => p.id === f.produto_id);
        
        // Tratar ingredientes que podem vir como string JSON do SQLite
        let insumosFicha = [];
        try {
          insumosFicha = typeof f.ingredientes === 'string' ? JSON.parse(f.ingredientes) : (f.ingredientes || []);
        } catch (e) {
          console.warn('Erro ao parsear ingredientes:', e);
        }

        if (!fichasAgrupadas[f.produto_id]) {
          fichasAgrupadas[f.produto_id] = {
            id: f.id,
            produtoId: f.produto_id,
            produtoNome: produto?.nome || f.nome || 'Produto',
            insumos: [],
            custoTotal: 0,
          };
        }
        
        insumosFicha.forEach((item: any) => {
          const insumoInfo = insumosLista.find((i: any) => i.id === item.insumoId);
          const custoInsumo = (insumoInfo?.custo || 0) * (item.quantidade || 0) * (1 + (item.perda || 0) / 100);
          
          fichasAgrupadas[f.produto_id].insumos.push({
            insumoId: item.insumoId,
            insumoNome: insumoInfo?.nome || 'Insumo',
            quantidade: item.quantidade || 0,
            unidade: insumoInfo?.unidade || 'UN',
            perdaPercentual: item.perda || 0,
            custo: custoInsumo,
          });
          fichasAgrupadas[f.produto_id].custoTotal += custoInsumo;
        });
      });
      setFichasTecnicas(Object.values(fichasAgrupadas));
      
    } catch (error) {
      console.error('Erro ao carregar produção:', error);
      setErro('Falha ao carregar dados de produção.');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const ordensPorStatus = {
    pendente: ordens.filter((o) => o.status === 'pendente'),
    em_andamento: ordens.filter((o) => o.status === 'em_andamento'),
    concluida: ordens.filter((o) => o.status === 'concluida'),
  };

  // Criar ordem de produção
  const handleCreateOrdem = async (data: OrdemProducaoFormData) => {
    const produto = produtosFabricados.find(p => p.id === data.produtoId);
    if (!produto) return;

    const payload = {
      produto_id: data.produtoId,
      quantidade: data.quantidade,
      data_prevista: data.dataPrevista,
      observacoes: data.observacoes,
      status: 'pendente',
    };
    
    const response = await api.post<any>(API_ENDPOINTS.ordens, payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao criar ordem', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarDados();
      setNovaOrdemOpen(false);
      toast({ title: 'Ordem criada', description: `Ordem de produção para ${produto.nome} foi criada.` });
    }
  };

  // Iniciar ordem
  const handleIniciarOrdem = async (ordem: OrdemProducao) => {
    const response = await api.patch<any>(API_ENDPOINTS.ordem(ordem.id), {
      status: 'em_andamento',
      data_inicio: new Date().toISOString(),
    });
    
    if (response.error) {
      toast({ 
        title: 'Erro', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarDados();
      toast({ title: 'Produção iniciada', description: `${ordem.numero} está em andamento.` });
    }
    setConfirmAction(null);
  };

  // Concluir ordem (baixa de insumos e entrada do produto)
  const handleConcluirOrdem = async (ordem: OrdemProducao) => {
    const ficha = fichasTecnicas.find(f => f.produtoId === ordem.produtoId);
    
    const response = await api.patch<any>(API_ENDPOINTS.ordem(ordem.id), {
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
      quantidade_produzida: ordem.quantidade,
      baixa_insumos: ficha?.insumos.map(i => ({
        produto_id: i.insumoId,
        quantidade: i.quantidade * ordem.quantidade * (1 + i.perdaPercentual / 100),
      })) || [],
      entrada_produto: {
        produto_id: ordem.produtoId,
        quantidade: ordem.quantidade,
      },
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
        title: 'Produção concluída', 
        description: `${ordem.numero} foi finalizada. Estoque atualizado.` 
      });
    }
    setConfirmAction(null);
  };

  const adicionarInsumoFicha = () => {
    setNovaFichaInsumos([...novaFichaInsumos, { insumoId: '', quantidade: 0, perda: 0 }]);
  };

  const removerInsumoFicha = (index: number) => {
    setNovaFichaInsumos(novaFichaInsumos.filter((_, i) => i !== index));
  };

  const custoNovaFicha = novaFichaInsumos.reduce((acc, item) => {
    const insumo = insumos.find(i => i.id === item.insumoId);
    return acc + (insumo?.custo || 0) * item.quantidade * (1 + item.perda / 100);
  }, 0);

  const handleSalvarFicha = async () => {
    if (!novaProdutoFichaId) {
      toast({ title: 'Erro', description: 'Selecione um produto', variant: 'destructive' });
      return;
    }
    if (novaFichaInsumos.length === 0) {
      toast({ title: 'Erro', description: 'Adicione pelo menos um ingrediente', variant: 'destructive' });
      return;
    }

    const produto = produtosFabricados.find(p => p.id === novaProdutoFichaId);
    const payload = {
      produto_pai_id: novaProdutoFichaId,
      nome: produto?.nome,
      ingredientes: novaFichaInsumos
    };

    const response = await api.post<any>(API_ENDPOINTS.fichasTecnicas, payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao salvar receita', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarDados();
      setNovaFichaOpen(false);
      setNovaProdutoFichaId('');
      setNovaFichaInsumos([]);
      toast({ title: 'Receita salva', description: 'A ficha técnica foi cadastrada com sucesso.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="module-title">Produção & Receitas</h1>
          <p className="text-muted-foreground">Gestão de produtos fabricados e fichas técnicas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={carregarDados}>
            <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </button>
          <div className="flex bg-muted p-1 rounded-lg">
            <button
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'ordens' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setView('ordens')}
            >
              Ordens de Produção
            </button>
            <button
              className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", view === 'fichas' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => setView('fichas')}
            >
              Fichas Técnicas
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados de produção...</p>
        </div>
      ) : erro ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-destructive opacity-50" />
          <p className="text-muted-foreground max-w-md">{erro}</p>
          <Button onClick={carregarDados}>Tentar Novamente</Button>
        </div>
      ) : view === 'ordens' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Pendentes</p>
              <p className="text-2xl font-bold text-warning">{ordensPorStatus.pendente.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Em Andamento</p>
              <p className="text-2xl font-bold text-primary">{ordensPorStatus.em_andamento.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Concluídas (Hoje)</p>
              <p className="text-2xl font-bold text-success">{ordensPorStatus.concluida.length}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">Ordens de Produção</h2>
              <button className="btn-primary" onClick={() => setNovaOrdemOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Ordem
              </button>
            </div>

            {ordens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de produção encontrada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {ordens.map((ordem) => {
                  const StatusIcon = statusConfig[ordem.status].icon;
                  const progresso = (ordem.etapaAtual / ordem.totalEtapas) * 100;
                  
                  return (
                    <div key={ordem.id} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Factory className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{ordem.numero}</span>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusConfig[ordem.status].color)}>
                                {statusConfig[ordem.status].label}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{ordem.produto}</p>
                            <p className="text-xs text-muted-foreground">{ordem.quantidade} {ordem.unidade}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
            )}
          </div>
        </>
      ) : (
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Fichas Técnicas (Receitas)</h2>
          {fichasTecnicas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ficha técnica cadastrada</p>
              <button className="btn-primary mt-4" onClick={() => setNovaFichaOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Receita
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fichasTecnicas.map((ficha) => (
                <div key={ficha.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ficha.produtoNome}</p>
                        <p className="text-sm text-muted-foreground">{ficha.insumos.length} insumos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Custo de Produção</p>
                      <p className="text-lg font-bold text-primary">R$ {ficha.custoTotal.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-muted-foreground font-medium">Insumo</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Quantidade</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Perda</th>
                        <th className="text-right py-2 text-muted-foreground font-medium">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ficha.insumos.map((insumo, idx) => (
                        <tr key={idx} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-foreground">{insumo.insumoNome}</td>
                          <td className="py-2 text-right text-foreground">{insumo.quantidade} {insumo.unidade}</td>
                          <td className="py-2 text-right text-muted-foreground">{insumo.perdaPercentual}%</td>
                          <td className="py-2 text-right text-foreground">R$ {insumo.custo.toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={novaOrdemOpen} onOpenChange={setNovaOrdemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
          </DialogHeader>
          {produtosFabricados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto fabricado cadastrado</p>
            </div>
          ) : (
            <OrdemProducaoForm 
              produtos={produtosFabricados}
              onSubmit={handleCreateOrdem} 
              onCancel={() => setNovaOrdemOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={novaFichaOpen} onOpenChange={setNovaFichaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Ficha Técnica (Receita)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Produto a Fabricar</label>
              <select 
                value={novaProdutoFichaId}
                onChange={(e) => setNovaProdutoFichaId(e.target.value)}
                className="input-field"
              >
                <option value="">Selecione o produto</option>
                {produtosFabricados.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Ingredientes (Insumos)</label>
                <Button size="sm" variant="outline" onClick={adicionarInsumoFicha}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {novaFichaInsumos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground border border-dashed border-border rounded-lg">
                  <p className="text-sm">Clique em "Adicionar" para incluir ingredientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {novaFichaInsumos.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        value={item.insumoId}
                        onChange={(e) => {
                          const updated = [...novaFichaInsumos];
                          updated[idx].insumoId = e.target.value;
                          setNovaFichaInsumos(updated);
                        }}
                        className="input-field flex-1"
                      >
                        <option value="">Selecione</option>
                        {insumos.map(i => (
                          <option key={i.id} value={i.id}>{i.nome} (R$ {i.custo.toFixed(2)})</option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantidade}
                        onChange={(e) => {
                          const updated = [...novaFichaInsumos];
                          updated[idx].quantidade = parseFloat(e.target.value) || 0;
                          setNovaFichaInsumos(updated);
                        }}
                        placeholder="Qtd"
                        className="w-20"
                      />
                      <Input
                        type="number"
                        value={item.perda}
                        onChange={(e) => {
                          const updated = [...novaFichaInsumos];
                          updated[idx].perda = parseFloat(e.target.value) || 0;
                          setNovaFichaInsumos(updated);
                        }}
                        placeholder="% Perda"
                        className="w-20"
                      />
                      <Button size="icon" variant="ghost" onClick={() => removerInsumoFicha(idx)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {novaFichaInsumos.length > 0 && (
              <div className="p-4 bg-muted/50 rounded-lg flex justify-between items-center">
                <span className="font-medium text-foreground">Custo de Produção:</span>
                <span className="text-xl font-bold text-primary">R$ {custoNovaFicha.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setNovaFichaOpen(false)}>Cancelar</Button>
              <Button onClick={handleSalvarFicha}>Salvar Receita</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusConfig[ordemDetalhes.status].color)}>
                    {statusConfig[ordemDetalhes.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Responsável</p>
                  <p className="font-medium">{ordemDetalhes.responsavel}</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setOrdemDetalhes(null)}>Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.type === 'iniciar' ? 'Iniciar Produção' : 'Concluir Produção'}
        description={
          confirmAction?.type === 'iniciar' 
            ? `Deseja iniciar a produção da ordem ${confirmAction.ordem.numero}?`
            : `Deseja concluir a ordem ${confirmAction?.ordem.numero}? Isso dará baixa nos insumos e entrada no produto final.`
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
