-- RH module schema for FernaGest
-- Run this script in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name text not null,
  birth_date date,
  document_id text not null,
  phone text,
  email text,
  role text not null,
  department text not null default 'Administracao',
  work_regime text not null check (work_regime in ('DIARISTA', 'REGIME_TURNO', 'ESCALA_24X48')),
  contract_type text not null check (contract_type in ('CLT', 'TEMPORARIO', 'ESTAGIARIO')),
  admission_date date not null,
  iban text,
  status text not null check (status in ('ATIVO', 'AFASTADO', 'DEMITIDO')),
  salary numeric(14,2) not null default 0 check (salary >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  work_date date not null,
  entry_time text,
  exit_time text,
  total_hours numeric(8,2) not null default 0,
  missing_hours numeric(8,2) not null default 0,
  overtime_hours numeric(8,2) not null default 0,
  status text not null check (status in ('PRESENTE', 'MEIA_FALTA', 'FALTA', 'FOLGA')),
  signature text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_attendance_unique_day unique (employee_id, work_date)
);

create table if not exists public.hr_vacations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  role text not null,
  department text not null,
  admission_date date not null,
  start_date date not null,
  return_date date not null,
  total_days integer not null check (total_days > 0),
  is_split boolean not null default false,
  pay_one_third boolean not null default true,
  advance_13th boolean not null default false,
  payment_date date,
  notes text,
  employee_signature text,
  supervisor_signature text,
  subsidy numeric(14,2) not null default 0 check (subsidy >= 0),
  status text not null check (status in ('PROGRAMADA', 'APROVADA', 'CONCLUIDA')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_vacations_valid_period check (return_date >= start_date)
);

