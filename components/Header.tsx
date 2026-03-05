import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Menu,
  Calendar,
  Clock,
  RefreshCw,
  Settings,
  LogOut,
  UserCircle,
  ChevronDown,
  ImagePlus,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { notifyError, notifyInfo, notifySuccess } from '../utils/feedback';
import {
  COMPANY_DEFAULT_NAME,
  COMPANY_LOGO_STORAGE_KEY,
  COMPANY_LOGO_UPDATED_EVENT,
  COMPANY_NAME_STORAGE_KEY,
  COMPANY_NAME_UPDATED_EVENT
} from '../utils/branding';
import { formatCurrency } from '../utils/currency';
import { formatDate, formatTime, readStoredLanguage } from '../utils/language';
import { useI18n } from '../utils/i18n';
import { USER_PROFILE_UPDATED_EVENT } from '../utils/permissions';
import { useAuthorization } from '../utils/useAuthorization';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  NOTIFICATION_PREFERENCES_UPDATED_EVENT,
  NotificationPreferences,
  readStoredNotificationPreferences
} from '../utils/notificationPreferences';

interface HeaderProps {
  toggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

interface UserProfile {
  name: string;
  role: string;
  email: string;
  avatarUrl: string;
}

type AlertLevel = 'critical' | 'warning' | 'info';

interface AppAlert {
  id: string;
  level: AlertLevel;
  module: 'RH' | 'Estoque' | 'Financeiro' | 'Compras';
  title: string;
  message: string;
  path?: string;
}

interface AlertSourceResult {
  alerts: AppAlert[];
  failed: boolean;
}

interface HrEmployeeLite {
  id: string;
  fullName: string;
  admissionDate: string;
  status: string;
}

interface HrVacationLite {
  employeeId: string;
  startDate: string;
}

interface HrLeaveLite {
  startDate: string;
  returnDate: string;
}

interface HrTrainingLite {
  status: string;
}

interface HrStorageData {
  employees: Array<{
    id: string;
    fullName: string;
    admissionDate: string;
    status: string;
  }>;
  vacations: Array<{
    employeeId: string;
    startDate: string;
  }>;
  leaves: Array<{
    startDate: string;
    returnDate: string;
  }>;
  trainings: Array<{
    status: string;
  }>;
}

const HR_STORAGE_KEY = 'fernagest:hr:data:v2';
const NOTIFICATIONS_SEEN_KEY = 'fernagest:notifications:seen:v1';
const USER_PROFILE_KEY = 'fernagest:user:profile:v1';
const ALERTS_REFRESH_INTERVAL_MS = 60 * 1000;

const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Admin',
  role: 'Gestor',
  email: 'admin@fernagest.ao',
  avatarUrl: ''
};

const formatKz = (value: number) =>
  formatCurrency(value || 0);

const formatDateLabel = (date: Date) =>
  formatDate(date, {
    weekday: 'short',
    day: '2-digit',
    month: 'long'
  }, readStoredLanguage());

const formatTimeLabel = (date: Date) =>
  formatTime(date, {
    hour: '2-digit',
    minute: '2-digit'
  }, readStoredLanguage());

const dateOnly = (value: unknown) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayIso = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateFromIso = (isoDate: string) => new Date(`${isoDate}T00:00:00`);

const yearsSince = (isoDate: string) => {
  if (!isoDate) return 0;
  const start = dateFromIso(isoDate);
  if (Number.isNaN(start.getTime())) return 0;

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
  const date = dateFromIso(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
};

const safeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const readSeenNotifications = () => {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const raw = window.localStorage.getItem(NOTIFICATIONS_SEEN_KEY);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed.filter((id) => typeof id === 'string'));
  } catch {
    return new Set<string>();
  }
};

const writeSeenNotifications = (seen: Set<string>) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATIONS_SEEN_KEY, JSON.stringify(Array.from(seen)));
};

