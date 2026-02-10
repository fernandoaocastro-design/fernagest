import React, { useState } from 'react';
import { 
  Truck, ShoppingBag, AlertCircle, CheckCircle, Clock, 
  Plus, Search, Filter, Printer, Mail, MoreVertical, 
  X, Save, FileText, ChevronDown, Calendar, Box, PackageCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { MOCK_PURCHASES, MOCK_SUPPLIERS, MOCK_PRODUCTS } from '../constants';
import { PurchaseOrder, PurchaseItem, Product } from '../types';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const Purchases = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [isCreating, setIsCreating] = useState(false);
  const [purchases] = useState<PurchaseOrder[]>(MOCK_PURCHASES);
  const [searchTerm, setSearchTerm] = useState('');

  // Creation State
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cart, setCart] = useState<PurchaseItem[]>([]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  
  // KPIs
  const totalSpent = purchases.filter(p => p.status === 'RECEIVED').reduce((acc, p) => acc + p.total, 0);
  const pendingOrders = purchases.filter(p => p.status === 'PENDING' || p.status === 'APPROVED').length;
  const receivedOrders = purchases.filter(p => p.status === 'RECEIVED').length;
  const topSupplier = 'Tech Distribuidora'; // Derived logic placeholder

  const filteredPurchases = purchases.filter(p => 
    p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => window.print();

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitCost }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.costPrice,
        total: product.costPrice
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitCost };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  const CreateOrderForm = () => (
    <div className="bg-white h-full flex flex-col">
       <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo Pedido de Compra</h2>
            <p className="text-sm text-gray-500">Preencha os dados para gerar a ordem de compra.</p>
          </div>
          <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
       </div>

       <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 p-6 overflow-y-auto border-r border-gray-100">
             <div className="mb-6 grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fornecedor</label>
                   <select 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                   >
                     <option value="">Selecione...</option>
                     {MOCK_SUPPLIERS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Prevista</label>
                   <input 
                      type="date" 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                      value={orderDate}
                      onChange={(e) => setOrderDate(e.target.value)}
                   />
                </div>
             </div>

             <div className="mb-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar produtos para adicionar..." 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
             </div>

             <div className="grid grid-cols-2 gap-3">
                {MOCK_PRODUCTS.slice(0, 6).map(product => (
                  <div key={product.id} onClick={() => addToCart(product)} className="border border-gray-100 rounded-lg p-3 hover:border-blue-500 cursor-pointer transition-all flex justify-between items-center group">
                     <div>
                        <p className="font-medium text-sm text-gray-800">{product.name}</p>
                        <p className="text-xs text-gray-500">Custo: {formatKz(product.costPrice)}</p>
                     </div>
                     <button className="w-8 h-8 rounded-full bg-gray-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus size={16} />
                     </button>
                  </div>
                ))}
             </div>
          </div>

          {/* Right: Cart Summary */}
          <div className="bg-gray-50 p-6 flex flex-col h-full">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <ShoppingBag size={18} /> Resumo do Pedido
             </h3>
             
             <div className="flex-1 overflow-y-auto space-y-3 mb-4">
               {cart.length === 0 ? (
                 <div className="text-center text-gray-400 py-10">Nenhum item adicionado</div>
               ) : (
                 cart.map(item => (
                   <div key={item.productId} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800 line-clamp-1">{item.productName}</span>
                        <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                      </div>
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-sm">-</button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-sm">+</button>
                         </div>
                         <span className="text-sm font-bold text-gray-900">{formatKz(item.total)}</span>
                      </div>
                   </div>
                 ))
               )}
             </div>

             <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                   <span>Subtotal</span>
                   <span>{formatKz(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                   <span>Total</span>
                   <span>{formatKz(cartTotal)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4">
                   <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-white border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                     <Printer size={16} /> PDF
                   </button>
                   <button className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm shadow-blue-200">
                     <Save size={16} /> Salvar
                   </button>
                </div>
             </div>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {isCreating ? (
        <CreateOrderForm />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de Compras</h1>
              <p className="text-gray-500 text-sm">Controle fornecedores, pedidos e recebimentos.</p>
            </div>
            <div className="flex gap-2">
               <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2" onClick={handlePrint}>
                 <Printer size={16} /> Relatórios
               </button>
               <button 
                 onClick={() => setIsCreating(true)}
                 className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
               >
                 <Plus size={18} /> Novo Pedido
               </button>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Truck size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Pedidos Totais</p>
                <h3 className="text-xl font-bold text-gray-900">{purchases.length}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Clock size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Pendentes</p>
                <h3 className="text-xl font-bold text-gray-900">{pendingOrders}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Recebidos</p>
                <h3 className="text-xl font-bold text-gray-900">{receivedOrders}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><ShoppingBag size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">Total Gasto</p>
                <h3 className="text-xl font-bold text-gray-900">{formatKz(totalSpent)}</h3>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
             <div className="border-b border-gray-200 px-6 flex items-center justify-between">
               <nav className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Dashboard
                  </button>
                  <button 
                    onClick={() => setActiveTab('list')}
                    className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    Pedidos de Compra
                  </button>
               </nav>
               {activeTab === 'list' && (
                  <div className="flex items-center gap-2">
                     <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input 
                           type="text" 
                           placeholder="Buscar pedido..."
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="pl-8 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                     </div>
                  </div>
               )}
             </div>

             <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
               {activeTab === 'dashboard' ? (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Charts */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-800 mb-6">Gastos por Mês</h3>
                       <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={[
                               { name: 'Jul', value: 2500000 }, { name: 'Ago', value: 3200000 },
                               { name: 'Set', value: 1800000 }, { name: 'Out', value: 4500000 }
                             ]}>
                                <defs>
                                   <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                   </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v/1000}k`} />
                                <Tooltip formatter={(v: number) => formatKz(v)} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpend)" />
                             </AreaChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                       <h3 className="font-bold text-gray-800 mb-4">Top Fornecedores</h3>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">1</div>
                                <div>
                                   <p className="font-medium text-gray-900">Tech Distribuidora</p>
                                   <p className="text-xs text-gray-500">12 pedidos</p>
                                </div>
                             </div>
                             <span className="font-bold text-gray-700">{formatKz(5500000)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold">2</div>
                                <div>
                                   <p className="font-medium text-gray-900">Global Imports</p>
                                   <p className="text-xs text-gray-500">8 pedidos</p>
                                </div>
                             </div>
                             <span className="font-bold text-gray-700">{formatKz(2100000)}</span>
                          </div>
                       </div>
                    </div>

                    {/* Alerts Section */}
                     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                           <AlertCircle size={18} className="text-red-500" /> Alertas de Compras
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex gap-3">
                              <PackageCheck className="text-red-600 shrink-0" size={20} />
                              <div>
                                 <p className="text-sm font-bold text-red-800">Pedido Atrasado</p>
                                 <p className="text-xs text-red-600">PED-501 (Tech Distribuidora) deveria ter chegado ontem.</p>
                              </div>
                           </div>
                           <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex gap-3">
                              <Box className="text-yellow-600 shrink-0" size={20} />
                              <div>
                                 <p className="text-sm font-bold text-yellow-800">Estoque Crítico Previsto</p>
                                 <p className="text-xs text-yellow-600">Mouse Wireless Ergo pode acabar em 3 dias.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                 </div>
               ) : (
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-600">
                       <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                          <tr>
                             <th className="px-6 py-4">Pedido</th>
                             <th className="px-6 py-4">Fornecedor</th>
                             <th className="px-6 py-4">Data Emissão</th>
                             <th className="px-6 py-4">Previsão</th>
                             <th className="px-6 py-4">Total</th>
                             <th className="px-6 py-4 text-center">Status</th>
                             <th className="px-6 py-4 text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                          {filteredPurchases.map(order => (
                             <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 font-mono font-medium text-gray-900">{order.id}</td>
                                <td className="px-6 py-4 text-gray-900">{order.supplierName}</td>
                                <td className="px-6 py-4 text-xs">{order.date}</td>
                                <td className="px-6 py-4 text-xs">{order.expectedDate}</td>
                                <td className="px-6 py-4 font-bold text-gray-900">{formatKz(order.total)}</td>
                                <td className="px-6 py-4 text-center">
                                   <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                                      order.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                                      order.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                      order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                      'bg-yellow-100 text-yellow-700'
                                   }`}>
                                      {order.status === 'RECEIVED' ? 'Recebido' : 
                                       order.status === 'APPROVED' ? 'Aprovado' : 
                                       order.status === 'CANCELLED' ? 'Cancelado' : 'Pendente'}
                                   </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                   <div className="flex justify-end gap-2">
                                      <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Ver PDF" onClick={handlePrint}>
                                         <FileText size={16} />
                                      </button>
                                      <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Enviar Email">
                                         <Mail size={16} />
                                      </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               )}
             </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Purchases;