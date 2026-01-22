import { useState } from 'react';
import { Plus, Search, Filter, Package, AlertTriangle, MoreVertical, Barcode, Edit, Trash2, Power } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ProdutoForm, ProdutoFormData } from '@/components/forms/ProdutoForm';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>(produtosDemo);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigoBarras.includes(busca)
  );

  const produtosBaixoEstoque = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo && p.ativo);

  const handleCreateProduto = (data: ProdutoFormData) => {
    const margem = data.custo > 0 ? ((data.preco - data.custo) / data.custo) * 100 : 0;
    const novoProduto: Produto = {
      id: crypto.randomUUID(),
      nome: data.nome,
      codigoBarras: data.codigoBarras || '',
      categoria: data.categoria,
      unidade: data.unidade,
      custo: data.custo,
      preco: data.preco,
      margem,
      estoqueAtual: data.estoqueAtual,
      estoqueMinimo: data.estoqueMinimo,
      fabricado: data.fabricado,
      ativo: true,
    };
    setProdutos([...produtos, novoProduto]);
    setDialogOpen(false);
    toast({ title: 'Produto criado', description: `${data.nome} foi adicionado ao estoque.` });
  };

  const handleEditProduto = (data: ProdutoFormData) => {
    if (!editingProduto) return;
    const margem = data.custo > 0 ? ((data.preco - data.custo) / data.custo) * 100 : 0;
    const produtoAtualizado: Produto = {
      ...editingProduto,
      nome: data.nome,
      codigoBarras: data.codigoBarras || '',
      categoria: data.categoria,
      unidade: data.unidade,
      custo: data.custo,
      preco: data.preco,
      margem,
      estoqueAtual: data.estoqueAtual,
      estoqueMinimo: data.estoqueMinimo,
      fabricado: data.fabricado,
    };
    setProdutos(produtos.map(p => p.id === editingProduto.id ? produtoAtualizado : p));
    setEditingProduto(null);
    toast({ title: 'Produto atualizado', description: `${data.nome} foi atualizado.` });
  };

  const handleDeleteProduto = () => {
    if (!produtoToDelete) return;
    setProdutos(produtos.filter(p => p.id !== produtoToDelete.id));
    setProdutoToDelete(null);
    setDeleteDialogOpen(false);
    toast({ title: 'Produto excluído', description: 'O produto foi removido do estoque.' });
  };

  const handleToggleAtivo = (produto: Produto) => {
    setProdutos(produtos.map(p => p.id === produto.id ? { ...p, ativo: !p.ativo } : p));
    toast({ 
      title: produto.ativo ? 'Produto desativado' : 'Produto ativado', 
      description: `${produto.nome} foi ${produto.ativo ? 'desativado' : 'ativado'}.` 
    });
  };

  const openEditDialog = (produto: Produto) => {
    setEditingProduto(produto);
  };

  const openDeleteDialog = (produto: Produto) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e controle de estoque</p>
        </div>
        <button className="btn-primary" onClick={() => setDialogOpen(true)}>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(produto)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleAtivo(produto)}>
                        <Power className="w-4 h-4 mr-2" />
                        {produto.ativo ? 'Desativar' : 'Ativar'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(produto)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog Novo Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            onSubmit={handleCreateProduto} 
            onCancel={() => setDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Produto */}
      <Dialog open={!!editingProduto} onOpenChange={(open) => !open && setEditingProduto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
          </DialogHeader>
          {editingProduto && (
            <ProdutoForm 
              defaultValues={{
                nome: editingProduto.nome,
                codigoBarras: editingProduto.codigoBarras,
                categoria: editingProduto.categoria,
                unidade: editingProduto.unidade,
                custo: editingProduto.custo,
                preco: editingProduto.preco,
                estoqueAtual: editingProduto.estoqueAtual,
                estoqueMinimo: editingProduto.estoqueMinimo,
                fabricado: editingProduto.fabricado,
              }}
              onSubmit={handleEditProduto} 
              onCancel={() => setEditingProduto(null)} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Produto"
        description={`Tem certeza que deseja excluir "${produtoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDeleteProduto}
        variant="destructive"
      />
    </div>
  );
}
