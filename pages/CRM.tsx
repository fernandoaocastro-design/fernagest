import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, Filter, Mail, Phone, MapPin, 
  MoreVertical, Edit2, AlertCircle, TrendingUp, Briefcase,
  CheckCircle, XCircle, Layout, List, Calendar, ChevronRight,
  DollarSign, Save, X, Plus
} from 'lucide-react';
import { MOCK_CUSTOMERS, MOCK_PIPELINE } from '../constants';
import { Customer, PipelineDeal } from '../types';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const CRM = () => {
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [customers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [deals] = useState<PipelineDeal[]>(MOCK_PIPELINE);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // KPIs
  const totalCustomers = customers.length;
  const newCustomers = customers.filter(c => c.segment === 'Novo').length;
  const activeDeals = deals.length;
  const churnRisk = customers.filter(c => c.status === 'inactive').length;

  // Pipeline Columns
  const stages = [
    { id: 'lead', label: 'Prospecção / Lead', color: 'bg-gray-100 border-gray-200' },
    { id: 'contact', label: 'Contato Feito', color: 'bg-blue-50 border-blue-100' },
    { id: 'proposal', label: 'Proposta Enviada', color: 'bg-yellow-50 border-yellow-100' },
    { id: 'negotiation', label: 'Em Negociação', color: 'bg-purple-50 border-purple-100' },
    { id: 'closed', label: 'Fechado / Ganho', color: 'bg-green-50 border-green-100' },
  ];

  const CreateCustomerForm = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Cadastrar Cliente</h2>
        <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Dados Principais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo / Razão Social</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="Regular">Regular</option>
                <option value="VIP">VIP</option>
                <option value="Novo">Novo</option>
              </select>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa (Opcional)</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Contatos e Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Estado</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="mt-4">
             <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
             <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* Notes */}
        <div>
           <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Observações</h3>
           <textarea rows={3} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Preferências, histórico breve, etc."></textarea>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save size={16} /> Salvar Cliente
        </button>
      </div>
    </div>
  );

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => setIsFormOpen(false)}>Clientes</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Novo Cadastro</span>
        </div>
        <CreateCustomerForm />
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Clientes (CRM)</h1>
          <p className="text-gray-500 text-sm">Centralize o relacionamento e impulsione vendas.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-1 flex">
             <button 
               onClick={() => setViewMode('list')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <List size={16} /> Lista
             </button>
             <button 
               onClick={() => setViewMode('pipeline')}
               className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'pipeline' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
             >
               <Layout size={16} /> Pipeline
             </button>
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <UserPlus size={18} />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Total Clientes</p>
            <h3 className="text-xl font-bold text-gray-900">{totalCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <UserPlus size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Novos (Mês)</p>
            <h3 className="text-xl font-bold text-gray-900">+{newCustomers}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Risco Churn</p>
            <h3 className="text-xl font-bold text-gray-900">{churnRisk}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Oportunidades</p>
            <h3 className="text-xl font-bold text-gray-900">{activeDeals}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {viewMode === 'list' && (
          <>
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, email ou documento..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                  <Filter size={16} />
                  Segmentar
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-6 py-4">Cliente / Empresa</th>
                    <th className="px-6 py-4">Contato</th>
                    <th className="px-6 py-4">Localização</th>
                    <th className="px-6 py-4">Segmento</th>
                    <th className="px-6 py-4">Total Compras</th>
                    <th className="px-6 py-4">Última Compra</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900">{customer.name}</span>
                          <span className="text-xs text-gray-500">{customer.company}</span>
                          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{customer.document}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                           <div className="flex items-center gap-2 text-xs">
                             <Mail size={12} className="text-gray-400" /> {customer.email}
                           </div>
                           <div className="flex items-center gap-2 text-xs">
                             <Phone size={12} className="text-gray-400" /> {customer.phone}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{customer.location}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          customer.segment === 'VIP' ? 'bg-blue-100 text-blue-700' :
                          customer.segment === 'Novo' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {customer.segment}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {formatKz(customer.totalSpent || 0)}
                        <span className="block text-[10px] text-gray-400 font-normal">{customer.purchaseCount} pedidos</span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {customer.lastOrderDate}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {customer.status === 'active' ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600">
                            <CheckCircle size={14} />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                            <XCircle size={14} />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Editar">
                            <Edit2 size={16} />
                          </button>
                           <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Histórico">
                            <TrendingUp size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {viewMode === 'pipeline' && (
          <div className="flex-1 overflow-x-auto p-4 bg-gray-50 h-full">
            <div className="flex gap-4 h-full min-w-max">
              {stages.map((stage) => (
                <div key={stage.id} className="w-72 flex flex-col h-full">
                  <div className={`p-3 rounded-t-lg border-b-2 font-semibold text-sm text-gray-700 flex justify-between items-center bg-white shadow-sm ${stage.color.replace('bg-', 'border-').split(' ')[1]}`}>
                    {stage.label}
                    <span className="bg-gray-100 text-gray-600 text-xs py-0.5 px-2 rounded-full">
                      {deals.filter(d => d.stage === stage.id).length}
                    </span>
                  </div>
                  <div className="flex-1 bg-gray-100/50 p-2 space-y-3 overflow-y-auto rounded-b-lg border-x border-b border-gray-200">
                    {deals.filter(d => d.stage === stage.id).map(deal => (
                      <div key={deal.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer transition-shadow group">
                         <div className="flex justify-between items-start mb-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">#{deal.id}</span>
                           <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={14} /></button>
                         </div>
                         <h4 className="font-bold text-gray-800 text-sm mb-1">{deal.title}</h4>
                         <p className="text-xs text-blue-600 font-medium mb-2">{deal.customerName}</p>
                         
                         <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-2">
                           <span className="font-bold text-gray-900 text-sm">{formatKz(deal.value)}</span>
                           <div className="flex items-center text-[10px] text-gray-500 gap-1 bg-gray-100 px-1.5 py-0.5 rounded">
                             <Calendar size={10} /> {deal.expectedDate.split('-').slice(1).join('/')}
                           </div>
                         </div>
                         
                         {/* Probability Bar */}
                         <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                           <div className={`h-full ${deal.probability > 70 ? 'bg-green-500' : deal.probability > 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${deal.probability}%`}}></div>
                         </div>
                      </div>
                    ))}
                    <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm font-medium hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CRM;