const readHrFromLocalStorage = (): HrStorageData => {
  if (typeof window === 'undefined') {
    return { employees: [], vacations: [], leaves: [], trainings: [] };
  }

  try {
    const raw = window.localStorage.getItem(HR_STORAGE_KEY);
    if (!raw) return { employees: [], vacations: [], leaves: [], trainings: [] };
    const parsed = JSON.parse(raw) as Partial<HrStorageData>;
    return {
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      vacations: Array.isArray(parsed.vacations) ? parsed.vacations : [],
      leaves: Array.isArray(parsed.leaves) ? parsed.leaves : [],
      trainings: Array.isArray(parsed.trainings) ? parsed.trainings : []
    };
  } catch {
    return { employees: [], vacations: [], leaves: [], trainings: [] };
  }
};

const readUserProfile = (): UserProfile => {
  if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;

  try {
    const raw = window.localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      name:
        typeof parsed.name === 'string' && parsed.name.trim()
          ? parsed.name.trim()
          : DEFAULT_USER_PROFILE.name,
      role:
        typeof parsed.role === 'string' && parsed.role.trim()
          ? parsed.role.trim()
          : DEFAULT_USER_PROFILE.role,
      email:
        typeof parsed.email === 'string' && parsed.email.trim()
          ? parsed.email.trim()
          : DEFAULT_USER_PROFILE.email,
      avatarUrl:
        typeof parsed.avatarUrl === 'string' && parsed.avatarUrl.trim()
          ? parsed.avatarUrl.trim()
          : DEFAULT_USER_PROFILE.avatarUrl
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
};

const writeUserProfile = (profile: UserProfile) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(
    new CustomEvent<UserProfile>(USER_PROFILE_UPDATED_EVENT, {
      detail: profile
    })
  );
};

const clearUserProfile = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(USER_PROFILE_KEY);
  window.dispatchEvent(
    new CustomEvent<null>(USER_PROFILE_UPDATED_EVENT, {
      detail: null
    })
  );
};

const getInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'AD';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const sortAlerts = (alerts: AppAlert[]) => {
  const priority: Record<AlertLevel, number> = {
    critical: 0,
    warning: 1,
    info: 2
  };
  return [...alerts].sort((a, b) => {
    const levelDiff = priority[a.level] - priority[b.level];
    if (levelDiff !== 0) return levelDiff;
    return a.title.localeCompare(b.title);
  });
};

const levelDotClass: Record<AlertLevel, string> = {
  critical: 'bg-red-500',
  warning: 'bg-orange-500',
  info: 'bg-blue-500'
};

const levelBadgeClass: Record<AlertLevel, string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-orange-100 text-orange-700',
  info: 'bg-blue-100 text-blue-700'
};

