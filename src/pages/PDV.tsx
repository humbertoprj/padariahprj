import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  Ticket,
  User,
  X,
  ArrowLeft,
  Percent,
  Receipt,
  Check,
  Package,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Calculator,
  Split,
  ClipboardList,
  Scale,
} from 'lucide-react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/services/config';
import { Link } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';
import { parseCodigoBalanca, encontrarProdutoPorCodigoBalanca, isCodigoBalanca } from '@/utils/barcodeParser';
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
  desconto: number;
  observacao?: string;
}

interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  telefone?: string;
  saldo_fiado?: number;
}

interface Comanda {
  numero: number;
  clienteNome: string;
  clienteId?: string;
  itens: ItemComanda[];
  status: 'aberta' | 'fechada';
  createdAt: Date;
}

interface PagamentoDuplo {
  forma1: string;
  valor1: number;
  forma2: string;
  valor2: number;
}

const formasPagamento = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'debito', label: 'Débito', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: Smartphone },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
  { id: 'fiado', label: 'Fiado', icon: User },
];

const TOTAL_COMANDAS = 50;

export default function PDV() {
  const { empresa, configFinanceira } = useEmpresa();
  const { toast } = useToast();
  const [view, setView] = useState<'comandas' | 'produtos' | 'pagamento'>('comandas');
  const [comandas, setComandas] = useState<Map<number, Comanda>>(new Map());
  const [comandaSelecionada, setComandaSelecionada] = useState<number | null>(null);
  const [busca, setBusca] = useState('');
  const [buscaComanda, setBuscaComanda] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [formaPagamento, setFormaPagamento] = useState<string | null>(null);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [nomeCliente, setNomeCliente] = useState('');
  const [mobileTab, setMobileTab] = useState<'produtos' | 'comanda'>('produtos');
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>(['Todas']);

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [showSeletorCliente, setShowSeletorCliente] = useState(false);

  const [valorRecebido, setValorRecebido] = useState<number>(0);
  const [showTroco, setShowTroco] = useState(false);

  const [usarPagamentoDuplo, setUsarPagamentoDuplo] = useState(false);
  const [pagamentoDuplo, setPagamentoDuplo] = useState<PagamentoDuplo>({
    forma1: 'dinheiro',
    valor1: 0,
    forma2: 'pix',
    valor2: 0,
  });

  const [buscandoComandaServidor, setBuscandoComandaServidor] = useState(false);
  const [inputBuscaComandaServidor, setInputBuscaComandaServidor] = useState('');

  useEffect(() => {
    const carregarProdutos = async () => {
      setLoadingProdutos(true);
      const response = await api.get<any[]>(API_ENDPOINTS.produtos);
      if (response.data) {
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
        setCategorias(['Todas', ...new Set(produtosMapeados.map(p => p.categoria))]);
      }
      setLoadingProdutos(false);
    };
    carregarProdutos();
  }, []);

  useEffect(() => {
    const carregarClientes = async () => {
      const response = await api.get<any[]>(API_ENDPOINTS.clientes);
      if (response.data) {
        setClientes(response.data.map((c: any) => ({
          id: c.id,
          nome: c.nome,
          cpf_cnpj: c.cpf_cnpj,
          telefone: c.telefone,
          saldo_fiado: c.saldo_fiado || 0,
        })));
      }
    };
    carregarClientes();
  }, []);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) || produto.codigoBarras.includes(busca);
      const matchCategoria = categoriaSelecionada === 'Todas' || produto.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada, produtos]);

  const comandaAtual = comandaSelecionada ? comandas.get(comandaSelecionada) : null;

  const subtotal = comandaAtual?.itens.reduce((total, item) => {
    const valorItem = item.produto.preco * item.quantidade;
    const desconto = (valorItem * item.desconto) / 100;
    return total + (valorItem - desconto);
  }, 0) || 0;

  const valorDesconto = (subtotal * descontoGeral) / 100;
  const total = subtotal - valorDesconto;
  const troco = valorRecebido > total ? valorRecebido - total : 0;

  const selecionarComanda = (numero: number) => {
    if (!comandas.has(numero)) {
      setComandas(new Map(comandas.set(numero, {
        numero,
        clienteNome: '',
        itens: [],
        status: 'aberta',
        createdAt: new Date(),
      })));
    }
    setComandaSelecionada(numero);
    setView('produtos');
    setDescontoGeral(0);
    setFormaPagamento(null);
    setClienteSelecionado(null);
    setValorRecebido(0);
    setUsarPagamentoDuplo(false);
  };

  const buscarComandaServidor = async (numeroOuCodigo: string) => {
    if (!numeroOuCodigo.trim()) return;
    setBuscandoComandaServidor(true);
    try {
      const response = await api.get<any>(API_ENDPOINTS.comanda(numeroOuCodigo));
      if (response.data) {
        const comandaServidor = response.data;
        const itensImportados: ItemComanda[] = comandaServidor.itens.map((item: any) => {
          const produtoLocal = produtos.find(p => p.id === item.produto_id);
          return {
            id: crypto.randomUUID(),
            produto: produtoLocal || {
              id: item.produto_id,
              nome: item.produto_nome || 'Produto',
              preco: item.preco_unitario || 0,
              categoria: 'Importado',
              codigoBarras: '',
              estoque: 999,
            },
            quantidade: item.quantidade,
            desconto: item.desconto || 0,
            observacao: item.observacao,
          };
        });
        const numero = parseInt(comandaServidor.numero_comanda || numeroOuCodigo);
        setComandas(new Map(comandas.set(numero, {
          numero,
          clienteNome: comandaServidor.cliente_nome || '',
          clienteId: comandaServidor.cliente_id,
          itens: itensImportados,
          status: 'aberta',
          createdAt: new Date(comandaServidor.created_at || Date.now()),
        })));
        setComandaSelecionada(numero);
        setView('produtos');
        toast({ title: 'Comanda importada', description: `Comanda ${numero} carregada com sucesso.` });
      } else {
        toast({ title: 'Não encontrada', description: 'Comanda não encontrada no servidor.', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao buscar comanda.', variant: 'destructive' });
    }
    setBuscandoComandaServidor(false);
  };

  const [salvandoVenda, setSalvandoVenda] = useState(false);

  const finalizarVenda = async () => {
    if (!comandaSelecionada || !comandaAtual || (!usarPagamentoDuplo && !formaPagamento)) return;
    if (formaPagamento === 'fiado' && !clienteSelecionado) {
      alert('Selecione um cliente para fiado.');
      return;
    }
    
    setSalvandoVenda(true);
    const payload: any = {
      comanda_numero: comandaSelecionada,
      cliente_id: clienteSelecionado?.id || null,
      valor_total: total,
      itens: comandaAtual.itens.map(item => ({
        produto_id: item.produto.id,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco,
      })),
      forma_pagamento: formaPagamento,
    };

    const response = await api.post<any>(API_ENDPOINTS.vendas, payload);
    if (response.error) {
      alert(`Erro: ${response.error}`);
      setSalvandoVenda(false);
      return;
    }

    // Atualizar estoque e fiado localmente
    for (const item of comandaAtual.itens) {
      const p = produtos.find(prod => prod.id === item.produto.id);
      if (p) await api.patch(API_ENDPOINTS.produto(p.id), { estoque_atual: Math.max(0, p.estoque - item.quantidade) });
    }

    if (formaPagamento === 'fiado' && clienteSelecionado) {
      await api.patch(API_ENDPOINTS.cliente(clienteSelecionado.id), {
        saldo_fiado: (clienteSelecionado.saldo_fiado || 0) + total
      });
    }

    const novasComandas = new Map(comandas);
    novasComandas.delete(comandaSelecionada);
    setComandas(novasComandas);
    setComandaSelecionada(null);
    setView('comandas');
    setSalvandoVenda(false);
    alert('Venda finalizada!');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <header className="h-14 bg-sidebar flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sidebar-foreground"><ArrowLeft className="w-5 h-5" />Dashboard</Link>
          <span className="text-sidebar-foreground font-semibold">{empresa?.nome || 'Padaria HPRJ'}</span>
        </div>
        {comandaSelecionada && <div className="badge-primary">Comanda {comandaSelecionada}</div>}
      </header>

      <main className="flex-1 overflow-hidden flex">
        {view === 'comandas' ? (
          <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 overflow-y-auto">
            {Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => selecionarComanda(n)}
                className={cn("h-20 rounded-lg border-2 flex flex-col items-center justify-center transition-all", comandas.has(n) ? "border-primary bg-primary/10" : "border-border hover:border-primary/50")}
              >
                <span className="text-lg font-bold">{n}</span>
                {comandas.has(n) && <span className="text-[10px] text-primary">ABERTA</span>}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex">
            <div className="flex-1 p-4 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="text" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} className="input-field pl-10" />
              </div>
              <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {produtosFiltrados.map(p => (
                  <button key={p.id} onClick={() => {
                    const itemExistente = comandaAtual?.itens.find(i => i.produto.id === p.id);
                    if (itemExistente) {
                      const novosItens = comandaAtual!.itens.map(i => i.produto.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i);
                      setComandas(new Map(comandas.set(comandaSelecionada!, { ...comandaAtual!, itens: novosItens })));
                    } else {
                      setComandas(new Map(comandas.set(comandaSelecionada!, { ...comandaAtual!, itens: [...comandaAtual!.itens, { id: crypto.randomUUID(), produto: p, quantidade: 1, desconto: 0 }] })));
                    }
                  }} className="stat-card text-left hover:border-primary">
                    <p className="font-medium truncate">{p.nome}</p>
                    <p className="text-primary font-bold">R$ {p.preco.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="w-80 bg-muted/30 border-l border-border flex flex-col">
              <div className="p-4 border-b border-border font-bold flex justify-between">
                <span>Itens</span>
                <button onClick={() => setView('comandas')} className="text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {comandaAtual?.itens.map(item => (
                  <div key={item.id} className="bg-background p-2 rounded border border-border text-sm">
                    <p className="font-medium">{item.produto.nome}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span>{item.quantidade}x R$ {item.produto.preco.toFixed(2)}</span>
                      <span className="font-bold">R$ {(item.quantidade * item.produto.preco).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border bg-background space-y-2">
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                {view === 'produtos' ? (
                  <button onClick={() => setView('pagamento')} className="btn-primary w-full py-3">PAGAR</button>
                ) : (
                  <div className="space-y-2">
                    <select value={formaPagamento || ''} onChange={e => handleFormaPagamento(e.target.value)} className="input-field">
                      <option value="">Forma de Pagamento</option>
                      {formasPagamento.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    {formaPagamento === 'fiado' && (
                      <select value={clienteSelecionado?.id || ''} onChange={e => setClienteSelecionado(clientes.find(c => c.id === e.target.value) || null)} className="input-field">
                        <option value="">Selecionar Cliente</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                      </select>
                    )}
                    <button onClick={finalizarVenda} disabled={salvandoVenda} className="btn-success w-full py-3">
                      {salvandoVenda ? <Loader2 className="animate-spin mx-auto" /> : 'FINALIZAR'}
                    </button>
                    <button onClick={() => setView('produtos')} className="btn-ghost w-full">Voltar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );

  function handleFormaPagamento(forma: string) {
    setFormaPagamento(forma);
    if (forma === 'fiado') setShowSeletorCliente(true);
  }
}
