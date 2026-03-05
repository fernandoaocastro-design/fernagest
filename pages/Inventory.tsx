import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_STOCK_MOVEMENTS, MOCK_SUPPLIERS } from '../constants';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  AlertTriangle, Package, TrendingUp, TrendingDown, 
  History, ArrowUpRight, ArrowDownRight, Tag, DollarSign,
  Save, X, Image as ImageIcon, Box, Download, ChevronDown
} from 'lucide-react';
import { Product, StockMovement } from '../types';
import { supabase } from '../supabaseClient';
import { confirmAction, notifyError, notifySuccess, notifyWarning } from '../utils/feedback';
import { openPrintWindow } from '../utils/print';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { formatDate } from '../utils/language';
import { useI18n } from '../utils/i18n';

const formatKz = (value: number) => formatCurrency(value);

// Logotipo SVG Base64
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTÃƒÆ’O INTELIGENTE%3C/text%3E%3C/svg%3E";

const Inventory = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements] = useState<StockMovement[]>(MOCK_STOCK_MOVEMENTS);
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const currencySymbol = getCurrencySymbol();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (data) {
      const mapped = data.map((p: any) => ({
        ...p,
        costPrice: p.cost_price,
        minStock: p.min_stock,
        imageUrl: p.image_url
      }));
      setProducts(mapped);
    }
  };

  // KPIs
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.stock), 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice * p.stock), 0);
  const totalItems = products.reduce((acc, p) => acc + p.stock, 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

  // Filtered Lists
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const calculateMargin = (cost: number, price: number) => {
    if (price === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  const getCategoryLabel = (category: string) => {
    const normalized = (category || '').toLowerCase();
    if (normalized.includes('eletr')) return t('inventory.category_electronics');
    if (normalized.includes('mov')) return t('inventory.category_furniture');
    if (normalized.includes('acess')) return t('inventory.category_accessories');
    if (normalized.includes('perif')) return t('inventory.category_peripherals');
    return category;
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = await confirmAction({
      title: t('inventory.delete_title'),
      message: t('inventory.delete_message'),
      confirmLabel: t('inventory.delete_confirm'),
      cancelLabel: t('common.cancel'),
      danger: true
    });

    if (!shouldDelete) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      notifyError(t('inventory.error_delete', { message: error.message }));
    } else {
      notifySuccess(t('inventory.delete_success'));
      fetchProducts();
    }
  };

  const handleExport = () => {
    const date = formatDate(new Date());
    // Substitua esta URL pela URL real do seu logotipo (pode ser do Supabase Storage)
    const logoUrl = FERNAGEST_LOGO;

    const html = `
      <html>
        <head>
          <title>${t('inventory.report_title')} - FernaGest</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { max-height: 60px; max-width: 200px; }
            .report-info { text-align: right; }
            h1 { color: #2563eb; margin: 0; font-size: 24px; }
            p.subtitle { color: #666; font-size: 12px; margin: 5px 0 0 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #e5e7eb; }
            td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #999; }
            @media print { 
              body { padding: 0; } 
              @page { size: landscape; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" class="logo" alt="Logo" />
            <div class="report-info">
              <h1>${t('inventory.report_title')}</h1>
              <p class="subtitle">${t('inventory.report_generated_at')}: ${date}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>${t('inventory.report_table_product')}</th>
                <th>${t('inventory.report_table_sku')}</th>
                <th>${t('inventory.report_table_category')}</th>
                <th>${t('inventory.report_table_cost')}</th>
                <th>${t('inventory.report_table_sale')}</th>
                <th>${t('inventory.report_table_stock')}</th>
                <th>${t('inventory.report_table_status')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map(p => `
                <tr>
                  <td>${p.name}</td>
                  <td>${p.sku}</td>
                  <td>${p.category}</td>
                  <td>${formatKz(p.costPrice)}</td>
                  <td>${formatKz(p.price)}</td>
                  <td>${p.stock} ${p.unit}</td>
                  <td>${p.status === 'active' ? t('inventory.status_active') : t('inventory.status_inactive')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>${t('inventory.report_footer')}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 900, height: 600 });
    if (!opened) notifyWarning(t('inventory.popup_blocked'));
  };

  const CreateProductForm = () => {
    const [formData, setFormData] = useState({
      name: editingProduct?.name || '',
      imageUrl: editingProduct?.imageUrl || '',
      sku: editingProduct?.sku || '',
      category: editingProduct?.category || 'Eletr\u00F4nicos',
      price: editingProduct?.price?.toString() || '',
      costPrice: editingProduct?.costPrice?.toString() || '',
      stock: editingProduct?.stock?.toString() || '',
      minStock: editingProduct?.minStock?.toString() || '5',
      unit: editingProduct?.unit || 'UN',
      status: editingProduct?.status || 'active'
    });
    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        setUploading(true);
        if (!event.target.files || event.target.files.length === 0) {
          throw new Error(t('inventory.upload_select_image'));
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from('products').getPublicUrl(filePath);
        setFormData({ ...formData, imageUrl: data.publicUrl });
        
      } catch (error: any) {
        if (error.message && error.message.includes('Bucket not found')) {
          notifyWarning(t('inventory.upload_required_setup'));
        } else {
          notifyError(t('inventory.upload_error', { message: error.message }));
        }
      } finally {
        setUploading(false);
      }
    };

    const handleSave = async () => {
      if (!formData.name || !formData.price) {
        notifyWarning(t('inventory.required_name_price'));
        return;
      }

      const productData = {
        name: formData.name,
        image_url: formData.imageUrl,
        sku: formData.sku,
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        cost_price: parseFloat(formData.costPrice) || 0,
        stock: parseInt(formData.stock) || 0,
        min_stock: parseInt(formData.minStock) || 5,
        unit: formData.unit,
        status: formData.status
      };

      let error;
      if (editingProduct) {
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData);
        error = insertError;
      }

      if (error) {
        notifyError(t('inventory.error_save', { message: error.message }));
      } else {
        notifySuccess(editingProduct ? t('inventory.update_success') : t('inventory.create_success'));
        setIsFormOpen(false);
        setEditingProduct(null);
        fetchProducts(); // Atualiza a lista na hora
      }
    };

    return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">{editingProduct ? t('inventory.edit_product') : t('inventory.new_product')}</h2>
        <button onClick={() => setIsFormOpen(false)} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col - Image & Basic */}
        <div className="space-y-6">
          <label className="border-2 border-dashed border-gray-300 rounded-xl h-48 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition-colors relative overflow-hidden">
            {uploading ? (
              <span className="text-sm animate-pulse">{t('inventory.uploading')}</span>
            ) : formData.imageUrl ? (
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <>
                <ImageIcon size={32} className="mb-2" />
                <span className="text-sm">{t('inventory.click_upload_image')}</span>
              </>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              disabled={uploading}
              className="hidden" 
            />
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_status')}</label>
            <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="active">{t('inventory.status_active')}</option>
              <option value="inactive">{t('inventory.status_inactive')}</option>
            </select>
          </div>
        </div>

        {/* Middle Col - Info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 border-b pb-2">{t('inventory.section_basic_info')}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_product_name')}</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder={t('inventory.form_product_name_placeholder')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_sku')}</label>
              <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder={t('inventory.form_sku_placeholder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_category')}</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="">{t('inventory.select_option')}</option>
                <option value="Eletr\u00F4nicos">{t('inventory.category_electronics')}</option>
                <option value="M\u00F3veis">{t('inventory.category_furniture')}</option>
                <option value="Acess\u00F3rios">{t('inventory.category_accessories')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_supplier')}</label>
            <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
              <option>{t('inventory.select_option')}</option>
              {MOCK_SUPPLIERS.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {/* Right Col - Numbers */}
        <div className="space-y-4">
           <h3 className="font-semibold text-gray-900 border-b pb-2">{t('inventory.section_pricing_stock')}</h3>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_cost_price')}</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs">{currencySymbol}</span>
                <input type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full border border-gray-300 rounded-lg pl-8 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_sale_price')}</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500 text-xs">{currencySymbol}</span>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border border-gray-300 rounded-lg pl-8 p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0.00" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_stock')}</label>
               <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
            </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_minimum')}</label>
               <input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder="5" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_unit')}</label>
               <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                 <option>UN</option>
                 <option>KG</option>
                 <option>LT</option>
               </select>
            </div>
          </div>
          
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('inventory.form_location')}</label>
              <input type="text" className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-blue-500 focus:border-blue-500" placeholder={t('inventory.form_location_placeholder')} />
            </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t pt-4">
        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          {t('common.cancel')}
        </button>
        <button onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
          <Save size={16} /> {editingProduct ? t('inventory.update_product') : t('inventory.save_product')}
        </button>
      </div>
    </div>
  )};

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => { setIsFormOpen(false); setEditingProduct(null); }}>{t('inventory.breadcrumb_products')}</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{t('inventory.breadcrumb_register')}</span>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('inventory.title')}</h1>
          <p className="text-gray-500 text-sm">{t('inventory.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <Download size={16} />
            {t('inventory.export_report')}
          </button>
          <button 
            onClick={() => { setEditingProduct(null); setIsFormOpen(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            {t('inventory.new_product_button')}
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
            <p className="text-gray-500 text-xs font-medium uppercase">{t('inventory.kpi_items_in_stock')}</p>
            <h3 className="text-xl font-bold text-gray-900">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">{t('inventory.kpi_sale_value')}</p>
            <h3 className="text-xl font-bold text-gray-900">{formatKz(totalStockValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">{t('inventory.kpi_cost_value')}</p>
            <h3 className="text-xl font-bold text-gray-900">{formatKz(totalCostValue)}</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase">{t('inventory.kpi_low_stock')}</p>
            <h3 className="text-xl font-bold text-gray-900">{t('inventory.kpi_low_stock_alerts', { count: lowStockCount })}</h3>
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
                {t('inventory.tab_products_list')}
              </button>
              <button 
                onClick={() => setActiveTab('movements')}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'movements' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {t('inventory.tab_movement_history')}
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
                  placeholder={t('inventory.search_placeholder')} 
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative">
                  <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm ${showFilters || categoryFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}
                  >
                    <Filter size={16} />
                    {t('inventory.filters')}
                    <ChevronDown size={14} />
                  </button>
                  {showFilters && (
                    <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 z-10 w-48">
                      <p className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">{t('inventory.filter_category')}</p>
                      {['all', 'Eletr\u00F4nicos', 'M\u00F3veis', 'Acess\u00F3rios', 'Perif\u00E9ricos'].map(cat => (
                        <button key={cat} onClick={() => { setCategoryFilter(cat); setShowFilters(false); }} className={`w-full text-left px-2 py-1.5 text-sm rounded-lg hover:bg-gray-50 ${categoryFilter === cat ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}>
                          {cat === 'all' ? t('inventory.filter_all') : getCategoryLabel(cat)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                  <tr>
                    <th className="px-6 py-4">{t('inventory.table_product')}</th>
                    <th className="px-6 py-4">{t('inventory.table_category_supplier')}</th>
                    <th className="px-6 py-4">{t('inventory.table_prices')}</th>
                    <th className="px-6 py-4">{t('inventory.table_margin')}</th>
                    <th className="px-6 py-4 text-center">{t('inventory.table_stock')}</th>
                    <th className="px-6 py-4 text-right">{t('inventory.table_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                              <Box size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{getCategoryLabel(product.category)}</span>
                          <span className="text-xs text-gray-500">{product.supplier}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{formatKz(product.price)}</span>
                          <span className="text-xs text-gray-500">{t('inventory.cost_label')}: {formatKz(product.costPrice)}</span>
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
                           <button onClick={() => { setEditingProduct(product); setIsFormOpen(true); }} className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" title={t('common.edit')}>
                             <Edit2 size={16} />
                           </button>
                           <button onClick={() => handleDelete(product.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title={t('common.delete')}>
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
                    <th className="px-6 py-4">{t('inventory.mov_table_datetime')}</th>
                    <th className="px-6 py-4">{t('inventory.mov_table_product')}</th>
                    <th className="px-6 py-4 text-center">{t('inventory.mov_table_type')}</th>
                    <th className="px-6 py-4 text-center">{t('inventory.mov_table_quantity')}</th>
                    <th className="px-6 py-4">{t('inventory.mov_table_user')}</th>
                    <th className="px-6 py-4">{t('inventory.mov_table_reason')}</th>
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
                          {move.type === 'IN' ? t('inventory.mov_type_in') : move.type === 'OUT' ? t('inventory.mov_type_out') : t('inventory.mov_type_adjustment')}
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

