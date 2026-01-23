import { useState } from 'react';
import { Plus, Search, Users, Phone, Mail, CreditCard, Gift, Star, MessageCircle, Edit } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ClienteForm, ClienteFormData } from '@/components/forms/ClienteForm';
import { useToast } from '@/hooks/use-toast';

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

export default function Clientes() {
  const { toast } = useToast();
  const [busca, setBusca] = useState('');
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.cpfCnpj.includes(busca) ||
      c.telefone.includes(busca)
  );

  const handleCreateCliente = (data: ClienteFormData) => {
    const novoCliente: Cliente = {
      id: crypto.randomUUID(),
      nome: data.nome,
      cpfCnpj: data.cpfCnpj || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco: data.endereco,
      dataNascimento: data.dataNascimento,
      limiteCredito: data.limiteCredito,
      saldoFiado: 0,
      cashback: 0,
      pontos: 0,
      totalCompras: 0,
      ultimaCompra: new Date().toISOString().split('T')[0],
    };
    setClientes([...clientes, novoCliente]);
    setDialogOpen(false);
    toast({ title: 'Cliente cadastrado', description: `${data.nome} foi adicionado.` });
  };

  const handleEditCliente = (data: ClienteFormData) => {
    if (!editingCliente) return;
    const clienteAtualizado: Cliente = {
      ...editingCliente,
      nome: data.nome,
      cpfCnpj: data.cpfCnpj || '',
      telefone: data.telefone || '',
      email: data.email || '',
      endereco: data.endereco,
      dataNascimento: data.dataNascimento,
      limiteCredito: data.limiteCredito,
    };
    setClientes(clientes.map(c => c.id === editingCliente.id ? clienteAtualizado : c));
    setEditingCliente(null);
    toast({ title: 'Cliente atualizado', description: `${data.nome} foi atualizado.` });
  };

  const handleWhatsApp = (cliente: Cliente) => {
    const phone = cliente.telefone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${cliente.nome}!`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Clientes (CRM)</h1>
          <p className="text-muted-foreground">Gestão de relacionamento com clientes</p>
        </div>
        <button className="btn-primary" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clientes</p>
              <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Com Fiado</p>
              <p className="text-2xl font-bold text-warning">{clientes.filter((c) => c.saldoFiado > 0).length}</p>
            </div>
            <CreditCard className="w-8 h-8 text-warning/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Cashback</p>
              <p className="text-2xl font-bold text-success">
                R$ {clientes.reduce((acc, c) => acc + c.cashback, 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            <Gift className="w-8 h-8 text-success/50" />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Pontos</p>
              <p className="text-2xl font-bold text-primary">
                {clientes.reduce((acc, c) => acc + c.pontos, 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <Star className="w-8 h-8 text-primary/50" />
          </div>
        </div>
      </div>

      {/* Search */}
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

      {/* Grid de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientesFiltrados.map((cliente) => (
          <div key={cliente.id} className="stat-card hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary">
                    {cliente.nome.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">{cliente.nome}</p>
                  <p className="text-sm text-muted-foreground">{cliente.cpfCnpj}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                  onClick={() => setEditingCliente(cliente)}
                >
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </button>
                <button 
                  className="p-2 hover:bg-success/10 rounded-lg transition-colors"
                  onClick={() => handleWhatsApp(cliente)}
                >
                  <MessageCircle className="w-5 h-5 text-success" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{cliente.telefone}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{cliente.email}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Limite Crédito</p>
                <p className="font-medium text-foreground">R$ {cliente.limiteCredito.toFixed(2).replace('.', ',')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Fiado</p>
                <p className={`font-medium ${cliente.saldoFiado > 0 ? 'text-warning' : 'text-foreground'}`}>
                  R$ {cliente.saldoFiado.toFixed(2).replace('.', ',')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cashback</p>
                <p className="font-medium text-success">R$ {cliente.cashback.toFixed(2).replace('.', ',')}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pontos</p>
                <p className="font-medium text-primary">{cliente.pontos.toLocaleString('pt-BR')}</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>Total: R$ {cliente.totalCompras.toFixed(2).replace('.', ',')}</span>
              <span>Última: {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog Novo Cliente */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm 
            onSubmit={handleCreateCliente} 
            onCancel={() => setDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Cliente */}
      <Dialog open={!!editingCliente} onOpenChange={(open) => !open && setEditingCliente(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          {editingCliente && (
            <ClienteForm 
              defaultValues={{
                nome: editingCliente.nome,
                cpfCnpj: editingCliente.cpfCnpj,
                telefone: editingCliente.telefone,
                email: editingCliente.email,
                endereco: editingCliente.endereco,
                dataNascimento: editingCliente.dataNascimento,
                limiteCredito: editingCliente.limiteCredito,
              }}
              onSubmit={handleEditCliente} 
              onCancel={() => setEditingCliente(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
