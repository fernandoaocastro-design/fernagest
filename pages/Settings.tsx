import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Building, Users, Settings as Cog, Bell, Shield, Globe, 
  Save, Upload, Plus, Trash2, Edit2, CheckCircle, XCircle, MessageCircle, CreditCard, Hash,
  Download, Moon, Sun, Smartphone, Mail, Lock, Database, ToggleLeft, ToggleRight
} from 'lucide-react';
import { MOCK_USERS, MOCK_AUDIT_LOGS } from '../constants';
import { supabase } from '../supabaseClient';
import { confirmAction, notifyError, notifyInfo, notifySuccess } from '../utils/feedback';
import {
  COMPANY_DEFAULT_SLOGAN,
  COMPANY_DEFAULT_NAME,
  COMPANY_LOGO_STORAGE_KEY,
  COMPANY_LOGO_UPDATED_EVENT,
  COMPANY_NAME_STORAGE_KEY,
  COMPANY_NAME_UPDATED_EVENT,
  COMPANY_SLOGAN_STORAGE_KEY,
  COMPANY_SLOGAN_UPDATED_EVENT
} from '../utils/branding';
import {
  APP_THEME_STORAGE_KEY,
  APP_THEME_UPDATED_EVENT,
  AppTheme,
  normalizeTheme,
  readStoredTheme,
  saveTheme
} from '../utils/theme';
import {
  APP_CURRENCY_STORAGE_KEY,
  APP_CURRENCY_UPDATED_EVENT,
  APP_CURRENCY_OPTIONS,
  AppCurrency,
  normalizeCurrency,
  readStoredCurrency,
  saveCurrency
} from '../utils/currency';
import {
  APP_LANGUAGE_STORAGE_KEY,
  APP_LANGUAGE_UPDATED_EVENT,
  APP_LANGUAGE_OPTIONS,
  AppLanguage,
  normalizeLanguage,
  readStoredLanguage,
  saveLanguage
} from '../utils/language';
import { useI18n } from '../utils/i18n';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  NOTIFICATION_PREFERENCES_UPDATED_EVENT,
  NotificationPreferences,
  readStoredNotificationPreferences,
  saveNotificationPreferences
} from '../utils/notificationPreferences';

const HR_SETTINGS_KEY = 'fernagest:hr:settings:v1';
const SETTINGS_TABS = ['general', 'users', 'system', 'notifications', 'security', 'integrations'] as const;

const parseTabFromSearch = (search: string) => {
  const tab = new URLSearchParams(search).get('tab');
  if (tab && SETTINGS_TABS.includes(tab as (typeof SETTINGS_TABS)[number])) return tab;
  return 'general';
};

// Logotipo gerado via código (SVG) baseado na descrição da marca
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTAO INTELIGENTE%3C/text%3E%3C/svg%3E";

