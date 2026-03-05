# FernaGest ERP

Aplicação web de gestão empresarial (ERP) com módulos de:
- Dashboard
- Vendas
- CRM
- Compras
- Estoque
- Financeiro
- Projetos
- Relatórios
- Configurações

## Requisitos
- Node.js 20+
- npm 10+

## Configuração
1. Instalar dependências:
   `npm install`
2. Criar arquivo `.env` (ou ajustar o existente) com:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...`
3. Opcional: se houver funcionalidades de IA no ambiente, definir:
   - `GEMINI_API_KEY=...`

## Execução local
- `npm run dev`

## Build de produção
- `npm run build`
- `npm run preview`

## Modulo RH (Supabase)
- Script SQL: `supabase/sql/hr_module.sql`
- Execute no SQL Editor do Supabase para criar as tabelas:
  - `hr_employees`
  - `hr_attendance`
  - `hr_vacations`
  - `hr_evaluations`
  - `hr_trainings`
  - `hr_payrolls`
  - `hr_leaves`

## Base Multi-Tenant (Supabase)
- Script base: `supabase/sql/multi_tenant_base.sql`
- Script de patch para tabelas existentes: `supabase/sql/multi_tenant_enable_existing_tables.sql`

### Ordem recomendada
1. Executar `multi_tenant_base.sql`
2. Executar scripts dos modulos (ex.: `hr_module.sql` e demais tabelas de negocio)
3. Executar `multi_tenant_enable_existing_tables.sql`

### Bootstrap da primeira empresa e admin geral
- Via usuario autenticado (frontend/backend com JWT):
  - `select * from public.bootstrap_company_admin('Empresa Exemplo, Lda');`
- Via SQL Editor (com `p_admin_user_id`):
  - `select * from public.bootstrap_company_admin('Empresa Exemplo, Lda', null, null, 'USER_UUID_AQUI');`

### Definir admin geral para outra empresa
- `select public.set_company_user_role('COMPANY_UUID', 'USER_UUID', 'admin_geral', true);`

### Migrar dados legados sem company_id
- `select public.assign_legacy_rows_to_company('COMPANY_UUID');`