const buildHrAlerts = async (canQuerySupabase: boolean): Promise<AlertSourceResult> => {
  let failed = false;
  const localData = readHrFromLocalStorage();

  let employees: HrEmployeeLite[] = localData.employees.map((employee) => ({
    id: employee.id,
    fullName: employee.fullName,
    admissionDate: employee.admissionDate,
    status: employee.status
  }));
  let vacations: HrVacationLite[] = localData.vacations.map((vacation) => ({
    employeeId: vacation.employeeId,
    startDate: vacation.startDate
  }));
  let leaves: HrLeaveLite[] = localData.leaves.map((leave) => ({
    startDate: leave.startDate,
    returnDate: leave.returnDate
  }));
  let trainings: HrTrainingLite[] = localData.trainings.map((training) => ({
    status: training.status
  }));

  if (canQuerySupabase) {
    const [employeesRes, vacationsRes, leavesRes, trainingsRes] = await Promise.all([
      supabase.from('hr_employees').select('id, full_name, admission_date, status'),
      supabase.from('hr_vacations').select('employee_id, start_date'),
      supabase.from('hr_leaves').select('start_date, return_date'),
      supabase.from('hr_trainings').select('status')
    ]);

    if (!employeesRes.error && Array.isArray(employeesRes.data)) {
      employees = employeesRes.data.map((row: any) => ({
        id: String(row.id || ''),
        fullName: String(row.full_name || ''),
        admissionDate: dateOnly(row.admission_date),
        status: String(row.status || '')
      }));
    } else {
      failed = true;
    }

    if (!vacationsRes.error && Array.isArray(vacationsRes.data)) {
      vacations = vacationsRes.data.map((row: any) => ({
        employeeId: String(row.employee_id || ''),
        startDate: dateOnly(row.start_date)
      }));
    } else {
      failed = true;
    }

    if (!leavesRes.error && Array.isArray(leavesRes.data)) {
      leaves = leavesRes.data.map((row: any) => ({
        startDate: dateOnly(row.start_date),
        returnDate: dateOnly(row.return_date)
      }));
    } else {
      failed = true;
    }

    if (!trainingsRes.error && Array.isArray(trainingsRes.data)) {
      trainings = trainingsRes.data.map((row: any) => ({
        status: String(row.status || '')
      }));
    } else {
      failed = true;
    }
  }

  const activeEmployees = employees.filter((employee) => employee.status !== 'DEMITIDO');
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const overdueVacationEmployees = activeEmployees.filter((employee) => {
    if (yearsSince(employee.admissionDate) < 1) return false;
    const hadVacationRecently = vacations.some((vacation) => {
      if (vacation.employeeId !== employee.id) return false;
      if (!vacation.startDate) return false;
      return dateFromIso(vacation.startDate) >= oneYearAgo;
    });
    return !hadVacationRecently;
  });

  const oneYearEmployees = activeEmployees.filter(
    (employee) => yearsSince(employee.admissionDate) === 1 && isAnniversaryToday(employee.admissionDate)
  );
  const jubileeEmployees = activeEmployees.filter(
    (employee) => yearsSince(employee.admissionDate) > 1 && isAnniversaryToday(employee.admissionDate)
  );

  const today = todayIso();
  const leavesOpenCount = leaves.filter(
    (leave) => leave.startDate && leave.returnDate && leave.startDate <= today && leave.returnDate >= today
  ).length;
  const trainingsInProgress = trainings.filter((training) => training.status === 'EM_ANDAMENTO').length;

  const alerts: AppAlert[] = [];

  if (overdueVacationEmployees.length > 0) {
    alerts.push({
      id: `hr-vacations-overdue-${overdueVacationEmployees.length}`,
      level: 'warning',
      module: 'RH',
      title: 'Férias vencidas',
      message: `${overdueVacationEmployees.length} funcionário(s) com férias vencidas.`,
      path: '/hr'
    });
  }

  oneYearEmployees.forEach((employee) => {
    alerts.push({
      id: `hr-anniversary-1-${employee.id}-${new Date().getFullYear()}`,
      level: 'info',
      module: 'RH',
      title: 'Direito a férias (1 ano)',
      message: `${employee.fullName} completou 1 ano hoje.`,
      path: '/hr'
    });
  });

  jubileeEmployees.forEach((employee) => {
    const years = yearsSince(employee.admissionDate);
    alerts.push({
      id: `hr-jubilee-${employee.id}-${years}-${new Date().getFullYear()}`,
      level: 'info',
      module: 'RH',
      title: 'Jubileu de casa',
      message: `${employee.fullName} completa ${years} anos hoje.`,
      path: '/hr'
    });
  });

  if (leavesOpenCount > 0) {
    alerts.push({
      id: `hr-leaves-open-${leavesOpenCount}`,
      level: 'info',
      module: 'RH',
      title: 'Licenças em curso',
      message: `${leavesOpenCount} licença(s) ativa(s) hoje.`,
      path: '/hr'
    });
  }

  if (trainingsInProgress > 0) {
    alerts.push({
      id: `hr-training-progress-${trainingsInProgress}`,
      level: 'info',
      module: 'RH',
      title: 'Treinamentos em andamento',
      message: `${trainingsInProgress} treinamento(s) em andamento.`,
      path: '/hr'
    });
  }

  return { alerts, failed };
};

