-- Multi-tenant base schema for FernaGest
-- Run this script first in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  display_name text not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'INACTIVE')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (
    role in (
      'admin_geral',
      'rh',
      'caixa_financeiro',
      'gestor',
      'vendedor',
      'somente_leitura'
    )
  ),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists idx_company_users_user_id on public.company_users(user_id);
create index if not exists idx_company_users_company_id on public.company_users(company_id);
create index if not exists idx_company_users_role on public.company_users(role);

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_default_company_id()
returns uuid
language sql
stable
as $$
  select cu.company_id
  from public.company_users cu
  where cu.user_id = auth.uid()
    and cu.is_active = true
  order by (cu.role = 'admin_geral') desc, cu.created_at asc
  limit 1;
$$;

create or replace function public.has_company_access(target_company_id uuid)
returns boolean
language sql
stable
as $$
  select
    auth.uid() is not null
    and target_company_id is not null
    and exists (
      select 1
      from public.company_users cu
      where cu.company_id = target_company_id
        and cu.user_id = auth.uid()
        and cu.is_active = true
    );
$$;

create or replace function public.has_company_admin_access(target_company_id uuid)
returns boolean
language sql
stable
as $$
  select
    auth.uid() is not null
    and target_company_id is not null
    and exists (
      select 1
      from public.company_users cu
      where cu.company_id = target_company_id
        and cu.user_id = auth.uid()
        and cu.is_active = true
        and cu.role = 'admin_geral'
    );
$$;

create or replace function public.current_user_company_role(target_company_id uuid)
returns text
language sql
stable
as $$
  select cu.role
  from public.company_users cu
  where cu.company_id = target_company_id
    and cu.user_id = auth.uid()
    and cu.is_active = true
  limit 1;
$$;

create or replace function public.bootstrap_company_admin(
  p_legal_name text,
  p_display_name text default null,
  p_slug text default null,
  p_admin_user_id uuid default null
)
returns table(company_id uuid, company_slug text, admin_user_id uuid, admin_role text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor_user_id uuid;
  v_legal_name text;
  v_display_name text;
  v_slug text;
  v_slug_base text;
  v_suffix integer := 1;
  v_company_id uuid;
begin
  v_actor_user_id := coalesce(auth.uid(), p_admin_user_id);
  if v_actor_user_id is null then
    select u.id
    into v_actor_user_id
    from auth.users u
    order by u.created_at asc
    limit 1;
  end if;

  if v_actor_user_id is null then
    raise exception 'bootstrap_company_admin could not resolve an admin user. Create at least one user in Authentication > Users.';
  end if;

  v_legal_name := trim(coalesce(p_legal_name, ''));
  if v_legal_name = '' then
    raise exception 'p_legal_name is required';
  end if;

  v_display_name := trim(coalesce(p_display_name, ''));
  if v_display_name = '' then
    v_display_name := v_legal_name;
  end if;

  v_slug := public.slugify(coalesce(nullif(trim(p_slug), ''), v_display_name));
  if v_slug = '' then
    v_slug := 'empresa';
  end if;

  v_slug_base := v_slug;
  while exists (select 1 from public.companies c where c.slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := format('%s-%s', v_slug_base, v_suffix);
  end loop;

  insert into public.companies (slug, legal_name, display_name, created_by)
  values (v_slug, v_legal_name, v_display_name, v_actor_user_id)
  returning id into v_company_id;

  insert into public.company_users (company_id, user_id, role, is_active)
  values (v_company_id, v_actor_user_id, 'admin_geral', true)
  on conflict (company_id, user_id)
  do update set
    role = excluded.role,
    is_active = true,
    updated_at = now();

  return query
  select v_company_id, v_slug, v_actor_user_id, 'admin_geral';
end;
$$;

create or replace function public.set_company_user_role(
  p_company_id uuid,
  p_user_id uuid,
  p_role text,
  p_is_active boolean default true
)
returns public.company_users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.company_users%rowtype;
begin
  if p_company_id is null or p_user_id is null then
    raise exception 'p_company_id and p_user_id are required';
  end if;

  if session_user <> 'postgres' and not public.has_company_admin_access(p_company_id) then
    raise exception 'Only company admin can manage users in this company';
  end if;

  insert into public.company_users (company_id, user_id, role, is_active)
  values (p_company_id, p_user_id, p_role, coalesce(p_is_active, true))
  on conflict (company_id, user_id)
  do update set
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.list_my_companies()
returns table(company_id uuid, slug text, display_name text, role text, is_active boolean)
language sql
stable
as $$
  select
    c.id as company_id,
    c.slug,
    c.display_name,
    cu.role,
    cu.is_active
  from public.company_users cu
  join public.companies c on c.id = cu.company_id
  where cu.user_id = auth.uid()
    and cu.is_active = true
    and c.status = 'ACTIVE'
  order by (cu.role = 'admin_geral') desc, c.created_at asc;
$$;

alter table public.companies enable row level security;
alter table public.company_users enable row level security;

drop trigger if exists trg_companies_updated_at on public.companies;
create trigger trg_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists trg_company_users_updated_at on public.company_users;
create trigger trg_company_users_updated_at
before update on public.company_users
for each row execute function public.set_updated_at();

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member
on public.companies
for select
using (public.has_company_access(id));

drop policy if exists companies_update_admin on public.companies;
create policy companies_update_admin
on public.companies
for update
using (public.has_company_admin_access(id))
with check (public.has_company_admin_access(id));

drop policy if exists companies_delete_admin on public.companies;
create policy companies_delete_admin
on public.companies
for delete
using (public.has_company_admin_access(id));

drop policy if exists company_users_select_member on public.company_users;
create policy company_users_select_member
on public.company_users
for select
using (public.has_company_access(company_id));

drop policy if exists company_users_insert_admin on public.company_users;
create policy company_users_insert_admin
on public.company_users
for insert
with check (public.has_company_admin_access(company_id));

drop policy if exists company_users_update_admin on public.company_users;
create policy company_users_update_admin
on public.company_users
for update
using (public.has_company_admin_access(company_id))
with check (public.has_company_admin_access(company_id));

drop policy if exists company_users_delete_admin on public.company_users;
create policy company_users_delete_admin
on public.company_users
for delete
using (public.has_company_admin_access(company_id));

grant select, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.company_users to authenticated;

grant execute on function public.bootstrap_company_admin(text, text, text, uuid) to authenticated;
grant execute on function public.set_company_user_role(uuid, uuid, text, boolean) to authenticated;
grant execute on function public.list_my_companies() to authenticated;
grant execute on function public.current_user_default_company_id() to authenticated;
grant execute on function public.current_user_company_role(uuid) to authenticated;
grant execute on function public.has_company_access(uuid) to authenticated;
grant execute on function public.has_company_admin_access(uuid) to authenticated;
