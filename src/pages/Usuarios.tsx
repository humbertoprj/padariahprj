import { useState } from 'react';
import { Plus, Search, Shield, User, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'admin' | 'caixa' | 'vendedor' | 'estoquista' | 'financeiro' | 'producao';
  ativo: boolean;
  ultimoAcesso: string;
}

const usuariosDemo: Usuario[] = [
  { id: '1', nome: 'Administrador', email: 'admin@empresa.com', perfil: 'admin', ativo: true, ultimoAcesso: '2024-01-22 10:30' },
  { id: '2', nome: 'João Caixa', email: 'joao@empresa.com', perfil: 'caixa', ativo: true, ultimoAcesso: '2024-01-22 08:00' },
  { id: '3', nome: 'Maria Vendedora', email: 'maria@empresa.com', perfil: 'vendedor', ativo: true, ultimoAcesso: '2024-01-21 18:00' },
  { id: '4', nome: 'Pedro Estoque', email: 'pedro@empresa.com', perfil: 'estoquista', ativo: false, ultimoAcesso: '2024-01-15 14:00' },
];

const perfis = {
  admin: { label: 'Administrador', color: 'bg-primary text-primary-foreground' },
  caixa: { label: 'Caixa', color: 'bg-success text-success-foreground' },
  vendedor: { label: 'Vendedor', color: 'bg-chart-4 text-white' },
  estoquista: { label: 'Estoquista', color: 'bg-warning text-warning-foreground' },
  financeiro: { label: 'Financeiro', color: 'bg-chart-5 text-white' },
  producao: { label: 'Produção', color: 'bg-chart-3 text-white' },
};

const permissoes = [
  { modulo: 'Dashboard', admin: true, caixa: true, vendedor: true, estoquista: false, financeiro: true, producao: false },
  { modulo: 'PDV', admin: true, caixa: true, vendedor: true, estoquista: false, financeiro: false, producao: false },
  { modulo: 'Estoque', admin: true, caixa: false, vendedor: false, estoquista: true, financeiro: false, producao: true },
  { modulo: 'Produção', admin: true, caixa: false, vendedor: false, estoquista: false, financeiro: false, producao: true },
  { modulo: 'Financeiro', admin: true, caixa: false, vendedor: false, estoquista: false, financeiro: true, producao: false },
  { modulo: 'Clientes', admin: true, caixa: true, vendedor: true, estoquista: false, financeiro: false, producao: false },
  { modulo: 'Relatórios', admin: true, caixa: false, vendedor: false, estoquista: false, financeiro: true, producao: false },
  { modulo: 'Configurações', admin: true, caixa: false, vendedor: false, estoquista: false, financeiro: false, producao: false },
  { modulo: 'Usuários', admin: true, caixa: false, vendedor: false, estoquista: false, financeiro: false, producao: false },
];

export default function Usuarios() {
  const [busca, setBusca] = useState('');
  const [usuarios] = useState<Usuario[]>(usuariosDemo);
  const [showPermissoes, setShowPermissoes] = useState(false);

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div>
          <h1 className="module-title">Usuários e Permissões</h1>
          <p className="text-muted-foreground">Gerencie os usuários e suas permissões</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPermissoes(!showPermissoes)}
            className="btn-secondary"
          >
            <Shield className="w-4 h-4 mr-2" />
            {showPermissoes ? 'Ver Usuários' : 'Ver Permissões'}
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </button>
        </div>
      </div>

      {!showPermissoes ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Total Usuários</p>
              <p className="text-2xl font-bold text-foreground">{usuarios.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold text-success">{usuarios.filter((u) => u.ativo).length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Inativos</p>
              <p className="text-2xl font-bold text-muted-foreground">{usuarios.filter((u) => !u.ativo).length}</p>
            </div>
            <div className="stat-card">
              <p className="text-sm text-muted-foreground">Administradores</p>
              <p className="text-2xl font-bold text-primary">{usuarios.filter((u) => u.perfil === 'admin').length}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Lista de Usuários */}
          <div className="stat-card overflow-hidden p-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Último Acesso</th>
                  <th className="text-center">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{usuario.nome}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{usuario.email}</td>
                    <td>
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', perfis[usuario.perfil].color)}>
                        {perfis[usuario.perfil].label}
                      </span>
                    </td>
                    <td className="text-muted-foreground">
                      {new Date(usuario.ultimoAcesso).toLocaleString('pt-BR')}
                    </td>
                    <td className="text-center">
                      <span className={usuario.ativo ? 'badge-success' : 'badge-warning'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Matriz de Permissões */
        <div className="stat-card overflow-x-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">Matriz de Permissões</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Módulo</th>
                {Object.entries(perfis).map(([key, value]) => (
                  <th key={key} className="text-center">
                    <span className={cn('px-2 py-0.5 rounded text-xs', value.color)}>
                      {value.label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissoes.map((perm) => (
                <tr key={perm.modulo}>
                  <td className="font-medium">{perm.modulo}</td>
                  {Object.keys(perfis).map((perfil) => (
                    <td key={perfil} className="text-center">
                      {perm[perfil as keyof typeof perm] ? (
                        <Eye className="w-5 h-5 text-success mx-auto" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
