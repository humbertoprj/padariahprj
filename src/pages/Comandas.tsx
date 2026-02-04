import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Save,
  ArrowLeft,
  Package,
  ShoppingCart,
  Receipt,
  Loader2,
  AlertCircle,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';
import { Link } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  codigoBarras: string;
  estoque: number;
}

interface ItemComanda {
  id: string;
  produto: Produto;
  quantidade: number;
  observacao?: string;
}

interface ComandaLocal {
  numero: number;
  itens: ItemComanda[];
  status: 'aberta' | 'salva';
}

interface ComandaServidor {
  id: string;
  numero: number;
  status: string;
  valor_total: number;
  created_at: string;
  cliente_nome?: string;
}

// Gerar array de comandas 1-50
const TOTAL_COMANDAS = 50;

export default function Comandas() {
  const { empresa } = useEmpresa();
  const { toast } = useToast();
  const [view, setView] = useState<'comandas' | 'itens'>('comandas');
  const [comandaSelecionada, setComandaSelecionada] = useState<number | null>(null);
  const [itensComanda, setItensComanda] = useState<ItemComanda[]>([]);
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');

  // Estado para produtos do estoque
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>(['Todas']);

  // Estado para comandas do servidor
  const [comandasServidor, setComandasServidor] = useState<ComandaServidor[]>([]);
  const [loadingComandas, setLoadingComandas] = useState(false);

  // Estado para salvar
  const [salvando, setSalvando] = useState(false);

  // Carregar produtos do estoque via API
  useEffect(() => {
    carregarProdutos();
    carregarComandasServidor();
  }, []);

  const carregarProdutos = async () => {
    setLoadingProdutos(true);
    setErroProdutos(null);

    const response = await api.get<any[]>(API_ENDPOINTS.produtos);

    if (response.error) {
      setErroProdutos(response.error);
      setProdutos([]);
    } else if (response.data) {
      const produtosMapeados: Produto[] = response.data
        .filter((p: any) => p.ativo !== false)
        .map((p: any) => ({
          id: p.id,
          nome: p.nome,
          preco: p.preco_venda || p.preco || 0,
          categoria: p.categoria || 'Outros',
          codigoBarras: p.codigo_barras || p.id,
          estoque: p.estoque_atual || p.estoque || 0,
        }));

      setProdutos(produtosMapeados);
      const categoriasUnicas = ['Todas', ...new Set(produtosMapeados.map(p => p.categoria))];
      setCategorias(categoriasUnicas);
    } else {
      setProdutos([]);
    }

    setLoadingProdutos(false);
  };

  const carregarComandasServidor = async () => {
    setLoadingComandas(true);
    const response = await api.get<ComandaServidor[]>(API_ENDPOINTS.comandas);
    if (response.data) {
      setComandasServidor(response.data.filter(c => c.status === 'aberta'));
    }
    setLoadingComandas(false);
  };

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchBusca =
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigoBarras.includes(busca);
      const matchCategoria = categoriaSelecionada === 'Todas' || produto.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada, produtos]);

  // Calcular total da comanda
  const totalComanda = itensComanda.reduce((total, item) => {
    return total + (item.produto.preco * item.quantidade);
  }, 0);

  // Verificar se comanda já existe no servidor
  const getComandaServidor = (numero: number) => {
    return comandasServidor.find(c => c.numero === numero);
  };

  // Selecionar comanda
  const selecionarComanda = async (numero: number) => {
    setComandaSelecionada(numero);
    
    // Verificar se comanda já existe no servidor
    const comandaExistente = getComandaServidor(numero);
    if (comandaExistente) {
      // Buscar itens da comanda do servidor
      const response = await api.get<any[]>(API_ENDPOINTS.comandaItens(comandaExistente.id));
      if (response.data) {
        const itens: ItemComanda[] = response.data.map((item: any) => {
          const produtoLocal = produtos.find(p => p.id === item.produto_id);
          return {
            id: item.id,
            produto: produtoLocal || {
              id: item.produto_id,
              nome: item.produto_nome || 'Produto',
              preco: item.preco_unitario || 0,
              categoria: '',
              codigoBarras: '',
              estoque: 0,
            },
            quantidade: item.quantidade,
            observacao: item.observacao,
          };
        });
        setItensComanda(itens);
      }
    } else {
      setItensComanda([]);
    }
    
    setView('itens');
    setBusca('');
  };

  // Adicionar produto à comanda
  const adicionarProduto = (produto: Produto) => {
    const itemExistente = itensComanda.find(i => i.produto.id === produto.id);

    if (itemExistente) {
      setItensComanda(itensComanda.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      const novoItem: ItemComanda = {
        id: crypto.randomUUID(),
        produto,
        quantidade: 1,
      };
      setItensComanda([...itensComanda, novoItem]);
    }
    
    // Feedback tátil para tablet
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  // Alterar quantidade
  const alterarQuantidade = (itemId: string, delta: number) => {
    setItensComanda(itensComanda
      .map(item => item.id === itemId ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item)
      .filter(item => item.quantidade > 0)
    );
  };

  // Remover item
  const removerItem = (itemId: string) => {
    setItensComanda(itensComanda.filter(item => item.id !== itemId));
  };

  // Salvar comanda no servidor local
  const salvarComanda = async () => {
    if (!comandaSelecionada || itensComanda.length === 0) return;

    setSalvando(true);

    const comandaExistente = getComandaServidor(comandaSelecionada);

    const payload = {
      numero: comandaSelecionada,
      status: 'aberta',
      valor_total: totalComanda,
      itens: itensComanda.map(item => ({
        produto_id: item.produto.id,
        produto_nome: item.produto.nome,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
        subtotal: item.produto.preco * item.quantidade,
        observacao: item.observacao || null,
      })),
    };

    let response;
    if (comandaExistente) {
      // Atualizar comanda existente
      response = await api.put<any>(API_ENDPOINTS.comanda(comandaExistente.id), payload);
    } else {
      // Criar nova comanda
      response = await api.post<any>(API_ENDPOINTS.comandas, payload);
    }

    if (response.error) {
      toast({
        title: 'Erro ao salvar comanda',
        description: response.status === 0 
          ? 'Servidor Local não encontrado. Verifique a conexão.'
          : response.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Comanda salva!',
        description: `Comanda ${comandaSelecionada} salva com ${itensComanda.length} item(ns).`,
      });
      
      // Atualizar lista de comandas
      await carregarComandasServidor();
      
      // Voltar para lista de comandas
      setView('comandas');
      setComandaSelecionada(null);
      setItensComanda([]);
    }

    setSalvando(false);
  };

  // Voltar para lista de comandas
  const voltarParaComandas = () => {
    setView('comandas');
    setComandaSelecionada(null);
    setItensComanda([]);
    setBusca('');
  };

  // Tela de erro de produtos
  if (erroProdutos && !loadingProdutos) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Erro de Conexão</h2>
        <p className="text-muted-foreground text-center mb-4">{erroProdutos}</p>
        <button className="btn-primary" onClick={carregarProdutos}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
        <Link to="/" className="mt-4 text-primary underline">
          Voltar para o Dashboard
        </Link>
      </div>
    );
  }

  // Tela de loading
  if (loadingProdutos) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {view === 'itens' && (
            <button
              onClick={voltarParaComandas}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            <h1 className="text-lg font-bold text-foreground">
              {view === 'comandas' ? 'Comandas' : `Comanda ${comandaSelecionada}`}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {view === 'itens' && itensComanda.length > 0 && (
            <button
              onClick={salvarComanda}
              disabled={salvando}
              className="btn-primary"
            >
              {salvando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Comanda
            </button>
          )}
          <Link to="/pdv" className="btn-secondary text-sm">
            <Receipt className="w-4 h-4 mr-2" />
            Ir para Caixa
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      {view === 'comandas' ? (
        /* Grid de Comandas */
        <div className="flex-1 p-4 overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-muted-foreground">
              Selecione uma comanda para lançar itens
            </p>
            <button onClick={carregarComandasServidor} className="btn-secondary text-sm">
              <RefreshCw className={cn("w-4 h-4 mr-2", loadingComandas && "animate-spin")} />
              Atualizar
            </button>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1).map((numero) => {
              const comandaServidor = getComandaServidor(numero);
              const temItens = !!comandaServidor;

              return (
                <button
                  key={numero}
                  onClick={() => selecionarComanda(numero)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-lg transition-all border-2',
                    temItens
                      ? 'bg-warning/20 border-warning text-warning hover:bg-warning/30'
                      : 'bg-card border-border text-foreground hover:border-primary hover:bg-primary/5'
                  )}
                >
                  {numero}
                  {temItens && (
                    <span className="text-xs font-normal mt-0.5">
                      R$ {(comandaServidor?.valor_total || 0).toFixed(2)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Tela de Lançamento de Itens */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Lista de Produtos */}
          <div className="flex-1 flex flex-col border-r border-border">
            {/* Busca e Categorias */}
            <div className="p-4 border-b border-border space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar produto ou código..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="input-field pl-10"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSelecionada(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                      categoriaSelecionada === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-accent'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="flex-1 overflow-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarProduto(produto)}
                    className="bg-card border border-border rounded-xl p-3 text-left hover:border-primary hover:shadow-md transition-all active:scale-95"
                  >
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-2">
                      <Package className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground text-sm line-clamp-2">{produto.nome}</p>
                    <p className="text-primary font-bold mt-1">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </p>
                  </button>
                ))}
              </div>

              {produtosFiltrados.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Resumo da Comanda */}
          <div className="w-full lg:w-96 bg-card flex flex-col border-t lg:border-t-0 lg:border-l border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Itens da Comanda {comandaSelecionada}
                </h2>
                <span className="badge-primary">{itensComanda.length} itens</span>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {itensComanda.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item adicionado</p>
                  <p className="text-sm mt-1">Clique nos produtos para adicionar</p>
                </div>
              ) : (
                itensComanda.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/50 rounded-lg p-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{item.produto.nome}</p>
                      <p className="text-primary text-sm">
                        R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => alterarQuantidade(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background hover:bg-accent transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-foreground">{item.quantidade}</span>
                      <button
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-background hover:bg-accent transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors ml-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total e Ações */}
            <div className="p-4 border-t border-border space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold text-foreground">
                  R$ {totalComanda.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <button
                onClick={salvarComanda}
                disabled={itensComanda.length === 0 || salvando}
                className="btn-primary w-full py-3 text-lg disabled:opacity-50"
              >
                {salvando ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Save className="w-5 h-5 mr-2" />
                )}
                Salvar Comanda
              </button>
              <p className="text-xs text-muted-foreground text-center">
                O fechamento será feito no caixa do PC
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
