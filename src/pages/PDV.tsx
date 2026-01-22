import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';

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

interface Comanda {
  numero: number;
  clienteNome: string;
  itens: ItemComanda[];
  status: 'aberta' | 'fechada';
  createdAt: Date;
}

const produtosDemo: Produto[] = [
  { id: '1', nome: 'Coca-Cola 2L', preco: 12.99, categoria: 'Bebidas', codigoBarras: '7894900011517', estoque: 50 },
  { id: '2', nome: 'Pão Francês (kg)', preco: 15.00, categoria: 'Padaria', codigoBarras: '0000001', estoque: 100 },
  { id: '3', nome: 'Arroz 5kg', preco: 28.90, categoria: 'Mercearia', codigoBarras: '7896006754018', estoque: 30 },
  { id: '4', nome: 'Feijão 1kg', preco: 8.50, categoria: 'Mercearia', codigoBarras: '7896006751239', estoque: 45 },
  { id: '5', nome: 'Leite Integral 1L', preco: 5.99, categoria: 'Laticínios', codigoBarras: '7891025100102', estoque: 80 },
  { id: '6', nome: 'Café 500g', preco: 18.90, categoria: 'Mercearia', codigoBarras: '7891910000197', estoque: 25 },
  { id: '7', nome: 'Açúcar 1kg', preco: 4.99, categoria: 'Mercearia', codigoBarras: '7896215100012', estoque: 60 },
  { id: '8', nome: 'Óleo de Soja 900ml', preco: 7.49, categoria: 'Mercearia', codigoBarras: '7891107111019', estoque: 40 },
  { id: '9', nome: 'Sabonete', preco: 2.99, categoria: 'Higiene', codigoBarras: '7891024130018', estoque: 100 },
  { id: '10', nome: 'Papel Higiênico', preco: 19.90, categoria: 'Higiene', codigoBarras: '7896051131014', estoque: 35 },
  { id: '11', nome: 'Detergente 500ml', preco: 3.49, categoria: 'Limpeza', codigoBarras: '7891024114025', estoque: 55 },
  { id: '12', nome: 'Macarrão 500g', preco: 4.29, categoria: 'Mercearia', codigoBarras: '7896045103010', estoque: 70 },
];

const categorias = ['Todas', 'Bebidas', 'Padaria', 'Mercearia', 'Laticínios', 'Higiene', 'Limpeza'];

