import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock3,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Wallet,
  FileMinus,
  Plus,
  Save,
  Search,
  Printer,
  Check,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { confirmAction, notifyError, notifySuccess, notifyWarning } from '../utils/feedback';
import { openPrintWindow } from '../utils/print';
import { supabase } from '../supabaseClient';
import { formatCurrency } from '../utils/currency';
import { useI18n } from '../utils/i18n';

type HrSection =
  | 'overview'
  | 'employees'
  | 'attendance'
  | 'vacations'
  | 'evaluation'
  | 'training'
  | 'payroll'
  | 'leaves';

type EmployeeStatus = 'ATIVO' | 'AFASTADO' | 'DEMITIDO';
type ContractType = 'CLT' | 'TEMPORARIO' | 'ESTAGIARIO';
type WorkRegime = 'DIARISTA' | 'REGIME_TURNO' | 'ESCALA_24X48';
type AttendanceStatus = 'PRESENTE' | 'MEIA_FALTA' | 'FALTA' | 'FOLGA';
type VacationStatus = 'PROGRAMADA' | 'APROVADA' | 'CONCLUIDA';
type EvaluationConclusion = 'EXCELENTE' | 'APROVADO' | 'REQUER_MELHORIAS' | 'INSATISFATORIO';
type TrainingType = 'INTERNO' | 'EXTERNO' | 'ONLINE' | 'PRESENCIAL';
type TrainingStatus = 'CONCLUIDO' | 'PENDENTE' | 'EM_ANDAMENTO' | 'FUTURO';
type LeaveType =
  | 'LICENCA_MEDICA'
  | 'LICENCA_MATERNIDADE'
  | 'LICENCA_PATERNIDADE'
  | 'LICENCA_CASAMENTO';

type PaymentMethod = 'TRANSFERENCIA' | 'CHEQUE' | 'DINHEIRO';

interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  birthDate: string;
  documentId: string;
  phone: string;
  email: string;
  role: string;
  department: string;
  workRegime: WorkRegime;
  contractType: ContractType;
  admissionDate: string;
  iban: string;
  status: EmployeeStatus;
  salary: number;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  entryTime: string;
  exitTime: string;
  totalHours: number;
  missingHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  signature: string;
  notes: string;
}

interface VacationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  admissionDate: string;
  startDate: string;
  returnDate: string;
  totalDays: number;
  isSplit: boolean;
  payOneThird: boolean;
  advance13th: boolean;
  paymentDate: string;
  notes: string;
  employeeSignature: string;
  supervisorSignature: string;
  subsidy: number;
  status: VacationStatus;
}

interface EvaluationRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  evaluationDate: string;
  evaluatorName: string;
  punctuality: number;
  attendance: number;
  taskCompletion: number;
  productivity: number;
  workQuality: number;
  teamwork: number;
  responsibility: number;
  commitment: number;
  communication: number;
  strengths: string;
  improvements: string;
  evaluatorComments: string;
  finalScore: number;
  conclusion: EvaluationConclusion;
}

interface TrainingRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  title: string;
  trainingType: TrainingType;
  objective: string;
  instructor: string;
  location: string;
  startDate: string;
  endDate: string;
  workloadHours: number;
  content: string;
  participationScore: number;
  hasCertificate: boolean;
  status: TrainingStatus;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  employeeCode: string;
  admissionDate: string;
  periodReference: string;
  baseSalary: number;
  overtimeQty: number;
  overtimeHourValue: number;
  nightAllowance: number;
  commissions: number;
  bonuses: number;
  vacationProportional: number;
  thirteenthAdvance: number;
  inss: number;
  irt: number;
  absences: number;
  transportVoucher: number;
  mealVoucher: number;
  advances: number;
  otherDiscounts: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  bank: string;
  agency: string;
  iban: string;
  paymentMethod: PaymentMethod;
  employeeSignature: string;
  hrSignature: string;
  issueDate: string;
}

interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  returnDate: string;
  documentName: string;
  notes: string;
}

interface HrSettings {
  vacationSubsidyPercent: number;
}

interface HrStorageData {
  employees: Employee[];
  attendance: AttendanceRecord[];
  vacations: VacationRecord[];
  evaluations: EvaluationRecord[];
  trainings: TrainingRecord[];
  payrolls: PayrollRecord[];
  leaves: LeaveRecord[];
}

const HR_STORAGE_KEY = 'fernagest:hr:data:v2';
const HR_SETTINGS_KEY = 'fernagest:hr:settings:v1';
const HR_EMPLOYEES_TABLE = 'hr_employees';
const HR_ATTENDANCE_TABLE = 'hr_attendance';
const HR_VACATIONS_TABLE = 'hr_vacations';
const HR_EVALUATIONS_TABLE = 'hr_evaluations';
const HR_TRAININGS_TABLE = 'hr_trainings';
const HR_PAYROLLS_TABLE = 'hr_payrolls';
const HR_LEAVES_TABLE = 'hr_leaves';
const DIARISTA_WEEKLY_OFF_DAYS = [3, 6];

const ROLE_OPTIONS = [
  'Gerente Geral',
  'Gestor',
  'Supervisor',
  'Atendente',
  'Recepcionista',
  'Auxiliar Administrativo',
  'Limpeza',
  'Seguranca'
];

const ROLE_DEPARTMENT_MAP: Record<string, string> = {
  'Gerente Geral': 'Direcao',
  Gestor: 'Gestao',
  Supervisor: 'Operacoes',
  Atendente: 'Atendimento',
  Recepcionista: 'Atendimento',
  'Auxiliar Administrativo': 'Administracao',
  Limpeza: 'Operacoes',
  Seguranca: 'Operacoes'
};

const WORK_REGIME_OPTIONS: WorkRegime[] = ['DIARISTA', 'REGIME_TURNO', 'ESCALA_24X48'];
const CONTRACT_OPTIONS: ContractType[] = ['CLT', 'TEMPORARIO', 'ESTAGIARIO'];
const STATUS_OPTIONS: EmployeeStatus[] = ['ATIVO', 'AFASTADO', 'DEMITIDO'];
const TRAINING_TYPE_OPTIONS: TrainingType[] = ['INTERNO', 'EXTERNO', 'ONLINE', 'PRESENCIAL'];
const TRAINING_STATUS_OPTIONS: TrainingStatus[] = ['CONCLUIDO', 'PENDENTE', 'EM_ANDAMENTO', 'FUTURO'];
const LEAVE_TYPE_OPTIONS: LeaveType[] = [
  'LICENCA_MEDICA',
  'LICENCA_MATERNIDADE',
  'LICENCA_PATERNIDADE',
  'LICENCA_CASAMENTO'
];

const formatKz = (value: number) =>
  formatCurrency(value || 0);

const parseNumber = (value: string | number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const normalizePhone = (phone: string) => {
  const trimmed = phone.trim();
  if (!trimmed) return '+244 ';
  if (trimmed.startsWith('+244')) return trimmed;
  return `+244 ${trimmed.replace(/^\+/, '')}`;
};

const normalizeIban = (iban: string) => {
  const clean = iban.trim().replace(/\s+/g, '');
  if (!clean) return 'AO06';
  if (clean.toUpperCase().startsWith('AO06')) return clean.toUpperCase();
  return `AO06${clean.toUpperCase().replace(/^AO\d{2}/, '')}`;
};

const toMinutes = (timeValue: string) => {
  if (!timeValue) return 0;
  const [hh, mm] = timeValue.split(':').map((part) => Number(part));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
};

const calculateWorkedHours = (entryTime: string, exitTime: string) => {
  if (!entryTime || !exitTime) return 0;
  const entry = toMinutes(entryTime);
  const exit = toMinutes(exitTime);
  const adjustedExit = exit >= entry ? exit : exit + 24 * 60;
  return Number(((adjustedExit - entry) / 60).toFixed(2));
};

const yearsOfHouse = (admissionDate: string) => {
  if (!admissionDate) return 0;
  const start = new Date(`${admissionDate}T00:00:00`);
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  const anniversaryNotReached =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (anniversaryNotReached) years -= 1;
  return years < 0 ? 0 : years;
};

const daysBetween = (startIso: string, endIso: string, inclusive = true) => {
  if (!startIso || !endIso) return 0;
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);
  const total = inclusive ? diff + 1 : diff;
  return total > 0 ? total : 0;
};

const getInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'FN';
  if (parts.length === 1) return `${parts[0][0] || 'F'}${parts[0][1] || 'N'}`.toUpperCase();
  return `${parts[0][0] || 'F'}${parts[parts.length - 1][0] || 'N'}`.toUpperCase();
};

const generateEmployeeCode = (fullName: string, employees: Employee[]) => {
  const initials = getInitials(fullName);
  const samePrefix = employees.filter((employee) => employee.employeeCode.startsWith(`${initials}-`));
  const nextNumber = samePrefix.length + 1;
  return `${initials}-${String(nextNumber).padStart(2, '0')}`;
};

const getDepartmentFromRole = (role: string) => ROLE_DEPARTMENT_MAP[role] || 'Administracao';

const attendanceStatusKey: Record<AttendanceStatus, string> = {
  PRESENTE: 'hr.attendance_status_present',
  MEIA_FALTA: 'hr.attendance_status_half_absence',
  FALTA: 'hr.attendance_status_absence',
  FOLGA: 'hr.attendance_status_offday'
};

const leaveTypeKey: Record<LeaveType, string> = {
  LICENCA_MEDICA: 'hr.leave_type_medical',
  LICENCA_MATERNIDADE: 'hr.leave_type_maternity',
  LICENCA_PATERNIDADE: 'hr.leave_type_paternity',
  LICENCA_CASAMENTO: 'hr.leave_type_marriage'
};

const isLeaveType = (value: string): value is LeaveType =>
  value === 'LICENCA_MEDICA' ||
  value === 'LICENCA_MATERNIDADE' ||
  value === 'LICENCA_PATERNIDADE' ||
  value === 'LICENCA_CASAMENTO';

const normalizeLeaveType = (value: string): LeaveType =>
  isLeaveType(value) ? value : 'LICENCA_MEDICA';

