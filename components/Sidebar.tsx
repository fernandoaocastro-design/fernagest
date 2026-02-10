import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  PieChart, 
  Settings, 
  Wallet,
  Briefcase,
  Truck
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Vendas', icon: ShoppingCart, path: '/sales' },
    { name: 'Produtos & Estoque', icon: Package, path: '/inventory' },
    { name: 'Clientes (CRM)', icon: Users, path: '/crm' },
    { name: 'Financeiro', icon: Wallet, path: '/finance' },
    { name: 'Compras', icon: Truck, path: '/purchases' },
    { name: 'Projetos', icon: Briefcase, path: '/projects' },
    { name: 'Relatórios', icon: PieChart, path: '/reports' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10 transition-all duration-300">
      <div className="h-20 flex items-center px-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {/* Logo Brand Icon */}
          <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
             <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Blue Swoosh/Shield bottom */}
                <path d="M10 65 Q 50 95 90 65" stroke="#005596" strokeWidth="10" fill="none" strokeLinecap="round" />
                <path d="M15 55 Q 50 85 85 55" stroke="#005596" strokeWidth="2" fill="none" opacity="0.2" />
                
                {/* Bars - Colors approximated from logo */}
                {/* Left Bar - Blue */}
                <rect x="25" y="40" width="12" height="25" rx="2" fill="#005596" />
                {/* Middle Bar - Green */}
                <rect x="44" y="28" width="12" height="37" rx="2" fill="#43a047" />
                {/* Right Bar - Green */}
                <rect x="63" y="15" width="12" height="50" rx="2" fill="#43a047" />
             </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline">
              <span className="text-white font-bold text-lg leading-tight tracking-tight">Ferna</span>
              <span className="text-green-400 font-bold text-lg leading-tight tracking-tight">Gest</span>
            </div>
            <span className="text-[9px] text-slate-400 tracking-wider font-medium whitespace-nowrap">GESTÃO INTELIGENTE</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Settings size={18} />
          Configurações
        </NavLink>
        <div className="mt-4 flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            AD
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-white">Admin User</span>
            <span className="text-[10px] text-slate-500">FernaGest Admin</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;