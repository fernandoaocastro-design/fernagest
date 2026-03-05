import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FinancialTransaction } from '../types';
import { supabase } from '../supabaseClient';
import { confirmAction, notifyError, notifySuccess, notifyWarning } from '../utils/feedback';
import { openPrintWindow } from '../utils/print';
import {
  APP_THEME_STORAGE_KEY,
  APP_THEME_UPDATED_EVENT,
  AppTheme,
  normalizeTheme,
  readStoredTheme
} from '../utils/theme';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { formatDate } from '../utils/language';
import { useI18n } from '../utils/i18n';
import { useAuthorization } from '../utils/useAuthorization';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Filter, Search, Plus, Calendar, CheckCircle,
  AlertTriangle, Clock, Printer, X, MoreVertical, Trash2, Edit2,
  DollarSign, PieChart as PieIcon, BarChart2, ChevronDown
} from 'lucide-react';

const formatKz = (value: number) => formatCurrency(value);

// Logotipo SVG Base64
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTÃƒO INTELIGENTE%3C/text%3E%3C/svg%3E";

// --- COMPONENTES AUXILIARES ---

const FINANCE_CATEGORY_OPTIONS = [
  { value: 'Vendas', labelKey: 'finance.modal.category_sales' },
  { value: 'Serviços', labelKey: 'finance.modal.category_services' },
  { value: 'Estoque', labelKey: 'finance.modal.category_inventory' },
  { value: 'Aluguel', labelKey: 'finance.modal.category_rent' },
  { value: 'Utilidades', labelKey: 'finance.modal.category_utilities' },
  { value: 'Pessoal', labelKey: 'finance.modal.category_personnel' },
  { value: 'Impostos', labelKey: 'finance.modal.category_taxes' },
  { value: 'Outros', labelKey: 'finance.modal.category_other' }
];

const FINANCE_PAYMENT_METHOD_OPTIONS = [
  { value: 'Dinheiro', labelKey: 'finance.modal.method_cash' },
  { value: 'Transferência', labelKey: 'finance.modal.method_transfer' },
  { value: 'Cartão', labelKey: 'finance.modal.method_card' },
  { value: 'Boleto', labelKey: 'finance.modal.method_boleto' },
  { value: 'Outros', labelKey: 'finance.modal.method_other' }
];

