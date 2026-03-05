import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import FeedbackCenter from './FeedbackCenter';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'fernagest:ui:sidebar-collapsed:v1';

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    try {
      const savedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
      setIsSidebarCollapsed(savedValue === '1');
    } catch {
      setIsSidebarCollapsed(false);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((previous) => {
      const next = !previous;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebarCollapse} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
      <FeedbackCenter />
    </div>
  );
};

export default Layout;
