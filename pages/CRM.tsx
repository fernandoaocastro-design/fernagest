import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Edit2, Trash2, 
  Mail, Phone, MapPin, Building, Save, X, User, CheckCircle, XCircle,
  LayoutGrid, List, Columns, History, Clock, ChevronDown
} from 'lucide-react';
import { FunnelChart, Funnel, LabelList, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';
import { Customer } from '../types';
import { confirmAction, notifyError, notifySuccess, notifyWarning } from '../utils/feedback';
import {
  APP_THEME_STORAGE_KEY,
  APP_THEME_UPDATED_EVENT,
  AppTheme,
  normalizeTheme,
  readStoredTheme
} from '../utils/theme';
import { useI18n } from '../utils/i18n';

// DefiniÃ§Ã£o das fases do Pipeline
const PIPELINE_STAGES = [
  { id: 'lead', labelKey: 'crm.pipeline_lead_new', shortLabelKey: 'crm.pipeline_lead', color: 'bg-gray-100 border-gray-200 dark:bg-slate-700/70 dark:border-slate-600' },
  { id: 'contacted', labelKey: 'crm.pipeline_contacted', shortLabelKey: 'crm.pipeline_contacted', color: 'bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-800' },
  { id: 'proposal', labelKey: 'crm.pipeline_proposal', shortLabelKey: 'crm.pipeline_proposal', color: 'bg-yellow-50 border-yellow-100 dark:bg-amber-900/30 dark:border-amber-800' },
  { id: 'negotiation', labelKey: 'crm.pipeline_negotiation', shortLabelKey: 'crm.pipeline_negotiation', color: 'bg-purple-50 border-purple-100 dark:bg-fuchsia-900/25 dark:border-fuchsia-800' },
  { id: 'won', labelKey: 'crm.pipeline_won_closed', shortLabelKey: 'crm.pipeline_won', color: 'bg-green-50 border-green-100 dark:bg-emerald-900/30 dark:border-emerald-800' },
  { id: 'lost', labelKey: 'crm.pipeline_lost', shortLabelKey: 'crm.pipeline_lost', color: 'bg-red-50 border-red-100 dark:bg-rose-900/30 dark:border-rose-800' },
  // Fallback para status antigos ou desconhecidos
  { id: 'active', labelKey: 'crm.pipeline_active_legacy', shortLabelKey: 'crm.pipeline_active_legacy', color: 'bg-gray-50 border-gray-200 dark:bg-slate-800/70 dark:border-slate-600' },
  { id: 'inactive', labelKey: 'crm.pipeline_inactive_legacy', shortLabelKey: 'crm.pipeline_inactive_legacy', color: 'bg-gray-50 border-gray-200 dark:bg-slate-800/70 dark:border-slate-600' }
];

interface CustomerFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  document: string;
  location: string;
  status: string;
}

