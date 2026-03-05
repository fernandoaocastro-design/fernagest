-- Multi-tenant patch for existing module tables.
-- Run this script after creating module tables (products/customers/finance/sales/purchases/hr).
-- Requires: supabase/sql/multi_tenant_base.sql

do $$
declare
  target_tables text[] := array[
    'products',
    'customers',
    'financial_transactions',
    'suppliers',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'hr_employees',
    'hr_attendance',
    'hr_vacations',
    'hr_evaluations',
    'hr_trainings',
    'hr_payrolls',
    'hr_leaves'
  ];
  table_name text;
  policy_row record;
  company_count integer;
  single_company_id uuid;
begin
  select count(*)
  into company_count
  from public.companies;

  if company_count = 1 then
    select id
    into single_company_id
    from public.companies
    limit 1;
  end if;

  foreach table_name in array target_tables loop
    if to_regclass('public.' || table_name) is null then
      continue;
    end if;

    execute format(
      'alter table public.%I add column if not exists company_id uuid references public.companies(id)',
      table_name
    );

    execute format(
      'alter table public.%I alter column company_id set default public.current_user_default_company_id()',
      table_name
    );

    execute format(
      'create index if not exists idx_%I_company_id on public.%I(company_id)',
      table_name,
      table_name
    );

    if company_count = 1 and single_company_id is not null then
      execute format(
        'update public.%I set company_id = $1 where company_id is null',
        table_name
      ) using single_company_id;
    end if;

    execute format('alter table public.%I enable row level security', table_name);

    for policy_row in
      select p.policyname
      from pg_policies p
      where p.schemaname = 'public'
        and p.tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_row.policyname, table_name);
    end loop;

    execute format(
      'create policy %I on public.%I for select using (public.has_company_access(company_id))',
      'tenant_select_' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for insert with check (public.has_company_access(company_id))',
      'tenant_insert_' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for update using (public.has_company_access(company_id)) with check (public.has_company_access(company_id))',
      'tenant_update_' || table_name,
      table_name
    );
    execute format(
      'create policy %I on public.%I for delete using (public.has_company_access(company_id))',
      'tenant_delete_' || table_name,
      table_name
    );
  end loop;
end $$;

create or replace function public.assign_legacy_rows_to_company(target_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tables text[] := array[
    'products',
    'customers',
    'financial_transactions',
    'suppliers',
    'purchases',
    'purchase_items',
    'sales',
    'sale_items',
    'hr_employees',
    'hr_attendance',
    'hr_vacations',
    'hr_evaluations',
    'hr_trainings',
    'hr_payrolls',
    'hr_leaves'
  ];
  table_name text;
begin
  if target_company_id is null then
    raise exception 'target_company_id is required';
  end if;

  if session_user <> 'postgres' and not public.has_company_admin_access(target_company_id) then
    raise exception 'Only company admin can assign legacy rows';
  end if;

  foreach table_name in array target_tables loop
    if to_regclass('public.' || table_name) is null then
      continue;
    end if;

    execute format(
      'update public.%I set company_id = $1 where company_id is null',
      table_name
    ) using target_company_id;
  end loop;
end;
$$;

grant execute on function public.assign_legacy_rows_to_company(uuid) to authenticated;