const workRegimeKey: Record<WorkRegime, string> = {
  DIARISTA: 'hr.work_regime_daily',
  REGIME_TURNO: 'hr.work_regime_shift',
  ESCALA_24X48: 'hr.work_regime_24x48'
};

const sampleEmployees: Employee[] = [
  {
    id: 'emp-1',
    employeeCode: 'AS-01',
    fullName: 'Ana Silva',
    birthDate: '1992-09-14',
    documentId: '009912233LA041',
    phone: '+244 923 111 111',
    email: 'ana.silva@fernagest.ao',
    role: 'Gestor',
    department: 'Gestao',
    workRegime: 'DIARISTA',
    contractType: 'CLT',
    admissionDate: '2024-03-05',
    iban: 'AO06123400001234567890123',
    status: 'ATIVO',
    salary: 450000
  },
  {
    id: 'emp-2',
    employeeCode: 'CM-01',
    fullName: 'Carlos Mendes',
    birthDate: '1996-02-03',
    documentId: '006611227LA098',
    phone: '+244 923 222 222',
    email: 'carlos.mendes@fernagest.ao',
    role: 'Supervisor',
    department: 'Operacoes',
    workRegime: 'ESCALA_24X48',
    contractType: 'TEMPORARIO',
    admissionDate: '2023-01-10',
    iban: 'AO06123400001234567890124',
    status: 'ATIVO',
    salary: 320000
  }
];

const loadSettings = (): HrSettings => {
  if (typeof window === 'undefined') return { vacationSubsidyPercent: 33.33 };
  try {
    const raw = window.localStorage.getItem(HR_SETTINGS_KEY);
    if (!raw) return { vacationSubsidyPercent: 33.33 };
    const parsed = JSON.parse(raw) as Partial<HrSettings>;
    return { vacationSubsidyPercent: parseNumber(parsed.vacationSubsidyPercent ?? 33.33) };
  } catch {
    return { vacationSubsidyPercent: 33.33 };
  }
};

const loadHrData = (): HrStorageData => {
  if (typeof window === 'undefined') {
    return {
      employees: sampleEmployees,
      attendance: [],
      vacations: [],
      evaluations: [],
      trainings: [],
      payrolls: [],
      leaves: []
    };
  }

  try {
    const raw = window.localStorage.getItem(HR_STORAGE_KEY);
    if (!raw) {
      return {
        employees: sampleEmployees,
        attendance: [],
        vacations: [],
        evaluations: [],
        trainings: [],
        payrolls: [],
        leaves: []
      };
    }

    const parsed = JSON.parse(raw) as Partial<HrStorageData>;
    return {
      employees: Array.isArray(parsed.employees) && parsed.employees.length ? parsed.employees : sampleEmployees,
      attendance: Array.isArray(parsed.attendance) ? parsed.attendance : [],
      vacations: Array.isArray(parsed.vacations) ? parsed.vacations : [],
      evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
      trainings: Array.isArray(parsed.trainings) ? parsed.trainings : [],
      payrolls: Array.isArray(parsed.payrolls) ? parsed.payrolls : [],
      leaves: Array.isArray(parsed.leaves) ? parsed.leaves : []
    };
  } catch {
    return {
      employees: sampleEmployees,
      attendance: [],
      vacations: [],
      evaluations: [],
      trainings: [],
      payrolls: [],
      leaves: []
    };
  }
};

const asDateOnly = (value: unknown) => (typeof value === 'string' ? value.slice(0, 10) : '');
const asString = (value: unknown) => (typeof value === 'string' ? value : '');
const asBool = (value: unknown) => Boolean(value);

const mapEmployeeRow = (row: any): Employee => ({
  id: row.id,
  employeeCode: asString(row.employee_code),
  fullName: asString(row.full_name),
  birthDate: asDateOnly(row.birth_date),
  documentId: asString(row.document_id),
  phone: normalizePhone(asString(row.phone)),
  email: asString(row.email),
  role: asString(row.role),
  department: asString(row.department),
  workRegime: (asString(row.work_regime) as WorkRegime) || 'DIARISTA',
  contractType: (asString(row.contract_type) as ContractType) || 'CLT',
  admissionDate: asDateOnly(row.admission_date),
  iban: normalizeIban(asString(row.iban)),
  status: (asString(row.status) as EmployeeStatus) || 'ATIVO',
  salary: parseNumber(row.salary)
});

const mapAttendanceRow = (row: any): AttendanceRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  date: asDateOnly(row.work_date),
  entryTime: asString(row.entry_time),
  exitTime: asString(row.exit_time),
  totalHours: parseNumber(row.total_hours),
  missingHours: parseNumber(row.missing_hours),
  overtimeHours: parseNumber(row.overtime_hours),
  status: (asString(row.status) as AttendanceStatus) || 'FALTA',
  signature: asString(row.signature),
  notes: asString(row.notes)
});

const mapVacationRow = (row: any): VacationRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  role: asString(row.role),
  department: asString(row.department),
  admissionDate: asDateOnly(row.admission_date),
  startDate: asDateOnly(row.start_date),
  returnDate: asDateOnly(row.return_date),
  totalDays: parseNumber(row.total_days),
  isSplit: asBool(row.is_split),
  payOneThird: asBool(row.pay_one_third),
  advance13th: asBool(row.advance_13th),
  paymentDate: asDateOnly(row.payment_date),
  notes: asString(row.notes),
  employeeSignature: asString(row.employee_signature),
  supervisorSignature: asString(row.supervisor_signature),
  subsidy: parseNumber(row.subsidy),
  status: (asString(row.status) as VacationStatus) || 'PROGRAMADA'
});

const mapEvaluationRow = (row: any): EvaluationRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  role: asString(row.role),
  department: asString(row.department),
  evaluationDate: asDateOnly(row.evaluation_date),
  evaluatorName: asString(row.evaluator_name),
  punctuality: parseNumber(row.punctuality),
  attendance: parseNumber(row.attendance),
  taskCompletion: parseNumber(row.task_completion),
  productivity: parseNumber(row.productivity),
  workQuality: parseNumber(row.work_quality),
  teamwork: parseNumber(row.teamwork),
  responsibility: parseNumber(row.responsibility),
  commitment: parseNumber(row.commitment),
  communication: parseNumber(row.communication),
  strengths: asString(row.strengths),
  improvements: asString(row.improvements),
  evaluatorComments: asString(row.evaluator_comments),
  finalScore: parseNumber(row.final_score),
  conclusion: (asString(row.conclusion) as EvaluationConclusion) || 'INSATISFATORIO'
});

const mapTrainingRow = (row: any): TrainingRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  role: asString(row.role),
  department: asString(row.department),
  title: asString(row.title),
  trainingType: (asString(row.training_type) as TrainingType) || 'INTERNO',
  objective: asString(row.objective),
  instructor: asString(row.instructor),
  location: asString(row.location),
  startDate: asDateOnly(row.start_date),
  endDate: asDateOnly(row.end_date),
  workloadHours: parseNumber(row.workload_hours),
  content: asString(row.content),
  participationScore: parseNumber(row.participation_score),
  hasCertificate: asBool(row.has_certificate),
  status: (asString(row.status) as TrainingStatus) || 'PENDENTE'
});

const mapPayrollRow = (row: any): PayrollRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  role: asString(row.role),
  department: asString(row.department),
  employeeCode: asString(row.employee_code),
  admissionDate: asDateOnly(row.admission_date),
  periodReference: asString(row.period_reference),
  baseSalary: parseNumber(row.base_salary),
  overtimeQty: parseNumber(row.overtime_qty),
  overtimeHourValue: parseNumber(row.overtime_hour_value),
  nightAllowance: parseNumber(row.night_allowance),
  commissions: parseNumber(row.commissions),
  bonuses: parseNumber(row.bonuses),
  vacationProportional: parseNumber(row.vacation_proportional),
  thirteenthAdvance: parseNumber(row.thirteenth_advance),
  inss: parseNumber(row.inss),
  irt: parseNumber(row.irt),
  absences: parseNumber(row.absences),
  transportVoucher: parseNumber(row.transport_voucher),
  mealVoucher: parseNumber(row.meal_voucher),
  advances: parseNumber(row.advances),
  otherDiscounts: parseNumber(row.other_discounts),
  totalEarnings: parseNumber(row.total_earnings),
  totalDeductions: parseNumber(row.total_deductions),
  netSalary: parseNumber(row.net_salary),
  bank: asString(row.bank),
  agency: asString(row.agency),
  iban: normalizeIban(asString(row.iban)),
  paymentMethod: (asString(row.payment_method) as PaymentMethod) || 'TRANSFERENCIA',
  employeeSignature: asString(row.employee_signature),
  hrSignature: asString(row.hr_signature),
  issueDate: asDateOnly(row.issue_date)
});

const mapLeaveRow = (row: any): LeaveRecord => ({
  id: row.id,
  employeeId: asString(row.employee_id),
  employeeName: asString(row.employee_name),
  leaveType: normalizeLeaveType(asString(row.leave_type)),
  startDate: asDateOnly(row.start_date),
  returnDate: asDateOnly(row.return_date),
  documentName: asString(row.document_name),
  notes: asString(row.notes)
});