create table if not exists public.hr_evaluations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  role text not null,
  department text not null,
  evaluation_date date not null,
  evaluator_name text not null,
  punctuality numeric(4,2) not null default 0,
  attendance numeric(4,2) not null default 0,
  task_completion numeric(4,2) not null default 0,
  productivity numeric(4,2) not null default 0,
  work_quality numeric(4,2) not null default 0,
  teamwork numeric(4,2) not null default 0,
  responsibility numeric(4,2) not null default 0,
  commitment numeric(4,2) not null default 0,
  communication numeric(4,2) not null default 0,
  strengths text,
  improvements text,
  evaluator_comments text,
  final_score numeric(5,2) not null default 0,
  conclusion text not null check (conclusion in ('EXCELENTE', 'APROVADO', 'REQUER_MELHORIAS', 'INSATISFATORIO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_trainings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  role text not null,
  department text not null,
  title text not null,
  training_type text not null check (training_type in ('INTERNO', 'EXTERNO', 'ONLINE', 'PRESENCIAL')),
  objective text,
  instructor text,
  location text,
  start_date date not null,
  end_date date not null,
  workload_hours numeric(8,2) not null default 0,
  content text,
  participation_score numeric(8,2) not null default 0,
  has_certificate boolean not null default false,
  status text not null check (status in ('CONCLUIDO', 'PENDENTE', 'EM_ANDAMENTO', 'FUTURO')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_trainings_valid_period check (end_date >= start_date)
);

create table if not exists public.hr_payrolls (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  role text not null,
  department text not null,
  employee_code text not null,
  admission_date date not null,
  period_reference text not null,
  base_salary numeric(14,2) not null default 0,
  overtime_qty numeric(10,2) not null default 0,
  overtime_hour_value numeric(14,2) not null default 0,
  night_allowance numeric(14,2) not null default 0,
  commissions numeric(14,2) not null default 0,
  bonuses numeric(14,2) not null default 0,
  vacation_proportional numeric(14,2) not null default 0,
  thirteenth_advance numeric(14,2) not null default 0,
  inss numeric(14,2) not null default 0,
  irt numeric(14,2) not null default 0,
  absences numeric(14,2) not null default 0,
  transport_voucher numeric(14,2) not null default 0,
  meal_voucher numeric(14,2) not null default 0,
  advances numeric(14,2) not null default 0,
  other_discounts numeric(14,2) not null default 0,
  total_earnings numeric(14,2) not null default 0,
  total_deductions numeric(14,2) not null default 0,
  net_salary numeric(14,2) not null default 0,
  bank text,
  agency text,
  iban text,
  payment_method text not null check (payment_method in ('TRANSFERENCIA', 'CHEQUE', 'DINHEIRO')),
  employee_signature text,
  hr_signature text,
  issue_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hr_leaves (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  employee_name text not null,
  leave_type text not null check (leave_type in (
    'LICENCA_MEDICA',
    'LICENCA_MATERNIDADE',
    'LICENCA_PATERNIDADE',
    'LICENCA_CASAMENTO'
  )),
  start_date date not null,
  return_date date not null,
  document_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hr_leaves_valid_period check (return_date >= start_date)
);

alter table public.hr_leaves
drop constraint if exists hr_leaves_leave_type_check;

alter table public.hr_leaves
add constraint hr_leaves_leave_type_check
check (leave_type in (
  'LICENCA_MEDICA',
  'LICENCA_MATERNIDADE',
  'LICENCA_PATERNIDADE',
  'LICENCA_CASAMENTO'
));

drop trigger if exists trg_hr_employees_updated_at on public.hr_employees;
create trigger trg_hr_employees_updated_at
before update on public.hr_employees
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_attendance_updated_at on public.hr_attendance;
create trigger trg_hr_attendance_updated_at
before update on public.hr_attendance
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_vacations_updated_at on public.hr_vacations;
create trigger trg_hr_vacations_updated_at
before update on public.hr_vacations
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_evaluations_updated_at on public.hr_evaluations;
create trigger trg_hr_evaluations_updated_at
before update on public.hr_evaluations
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_trainings_updated_at on public.hr_trainings;
create trigger trg_hr_trainings_updated_at
before update on public.hr_trainings
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_payrolls_updated_at on public.hr_payrolls;
create trigger trg_hr_payrolls_updated_at
before update on public.hr_payrolls
for each row execute function public.set_updated_at();

drop trigger if exists trg_hr_leaves_updated_at on public.hr_leaves;
create trigger trg_hr_leaves_updated_at
before update on public.hr_leaves
for each row execute function public.set_updated_at();

create index if not exists idx_hr_employees_name on public.hr_employees(full_name);
create index if not exists idx_hr_employees_status on public.hr_employees(status);
create index if not exists idx_hr_employees_admission on public.hr_employees(admission_date);
create index if not exists idx_hr_attendance_date on public.hr_attendance(work_date);
create index if not exists idx_hr_vacations_dates on public.hr_vacations(start_date, return_date);
create index if not exists idx_hr_evaluations_date on public.hr_evaluations(evaluation_date);
create index if not exists idx_hr_trainings_dates on public.hr_trainings(start_date, end_date);
create index if not exists idx_hr_payrolls_period on public.hr_payrolls(period_reference);
create index if not exists idx_hr_leaves_dates on public.hr_leaves(start_date, return_date);

alter table public.hr_employees enable row level security;
alter table public.hr_attendance enable row level security;
alter table public.hr_vacations enable row level security;
alter table public.hr_evaluations enable row level security;
alter table public.hr_trainings enable row level security;
alter table public.hr_payrolls enable row level security;
alter table public.hr_leaves enable row level security;

drop policy if exists hr_employees_rw_all on public.hr_employees;
create policy hr_employees_rw_all
on public.hr_employees
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_attendance_rw_all on public.hr_attendance;
create policy hr_attendance_rw_all
on public.hr_attendance
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_vacations_rw_all on public.hr_vacations;
create policy hr_vacations_rw_all
on public.hr_vacations
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_evaluations_rw_all on public.hr_evaluations;
create policy hr_evaluations_rw_all
on public.hr_evaluations
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_trainings_rw_all on public.hr_trainings;
create policy hr_trainings_rw_all
on public.hr_trainings
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_payrolls_rw_all on public.hr_payrolls;
create policy hr_payrolls_rw_all
on public.hr_payrolls
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

drop policy if exists hr_leaves_rw_all on public.hr_leaves;
create policy hr_leaves_rw_all
on public.hr_leaves
for all
using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));
