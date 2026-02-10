import React, { useState, useEffect } from 'react';
import { Bell, Search, Menu, Calendar, Clock, User } from 'lucide-react';

interface HeaderProps {
  toggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-AO', {
      weekday: 'short',
      day: '2-digit',
      month: 'long'
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-AO', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        
        {/* Company Info for Client */}
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Cliente</span>
          <span className="text-sm font-bold text-gray-800 leading-tight">Minha Loja de Sucesso</span>
        </div>

        {/* Divider */}
        <div className="hidden md:block h-8 w-px bg-gray-200 mx-2"></div>

        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" />
            <span className="capitalize">{formatDate(currentDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-green-600" />
            <span>{formatTime(currentDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search Bar - Compact */}
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all hover:bg-white"
          />
        </div>

        <button className="relative p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
           <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md">
             <User size={16} />
           </div>
           <div className="hidden md:flex flex-col text-right">
             <span className="text-xs font-bold text-gray-700">Admin</span>
             <span className="text-[10px] text-gray-500">Gestor</span>
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;