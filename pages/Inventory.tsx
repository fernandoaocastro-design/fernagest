import React, { useState } from 'react';
import { MOCK_PRODUCTS, MOCK_STOCK_MOVEMENTS, MOCK_SUPPLIERS } from '../constants';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  AlertTriangle, Package, TrendingUp, TrendingDown, 
  History, ArrowUpRight, ArrowDownRight, Tag, DollarSign,
  Save, X, Image as ImageIcon, Box
} from 'lucide-react';
import { Product, StockMovement } from '../types';

const formatKz = (value: number) => new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);

const Inventory = () => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [movements] = useState<StockMovement[]>(MOCK_STOCK_MOVEMENTS);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // KPIs
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Filtered Lists
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const CreateProductForm = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Novo Produto</h2>
        <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Image & Basic */}
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors">
            <ImageIcon size={32} className="mb-2" />
            <span className="text-sm">Arraste uma imagem ou clique</span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
        </div>

        {/* Middle Col - Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Informações Básicas</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
            <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Ex: Notebook Pro" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Código</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="PROD-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option>Selecione...</option>
                <option>Eletrônicos</option>
                <option>Móveis</option>
                <option>Acessórios</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option>Selecione...</option>
              {MOCK_SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Right Col - Numbers */}
        <div className="space-y-4">
           <h3 className="font-semibold text-gray-900 border-b pb-2">Precificação e Estoque</h3>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço Custo</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs">Kz</span>
                <input type="number" className="w-full border border-gray-300 rounded-lg pl-8 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço Venda</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs">Kz</span>
                <input type="number" className="w-full border border-gray-300 rounded-lg pl-8 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Estoque</label>
               <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
            </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
               <input type="number" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="5" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
               <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                 <option>UN</option>
                 <option>KG</option>
                 <option>LT</option>
               </select>
            </div>
          </div>
          
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Localização</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Corredor A, Prateleira 2" />
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t pt-4">
        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Cancelar
        </button>
        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save size={16} /> Salvar Produto
        </button>
      </div>
    </div>
  );

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => setIsFormOpen(false)}>Produtos</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Cadastrar</span>
        </div>
        <CreateProductForm />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
          <p className="text-gray-500 text-sm">Gestão completa de produtos, preços e reposição.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            Exportar Relatório
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Itens em Estoque</p>
            <h3 className="text-xl font-bold text-gray-900">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Valor em Venda</p>
            <h3 className="text-xl font-bold text-gray-900">{formatKz(totalStockValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Valor em Custo</p>
            <h3 className="text-xl font-bold text-gray-900">{formatKz(totalCostValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">Estoque Baixo</p>
            <h3 className="text-xl font-bold text-gray-900">{lowStockCount} alertas</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-200">
           <nav className="flex gap-4 px-6">
              <button 
                onClick={() => setActiveTab('products')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Lista de Produtos
              </button>
              <button 
                onClick={() => setActiveTab('movements')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'movements' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                Histórico de Movimentações
              </button>
           </nav>
        </div>

        {activeTab === 'products' && (
          <>
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, SKU ou categoria..." 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex items-center gap-2 text-sm bg-white">
                  <Filter size={16} />
                  Filtros
                </button>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4">Categoria/Fornecedor</th>
                    <th className="px-6 py-4">Preços</th>
                    <th className="px-6 py-4">Margem</th>
                    <th className="px-6 py-4 text-center">Estoque</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                            <Box size={20} />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{product.category}</span>
                          <span className="text-xs text-gray-500">{product.supplier}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{formatKz(product.price)}</span>
                          <span className="text-xs text-gray-500">Custo: {formatKz(product.costPrice)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">
                          {calculateMargin(product.costPrice, product.price).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium">
                            <span className={product.stock <= product.minStock ? 'text-red-600' : 'text-gray-700'}>
                              {product.stock} {product.unit}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${product.stock <= product.minStock ? 'bg-red-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min((product.stock / (product.minStock * 3)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           <button className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title="Editar">
                             <Edit2 size={16} />
                           </button>
                           <button className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Desativar">
                             <Trash2 size={16} />
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

        {activeTab === 'movements' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Data/Hora</th>
                    <th className="px-6 py-4">Produto</th>
                    <th className="px-6 py-4 text-center">Tipo</th>
                    <th className="px-6 py-4 text-center">Quantidade</th>
                    <th className="px-6 py-4">Responsável</th>
                    <th className="px-6 py-4">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((move) => (
                    <tr key={move.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs">{move.date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{move.productName}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          move.type === 'IN' ? 'bg-green-100 text-green-700' :
                          move.type === 'OUT' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {move.type === 'IN' ? 'ENTRADA' : move.type === 'OUT' ? 'SAÍDA' : 'AJUSTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        {move.type === 'OUT' ? '-' : '+'}{Math.abs(move.quantity)}
                      </td>
                      <td className="px-6 py-4 text-xs">{move.user}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 italic">{move.reason}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;