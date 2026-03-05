import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';
import Sales from './pages/Sales';
import CRM from './pages/CRM';
import Purchases from './pages/Purchases';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import HR from './pages/HR';
import RouteGuard from './components/RouteGuard';
import {
  APP_THEME_STORAGE_KEY,
  APP_THEME_UPDATED_EVENT,
  applyTheme,
  normalizeTheme,
  readStoredTheme
} from './utils/theme';
import {
  APP_LANGUAGE_STORAGE_KEY,
  APP_LANGUAGE_UPDATED_EVENT,
  normalizeLanguage,
  readStoredLanguage
} from './utils/language';

const App = () => {
  useEffect(() => {
    applyTheme(readStoredTheme());
    document.documentElement.lang = readStoredLanguage();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === APP_THEME_STORAGE_KEY) {
        applyTheme(normalizeTheme(event.newValue));
      }
      if (event.key === APP_LANGUAGE_STORAGE_KEY) {
        document.documentElement.lang = normalizeLanguage(event.newValue);
      }
    };

    const handleThemeUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<'light' | 'dark'>;
      applyTheme(normalizeTheme(customEvent.detail));
    };

    const handleLanguageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<'pt-AO' | 'en-US'>;
      document.documentElement.lang = normalizeLanguage(customEvent.detail);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);
    window.addEventListener(APP_LANGUAGE_UPDATED_EVENT, handleLanguageUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);
      window.removeEventListener(APP_LANGUAGE_UPDATED_EVENT, handleLanguageUpdated as EventListener);
    };
  }, []);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={
              <RouteGuard required="dashboard.view">
                <Dashboard />
              </RouteGuard>
            }
          />
          <Route
            path="/inventory"
            element={
              <RouteGuard required="inventory.view">
                <Inventory />
              </RouteGuard>
            }
          />
          <Route
            path="/finance"
            element={
              <RouteGuard required="finance.view">
                <Finance />
              </RouteGuard>
            }
          />
          <Route
            path="/sales"
            element={
              <RouteGuard required="sales.view">
                <Sales />
              </RouteGuard>
            }
          />
          <Route
            path="/crm"
            element={
              <RouteGuard required="crm.view">
                <CRM />
              </RouteGuard>
            }
          />
          <Route
            path="/purchases"
            element={
              <RouteGuard required="purchases.view">
                <Purchases />
              </RouteGuard>
            }
          />
          <Route
            path="/projects"
            element={
              <RouteGuard required="projects.view">
                <Projects />
              </RouteGuard>
            }
          />
          <Route
            path="/hr"
            element={
              <RouteGuard required="hr.view">
                <HR />
              </RouteGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <RouteGuard required="reports.view">
                <Reports />
              </RouteGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <RouteGuard required="settings.view">
                <Settings />
              </RouteGuard>
            }
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
