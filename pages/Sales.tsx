import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Search, Filter, MoreVertical, FileText, Mail, 
  Trash2, ShoppingCart, Calendar, User, CreditCard,
  CheckCircle, Clock, XCircle, ArrowUpRight, TrendingUp,
  ChevronDown, X, Printer, Save
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Product, Sale, SaleItem, Customer } from '../types';
import { supabase } from '../supabaseClient';
import { confirmAction, notifyError, notifyInfo, notifySuccess, notifyWarning } from '../utils/feedback';
import { openPrintWindow } from '../utils/print';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/language';
import { useI18n } from '../utils/i18n';
import { useAuthorization } from '../utils/useAuthorization';

const formatKz = (value: number) => formatCurrency(value);

// Logotipo SVG Base64
const FERNAGEST_LOGO = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 80'%3E%3Cg transform='translate(10, 10)'%3E%3Cpath d='M30 2 C15 2 2 15 2 30 C2 45 15 58 30 58 C45 58 58 45 58 30 C58 15 45 2 30 2 Z' fill='none' stroke='%232563eb' stroke-width='2'/%3E%3Crect x='18' y='35' width='6' height='10' fill='%2316a34a' rx='1'/%3E%3Crect x='27' y='25' width='6' height='20' fill='%232563eb' rx='1'/%3E%3Crect x='36' y='15' width='6' height='30' fill='%2316a34a' rx='1'/%3E%3Cpath d='M10 40 Q 30 55 50 35' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3Ctext x='70' y='40' font-family='Arial, sans-serif' font-size='32' font-weight='bold'%3E%3Ctspan fill='%232563eb'%3EFerna%3C/tspan%3E%3Ctspan fill='%2316a34a'%3EGest%3C/tspan%3E%3C/text%3E%3Ctext x='72' y='58' font-family='Arial, sans-serif' font-size='9' letter-spacing='1.5' fill='%23555' font-weight='bold'%3EGESTÃƒO INTELIGENTE%3C/text%3E%3C/svg%3E";

