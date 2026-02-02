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
        .filter((p: any) => p.fabricado === true)
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
        .filter((p: any) => !p.fabricado)
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
        const insumo = insumosLista.find((i: any) => i.id === f.insumo_id);
        
        if (!fichasAgrupadas[f.produto_id]) {
          fichasAgrupadas[f.produto_id] = {
            id: f.produto_id,
            produtoId: f.produto_id,
            produtoNome: produto?.nome || 'Produto',
            insumos: [],
            custoTotal: 0,
          };
        }
        
        const custoInsumo = (insumo?.custo || 0) * (f.quantidade || 0) * (1 + (f.perda_percentual || 0) / 100);
        fichasAgrupadas[f.produto_id].insumos.push({
          insumoId: f.insumo_id,
          insumoNome: insumo?.nome || 'Insumo',
          quantidade: f.quantidade || 0,
          unidade: insumo?.unidade || 'UN',
          perdaPercentual: f.perda_percentual || 0,
          custo: custoInsumo,
        });
        fichasAgrupadas[f.produto_id].custoTotal += custoInsumo;
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
    // Encontrar ficha técnica do produto
    const ficha = fichasTecnicas.find(f => f.produtoId === ordem.produtoId);
    
    // Payload para concluir ordem (o backend deve fazer a baixa de estoque)
    const response = await api.patch<any>(API_ENDPOINTS.ordem(ordem.id), {
      status: 'concluida',
      data_conclusao: new Date().toISOString(),
      quantidade_produzida: ordem.quantidade,
      // Enviar insumos para baixa no servidor
      baixa_insumos: ficha?.insumos.map(i => ({
        produto_id: i.insumoId,
        quantidade: i.quantidade * ordem.quantidade * (1 + i.perdaPercentual / 100),
      })) || [],
      // Entrada do produto final
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

  // Adicionar insumo à nova ficha
  const adicionarInsumoFicha = () => {
    setNovaFichaInsumos([...novaFichaInsumos, { insumoId: '', quantidade: 1, perda: 5 }]);
  };

  // Remover insumo da ficha
  const removerInsumoFicha = (index: number) => {
    setNovaFichaInsumos(novaFichaInsumos.filter((_, i) => i !== index));
  };

  // Salvar ficha técnica
  const handleSalvarFicha = async () => {
    if (!novaProdutoFichaId || novaFichaInsumos.length === 0) {
      toast({ title: 'Erro', description: 'Selecione um produto e adicione pelo menos um insumo.', variant: 'destructive' });
      return;
    }
    
    // Salvar cada insumo como registro separado
    for (const insumo of novaFichaInsumos) {
      if (!insumo.insumoId) continue;
      
      const payload = {
        produto_id: novaProdutoFichaId,
        insumo_id: insumo.insumoId,
        quantidade: insumo.quantidade,
        perda_percentual: insumo.perda,
      };
      
      const response = await api.post<any>(API_ENDPOINTS.fichasTecnicas, payload);
      if (response.error) {
        toast({ 
          title: 'Erro ao salvar ficha', 
          description: response.error,
          variant: 'destructive'
        });
        return;
      }
    }
    
    await carregarDados();
    setNovaFichaOpen(false);
    setNovaProdutoFichaId('');
    setNovaFichaInsumos([]);
    toast({ title: 'Ficha técnica salva', description: 'Receita cadastrada com sucesso.' });
  };

  // Calcular custo da nova ficha
  const custoNovaFicha = novaFichaInsumos.reduce((acc, item) => {
    const insumo = insumos.find(i => i.id === item.insumoId);
    if (!insumo) return acc;
    return acc + (insumo.custo * item.quantidade * (1 + item.perda / 100));
  }, 0);

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
        <p className="text-muted-foreground">Carregando dados de produção...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Produção (PCP)</h1>
          <p className="text-muted-foreground">Controle de produção e fichas técnicas (receitas)</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={carregarDados}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </button>
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
          {view === 'fichas' && (
            <button className="btn-primary" onClick={() => setNovaFichaOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
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
                  <p className="text-sm text-muted-foreground">Produtos Fabricados</p>
                  <p className="text-2xl font-bold text-foreground">{produtosFabricados.length}</p>
                </div>
                <Factory className="w-8 h-8 text-muted-foreground/50" />
              </div>
            </div>
          </div>

          {/* Lista de Ordens */}
          <div className="stat-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Ordens de Produção</h2>
            {ordens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Factory className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ordem de produção</p>
                <button className="btn-primary mt-4" onClick={() => setNovaOrdemOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Ordem
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </>
      ) : (
        /* Fichas Técnicas (Receitas) */
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">Fichas Técnicas (Receitas)</h2>
          {fichasTecnicas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma ficha técnica cadastrada</p>
              <p className="text-sm mt-2">Cadastre as receitas dos produtos fabricados</p>
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

      {/* Dialog Nova Ordem */}
      <Dialog open={novaOrdemOpen} onOpenChange={setNovaOrdemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ordem de Produção</DialogTitle>
          </DialogHeader>
          {produtosFabricados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto fabricado cadastrado</p>
              <p className="text-sm mt-2">Cadastre produtos com a flag "Fabricado" no Estoque</p>
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

      {/* Dialog Nova Ficha Técnica */}
      <Dialog open={novaFichaOpen} onOpenChange={setNovaFichaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Ficha Técnica (Receita)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Seleção do produto */}
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
            
            {/* Insumos */}
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
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
                        min="0.01"
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
                        step="1"
                        min="0"
                        max="100"
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
            
            {/* Custo calculado */}
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
