import React, { useEffect, useState } from 'react';
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
  Truck,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  COMPANY_DEFAULT_NAME,
  COMPANY_DEFAULT_SLOGAN,
  COMPANY_LOGO_STORAGE_KEY,
  COMPANY_LOGO_UPDATED_EVENT,
  COMPANY_NAME_STORAGE_KEY,
  COMPANY_NAME_UPDATED_EVENT,
  COMPANY_SLOGAN_STORAGE_KEY,
  COMPANY_SLOGAN_UPDATED_EVENT
} from '../utils/branding';
import { useI18n } from '../utils/i18n';
import { AppPermission } from '../utils/permissions';
import { useAuthorization } from '../utils/useAuthorization';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { t } = useI18n();
  const { can, roleLabel } = useAuthorization();
  const [companyLogo, setCompanyLogo] = useState('');
  const [companyName, setCompanyName] = useState(COMPANY_DEFAULT_NAME);
  const [companySlogan, setCompanySlogan] = useState(COMPANY_DEFAULT_SLOGAN);

  useEffect(() => {
    try {
      const savedLogo = window.localStorage.getItem(COMPANY_LOGO_STORAGE_KEY);
      if (savedLogo) setCompanyLogo(savedLogo);
      const savedCompanyName = window.localStorage.getItem(COMPANY_NAME_STORAGE_KEY);
      if (savedCompanyName) setCompanyName(savedCompanyName);
      const savedCompanySlogan = window.localStorage.getItem(COMPANY_SLOGAN_STORAGE_KEY);
      if (savedCompanySlogan) setCompanySlogan(savedCompanySlogan);
    } catch {
      setCompanyLogo('');
      setCompanyName(COMPANY_DEFAULT_NAME);
      setCompanySlogan(COMPANY_DEFAULT_SLOGAN);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COMPANY_LOGO_STORAGE_KEY) {
        setCompanyLogo(event.newValue || '');
      }
      if (event.key === COMPANY_NAME_STORAGE_KEY) {
        setCompanyName(event.newValue || COMPANY_DEFAULT_NAME);
      }
      if (event.key === COMPANY_SLOGAN_STORAGE_KEY) {
        setCompanySlogan(event.newValue || COMPANY_DEFAULT_SLOGAN);
      }
    };

    const handleLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCompanyLogo(customEvent.detail || '');
    };

    const handleCompanyNameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCompanyName(customEvent.detail || COMPANY_DEFAULT_NAME);
    };

    const handleCompanySloganUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCompanySlogan(customEvent.detail || COMPANY_DEFAULT_SLOGAN);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(COMPANY_LOGO_UPDATED_EVENT, handleLogoUpdated as EventListener);
    window.addEventListener(COMPANY_NAME_UPDATED_EVENT, handleCompanyNameUpdated as EventListener);
    window.addEventListener(COMPANY_SLOGAN_UPDATED_EVENT, handleCompanySloganUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COMPANY_LOGO_UPDATED_EVENT, handleLogoUpdated as EventListener);
      window.removeEventListener(COMPANY_NAME_UPDATED_EVENT, handleCompanyNameUpdated as EventListener);
      window.removeEventListener(COMPANY_SLOGAN_UPDATED_EVENT, handleCompanySloganUpdated as EventListener);
    };
  }, []);

  const navItems: Array<{
    name: string;
    icon: React.ElementType;
    path: string;
    requiredPermission: AppPermission;
  }> = [
    { name: t('nav.dashboard'), icon: LayoutDashboard, path: '/', requiredPermission: 'dashboard.view' },
    { name: t('nav.sales'), icon: ShoppingCart, path: '/sales', requiredPermission: 'sales.view' },
    { name: t('nav.inventory'), icon: Package, path: '/inventory', requiredPermission: 'inventory.view' },
    { name: t('nav.crm'), icon: Users, path: '/crm', requiredPermission: 'crm.view' },
    { name: t('nav.finance'), icon: Wallet, path: '/finance', requiredPermission: 'finance.view' },
    { name: t('nav.purchases'), icon: Truck, path: '/purchases', requiredPermission: 'purchases.view' },
    { name: t('nav.projects'), icon: Briefcase, path: '/projects', requiredPermission: 'projects.view' },
    { name: t('nav.hr'), icon: User, path: '/hr', requiredPermission: 'hr.view' },
    { name: t('nav.reports'), icon: PieChart, path: '/reports', requiredPermission: 'reports.view' }
  ];

  const visibleNavItems = navItems.filter((item) => can(item.requiredPermission));

  return (
    <aside
      className={`bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col h-screen fixed left-0 top-0 z-10 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="px-4 py-3 border-b border-slate-800">
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-start gap-3'}`}>
          {/* Logo Brand Icon */}
          <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
           {companyLogo ? (
             <img src={companyLogo} alt="Logo da empresa" className="w-full h-full object-contain" />
           ) : (
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
           )}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col pt-0.5">
              <span className="text-white font-bold text-base leading-tight tracking-tight break-words">
                {companyName || COMPANY_DEFAULT_NAME}
              </span>
              <span className="text-[9px] text-slate-400 tracking-wider font-medium whitespace-nowrap">
                {companySlogan || COMPANY_DEFAULT_SLOGAN}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
              isCollapsed ? '' : 'ml-auto'
            }`}
            title={isCollapsed ? t('sidebar.expand_menu') : t('sidebar.collapse_menu')}
            aria-label={isCollapsed ? t('sidebar.expand_sidebar') : t('sidebar.collapse_sidebar')}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              title={item.name}
              aria-label={item.name}
              className={({ isActive }) =>
                `flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
                } py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              <item.icon size={18} />
              {!isCollapsed && item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800">
        {can('settings.view') && (
          <NavLink
            to="/settings"
            title={t('nav.settings')}
            aria-label={t('nav.settings')}
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            } py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors`}
          >
            <Settings size={18} />
            {!isCollapsed && t('nav.settings')}
          </NavLink>
        )}
        <div className={`mt-4 ${isCollapsed ? 'flex justify-center' : 'flex items-center gap-3 px-3'}`}>
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
            AD
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">{t('sidebar.admin_user')}</span>
              <span className="text-[10px] text-slate-500">{roleLabel}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

