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
