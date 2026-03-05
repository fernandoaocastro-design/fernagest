import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Wallet,
  ShoppingBag,
  CreditCard,
  Gift,
  TrendingDown,
  CheckCircle,
  Clock,
  FileText,
  Plus,
  ShoppingCart
} from 'lucide-react';
import { MOCK_FINANCIAL_DATA, MOCK_ACTIVITY, KPIS, MOCK_TOP_PRODUCTS, MOCK_ORIGIN, MOCK_BIRTHDAYS } from '../constants';
import {
  APP_THEME_STORAGE_KEY,
  APP_THEME_UPDATED_EVENT,
  AppTheme,
  normalizeTheme,
  readStoredTheme
} from '../utils/theme';
import { formatCurrency } from '../utils/currency';
import { useI18n } from '../utils/i18n';

const HR_STORAGE_KEY = 'fernagest:hr:data:v2';

interface HrEmployee {
  id: string;
  fullName: string;
  admissionDate: string;
  status: string;
}

interface HrVacation {
  employeeId: string;
  startDate: string;
}

interface HrStorageData {
  employees: HrEmployee[];
  vacations: HrVacation[];
}

const formatKz = (value: number) => formatCurrency(value);

const readHrData = (): HrStorageData => {
  if (typeof window === 'undefined') return { employees: [], vacations: [] };
  try {
    const raw = window.localStorage.getItem(HR_STORAGE_KEY);
    if (!raw) return { employees: [], vacations: [] };
    const parsed = JSON.parse(raw);
    return {
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      vacations: Array.isArray(parsed.vacations) ? parsed.vacations : []
    };
  } catch {
    return { employees: [], vacations: [] };
  }
};

const yearsSince = (isoDate: string) => {
  if (!isoDate) return 0;
  const start = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const anniversaryNotReached =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (anniversaryNotReached) years -= 1;
  return years < 0 ? 0 : years;
};

const isAnniversaryToday = (isoDate: string) => {
  if (!isoDate) return false;
  const start = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  return start.getMonth() === now.getMonth() && start.getDate() === now.getDate();
};

