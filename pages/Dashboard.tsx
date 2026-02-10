import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, Package, AlertTriangle, ArrowUpRight, ArrowDownRight, 
  DollarSign, Wallet, ShoppingBag, CreditCard, Calendar, Gift, ChevronRight,
  TrendingDown, CheckCircle, Clock
} from 'lucide-react';
import { MOCK_FINANCIAL_DATA, MOCK_ACTIVITY, KPIS, MOCK_TOP_PRODUCTS, MOCK_ORIGIN, MOCK_BIRTHDAYS } from '../constants';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const KPICard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }: any) => {
  const colorClasses: {[key: string]: string} = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const currentClass = colorClasses[color] || colorClasses.blue;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start mb-2">
        <div className={`p-2 rounded-lg ${currentClass} bg-opacity-50`}>
          <Icon size={18} />
        </div>
        {trend && (
          <div className={`flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend === 'up' ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">{title}</p>
      <h3 className="text-xl font-bold text-gray-900 mt-1">{value}</h3>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

const Dashboard = () => {
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6 pb-8">
      {/* Quick Actions & Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="text-gray-500 text-sm">Resumo estratégico do seu negócio</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
             Relatórios
           </button>
           <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200">
             + Nova Venda
           </button>
        </div>
      </div>

      {/* KPI Grid - 8 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <KPICard title="Faturamento Dia" value={formatKz(KPIS.dailyRevenue)} icon={DollarSign} color="blue" trend="up" trendValue="12%" />
        <KPICard title="Vendas Mês" value={formatKz(KPIS.monthlyRevenue)} icon={ShoppingBag} color="green" trend="up" trendValue="8.5%" />
        <KPICard title="Novos Clientes" value={KPIS.newCustomers} icon={Users} color="indigo" trend="up" trendValue="+4" />
        <KPICard title="Despesas Totais" value={formatKz(KPIS.totalExpenses)} icon={TrendingDown} color="red" trend="down" trendValue="2%" />
        <KPICard title="Lucro Líquido" value={formatKz(KPIS.netProfit)} icon={Wallet} color="emerald" trend="up" trendValue="15%" />
        <KPICard title="Margem (%)" value={`${KPIS.margin}%`} icon={TrendingUp} color="teal" subtitle="Margem bruta" />
        <KPICard title="A Receber" value={formatKz(KPIS.accountsReceivable)} icon={CreditCard} color="sky" subtitle="Próximos 7 dias" />
        <KPICard title="A Pagar" value={formatKz(KPIS.accountsPayable)} icon={AlertTriangle} color="rose" subtitle="Vence hoje" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Charts (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Chart - Annual Evolution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-800">Evolução Anual do Faturamento</h2>
              <select className="bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>2023</option>
                <option>2022</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_FINANCIAL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number) => [formatKz(value), 'Valor']}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Faturamento
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Lucro
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Profit vs Expense */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Lucro x Despesa</h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_FINANCIAL_DATA.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} formatter={(val: number) => formatKz(val)} />
                    <Bar dataKey="profit" name="Lucro" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expenses" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Produtos Mais Vendidos</h2>
              <div className="space-y-4">
                {MOCK_TOP_PRODUCTS.slice(0, 5).map((product, idx) => (
                  <div key={idx} className="relative">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{product.name}</span>
                      <span className="text-gray-500">{product.sales} un.</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(product.sales / 50) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar Widgets (1/3 width) */}
        <div className="space-y-6">
          
          {/* Smart Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-red-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                Alertas Inteligentes
              </h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">3</span>
            </div>
            <div className="p-2">
              <div className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Estoque Crítico</p>
                    <p className="text-xs text-gray-500">Mouse Wireless Ergo (2 un)</p>
                  </div>
                </div>
              </div>
              <div className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Conta a Pagar Vencendo</p>
                    <p className="text-xs text-gray-500">Fornecedor Tech (Kz 12.000)</p>
                  </div>
                </div>
              </div>
               <div className="p-3 hover:bg-gray-50 transition-colors">
                 <div className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Queda nas vendas</p>
                    <p className="text-xs text-gray-500">-15% comparado à semana anterior</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
             <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
               <CheckCircle size={16} className="text-blue-600" />
               Resumo Diário
             </h3>
             <div className="space-y-4">
                {MOCK_ACTIVITY.slice(0, 4).map((activity) => (
                   <div key={activity.id} className="flex gap-3 items-start">
                      <div className="mt-0.5 text-gray-400">
                        <Clock size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                           <p className="text-xs font-medium text-gray-900">{activity.action}</p>
                           <span className="text-[10px] text-gray-400">{activity.time}</span>
                        </div>
                        {activity.value && (
                          <p className="text-xs font-bold text-blue-600 mt-0.5">
                            {formatKz(activity.value)}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-500 mt-0.5">{activity.user}</p>
                      </div>
                   </div>
                ))}
             </div>
             <button className="w-full mt-4 text-xs text-center text-blue-600 font-medium hover:underline">
               Ver todas as atividades
             </button>
          </div>

          {/* Birthdays */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-5 text-white">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold flex items-center gap-2">
                 <Gift size={18} className="text-yellow-300" />
                 Aniversariantes
               </h3>
               <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">Outubro</span>
             </div>
             <div className="space-y-3">
               {MOCK_BIRTHDAYS.map((bday) => (
                 <div key={bday.id} className="flex items-center justify-between bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs">
                         {bday.name.charAt(0)}
                       </div>
                       <div>
                         <p className="text-sm font-medium leading-none">{bday.name}</p>
                         <p className="text-[10px] text-blue-200 mt-0.5 opacity-80 uppercase">{bday.type === 'customer' ? 'Cliente' : 'Equipe'}</p>
                       </div>
                    </div>
                    <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">{bday.date}</span>
                 </div>
               ))}
             </div>
          </div>

          {/* Customer Origin - Mini Chart */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-2">Origem dos Clientes</h3>
            <div className="flex items-center gap-4">
               <div className="w-24 h-24">
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie data={MOCK_ORIGIN} dataKey="count" innerRadius={25} outerRadius={40} paddingAngle={5}>
                       {MOCK_ORIGIN.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                       ))}
                     </Pie>
                   </PieChart>
                 </ResponsiveContainer>
               </div>
               <div className="flex-1 space-y-1">
                 {MOCK_ORIGIN.map((origin, idx) => (
                   <div key={idx} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-1.5">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]}}></div>
                       <span className="text-gray-600">{origin.source}</span>
                     </div>
                     <span className="font-medium text-gray-900">{origin.count}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;