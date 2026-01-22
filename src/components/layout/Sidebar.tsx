import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  DollarSign,
  Users,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  Building2,
  UserCog,
  BarChart3,
  Smartphone,
} from 'lucide-react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ShoppingCart, label: 'PDV', path: '/pdv' },
  { icon: Package, label: 'Estoque', path: '/estoque' },
  { icon: Factory, label: 'Produção', path: '/producao' },
  { icon: DollarSign, label: 'Financeiro', path: '/financeiro' },
  { icon: Users, label: 'Clientes', path: '/clientes' },
  { icon: FileText, label: 'Relatórios', path: '/relatorios' },
  { icon: UserCog, label: 'Usuários', path: '/usuarios' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { empresa } = useEmpresa();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar flex flex-col transition-all duration-300 z-50',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            {empresa.logoUrl ? (
              <img src={empresa.logoUrl} alt={empresa.nome} className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground truncate max-w-[140px]">
                {empresa.nome}
              </span>
              <span className="text-xs text-sidebar-foreground/60">Sistema ERP</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-item',
                isActive && 'sidebar-item-active',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Mobile App Indicator */}
      <div className={cn('p-3 border-t border-sidebar-border', collapsed && 'px-2')}>
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg bg-sidebar-accent text-sidebar-foreground/80',
            collapsed && 'justify-center px-2'
          )}
        >
          <Smartphone className="w-5 h-5 flex-shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium">App Android</span>
              <span className="text-xs text-sidebar-foreground/60">Sincronizado</span>
            </div>
          )}
        </div>
      </div>

      {/* Collapse Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-sidebar-primary rounded-full flex items-center justify-center text-sidebar-primary-foreground hover:bg-sidebar-primary/90 transition-colors shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
