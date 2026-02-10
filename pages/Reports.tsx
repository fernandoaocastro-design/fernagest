import React, { useState } from 'react';
import { 
  PieChart, Settings, FileText, Download, Filter, Search, 
  Calendar, ChevronDown, Printer, Mail, Share2, 
  Wallet, ShoppingCart, Package, Users, Briefcase, Truck,
  FileSpreadsheet, File, Star, Play, X, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend
} from 'recharts';
import { MOCK_REPORTS, MOCK_FINANCIAL_DATA } from '../constants';
import { ReportDef } from '../types';

const Reports = () => {
  const [activeModule, setActiveModule] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const filteredReports = MOCK_REPORTS.filter(r => {
    const matchesModule = activeModule === 'ALL' || r.module === activeModule;
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesModule && matchesSearch;
  });

  const getModuleIcon = (module: string) => {
    switch(module) {
      case 'FINANCE': return <Wallet size={18} className="text-emerald-600" />;
      case 'SALES': return <ShoppingCart size={18} className="text-blue-600" />;
      case 'INVENTORY': return <Package size={18} className="text-orange-600" />;
      case 'CRM': return <Users size={18} className="text-purple-600" />;
      case 'PROJECTS': return <Briefcase size={18} className="text-pink-600" />;
      case 'PURCHASES': return <Truck size={18} className="text-amber-600" />;
      default: return <FileText size={18} className="text-gray-600" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText size={14} className="text-red-500" />;
      case 'EXCEL': return <FileSpreadsheet size={14} className="text-green-600" />;
      case 'CSV': return <File size={14} className="text-gray-500" />;
      default: return <FileText size={14} />;
    }
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // Mock download action
      alert('Relatório gerado com sucesso! O download iniciará em instantes.');
    }, 2000);
  };

  // Mock Component for Previewing Report Data
  const ReportPreview = ({ report }: { report: ReportDef }) => {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
               {getModuleIcon(report.module)}
             </div>
             <div>
               <h2 className="text-lg font-bold text-gray-900 leading-tight">{report.title}</h2>
               <p className="text-xs text-gray-500">{report.description}</p>
             </div>
          </div>
          <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Modal Body - Charts & Data */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
                 <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <BarChart2 size={16} /> Visualização Gráfica
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
                            <Bar dataKey="revenue" name="Receita" fill="#3b82f6" radius={[4,4,0,0]} />
                            <Bar dataKey="profit" name="Lucro" fill="#10b981" radius={[4,4,0,0]} />
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
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="text-sm font-bold text-gray-800 mb-4">Resumo Executivo</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">Total Período</span>
                       <span className="font-bold text-gray-900">Kz 14.500.000</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">Média Mensal</span>
                       <span className="font-bold text-gray-900">Kz 1.200.000</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-50">
                       <span className="text-sm text-gray-500">Variação (YoY)</span>
                       <span className="font-bold text-green-600">+12.5%</span>
                    </div>
                    
                    <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                       <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>Observação:</strong> Os dados deste relatório são atualizados em tempo real. Para fins de auditoria, utilize a versão PDF assinada digitalmente.
                       </p>
                    </div>
                 </div>
              </div>
           </div>
           
           {/* Mock Data Table */}
           <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm text-gray-600">
                 <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                    <tr>
                       <th className="px-6 py-4">Período</th>
                       <th className="px-6 py-4">Categoria</th>
                       <th className="px-6 py-4">Ref. Cruzada</th>
                       <th className="px-6 py-4 text-right">Valor</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {[1,2,3,4,5].map(i => (
                       <tr key={i} className="hover:bg-gray-50">
                          <td className="px-6 py-3">Outubro/2023</td>
                          <td className="px-6 py-3">{report.module} - Operacional</td>
                          <td className="px-6 py-3 font-mono text-xs">REF-{1000+i}</td>
                          <td className="px-6 py-3 text-right font-medium">Kz {15000 * i},00</td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
           <button 
             onClick={() => setSelectedReport(null)}
             className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
           >
             Fechar Visualização
           </button>
           <button 
             onClick={handleGenerate}
             disabled={isGenerating}
             className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isGenerating ? (
               <span className="flex items-center gap-2">
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                 Gerando Arquivo...
               </span>
             ) : (
               <>
                 <Download size={18} /> Baixar {report.type}
               </>
             )}
           </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Central de Relatórios</h1>
          <p className="text-gray-500 text-sm">Business Intelligence e exportação de dados.</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
             <Calendar size={16} /> Agendar Envio
           </button>
           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200">
             <Filter size={16} /> Filtros Avançados
           </button>
        </div>
      </div>

      {/* Module Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 flex-shrink-0">
         {['ALL', 'FINANCE', 'SALES', 'INVENTORY', 'CRM', 'PROJECTS', 'PURCHASES'].map((module) => (
           <button 
             key={module}
             onClick={() => setActiveModule(module)}
             className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
               activeModule === module 
                 ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                 : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
             }`}
           >
             {module === 'ALL' ? 'Todos' : module}
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
             placeholder="Buscar relatório por nome ou descrição..." 
             className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
           />
         </div>

         {/* Reports Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {filteredReports.map(report => (
               <div key={report.id} className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                  {/* Card Header */}
                  <div className="p-6 flex-1">
                     <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                           {getModuleIcon(report.module)}
                        </div>
                        {report.favorite && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                     </div>
                     <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{report.title}</h3>
                     <p className="text-sm text-gray-500 leading-relaxed">{report.description}</p>
                  </div>

                  {/* Card Footer */}
                  <div className="bg-gray-50/80 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        {getTypeIcon(report.type)}
                        <span className="text-xs font-medium text-gray-600">{report.type}</span>
                     </div>
                     <button 
                       onClick={() => setSelectedReport(report)}
                       className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0"
                     >
                        Visualizar <Play size={14} />
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
               <h3 className="text-lg font-bold text-gray-900">Nenhum relatório encontrado</h3>
               <p className="text-gray-500 max-w-sm mt-2">Tente ajustar seus filtros ou buscar por outro termo.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Reports;