const buildInventoryAlerts = async (canQuerySupabase: boolean): Promise<AlertSourceResult> => {
  if (!canQuerySupabase) return { alerts: [], failed: false };

  const { data, error } = await supabase.from('products').select('*');
  if (error || !Array.isArray(data)) return { alerts: [], failed: true };

  const products = data.map((row: any) => ({
    id: String(row.id || ''),
    name: String(row.name || 'Produto'),
    stock: safeNumber(row.stock),
    minStock: safeNumber(row.min_stock ?? row.minStock),
    status: String(row.status || 'active')
  }));

  const activeProducts = products.filter((product) => product.status !== 'inactive');
  const lowStock = activeProducts.filter((product) => product.stock <= product.minStock);
  const outOfStock = lowStock.filter((product) => product.stock <= 0);

  const alerts: AppAlert[] = [];
  if (outOfStock.length > 0) {
    alerts.push({
      id: `inventory-out-${outOfStock.length}`,
      level: 'critical',
      module: 'Estoque',
      title: 'Produtos sem estoque',
      message: `${outOfStock.length} item(ns) zerado(s) no estoque.`,
      path: '/inventory'
    });
  }

  if (lowStock.length > 0) {
    const sampleNames = lowStock
      .slice(0, 3)
      .map((product) => product.name)
      .join(', ');
    alerts.push({
      id: `inventory-low-${lowStock.length}`,
      level: 'warning',
      module: 'Estoque',
      title: 'Estoque baixo',
      message:
        lowStock.length > 3
          ? `${lowStock.length} item(ns) em baixo estoque. Ex.: ${sampleNames}.`
          : `${sampleNames}.`,
      path: '/inventory'
    });
  }

  return { alerts, failed: false };
};

const buildFinanceAlerts = async (canQuerySupabase: boolean): Promise<AlertSourceResult> => {
  if (!canQuerySupabase) return { alerts: [], failed: false };

  const { data, error } = await supabase.from('financial_transactions').select('*');
  if (error || !Array.isArray(data)) return { alerts: [], failed: true };

  const today = todayIso();
  const plus3 = dateFromIso(today);
  plus3.setDate(plus3.getDate() + 3);
  const plus3Iso = dateOnly(plus3.toISOString()) || today;

  const openTransactions = data
    .map((row: any) => {
      const status = String(row.status || 'PENDING');
      const due = dateOnly(row.due_date ?? row.dueDate ?? row.date);
      return {
        status,
        dueDate: due,
        amount: safeNumber(row.amount),
        type: String(row.type || 'EXPENSE')
      };
    })
    .filter((transaction) => transaction.status !== 'PAID' && transaction.dueDate);

  const overdue = openTransactions.filter(
    (transaction) => transaction.status === 'OVERDUE' || transaction.dueDate < today
  );
  const dueSoon = openTransactions.filter(
    (transaction) => transaction.dueDate >= today && transaction.dueDate <= plus3Iso
  );

  const alerts: AppAlert[] = [];
  if (overdue.length > 0) {
    const overdueTotal = overdue.reduce((sum, item) => sum + item.amount, 0);
    alerts.push({
      id: `finance-overdue-${overdue.length}-${Math.round(overdueTotal)}`,
      level: 'critical',
      module: 'Financeiro',
      title: 'Lançamentos em atraso',
      message: `${overdue.length} registro(s) em atraso (${formatKz(overdueTotal)}).`,
      path: '/finance'
    });
  }

  if (dueSoon.length > 0) {
    const dueSoonTotal = dueSoon.reduce((sum, item) => sum + item.amount, 0);
    alerts.push({
      id: `finance-due-soon-${dueSoon.length}-${Math.round(dueSoonTotal)}`,
      level: 'warning',
      module: 'Financeiro',
      title: 'Vencimentos próximos',
      message: `${dueSoon.length} registro(s) vencendo em até 3 dias (${formatKz(dueSoonTotal)}).`,
      path: '/finance'
    });
  }

  return { alerts, failed: false };
};