const formasPagamento = [
  { id: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { id: 'debito', label: 'Débito', icon: CreditCard },
  { id: 'credito', label: 'Crédito', icon: CreditCard },
  { id: 'pix', label: 'PIX', icon: Smartphone },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
  { id: 'fiado', label: 'Fiado', icon: User },
];

// Gerar array de comandas 1-100
const TOTAL_COMANDAS = 50;

export default function PDV() {
  const { empresa, configFinanceira } = useEmpresa();
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

  // Filtrar produtos
  const produtosFiltrados = useMemo(() => {
    return produtosDemo.filter((produto) => {
      const matchBusca =
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigoBarras.includes(busca);
      const matchCategoria = categoriaSelecionada === 'Todas' || produto.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada]);

  // Obter comanda atual
  const comandaAtual = comandaSelecionada ? comandas.get(comandaSelecionada) : null;

  // Calcular totais da comanda
  const subtotal = comandaAtual?.itens.reduce((total, item) => {
    const valorItem = item.produto.preco * item.quantidade;
    const desconto = (valorItem * item.desconto) / 100;
    return total + (valorItem - desconto);
  }, 0) || 0;

  const valorDesconto = (subtotal * descontoGeral) / 100;
  const total = subtotal - valorDesconto;

  const getTaxaOperadora = () => {
    switch (formaPagamento) {
      case 'debito': return configFinanceira.taxaDebito;
      case 'credito': return configFinanceira.taxaCreditoVista;
      case 'pix': return configFinanceira.taxaPix;
      case 'voucher': return configFinanceira.taxaVoucher;
      default: return 0;
    }
  };

  const taxa = getTaxaOperadora();
  const valorTaxa = (total * taxa) / 100;
  const valorLiquido = total - valorTaxa;

  // Abrir/Selecionar comanda
  const selecionarComanda = (numero: number) => {
    if (!comandas.has(numero)) {
      // Criar nova comanda
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
  };

  // Adicionar produto à comanda
  const adicionarProduto = (produto: Produto) => {
    if (!comandaSelecionada || !comandaAtual) return;

    const itemExistente = comandaAtual.itens.find(i => i.produto.id === produto.id);
    
    if (itemExistente) {
      const novosItens = comandaAtual.itens.map(item =>
        item.produto.id === produto.id
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      );
      setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
    } else {
      const novoItem: ItemComanda = {
        id: crypto.randomUUID(),
        produto,
        quantidade: 1,
        desconto: 0,
      };
      setComandas(new Map(comandas.set(comandaSelecionada, {
        ...comandaAtual,
        itens: [...comandaAtual.itens, novoItem],
      })));
    }
  };

  // Alterar quantidade
  const alterarQuantidade = (itemId: string, delta: number) => {
    if (!comandaSelecionada || !comandaAtual) return;

    const novosItens = comandaAtual.itens
      .map(item => item.id === itemId ? { ...item, quantidade: Math.max(0, item.quantidade + delta) } : item)
      .filter(item => item.quantidade > 0);

    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
  };

  // Remover item
  const removerItem = (itemId: string) => {
    if (!comandaSelecionada || !comandaAtual) return;
    const novosItens = comandaAtual.itens.filter(item => item.id !== itemId);
    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, itens: novosItens })));
  };

  // Atualizar nome do cliente
  const atualizarNomeCliente = (nome: string) => {
    if (!comandaSelecionada || !comandaAtual) return;
    setComandas(new Map(comandas.set(comandaSelecionada, { ...comandaAtual, clienteNome: nome })));
  };

  // Finalizar venda
  const finalizarVenda = () => {
    if (!comandaSelecionada || !comandaAtual) return;
    
    // Fechar comanda
    const comandaFechada = { ...comandaAtual, status: 'fechada' as const };
    const novasComandas = new Map(comandas);
    novasComandas.delete(comandaSelecionada);
    setComandas(novasComandas);
    
    alert(`Comanda ${comandaSelecionada} finalizada!\nValor: R$ ${total.toFixed(2).replace('.', ',')}\nForma: ${formaPagamento}`);
    
    setComandaSelecionada(null);
    setView('comandas');
    setFormaPagamento(null);
    setDescontoGeral(0);
  };

  // Cancelar comanda
  const cancelarComanda = () => {
    if (!comandaSelecionada) return;
    if (confirm(`Deseja cancelar a comanda ${comandaSelecionada}?`)) {
      const novasComandas = new Map(comandas);
      novasComandas.delete(comandaSelecionada);
      setComandas(novasComandas);
      setComandaSelecionada(null);
      setView('comandas');
    }
  };

  // Comandas abertas
  const comandasAbertas = Array.from(comandas.values()).filter(c => c.status === 'aberta');

  // Filtrar comandas na busca
  const comandasFiltradas = buscaComanda
    ? Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1).filter(n => 
        n.toString().includes(buscaComanda) || 
        comandas.get(n)?.clienteNome.toLowerCase().includes(buscaComanda.toLowerCase())
      )
    : Array.from({ length: TOTAL_COMANDAS }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Header do PDV */}
      <header className="h-14 bg-sidebar flex items-center justify-between px-4 shadow-lg">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-sidebar-border" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
              {empresa?.nome?.charAt(0) || 'E'}
            </div>
            <span className="text-sidebar-foreground font-semibold">{empresa?.nome || 'Empresa'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {comandaSelecionada && (
            <div className="flex items-center gap-2 bg-primary/20 px-3 py-1.5 rounded-lg">
              <Receipt className="w-4 h-4 text-primary" />
              <span className="text-primary font-bold">Comanda {comandaSelecionada}</span>
            </div>
          )}
          <span className="text-sidebar-foreground/60 text-sm">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="badge-success">Caixa Aberto</div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      {view === 'comandas' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Header das Comandas */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Selecione uma Comanda</h2>
              <p className="text-muted-foreground">
                {comandasAbertas.length} comanda(s) aberta(s) • Total: R$ {comandasAbertas.reduce((t, c) => t + (c.itens.reduce((s, i) => s + i.produto.preco * i.quantidade, 0)), 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar comanda..."
                value={buscaComanda}
                onChange={(e) => setBuscaComanda(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>

          {/* Grid de Comandas */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-15 gap-2">
              {comandasFiltradas.map((numero) => {
                const comanda = comandas.get(numero);
                const temItens = comanda && comanda.itens.length > 0;
                const valorComanda = comanda?.itens.reduce((t, i) => t + i.produto.preco * i.quantidade, 0) || 0;

                return (
                  <button
                    key={numero}
                    onClick={() => selecionarComanda(numero)}
                    className={cn(
                      'aspect-square rounded-xl flex flex-col items-center justify-center gap-1 font-bold transition-all hover:scale-105',
                      temItens
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <span className="text-2xl">{numero}</span>
                    {temItens && (
                      <span className="text-xs opacity-80">
                        R$ {valorComanda.toFixed(0)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {(view === 'produtos' || view === 'pagamento') && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Tab Switcher */}
          <div className="md:hidden flex border-b border-border bg-card">
            <button
              onClick={() => setMobileTab('produtos')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                mobileTab === 'produtos'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground'
              )}
            >
              <Package className="w-4 h-4" />
              Produtos
            </button>
            <button
              onClick={() => setMobileTab('comanda')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 relative',
                mobileTab === 'comanda'
                  ? 'text-primary border-b-2 border-primary bg-primary/5'
                  : 'text-muted-foreground'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
              Comanda
              {comandaAtual && comandaAtual.itens.length > 0 && (
                <span className="absolute -top-1 right-1/4 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {comandaAtual.itens.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Área de Produtos - hidden on mobile when comanda tab is active */}
            <div className={cn(
              "flex-1 flex flex-col p-4 overflow-hidden",
              mobileTab === 'comanda' ? 'hidden md:flex' : 'flex'
            )}>
              {/* Busca e Filtros */}
              <div className="flex gap-2 md:gap-4 mb-4 flex-wrap">
                <button
                  onClick={() => {
                    setComandaSelecionada(null);
                    setView('comandas');
                  }}
                  className="btn-secondary text-sm md:text-base"
                >
                  <Receipt className="w-4 h-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Comandas</span>
                </button>
                <div className="relative flex-1 min-w-0">
                  <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar produto..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input-field pl-10 md:pl-11 text-sm md:text-lg w-full"
                    autoFocus
                  />
                </div>
              </div>

              {/* Categorias */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
                {categorias.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSelecionada(cat)}
                    className={cn(
                      'px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-colors',
                      categoriaSelecionada === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grid de Produtos */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                  {produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      onClick={() => {
                        adicionarProduto(produto);
                        // On mobile, show a quick feedback
                        if (window.innerWidth < 768) {
                          setMobileTab('comanda');
                        }
                      }}
                      className="pdv-product-card text-left p-2 md:p-3"
                    >
                      <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                        <Package className="w-6 md:w-8 h-6 md:h-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2">{produto.nome}</p>
                      <p className="text-xs text-muted-foreground hidden sm:block">{produto.categoria}</p>
                      <p className="text-sm md:text-lg font-bold text-primary mt-1">
                        R$ {produto.preco.toFixed(2).replace('.', ',')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Painel da Comanda - hidden on mobile when produtos tab is active */}
            <div className={cn(
              "w-full md:w-96 bg-card md:border-l border-border flex flex-col",
              mobileTab === 'produtos' ? 'hidden md:flex' : 'flex'
            )}>
              {/* Header da Comanda */}
              <div className="p-4 border-b border-border bg-primary/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold text-foreground">Comanda {comandaSelecionada}</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">{comandaAtual?.itens.length || 0} itens</span>
                </div>
                {/* Nome do Cliente */}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Nome do cliente (opcional)"
                    value={comandaAtual?.clienteNome || ''}
                    onChange={(e) => atualizarNomeCliente(e.target.value)}
                    className="flex-1 bg-transparent border-b border-border text-sm py-1 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Lista de Itens */}
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {!comandaAtual?.itens.length ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                    <ShoppingCart className="w-16 h-16 mb-4" />
                    <p>Comanda vazia</p>
                    <p className="text-sm">Adicione produtos</p>
                    <button
                      onClick={() => setMobileTab('produtos')}
                      className="mt-4 btn-primary md:hidden"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Ver Produtos
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {comandaAtual.itens.map((item) => (
                      <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{item.produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              R$ {item.produto.preco.toFixed(2).replace('.', ',')} cada
                            </p>
                          </div>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidade(item.id, -1)}
                              className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantidade}</span>
                            <button
                              onClick={() => alterarQuantidade(item.id, 1)}
                              className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-accent transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-semibold text-foreground">
                            R$ {(item.produto.preco * item.quantidade).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totais e Pagamento */}
              {comandaAtual && comandaAtual.itens.length > 0 && (
                <div className="p-4 border-t border-border bg-muted/30 space-y-4">
                  {view === 'pagamento' && (
                    <>
                      {/* Desconto Geral */}
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-muted-foreground" />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={descontoGeral}
                          onChange={(e) => setDescontoGeral(Number(e.target.value))}
                          className="w-20 px-2 py-1 text-sm border border-input rounded"
                        />
                        <span className="text-sm text-muted-foreground">% desconto</span>
                      </div>

                      {/* Formas de Pagamento */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">Forma de pagamento:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {formasPagamento.map((forma) => (
                            <button
                              key={forma.id}
                              onClick={() => setFormaPagamento(forma.id)}
                              className={cn(
                                'p-2 md:p-3 rounded-lg flex flex-col items-center gap-1 transition-colors',
                                formaPagamento === forma.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                              )}
                            >
                              <forma.icon className="w-4 md:w-5 h-4 md:h-5" />
                              <span className="text-xs font-medium">{forma.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {formaPagamento && taxa > 0 && (
                        <div className="p-3 bg-warning/10 rounded-lg text-sm">
                          <div className="flex justify-between text-warning">
                            <span>Taxa ({taxa}%)</span>
                            <span>-R$ {valorTaxa.toFixed(2).replace('.', ',')}</span>
                          </div>
                          <div className="flex justify-between font-medium text-foreground mt-1">
                            <span>Valor líquido</span>
                            <span>R$ {valorLiquido.toFixed(2).replace('.', ',')}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Totais */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {descontoGeral > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-success">Desconto ({descontoGeral}%)</span>
                        <span className="text-success">-R$ {valorDesconto.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-2">
                    {view === 'produtos' ? (
                      <>
                        <button
                          onClick={cancelarComanda}
                          className="btn-secondary flex-1 py-3 text-sm md:text-base"
                        >
                          <X className="w-4 h-4 mr-1 md:mr-2" />
                          Cancelar
                        </button>
                        <button
                          onClick={() => setView('pagamento')}
                          className="btn-primary flex-1 py-3 text-sm md:text-base"
                        >
                          <CreditCard className="w-4 h-4 mr-1 md:mr-2" />
                          Fechar Conta
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setView('produtos')}
                          className="btn-secondary flex-1 py-3"
                        >
                          Voltar
                        </button>
                        <button
                          onClick={finalizarVenda}
                          disabled={!formaPagamento}
                          className="btn-success flex-1 py-3 text-base md:text-lg"
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Finalizar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