const KPICard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }: any) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-green-50 text-green-600 border-green-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    teal: 'bg-teal-50 text-teal-600 border-teal-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
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
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(readStoredTheme());
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const hrData = useMemo(() => readHrData(), []);
  const isDark = theme === 'dark';
  const chartGridColor = isDark ? '#334155' : '#f1f5f9';
  const chartTickColor = isDark ? '#94a3b8' : '#64748b';
  const chartTooltipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: '8px',
    color: isDark ? '#f8fafc' : '#111827'
  };
  const chartTooltipTextStyle = {
    color: isDark ? '#e2e8f0' : '#111827'
  };

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== APP_THEME_STORAGE_KEY) return;
      setTheme(normalizeTheme(event.newValue));
    };

    const handleThemeUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<AppTheme>;
      setTheme(normalizeTheme(customEvent.detail));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(APP_THEME_UPDATED_EVENT, handleThemeUpdated as EventListener);
    };
  }, []);

  const hrEmployees = useMemo(
    () => hrData.employees.filter((employee) => employee.status !== 'DEMITIDO'),
    [hrData.employees]
  );

  const overdueVacationEmployees = useMemo(() => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    return hrEmployees.filter((employee) => {
      if (yearsSince(employee.admissionDate) < 1) return false;
      const recentVacation = hrData.vacations.some((vacation) => {
        if (vacation.employeeId !== employee.id) return false;
        const start = new Date(`${vacation.startDate}T00:00:00`);
        return start >= oneYearAgo;
      });
      return !recentVacation;
    });
  }, [hrEmployees, hrData.vacations]);

  const oneYearAlerts = useMemo(
    () => hrEmployees.filter((employee) => yearsSince(employee.admissionDate) === 1 && isAnniversaryToday(employee.admissionDate)),
    [hrEmployees]
  );

  const jubileeAlerts = useMemo(
    () => hrEmployees.filter((employee) => yearsSince(employee.admissionDate) > 1 && isAnniversaryToday(employee.admissionDate)),
    [hrEmployees]
  );

  const tenureChartData = useMemo(() => {
    const lt1 = hrEmployees.filter((employee) => yearsSince(employee.admissionDate) < 1).length;
    const between = hrEmployees.filter((employee) => {
      const years = yearsSince(employee.admissionDate);
      return years >= 1 && years <= 3;
    }).length;
    const gt3 = hrEmployees.filter((employee) => yearsSince(employee.admissionDate) > 3).length;

    return [
      { range: t('dashboard.chart_tenure_lt1'), total: lt1 },
      { range: t('dashboard.chart_tenure_1to3'), total: between },
      { range: t('dashboard.chart_tenure_gt3'), total: gt3 }
    ];
  }, [hrEmployees, t]);

  const smartAlerts = useMemo(() => {
    const base = [
      { level: 'critical', title: t('dashboard.alert_stock_critical_title'), message: t('dashboard.alert_stock_critical_message') },
      { level: 'warning', title: t('dashboard.alert_payable_due_title'), message: t('dashboard.alert_payable_due_message', { amount: formatKz(12000) }) },
      { level: 'warning', title: t('dashboard.alert_sales_drop_title'), message: t('dashboard.alert_sales_drop_message') }
    ];

    const dynamic = [
      ...oneYearAlerts.map((employee) => ({
        level: 'info',
        title: t('dashboard.alert_vacation_right_title'),
        message: t('dashboard.alert_vacation_right_message', { name: employee.fullName })
      })),
      ...jubileeAlerts.map((employee) => ({
        level: 'info',
        title: t('dashboard.alert_jubilee_title'),
        message: t('dashboard.alert_jubilee_message', { name: employee.fullName, years: yearsSince(employee.admissionDate) })
      })),
      ...(overdueVacationEmployees.length
        ? [
            {
              level: 'warning',
              title: t('dashboard.alert_overdue_vacation_title'),
              message: t('dashboard.alert_overdue_vacation_message', { count: overdueVacationEmployees.length })
            }
          ]
        : [])
    ];

    return [...dynamic, ...base];
  }, [oneYearAlerts, jubileeAlerts, overdueVacationEmployees, t]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 text-sm">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <FileText size={16} /> {t('dashboard.reports')}
          </button>
          <button
            onClick={() => setIsNewSaleModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center gap-2"
          >
            <Plus size={16} /> {t('dashboard.new_sale')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <KPICard title={t('dashboard.kpi_daily_revenue')} value={formatKz(KPIS.dailyRevenue)} icon={DollarSign} color="blue" trend="up" trendValue="12%" />
        <KPICard title={t('dashboard.kpi_monthly_sales')} value={formatKz(KPIS.monthlyRevenue)} icon={ShoppingBag} color="green" trend="up" trendValue="8.5%" />
        <KPICard title={t('dashboard.kpi_new_customers')} value={KPIS.newCustomers} icon={Users} color="indigo" trend="up" trendValue="+4" />
        <KPICard title={t('dashboard.kpi_total_expenses')} value={formatKz(KPIS.totalExpenses)} icon={TrendingDown} color="red" trend="down" trendValue="2%" />
        <KPICard title={t('dashboard.kpi_net_profit')} value={formatKz(KPIS.netProfit)} icon={Wallet} color="emerald" trend="up" trendValue="15%" />
        <KPICard title={t('dashboard.kpi_margin')} value={`${KPIS.margin}%`} icon={TrendingUp} color="teal" subtitle={t('dashboard.kpi_margin_subtitle')} />
        <KPICard title={t('dashboard.kpi_receivable')} value={formatKz(KPIS.accountsReceivable)} icon={CreditCard} color="sky" subtitle={t('dashboard.kpi_receivable_subtitle')} />
        <KPICard title={t('dashboard.kpi_payable')} value={formatKz(KPIS.accountsPayable)} icon={AlertTriangle} color="rose" subtitle={t('dashboard.kpi_payable_subtitle')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.chart_annual_revenue')}</h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MOCK_FINANCIAL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartTickColor, fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: chartTickColor, fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => [formatKz(value), t('dashboard.chart_value')]}
                    contentStyle={chartTooltipStyle}
                    labelStyle={chartTooltipTextStyle}
                    itemStyle={chartTooltipTextStyle}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.chart_profit_vs_expense')}</h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_FINANCIAL_DATA.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: chartTickColor }} />
                    <Tooltip
                      formatter={(val: number) => formatKz(val)}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipTextStyle}
                      itemStyle={chartTooltipTextStyle}
                    />
                    <Bar dataKey="profit" name={t('dashboard.chart_profit')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="expenses" name={t('dashboard.chart_expense')} fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('dashboard.chart_tenure')}</h2>
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tenureChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTickColor }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: chartTickColor }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number) => [value, t('dashboard.chart_employees')]}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipTextStyle}
                      itemStyle={chartTooltipTextStyle}
                    />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-red-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-500" />
                {t('dashboard.alerts_title')}
              </h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{smartAlerts.length}</span>
            </div>
            <div className="p-2">
              {smartAlerts.slice(0, 6).map((alert, idx) => (
                <div key={`${alert.title}-${idx}`} className={`p-3 hover:bg-gray-50 transition-colors ${idx < smartAlerts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${alert.level === 'critical' ? 'bg-red-500' : alert.level === 'warning' ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{alert.title}</p>
                      <p className="text-xs text-gray-500">{alert.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-blue-600" />
              {t('dashboard.daily_summary')}
            </h3>
            <div className="space-y-4">
              {MOCK_ACTIVITY.slice(0, 4).map((activity) => (
                <div key={activity.id} className="flex gap-3 items-start">
                  <div className="mt-0.5 text-gray-400"><Clock size={14} /></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-gray-900">{activity.action}</p>
                      <span className="text-[10px] text-gray-400">{activity.time}</span>
                    </div>
                    {activity.value && <p className="text-xs font-bold text-blue-600 mt-0.5">{formatKz(activity.value)}</p>}
                    <p className="text-[10px] text-gray-500 mt-0.5">{activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-5 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold flex items-center gap-2"><Gift size={18} className="text-yellow-300" />{t('dashboard.birthdays')}</h3>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">{t('dashboard.birthdays_month')}</span>
            </div>
            <div className="space-y-3">
              {MOCK_BIRTHDAYS.map((bday) => (
                <div key={bday.id} className="flex items-center justify-between bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-xs">{bday.name.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-medium leading-none">{bday.name}</p>
                      <p className="text-[10px] text-blue-200 mt-0.5 opacity-80 uppercase">{bday.type === 'customer' ? t('dashboard.birthday_customer') : t('dashboard.birthday_team')}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">{bday.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm mb-2">{t('dashboard.customer_origin')}</h3>
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
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div><span className="text-gray-600">{origin.source}</span></div>
                    <span className="font-medium text-gray-900">{origin.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNewSaleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.quick_sale')}</h2>
            <p className="text-gray-500 mb-6">{t('dashboard.quick_sale_prompt')}</p>
            <div className="space-y-3">
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><ShoppingCart size={20} /></div>
                <div><div className="font-bold text-gray-900">{t('dashboard.quick_sale_products_title')}</div><div className="text-xs text-gray-500">{t('dashboard.quick_sale_products_description')}</div></div>
              </button>
              <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><FileText size={20} /></div>
                <div><div className="font-bold text-gray-900">{t('dashboard.quick_sale_quote_title')}</div><div className="text-xs text-gray-500">{t('dashboard.quick_sale_quote_description')}</div></div>
              </button>
            </div>
            <div className="mt-6 flex justify-end"><button onClick={() => setIsNewSaleModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">{t('common.cancel')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

