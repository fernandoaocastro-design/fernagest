import React, { useState } from 'react';
import {
  FileText, Filter, Search, Calendar,
  Wallet, ShoppingCart, Package, Users, Briefcase, Truck,
  FileSpreadsheet, File, Star, Play, X, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { MOCK_REPORTS, MOCK_FINANCIAL_DATA } from '../constants';
import { ReportDef } from '../types';
import { formatCurrency } from '../utils/currency';
import { notifyWarning } from '../utils/feedback';
import { useI18n } from '../utils/i18n';
import { useAuthorization } from '../utils/useAuthorization';

const Reports = () => {
  const { t } = useI18n();
  const { can } = useAuthorization();
  const canExportReports = can('reports.export');
  const [activeModule, setActiveModule] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const moduleFilters = ['ALL', 'FINANCE', 'SALES', 'INVENTORY', 'CRM', 'PROJECTS', 'PURCHASES'];
  const reportTitleKeys: Record<string, string> = {
    'RPT-001': 'reports.report_rpt_001_title',
    'RPT-002': 'reports.report_rpt_002_title',
    'RPT-003': 'reports.report_rpt_003_title',
    'RPT-004': 'reports.report_rpt_004_title',
    'RPT-005': 'reports.report_rpt_005_title',
    'RPT-006': 'reports.report_rpt_006_title',
    'RPT-007': 'reports.report_rpt_007_title',
    'RPT-008': 'reports.report_rpt_008_title',
    'RPT-009': 'reports.report_rpt_009_title'
  };
  const reportDescriptionKeys: Record<string, string> = {
    'RPT-001': 'reports.report_rpt_001_description',
    'RPT-002': 'reports.report_rpt_002_description',
    'RPT-003': 'reports.report_rpt_003_description',
    'RPT-004': 'reports.report_rpt_004_description',
    'RPT-005': 'reports.report_rpt_005_description',
    'RPT-006': 'reports.report_rpt_006_description',
    'RPT-007': 'reports.report_rpt_007_description',
    'RPT-008': 'reports.report_rpt_008_description',
    'RPT-009': 'reports.report_rpt_009_description'
  };
  const moduleTranslationKeys: Record<string, string> = {
    ALL: 'reports.module_all',
    FINANCE: 'reports.module_finance',
    SALES: 'reports.module_sales',
    INVENTORY: 'reports.module_inventory',
    CRM: 'reports.module_crm',
    PROJECTS: 'reports.module_projects',
    PURCHASES: 'reports.module_purchases'
  };

  const getReportTitle = (report: ReportDef) => {
    const key = reportTitleKeys[report.id];
    return key ? t(key) : report.title;
  };

  const getReportDescription = (report: ReportDef) => {
    const key = reportDescriptionKeys[report.id];
    return key ? t(key) : report.description;
  };

  const filteredReports = MOCK_REPORTS.filter(r => {
    const localizedTitle = getReportTitle(r);
    const localizedDescription = getReportDescription(r);
    const matchesModule = activeModule === 'ALL' || r.module === activeModule;
    const matchesSearch =
      localizedTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      localizedDescription.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const getModuleLabel = (module: string) => {
    const key = moduleTranslationKeys[module];
    return key ? t(key) : module;
  };

  const getModuleIcon = (module: string) => {
    switch(module) {
      case 'FINANCE': return <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />;
      case 'SALES': return <ShoppingCart size={18} className="text-blue-600 dark:text-blue-400" />;
      case 'INVENTORY': return <Package size={18} className="text-orange-600 dark:text-orange-400" />;
      case 'CRM': return <Users size={18} className="text-purple-600 dark:text-purple-400" />;
      case 'PROJECTS': return <Briefcase size={18} className="text-pink-600 dark:text-pink-400" />;
      case 'PURCHASES': return <Truck size={18} className="text-amber-600 dark:text-amber-400" />;
      default: return <FileText size={18} className="text-gray-600 dark:text-slate-300" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText size={14} className="text-red-500 dark:text-red-400" />;
      case 'EXCEL': return <FileSpreadsheet size={14} className="text-green-600 dark:text-green-400" />;
      case 'CSV': return <File size={14} className="text-gray-500 dark:text-slate-300" />;
      default: return <FileText size={14} />;
    }
  };

  const handleDownload = (format: 'PDF' | 'EXCEL') => {
    if (!canExportReports) {
      notifyWarning('Sem permissao para exportar relatorios.');
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      if (format === 'PDF') {
        window.print();
      } else {
        const selectedModuleLabel = selectedReport ? getModuleLabel(selectedReport.module) : t('reports.module_general');
        const csvHeaders = [
          t('reports.table_period'),
          t('reports.table_category'),
          t('reports.table_cross_ref'),
          t('reports.table_value')
        ].join(',');
        const csvRows = [1, 2, 3, 4, 5]
          .map(i => `${t('reports.sample_month')},${selectedModuleLabel} - ${t('reports.operational')},REF-${1000 + i},${15000 * i}`)
          .join('\n');
        const csvContent = `data:text/csv;charset=utf-8,${csvHeaders}\n${csvRows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${t('reports.filename_prefix')}_${selectedReport?.id || 'export'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }, 1500);
  };

  // Mock Component for Previewing Report Data
  const ReportPreview = ({ report }: { report: ReportDef }) => {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden border border-gray-100 dark:border-slate-700">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
               {getModuleIcon(report.module)}
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-tight">{getReportTitle(report)}</h2>
               <p className="text-xs text-gray-500 dark:text-slate-400">{getReportDescription(report)}</p>
             </div>
          </div>
          <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-100 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body - Charts & Data */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-900/70">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm min-h-[300px]">
                 <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                   <BarChart2 size={16} /> {t('reports.chart_view')}
                 </h3>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       {report.module === 'SALES' || report.module === 'FINANCE' ? (
                          <BarChart data={MOCK_FINANCIAL_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                            <YAxis axisLine={false} tickLine={false} fontSize={12} />
                            <RechartsTooltip />
                            <Legend />
                            <Bar dataKey="revenue" name={t('reports.revenue')} fill="#3b82f6" radius={[4,4,0,0]} />
                            <Bar dataKey="profit" name={t('reports.profit')} fill="#10b981" radius={[4,4,0,0]} />
                          </BarChart>
                       ) : (
                          <LineChart data={MOCK_FINANCIAL_DATA}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} />
                             <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                             <YAxis axisLine={false} tickLine={false} fontSize={12} />
                             <RechartsTooltip />
                             <Legend />
                             <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={3} />
                          </LineChart>
                       )}
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Summary Section */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                 <h3 className="text-sm font-bold text-gray-800 dark:text-slate-200 mb-4">{t('reports.executive_summary')}</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">{t('reports.total_period')}</span>
                       <span className="font-bold text-gray-900">{formatCurrency(14500000)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">{t('reports.average_monthly')}</span>
                       <span className="font-bold text-gray-900">{formatCurrency(1200000)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">{t('reports.variation_yoy')}</span>
                       <span className="font-bold text-green-600">+12.5%</span>
                    </div>
                    
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                       <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>{t('reports.note_label')}:</strong> {t('reports.note_text')}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Mock Data Table */}
           <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600 dark:text-slate-300">
                 <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase font-medium text-gray-500 dark:text-slate-400">
                    <tr>
                       <th className="px-6 py-4">{t('reports.table_period')}</th>
                       <th className="px-6 py-4">{t('reports.table_category')}</th>
                       <th className="px-6 py-4">{t('reports.table_cross_ref')}</th>
                       <th className="px-6 py-4 text-right">{t('reports.table_value')}</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {[1,2,3,4,5].map(i => (
                       <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/70">
                          <td className="px-6 py-3">{t('reports.sample_month')}</td>
                          <td className="px-6 py-3">{getModuleLabel(report.module)} - {t('reports.operational')}</td>
                          <td className="px-6 py-3 font-mono text-xs">REF-{1000+i}</td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(15000 * i)}</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-end gap-3">
           <button 
             onClick={() => setSelectedReport(null)}
             className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60"
           >
             {t('reports.preview_close')}
           </button>
           <div className="flex gap-2">
             <button 
              onClick={() => handleDownload('PDF')}
               disabled={isGenerating || !canExportReports}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-700 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 flex items-center gap-2 shadow-sm disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-red-400/60 dark:focus-visible:ring-offset-slate-900"
           >
             <FileText size={16} /> {t('reports.download_pdf')}
           </button>
             <button 
               onClick={() => handleDownload('EXCEL')}
               disabled={isGenerating || !canExportReports}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-700 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 flex items-center gap-2 shadow-sm disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-green-400/60 dark:focus-visible:ring-offset-slate-900"
             >
              <FileSpreadsheet size={16} /> {t('reports.download_excel')}
            </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {/* Modal Overlay */}
      {selectedReport && (
         <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[90vh]">
               <ReportPreview report={selectedReport} />
            </div>
         </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('reports.title')}</h1>
          <p className="text-gray-500 text-sm">{t('reports.subtitle')}</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setIsScheduleOpen(true)}
             className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60"
           >
             <Calendar size={16} /> {t('reports.schedule')}
           </button>
           <button 
             onClick={() => setIsFilterOpen(true)}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-500 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400/60 dark:focus-visible:ring-offset-slate-900"
           >
             <Filter size={16} /> {t('reports.advanced_filters')}
           </button>
        </div>
      </div>

      {/* Module Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
         {moduleFilters.map((module) => (
           <button 
              key={module}
              onClick={() => setActiveModule(module)}
             className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60 ${
               activeModule === module 
                 ? 'bg-slate-800 dark:bg-slate-700 text-white border-slate-800 dark:border-slate-600 shadow-md' 
                  : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
             }`}
           >
             {getModuleLabel(module)}
           </button>
         ))}
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
         {/* Search Bar */}
         <div className="relative mb-6">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('reports.search_placeholder')} 
              className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
         </div>

         {/* Reports Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredReports.map(report => (
               <div key={report.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="p-6 flex-1">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-gray-50 dark:bg-slate-800 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                           {getModuleIcon(report.module)}
                        </div>
                        {report.favorite && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                     </div>
                     <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{getReportTitle(report)}</h3>
                     <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{getReportDescription(report)}</p>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-gray-50/80 dark:bg-slate-800 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-200">{report.type}</span>
                     </div>
                     <button 
                       onClick={() => setSelectedReport(report)}
                       className="text-sm font-bold text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60 flex items-center gap-1 opacity-100 transition-all"
                     >
                        {t('reports.view')} <Play size={14} />
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {filteredReports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Search size={24} />
               </div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('reports.empty_title')}</h3>
               <p className="text-gray-500 max-w-sm mt-2">{t('reports.empty_description')}</p>
            </div>
         )}
      </div>

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-gray-900 dark:text-slate-100">{t('reports.schedule_modal_title')}</h3>
              <button onClick={() => setIsScheduleOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.recipients')}</label>
                <input type="text" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" placeholder={t('reports.recipients_placeholder')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.frequency')}</label>
                  <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                    <option>{t('reports.frequency_daily')}</option>
                    <option>{t('reports.frequency_weekly')}</option>
                    <option>{t('reports.frequency_monthly')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.time')}</label>
                  <input type="time" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" defaultValue="08:00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.format')}</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> {t('reports.format_pdf')}</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> {t('reports.format_excel')}</label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 flex justify-end gap-2">
              <button onClick={() => setIsScheduleOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60">{t('common.cancel')}</button>
              <button onClick={() => { alert(t('reports.schedule_saved')); setIsScheduleOpen(false); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400/60 dark:focus-visible:ring-offset-slate-900">{t('reports.save_schedule')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/80">
              <h3 className="font-bold text-gray-900 dark:text-slate-100">{t('reports.filters_modal_title')}</h3>
              <button onClick={() => setIsFilterOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-white rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.table_period')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
                  <input type="date" className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.department_module')}</label>
                <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                  <option>{t('reports.module_all')}</option>
                  <option>{t('reports.module_finance')}</option>
                  <option>{t('reports.module_sales')}</option>
                  <option>{t('reports.module_inventory')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">{t('reports.status')}</label>
                <select className="w-full border border-gray-300 dark:border-slate-600 rounded-lg p-2 text-sm bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100">
                  <option>{t('reports.status_active')}</option>
                  <option>{t('reports.status_archived')}</option>
                  <option>{t('common.all')}</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/80 flex justify-end gap-2">
              <button onClick={() => setIsFilterOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60">{t('reports.clear')}</button>
              <button onClick={() => { alert(t('reports.filters_applied')); setIsFilterOpen(false); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 dark:focus-visible:ring-blue-400/60 dark:focus-visible:ring-offset-slate-900">{t('reports.apply_filters')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;


