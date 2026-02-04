import { useState, useEffect } from 'react';
import { Plus, Search, Users, Phone, Mail, CreditCard, Gift, Star, MessageCircle, Edit, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClienteForm, ClienteFormData } from '@/components/forms/ClienteForm';
import { useToast } from '@/hooks/use-toast';
import { api, API_ENDPOINTS } from '@/services/api';

interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  endereco?: string;
  dataNascimento?: string;
  limiteCredito: number;
  saldoFiado: number;
  cashback: number;
  pontos: number;
  totalCompras: number;
  ultimaCompra: string;
}

const ERRO_SERVIDOR_OFFLINE = 'Erro: Servidor Local não encontrado. Certifique-se de que o CMD está aberto no computador principal.';

export default function Clientes() {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const carregarClientes = async () => {
    setLoading(true);
    setErro(null);
    
    const response = await api.get<any[]>(API_ENDPOINTS.clientes);
    
    if (response.error) {
      setErro(response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error);
      setClientes([]);
    } else if (response.data) {
      const clientesMapeados: Cliente[] = response.data.map((c: any) => ({
        id: c.id,
        nome: c.nome,
        cpfCnpj: c.cpf_cnpj || '',
        telefone: c.telefone || '',
        email: c.email || '',
        endereco: c.endereco || '',
        dataNascimento: c.data_nascimento || '',
        limiteCredito: c.limite_credito || 0,
        saldoFiado: c.saldo_fiado || 0,
        cashback: c.cashback || 0,
        pontos: c.pontos || 0,
        totalCompras: c.total_compras || 0,
        ultimaCompra: c.ultima_compra || new Date().toISOString().split('T')[0],
      }));
      setClientes(clientesMapeados);
    } else {
      setClientes([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpfCnpj.includes(busca) ||
      c.telefone.includes(busca)
  );

  const handleCreateCliente = async (data: ClienteFormData) => {
    setSaving(true);
    
    const payload = {
      nome: data.nome,
      cpf_cnpj: data.cpfCnpj || null,
      telefone: data.telefone || null,
      email: data.email || null,
      endereco: data.endereco || null,
      data_nascimento: data.dataNascimento || null,
      limite_credito: data.limiteCredito || 0,
      saldo_fiado: 0,
      cashback: 0,
      pontos: 0,
      ativo: true,
    };
    
    const response = await api.post<any>(API_ENDPOINTS.clientes, payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao cadastrar cliente', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarClientes();
      setDialogOpen(false);
      toast({ title: 'Cliente cadastrado', description: `${data.nome} foi adicionado.` });
    }
    
    setSaving(false);
  };

  const handleEditCliente = async (data: ClienteFormData) => {
    if (!editingCliente) return;
    setSaving(true);
    
    const payload = {
      nome: data.nome,
      cpf_cnpj: data.cpfCnpj || null,
      telefone: data.telefone || null,
      email: data.email || null,
      endereco: data.endereco || null,
      data_nascimento: data.dataNascimento || null,
      limite_credito: data.limiteCredito || 0,
    };
    
    const response = await api.patch<any>(API_ENDPOINTS.cliente(editingCliente.id), payload);
    
    if (response.error) {
      toast({ 
        title: 'Erro ao atualizar cliente', 
        description: response.status === 0 ? ERRO_SERVIDOR_OFFLINE : response.error,
        variant: 'destructive'
      });
    } else {
      await carregarClientes();
      setEditingCliente(null);
      toast({ title: 'Cliente atualizado', description: `${data.nome} foi atualizado.` });
    }
    
    setSaving(false);
  };

  const handleWhatsApp = (cliente: Cliente) => {
    const phone = cliente.telefone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${cliente.nome}!`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  if (erro && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Erro de Conexão</h2>
        <p className="text-muted-foreground text-center max-w-md">{erro}</p>
        <button className="btn-primary" onClick={carregarClientes}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div>
          <h1 className="module-title">Clientes (CRM)</h1>
          <p className="text-muted-foreground">Gestão de relacionamento com clientes</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={carregarClientes} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button className="btn-primary" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cliente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh] gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando clientes do servidor local...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Com Fiado</p>
              <p className="text-2xl font-bold text-warning">{clientes.filter((c) => c.saldoFiado > 0).length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Total Cashback</p>
              <p className="text-2xl font-bold text-success">R$ {clientes.reduce((acc, c) => acc + c.cashback, 0).toFixed(2).replace('.', ',')}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Total Pontos</p>
              <p className="text-2xl font-bold text-primary">{clientes.reduce((acc, c) => acc + c.pontos, 0).toLocaleString('pt-BR')}</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesFiltrados.map((cliente) => (
              <div key={cliente.id} className="stat-card hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">{cliente.nome.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{cliente.nome}</p>
                      <p className="text-sm text-muted-foreground">{cliente.cpfCnpj || '-'}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingCliente(cliente)} className="p-2 hover:bg-accent rounded-lg">
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{cliente.telefone || 'Sem telefone'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-sm text-muted-foreground">Saldo Fiado:</span>
                    <span className={`font-bold ${cliente.saldoFiado > 0 ? 'text-destructive' : 'text-success'}`}>
                      R$ {cliente.saldoFiado.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleWhatsApp(cliente)} className="btn-secondary flex-1 text-xs">
                    <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={dialogOpen || !!editingCliente} onOpenChange={(open) => {
        if (!open) {
          setDialogOpen(false);
          setEditingCliente(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCliente ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <ClienteForm
            initialData={editingCliente || undefined}
            onSubmit={editingCliente ? handleEditCliente : handleCreateCliente}
            onCancel={() => {
              setDialogOpen(false);
              setEditingCliente(null);
            }}
            isSaving={saving}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