const Sales = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useAuthorization();
  const canManageSales = can('sales.manage');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // New Sale State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [salesSearchTerm, setSalesSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [quickCustomer, setQuickCustomer] = useState({ name: '', company: '' });

  const ensureSalesManage = () => {
    if (canManageSales) return true;
    notifyWarning('Sem permissao para gerir vendas.');
    return false;
  };
  
  // Chart Data
  const chartData = [
    { name: t('sales.day_mon'), value: 125000 },
    { name: t('sales.day_tue'), value: 180000 },
    { name: t('sales.day_wed'), value: 150000 },
    { name: t('sales.day_thu'), value: 210000 },
    { name: t('sales.day_fri'), value: 190000 },
    { name: t('sales.day_sat'), value: 250000 },
    { name: t('sales.day_sun'), value: 110000 },
  ];

  // Carregar dados reais ao iniciar
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    // Buscar Vendas
    const { data: salesData } = await supabase.from('sales').select('*, sale_items(*)').order('created_at', { ascending: false });
    if (salesData) {
      // Mapear dados do banco (snake_case) para o frontend (camelCase)
      const mappedSales = salesData.map((s: any) => ({
        ...s,
        customerName: s.customer_name,
        paymentMethod: s.payment_method,
        customerId: s.customer_id,
        // Mapear itens para reimpressÃ£o
        items: s.sale_items?.map((i: any) => ({
          productId: i.product_id,
          productName: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total
        })) || []
      }));
      setSales(mappedSales);
    }

    // Buscar Produtos
    const { data: prodData, error: prodError } = await supabase.from('products').select('*');
    if (prodError) console.error(t('sales.error_fetch_products', { message: prodError.message }));
    if (prodData) {
      // Mapear cost_price para costPrice
      const mappedProducts = prodData.map((p: any) => ({ ...p, costPrice: p.cost_price, minStock: p.min_stock }));
      setProducts(mappedProducts);
    }

    // Buscar Clientes
    const { data: custData, error: custError } = await supabase.from('customers').select('*');
    if (custError) console.error(t('sales.error_fetch_customers', { message: custError.message }));
    if (custData) setCustomers(custData);
    setIsLoading(false);
  };

  const addToCart = (product: Product) => {
    if (!ensureSalesManage()) return;
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
    if (!ensureSalesManage()) return;
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    if (!ensureSalesManage()) return;
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  // Formata o ID visualmente para VEN-ANO-XXXX
  const formatSaleId = (sale: any) => {
    if (!sale.id) return 'VEN-????';
    // Se for UUID, pega os primeiros 4 caracteres. Se for mock, usa o ID direto.
    const suffix = sale.id.includes('-') ? sale.id.substring(0, 4).toUpperCase() : sale.id;
    const year = sale.date ? new Date(sale.date).getFullYear() : new Date().getFullYear();
    return `VEN-${year}-${suffix}`;
  };

  // LÃ³gica de Filtro da Tabela
  const filteredSales = sales.filter(sale => {
    const matchesSearch = 
      (sale.customerName?.toLowerCase() || '').includes(salesSearchTerm.toLowerCase()) ||
      formatSaleId(sale).toLowerCase().includes(salesSearchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;

    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && new Date(sale.date) >= new Date(dateRange.start);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Inclui o dia inteiro
      matchesDate = matchesDate && new Date(sale.date) <= endDate;
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  const printReceipt = (saleId: string, customerName: string, items: SaleItem[], total: number, method: string) => {
    const methodLabel =
      method === 'cash'
        ? t('sales.pay_cash')
        : method === 'pix'
        ? t('sales.pay_transfer_pix')
        : t('sales.pay_card');
    const logoUrl = FERNAGEST_LOGO;
    
    const html = `
      <html>
        <head>
          <title>${t('sales.receipt_pdf_title', { saleId })}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; margin: 0; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .info { margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .totals { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; text-align: right; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; }
            @media print { @page { margin: 0; } body { margin: 10px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 5px;" />
            <p style="margin:5px 0">${t('sales.receipt_title')}</p>
          </div>
          <div class="info">
            <p style="margin:2px 0"><strong>${t('sales.receipt_id')}:</strong> ${formatSaleId({id: saleId, date: new Date()})}</p>
            <p style="margin:2px 0"><strong>${t('sales.receipt_date')}:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin:2px 0"><strong>${t('sales.receipt_customer')}:</strong> ${customerName}</p>
          </div>
          <div style="border-bottom: 1px dashed #000; margin-bottom: 10px;"></div>
          ${items.map(item => `
            <div class="item">
              <span>${item.quantity} x ${item.productName}</span>
              <span>${formatKz(item.total)}</span>
            </div>
          `).join('')}
          <div class="totals">
            <p style="margin:2px 0"><strong>${t('sales.receipt_total')}: ${formatKz(total)}</strong></p>
            <p style="margin:2px 0; font-size: 10px;">${t('sales.receipt_payment')}: ${methodLabel}</p>
          </div>
          <div class="footer">
            <p>${t('sales.receipt_thanks')}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 350, height: 600 });
    if (!opened) notifyWarning(t('sales.popup_blocked'));
  };

  const printQuote = () => {
    if (cart.length === 0) {
      notifyWarning(t('sales.quote_requires_items'));
      return;
    }

    const customerName = customers.find(c => c.id === selectedCustomer)?.name || t('sales.customer_anonymous');
    const total = cartTotal * 1.14;
    const logoUrl = FERNAGEST_LOGO;

    const html = `
      <html>
        <head>
          <title>${t('sales.quote_pdf_title')}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #2563eb; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
            .meta div { flex: 1; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; border-bottom: 2px solid #eee; padding: 10px; color: #666; font-size: 12px; text-transform: uppercase; }
            td { border-bottom: 1px solid #eee; padding: 10px; font-size: 14px; }
            .totals { width: 300px; margin-left: auto; }
            .totals .row { display: flex; justify-content: space-between; padding: 5px 0; }
            .totals .total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUrl}" style="max-height: 60px; margin-bottom: 10px;" />
            <h2 style="margin-bottom: 5px; color: #333;">${t('sales.quote_title')}</h2>
          </div>
          
          <div class="meta">
            <div>
              <strong>${t('sales.quote_client')}:</strong><br>
              ${customerName}<br>
              ${formatDate(new Date())}
            </div>
            <div style="text-align: right;">
              <strong>${t('sales.quote_validity')}:</strong><br>
              ${t('sales.quote_validity_days')}<br>
              <strong>${t('sales.quote_status')}:</strong> ${t('sales.quote_status_pending')}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>${t('sales.quote_table_product')}</th>
                <th>${t('sales.quote_table_qty')}</th>
                <th>${t('sales.quote_table_unit_price')}</th>
                <th>${t('sales.quote_table_total')}</th>
              </tr>
            </thead>
            <tbody>
              ${cart.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td>${item.quantity}</td>
                  <td>${formatKz(item.unitPrice)}</td>
                  <td>${formatKz(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>${t('sales.quote_subtotal')}:</span>
              <span>${formatKz(cartTotal)}</span>
            </div>
            <div class="row">
              <span>${t('sales.quote_taxes')}:</span>
              <span>${formatKz(cartTotal * 0.14)}</span>
            </div>
            <div class="row total">
              <span>${t('sales.quote_table_total')}:</span>
              <span>${formatKz(total)}</span>
            </div>
          </div>

          <div class="footer">
            <p>${t('sales.quote_footer_no_fiscal')}</p>
            <p>${t('sales.receipt_thanks')}</p>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;
    const opened = openPrintWindow(html, { width: 800, height: 600 });
    if (!opened) notifyWarning(t('sales.popup_blocked'));
  };

  const handleNewCustomer = async () => {
    if (!ensureSalesManage()) return;
    const name = quickCustomer.name.trim();
    const company = quickCustomer.company.trim();
    if (!name) {
      notifyWarning(t('sales.new_customer_required_name'));
      return;
    }

    const { data, error } = await supabase.from('customers').insert({
      name,
      company,
      status: 'active'
    }).select().single();

    if (error) {
      notifyError(t('sales.new_customer_error', { message: error.message }));
    } else if (data) {
      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setQuickCustomer({ name: '', company: '' });
      setIsQuickCustomerOpen(false);
      notifySuccess(t('sales.new_customer_success'));
    }
  };

  const handleFinishSale = async () => {
    if (!ensureSalesManage()) return;
    if (!selectedCustomer || cart.length === 0) {
      notifyWarning(t('sales.finish_requirements'));
      return;
    }

    setIsSaving(true);
    try {
      const customerName = customers.find(c => c.id === selectedCustomer)?.name || t('sales.customer_anonymous');

      // Prepara os itens do carrinho para a funÃ§Ã£o do banco de dados
      const cartForRpc = cart.map(item => ({
        product_id: item.productId,
        product_name: item.productName, // Garante que o nome seja salvo no histÃ³rico
        quantity: item.quantity,
        unit_price: item.unitPrice
      }));

      // Chama a funÃ§Ã£o 'handle_new_sale' no Supabase
      const { data: newSaleId, error } = await supabase.rpc('handle_new_sale', {
        p_customer_id: selectedCustomer,
        p_customer_name: customerName,
        p_payment_method: paymentMethod,
        p_cart_items: cartForRpc
      });

      if (error) throw error;

      const shouldPrint = await confirmAction({
        title: t('sales.finish_confirm_title'),
        message: t('sales.finish_confirm_message'),
        confirmLabel: t('sales.finish_confirm_print'),
        cancelLabel: t('sales.finish_confirm_not_now')
      });

      notifySuccess(t('sales.finish_success'));

      if (shouldPrint) {
        printReceipt(newSaleId, customerName, cart, cartTotal * 1.14, paymentMethod);
      }
      setIsCreating(false);
      setCart([]);
      setSelectedCustomer('');
      fetchData(); // Atualiza a lista de vendas e o estoque dos produtos
    } catch (error: any) {
      notifyError(t('sales.finish_error', { message: error.message }));
    } finally {
      setIsSaving(false);
    }
  };

  if (isCreating) {
    return (
      <div className="h-[calc(100vh-100px)] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('sales.new_sale_page')}</h1>
            <p className="text-gray-500 text-sm">{t('sales.create_subtitle')}</p>
          </div>
          <button 
            onClick={() => setIsCreating(false)}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
          >
            <X size={18} /> {t('common.cancel')}
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
                  placeholder={t('sales.search_products_placeholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex justify-center items-center h-full text-gray-400">
                  <p>{t('sales.loading_products')}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col justify-center items-center h-full text-gray-400 text-center p-4">
                  <ShoppingCart size={48} className="mb-2 opacity-50" />
                  <p className="font-medium text-gray-600">{t('sales.empty_products_title')}</p>
                  <p className="text-sm mt-1">{t('sales.empty_products_description')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {products
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
              )}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {/* Customer Select */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <label className="block text-xs font-medium text-gray-500 uppercase mb-2">{t('sales.customer_label')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select 
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">{t('sales.select_customer')}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!ensureSalesManage()) return;
                  setIsQuickCustomerOpen((prev) => !prev);
                }}
                className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('sales.new_customer_quick')}
              </button>
              {isQuickCustomerOpen && (
                <div className="mt-3 bg-white border border-blue-100 rounded-lg p-3 space-y-2">
                  <input
                    type="text"
                    value={quickCustomer.name}
                    onChange={(e) => setQuickCustomer({ ...quickCustomer, name: e.target.value })}
                    placeholder={t('sales.new_customer_name_placeholder')}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={quickCustomer.company}
                    onChange={(e) => setQuickCustomer({ ...quickCustomer, company: e.target.value })}
                    placeholder={t('sales.new_customer_company_placeholder')}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsQuickCustomerOpen(false);
                        setQuickCustomer({ name: '', company: '' });
                      }}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleNewCustomer}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {t('sales.save_customer')}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ShoppingCart size={48} className="mb-2 opacity-50" />
                  <p className="text-sm">{t('sales.empty_cart')}</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-800 line-clamp-1">{item.productName}</h4>
                      <p className="text-xs text-gray-500">{formatKz(item.unitPrice)} {t('sales.unit_short')}</p>
                    </div>
                    <div className="flex items-center gap-3 mx-3">
                      <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">-</button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100">+</button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatKz(item.total)}</p>
                      <button onClick={() => removeFromCart(item.productId)} className="text-xs text-red-500 hover:underline">{t('sales.remove')}</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totals & Payment */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('sales.quote_subtotal')}</span>
                  <span>{formatKz(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('sales.quote_taxes')}</span>
                  <span>{formatKz(cartTotal * 0.14)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                  <span>{t('sales.table_total')}</span>
                  <span>{formatKz(cartTotal * 1.14)}</span>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 uppercase mb-2">{t('sales.payment_method')}</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`border py-2 rounded text-xs font-medium ${paymentMethod === 'credit_card' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t('sales.pay_card')}
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('cash')}
                    className={`border py-2 rounded text-xs font-medium ${paymentMethod === 'cash' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t('sales.pay_cash')}
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('pix')}
                    className={`border py-2 rounded text-xs font-medium ${paymentMethod === 'pix' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}
                  >
                    {t('sales.pay_transfer_pix')}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={printQuote}
                  className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg text-sm font-bold hover:bg-gray-50"
                >
                  <Printer size={18} /> {t('sales.quote_button')}
                </button>
                <button 
                  disabled={cart.length === 0 || !selectedCustomer || isSaving || !canManageSales}
                  onClick={handleFinishSale}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-200 transition-all"
                >
                  {isSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      {t('sales.saving')}
                    </span>
                  ) : (
                    <><Save size={18} /> {t('sales.finish_sale')}</>
                  )}
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
          <h1 className="text-2xl font-bold text-gray-900">{t('sales.title')}</h1>
          <p className="text-gray-500 text-sm">{t('sales.subtitle')}</p>
        </div>
        <button 
          onClick={() => {
            if (!ensureSalesManage()) return;
            setIsCreating(true);
          }}
          disabled={!canManageSales}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
          {t('sales.new_sale')}
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
          <p className="text-gray-500 text-xs font-medium uppercase">{t('sales.kpi_sales_today')}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(245000)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <FileText size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">{t('sales.kpi_open_orders')}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">8</h3>
          <p className="text-xs text-gray-400 mt-1">{t('sales.kpi_open_orders_subtitle')}</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CreditCard size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">{t('sales.kpi_avg_ticket')}</p>
          <h3 className="text-xl font-bold text-gray-900 mt-1">{formatKz(45000)}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
           <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <User size={20} />
            </div>
          </div>
          <p className="text-gray-500 text-xs font-medium uppercase">{t('sales.kpi_top_seller')}</p>
          <h3 className="text-lg font-bold text-gray-900 mt-1 truncate">Ana Silva</h3>
          <p className="text-xs text-gray-400 mt-1">{t('sales.kpi_top_seller_subtitle')}</p>
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
                value={salesSearchTerm}
                onChange={(e) => setSalesSearchTerm(e.target.value)}
                placeholder={t('sales.search_sales_placeholder')}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative">
                <button 
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm ${showDatePicker || (dateRange.start || dateRange.end) ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}
                >
                  <Calendar size={16} />
                  <span className="hidden sm:inline">
                    {dateRange.start ? `${formatDate(new Date(dateRange.start))}...` : t('sales.filter_period')}
                  </span>
                  <ChevronDown size={14} />
                </button>
                
                {showDatePicker && (
                  <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-10 w-64">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('sales.filter_start_date')}</label>
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t('sales.filter_end_date')}</label>
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button onClick={() => { setDateRange({ start: '', end: '' }); setShowDatePicker(false); }} className="text-xs text-gray-500 hover:text-gray-700">
                          {t('sales.filter_clear')}
                        </button>
                        <button onClick={() => setShowDatePicker(false)} className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-700">
                          {t('sales.filter_apply')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setStatusFilter(prev => prev === 'all' ? 'completed' : prev === 'completed' ? 'pending' : 'all')}
                className={`px-3 py-2 border rounded-lg flex items-center gap-2 text-sm ${statusFilter !== 'all' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'}`}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">
                  {statusFilter === 'all' ? t('common.all') : statusFilter === 'completed' ? t('sales.filter_paid') : t('sales.filter_pending')}
                </span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
                <tr>
                  <th className="px-6 py-4">{t('sales.table_sale')}</th>
                  <th className="px-6 py-4">{t('sales.table_customer')}</th>
                  <th className="px-6 py-4 hidden md:table-cell">{t('sales.table_date')}</th>
                  <th className="px-6 py-4">{t('sales.table_total')}</th>
                  <th className="px-6 py-4 text-center">{t('sales.table_status')}</th>
                  <th className="px-6 py-4 text-right">{t('sales.table_actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-900">{formatSaleId(sale)}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{sale.customerName}</span>
                        <span className="text-xs text-gray-400">
                          {sale.paymentMethod === 'credit_card'
                            ? t('sales.payment_credit_card')
                            : sale.paymentMethod === 'boleto'
                            ? t('sales.payment_boleto')
                            : sale.paymentMethod === 'cash'
                            ? t('sales.pay_cash')
                            : t('sales.payment_pix')}
                        </span>
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
                        {sale.status === 'completed' ? t('sales.status_paid') : sale.status === 'pending' ? t('sales.status_pending') : t('sales.status_cancelled')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => printReceipt(sale.id, sale.customerName, sale.items || [], sale.total, sale.paymentMethod)}
                          className="p-1.5 hover:bg-gray-100 text-gray-600 rounded" 
                          title={t('sales.print_receipt')}
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => notifyInfo(t('sales.send_email_simulation', { customer: sale.customerName }))}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded" 
                          title={t('sales.send_email')}
                        >
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
              {t('sales.weekly_trend')}
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
                    formatter={(val: number) => [formatKz(val), t('sales.tooltip_sales')]}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-4">{t('sales.top_products')}</h3>
            <div className="space-y-3">
              {products.slice(0, 4).map((product, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-500">{t('sales.stock_count', { count: product.stock })}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{t('sales.sold_units', { count: 124 })}</span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => navigate('/inventory')}
              className="w-full mt-4 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('sales.view_full_report')}
            </button>
          </div>

          {/* Alerts */}
          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
            <h3 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
              <Clock size={16} />
              {t('sales.pending_payments_title')}
            </h3>
            <p className="text-xs text-red-600 mb-3">{t('sales.pending_payments_message')}</p>
            <button 
              onClick={() => navigate('/finance', { state: { defaultTab: 'receivable' } })}
              className="bg-white text-red-600 text-xs px-3 py-1.5 rounded border border-red-200 font-medium hover:bg-red-50"
            >
              {t('sales.check_now')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Sales;