const TransactionModal = ({ isOpen, onClose, onSave, initialData, canManage = true }: any) => {
  const { t } = useI18n();
  const initialFormState = {
    type: 'INCOME',
    amount: '',
    description: '',
    entity: '',
    category: 'Vendas',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    paymentMethod: 'Outros'
  };
  const [formData, setFormData] = useState({
    ...initialFormState
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type,
        amount: initialData.amount.toString(),
        description: initialData.description,
        entity: initialData.entity,
        category: initialData.category,
        dueDate: initialData.dueDate,
        status: initialData.status,
        paymentMethod: initialData.paymentMethod || 'Outros'
      });
    } else {
      setFormData(initialFormState);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!canManage) {
      notifyWarning('Sem permissao para alterar lancamentos financeiros.');
      return;
    }
    if (!formData.description || !formData.amount) {
      notifyWarning(t('finance.modal.warning_fill_required'));
      return;
    }
    onSave({
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date()
    });
  };

  const currencySymbol = getCurrencySymbol();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-bold text-gray-900">{initialData ? t('finance.modal.edit_title') : t('finance.modal.new_title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="md:col-span-2">
             <label className="block text-xs font-medium text-gray-700 dark:text-slate-200 uppercase mb-1">{t('finance.modal.transaction_type')}</label>
             <div className="flex gap-2">
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="type" className="peer sr-only" checked={formData.type === 'INCOME'} onChange={() => setFormData({...formData, type: 'INCOME'})} />
                   <div className="relative overflow-hidden py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 peer-checked:bg-green-100 peer-checked:border-green-700 peer-checked:text-green-900 peer-checked:shadow peer-checked:shadow-green-300/60 dark:peer-checked:bg-emerald-700/45 dark:peer-checked:border-emerald-400 dark:peer-checked:text-emerald-100 dark:peer-checked:shadow-emerald-900/50 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all">
                    <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-green-700 dark:bg-emerald-300 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                    <span className="flex items-center justify-center gap-2"><ArrowUpRight size={16} /> {t('finance.modal.income')}</span>
                  </div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="type" className="peer sr-only" checked={formData.type === 'EXPENSE'} onChange={() => setFormData({...formData, type: 'EXPENSE'})} />
                 <div className="relative overflow-hidden py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 peer-checked:bg-red-100 peer-checked:border-red-700 peer-checked:text-red-900 peer-checked:shadow peer-checked:shadow-red-300/60 dark:peer-checked:bg-rose-700/45 dark:peer-checked:border-rose-400 dark:peer-checked:text-rose-100 dark:peer-checked:shadow-rose-900/50 text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all">
                   <span className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-red-700 dark:bg-rose-300 opacity-0 peer-checked:opacity-100 transition-opacity"></span>
                   <span className="flex items-center justify-center gap-2"><ArrowDownRight size={16} /> {t('finance.modal.expense')}</span>
                 </div>
               </label>
             </div>
           </div>
           
           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.value')} ({currencySymbol})</label>
              <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('finance.modal.amount_placeholder')} />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.due_date')}</label>
              <input type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
           </div>

           <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.description')}</label>
              <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('finance.modal.description_placeholder')} />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.entity')}</label>
              <input type="text" value={formData.entity} onChange={e => setFormData({...formData, entity: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.category')}</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                {FINANCE_CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
           </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.status')}</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                <option value="PAID">{t('finance.modal.status_paid_received')}</option>
                <option value="PENDING">{t('finance.modal.status_pending')}</option>
                <option value="OVERDUE">{t('finance.modal.status_overdue')}</option>
              </select>
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('finance.modal.payment_method')}</label>
              <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                {FINANCE_PAYMENT_METHOD_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                ))}
              </select>
           </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/80">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
             {t('common.cancel')}
           </button>
           <button
             onClick={handleSubmit}
             disabled={!canManage}
             className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 ${
               canManage ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
             }`}
           >
             <CheckCircle size={16} /> {t('common.save')}
           </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Finance = () => {
  const { t } = useI18n();
  const { can } = useAuthorization();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receivable' | 'payable'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [dateFilter, setDateFilter] = useState('this_month'); // all, this_month, last_month
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [theme, setTheme] = useState<AppTheme>(readStoredTheme());
  const canManageFinance = can('finance.manage');
  const canExportFinance = can('finance.export');
  const isDark = theme === 'dark';
  const chartGridColor = isDark ? '#334155' : '#f1f5f9';
  const chartTickColor = isDark ? '#94a3b8' : '#64748b';
  const chartLegendColor = isDark ? '#cbd5e1' : '#475569';
  const chartTooltipStyle = {
    borderRadius: '8px',
    border: isDark ? '1px solid #334155' : 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    color: isDark ? '#f8fafc' : '#111827'
  };
  const chartTooltipTextStyle = {
    color: isDark ? '#e2e8f0' : '#111827'
  };

  // Carregar transaÃ§Ãµes reais
  useEffect(() => {
    // Check for navigation state to set default tab
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
    }
    fetchTransactions();
  }, [location.state]);

  useEffect(() => {
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

  const fetchTransactions = async () => {
    const { data, error } = await supabase.from('financial_transactions').select('*').order('date', { ascending: false });
    if (error) console.error(t('finance.error_fetch', { message: error.message }));
    else setTransactions(data || []);
  };

  // CÃ¡lculos DinÃ¢micos
  const filteredByDate = transactions.filter(t => {
    if (dateFilter === 'all') return true;
    const date = new Date(t.date);
    const now = new Date();
    if (dateFilter === 'this_month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (dateFilter === 'last_month') return date.getMonth() === now.getMonth() - 1 && date.getFullYear() === now.getFullYear();
    return true;
  });

  const totalBalance = filteredByDate
    .reduce((acc, t) => t.status === 'PAID' ? (t.type === 'INCOME' ? acc + t.amount : acc - t.amount) : acc, 0);
  
  const totalReceivable = filteredByDate
    .filter(t => t.type === 'INCOME' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPayable = filteredByDate
    .filter(t => t.type === 'EXPENSE' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const monthlyRevenue = filteredByDate
    .filter(t => t.type === 'INCOME' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = filteredByDate
    .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const netProfit = monthlyRevenue - monthlyExpense;

  // Dados para GrÃ¡ficos
  const chartData = filteredByDate
    .reduce((acc: any[], t) => {
      const dateValue = new Date(t.date);
      const dateKey = Number.isNaN(dateValue.getTime())
        ? String(t.date)
        : dateValue.toISOString().slice(0, 10);
      const existing = acc.find(item => item.key === dateKey);
      if (existing) {
        if (t.type === 'INCOME') existing.income += t.amount;
        else existing.expense += t.amount;
      } else {
        acc.push({
          key: dateKey,
          name: formatDate(dateValue, { day: '2-digit', month: '2-digit' }),
          income: t.type === 'INCOME' ? t.amount : 0,
          expense: t.type === 'EXPENSE' ? t.amount : 0
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-7)
    .map(({ key, ...item }) => item); // Ultimos 7 dias/registros

  const categoryData = filteredByDate
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  const incomeCategoryData = filteredByDate
    .filter(t => t.type === 'INCOME')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, []);

  // LÃ³gica de Filtro da Tabela
  const filteredTransactions = filteredByDate.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.entity.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'receivable') return matchesSearch && t.type === 'INCOME';
    if (activeTab === 'payable') return matchesSearch && t.type === 'EXPENSE';
    return matchesSearch;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    if (activeTab === 'receivable') return matchesSearch && matchesCategory && t.type === 'INCOME';
    if (activeTab === 'payable') return matchesSearch && matchesCategory && t.type === 'EXPENSE';
    return matchesSearch && matchesCategory;
  });

  // AÃ§Ãµes
  const ensureFinanceManage = () => {
    if (canManageFinance) return true;
    notifyWarning('Sem permissao para alterar lancamentos financeiros.');
    return false;
  };

  const ensureFinanceExport = () => {
    if (canExportFinance) return true;
    notifyWarning('Sem permissao para exportar relatorios financeiros.');
    return false;
  };

  const handleSave = async (formData: any) => {
    if (!ensureFinanceManage()) return;

    const payload = {
      description: formData.description,
      amount: formData.amount,
      type: formData.type,
      category: formData.category,
      entity: formData.entity,
      due_date: formData.dueDate,
      date: formData.date || new Date(),
      status: formData.status,
      payment_method: formData.paymentMethod
    };

    let error;
    if (editingTransaction) {
      const { error: updateError } = await supabase.from('financial_transactions').update(payload).eq('id', editingTransaction.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('financial_transactions').insert(payload);
      error = insertError;
    }

    if (error) notifyError(t('finance.error_save', { message: error.message }));
    else {
      notifySuccess(t('finance.saved_success'));
      setIsFormOpen(false);
      setEditingTransaction(null);
      fetchTransactions();
    }
  };

  const handleDelete = async (id: string) => {
    if (!ensureFinanceManage()) return;

    const shouldDelete = await confirmAction({
      title: t('finance.delete_title'),
      message: t('finance.delete_message'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      danger: true
    });

    if (!shouldDelete) return;

    const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
    if (error) {
      notifyError(t('finance.error_delete', { message: error.message }));
    } else {
      notifySuccess(t('finance.delete_success'));
      fetchTransactions();
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!ensureFinanceManage()) return;

    const { error } = await supabase.from('financial_transactions').update({ status: newStatus }).eq('id', id);
    if (error) {
      notifyError(t('finance.error_status', { message: error.message }));
    } else {
      notifySuccess(t('finance.status_updated'));
      fetchTransactions();
    }
  };

  const generatePDF = () => {
    if (!ensureFinanceExport()) return;

    const title = activeTab === 'receivable'
      ? t('finance.report_receivable')
      : activeTab === 'payable'
      ? t('finance.report_payable')
      : t('finance.report_general');
    const items = filteredTransactions;
    const paidLabel = t('finance.badge_paid');
    const overdueLabel = t('finance.badge_overdue');
    const pendingLabel = t('finance.badge_pending');

    // --- CONFIGURAÃ‡ÃƒO DO LOGOTIPO ---
    // Substitua a URL abaixo pelo link da sua imagem ou pelo cÃ³digo Base64 (data:image/png;base64...)
    const logoUrl = FERNAGEST_LOGO;

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { height: 50px; margin-bottom: 10px; }
            h1 { color: #2563eb; margin: 0; font-size: 24px; }
            .meta { color: #666; font-size: 12px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .amount { font-weight: bold; }
            .income { color: #16a34a; }
            .expense { color: #dc2626; }
            .footer { margin-top: 30px; text-align: right; font-weight: bold; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" class="logo" alt="Logotipo" />
            <h1>${title}</h1>
            <div class="meta">${t('finance.report_generated_at')}: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t('finance.report_table_date')}</th>
                <th>${t('finance.report_table_description')}</th>
                <th>${t('finance.report_table_entity')}</th>
                <th>${t('finance.report_table_category')}</th>
                <th>${t('finance.report_table_status')}</th>
                <th>${t('finance.report_table_value')}</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(t => `
                <tr>
                  <td>${formatDate(new Date(t.date))}</td>
                  <td>${t.description}</td>
                  <td>${t.entity}</td>
                  <td>${t.category}</td>
                  <td>${t.status === 'PAID' ? paidLabel : t.status === 'OVERDUE' ? overdueLabel : pendingLabel}</td>
                  <td class="amount ${t.type === 'INCOME' ? 'income' : 'expense'}">
                    ${t.type === 'EXPENSE' ? '-' : ''} ${formatKz(t.amount)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            ${t('finance.report_total_balance')}: ${formatKz(items.reduce((acc, t) => t.type === 'INCOME' ? acc + t.amount : acc - t.amount, 0))}
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 800, height: 600 });
    if (!opened) notifyWarning(t('finance.popup_blocked'));
  };

  return (
    <div className="space-y-6">
      {isFormOpen && <TransactionModal 
        isOpen={isFormOpen} 
        onClose={() => { setIsFormOpen(false); setEditingTransaction(null); }} 
        onSave={handleSave}
        initialData={editingTransaction}
        canManage={canManageFinance}
      />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('finance.title')}</h1>
          <p className="text-gray-500 text-sm">{t('finance.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={generatePDF}
            disabled={!canExportFinance}
            className={`border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2 ${
              canExportFinance
                ? 'bg-white text-gray-700 hover:bg-gray-50'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Printer size={16} /> {t('finance.generate_pdf')}
          </button>
          <button 
            onClick={() => { if (ensureFinanceManage()) { setEditingTransaction(null); setIsFormOpen(true); } }}
            disabled={!canManageFinance}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm ${
              canManageFinance
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                : 'bg-gray-300 text-gray-100 cursor-not-allowed shadow-none'
            }`}
          >
            <Plus size={18} /> {t('finance.new_entry')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('finance.tab_overview')}
          </button>
          <button 
            onClick={() => setActiveTab('receivable')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'receivable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('finance.tab_receivable')}
          </button>
          <button 
            onClick={() => setActiveTab('payable')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'payable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t('finance.tab_payable')}
          </button>
        </div>

        <div className="relative">
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="this_month">{t('finance.filter_this_month')}</option>
            <option value="last_month">{t('finance.filter_last_month')}</option>
            <option value="all">{t('finance.filter_all_period')}</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></div>
                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${totalBalance >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                     {totalBalance >= 0 ? t('finance.summary_positive') : t('finance.summary_negative')}
                   </span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">{t('finance.summary_current_balance')}</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(totalBalance)}</h3>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                   <span className="text-xs font-medium text-gray-500">{t('finance.summary_received')}</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">{t('finance.summary_revenue_total')}</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(monthlyRevenue)}</h3>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                   <span className="text-xs font-medium text-gray-500">{t('finance.summary_paid')}</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">{t('finance.summary_expense_total')}</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(monthlyExpense)}</h3>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><DollarSign size={20} /></div>
                   <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${netProfit >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                     {netProfit >= 0 ? t('finance.summary_profit') : t('finance.summary_loss')}
                   </span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">{t('finance.summary_net_result')}</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(netProfit)}</h3>
              </div>
           </div>

           {/* Charts Section */}
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2"><BarChart2 size={18} /> {t('finance.chart_cashflow_daily')}</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: chartTickColor, fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTickColor, fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipTextStyle}
                        itemStyle={chartTooltipTextStyle}
                        formatter={(val: number) => formatKz(val)}
                      />
                      <Legend wrapperStyle={{ color: chartLegendColor }} />
                      <Area type="monotone" dataKey="income" name={t('finance.chart_entries')} stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" name={t('finance.chart_exits')} stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieIcon size={18} /> {t('finance.chart_revenues_by_category')}</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={incomeCategoryData} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {incomeCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => formatKz(val)}
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipTextStyle}
                        itemStyle={chartTooltipTextStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                   {incomeCategoryData.slice(0, 3).map((cat, idx) => (
                     <div key={idx} className="flex justify-between text-xs text-gray-600">
                       <span className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full" style={{backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][idx % 5]}}></span> 
                         {cat.name}
                       </span> 
                       <span>{formatKz(cat.value)}</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><PieIcon size={18} /> {t('finance.chart_expenses_by_category')}</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={categoryData} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => formatKz(val)}
                        contentStyle={chartTooltipStyle}
                        labelStyle={chartTooltipTextStyle}
                        itemStyle={chartTooltipTextStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                   {categoryData.slice(0, 3).map((cat, idx) => (
                     <div key={idx} className="flex justify-between text-xs text-gray-600">
                       <span className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full" style={{backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][idx % 5]}}></span> 
                         {cat.name}
                       </span> 
                       <span>{formatKz(cat.value)}</span>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
           {/* Toolbar */}
           <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={activeTab === 'receivable' ? t('finance.search_receivable') : t('finance.search_payable')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="relative">
                <select 
                  value={categoryFilter} 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">{t('finance.filter_all_categories')}</option>
                  {FINANCE_CATEGORY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4">{t('finance.table_status')}</th>
                    <th className="px-6 py-4">{t('finance.table_description')}</th>
                    <th className="px-6 py-4">{activeTab === 'receivable' ? t('finance.table_client') : t('finance.table_supplier')}</th>
                    <th className="px-6 py-4">{t('finance.table_due_date')}</th>
                    <th className="px-6 py-4">{t('finance.table_value')}</th>
                    <th className="px-6 py-4 text-center">{t('finance.table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        {transaction.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle size={12} /> {t('finance.badge_paid')}
                          </span>
                        ) : transaction.status === 'OVERDUE' ? (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle size={12} /> {t('finance.badge_overdue')}
                          </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock size={12} /> {t('finance.badge_pending')}
                          </span>
                        )}
                      </td>
                     <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{transaction.description}</p>
                        <p className="text-xs text-gray-400">{transaction.category} â€¢ {transaction.paymentMethod}</p>
                      </td>
                     <td className="px-6 py-4 text-gray-900">{transaction.entity}</td>
                     <td className={`px-6 py-4 font-mono text-xs ${transaction.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}`}>
                       {formatDate(new Date(transaction.dueDate))}
                     </td>
                     <td className={`px-6 py-4 font-bold ${transaction.type === 'INCOME' ? 'text-blue-600' : 'text-gray-900'}`}>
                       {formatKz(transaction.amount)}
                     </td>
                      <td className="px-6 py-4 text-center">
                        {canManageFinance ? (
                          <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {transaction.status !== 'PAID' && (
                              <button onClick={() => handleStatusChange(transaction.id, 'PAID')} className="p-1.5 hover:bg-green-50 text-green-600 rounded" title={t('finance.mark_paid')}>
                                <CheckCircle size={16} />
                              </button>
                            )}
                            <button onClick={() => { setEditingTransaction(transaction); setIsFormOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title={t('common.edit')}>
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDelete(transaction.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title={t('common.delete')}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Somente leitura</span>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
              </table>
              {filteredTransactions.length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  {t('finance.no_transactions')}
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Finance;