const buildPurchasesAlerts = async (canQuerySupabase: boolean): Promise<AlertSourceResult> => {
  if (!canQuerySupabase) return { alerts: [], failed: false };

  const { data, error } = await supabase.from('purchases').select('*');
  if (error || !Array.isArray(data)) return { alerts: [], failed: true };

  const today = todayIso();
  const plus3 = dateFromIso(today);
  plus3.setDate(plus3.getDate() + 3);
  const plus3Iso = dateOnly(plus3.toISOString()) || today;

  const pendingOrders = data
    .map((row: any) => ({
      status: String(row.status || 'PENDING'),
      expectedDate: dateOnly(row.expected_date ?? row.expectedDate ?? row.date),
      supplierName: String(row.supplier_name ?? row.supplierName ?? 'Fornecedor'),
      total: safeNumber(row.total)
    }))
    .filter((order) => order.status === 'PENDING' && order.expectedDate);

  const overdue = pendingOrders.filter((order) => order.expectedDate < today);
  const dueSoon = pendingOrders.filter(
    (order) => order.expectedDate >= today && order.expectedDate <= plus3Iso
  );

  const alerts: AppAlert[] = [];
  if (overdue.length > 0) {
    const names = overdue
      .slice(0, 2)
      .map((order) => order.supplierName)
      .join(', ');
    alerts.push({
      id: `purchases-overdue-${overdue.length}`,
      level: 'warning',
      module: 'Compras',
      title: 'Pedidos atrasados',
      message:
        overdue.length > 2
          ? `${overdue.length} pedido(s) pendente(s) atrasado(s). Ex.: ${names}.`
          : `${overdue.length} pedido(s) pendente(s) atrasado(s): ${names}.`,
      path: '/purchases'
    });
  }

  if (dueSoon.length > 0) {
    const totalDueSoon = dueSoon.reduce((sum, order) => sum + order.total, 0);
    alerts.push({
      id: `purchases-due-soon-${dueSoon.length}-${Math.round(totalDueSoon)}`,
      level: 'info',
      module: 'Compras',
      title: 'Entregas previstas',
      message: `${dueSoon.length} pedido(s) com entrega prevista em até 3 dias.`,
      path: '/purchases'
    });
  }

  return { alerts, failed: false };
};

const mapSessionUserToProfile = (session: any): UserProfile | null => {
  const user = session?.user;
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const avatarFromMetadata =
    typeof metadata.avatar_url === 'string' && metadata.avatar_url.trim()
      ? metadata.avatar_url.trim()
      : typeof metadata.picture === 'string' && metadata.picture.trim()
        ? metadata.picture.trim()
        : typeof metadata.avatar === 'string' && metadata.avatar.trim()
          ? metadata.avatar.trim()
          : '';
  const email = typeof user.email === 'string' && user.email ? user.email : DEFAULT_USER_PROFILE.email;
  const nameFromMetadata =
    typeof metadata.full_name === 'string' && metadata.full_name.trim()
      ? metadata.full_name.trim()
      : typeof metadata.name === 'string' && metadata.name.trim()
        ? metadata.name.trim()
        : '';
  const nameFromEmail = email.split('@')[0]?.trim() || '';

  return {
    name: nameFromMetadata || nameFromEmail || DEFAULT_USER_PROFILE.name,
    role:
      typeof metadata.role === 'string' && metadata.role.trim()
        ? metadata.role.trim()
        : DEFAULT_USER_PROFILE.role,
    email,
    avatarUrl: avatarFromMetadata
  };
};

