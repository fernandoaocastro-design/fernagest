import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Filter, Eye, Download, Mail, Trash2, 
  ShoppingCart, Calendar, User, CheckCircle, XCircle, 
  ChevronDown, X, Save, Truck, FileText, AlertCircle,
  Printer, TrendingUp, Package, DollarSign, AlertTriangle, PackageCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { supabase } from '../supabaseClient';
import { PurchaseOrder, Supplier, Product } from '../types';
import { MOCK_PURCHASES, MOCK_SUPPLIERS, MOCK_PRODUCTS } from '../constants';
import { confirmAction, notifyError, notifyInfo, notifySuccess, notifyWarning } from '../utils/feedback';
import { openPrintWindow } from '../utils/print';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/language';
import { useI18n } from '../utils/i18n';
import { useAuthorization } from '../utils/useAuthorization';

const formatKz = (value: number) => formatCurrency(value);

// Logotipo SVG Base64
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTÃƒO INTELIGENTE%3C/text%3E%3C/svg%3E";

// --- COMPONENTES AUXILIARES ---

const PurchaseModal = ({ isOpen, onClose, onSave, suppliers, products }: any) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    supplierId: '',
    date: new Date().toISOString().split('T')[0],
    expectedDate: '',
    status: 'PENDING',
    items: [] as any[]
  });

  if (!isOpen) return null;

  const handleProductClick = (product: any) => {
    const existingItemIndex = formData.items.findIndex((item: any) => item.productId === product.id);

    if (existingItemIndex >= 0) {
      // Incrementa quantidade se jÃ¡ existe
      const newItems = [...formData.items];
      newItems[existingItemIndex].quantity += 1;
      newItems[existingItemIndex].total = newItems[existingItemIndex].quantity * newItems[existingItemIndex].unitCost;
      setFormData({ ...formData, items: newItems });
    } else {
      // Adiciona novo item
      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitCost: product.costPrice || 0,
        total: product.costPrice || 0
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...formData.items];
    const newQty = newItems[index].quantity + delta;
    if (newQty < 1) return;
    
    newItems[index].quantity = newQty;
    newItems[index].total = newQty * newItems[index].unitCost;
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const total = formData.items.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[85vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{t('purchases.new_order_title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left: Catalog & Info */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-gray-100">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('purchases.supplier')}</label>
                  <select 
                    value={formData.supplierId} 
                    onChange={e => setFormData({...formData, supplierId: e.target.value})} 
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">{t('purchases.select_supplier_placeholder')}</option>
                    {suppliers.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('purchases.order_date')}</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{t('purchases.expected_delivery')}</label>
                  <input type="date" value={formData.expectedDate} onChange={e => setFormData({...formData, expectedDate: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                </div>
             </div>

             <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
               <Package size={16} className="text-blue-600"/> {t('purchases.products_catalog')}
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
               {products.map((p: any) => (
                 <button 
                   key={p.id} 
                   onClick={() => handleProductClick(p)}
                   className="flex flex-col items-center p-3 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center group bg-white"
                 >
                   <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2 text-gray-400 group-hover:bg-white group-hover:text-blue-600 transition-colors">
                     <Package size={20} />
                   </div>
                   <span className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">{p.name}</span>
                   <span className="text-[10px] text-gray-500 mt-1 font-mono">{formatKz(p.costPrice || 0)}</span>
                 </button>
               ))}
             </div>
          </div>

          {/* Right: Summary */}
          <div className="w-full md:w-96 bg-gray-50 flex flex-col border-l border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-600"/> {t('purchases.order_summary')}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {formData.items.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    <ShoppingCart size={32} className="mx-auto mb-2 opacity-20" />
                    {t('purchases.empty_order_items')}
                  </div>
                ) : (
                 formData.items.map((item, idx) => (
                   <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex flex-col gap-2">
                     <div className="flex justify-between items-start">
                       <span className="text-sm font-medium text-gray-900 line-clamp-2">{item.productName}</span>
                       <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 transition-colors">
                         <X size={14} />
                       </button>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-500">{formatKz(item.unitCost)} {t('purchases.unit_short')}</div>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                         <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 font-bold">-</button>
                         <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-blue-600 font-bold">+</button>
                       </div>
                     </div>
                     <div className="text-right text-sm font-bold text-blue-600 border-t border-gray-50 pt-1 mt-1">
                       {formatKz(item.total)}
                     </div>
                   </div>
                 ))
               )}
             </div>

             <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-600">{t('purchases.estimated_total')}</span>
                  <span className="text-xl font-bold text-gray-900">{formatKz(total)}</span>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                    {t('common.cancel')}
                  </button>
                  <button onClick={() => onSave(formData)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 shadow-sm">
                    <Save size={16} /> {t('common.save')}
                  </button>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

const Purchases = () => {
  const { t } = useI18n();
  const { can } = useAuthorization();
  const canManagePurchases = can('purchases.manage');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders'>('dashboard');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(MOCK_PURCHASES);
  const [suppliers, setSuppliers] = useState<Supplier[]>(MOCK_SUPPLIERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);

  const ensurePurchasesManage = () => {
    if (canManagePurchases) return true;
    notifyWarning('Sem permissao para gerir compras.');
    return false;
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getPurchaseStatusLabel = (status: string) => {
    if (status === 'RECEIVED') return t('purchases.status_received');
    if (status === 'PENDING') return t('purchases.status_pending');
    return status;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Buscar Compras (Mock ou Supabase)
    const { data: purchaseData } = await supabase.from('purchases').select('*, purchase_items(*)').order('created_at', { ascending: false });
    if (purchaseData && purchaseData.length > 0) {
      const mapped = purchaseData.map((p: any) => ({
        ...p,
        supplierName: p.supplier_name,
        expectedDate: p.expected_date,
        items: p.purchase_items?.map((i: any) => ({
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitCost: i.unit_cost,
          total: i.total
        })) || []
      }));
      // Prefer real data when available. Fallback to mocks only if there is no data.
      setPurchases(mapped);
    } else {
      setPurchases(MOCK_PURCHASES);
    }

    // Buscar Fornecedores
    const { data: supplierData } = await supabase.from('suppliers').select('*');
    if (supplierData && supplierData.length > 0) setSuppliers(supplierData);
    else setSuppliers(MOCK_SUPPLIERS);

    // Buscar Produtos
    const { data: productData } = await supabase.from('products').select('*');
    if (productData && productData.length > 0) {
      const mappedProducts = productData.map((p: any) => ({ ...p, costPrice: p.cost_price }));
      setProducts(mappedProducts);
    } else {
      setProducts(MOCK_PRODUCTS);
    }
    
    setIsLoading(false);
  };

  const handleSave = async (formData: any) => {
    if (!ensurePurchasesManage()) return;
    if (!formData.supplierId || formData.items.length === 0) {
      notifyWarning(t('purchases.required_supplier_item'));
      return;
    }

    const supplierName = suppliers.find(s => s.id === formData.supplierId)?.name || t('purchases.unknown_supplier');
    const total = formData.items.reduce((acc: number, item: any) => acc + item.total, 0);

    // 1. AtualizaÃ§Ã£o Otimista (UI) - Atualiza a tela imediatamente
    const newPurchase: PurchaseOrder = {
      id: `PED-${Date.now()}`, // ID temporÃ¡rio para visualizaÃ§Ã£o
      supplierId: formData.supplierId,
      supplierName: supplierName,
      date: formData.date,
      expectedDate: formData.expectedDate,
      status: formData.status,
      total: total,
      items: formData.items
    };
    
    setPurchases([newPurchase, ...purchases]);
    notifySuccess(t('purchases.save_success'));
    setIsFormOpen(false);

    // 2. Tentar salvar no Supabase (Background)
    try {
      const { data: purchase, error: purchaseError } = await supabase.from('purchases').insert({
        supplier_id: formData.supplierId,
        supplier_name: supplierName,
        date: formData.date,
        expected_date: formData.expectedDate,
        status: formData.status,
        total: total
      }).select().single();

      if (purchaseError) throw purchaseError;

      if (purchase) {
        const itemsToInsert = formData.items.map((item: any) => ({
          purchase_id: purchase.id,
          product_id: item.productId,
          product_name: item.productName,
          quantity: item.quantity,
          unit_cost: item.unitCost,
          total: item.total
        }));

        const { error: itemsError } = await supabase.from('purchase_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
        
        // Se salvou com sucesso no banco, recarrega para pegar o ID real
        fetchData(); 
      }
    } catch (error: any) {
      console.error(t('purchases.error_save_background', { message: error.message }));
      // NÃ£o exibimos alert de erro aqui para nÃ£o confundir o usuÃ¡rio, jÃ¡ que a UI atualizou.
    }
  };

  const printGeneralReport = () => {
    if (!ensurePurchasesManage()) return;
    const logoUrl = FERNAGEST_LOGO;
    const date = formatDate(new Date());

    const html = `
      <html>
        <head>
          <title>${t('purchases.general_report_title')}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
            td { padding: 8px; border-bottom: 1px solid #eee; }
            .total { text-align: right; font-weight: bold; margin-top: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />
            <h2>${t('purchases.general_report_title')}</h2>
            <p>${t('purchases.generated_at')}: ${date}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>${t('purchases.supplier')}</th>
                <th>${t('purchases.date')}</th>
                <th>${t('purchases.status')}</th>
                <th style="text-align: right;">${t('purchases.value')}</th>
              </tr>
            </thead>
            <tbody>
              ${purchases.map(p => `
                <tr>
                  <td>#${p.id.slice(0,8)}</td>
                  <td>${p.supplierName}</td>
                  <td>${formatDate(new Date(p.date))}</td>
                  <td>${getPurchaseStatusLabel(p.status)}</td>
                  <td style="text-align: right;">${formatKz(p.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">${t('purchases.total_spent')}: ${formatKz(purchases.reduce((acc, p) => acc + p.total, 0))}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 900, height: 600 });
    if (!opened) notifyWarning(t('purchases.popup_blocked'));
  };

  const generatePDF = (purchase: PurchaseOrder) => {
    if (!ensurePurchasesManage()) return;
    const logoUrl = FERNAGEST_LOGO;

    const html = `
      <html>
        <head>
          <title>${t('purchases.order_pdf_title', { id: purchase.id.slice(0, 8) })}</title>
          <style>
            body { font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 10px; background: #f9fafb; }
            td { border-bottom: 1px solid #eee; padding: 10px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />
            <h2 style="margin:0">${t('purchases.order_document')}</h2>
            <p>#${purchase.id}</p>
          </div>
          
          <div class="meta">
            <div>
              <strong>${t('purchases.supplier')}:</strong><br>
              ${purchase.supplierName}<br>
              ${t('purchases.date')}: ${formatDate(new Date(purchase.date))}
            </div>
            <div style="text-align: right;">
              <strong>${t('purchases.status')}:</strong> ${getPurchaseStatusLabel(purchase.status)}<br>
              <strong>${t('purchases.forecast')}:</strong> ${purchase.expectedDate ? formatDate(new Date(purchase.expectedDate)) : '-'}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${t('purchases.product')}</th>
                <th style="text-align: center;">${t('purchases.qty')}</th>
                <th style="text-align: right;">${t('purchases.unit_cost')}</th>
                <th style="text-align: right;">${t('purchases.total')}</th>
              </tr>
            </thead>
            <tbody>
              ${purchase.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatKz(item.unitCost)}</td>
                  <td style="text-align: right;">${formatKz(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total">
            ${t('purchases.order_total')}: ${formatKz(purchase.total)}
          </div>

          <div class="footer">
            <p>${t('purchases.document_generated_footer')}</p>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 800, height: 600 });
    if (!opened) notifyWarning(t('purchases.popup_blocked'));
  };

  const handleSendEmail = (purchase: PurchaseOrder) => {
    if (!ensurePurchasesManage()) return;
    notifyInfo(
      t('purchases.email_simulation', { supplier: purchase.supplierName, id: purchase.id.slice(0, 8) })
    );
  };

  const handleReceiveOrder = async (purchase: PurchaseOrder) => {
    if (!ensurePurchasesManage()) return;
    if (purchase.status !== 'PENDING') return;

    const confirmed = await confirmAction({
      title: t('purchases.receive_order_title'),
      message: t('purchases.receive_order_message', { id: purchase.id.slice(0, 8) }),
      confirmLabel: t('purchases.confirm'),
      cancelLabel: t('common.cancel')
    });
    if (!confirmed) return;

    const isMock = purchase.id.startsWith('PED-');

    if (isMock) {
        // AtualizaÃ§Ã£o local para mocks
        setPurchases(prev => prev.map(p => p.id === purchase.id ? { ...p, status: 'RECEIVED' } : p));
        
        // Atualiza estoque localmente (apenas visual)
        setProducts(prev => prev.map(p => {
            const item = purchase.items.find(i => i.productId === p.id);
            return item ? { ...p, stock: p.stock + item.quantity } : p;
        }));
        
        notifySuccess(t('purchases.receive_mock_success'));
        return;
    }

    try {
        // 1. Atualizar status do pedido
        const { error: updateError } = await supabase
          .from('purchases')
          .update({ status: 'RECEIVED' })
          .eq('id', purchase.id);

        if (updateError) throw updateError;

        // 2. Atualizar estoque dos produtos
        for (const item of purchase.items) {
            const { data: product } = await supabase.from('products').select('stock').eq('id', item.productId).single();
            if (product) {
               await supabase.from('products').update({ stock: product.stock + Number(item.quantity) }).eq('id', item.productId);
            }
        }

        notifySuccess(t('purchases.receive_success'));
        fetchData();
    } catch (error: any) {
        console.error(t('purchases.error_receiving_order_log'), error);
        notifyError(t('purchases.error_receiving_order', { message: error.message }));
    }
  };

  // CÃ¡lculos para Dashboard
  const totalOrders = purchases.length;
  const pendingOrders = purchases.filter(p => p.status === 'PENDING').length;
  const receivedOrders = purchases.filter(p => p.status === 'RECEIVED').length;
  const totalSpent = purchases.reduce((acc, p) => acc + p.total, 0);

  // Dados para GrÃ¡fico: Gastos por MÃªs
  const expensesByMonth = purchases.reduce((acc: any[], p) => {
    const date = new Date(p.date);
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    const existing = acc.find(item => item.name === month);
    if (existing) {
      existing.value += p.total;
    } else {
      acc.push({ name: month, value: p.total, sortIndex: date.getMonth() });
    }
    return acc;
  }, []).sort((a, b) => a.sortIndex - b.sortIndex);

  // Top Fornecedores
  const topSuppliers = purchases.reduce((acc: any[], p) => {
    const existing = acc.find(item => item.name === p.supplierName);
    if (existing) {
      existing.value += p.total;
      existing.count += 1;
    } else {
      acc.push({ name: p.supplierName, value: p.total, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value).slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('purchases.title')}</h1>
          <p className="text-gray-500 text-sm">{t('purchases.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={printGeneralReport}
            disabled={!canManagePurchases}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer size={16} /> {t('purchases.general_report')}
          </button>
          <button 
            onClick={() => {
              if (!ensurePurchasesManage()) return;
              setIsFormOpen(true);
            }}
            disabled={!canManagePurchases}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={18} /> {t('purchases.new_purchase')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('purchases.tab_dashboard')}
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('purchases.tab_orders')}
        </button>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><ShoppingCart size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">{t('purchases.kpi_total_orders')}</p>
                <h3 className="text-xl font-bold text-gray-900">{totalOrders}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Truck size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">{t('purchases.kpi_pending')}</p>
                <h3 className="text-xl font-bold text-gray-900">{pendingOrders}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">{t('purchases.kpi_received')}</p>
                <h3 className="text-xl font-bold text-gray-900">{receivedOrders}</h3>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg"><DollarSign size={24} /></div>
              <div>
                <p className="text-gray-500 text-xs font-medium uppercase">{t('purchases.kpi_total_spent')}</p>
                <h3 className="text-xl font-bold text-gray-900">{formatKz(totalSpent)}</h3>
              </div>
            </div>
          </div>

          {/* Charts & Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" /> {t('purchases.expenses_by_month')}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expensesByMonth}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      formatter={(val: number) => formatKz(val)}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Side Panels */}
            <div className="space-y-6">
              {/* Top Suppliers */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm mb-4">{t('purchases.top_suppliers')}</h3>
                <div className="space-y-3">
                  {topSuppliers.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1">{s.name}</span>
                      <span className="font-bold text-gray-900">{formatKz(s.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-500" /> {t('purchases.alerts')}
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-100">
                    <strong>{t('purchases.alert_overdue_title')}</strong> {t('purchases.alert_overdue_message')}
                  </div>
                  <div className="p-3 bg-yellow-50 text-yellow-700 rounded-lg text-xs border border-yellow-100">
                    <strong>{t('purchases.alert_critical_stock_title')}</strong> {t('purchases.alert_critical_stock_message')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* List */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('purchases.supplier')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('purchases.items')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('purchases.date')}</th>
                  <th className="px-4 py-3 whitespace-nowrap">{t('purchases.total')}</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">{t('purchases.status')}</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">{t('purchases.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">#{purchase.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{purchase.supplierName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={purchase.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}>
                      {purchase.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ') || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(new Date(purchase.date))}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap">{formatKz(purchase.total)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        purchase.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                        purchase.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getPurchaseStatusLabel(purchase.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        {purchase.status === 'PENDING' && (
                          <button
                            onClick={() => handleReceiveOrder(purchase)}
                            disabled={!canManagePurchases}
                            className="p-1.5 hover:bg-green-50 text-green-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('purchases.receive_order_action')}
                          >
                            <PackageCheck size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => generatePDF(purchase)}
                          disabled={!canManagePurchases}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('purchases.view_download_pdf')}
                        >
                          <FileText size={16} />
                        </button>
                        <button
                          onClick={() => handleSendEmail(purchase)}
                          disabled={!canManagePurchases}
                          className="p-1.5 hover:bg-purple-50 text-purple-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('purchases.send_by_email')}
                        >
                          <Mail size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-400">{t('purchases.no_purchases')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isFormOpen && (
        <PurchaseModal 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSave={handleSave}
          suppliers={suppliers}
          products={products}
        />
      )}
    </div>
  );
};

export default Purchases;