// Componente de CartÃ£o do Cliente (ExtraÃ­do para fora do componente CRM para performance)
const CustomerCard = ({ 
  customer, 
  compact = false, 
  draggable, 
  onDragStart,
  onEdit,
  onDelete,
  onHistory
}: { 
  customer: Customer, 
  compact?: boolean, 
  draggable?: boolean, 
  onDragStart?: (e: React.DragEvent) => void,
  onEdit: (c: Customer) => void,
  onDelete: (id: string) => void,
  onHistory: (c: Customer) => void
}) => {
  const { t } = useI18n();

  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 transition-all group ${compact ? 'text-xs' : ''} ${draggable ? 'cursor-move active:cursor-grabbing' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold ${compact ? 'w-8 h-8 text-xs' : 'w-10 h-10'}`}>
            {(customer.name || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className={`font-bold text-gray-900 ${compact ? 'text-sm' : ''}`}>{customer.name}</h3>
            <p className="text-xs text-gray-500">{customer.company || t('crm.individual_customer')}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-1.5 text-gray-600 mb-3">
        {customer.email && <div className="flex items-center gap-2 truncate" title={customer.email}><Mail size={12} className="text-gray-400 flex-shrink-0"/> {customer.email}</div>}
        {customer.phone && <div className="flex items-center gap-2 truncate"><Phone size={12} className="text-gray-400 flex-shrink-0"/> {customer.phone}</div>}
        {!compact && customer.location && <div className="flex items-center gap-2 truncate"><MapPin size={12} className="text-gray-400 flex-shrink-0"/> {customer.location}</div>}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-gray-50">
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onHistory(customer); }} 
          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-colors" 
          title={t('crm.history')}
        >
          <History size={14} />
        </button>
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(customer); }} 
          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" 
          title={t('crm.edit_customer')}
        >
          <Edit2 size={14} />
        </button>
        <button 
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(customer.id); }} 
          className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg transition-colors" 
          title={t('common.delete')}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const CRM = () => {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline'>('grid');
  const [showHistory, setShowHistory] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const [segmentFilter, setSegmentFilter] = useState('all'); // all, company, individual
  const [showSegmentMenu, setShowSegmentMenu] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(readStoredTheme());
  const isDark = theme === 'dark';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#111827'
  };
  const chartTooltipTextStyle = {
    color: isDark ? '#e2e8f0' : '#111827'
  };
  
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    company: '',
    email: '',
    phone: '',
    document: '',
    location: '',
    status: 'lead'
  });

  const getStageLabel = (stage: { labelKey: string; shortLabelKey: string }, short = false) => {
    return short ? t(stage.shortLabelKey) : t(stage.labelKey);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const fetchCustomers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar clientes:', error);
    } else {
      console.log('Dados dos clientes (verifique as colunas):', data);
      // Mapeia o campo 'nif' do banco para 'document' no frontend
      const mappedCustomers = (data || []).map((c: any) => ({
        ...c,
        document: c.nif || c.document, // Garante que o documento apareÃ§a se a coluna for nif ou document
        location: c.address || c.location || c.morada || c.endereco || '' // Tenta mapear de vÃ¡rias colunas possÃ­veis
      }));
      setCustomers(mappedCustomers);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name) {
      notifyWarning(t('crm.required_name'));
      return;
    }

    const customerData = {
      name: formData.name,
      company: formData.company,
      email: formData.email,
      phone: formData.phone,
      // nif: formData.document, // Comentado: Coluna 'nif' nÃ£o encontrada no Supabase.
      // address: formData.location, // Comentado: Coluna 'address' nÃ£o encontrada no Supabase.
      status: formData.status || 'lead'
    };

    let error;
    if (editingCustomer) {
      const { error: updateError } = await supabase
        .from('customers')
        .update(customerData)
        .eq('id', editingCustomer.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('customers')
        .insert(customerData);
      error = insertError;
    }

    if (error) {
      notifyError(t('crm.error_save', { message: error.message }));
    } else {
      notifySuccess(editingCustomer ? t('crm.updated_success') : t('crm.created_success'));
      setIsFormOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', company: '', email: '', phone: '', document: '', location: '', status: 'lead' });
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirmAction({
      title: t('crm.delete_title'),
      message: t('crm.delete_message'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      danger: true
    });

    if (!shouldDelete) return;

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      notifyError(t('crm.error_delete', { message: error.message }));
    } else {
      notifySuccess(t('crm.deleted_success'));
      fetchCustomers();
    }
  };

  const openForm = (customer: Customer | null = null, defaultStatus: string = 'lead') => {
    setEditingCustomer(customer);
    if (customer) {
      setFormData({
        name: customer.name || '',
        company: customer.company || '',
        email: customer.email || '',
        phone: customer.phone || '',
        document: customer.document || '',
        location: customer.location || '',
        status: customer.status || 'lead'
      });
    } else {
      setFormData({ name: '', company: '', email: '', phone: '', document: '', location: '', status: defaultStatus });
    }
    setIsFormOpen(true);
  };

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (c.name || '').toLowerCase().includes(searchLower) ||
      (c.company || '').toLowerCase().includes(searchLower) ||
      (c.email || '').toLowerCase().includes(searchLower);
    
    const matchesSegment = segmentFilter === 'all' 
      ? true 
      : segmentFilter === 'company' ? !!c.company : !c.company;

    return matchesSearch && matchesSegment;
  });

  // Dados para o GrÃ¡fico de Funil
  const funnelData = PIPELINE_STAGES
    .filter(s => !['active', 'inactive'].includes(s.id)) // Remove status legados
    .map(stage => ({
      name: getStageLabel(stage, true),
      value: customers.filter(c => c.status === stage.id || (!c.status && stage.id === 'lead')).length,
      fill: stage.id === 'lead' ? '#94a3b8' :
            stage.id === 'contacted' ? '#60a5fa' :
            stage.id === 'proposal' ? '#facc15' :
            stage.id === 'negotiation' ? '#c084fc' :
            stage.id === 'won' ? '#4ade80' :
            stage.id === 'lost' ? '#f87171' : '#cbd5e1'
    }));

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, customerId: string) => {
    e.dataTransfer.setData('text/plain', customerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const customerId = e.dataTransfer.getData('text/plain');
    
    if (!customerId) return;

    // AtualizaÃ§Ã£o Otimista (UI primeiro)
    setCustomers(prev => prev.map(c => 
      c.id === customerId ? { ...c, status: newStatus } : c
    ));

    // AtualizaÃ§Ã£o no Banco de Dados
    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus })
      .eq('id', customerId);

    if (error) {
      console.error('Erro ao atualizar status:', error);
      notifyError(t('crm.error_move_customer', { message: error.message }));
      fetchCustomers(); // Reverte em caso de erro
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('crm.title')}</h1>
          <p className="text-gray-500 text-sm">{t('crm.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
             <button 
               onClick={() => setViewMode('grid')}
               className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
               title={t('crm.view_grid')}
              >
              <LayoutGrid size={18} />
             </button>
             <button 
               onClick={() => setViewMode('pipeline')}
               className={`p-2 rounded-md transition-colors ${viewMode === 'pipeline' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
               title={t('crm.view_pipeline')}
              >
              <Columns size={18} />
             </button>
          </div>
          <button 
            onClick={() => openForm()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus size={18} /> {t('crm.new_customer')}
          </button>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">{t('crm.funnel_title')}</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip contentStyle={chartTooltipStyle} labelStyle={chartTooltipTextStyle} itemStyle={chartTooltipTextStyle} />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList position="right" fill={isDark ? '#e2e8f0' : '#111827'} stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('crm.search_placeholder')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          />
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowSegmentMenu(!showSegmentMenu)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${segmentFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <Filter size={16} /> {t('crm.segment')} <ChevronDown size={14} />
          </button>
          
          {showSegmentMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
              <button onClick={() => { setSegmentFilter('all'); setShowSegmentMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${segmentFilter === 'all' ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}>{t('crm.segment_all')}</button>
              <button onClick={() => { setSegmentFilter('company'); setShowSegmentMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${segmentFilter === 'company' ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}>{t('crm.segment_companies')}</button>
              <button onClick={() => { setSegmentFilter('individual'); setShowSegmentMenu(false); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${segmentFilter === 'individual' ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}>{t('crm.segment_individuals')}</button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">{t('crm.loading_customers')}</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <User size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('crm.empty_title')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('crm.empty_description')}</p>
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // GRID VIEW
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(customer => (
                <div key={customer.id}>
                  <CustomerCard
                    customer={customer}
                    onEdit={openForm}
                    onDelete={handleDelete}
                    onHistory={(c) => { setHistoryCustomer(c); setShowHistory(true); }}
                  />
                </div>
              ))}
            </div>
          ) : (
            // PIPELINE VIEW
            <div className="w-full overflow-x-auto pb-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-inner">
              <div className="flex gap-4 min-w-max p-4 min-h-[calc(100vh-250px)]">
                {PIPELINE_STAGES.map(stage => {
                  const stageCustomers = filteredCustomers.filter(c => c.status === stage.id || (!c.status && stage.id === 'lead'));
                  return (
                    <div 
                      key={stage.id} 
                      className="min-w-[280px] w-[280px] flex flex-col"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, stage.id)}
                    >
                      <div className={`p-3 rounded-t-xl border-b-2 ${stage.color} bg-white mb-2 flex justify-between items-center`}>
                        <span className="font-bold text-sm text-gray-700">{getStageLabel(stage)}</span>
                        <div className="flex items-center gap-2">
                          <span className="bg-white/50 px-2 py-0.5 rounded-full text-xs font-bold">{stageCustomers.length}</span>
                          <button onClick={() => openForm(null, stage.id)} className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors" title={t('crm.add_in_stage')}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3 p-1 min-h-[150px] transition-colors rounded-xl">
                        {stageCustomers.map(customer => (
                          <div key={customer.id}>
                            <CustomerCard
                              customer={customer}
                              compact={true}
                              draggable={true}
                              onDragStart={(e) => handleDragStart(e, customer.id)}
                              onEdit={openForm}
                              onDelete={handleDelete}
                              onHistory={(c) => { setHistoryCustomer(c); setShowHistory(true); }}
                            />
                          </div>
                        ))}
                        <button 
                          onClick={() => openForm(null, stage.id)}
                          className="w-full py-2 flex items-center justify-center gap-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium border-2 border-dashed border-transparent hover:border-blue-200"
                        >
                          <Plus size={14} /> {t('crm.add')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Form */}
      {isFormOpen && <CustomerModal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        onSave={handleSave} 
        formData={formData} 
        setFormData={setFormData} 
        isEditing={!!editingCustomer} 
      />}

      {showHistory && historyCustomer && <HistoryModal customer={historyCustomer} onClose={() => setShowHistory(false)} />}
    </div>
  );
};


// Componente de Modal ExtraÃ­do para melhor performance e organizaÃ§Ã£o
const CustomerModal = ({ isOpen, onClose, onSave, formData, setFormData, isEditing }: any) => {
  const { t } = useI18n();
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">{isEditing ? t('crm.edit_customer') : t('crm.new_customer')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.full_name')} *</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('crm.full_name_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.company')}</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('crm.company_placeholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.document')}</label>
              <input type="text" value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder="000000000" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.email')}</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('crm.email_placeholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.phone')}</label>
              <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('crm.phone_placeholder')} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.location')}</label>
            <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('crm.location_placeholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('crm.pipeline_stage')}</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
              {PIPELINE_STAGES.map(stage => (
                <option key={stage.id} value={stage.id}>{t(stage.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/80">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">{t('common.cancel')}</button>
          <button onClick={onSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save size={16} /> {t('common.save')}</button>
        </div>
      </div>
    </div>
  );
};

// Componente de HistÃ³rico (Mock)
const HistoryModal = ({ customer, onClose }: { customer: Customer, onClose: () => void }) => {
  const { t } = useI18n();
  // Mock de dados de histÃ³rico
  const historyItems = [
    { id: 1, type: 'note', content: t('crm.history_item_note'), date: t('crm.history_item_date_today_1030'), user: t('crm.you') },
    { id: 2, type: 'call', content: t('crm.history_item_call'), date: t('crm.history_item_date_yesterday_1415'), user: 'Maria' },
    { id: 3, type: 'status', content: t('crm.history_item_status_change', { from: t('crm.pipeline_lead'), to: t('crm.pipeline_contacted') }), date: '12/10/2023', user: t('crm.system') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
          <div>
            <h2 className="font-bold text-gray-900">{t('crm.history')}</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{customer.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
          {historyItems.map((item, index) => (
            <div key={item.id} className="relative pl-4 border-l-2 border-gray-200 dark:border-slate-600 pb-4 last:pb-0">
              <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-400"></div>
              <div className="text-xs text-gray-400 dark:text-slate-400 mb-1 flex items-center gap-1">
                <Clock size={10} /> {item.date} â€¢ {item.user}
              </div>
              <p className="text-sm text-gray-700 dark:text-slate-200">{item.content}</p>
            </div>
          ))}
          <div className="text-center pt-4">
            <button className="text-xs text-blue-600 hover:underline">{t('crm.view_all_history')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRM;

