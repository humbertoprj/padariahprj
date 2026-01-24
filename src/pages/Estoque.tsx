import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Package, AlertTriangle, MoreVertical, Barcode, Edit, Trash2, Power, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ProdutoForm, ProdutoFormData } from '@/components/forms/ProdutoForm';
import { ConfirmDialog } from '@/components/dialogs/ConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { api, API_ENDPOINTS } from '@/services/api';

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

// Mensagem padrão de erro de conexão
const ERRO_SERVIDOR_OFFLINE = 'Erro: Servidor Local não encontrado. Certifique-se de que o CMD está aberto no computador principal.';

export default function Estoque() {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);

  // Carregar produtos da API local
  const carregarProdutos = async () => {
    setLoading(true);
    setErro(null);
    
    const response = await api.get<any[]>(API_ENDPOINTS.produtos);
    
    if (response.error) {
      setErro(response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error);
      setProdutos([]);
    } else if (response.data) {
      // Mapear dados da API para interface local
      const produtosMapeados: Produto[] = response.data.map((p: any) => ({
        id: p.id,
        nome: p.nome,
        codigoBarras: p.codigo_barras || '',
        categoria: p.categoria || 'Outros',
        unidade: p.unidade || 'UN',
        custo: p.custo || 0,
        preco: p.preco || 0,
        margem: p.margem || 0,
        estoqueAtual: p.estoque_atual || 0,
        estoqueMinimo: p.estoque_minimo || 0,
        fabricado: p.fabricado || false,
        ativo: p.ativo !== false,
      }));
      setProdutos(produtosMapeados);
    } else {
      setProdutos([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.codigoBarras.includes(busca)
  );

  const produtosBaixoEstoque = produtos.filter((p) => p.estoqueAtual <= p.estoqueMinimo && p.ativo);

  // Criar produto via API local
  const handleCreateProduto = async (data: ProdutoFormData) => {
    setSaving(true);
    
    const margem = data.custo > 0 ? ((data.preco - data.custo) / data.custo) * 100 : 0;
    
    // Payload para API local (snake_case)
    const payload = {
      nome: data.nome,
      codigo_barras: data.codigoBarras || null,
      categoria: data.categoria,
      unidade: data.unidade,
      custo: data.custo,
      preco: data.preco,
      margem,
      estoque_atual: data.estoqueAtual,
      estoque_minimo: data.estoqueMinimo,
      fabricado: data.fabricado,
      ativo: true,
    };
    
    const response = await api.post<any>(API_ENDPOINTS.produtos, payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao criar produto', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      // Recarregar lista para garantir consistência
      await carregarProdutos();
      setDialogOpen(false);
      toast({ title: 'Produto criado', description: `${data.nome} foi adicionado ao estoque.` });
    }
    
    setSaving(false);
  };

  // Editar produto via API local
  const handleEditProduto = async (data: ProdutoFormData) => {
    if (!editingProduto) return;
    setSaving(true);
    
    const margem = data.custo > 0 ? ((data.preco - data.custo) / data.custo) * 100 : 0;
    
    const payload = {
      nome: data.nome,
      codigo_barras: data.codigoBarras || null,
      categoria: data.categoria,
      unidade: data.unidade,
      custo: data.custo,
      preco: data.preco,
      margem,
      estoque_atual: data.estoqueAtual,
      estoque_minimo: data.estoqueMinimo,
      fabricado: data.fabricado,
    };
    
    const response = await api.put<any>(API_ENDPOINTS.produto(editingProduto.id), payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao atualizar produto', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarProdutos();
      setEditingProduto(null);
      toast({ title: 'Produto atualizado', description: `${data.nome} foi atualizado.` });
    }
    
    setSaving(false);
  };

  // Deletar produto via API local
  const handleDeleteProduto = async () => {
    if (!produtoToDelete) return;
    setSaving(true);
    
    const response = await api.delete<any>(API_ENDPOINTS.produto(produtoToDelete.id));
    
    if (response.error) {
      toast({ 
        title: 'Erro ao excluir produto', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarProdutos();
      setProdutoToDelete(null);
      setDeleteDialogOpen(false);
      toast({ title: 'Produto excluído', description: 'O produto foi removido do estoque.' });
    }
    
    setSaving(false);
  };

  // Toggle ativo via API local
  const handleToggleAtivo = async (produto: Produto) => {
    const response = await api.patch<any>(API_ENDPOINTS.produto(produto.id), {
      ativo: !produto.ativo
    });
    
    if (response.error) {
      toast({ 
        title: 'Erro ao alterar status', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarProdutos();
      toast({ 
        title: produto.ativo ? 'Produto desativado' : 'Produto ativado', 
        description: `${produto.nome} foi ${produto.ativo ? 'desativado' : 'ativado'}.` 
      });
    }
  };

  const openEditDialog = (produto: Produto) => {
    setEditingProduto(produto);
  };

  const openDeleteDialog = (produto: Produto) => {
    setProdutoToDelete(produto);
    setDeleteDialogOpen(true);
  };

  // Tela de erro
  if (erro && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Erro de Conexão</h2>
        <p className="text-muted-foreground text-center max-w-md">{erro}</p>
        <button className="btn-primary" onClick={carregarProdutos}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Estoque</h1>
          <p className="text-muted-foreground">Gerencie seus produtos e controle de estoque</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={carregarProdutos} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button className="btn-primary" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando produtos do servidor local...</p>
        </div>
      )}

      {!loading && (
        <>
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
            {produtos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Package className="w-12 h-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum produto cadastrado</p>
                <button className="btn-primary" onClick={() => setDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
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
                          <span className="text-muted-foreground">{produto.codigoBarras || '-'}</span>
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
            )}
          </div>
        </>
      )}

      {/* Dialog Novo Produto */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Produto</DialogTitle>
          </DialogHeader>
          <ProdutoForm 
            onSubmit={handleCreateProduto} 
            onCancel={() => setDialogOpen(false)}
            isLoading={saving}
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
              isLoading={saving}
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
