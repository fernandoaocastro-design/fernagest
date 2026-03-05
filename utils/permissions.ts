export type AppRole =
  | 'admin_geral'
  | 'rh'
  | 'caixa_financeiro'
  | 'gestor'
  | 'vendedor'
  | 'somente_leitura';

export type AppPermission =
  | 'dashboard.view'
  | 'sales.view'
  | 'sales.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'crm.view'
  | 'crm.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'finance.export'
  | 'purchases.view'
  | 'purchases.manage'
  | 'projects.view'
  | 'projects.manage'
  | 'hr.view'
  | 'hr.manage'
  | 'hr.payroll.view'
  | 'hr.payroll.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.view'
  | 'settings.manage_users'
  | 'settings.manage_system';

export const DEFAULT_APP_ROLE: AppRole = 'gestor';
export const USER_PROFILE_STORAGE_KEY = 'fernagest:user:profile:v1';
export const USER_PROFILE_UPDATED_EVENT = 'fernagest:user:profile:updated:v1';

export const ROLE_LABELS: Record<AppRole, string> = {
  admin_geral: 'Admin Geral',
  rh: 'RH',
  caixa_financeiro: 'Caixa/Financeiro',
  gestor: 'Gestor',
  vendedor: 'Vendedor',
  somente_leitura: 'Somente Leitura'
};

const ROLE_ALIASES: Record<AppRole, string[]> = {
  admin_geral: ['admin_geral', 'admin geral', 'admin', 'administrador', 'super admin'],
  rh: ['rh', 'recursos humanos', 'human resources', 'hr'],
  caixa_financeiro: ['caixa_financeiro', 'caixa/financeiro', 'caixa financeiro', 'caixa', 'financeiro', 'finance', 'contabilidade'],
  gestor: ['gestor', 'manager', 'gerente', 'supervisor'],
  vendedor: ['vendedor', 'seller', 'sales', 'comercial'],
  somente_leitura: ['somente_leitura', 'somente leitura', 'read only', 'readonly', 'viewer', 'consulta']
};

const PERMISSIONS_BY_ROLE: Record<AppRole, readonly AppPermission[]> = {
  admin_geral: [
    'dashboard.view',
    'sales.view',
    'sales.manage',
    'inventory.view',
    'inventory.manage',
    'crm.view',
    'crm.manage',
    'finance.view',
    'finance.manage',
    'finance.export',
    'purchases.view',
    'purchases.manage',
    'projects.view',
    'projects.manage',
    'hr.view',
    'hr.manage',
    'hr.payroll.view',
    'hr.payroll.manage',
    'reports.view',
    'reports.export',
    'settings.view',
    'settings.manage_users',
    'settings.manage_system'
  ],
  rh: [
    'dashboard.view',
    'hr.view',
    'hr.manage',
    'hr.payroll.view',
    'hr.payroll.manage',
    'reports.view',
    'reports.export',
    'settings.view',
    'settings.manage_users'
  ],
  caixa_financeiro: [
    'dashboard.view',
    'sales.view',
    'inventory.view',
    'crm.view',
    'finance.view',
    'finance.manage',
    'finance.export',
    'purchases.view',
    'hr.view',
    'hr.payroll.view',
    'reports.view',
    'reports.export',
    'settings.view'
  ],
  gestor: [
    'dashboard.view',
    'sales.view',
    'sales.manage',
    'inventory.view',
    'inventory.manage',
    'crm.view',
    'crm.manage',
    'finance.view',
    'purchases.view',
    'purchases.manage',
    'projects.view',
    'projects.manage',
    'hr.view',
    'reports.view',
    'reports.export',
    'settings.view'
  ],
  vendedor: [
    'dashboard.view',
    'sales.view',
    'sales.manage',
    'inventory.view',
    'crm.view',
    'crm.manage',
    'reports.view'
  ],
  somente_leitura: [
    'dashboard.view',
    'sales.view',
    'inventory.view',
    'crm.view',
    'finance.view',
    'purchases.view',
    'projects.view',
    'hr.view',
    'reports.view'
  ]
};

export const RBAC_TARGET_MATRIX: Record<AppRole, readonly string[]> = {
  admin_geral: ['Todos os modulos (ler/editar/exportar)', 'Gestao de usuarios e configuracoes do sistema'],
  rh: ['RH completo (incluindo folha)', 'Relatorios de RH', 'Gestao de usuarios'],
  caixa_financeiro: ['Financeiro completo', 'Leitura de folha de pagamento', 'Relatorios financeiros'],
  gestor: ['Operacao comercial completa', 'Financeiro e RH somente leitura', 'Relatorios operacionais'],
  vendedor: ['Vendas e CRM com escrita', 'Estoque e relatorios somente leitura'],
  somente_leitura: ['Leitura transversal dos modulos principais (sem escrita)']
};

export const ROUTE_PERMISSIONS: Record<string, AppPermission> = {
  '/': 'dashboard.view',
  '/sales': 'sales.view',
  '/inventory': 'inventory.view',
  '/crm': 'crm.view',
  '/finance': 'finance.view',
  '/purchases': 'purchases.view',
  '/projects': 'projects.view',
  '/hr': 'hr.view',
  '/reports': 'reports.view',
  '/settings': 'settings.view'
};

const normalizeToken = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_/.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ROLE_LOOKUP = (() => {
  const map = new Map<string, AppRole>();

  (Object.keys(ROLE_LABELS) as AppRole[]).forEach((role) => {
    map.set(normalizeToken(role), role);
  });

  (Object.entries(ROLE_ALIASES) as Array<[AppRole, string[]]>).forEach(([role, aliases]) => {
    aliases.forEach((alias) => map.set(normalizeToken(alias), role));
  });

  return map;
})();

const permissionSetCache = new Map<AppRole, Set<AppPermission>>();

const permissionSetFor = (role: AppRole) => {
  const cached = permissionSetCache.get(role);
  if (cached) return cached;
  const next = new Set(PERMISSIONS_BY_ROLE[role]);
  permissionSetCache.set(role, next);
  return next;
};

export const resolveRole = (rawRole: unknown): AppRole => {
  if (typeof rawRole !== 'string') return DEFAULT_APP_ROLE;
  const normalized = normalizeToken(rawRole);
  if (!normalized) return DEFAULT_APP_ROLE;
  return ROLE_LOOKUP.get(normalized) || DEFAULT_APP_ROLE;
};

export const readRoleFromUserProfile = (): AppRole => {
  if (typeof window === 'undefined') return DEFAULT_APP_ROLE;

  try {
    const raw = window.localStorage.getItem(USER_PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_APP_ROLE;
    const parsed = JSON.parse(raw) as { role?: unknown };
    return resolveRole(parsed.role);
  } catch {
    return DEFAULT_APP_ROLE;
  }
};

export const getRoleLabel = (role: AppRole) => ROLE_LABELS[role];

export const hasPermission = (
  role: AppRole,
  permission: AppPermission | readonly AppPermission[]
) => {
  const required = Array.isArray(permission) ? permission : [permission];
  const granted = permissionSetFor(role);
  return required.every((item) => granted.has(item));
};

export const canAccessPath = (role: AppRole, path: string) => {
  const required = ROUTE_PERMISSIONS[path];
  if (!required) return false;
  return hasPermission(role, required);
};