const HR = () => {
  const { t } = useI18n();
  const initialData = loadHrData();
  const settings = loadSettings();

  const [activeSection, setActiveSection] = useState<HrSection>('overview');

  const [employees, setEmployees] = useState<Employee[]>(initialData.employees);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialData.attendance);
  const [vacations, setVacations] = useState<VacationRecord[]>(initialData.vacations);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(initialData.evaluations);
  const [trainings, setTrainings] = useState<TrainingRecord[]>(initialData.trainings);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>(initialData.payrolls);
  const [leaves, setLeaves] = useState<LeaveRecord[]>(initialData.leaves);

  const [vacationSubsidyPercent, setVacationSubsidyPercent] = useState<number>(settings.vacationSubsidyPercent);

  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showVacationDueOnly, setShowVacationDueOnly] = useState(false);

  const [employeeForm, setEmployeeForm] = useState<Omit<Employee, 'id' | 'employeeCode'>>({
    fullName: '',
    birthDate: '',
    documentId: '',
    phone: '+244 ',
    email: '',
    role: ROLE_OPTIONS[0],
    department: getDepartmentFromRole(ROLE_OPTIONS[0]),
    workRegime: 'DIARISTA',
    contractType: 'CLT',
    admissionDate: todayIso(),
    iban: 'AO06',
    status: 'ATIVO',
    salary: 0
  });
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [attendanceForm, setAttendanceForm] = useState({
    employeeId: '',
    date: todayIso(),
    entryTime: '',
    exitTime: '',
    signature: '',
    notes: ''
  });

  const [vacationForm, setVacationForm] = useState({
    employeeId: '',
    startDate: '',
    returnDate: '',
    isSplit: false,
    payOneThird: true,
    advance13th: false,
    paymentDate: '',
    notes: '',
    employeeSignature: '',
    supervisorSignature: '',
    status: 'PROGRAMADA' as VacationStatus
  });

  const [evaluationForm, setEvaluationForm] = useState({
    employeeId: '',
    evaluationDate: todayIso(),
    evaluatorName: '',
    punctuality: 7,
    attendance: 7,
    taskCompletion: 7,
    productivity: 7,
    workQuality: 7,
    teamwork: 7,
    responsibility: 7,
    commitment: 7,
    communication: 7,
    strengths: '',
    improvements: '',
    evaluatorComments: ''
  });

  const [trainingForm, setTrainingForm] = useState({
    employeeId: '',
    title: '',
    trainingType: 'INTERNO' as TrainingType,
    objective: '',
    instructor: '',
    location: '',
    startDate: '',
    endDate: '',
    workloadHours: 0,
    content: '',
    participationScore: 0,
    hasCertificate: false,
    status: 'PENDENTE' as TrainingStatus
  });

  const [payrollForm, setPayrollForm] = useState({
    employeeId: '',
    periodReference: '',
    baseSalary: 0,
    overtimeQty: 0,
    overtimeHourValue: 0,
    nightAllowance: 0,
    commissions: 0,
    bonuses: 0,
    vacationProportional: 0,
    thirteenthAdvance: 0,
    inss: 0,
    irt: 0,
    absences: 0,
    transportVoucher: 0,
    mealVoucher: 0,
    advances: 0,
    otherDiscounts: 0,
    bank: '',
    agency: '',
    iban: 'AO06',
    paymentMethod: 'TRANSFERENCIA' as PaymentMethod,
    employeeSignature: '',
    hrSignature: '',
    issueDate: todayIso()
  });

  const [leaveForm, setLeaveForm] = useState({
    employeeId: '',
    leaveType: 'LICENCA_MEDICA' as LeaveType,
    startDate: '',
    returnDate: '',
    documentName: '',
    notes: ''
  });

  const [formsVisible, setFormsVisible] = useState<Record<HrSection, boolean>>({
    employees: false,
    attendance: false,
    vacations: false,
    evaluation: false,
    training: false,
    payroll: false,
    leaves: false
  });
  const [loadingRemote, setLoadingRemote] = useState(false);

  const toggleForm = (section: HrSection) => {
    setFormsVisible((current) => ({ ...current, [section]: !current[section] }));
  };

  const showFormFor = (section: HrSection) => {
    setFormsVisible((current) => ({ ...current, [section]: true }));
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const payload: HrStorageData = {
      employees,
      attendance,
      vacations,
      evaluations,
      trainings,
      payrolls,
      leaves
    };

    window.localStorage.setItem(HR_STORAGE_KEY, JSON.stringify(payload));
  }, [employees, attendance, vacations, evaluations, trainings, payrolls, leaves]);

  const fetchHrDataFromSupabase = async () => {
    try {
      setLoadingRemote(true);

      const [
        employeesResult,
        attendanceResult,
        vacationsResult,
        evaluationsResult,
        trainingsResult,
        payrollsResult,
        leavesResult
      ] = await Promise.all([
        supabase.from(HR_EMPLOYEES_TABLE).select('*').order('full_name', { ascending: true }),
        supabase.from(HR_ATTENDANCE_TABLE).select('*').order('work_date', { ascending: false }),
        supabase.from(HR_VACATIONS_TABLE).select('*').order('start_date', { ascending: false }),
        supabase.from(HR_EVALUATIONS_TABLE).select('*').order('evaluation_date', { ascending: false }),
        supabase.from(HR_TRAININGS_TABLE).select('*').order('start_date', { ascending: false }),
        supabase.from(HR_PAYROLLS_TABLE).select('*').order('created_at', { ascending: false }),
        supabase.from(HR_LEAVES_TABLE).select('*').order('start_date', { ascending: false })
      ]);

      const allErrors = [
        employeesResult.error,
        attendanceResult.error,
        vacationsResult.error,
        evaluationsResult.error,
        trainingsResult.error,
        payrollsResult.error,
        leavesResult.error
      ].filter(Boolean);

      if (allErrors.length > 0) {
        notifyWarning(t('hr.sync_warning_supabase_local'));
        return;
      }

      setEmployees((employeesResult.data || []).map(mapEmployeeRow));
      setAttendance((attendanceResult.data || []).map(mapAttendanceRow));
      setVacations((vacationsResult.data || []).map(mapVacationRow));
      setEvaluations((evaluationsResult.data || []).map(mapEvaluationRow));
      setTrainings((trainingsResult.data || []).map(mapTrainingRow));
      setPayrolls((payrollsResult.data || []).map(mapPayrollRow));
      setLeaves((leavesResult.data || []).map(mapLeaveRow));
    } catch (error) {
      notifyError(
        t('hr.sync_error', {
          message: error instanceof Error ? error.message : t('hr.unknown_error')
        })
      );
    } finally {
      setLoadingRemote(false);
    }
  };

  useEffect(() => {
    void fetchHrDataFromSupabase();
  }, []);

  useEffect(() => {
    const loaded = loadSettings();
    setVacationSubsidyPercent(loaded.vacationSubsidyPercent);
  }, []);

  const employeesSorted = useMemo(
    () => [...employees].sort((a, b) => a.fullName.localeCompare(b.fullName, 'pt', { sensitivity: 'base' })),
    [employees]
  );

  const hasOverdueVacation = (employee: Employee) => {
    if (employee.status !== 'ATIVO') return false;
    const years = yearsOfHouse(employee.admissionDate);
    if (years < 1) return false;

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const hadVacationRecently = vacations.some((vacation) => {
      if (vacation.employeeId !== employee.id) return false;
      const start = new Date(`${vacation.startDate}T00:00:00`);
      return start >= oneYearAgo;
    });

    return !hadVacationRecently;
  };

  const employeesFiltered = useMemo(() => {
    const q = employeeSearch.toLowerCase();
    return employeesSorted.filter((employee) => {
      const matchesSearch =
        employee.fullName.toLowerCase().includes(q) ||
        employee.employeeCode.toLowerCase().includes(q) ||
        employee.role.toLowerCase().includes(q);

      const matchesVacationFilter = !showVacationDueOnly || hasOverdueVacation(employee);
      return matchesSearch && matchesVacationFilter;
    });
  }, [employeesSorted, employeeSearch, showVacationDueOnly, vacations]);

  const kpiEmployeesTotal = employees.length;
  const kpiEmployeesActive = employees.filter((employee) => employee.status === 'ATIVO').length;
  const kpiEmployeesOnLeave = employees.filter((employee) => employee.status === 'AFASTADO').length;
  const kpiEmployeesDismissed = employees.filter((employee) => employee.status === 'DEMITIDO').length;
  const kpiVacationsDue = employees.filter((employee) => hasOverdueVacation(employee)).length;
  const kpiTrainingInProgress = trainings.filter((training) => training.status === 'EM_ANDAMENTO').length;
  const kpiLeavesOpen = leaves.filter((leave) => {
    const today = todayIso();
    return leave.startDate <= today && leave.returnDate >= today;
  }).length;

  const currentPeriod = new Date().toISOString().slice(0, 7);
  const kpiPayrollNetCurrentPeriod = payrolls
    .filter((payroll) => payroll.periodReference === currentPeriod)
    .reduce((sum, payroll) => sum + payroll.netSalary, 0);

  const departmentDistribution = useMemo(() => {
    const map = new Map<string, number>();
    employees
      .filter((employee) => employee.status !== 'DEMITIDO')
      .forEach((employee) => {
        const key = employee.department || 'Sem Departamento';
        map.set(key, (map.get(key) || 0) + 1);
      });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [employees]);

  const tenureBuckets = useMemo(() => {
    const lt1 = employees.filter((employee) => yearsOfHouse(employee.admissionDate) < 1).length;
    const y1to3 = employees.filter((employee) => {
      const years = yearsOfHouse(employee.admissionDate);
      return years >= 1 && years <= 3;
    }).length;
    const gt3 = employees.filter((employee) => yearsOfHouse(employee.admissionDate) > 3).length;
    return [
      { label: t('dashboard.chart_tenure_lt1'), total: lt1 },
      { label: t('dashboard.chart_tenure_1to3'), total: y1to3 },
      { label: t('dashboard.chart_tenure_gt3'), total: gt3 }
    ];
  }, [employees, t]);

  const overviewAlerts = useMemo(() => {
    const alerts: Array<{ level: 'ok' | 'warn' | 'info'; message: string }> = [];
    if (kpiVacationsDue > 0) {
      alerts.push({ level: 'warn', message: t('hr.alert_overdue_vacations', { count: kpiVacationsDue }) });
    } else {
      alerts.push({ level: 'ok', message: t('hr.alert_no_overdue_vacation') });
    }
    if (kpiLeavesOpen > 0) {
      alerts.push({ level: 'info', message: t('hr.alert_open_leaves', { count: kpiLeavesOpen }) });
    }
    if (kpiTrainingInProgress > 0) {
      alerts.push({ level: 'info', message: t('hr.alert_training_in_progress', { count: kpiTrainingInProgress }) });
    }
    if (kpiEmployeesDismissed > 0) {
      alerts.push({ level: 'warn', message: t('hr.alert_dismissed', { count: kpiEmployeesDismissed }) });
    }
    return alerts;
  }, [kpiVacationsDue, kpiLeavesOpen, kpiTrainingInProgress, kpiEmployeesDismissed, t]);

  const attendanceByEmployee = useMemo(() => {
    const map = new Map<string, { missing: number; overtime: number }>();
    attendance.forEach((item) => {
      const current = map.get(item.employeeId) || { missing: 0, overtime: 0 };
      current.missing += item.missingHours;
      current.overtime += item.overtimeHours;
      map.set(item.employeeId, current);
    });
    return map;
  }, [attendance]);

  const employeeById = useMemo(() => {
    const map = new Map<string, Employee>();
    employees.forEach((employee) => map.set(employee.id, employee));
    return map;
  }, [employees]);

  const evaluateAttendanceStatus = (
    employee: Employee,
    dateIso: string,
    entryTime: string,
    exitTime: string
  ): { status: AttendanceStatus; totalHours: number; missingHours: number; overtimeHours: number } => {
    const date = new Date(`${dateIso}T00:00:00`);
    const weekDay = date.getDay();

    const totalHours = calculateWorkedHours(entryTime, exitTime);

    let status: AttendanceStatus = 'PRESENTE';
    let expectedHours = employee.workRegime === 'ESCALA_24X48' ? 24 : 8;

    if (employee.workRegime === 'ESCALA_24X48') {
      const diffDays = daysBetween(employee.admissionDate, dateIso, false);
      const onDuty = diffDays % 3 === 0;

      if (!onDuty) status = 'FOLGA';
      else status = entryTime ? 'PRESENTE' : 'FALTA';
    } else if (employee.workRegime === 'DIARISTA') {
      const isWeeklyOff = DIARISTA_WEEKLY_OFF_DAYS.includes(weekDay);
      if (isWeeklyOff) status = 'FOLGA';
      else if (!entryTime) status = 'FALTA';
      else status = toMinutes(entryTime) <= toMinutes('08:15') ? 'PRESENTE' : 'MEIA_FALTA';
    } else {
      if (!entryTime) status = 'FALTA';
      else status = toMinutes(entryTime) <= toMinutes('08:15') ? 'PRESENTE' : 'MEIA_FALTA';
    }

    let missingHours = 0;
    let overtimeHours = 0;

    if (status === 'FALTA') {
      missingHours = expectedHours;
    } else if (status === 'MEIA_FALTA') {
      missingHours = Math.max(4, expectedHours - totalHours);
      overtimeHours = Math.max(0, totalHours - expectedHours);
    } else if (status === 'PRESENTE') {
      missingHours = Math.max(0, expectedHours - totalHours);
      overtimeHours = Math.max(0, totalHours - expectedHours);
    }

    return {
      status,
      totalHours,
      missingHours: Number(missingHours.toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2))
    };
  };

  const resetEmployeeForm = () => {
    setEditingEmployeeId(null);
    setEmployeeForm({
      fullName: '',
      birthDate: '',
      documentId: '',
      phone: '+244 ',
      email: '',
      role: ROLE_OPTIONS[0],
      department: getDepartmentFromRole(ROLE_OPTIONS[0]),
      workRegime: 'DIARISTA',
      contractType: 'CLT',
      admissionDate: todayIso(),
      iban: 'AO06',
      status: 'ATIVO',
      salary: 0
    });
  };

  const handleEmployeeSubmit = async () => {
    if (!employeeForm.fullName || !employeeForm.documentId || !employeeForm.admissionDate) {
      notifyWarning(t('hr.employee_required_fields'));
      return;
    }

    const normalizedPhone = normalizePhone(employeeForm.phone);
    const normalizedIban = normalizeIban(employeeForm.iban);

    if (editingEmployeeId) {
      const { error } = await supabase
        .from(HR_EMPLOYEES_TABLE)
        .update({
          full_name: employeeForm.fullName,
          birth_date: employeeForm.birthDate || null,
          document_id: employeeForm.documentId,
          phone: normalizedPhone,
          email: employeeForm.email,
          role: employeeForm.role,
          department: employeeForm.department,
          work_regime: employeeForm.workRegime,
          contract_type: employeeForm.contractType,
          admission_date: employeeForm.admissionDate,
          iban: normalizedIban,
          status: employeeForm.status,
          salary: parseNumber(employeeForm.salary)
        })
        .eq('id', editingEmployeeId);

      if (error) {
        notifyError(t('hr.employee_update_error', { message: error.message }));
        return;
      }

      notifySuccess(t('hr.employee_update_success'));
    } else {
      const { error } = await supabase.from(HR_EMPLOYEES_TABLE).insert({
        employee_code: generateEmployeeCode(employeeForm.fullName, employees),
        full_name: employeeForm.fullName,
        birth_date: employeeForm.birthDate || null,
        document_id: employeeForm.documentId,
        phone: normalizedPhone,
        email: employeeForm.email,
        role: employeeForm.role,
        department: employeeForm.department,
        work_regime: employeeForm.workRegime,
        contract_type: employeeForm.contractType,
        admission_date: employeeForm.admissionDate,
        iban: normalizedIban,
        status: employeeForm.status,
        salary: parseNumber(employeeForm.salary)
      });

      if (error) {
        notifyError(t('hr.employee_create_error', { message: error.message }));
        return;
      }

      notifySuccess(t('hr.employee_create_success'));
    }

    await fetchHrDataFromSupabase();
    resetEmployeeForm();
  };

  const handleEmployeeEdit = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    showFormFor('employees');
    setEmployeeForm({
      fullName: employee.fullName,
      birthDate: employee.birthDate,
      documentId: employee.documentId,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      workRegime: employee.workRegime,
      contractType: employee.contractType,
      admissionDate: employee.admissionDate,
      iban: employee.iban,
      status: employee.status,
      salary: employee.salary
    });
  };

  const handleEmployeeDelete = async (employee: Employee) => {
    const confirmed = await confirmAction({
      title: t('hr.employee_delete_title'),
      message: t('hr.employee_delete_message', { name: employee.fullName }),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      danger: true
    });

    if (!confirmed) return;

    const { error } = await supabase.from(HR_EMPLOYEES_TABLE).delete().eq('id', employee.id);
    if (error) {
      notifyError(t('hr.employee_delete_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    if (editingEmployeeId === employee.id) resetEmployeeForm();
    notifySuccess(t('hr.employee_delete_success'));
  };

  const handleAttendanceSubmit = async () => {
    const employee = employeeById.get(attendanceForm.employeeId);
    if (!employee || !attendanceForm.date) {
      notifyWarning(t('hr.attendance_required'));
      return;
    }

    const computed = evaluateAttendanceStatus(
      employee,
      attendanceForm.date,
      attendanceForm.entryTime,
      attendanceForm.exitTime
    );

    const row: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      date: attendanceForm.date,
      entryTime: attendanceForm.entryTime,
      exitTime: attendanceForm.exitTime,
      totalHours: computed.totalHours,
      missingHours: computed.missingHours,
      overtimeHours: computed.overtimeHours,
      status: computed.status,
      signature: attendanceForm.signature,
      notes: attendanceForm.notes
    };

    const { error } = await supabase.from(HR_ATTENDANCE_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      work_date: row.date,
      entry_time: row.entryTime || null,
      exit_time: row.exitTime || null,
      total_hours: row.totalHours,
      missing_hours: row.missingHours,
      overtime_hours: row.overtimeHours,
      status: row.status,
      signature: row.signature || null,
      notes: row.notes || null
    });
    if (error) {
      notifyError(t('hr.attendance_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    setAttendanceForm({
      employeeId: '',
      date: todayIso(),
      entryTime: '',
      exitTime: '',
      signature: '',
      notes: ''
    });
    notifySuccess(t('hr.attendance_save_success'));
  };

  const generateAutoAttendance = async () => {
    if (!attendanceForm.date) {
      notifyWarning(t('hr.attendance_auto_date_required'));
      return;
    }

    const rows = employees.map((employee) => {
      const existing = attendance.find(
        (record) => record.employeeId === employee.id && record.date === attendanceForm.date
      );
      const computed = evaluateAttendanceStatus(
        employee,
        attendanceForm.date,
        existing?.entryTime || '',
        existing?.exitTime || ''
      );

      return {
        employee_id: employee.id,
        employee_name: employee.fullName,
        work_date: attendanceForm.date,
        entry_time: existing?.entryTime || null,
        exit_time: existing?.exitTime || null,
        total_hours: computed.totalHours,
        missing_hours: computed.missingHours,
        overtime_hours: computed.overtimeHours,
        status: computed.status,
        signature: existing?.signature || null,
        notes: existing?.notes || 'Marcacao automatica.'
      };
    });

    const { error } = await supabase
      .from(HR_ATTENDANCE_TABLE)
      .upsert(rows, { onConflict: 'employee_id,work_date' });
    if (error) {
      notifyError(t('hr.attendance_auto_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    notifySuccess(t('hr.attendance_auto_success'));
  };

  const handleVacationSubmit = async () => {
    const employee = employeeById.get(vacationForm.employeeId);
    if (!employee || !vacationForm.startDate || !vacationForm.returnDate) {
      notifyWarning(t('hr.vacation_required'));
      return;
    }

    const totalDays = daysBetween(vacationForm.startDate, vacationForm.returnDate, false);
    if (totalDays <= 0) {
      notifyWarning(t('hr.vacation_invalid_range'));
      return;
    }

    const proportionalBase = (employee.salary / 30) * totalDays;
    const subsidy = vacationForm.payOneThird
      ? (proportionalBase * vacationSubsidyPercent) / 100
      : 0;

    const row: VacationRecord = {
      id: `vac-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      role: employee.role,
      department: employee.department,
      admissionDate: employee.admissionDate,
      startDate: vacationForm.startDate,
      returnDate: vacationForm.returnDate,
      totalDays,
      isSplit: vacationForm.isSplit,
      payOneThird: vacationForm.payOneThird,
      advance13th: vacationForm.advance13th,
      paymentDate: vacationForm.paymentDate,
      notes: vacationForm.notes,
      employeeSignature: vacationForm.employeeSignature,
      supervisorSignature: vacationForm.supervisorSignature,
      subsidy,
      status: vacationForm.status
    };

    const { error } = await supabase.from(HR_VACATIONS_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      role: row.role,
      department: row.department,
      admission_date: row.admissionDate,
      start_date: row.startDate,
      return_date: row.returnDate,
      total_days: row.totalDays,
      is_split: row.isSplit,
      pay_one_third: row.payOneThird,
      advance_13th: row.advance13th,
      payment_date: row.paymentDate || null,
      notes: row.notes || null,
      employee_signature: row.employeeSignature || null,
      supervisor_signature: row.supervisorSignature || null,
      subsidy: row.subsidy,
      status: row.status
    });
    if (error) {
      notifyError(t('hr.vacation_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    setVacationForm({
      employeeId: '',
      startDate: '',
      returnDate: '',
      isSplit: false,
      payOneThird: true,
      advance13th: false,
      paymentDate: '',
      notes: '',
      employeeSignature: '',
      supervisorSignature: '',
      status: 'PROGRAMADA'
    });
    notifySuccess(t('hr.vacation_save_success'));
  };

  const handleEvaluationSubmit = async () => {
    const employee = employeeById.get(evaluationForm.employeeId);
    if (!employee || !evaluationForm.evaluatorName || !evaluationForm.evaluationDate) {
      notifyWarning(t('hr.evaluation_required'));
      return;
    }

    const scores = [
      evaluationForm.punctuality,
      evaluationForm.attendance,
      evaluationForm.taskCompletion,
      evaluationForm.productivity,
      evaluationForm.workQuality,
      evaluationForm.teamwork,
      evaluationForm.responsibility,
      evaluationForm.commitment,
      evaluationForm.communication
    ];

    const finalScore = Number((scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2));

    let conclusion: EvaluationConclusion = 'INSATISFATORIO';
    if (finalScore >= 9) conclusion = 'EXCELENTE';
    else if (finalScore >= 7) conclusion = 'APROVADO';
    else if (finalScore >= 5) conclusion = 'REQUER_MELHORIAS';

    const row: EvaluationRecord = {
      id: `eva-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      role: employee.role,
      department: employee.department,
      evaluationDate: evaluationForm.evaluationDate,
      evaluatorName: evaluationForm.evaluatorName,
      punctuality: evaluationForm.punctuality,
      attendance: evaluationForm.attendance,
      taskCompletion: evaluationForm.taskCompletion,
      productivity: evaluationForm.productivity,
      workQuality: evaluationForm.workQuality,
      teamwork: evaluationForm.teamwork,
      responsibility: evaluationForm.responsibility,
      commitment: evaluationForm.commitment,
      communication: evaluationForm.communication,
      strengths: evaluationForm.strengths,
      improvements: evaluationForm.improvements,
      evaluatorComments: evaluationForm.evaluatorComments,
      finalScore,
      conclusion
    };

    const { error } = await supabase.from(HR_EVALUATIONS_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      role: row.role,
      department: row.department,
      evaluation_date: row.evaluationDate,
      evaluator_name: row.evaluatorName,
      punctuality: row.punctuality,
      attendance: row.attendance,
      task_completion: row.taskCompletion,
      productivity: row.productivity,
      work_quality: row.workQuality,
      teamwork: row.teamwork,
      responsibility: row.responsibility,
      commitment: row.commitment,
      communication: row.communication,
      strengths: row.strengths || null,
      improvements: row.improvements || null,
      evaluator_comments: row.evaluatorComments || null,
      final_score: row.finalScore,
      conclusion: row.conclusion
    });
    if (error) {
      notifyError(t('hr.evaluation_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    notifySuccess(t('hr.evaluation_save_success'));
  };

  const handleTrainingSubmit = async () => {
    const employee = employeeById.get(trainingForm.employeeId);
    if (!employee || !trainingForm.title || !trainingForm.startDate || !trainingForm.endDate) {
      notifyWarning(t('hr.training_required'));
      return;
    }

    const row: TrainingRecord = {
      id: `trn-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      role: employee.role,
      department: employee.department,
      title: trainingForm.title,
      trainingType: trainingForm.trainingType,
      objective: trainingForm.objective,
      instructor: trainingForm.instructor,
      location: trainingForm.location,
      startDate: trainingForm.startDate,
      endDate: trainingForm.endDate,
      workloadHours: parseNumber(trainingForm.workloadHours),
      content: trainingForm.content,
      participationScore: parseNumber(trainingForm.participationScore),
      hasCertificate: trainingForm.hasCertificate,
      status: trainingForm.status
    };

    const { error } = await supabase.from(HR_TRAININGS_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      role: row.role,
      department: row.department,
      title: row.title,
      training_type: row.trainingType,
      objective: row.objective || null,
      instructor: row.instructor || null,
      location: row.location || null,
      start_date: row.startDate,
      end_date: row.endDate,
      workload_hours: row.workloadHours,
      content: row.content || null,
      participation_score: row.participationScore,
      has_certificate: row.hasCertificate,
      status: row.status
    });
    if (error) {
      notifyError(t('hr.training_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    notifySuccess(t('hr.training_save_success'));
  };

  const handlePayrollSubmit = async () => {
    const employee = employeeById.get(payrollForm.employeeId);
    if (!employee || !payrollForm.periodReference) {
      notifyWarning(t('hr.payroll_required'));
      return;
    }

    const overtimeTotal = parseNumber(payrollForm.overtimeQty) * parseNumber(payrollForm.overtimeHourValue);

    const totalEarnings =
      parseNumber(payrollForm.baseSalary) +
      overtimeTotal +
      parseNumber(payrollForm.nightAllowance) +
      parseNumber(payrollForm.commissions) +
      parseNumber(payrollForm.bonuses) +
      parseNumber(payrollForm.vacationProportional) +
      parseNumber(payrollForm.thirteenthAdvance);

    const totalDeductions =
      parseNumber(payrollForm.inss) +
      parseNumber(payrollForm.irt) +
      parseNumber(payrollForm.absences) +
      parseNumber(payrollForm.transportVoucher) +
      parseNumber(payrollForm.mealVoucher) +
      parseNumber(payrollForm.advances) +
      parseNumber(payrollForm.otherDiscounts);

    const row: PayrollRecord = {
      id: `pay-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      role: employee.role,
      department: employee.department,
      employeeCode: employee.employeeCode,
      admissionDate: employee.admissionDate,
      periodReference: payrollForm.periodReference,
      baseSalary: parseNumber(payrollForm.baseSalary),
      overtimeQty: parseNumber(payrollForm.overtimeQty),
      overtimeHourValue: parseNumber(payrollForm.overtimeHourValue),
      nightAllowance: parseNumber(payrollForm.nightAllowance),
      commissions: parseNumber(payrollForm.commissions),
      bonuses: parseNumber(payrollForm.bonuses),
      vacationProportional: parseNumber(payrollForm.vacationProportional),
      thirteenthAdvance: parseNumber(payrollForm.thirteenthAdvance),
      inss: parseNumber(payrollForm.inss),
      irt: parseNumber(payrollForm.irt),
      absences: parseNumber(payrollForm.absences),
      transportVoucher: parseNumber(payrollForm.transportVoucher),
      mealVoucher: parseNumber(payrollForm.mealVoucher),
      advances: parseNumber(payrollForm.advances),
      otherDiscounts: parseNumber(payrollForm.otherDiscounts),
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      netSalary: Number((totalEarnings - totalDeductions).toFixed(2)),
      bank: payrollForm.bank,
      agency: payrollForm.agency,
      iban: normalizeIban(payrollForm.iban),
      paymentMethod: payrollForm.paymentMethod,
      employeeSignature: payrollForm.employeeSignature,
      hrSignature: payrollForm.hrSignature,
      issueDate: payrollForm.issueDate
    };

    const { error } = await supabase.from(HR_PAYROLLS_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      role: row.role,
      department: row.department,
      employee_code: row.employeeCode,
      admission_date: row.admissionDate,
      period_reference: row.periodReference,
      base_salary: row.baseSalary,
      overtime_qty: row.overtimeQty,
      overtime_hour_value: row.overtimeHourValue,
      night_allowance: row.nightAllowance,
      commissions: row.commissions,
      bonuses: row.bonuses,
      vacation_proportional: row.vacationProportional,
      thirteenth_advance: row.thirteenthAdvance,
      inss: row.inss,
      irt: row.irt,
      absences: row.absences,
      transport_voucher: row.transportVoucher,
      meal_voucher: row.mealVoucher,
      advances: row.advances,
      other_discounts: row.otherDiscounts,
      total_earnings: row.totalEarnings,
      total_deductions: row.totalDeductions,
      net_salary: row.netSalary,
      bank: row.bank || null,
      agency: row.agency || null,
      iban: row.iban,
      payment_method: row.paymentMethod,
      employee_signature: row.employeeSignature || null,
      hr_signature: row.hrSignature || null,
      issue_date: row.issueDate
    });
    if (error) {
      notifyError(t('hr.payroll_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    notifySuccess(t('hr.payroll_save_success'));
  };

  const handleLeaveSubmit = async () => {
    const employee = employeeById.get(leaveForm.employeeId);
    if (!employee || !leaveForm.startDate || !leaveForm.returnDate) {
      notifyWarning(t('hr.leave_required'));
      return;
    }

    const row: LeaveRecord = {
      id: `lev-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      returnDate: leaveForm.returnDate,
      documentName: leaveForm.documentName,
      notes: leaveForm.notes
    };

    const { error } = await supabase.from(HR_LEAVES_TABLE).insert({
      employee_id: row.employeeId,
      employee_name: row.employeeName,
      leave_type: row.leaveType,
      start_date: row.startDate,
      return_date: row.returnDate,
      document_name: row.documentName || null,
      notes: row.notes || null
    });
    if (error) {
      notifyError(t('hr.leave_save_error', { message: error.message }));
      return;
    }

    await fetchHrDataFromSupabase();
    setLeaveForm({
      employeeId: '',
      leaveType: 'LICENCA_MEDICA',
      startDate: '',
      returnDate: '',
      documentName: '',
      notes: ''
    });
    notifySuccess(t('hr.leave_save_success'));
  };

  const exportPayroll = () => {
    const html = `
      <html>
        <head>
          <title>${t('hr.payroll_report_title')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>${t('hr.payroll_report_heading')}</h2>
          <p>${t('hr.generated_at')}: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>${t('hr.table_name')}</th>
                <th>${t('hr.table_period')}</th>
                <th class="right">${t('hr.table_earnings')}</th>
                <th class="right">${t('hr.table_discounts')}</th>
                <th class="right">${t('hr.table_net')}</th>
              </tr>
            </thead>
            <tbody>
              ${payrolls
                .map(
                  (row) => `<tr><td>${row.id}</td><td>${row.employeeName}</td><td>${row.periodReference}</td><td class="right">${formatKz(row.totalEarnings)}</td><td class="right">${formatKz(row.totalDeductions)}</td><td class="right">${formatKz(row.netSalary)}</td></tr>`
                )
                .join('')}
            </tbody>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `;

    const opened = openPrintWindow(html, { width: 1000, height: 700 });
    if (!opened) notifyWarning(t('hr.print_popup_blocked'));
  };

  const sectionItems: Array<{ id: HrSection; label: string; icon: React.ElementType }> = [
    { id: 'overview', label: t('hr.section_overview'), icon: LayoutDashboard },
    { id: 'employees', label: t('hr.section_employees'), icon: Users },
    { id: 'attendance', label: t('hr.section_attendance'), icon: Clock3 },
    { id: 'vacations', label: t('hr.section_vacations'), icon: CalendarDays },
    { id: 'evaluation', label: t('hr.section_evaluation'), icon: ClipboardCheck },
    { id: 'training', label: t('hr.section_training'), icon: GraduationCap },
    { id: 'payroll', label: t('hr.section_payroll'), icon: Wallet },
    { id: 'leaves', label: t('hr.section_leaves'), icon: FileMinus }
  ];

  return (
    <div className="space-y-6 hr-contrast">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('hr.title')}</h1>
          <p className="text-sm text-gray-500">{t('hr.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="text-amber-600" />
          {t('hr.vacation_subsidy_active')}: <span className="font-semibold">{vacationSubsidyPercent}%</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl p-3 overflow-x-auto">
        <div className="flex flex-nowrap gap-1 min-w-max">
          {sectionItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium leading-none flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeSection === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={13} /> {item.label}
            </button>
          ))}
        </div>
      </div>

      {loadingRemote && (
        <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          {t('hr.sync_in_progress')}
        </div>
      )}

      {activeSection === 'overview' && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <h2 className="font-bold text-gray-900">{t('hr.overview_title')}</h2>
              <p className="text-xs text-gray-500">{t('hr.overview_description')}</p>
            </div>
            <button
              onClick={() => void fetchHrDataFromSupabase()}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg"
            >
              {t('hr.overview_refresh')}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3"><p className="text-xs text-gray-500">{t('hr.kpi_total_employees')}</p><p className="text-xl font-bold text-gray-900">{kpiEmployeesTotal}</p></div>
            <div className="rounded-lg border border-green-100 bg-green-50 p-3"><p className="text-xs text-green-700">{t('hr.kpi_active')}</p><p className="text-xl font-bold text-green-700">{kpiEmployeesActive}</p></div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 p-3"><p className="text-xs text-amber-700">{t('hr.kpi_on_leave')}</p><p className="text-xl font-bold text-amber-700">{kpiEmployeesOnLeave}</p></div>
            <div className="rounded-lg border border-red-100 bg-red-50 p-3"><p className="text-xs text-red-700">{t('hr.kpi_dismissed')}</p><p className="text-xl font-bold text-red-700">{kpiEmployeesDismissed}</p></div>
            <div className="rounded-lg border border-orange-100 bg-orange-50 p-3"><p className="text-xs text-orange-700">{t('hr.kpi_overdue_vacations')}</p><p className="text-xl font-bold text-orange-700">{kpiVacationsDue}</p></div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><p className="text-xs text-blue-700">{t('hr.kpi_training_in_progress')}</p><p className="text-xl font-bold text-blue-700">{kpiTrainingInProgress}</p></div>
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3"><p className="text-xs text-indigo-700">{t('hr.kpi_leaves_today')}</p><p className="text-xl font-bold text-indigo-700">{kpiLeavesOpen}</p></div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3"><p className="text-xs text-emerald-700">{t('hr.kpi_payroll_net', { period: currentPeriod })}</p><p className="text-lg font-bold text-emerald-700">{formatKz(kpiPayrollNetCurrentPeriod)}</p></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-100 rounded-lg p-3">
              <p className="text-sm font-semibold text-gray-900 mb-2">{t('hr.department_distribution')}</p>
              <div className="space-y-2">
                {departmentDistribution.map((item) => {
                  const max = Math.max(1, ...departmentDistribution.map((entry) => entry.total));
                  const pct = (item.total / max) * 100;
                  return (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>{item.name}</span>
                        <span>{item.total}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {departmentDistribution.length === 0 && <p className="text-xs text-gray-500">{t('hr.department_no_data')}</p>}
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg p-3 space-y-3">
              <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">{t('hr.tenure')}</p>
                <div className="grid grid-cols-3 gap-2">
                  {tenureBuckets.map((bucket) => (
                    <div key={bucket.label} className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
                      <p className="text-xs text-gray-500">{bucket.label}</p>
                      <p className="text-lg font-bold text-gray-900">{bucket.total}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-2">{t('hr.alerts_title')}</p>
                <div className="space-y-2">
                  {overviewAlerts.map((alert, index) => (
                    <div
                      key={`${alert.message}-${index}`}
                      className={`text-xs px-2 py-1.5 rounded-lg border ${
                        alert.level === 'warn'
                          ? 'bg-amber-50 border-amber-100 text-amber-700'
                          : alert.level === 'ok'
                            ? 'bg-green-50 border-green-100 text-green-700'
                            : 'bg-blue-50 border-blue-100 text-blue-700'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'employees' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('employees')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.employees ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.employees && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_employee_title')}</h2></div>

            <div className="lg:col-span-3 text-sm font-medium text-gray-700">1) Informacoes Pessoais</div>
            <input value={employeeForm.fullName} onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })} placeholder="Nome completo" className="border border-gray-200 rounded-lg p-2 text-sm" />
            <input type="date" value={employeeForm.birthDate} onChange={(e) => setEmployeeForm({ ...employeeForm, birthDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
            <input value={employeeForm.documentId} onChange={(e) => setEmployeeForm({ ...employeeForm, documentId: e.target.value })} placeholder="BI / Documento" className="border border-gray-200 rounded-lg p-2 text-sm" />
            <input value={employeeForm.phone} onChange={(e) => setEmployeeForm({ ...employeeForm, phone: normalizePhone(e.target.value) })} placeholder="Telefone" className="border border-gray-200 rounded-lg p-2 text-sm" />
            <input value={employeeForm.email} onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })} placeholder="E-mail" className="border border-gray-200 rounded-lg p-2 text-sm" />

            <div className="lg:col-span-3 text-sm font-medium text-gray-700 mt-1">2) Area de Trabalho</div>
            <select
              value={employeeForm.role}
              onChange={(e) =>
                setEmployeeForm({
                  ...employeeForm,
                  role: e.target.value,
                  department: getDepartmentFromRole(e.target.value)
                })
              }
              className="border border-gray-200 rounded-lg p-2 text-sm"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
            <input value={employeeForm.department} readOnly className="border border-gray-200 rounded-lg p-2 text-sm bg-gray-50" />
            <select value={employeeForm.workRegime} onChange={(e) => setEmployeeForm({ ...employeeForm, workRegime: e.target.value as WorkRegime })} className="border border-gray-200 rounded-lg p-2 text-sm">
              {WORK_REGIME_OPTIONS.map((regime) => (
                <option key={regime} value={regime}>{t(workRegimeKey[regime])}</option>
              ))}
            </select>

            <div className="lg:col-span-3 text-sm font-medium text-gray-700 mt-1">3) Informacoes Administrativas</div>
            <select value={employeeForm.contractType} onChange={(e) => setEmployeeForm({ ...employeeForm, contractType: e.target.value as ContractType })} className="border border-gray-200 rounded-lg p-2 text-sm">
              {CONTRACT_OPTIONS.map((contract) => (
                <option key={contract} value={contract}>{contract}</option>
              ))}
            </select>
            <input type="date" value={employeeForm.admissionDate} onChange={(e) => setEmployeeForm({ ...employeeForm, admissionDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
            <input value={employeeForm.iban} onChange={(e) => setEmployeeForm({ ...employeeForm, iban: normalizeIban(e.target.value) })} placeholder="IBAN" className="border border-gray-200 rounded-lg p-2 text-sm" />
            <select value={employeeForm.status} onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value as EmployeeStatus })} className="border border-gray-200 rounded-lg p-2 text-sm">
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input type="number" value={employeeForm.salary} onChange={(e) => setEmployeeForm({ ...employeeForm, salary: parseNumber(e.target.value) })} placeholder="Salario" className="border border-gray-200 rounded-lg p-2 text-sm" />

              <div className="lg:col-span-3 flex gap-2 justify-end">
                {editingEmployeeId && <button onClick={resetEmployeeForm} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">{t('hr.cancel_edit')}</button>}
                <button onClick={handleEmployeeSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {editingEmployeeId ? t('hr.update') : t('common.save')}</button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900">{t('hr.table_employees_title')}</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                  <input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder={t('header.search_placeholder')} className="pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg" />
                </div>
                <label className="text-xs text-gray-600 flex items-center gap-2">
                  <input type="checkbox" checked={showVacationDueOnly} onChange={(e) => setShowVacationDueOnly(e.target.checked)} />
                  {t('hr.only_overdue_vacations')}
                </label>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Cargo</th>
                    <th className="px-3 py-2">Departamento</th>
                    <th className="px-3 py-2">Salario</th>
                    <th className="px-3 py-2">Telefone</th>
                    <th className="px-3 py-2">BI</th>
                    <th className="px-3 py-2">Admissao</th>
                    <th className="px-3 py-2 text-right">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employeesFiltered.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{employee.employeeCode}</td>
                      <td className="px-3 py-2">{employee.fullName}</td>
                      <td className="px-3 py-2">{employee.role}</td>
                      <td className="px-3 py-2">{employee.department}</td>
                      <td className="px-3 py-2">{formatKz(employee.salary)}</td>
                      <td className="px-3 py-2">{employee.phone}</td>
                      <td className="px-3 py-2">{employee.documentId}</td>
                      <td className="px-3 py-2">{employee.admissionDate}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => handleEmployeeEdit(employee)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 dark:focus-visible:ring-blue-400/60 text-xs font-medium mr-1"
                        >
                          {t('common.edit')}
                        </button>
                        <button
                          onClick={() => void handleEmployeeDelete(employee)}
                          className="inline-flex items-center px-2 py-1 rounded-md text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 dark:focus-visible:ring-red-400/60 text-xs font-medium"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {employeesFiltered.length === 0 && <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">{t('hr.no_employees')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('attendance')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.attendance ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.attendance && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_attendance_title')}</h2></div>
              <select value={attendanceForm.employeeId} onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm">
                <option value="">{t('hr.option_employee_name')}</option>
                {employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              <input type="date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="time" value={attendanceForm.entryTime} onChange={(e) => setAttendanceForm({ ...attendanceForm, entryTime: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="time" value={attendanceForm.exitTime} onChange={(e) => setAttendanceForm({ ...attendanceForm, exitTime: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={attendanceForm.signature} onChange={(e) => setAttendanceForm({ ...attendanceForm, signature: e.target.value })} placeholder={t('hr.employee_signature')} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={attendanceForm.notes} onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} placeholder={t('hr.notes')} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3" />
              <div className="md:col-span-3 flex gap-2 justify-end">
                <button onClick={generateAutoAttendance} className="px-3 py-2 text-sm border border-gray-200 rounded-lg">{t('hr.generate_auto_attendance')}</button>
                <button onClick={handleAttendanceSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('common.save')}</button>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nome</th>
                  <th className="px-3 py-2">Entrada</th>
                  <th className="px-3 py-2">Saida</th>
                  <th className="px-3 py-2">Total Horas</th>
                  <th className="px-3 py-2">Total em Falta</th>
                  <th className="px-3 py-2">Hora Extra</th>
                  <th className="px-3 py-2">Status Diario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendance.map((item) => {
                  const totals = attendanceByEmployee.get(item.employeeId) || { missing: 0, overtime: 0 };
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{item.id}</td>
                      <td className="px-3 py-2">{item.employeeName}</td>
                      <td className="px-3 py-2">{item.entryTime || '-'}</td>
                      <td className="px-3 py-2">{item.exitTime || '-'}</td>
                      <td className="px-3 py-2">{item.totalHours.toFixed(2)}h</td>
                      <td className="px-3 py-2">{totals.missing.toFixed(2)}h</td>
                      <td className="px-3 py-2">{totals.overtime.toFixed(2)}h</td>
                      <td className="px-3 py-2">{t(attendanceStatusKey[item.status])}</td>
                    </tr>
                  );
                })}
                {attendance.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">{t('hr.no_attendance')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'vacations' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('vacations')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.vacations ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.vacations && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_vacations_title')}</h2></div>
              <select value={vacationForm.employeeId} onChange={(e) => setVacationForm({ ...vacationForm, employeeId: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3">
                <option value="">{t('hr.option_employee_name')}</option>
                {employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              <input type="date" value={vacationForm.startDate} onChange={(e) => setVacationForm({ ...vacationForm, startDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="date" value={vacationForm.returnDate} onChange={(e) => setVacationForm({ ...vacationForm, returnDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={String(daysBetween(vacationForm.startDate, vacationForm.returnDate, false))} readOnly className="border border-gray-200 rounded-lg p-2 text-sm bg-gray-50" />
              <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" checked={vacationForm.isSplit} onChange={(e) => setVacationForm({ ...vacationForm, isSplit: e.target.checked })} /> {t('hr.vacation_split')}</label>
              <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" checked={vacationForm.payOneThird} onChange={(e) => setVacationForm({ ...vacationForm, payOneThird: e.target.checked })} /> Pagamento com 1/3</label>
              <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" checked={vacationForm.advance13th} onChange={(e) => setVacationForm({ ...vacationForm, advance13th: e.target.checked })} /> Adiantamento 13o</label>
              <input type="date" value={vacationForm.paymentDate} onChange={(e) => setVacationForm({ ...vacationForm, paymentDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={vacationForm.employeeSignature} onChange={(e) => setVacationForm({ ...vacationForm, employeeSignature: e.target.value })} placeholder="Assinatura Funcionario" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={vacationForm.supervisorSignature} onChange={(e) => setVacationForm({ ...vacationForm, supervisorSignature: e.target.value })} placeholder="Assinatura Supervisor/RH" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <textarea value={vacationForm.notes} onChange={(e) => setVacationForm({ ...vacationForm, notes: e.target.value })} placeholder={t('hr.notes')} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <div className="md:col-span-3 flex justify-end"><button onClick={handleVacationSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('hr.save_vacations')}</button></div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">{t('hr.table_name')}</th><th className="px-3 py-2">{t('hr.table_start')}</th><th className="px-3 py-2">{t('hr.table_return')}</th><th className="px-3 py-2">{t('hr.table_days')}</th><th className="px-3 py-2">{t('hr.table_vacation_allowance')}</th><th className="px-3 py-2">{t('hr.table_status')}</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vacations.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50"><td className="px-3 py-2">{item.id}</td><td className="px-3 py-2">{item.employeeName}</td><td className="px-3 py-2">{item.startDate}</td><td className="px-3 py-2">{item.returnDate}</td><td className="px-3 py-2">{item.totalDays}</td><td className="px-3 py-2">{formatKz(item.subsidy)}</td><td className="px-3 py-2">{item.status}</td></tr>
                ))}
                {vacations.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">{t('hr.no_vacations')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'evaluation' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('evaluation')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.evaluation ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.evaluation && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_evaluation_title')}</h2></div>
              <select value={evaluationForm.employeeId} onChange={(e) => setEvaluationForm({ ...evaluationForm, employeeId: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm">
                <option value="">{t('hr.option_employee_name')}</option>
                {employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              <input type="date" value={evaluationForm.evaluationDate} onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluationDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={evaluationForm.evaluatorName} onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorName: e.target.value })} placeholder="Nome do Avaliador" className="border border-gray-200 rounded-lg p-2 text-sm" />

              {[
                ['Pontualidade', 'punctuality'],
                ['Assiduidade', 'attendance'],
                ['Cumprimento de Tarefas', 'taskCompletion'],
                ['Produtividade', 'productivity'],
                ['Qualidade do Trabalho', 'workQuality'],
                ['Trabalho em Equipe', 'teamwork'],
                ['Responsabilidade', 'responsibility'],
                ['Comprometimento', 'commitment'],
                ['Comunicacao', 'communication']
              ].map(([label, key]) => (
                <label key={key} className="text-sm text-gray-700">
                  {label}
                  <input type="number" min={1} max={10} value={(evaluationForm as any)[key]} onChange={(e) => setEvaluationForm({ ...evaluationForm, [key]: parseNumber(e.target.value) })} className="mt-1 w-full border border-gray-200 rounded-lg p-2 text-sm" />
                </label>
              ))}

              <textarea value={evaluationForm.strengths} onChange={(e) => setEvaluationForm({ ...evaluationForm, strengths: e.target.value })} placeholder="Pontos fortes" className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <textarea value={evaluationForm.improvements} onChange={(e) => setEvaluationForm({ ...evaluationForm, improvements: e.target.value })} placeholder="Pontos a melhorar" className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <textarea value={evaluationForm.evaluatorComments} onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluatorComments: e.target.value })} placeholder="Comentarios do avaliador" className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <div className="md:col-span-3 flex justify-end"><button onClick={handleEvaluationSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('hr.save_evaluation')}</button></div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Data</th><th className="px-3 py-2">Nota Final</th><th className="px-3 py-2">Conclusao</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{evaluations.map((item) => <tr key={item.id} className="hover:bg-gray-50"><td className="px-3 py-2">{item.id}</td><td className="px-3 py-2">{item.employeeName}</td><td className="px-3 py-2">{item.evaluationDate}</td><td className="px-3 py-2">{item.finalScore}</td><td className="px-3 py-2">{item.conclusion}</td></tr>)}{evaluations.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">{t('hr.no_evaluations')}</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'training' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('training')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.training ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.training && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_training_title')}</h2></div>
              <select value={trainingForm.employeeId} onChange={(e) => setTrainingForm({ ...trainingForm, employeeId: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm"><option value="">{t('hr.option_employee_name')}</option>{employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select>
              <input value={trainingForm.title} onChange={(e) => setTrainingForm({ ...trainingForm, title: e.target.value })} placeholder="Titulo do Treinamento" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <select value={trainingForm.trainingType} onChange={(e) => setTrainingForm({ ...trainingForm, trainingType: e.target.value as TrainingType })} className="border border-gray-200 rounded-lg p-2 text-sm">{TRAINING_TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
              <input value={trainingForm.objective} onChange={(e) => setTrainingForm({ ...trainingForm, objective: e.target.value })} placeholder="Objetivo" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={trainingForm.instructor} onChange={(e) => setTrainingForm({ ...trainingForm, instructor: e.target.value })} placeholder="Instrutor" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={trainingForm.location} onChange={(e) => setTrainingForm({ ...trainingForm, location: e.target.value })} placeholder="Local" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="date" value={trainingForm.startDate} onChange={(e) => setTrainingForm({ ...trainingForm, startDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="date" value={trainingForm.endDate} onChange={(e) => setTrainingForm({ ...trainingForm, endDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={trainingForm.workloadHours} onChange={(e) => setTrainingForm({ ...trainingForm, workloadHours: parseNumber(e.target.value) })} placeholder="Carga Horaria" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={trainingForm.participationScore} onChange={(e) => setTrainingForm({ ...trainingForm, participationScore: parseNumber(e.target.value) })} placeholder="Participacao (%)" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <label className="text-sm text-gray-700 flex items-center gap-2"><input type="checkbox" checked={trainingForm.hasCertificate} onChange={(e) => setTrainingForm({ ...trainingForm, hasCertificate: e.target.checked })} /> Certificado</label>
              <select value={trainingForm.status} onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value as TrainingStatus })} className="border border-gray-200 rounded-lg p-2 text-sm">{TRAINING_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
              <textarea value={trainingForm.content} onChange={(e) => setTrainingForm({ ...trainingForm, content: e.target.value })} placeholder="Conteudo Programatico" className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <div className="md:col-span-3 flex justify-end"><button onClick={handleTrainingSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('hr.save_training')}</button></div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Titulo</th><th className="px-3 py-2">Tipo</th><th className="px-3 py-2">Inicio</th><th className="px-3 py-2">Termino</th><th className="px-3 py-2">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{trainings.map((item) => <tr key={item.id}><td className="px-3 py-2">{item.id}</td><td className="px-3 py-2">{item.employeeName}</td><td className="px-3 py-2">{item.title}</td><td className="px-3 py-2">{item.trainingType}</td><td className="px-3 py-2">{item.startDate}</td><td className="px-3 py-2">{item.endDate}</td><td className="px-3 py-2">{item.status}</td></tr>)}{trainings.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">{t('hr.no_trainings')}</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'payroll' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button onClick={exportPayroll} className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"><Printer size={14} /> {t('hr.print')}</button>
            <button
              onClick={() => toggleForm('payroll')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.payroll ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.payroll && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_payroll_title')}</h2></div>
              <select value={payrollForm.employeeId} onChange={(e) => { const employee = employeeById.get(e.target.value); setPayrollForm({ ...payrollForm, employeeId: e.target.value, baseSalary: employee?.salary || 0, iban: employee?.iban || 'AO06' }); }} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-2">
                <option value="">{t('hr.option_employee_name')}</option>
                {employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}
              </select>
              <input type="month" value={payrollForm.periodReference} onChange={(e) => setPayrollForm({ ...payrollForm, periodReference: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />

              <input type="number" value={payrollForm.baseSalary} onChange={(e) => setPayrollForm({ ...payrollForm, baseSalary: parseNumber(e.target.value) })} placeholder="Salario Base" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.overtimeQty} onChange={(e) => setPayrollForm({ ...payrollForm, overtimeQty: parseNumber(e.target.value) })} placeholder="Horas Extras (qtd)" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.overtimeHourValue} onChange={(e) => setPayrollForm({ ...payrollForm, overtimeHourValue: parseNumber(e.target.value) })} placeholder="Valor Hora Extra" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.nightAllowance} onChange={(e) => setPayrollForm({ ...payrollForm, nightAllowance: parseNumber(e.target.value) })} placeholder="Adicional Noturno" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.commissions} onChange={(e) => setPayrollForm({ ...payrollForm, commissions: parseNumber(e.target.value) })} placeholder="Comissoes" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.bonuses} onChange={(e) => setPayrollForm({ ...payrollForm, bonuses: parseNumber(e.target.value) })} placeholder="Bonus/Premios" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.vacationProportional} onChange={(e) => setPayrollForm({ ...payrollForm, vacationProportional: parseNumber(e.target.value) })} placeholder={t('hr.vacation_proportional')} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.thirteenthAdvance} onChange={(e) => setPayrollForm({ ...payrollForm, thirteenthAdvance: parseNumber(e.target.value) })} placeholder="13o Adiantamento" className="border border-gray-200 rounded-lg p-2 text-sm" />

              <input type="number" value={payrollForm.inss} onChange={(e) => setPayrollForm({ ...payrollForm, inss: parseNumber(e.target.value) })} placeholder="INSS/Seguranca Social" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.irt} onChange={(e) => setPayrollForm({ ...payrollForm, irt: parseNumber(e.target.value) })} placeholder="IRT" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.absences} onChange={(e) => setPayrollForm({ ...payrollForm, absences: parseNumber(e.target.value) })} placeholder="Faltas/Atrasos" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.transportVoucher} onChange={(e) => setPayrollForm({ ...payrollForm, transportVoucher: parseNumber(e.target.value) })} placeholder="Vale Transporte" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.mealVoucher} onChange={(e) => setPayrollForm({ ...payrollForm, mealVoucher: parseNumber(e.target.value) })} placeholder="Vale Alimentacao" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.advances} onChange={(e) => setPayrollForm({ ...payrollForm, advances: parseNumber(e.target.value) })} placeholder="Adiantamentos/Emprestimos" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="number" value={payrollForm.otherDiscounts} onChange={(e) => setPayrollForm({ ...payrollForm, otherDiscounts: parseNumber(e.target.value) })} placeholder="Outros Descontos" className="border border-gray-200 rounded-lg p-2 text-sm" />

              <input value={payrollForm.bank} onChange={(e) => setPayrollForm({ ...payrollForm, bank: e.target.value })} placeholder="Banco" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={payrollForm.agency} onChange={(e) => setPayrollForm({ ...payrollForm, agency: e.target.value })} placeholder="Agencia" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={payrollForm.iban} onChange={(e) => setPayrollForm({ ...payrollForm, iban: e.target.value })} placeholder="IBAN" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <select value={payrollForm.paymentMethod} onChange={(e) => setPayrollForm({ ...payrollForm, paymentMethod: e.target.value as PaymentMethod })} className="border border-gray-200 rounded-lg p-2 text-sm"><option value="TRANSFERENCIA">Transferencia</option><option value="CHEQUE">Cheque</option><option value="DINHEIRO">Dinheiro</option></select>
              <input type="date" value={payrollForm.issueDate} onChange={(e) => setPayrollForm({ ...payrollForm, issueDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={payrollForm.employeeSignature} onChange={(e) => setPayrollForm({ ...payrollForm, employeeSignature: e.target.value })} placeholder="Assinatura Funcionario" className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input value={payrollForm.hrSignature} onChange={(e) => setPayrollForm({ ...payrollForm, hrSignature: e.target.value })} placeholder="Assinatura RH/Contabilidade" className="border border-gray-200 rounded-lg p-2 text-sm" />

              <div className="md:col-span-3 flex justify-end"><button onClick={handlePayrollSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('hr.save_payroll')}</button></div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Salario Base</th><th className="px-3 py-2">Total Vencimentos</th><th className="px-3 py-2">Total Descontos</th><th className="px-3 py-2">Liquido</th><th className="px-3 py-2">Banco</th><th className="px-3 py-2">Agencia</th><th className="px-3 py-2">IBAN</th><th className="px-3 py-2">Forma Pgto</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{payrolls.map((item) => <tr key={item.id}><td className="px-3 py-2">{item.id}</td><td className="px-3 py-2">{item.employeeName}</td><td className="px-3 py-2">{formatKz(item.baseSalary)}</td><td className="px-3 py-2">{formatKz(item.totalEarnings)}</td><td className="px-3 py-2">{formatKz(item.totalDeductions)}</td><td className="px-3 py-2">{formatKz(item.netSalary)}</td><td className="px-3 py-2">{item.bank}</td><td className="px-3 py-2">{item.agency}</td><td className="px-3 py-2">{item.iban}</td><td className="px-3 py-2">{item.paymentMethod}</td></tr>)}{payrolls.length === 0 && <tr><td colSpan={10} className="px-3 py-6 text-center text-gray-500">{t('hr.no_payrolls')}</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => toggleForm('leaves')}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg flex items-center gap-2"
            >
              <Plus size={14} /> {formsVisible.leaves ? t('hr.hide_form') : t('hr.add_or_register')}
            </button>
          </div>
          {formsVisible.leaves && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3"><h2 className="font-bold text-gray-900">{t('hr.form_leaves_title')}</h2></div>
              <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3">{LEAVE_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{t(leaveTypeKey[type])}</option>)}</select>
              <select value={leaveForm.employeeId} onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm"><option value="">{t('hr.employee')}</option>{employeesSorted.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}</option>)}</select>
              <input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="date" value={leaveForm.returnDate} onChange={(e) => setLeaveForm({ ...leaveForm, returnDate: e.target.value })} className="border border-gray-200 rounded-lg p-2 text-sm" />
              <input type="file" onChange={(e) => setLeaveForm({ ...leaveForm, documentName: e.target.files?.[0]?.name || '' })} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3" />
              <textarea value={leaveForm.notes} onChange={(e) => setLeaveForm({ ...leaveForm, notes: e.target.value })} placeholder={t('hr.notes')} className="border border-gray-200 rounded-lg p-2 text-sm md:col-span-3 min-h-20" />
              <div className="md:col-span-3 flex justify-end"><button onClick={handleLeaveSubmit} className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save size={14} /> {t('hr.save_leave')}</button></div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">ID</th><th className="px-3 py-2">{t('hr.employee')}</th><th className="px-3 py-2">{t('hr.table_type')}</th><th className="px-3 py-2">{t('hr.table_start')}</th><th className="px-3 py-2">{t('hr.table_return')}</th><th className="px-3 py-2">{t('hr.table_document')}</th><th className="px-3 py-2">{t('hr.table_notes')}</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{leaves.map((item) => <tr key={item.id}><td className="px-3 py-2">{item.id}</td><td className="px-3 py-2">{item.employeeName}</td><td className="px-3 py-2">{t(leaveTypeKey[item.leaveType])}</td><td className="px-3 py-2">{item.startDate}</td><td className="px-3 py-2">{item.returnDate}</td><td className="px-3 py-2">{item.documentName || '-'}</td><td className="px-3 py-2">{item.notes || '-'}</td></tr>)}{leaves.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">{t('hr.no_leaves')}</td></tr>}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HR;
