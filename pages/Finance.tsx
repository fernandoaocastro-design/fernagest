import React, { useState } from 'react';
import { MOCK_FINANCIAL_DATA, MOCK_TRANSACTIONS } from '../constants';
import { FinancialTransaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, 
  FileText, Download, Filter, Search, Plus, Calendar, CheckCircle, 
  AlertTriangle, Clock, Printer, X, MoreVertical, Trash2, Edit2 
} from 'lucide-react';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const Finance = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'receivable' | 'payable'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(MOCK_TRANSACTIONS);

  // Dynamic Calculations
  const totalBalance = transactions
    .reduce((acc, t) => t.status === 'PAID' ? (t.type === 'INCOME' ? acc + t.amount : acc - t.amount) : acc, 0);
  
  const totalReceivable = transactions
    .filter(t => t.type === 'INCOME' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalPayable = transactions
    .filter(t => t.type === 'EXPENSE' && t.status !== 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);
  
  const monthlyRevenue = transactions
    .filter(t => t.type === 'INCOME' && t.status === 'PAID') // Simplified logic for demo
    .reduce((acc, t) => acc + t.amount, 0);

  const monthlyExpense = transactions
    .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
    .reduce((acc, t) => acc + t.amount, 0);

  // Filter Logic
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.entity.toLowerCase().includes(searchTerm.toLowerCase());
    if (activeTab === 'receivable') return matchesSearch && t.type === 'INCOME';
    if (activeTab === 'payable') return matchesSearch && t.type === 'EXPENSE';
    return matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  const NewTransactionForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Novo Lançamento</h2>
          <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Tipo de Transação</label>
             <div className="flex gap-2">
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="type" className="peer sr-only" defaultChecked />
                 <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-green-50 peer-checked:border-green-500 peer-checked:text-green-700 text-sm font-medium transition-all">
                   Receita
                 </div>
               </label>
               <label className="flex-1 cursor-pointer">
                 <input type="radio" name="type" className="peer sr-only" />
                 <div className="text-center py-2 rounded-lg border border-gray-200 peer-checked:bg-red-50 peer-checked:border-red-500 peer-checked:text-red-700 text-sm font-medium transition-all">
                   Despesa
                 </div>
               </label>
             </div>
           </div>
           
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500 text-sm">Kz</span>
                <input type="number" className="w-full border border-gray-300 rounded-lg pl-9 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0,00" />
              </div>
           </div>

           <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Venda de Serviços, Conta de Luz" />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente / Fornecedor</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option>Vendas</option>
                <option>Serviços</option>
                <option>Estoque</option>
                <option>Utilidades</option>
                <option>Pessoal</option>
              </select>
           </div>

           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento</label>
              <input type="date" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
           </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="PAID">Pago / Recebido</option>
                <option value="PENDING">Pendente</option>
              </select>
           </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
           <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">
             Cancelar
           </button>
           <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
             <CheckCircle size={16} /> Salvar Lançamento
           </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {isFormOpen && <NewTransactionForm />}
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
          <p className="text-gray-500 text-sm">Controle de fluxo de caixa, pagamentos e recebimentos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <Printer size={16} /> Relatórios
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus size={18} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('receivable')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'receivable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Contas a Receber
        </button>
        <button 
          onClick={() => setActiveTab('payable')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'payable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Contas a Pagar
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
           {/* Summary Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></div>
                   <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+5%</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">Saldo Atual</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(totalBalance)}</h3>
              </div>
              
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                   <span className="text-xs font-medium text-gray-500">Mês Atual</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">Receita Total</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(monthlyRevenue)}</h3>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></div>
                   <span className="text-xs font-medium text-gray-500">Mês Atual</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">Despesa Total</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(monthlyExpense)}</h3>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex justify-between items-start mb-2">
                   <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Clock size={20} /></div>
                   <span className="text-xs font-medium text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Atenção</span>
                 </div>
                 <p className="text-gray-500 text-xs font-medium uppercase">A Pagar (Pendente)</p>
                 <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(totalPayable)}</h3>
              </div>
           </div>

           {/* Charts Section */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-6">Fluxo de Caixa (Últimos 12 Meses)</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_FINANCIAL_DATA}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                      <Tooltip 
                        contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                        formatter={(val: number) => formatKz(val)}
                      />
                      <Legend />
                      <Bar dataKey="revenue" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="expenses" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4">Despesas por Categoria</h3>
                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={[
                          { name: 'Estoque', value: 45 },
                          { name: 'Pessoal', value: 25 },
                          { name: 'Serviços', value: 15 },
                          { name: 'Outros', value: 15 },
                        ]} 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                      >
                        {['#3b82f6', '#10b981', '#f59e0b', '#ef4444'].map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                   <div className="flex justify-between text-xs text-gray-600"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Estoque</span> <span>45%</span></div>
                   <div className="flex justify-between text-xs text-gray-600"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span> Pessoal</span> <span>25%</span></div>
                   <div className="flex justify-between text-xs text-gray-600"><span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Serviços</span> <span>15%</span></div>
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
                  placeholder={`Buscar em ${activeTab === 'receivable' ? 'contas a receber' : 'contas a pagar'}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                  <Filter size={16} />
                  Filtros
                </button>
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                  <Download size={16} />
                  Exportar PDF
                </button>
              </div>
           </div>

           {/* Table */}
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
               <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                 <tr>
                   <th className="px-6 py-4">Status</th>
                   <th className="px-6 py-4">Descrição</th>
                   <th className="px-6 py-4">{activeTab === 'receivable' ? 'Cliente' : 'Fornecedor'}</th>
                   <th className="px-6 py-4">Vencimento</th>
                   <th className="px-6 py-4">Valor</th>
                   <th className="px-6 py-4 text-center">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {filteredTransactions.map((t) => (
                   <tr key={t.id} className="hover:bg-gray-50 transition-colors group">
                     <td className="px-6 py-4">
                       {t.status === 'PAID' ? (
                         <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           <CheckCircle size={12} /> Pago
                         </span>
                       ) : t.status === 'OVERDUE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           <AlertTriangle size={12} /> Atrasado
                         </span>
                       ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                           <Clock size={12} /> Pendente
                         </span>
                       )}
                     </td>
                     <td className="px-6 py-4">
                       <p className="font-medium text-gray-900">{t.description}</p>
                       <p className="text-xs text-gray-400">{t.category} • {t.documentNumber}</p>
                     </td>
                     <td className="px-6 py-4 text-gray-900">{t.entity}</td>
                     <td className={`px-6 py-4 font-mono text-xs ${t.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}`}>
                       {t.dueDate}
                     </td>
                     <td className={`px-6 py-4 font-bold ${t.type === 'INCOME' ? 'text-blue-600' : 'text-gray-900'}`}>
                       {formatKz(t.amount)}
                     </td>
                     <td className="px-6 py-4 text-center">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Gerar PDF">
                           <FileText size={16} />
                         </button>
                         <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Editar">
                           <Edit2 size={16} />
                         </button>
                         <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Excluir">
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {filteredTransactions.length === 0 && (
               <div className="p-8 text-center text-gray-500">
                 Nenhuma transação encontrada.
               </div>
             )}
           </div>
        </div>
      )}
    </div>
  );
};

export default Finance;