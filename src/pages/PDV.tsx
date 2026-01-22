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
  Gift,
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

interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
  desconto: number;
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

export default function PDV() {
  const { empresa, configFinanceira } = useEmpresa();
  const [busca, setBusca] = useState('');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todas');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<string | null>(null);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [showPagamento, setShowPagamento] = useState(false);

  const produtosFiltrados = useMemo(() => {
    return produtosDemo.filter((produto) => {
      const matchBusca =
        produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
        produto.codigoBarras.includes(busca);
      const matchCategoria = categoriaSelecionada === 'Todas' || produto.categoria === categoriaSelecionada;
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaSelecionada]);

  const adicionarAoCarrinho = (produto: Produto) => {
    const existente = carrinho.find((item) => item.produto.id === produto.id);
    if (existente) {
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        )
      );
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1, desconto: 0 }]);
    }
  };

  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(
      carrinho
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: Math.max(0, item.quantidade + delta) }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId));
  };

  const subtotal = carrinho.reduce((total, item) => {
    const valorItem = item.produto.preco * item.quantidade;
    const desconto = (valorItem * item.desconto) / 100;
    return total + (valorItem - desconto);
  }, 0);

  const valorDesconto = (subtotal * descontoGeral) / 100;
  const total = subtotal - valorDesconto;

  const getTaxaOperadora = () => {
    switch (formaPagamento) {
      case 'debito':
        return configFinanceira.taxaDebito;
      case 'credito':
        return configFinanceira.taxaCreditoVista;
      case 'pix':
        return configFinanceira.taxaPix;
      case 'voucher':
        return configFinanceira.taxaVoucher;
      default:
        return 0;
    }
  };

  const taxa = getTaxaOperadora();
  const valorTaxa = (total * taxa) / 100;
  const valorLiquido = total - valorTaxa;

  const finalizarVenda = () => {
    alert('Venda finalizada com sucesso!');
    setCarrinho([]);
    setFormaPagamento(null);
    setDescontoGeral(0);
    setShowPagamento(false);
  };

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
            <span className="text-sm font-medium">Voltar ao Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-sidebar-border" />
          <div className="flex items-center gap-2">
          {empresa?.logoUrl ? (
              <img src={empresa.logoUrl} alt={empresa.nome} className="w-8 h-8 rounded object-cover" />
            ) : (
              <div className="w-8 h-8 rounded bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold text-sm">
                {empresa?.nome?.charAt(0) || 'E'}
              </div>
            )}
            <span className="text-sidebar-foreground font-semibold">{empresa?.nome || 'Empresa'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sidebar-foreground/60 text-sm">
            {new Date().toLocaleDateString('pt-BR')} - {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="badge-success">Caixa Aberto</div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Área de Produtos */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Busca e Filtros */}
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome ou código de barras..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="input-field pl-11 text-lg"
                autoFocus
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaSelecionada(cat)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {produtosFiltrados.map((produto) => (
                <button
                  key={produto.id}
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="pdv-product-card text-left"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">{produto.categoria}</p>
                  <p className="text-lg font-bold text-primary mt-1">
                    R$ {produto.preco.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-muted-foreground">Estoque: {produto.estoque}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Carrinho */}
        <div className="w-96 bg-card border-l border-border flex flex-col">
          {/* Header do Carrinho */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Carrinho</h2>
              <span className="text-sm text-muted-foreground">{carrinho.length} itens</span>
            </div>
            {clienteSelecionado && (
              <div className="flex items-center gap-2 mt-2 p-2 bg-accent rounded-lg">
                <User className="w-4 h-4 text-accent-foreground" />
                <span className="text-sm text-accent-foreground">{clienteSelecionado}</span>
                <button onClick={() => setClienteSelecionado(null)} className="ml-auto">
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            )}
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {carrinho.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <ShoppingCart className="w-16 h-16 mb-4" />
                <p>Carrinho vazio</p>
                <p className="text-sm">Adicione produtos para começar</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {carrinho.map((item) => (
                  <div key={item.produto.id} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.produto.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          R$ {item.produto.preco.toFixed(2).replace('.', ',')} cada
                        </p>
                      </div>
                      <button
                        onClick={() => removerDoCarrinho(item.produto.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item.produto.id, -1)}
                          className="w-8 h-8 rounded-lg bg-background flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        <button
                          onClick={() => alterarQuantidade(item.produto.id, 1)}
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
          {carrinho.length > 0 && (
            <div className="p-4 border-t border-border bg-muted/30 space-y-4">
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
                  placeholder="0"
                />
                <span className="text-sm text-muted-foreground">% desconto</span>
              </div>

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
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">R$ {total.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>

              {/* Formas de Pagamento */}
              {showPagamento && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Forma de pagamento:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {formasPagamento.map((forma) => (
                      <button
                        key={forma.id}
                        onClick={() => setFormaPagamento(forma.id)}
                        className={cn(
                          'p-3 rounded-lg flex flex-col items-center gap-1 transition-colors',
                          formaPagamento === forma.id
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        )}
                      >
                        <forma.icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{forma.label}</span>
                      </button>
                    ))}
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
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-2">
                {!showPagamento ? (
                  <button
                    onClick={() => setShowPagamento(true)}
                    className="btn-primary flex-1 py-4 text-lg"
                  >
                    Pagamento
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowPagamento(false)}
                      className="btn-secondary flex-1 py-4"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={finalizarVenda}
                      disabled={!formaPagamento}
                      className="btn-success flex-1 py-4 text-lg"
                    >
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
  );
}

// Adicionar ícone de carrinho caso não exista
const ShoppingCart = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const Package = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