const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  isSidebarCollapsed = false,
  onToggleSidebarCollapse
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { can } = useAuthorization();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [alerts, setAlerts] = useState<AppAlert[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasPartialError, setHasPartialError] = useState(false);
  const [seenAlerts, setSeenAlerts] = useState<Set<string>>(() => readSeenNotifications());
  const [userProfile, setUserProfile] = useState<UserProfile>(() => readUserProfile());
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    () => readStoredNotificationPreferences()
  );
  const [companyName, setCompanyName] = useState(COMPANY_DEFAULT_NAME);
  const [companyLogo, setCompanyLogo] = useState('');
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const hasSupabaseConfig = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  const userInitials = useMemo(() => getInitials(userProfile.name), [userProfile.name]);

  const unreadCount = useMemo(
    () =>
      notificationPreferences.pushNotifications
        ? alerts.filter((alert) => !seenAlerts.has(alert.id)).length
        : 0,
    [alerts, seenAlerts, notificationPreferences.pushNotifications]
  );

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const [hr, inventory, finance, purchases] = await Promise.allSettled([
        buildHrAlerts(hasSupabaseConfig),
        buildInventoryAlerts(hasSupabaseConfig),
        buildFinanceAlerts(hasSupabaseConfig),
        buildPurchasesAlerts(hasSupabaseConfig)
      ]);

      const results = [hr, inventory, finance, purchases];
      let partialFailure = false;
      const allAlerts: AppAlert[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allAlerts.push(...result.value.alerts);
          partialFailure = partialFailure || result.value.failed;
        } else {
          partialFailure = true;
        }
      });

      const deduped = Array.from(new Map(allAlerts.map((alert) => [alert.id, alert])).values());
      setAlerts(sortAlerts(deduped));
      setHasPartialError(partialFailure);
    } finally {
      setLoading(false);
    }
  }, [hasSupabaseConfig]);

  const handleOpenNotifications = () => {
    setIsNotificationsOpen((prev) => {
      const next = !prev;
      if (next) setIsUserMenuOpen(false);
      return next;
    });
  };

  const handleOpenUserMenu = () => {
    setIsUserMenuOpen((prev) => {
      const next = !prev;
      if (next) setIsNotificationsOpen(false);
      return next;
    });
  };

  const markVisibleAsSeen = () => {
    if (!alerts.length) return;
    setSeenAlerts((previous) => {
      const next = new Set<string>(previous);
      alerts.forEach((alert) => next.add(alert.id));
      writeSeenNotifications(next);
      return next;
    });
  };

  const handleNavigate = (path?: string) => {
    if (path) navigate(path);
    setIsNotificationsOpen(false);
    setIsUserMenuOpen(false);
  };

  const openSettingsTab = (tab: 'users' | 'system' | 'notifications') => {
    const requiredByTab = {
      users: 'settings.manage_users',
      system: 'settings.manage_system',
      notifications: 'settings.view'
    } as const;

    if (!can(requiredByTab[tab])) {
      notifyInfo('Sem permissao para abrir esta secao.');
      setIsUserMenuOpen(false);
      return;
    }

    navigate(`/settings?tab=${tab}`);
    setIsUserMenuOpen(false);
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    writeUserProfile(profile);
  };

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyInfo('Selecione um arquivo de imagem valido.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      const nextProfile: UserProfile = { ...userProfile, avatarUrl: result };
      saveUserProfile(nextProfile);
      notifySuccess('Foto de perfil atualizada.');
      event.target.value = '';
    };
    reader.onerror = () => {
      notifyError('Nao foi possivel carregar a foto selecionada.');
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);

    if (!hasSupabaseConfig) {
      notifyInfo('Supabase Auth nao configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      notifyError(`Erro ao encerrar sessao: ${error.message}`);
      return;
    }

    clearUserProfile();
    setUserProfile(DEFAULT_USER_PROFILE);
    notifySuccess('Sessao encerrada com sucesso.');
    navigate('/');
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshNotificationPreferences = () => {
      setNotificationPreferences(readStoredNotificationPreferences());
    };

    const handleNotificationPreferencesStorage = (event: StorageEvent) => {
      if (event.key !== NOTIFICATION_PREFERENCES_STORAGE_KEY) return;
      refreshNotificationPreferences();
    };

    const handleNotificationPreferencesUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<NotificationPreferences>;
      setNotificationPreferences(customEvent.detail || DEFAULT_NOTIFICATION_PREFERENCES);
    };

    refreshNotificationPreferences();

    window.addEventListener('storage', handleNotificationPreferencesStorage);
    window.addEventListener(
      NOTIFICATION_PREFERENCES_UPDATED_EVENT,
      handleNotificationPreferencesUpdated as EventListener
    );

    return () => {
      window.removeEventListener('storage', handleNotificationPreferencesStorage);
      window.removeEventListener(
        NOTIFICATION_PREFERENCES_UPDATED_EVENT,
        handleNotificationPreferencesUpdated as EventListener
      );
    };
  }, []);

  useEffect(() => {
    loadAlerts();
    if (!notificationPreferences.pushNotifications) return;

    const timer = setInterval(() => {
      loadAlerts();
    }, ALERTS_REFRESH_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [loadAlerts, notificationPreferences.pushNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    markVisibleAsSeen();
  }, [isNotificationsOpen, alerts]);

  useEffect(() => {
    setUserProfile(readUserProfile());
  }, []);

  useEffect(() => {
    try {
      const savedCompanyName = window.localStorage.getItem(COMPANY_NAME_STORAGE_KEY);
      const savedCompanyLogo = window.localStorage.getItem(COMPANY_LOGO_STORAGE_KEY);
      if (savedCompanyName) setCompanyName(savedCompanyName);
      if (savedCompanyLogo) setCompanyLogo(savedCompanyLogo);
    } catch {
      setCompanyName(COMPANY_DEFAULT_NAME);
      setCompanyLogo('');
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === COMPANY_NAME_STORAGE_KEY) {
        setCompanyName(event.newValue || COMPANY_DEFAULT_NAME);
      }
      if (event.key === COMPANY_LOGO_STORAGE_KEY) {
        setCompanyLogo(event.newValue || '');
      }
    };

    const handleCompanyNameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCompanyName(customEvent.detail || COMPANY_DEFAULT_NAME);
    };

    const handleCompanyLogoUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setCompanyLogo(customEvent.detail || '');
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(COMPANY_NAME_UPDATED_EVENT, handleCompanyNameUpdated as EventListener);
    window.addEventListener(COMPANY_LOGO_UPDATED_EVENT, handleCompanyLogoUpdated as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COMPANY_NAME_UPDATED_EVENT, handleCompanyNameUpdated as EventListener);
      window.removeEventListener(COMPANY_LOGO_UPDATED_EVENT, handleCompanyLogoUpdated as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;

    let mounted = true;

    const loadSessionProfile = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted || error) return;

      const profile = mapSessionUserToProfile(data.session);
      if (profile) {
        const current = readUserProfile();
        const merged = { ...current, ...profile, avatarUrl: profile.avatarUrl || current.avatarUrl };
        saveUserProfile(merged);
      }
    };

    loadSessionProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const profile = mapSessionUserToProfile(session);
      if (profile) {
        const current = readUserProfile();
        const merged = { ...current, ...profile, avatarUrl: profile.avatarUrl || current.avatarUrl };
        saveUserProfile(merged);
      } else {
        setUserProfile(DEFAULT_USER_PROFILE);
        clearUserProfile();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [hasSupabaseConfig]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedNotifications = notificationsRef.current?.contains(target);
      const clickedUserMenu = userMenuRef.current?.contains(target);
      if (clickedNotifications || clickedUserMenu) return;
      setIsNotificationsOpen(false);
      setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-md" onClick={toggleSidebar}>
          <Menu size={20} />
        </button>
        {onToggleSidebarCollapse && (
          <button
            className="hidden md:inline-flex p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            onClick={onToggleSidebarCollapse}
            title={isSidebarCollapsed ? t('sidebar.expand_sidebar') : t('sidebar.collapse_sidebar')}
            aria-label={isSidebarCollapsed ? t('sidebar.expand_sidebar') : t('sidebar.collapse_sidebar')}
          >
            {isSidebarCollapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center p-1 overflow-hidden">
            {companyLogo ? (
              <img src={companyLogo} alt="Logo da empresa" className="w-full h-full object-contain" />
            ) : (
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M10 65 Q 50 95 90 65" stroke="#005596" strokeWidth="10" fill="none" strokeLinecap="round" />
                <path d="M15 55 Q 50 85 85 55" stroke="#005596" strokeWidth="2" fill="none" opacity="0.2" />
                <rect x="25" y="40" width="12" height="25" rx="2" fill="#005596" />
                <rect x="44" y="28" width="12" height="37" rx="2" fill="#43a047" />
                <rect x="63" y="15" width="12" height="50" rx="2" fill="#43a047" />
              </svg>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Empresa</span>
            <span className="text-sm font-bold text-gray-800 leading-tight truncate max-w-[220px]">
              {companyName || COMPANY_DEFAULT_NAME}
            </span>
          </div>
        </div>

        <div className="hidden md:block h-8 w-px bg-gray-200 mx-2"></div>

        <div className="hidden md:flex items-center gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-blue-600" />
            <span className="capitalize">{formatDateLabel(currentDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-green-600" />
            <span>{formatTimeLabel(currentDate)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder={t('header.search_placeholder')}
            className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 transition-all hover:bg-white"
          />
        </div>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={handleOpenNotifications}
            className="relative p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
          >
            <Bell size={20} />
            {notificationPreferences.pushNotifications && unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-12 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900">{t('header.notifications')}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{alerts.length}</span>
                </div>
                <button
                  onClick={loadAlerts}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  title={t('header.refresh_alerts')}
                  aria-label={t('header.refresh_alerts')}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {hasPartialError && (
                <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100">
                  <p className="text-[11px] text-yellow-700">
                    {t('header.partial_error')}
                  </p>
                </div>
              )}

              <div className="max-h-[360px] overflow-y-auto">
                {alerts.length === 0 && !loading && (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-medium text-gray-700">{t('header.no_alerts')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('header.all_good')}</p>
                  </div>
                )}

                {alerts.map((alert) => (
                  <button
                    key={alert.id}
                    onClick={() => handleNavigate(alert.path)}
                    className="w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${levelDotClass[alert.level]}`}></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap ${levelBadgeClass[alert.level]}`}
                          >
                            {alert.module}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative border-l border-gray-200 pl-2" ref={userMenuRef}>
          <button
            onClick={handleOpenUserMenu}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-50 transition-colors"
            title="Conta do usuario"
            aria-label="Conta do usuario"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md text-xs font-bold overflow-hidden">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Foto do usuario" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-gray-700">{userProfile.name}</span>
              <span className="text-[10px] text-gray-500">{userProfile.role}</span>
            </div>
            <ChevronDown size={14} className="hidden md:block text-gray-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 top-12 w-[280px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white flex items-center justify-center font-bold text-sm overflow-hidden">
                    {userProfile.avatarUrl ? (
                      <img src={userProfile.avatarUrl} alt="Foto do usuario" className="w-full h-full object-cover" />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{userProfile.name}</p>
                    <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={triggerAvatarUpload}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <ImagePlus size={16} />
                  Alterar foto
                </button>
                {can('settings.manage_users') && (
                  <button
                    onClick={() => openSettingsTab('users')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <UserCircle size={16} />
                    Perfil e Acesso
                  </button>
                )}
                {can('settings.manage_system') && (
                  <button
                    onClick={() => openSettingsTab('system')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Settings size={16} />
                    Configuracoes
                  </button>
                )}
                {can('settings.view') && (
                  <button
                    onClick={() => openSettingsTab('notifications')}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Bell size={16} />
                    Preferencias de Notificacao
                  </button>
                )}
                <div className="my-1 border-t border-gray-100"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarSelected}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

