import React, { useState } from 'react';
import { 
  Plus, Search, Filter, MoreVertical, FileText, Mail, 
  Trash2, ShoppingCart, Calendar, User, CreditCard,
  CheckCircle, Clock, XCircle, ArrowUpRight, TrendingUp,
  ChevronDown, X, Printer, Save
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MOCK_SALES, MOCK_PRODUCTS, MOCK_CUSTOMERS } from '../constants';
import { Product, Sale, SaleItem } from '../types';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const Sales = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [sales] = useState<Sale[]>(MOCK_SALES);
  
  // New Sale State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Chart Data
  const chartData = [
    { name: 'Seg', value: 125000 },
    { name: 'Ter', value: 180000 },
    { name: 'Qua', value: 150000 },
    { name: 'Qui', value: 210000 },
    { name: 'Sex', value: 190000 },
    { name: 'Sáb', value: 250000 },
    { name: 'Dom', value: 110000 },
  ];

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.price,
        total: product.price
      }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  if (isCreating) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
            <p className="text-gray-500 text-sm">Registre uma nova venda no sistema</p>
          </div>
          <button 
            onClick={() => setIsCreating(false)}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
          >
            <X size={18} /> Cancelar
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar produtos por nome ou SKU..." 
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {MOCK_PRODUCTS
                  .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="border border-gray-100 rounded-lg p-3 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all group bg-white"
                  >
                    <div className="h-24 bg-gray-50 rounded-md mb-2 flex items-center justify-center text-gray-300">
                      <ShoppingCart size={24} />
                    </div>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.sku}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-600 text-sm">{formatKz(product.price)}</span>
                      <button className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {/* Customer Select */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Selecione um cliente...</option>
                  <option value="new">+ Novo Cliente Rápido</option>
                  {MOCK_CUSTOMERS.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-2 opacity-50" />
                  <p className="text-sm">O carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.productName}</h4>
                      <p className="text-xs text-gray-500">{formatKz(item.unitPrice)} un.</p>
                    </div>
                    <div className="flex items-center gap-3 mx-3">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">-</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatKz(item.total)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500 hover:underline">Remover</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatKz(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Impostos (14%)</span>
                  <span>{formatKz(cartTotal * 0.14)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatKz(cartTotal * 1.14)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="border border-blue-600 bg-blue-50 text-blue-700 py-2 rounded text-xs font-medium">Cartão</button>
                  <button className="border border-gray-200 bg-white text-gray-600 py-2 rounded text-xs font-medium hover:bg-gray-50">Dinheiro</button>
                  <button className="border border-gray-200 bg-white text-gray-600 py-2 rounded text-xs font-medium hover:bg-gray-50">PIX/Transf.</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-bold hover:bg-gray-50">
                  <Printer size={18} /> Orçamento
                </button>
                <button 
                  disabled={cart.length === 0}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200"
                >
                  <Save size={18} /> Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Vendas</h1>
          <p className="text-gray-500 text-sm">Gerencie pedidos, orçamentos e faturamento</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          Nova Venda
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingCart size={20} />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center">
              <ArrowUpRight size={12} className="mr-1" /> +12%
            </span>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">Vendas Hoje</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(245000)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">Pedidos em Aberto</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">8</h3>
          <p className="text-xs text-gray-400 mt-1">Aguardando pagamento</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">Ticket Médio</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(45000)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <User size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">Melhor Vendedor</p>
          <h3 className="text-lg font-bold text-gray-900 mt-1 truncate">Ana Silva</h3>
          <p className="text-xs text-gray-400 mt-1">15 vendas este mês</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Table Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar venda, cliente..." 
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                <Calendar size={16} />
                <span className="hidden sm:inline">Período</span>
                <ChevronDown size={14} />
              </button>
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                <Filter size={16} />
                <span className="hidden sm:inline">Filtros</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-6 py-4">Venda</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4 hidden md:table-cell">Data</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{sale.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{sale.customerName}</span>
                        <span className="text-xs text-gray-400">{sale.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : sale.paymentMethod === 'boleto' ? 'Boleto Bancário' : 'PIX'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-xs">{sale.date}</td>
                    <td className="px-6 py-4 font-bold text-gray-900">{formatKz(sale.total)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 ${
                        sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sale.status === 'completed' ? <CheckCircle size={10} /> : 
                         sale.status === 'pending' ? <Clock size={10} /> : 
                         <XCircle size={10} />}
                        {sale.status === 'completed' ? 'Pago' : sale.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" title="Visualizar/Imprimir">
                          <Printer size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Enviar por Email">
                          <Mail size={16} />
                        </button>
                        <button className="p-1.5 hover:bg-gray-100 text-gray-600 rounded md:hidden">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Analytics & Alerts */}
        <div className="space-y-6">
          
          {/* Mini Sales Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-600" />
              Tendência Semanal
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', fontSize: '12px'}} 
                    formatter={(val: number) => [formatKz(val), 'Vendas']}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-4">Produtos Mais Vendidos</h3>
            <div className="space-y-3">
              {MOCK_PRODUCTS.slice(0, 4).map((product, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-500">{product.stock} em estoque</p>
                  </div>
                  <span className="text-xs font-bold text-gray-700">124 un</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">
              Ver Relatório Completo
            </button>
          </div>

          {/* Alerts */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
              <Clock size={16} />
              Pagamentos Pendentes
            </h3>
            <p className="text-xs text-red-600 mb-3">Existem 3 vendas com pagamento pendente há mais de 24h.</p>
            <button className="bg-white text-red-600 text-xs px-3 py-1.5 rounded border border-red-200 font-medium hover:bg-red-50">
              Verificar agora
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sales;