const Settings = () => {
  const { t } = useI18n();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => parseTabFromSearch(location.search));
  const [theme, setTheme] = useState<AppTheme>(readStoredTheme());
  const [logo, setLogo] = useState(FERNAGEST_LOGO);
  const [companyName, setCompanyName] = useState(COMPANY_DEFAULT_NAME);
  const [companySlogan, setCompanySlogan] = useState(COMPANY_DEFAULT_SLOGAN);
  const [vacationSubsidyPercent, setVacationSubsidyPercent] = useState(33.33);
  const [currency, setCurrency] = useState<AppCurrency>(readStoredCurrency());
  const [language, setLanguage] = useState<AppLanguage>(readStoredLanguage());
  
  // State for Users
  const [users, setUsers] = useState(MOCK_USERS);

  // State for Modules
  const [modules, setModules] = useState([
      { id: 'finance', labelKey: 'settings.module_finance_cashflow', active: true },
      { id: 'sales', labelKey: 'settings.module_sales_management', active: true },
      { id: 'stock', labelKey: 'settings.module_inventory_control', active: true },
      { id: 'crm', labelKey: 'settings.module_crm', active: true },
      { id: 'projects', labelKey: 'settings.module_projects_management', active: true },
      { id: 'hr', labelKey: 'settings.module_hr', active: true },
  ]);

  // State for Security Policies
  const [securityPolicies, setSecurityPolicies] = useState({
      twoFactor: false,
      forcePasswordChange: true,
      lockout: true
  });

  // State for Notifications
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    () => readStoredNotificationPreferences()
  );

  // State for Integrations
  const [integrations, setIntegrations] = useState([
      { id: 'whatsapp', nameKey: 'settings.integration_whatsapp', connected: false, icon: MessageCircle },
      { id: 'stripe', nameKey: 'settings.integration_stripe', connected: true, icon: CreditCard },
      { id: 'slack', nameKey: 'settings.integration_slack', connected: false, icon: Hash }
  ]);

  const saveCompanyLogo = (nextLogo: string) => {
    try {
      localStorage.setItem(COMPANY_LOGO_STORAGE_KEY, nextLogo);
      window.dispatchEvent(
        new CustomEvent<string>(COMPANY_LOGO_UPDATED_EVENT, {
          detail: nextLogo
        })
      );
    } catch {
      // ignore storage errors
    }
  };

  const saveCompanyName = (nextName: string) => {
    try {
      localStorage.setItem(COMPANY_NAME_STORAGE_KEY, nextName);
      window.dispatchEvent(
        new CustomEvent<string>(COMPANY_NAME_UPDATED_EVENT, {
          detail: nextName
        })
      );
    } catch {
      // ignore storage errors
    }
  };

  const saveCompanySlogan = (nextSlogan: string) => {
    try {
      localStorage.setItem(COMPANY_SLOGAN_STORAGE_KEY, nextSlogan);
      window.dispatchEvent(
        new CustomEvent<string>(COMPANY_SLOGAN_UPDATED_EVENT, {
          detail: nextSlogan
        })
      );
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HR_SETTINGS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (typeof parsed.vacationSubsidyPercent === 'number') {
        setVacationSubsidyPercent(parsed.vacationSubsidyPercent);
      }
    } catch {
      // keep default
    }
  }, []);

  useEffect(() => {
    try {
      const savedLogo = localStorage.getItem(COMPANY_LOGO_STORAGE_KEY);
      if (savedLogo) setLogo(savedLogo);
    } catch {
      // keep current logo
    }
  }, []);

  useEffect(() => {
    try {
      const savedCompanyName = localStorage.getItem(COMPANY_NAME_STORAGE_KEY);
      if (savedCompanyName) setCompanyName(savedCompanyName);
    } catch {
      // keep current company name
    }
  }, []);

  useEffect(() => {
    try {
      const savedCompanySlogan = localStorage.getItem(COMPANY_SLOGAN_STORAGE_KEY);
      if (savedCompanySlogan) setCompanySlogan(savedCompanySlogan);
    } catch {
      // keep current company slogan
    }
  }, []);

  useEffect(() => {
    setTheme(readStoredTheme());

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== APP_THEME_STORAGE_KEY) return;
      setTheme(normalizeTheme(event.newValue));
    };

    const handleThemeUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AppTheme>;
      setTheme(normalizeTheme(customEvent.detail));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    setCurrency(readStoredCurrency());

    const handleCurrencyStorage = (event: StorageEvent) => {
      if (event.key !== APP_CURRENCY_STORAGE_KEY) return;
      setCurrency(normalizeCurrency(event.newValue));
    };

    const handleCurrencyUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AppCurrency>;
      setCurrency(normalizeCurrency(customEvent.detail));
    };

    window.addEventListener('storage', handleCurrencyStorage);
    window.addEventListener(APP_CURRENCY_UPDATED_EVENT, handleCurrencyUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleCurrencyStorage);
      window.removeEventListener(APP_CURRENCY_UPDATED_EVENT, handleCurrencyUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    setLanguage(readStoredLanguage());

    const handleLanguageStorage = (event: StorageEvent) => {
      if (event.key !== APP_LANGUAGE_STORAGE_KEY) return;
      setLanguage(normalizeLanguage(event.newValue));
    };

    const handleLanguageUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AppLanguage>;
      setLanguage(normalizeLanguage(customEvent.detail));
    };

    window.addEventListener('storage', handleLanguageStorage);
    window.addEventListener(APP_LANGUAGE_UPDATED_EVENT, handleLanguageUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleLanguageStorage);
      window.removeEventListener(APP_LANGUAGE_UPDATED_EVENT, handleLanguageUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    setActiveTab(parseTabFromSearch(location.search));
  }, [location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshNotifications = () => {
      setNotifications(readStoredNotificationPreferences());
    };

    const handleNotificationsStorage = (event: StorageEvent) => {
      if (event.key !== NOTIFICATION_PREFERENCES_STORAGE_KEY) return;
      refreshNotifications();
    };

    const handleNotificationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationPreferences>;
      setNotifications(customEvent.detail || DEFAULT_NOTIFICATION_PREFERENCES);
    };

    refreshNotifications();

    window.addEventListener('storage', handleNotificationsStorage);
    window.addEventListener(
      NOTIFICATION_PREFERENCES_UPDATED_EVENT,
      handleNotificationsUpdated as EventListener
    );

    return () => {
      window.removeEventListener('storage', handleNotificationsStorage);
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_UPDATED_EVENT,
        handleNotificationsUpdated as EventListener
      );
    };
  }, []);

  // Handlers
  const handleSaveGeneral = () => {
    const normalizedCompanyName = companyName.trim() || COMPANY_DEFAULT_NAME;
    const normalizedCompanySlogan = companySlogan.trim() || COMPANY_DEFAULT_SLOGAN;
    setCompanyName(normalizedCompanyName);
    setCompanySlogan(normalizedCompanySlogan);
    saveCompanyLogo(logo);
    saveCompanyName(normalizedCompanyName);
    saveCompanySlogan(normalizedCompanySlogan);
    notifySuccess(t('settings.save_general_success'));
  };

  const handleThemeChange = (nextTheme: AppTheme) => {
    const normalizedTheme = normalizeTheme(nextTheme);
    setTheme(normalizedTheme);
    saveTheme(normalizedTheme);
  };

  const handleCurrencyChange = (nextCurrency: AppCurrency) => {
    const normalizedCurrency = normalizeCurrency(nextCurrency);
    setCurrency(normalizedCurrency);
    saveCurrency(normalizedCurrency);
    notifySuccess(t('settings.currency_updated'));
  };

  const handleLanguageChange = (nextLanguage: AppLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage);
    setLanguage(normalizedLanguage);
    saveLanguage(normalizedLanguage);
    notifySuccess(t('settings.language_updated'));
  };
  
  const handleDeleteUser = async (id: string) => {
      const confirmed = await confirmAction({
        title: t('settings.delete_user_title'),
        message: t('settings.delete_user_message'),
        confirmLabel: t('settings.delete_user_confirm'),
        cancelLabel: t('common.cancel'),
        danger: true
      });
      if (!confirmed) return;
      setUsers(users.filter(u => u.id !== id));
      notifySuccess(t('settings.user_removed_success'));
  };
  
  const handleEditUser = (user: any) => notifyInfo(t('settings.edit_user_simulation', { name: user.name }));
  
  const toggleModule = (id: string) => setModules(modules.map(m => m.id === id ? {...m, active: !m.active} : m));
  
  const togglePolicy = (key: keyof typeof securityPolicies) => setSecurityPolicies({...securityPolicies, [key]: !securityPolicies[key]});
  
  const handleExportLogs = () => {
      const csvContent = "data:text/csv;charset=utf-8," + `${t('settings.audit_csv_header')}\n` + MOCK_AUDIT_LOGS.map(l => `${l.timestamp},${l.user},${l.action},${l.module},${l.ip}`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "audit_logs.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };
  
  const handleBackup = () => notifyInfo(t('settings.backup_started'));
  
  const handleSaveHrSettings = () => {
      localStorage.setItem(
        HR_SETTINGS_KEY,
        JSON.stringify({
          vacationSubsidyPercent
        })
      );
      notifySuccess(t('settings.hr_settings_saved'));
  };
  
  
  const handleResetMasterPassword = async () => {
      const confirmed = await confirmAction({
        title: t('settings.master_password_title'),
        message: t('settings.master_password_message'),
        confirmLabel: t('settings.master_password_confirm'),
        cancelLabel: t('common.cancel'),
        danger: true
      });
      if (confirmed) {
        notifySuccess(t('settings.master_password_reset_success'));
      }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        notifyError(t('settings.logo_invalid_file'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextLogo = reader.result as string;
        setLogo(nextLogo);
        saveCompanyLogo(nextLogo);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    setNotifications((previous) => {
      const next = { ...previous, [key]: !previous[key] };
      saveNotificationPreferences(next);
      return next;
    });
  };
  
  const toggleIntegration = (id: string) => setIntegrations(integrations.map(i => i.id === id ? {...i, connected: !i.connected} : i));
  
  // Tabs Navigation
  const tabs = [
    { id: 'general', label: t('settings.tab_general'), icon: Building },
    { id: 'users', label: t('settings.tab_users'), icon: Users },
    { id: 'system', label: t('settings.tab_system'), icon: Cog },
    { id: 'notifications', label: t('settings.tab_notifications'), icon: Bell },
    { id: 'security', label: t('settings.tab_security'), icon: Shield },
    { id: 'integrations', label: t('settings.tab_integrations'), icon: Globe },
  ];

  // --- Content Sections ---

  const GeneralSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-6 border-b pb-2">{t('settings.company_identity')}</h3>
        
        <div className="flex flex-col md:flex-row gap-8">
           {/* Logo Upload */}
           <div className="flex flex-col items-center space-y-3">
              <div className="w-48 h-32 bg-white border border-gray-200 rounded-xl flex items-center justify-center p-4 shadow-sm">
                 <img src={logo} alt={t('settings.logo_alt')} className="w-full h-full object-contain" />
              </div>
              <p className="text-sm font-semibold text-gray-700 text-center max-w-48 break-words">
                {companyName || COMPANY_DEFAULT_NAME}
              </p>
              <p className="text-[11px] text-gray-500 text-center max-w-48 break-words uppercase tracking-wide">
                {companySlogan || COMPANY_DEFAULT_SLOGAN}
              </p>
              <label className="text-sm text-blue-600 font-medium hover:underline cursor-pointer">
                {t('settings.change_logo')}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
           </div>

           {/* Form Fields */}
           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company_name_label')}</label>
                 <input
                   type="text"
                   className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                   value={companyName}
                   onChange={(event) => setCompanyName(event.target.value)}
                    placeholder={t('settings.company_name_placeholder')}
                  />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.company_slogan_label')}</label>
                 <input
                   type="text"
                   className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                   value={companySlogan}
                   onChange={(event) => setCompanySlogan(event.target.value)}
                    placeholder={t('settings.company_slogan_placeholder')}
                  />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.tax_id_label')}</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="5412312391" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.industry_label')}</label>
                 <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                    <option>{t('settings.industry_retail')}</option>
                    <option>{t('settings.industry_services')}</option>
                    <option>{t('settings.industry_manufacturing')}</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.phone_label')}</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="+244 923 000 000" />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.contact_email_label')}</label>
                 <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="contato@fernagest.ao" />
              </div>
              <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.address_label')}</label>
                 <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" defaultValue="Av. 4 de Fevereiro, Luanda, Angola" />
              </div>
           </div>
        </div>
        
        <div className="mt-6 flex justify-end">
           <button onClick={handleSaveGeneral} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2">
             <Save size={16} /> {t('settings.save_changes')}
           </button>
        </div>
      </div>
    </div>
  );

  const UserSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
         <div>
            <h3 className="text-lg font-bold text-gray-900">{t('settings.users_manage_title')}</h3>
            <p className="text-sm text-gray-500">{t('settings.users_manage_subtitle')}</p>
         </div>
         <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm">
            <Plus size={16} /> {t('settings.new_user')}
         </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
               <tr>
                  <th className="px-6 py-4">{t('settings.table_user')}</th>
                  <th className="px-6 py-4">{t('settings.table_role')}</th>
                  <th className="px-6 py-4">{t('settings.table_status')}</th>
                  <th className="px-6 py-4">{t('settings.table_last_access')}</th>
                  <th className="px-6 py-4 text-right">{t('settings.table_actions')}</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                              {user.avatar}
                           </div>
                           <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 border border-gray-200">
                           {user.role}
                        </span>
                     </td>
                     <td className="px-6 py-4">
                        {user.status === 'ACTIVE' ? (
                           <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
                              <CheckCircle size={10} /> {t('settings.status_active')}
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
                              <XCircle size={10} /> {t('settings.status_inactive')}
                           </span>
                        )}
                     </td>
                     <td className="px-6 py-4 text-xs text-gray-500">{user.lastLogin}</td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button onClick={() => handleEditUser(user)} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title={t('settings.edit')}>
                              <Edit2 size={16} />
                           </button>
                           <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title={t('settings.remove')}>
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      notifySuccess(t('settings.connection_success'));
      console.log('Session:', data);
    } catch (error: any) {
      notifyError(t('settings.connection_error', { message: error.message }));
    }
  };

  const SystemSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Modules */}
         <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
               <Database size={18} className="text-blue-600"/> {t('settings.modules_active')}
            </h3>
            <div className="space-y-4">
               {modules.map((mod) => (
                  <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                     <span className="text-sm font-medium text-gray-700">{t(mod.labelKey)}</span>
                     <div onClick={() => toggleModule(mod.id)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${mod.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${mod.active ? 'left-6' : 'left-1'}`}></div>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Localization & Personalization */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Globe size={18} className="text-blue-600"/> {t('settings.localization')}
               </h3>
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.currency_default')}</label>
                     <select
                       value={currency}
                       onChange={(event) => handleCurrencyChange(event.target.value as AppCurrency)}
                       className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                     >
                        {APP_CURRENCY_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.language')}</label>
                     <select
                       value={language}
                       onChange={(event) => handleLanguageChange(event.target.value as AppLanguage)}
                       className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                     >
                        {APP_LANGUAGE_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.label}
                          </option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('settings.timezone')}</label>
                     <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm">
                        <option>{t('settings.timezone_west_central_africa')}</option>
                     </select>
                  </div>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Smartphone size={18} className="text-blue-600"/> {t('settings.appearance')}
               </h3>
               <div className="flex gap-4">
                  <button 
                     onClick={() => handleThemeChange('light')}
                     className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                     <Sun size={24} />
                     <span className="text-xs font-bold">{t('settings.theme_light')}</span>
                  </button>
                  <button 
                     onClick={() => handleThemeChange('dark')}
                     className={`flex-1 p-4 rounded-lg border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-slate-800 bg-slate-900 text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                     <Moon size={24} />
                     <span className="text-xs font-bold">{t('settings.theme_dark')}</span>
                  </button>
               </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Database size={18} className="text-blue-600"/> {t('settings.diagnostics')}
               </h3>
               <button onClick={testConnection} className="w-full py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">{t('settings.test_supabase_connection')}</button>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
               <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users size={18} className="text-blue-600"/> {t('settings.hr_settings')}
               </h3>
               <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {t('settings.vacation_subsidy_percent')}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={vacationSubsidyPercent}
                    onChange={(e) => setVacationSubsidyPercent(Number(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm"
                  />
                  <button
                    onClick={handleSaveHrSettings}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    {t('settings.save_hr_settings')}
                  </button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
             {/* Auth Policy */}
             <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <Lock size={18} className="text-blue-600"/> {t('settings.security_policies')}
                </h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t('settings.policy_2fa')}</span>
                      <div onClick={() => togglePolicy('twoFactor')} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${securityPolicies.twoFactor ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${securityPolicies.twoFactor ? 'left-6' : 'left-1'}`}></div></div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t('settings.policy_force_password_change')}</span>
                      <div onClick={() => togglePolicy('forcePasswordChange')} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${securityPolicies.forcePasswordChange ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${securityPolicies.forcePasswordChange ? 'left-6' : 'left-1'}`}></div></div>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{t('settings.policy_lockout')}</span>
                      <div onClick={() => togglePolicy('lockout')} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${securityPolicies.lockout ? 'bg-blue-600' : 'bg-gray-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${securityPolicies.lockout ? 'left-6' : 'left-1'}`}></div></div>
                   </div>
                </div>
                <button onClick={handleResetMasterPassword} className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-200 transition-colors">
                   {t('settings.reset_master_password')}
                </button>
             </div>

             {/* Backup */}
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-lg text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2"><Database size={18}/> {t('settings.data_backup')}</h3>
                <p className="text-xs text-slate-400 mb-4">{t('settings.last_backup')}</p>
                <button onClick={handleBackup} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2">
                   <Download size={16} /> {t('settings.backup_now')}
                </button>
             </div>
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">{t('settings.audit_log')}</h3>
                <button onClick={handleExportLogs} className="text-xs text-blue-600 font-medium hover:underline">{t('settings.export_logs')}</button>
             </div>
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                   <tr>
                      <th className="px-4 py-3">{t('settings.table_datetime')}</th>
                      <th className="px-4 py-3">{t('settings.table_user')}</th>
                      <th className="px-4 py-3">{t('settings.table_action')}</th>
                      <th className="px-4 py-3 text-right">{t('settings.table_ip')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {MOCK_AUDIT_LOGS.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-mono text-xs">{log.timestamp}</td>
                         <td className="px-4 py-3 font-medium">{log.user}</td>
                         <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs border border-gray-200">
                               {log.module}
                            </span>
                            <span className="ml-2">{log.action}</span>
                         </td>
                         <td className="px-4 py-3 text-right text-xs text-gray-400">{log.ip}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
            <p className="text-gray-500 text-sm">{t('settings.subtitle')}</p>
         </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
         {/* Sidebar Navigation */}
         <div className="lg:w-64 bg-white rounded-xl shadow-sm border border-gray-100 h-fit flex-shrink-0">
            <nav className="p-2 space-y-1">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                  >
                     <tab.icon size={18} />
                     {tab.label}
                  </button>
               ))}
            </nav>
         </div>

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'general' && GeneralSettings()}
            {activeTab === 'users' && UserSettings()}
            {activeTab === 'system' && SystemSettings()}
            {activeTab === 'security' && SecuritySettings()}
            {activeTab === 'notifications' && (
               <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                     <Bell size={18} className="text-blue-600"/> {t('settings.notifications_preferences')}
                  </h3>
                  <div className="space-y-4">
                     <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{t('settings.email_alerts')}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-label={t('settings.email_alerts')}
                          aria-checked={notifications.emailAlerts}
                          onClick={() => toggleNotification('emailAlerts')}
                          className={`w-10 h-5 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${notifications.emailAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.emailAlerts ? 'left-6' : 'left-1'}`}></span>
                        </button>
                     </div>
                     <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{t('settings.push_notifications')}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-label={t('settings.push_notifications')}
                          aria-checked={notifications.pushNotifications}
                          onClick={() => toggleNotification('pushNotifications')}
                          className={`w-10 h-5 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${notifications.pushNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.pushNotifications ? 'left-6' : 'left-1'}`}></span>
                        </button>
                     </div>
                     <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{t('settings.weekly_summary')}</span>
                        <button
                          type="button"
                          role="switch"
                          aria-label={t('settings.weekly_summary')}
                          aria-checked={notifications.weeklyDigest}
                          onClick={() => toggleNotification('weeklyDigest')}
                          className={`w-10 h-5 rounded-full relative transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${notifications.weeklyDigest ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifications.weeklyDigest ? 'left-6' : 'left-1'}`}></span>
                        </button>
                     </div>
                  </div>
               </div>
            )}
            {activeTab === 'integrations' && (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {integrations.map(integration => (
                     <div key={integration.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className={`p-3 rounded-lg ${integration.connected ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>
                              <integration.icon size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900">{t(integration.nameKey)}</h4>
                              <p className="text-xs text-gray-500">{integration.connected ? t('settings.integration_connected_syncing') : t('settings.integration_disconnected')}</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => toggleIntegration(integration.id)}
                           className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${integration.connected ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                           {integration.connected ? t('settings.disconnect') : t('settings.connect')}
                        </button>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default Settings;





