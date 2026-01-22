import { useState } from 'react';
import { Plus, Search, Filter, Package, AlertTriangle, Edit, Trash2, MoreVertical, Barcode } from 'lucide-react';

interface Produto {
  id: string;
  nome: string;
  codigoBarras: string;
  categoria: string;
  unidade: string;
  custo: number;
  preco: number;
  margem: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  fabricado: boolean;
  ativo: boolean;
}

const produtosDemo: Produto[] = [
  { id: '1', nome: 'Coca-Cola 2L', codigoBarras: '7894900011517', categoria: 'Bebidas', unidade: 'UN', custo: 8.50, preco: 12.99, margem: 52.82, estoqueAtual: 50, estoqueMinimo: 20, fabricado: false, ativo: true },
  { id: '2', nome: 'Pão Francês', codigoBarras: '0000001', categoria: 'Padaria', unidade: 'KG', custo: 8.00, preco: 15.00, margem: 87.50, estoqueAtual: 100, estoqueMinimo: 30, fabricado: true, ativo: true },
  { id: '3', nome: 'Arroz 5kg', codigoBarras: '7896006754018', categoria: 'Mercearia', unidade: 'UN', custo: 22.00, preco: 28.90, margem: 31.36, estoqueAtual: 5, estoqueMinimo: 15, fabricado: false, ativo: true },
  { id: '4', nome: 'Feijão 1kg', codigoBarras: '7896006751239', categoria: 'Mercearia', unidade: 'UN', custo: 6.00, preco: 8.50, margem: 41.67, estoqueAtual: 45, estoqueMinimo: 20, fabricado: false, ativo: true },
  { id: '5', nome: 'Leite Integral 1L', codigoBarras: '7891025100102', categoria: 'Laticínios', unidade: 'UN', custo: 4.20, preco: 5.99, margem: 42.62, estoqueAtual: 8, estoqueMinimo: 30, fabricado: false, ativo: true },
];

export default function Estoque() {
  const [busca, setBusca] = useState('');
  const [produtos] = useState<Produto[]>(produtosDemo);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigoBarras.includes(busca)
  );

  const produtosBaixoEstoque = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e controle de estoque</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Novo Produto
        </button>
      </div>

      {/* Alertas */}
      {produtosBaixoEstoque.length > 0 && (
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-warning" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {produtosBaixoEstoque.length} produto(s) com estoque baixo
            </p>
            <p className="text-xs text-muted-foreground">
              {produtosBaixoEstoque.map((p) => p.nome).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Total de Produtos</p>
          <p className="text-2xl font-bold text-foreground">{produtos.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Produtos Ativos</p>
          <p className="text-2xl font-bold text-success">{produtos.filter((p) => p.ativo).length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Baixo Estoque</p>
          <p className="text-2xl font-bold text-warning">{produtosBaixoEstoque.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-muted-foreground">Produtos Fabricados</p>
          <p className="text-2xl font-bold text-primary">{produtos.filter((p) => p.fabricado).length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produto por nome ou código..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button className="btn-secondary">
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </button>
      </div>

      {/* Tabela */}
      <div className="stat-card overflow-hidden p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Código</th>
              <th>Categoria</th>
              <th className="text-right">Custo</th>
              <th className="text-right">Preço</th>
              <th className="text-right">Margem</th>
              <th className="text-center">Estoque</th>
              <th className="text-center">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.map((produto) => (
              <tr key={produto.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{produto.nome}</p>
                      {produto.fabricado && (
                        <span className="text-xs text-primary">Fabricado</span>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{produto.codigoBarras}</span>
                  </div>
                </td>
                <td>{produto.categoria}</td>
                <td className="text-right">R$ {produto.custo.toFixed(2).replace('.', ',')}</td>
                <td className="text-right font-medium">R$ {produto.preco.toFixed(2).replace('.', ',')}</td>
                <td className="text-right">
                  <span className={produto.margem >= 50 ? 'text-success' : produto.margem >= 30 ? 'text-warning' : 'text-destructive'}>
                    {produto.margem.toFixed(1)}%
                  </span>
                </td>
                <td className="text-center">
                  <span
                    className={
                      produto.estoqueAtual <= produto.estoqueMinimo
                        ? 'badge-destructive'
                        : 'badge-success'
                    }
                  >
                    {produto.estoqueAtual} {produto.unidade}
                  </span>
                </td>
                <td className="text-center">
                  <span className={produto.ativo ? 'badge-success' : 'badge-warning'}>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
