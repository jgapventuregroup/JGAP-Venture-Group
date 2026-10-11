# Staging foundation schema — review before execution

This is a **draft for the empty, isolated JGAP SaaS Staging project only** (`qfszapteuxuogoselprp`). Never run on production (`sfsyphmnzxaplundaljy`). It intentionally contains no real users or properties. Review column compatibility with every draft RPC before applying. It is **not deployed**.

```sql
begin;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (company_id,user_id)
);

create index company_members_user_idx on public.company_members(user_id,company_id);

create table public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now()
);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  status text not null default 'lead' check (length(btrim(status)) > 0),
  property_type text not null default 'single_family' check (length(btrim(property_type)) > 0),
  purchase_price numeric not null default 0,
  down_payment numeric not null default 0,
  interest_rate numeric not null default 0,
  loan_term_years integer not null default 30,
  closing_costs numeric not null default 0,
  rehab_cost numeric not null default 0,
  monthly_rent numeric not null default 0,
  vacancy_rate numeric not null default 0,
  monthly_operating_expenses numeric not null default 0,
  other_monthly_income numeric not null default 0,
  notes text,
  asking_price numeric,
  target_offer_price numeric,
  offer_notes text,
  target_cap_rate numeric,
  target_cash_on_cash numeric,
  target_monthly_cash_flow numeric,
  target_dscr numeric,
  offer_earnest_money numeric,
  offer_due_diligence_days integer,
  offer_closing_days integer,
  offer_financing_type text,
  offer_contingencies text,
  property_address text,
  property_county text,
  seller_name text,
  offer_state text,
  offer_template text,
  units integer,
  arv numeric,
  holding_months integer,
  monthly_holding_costs numeric,
  selling_cost_percent numeric,
  financing_costs numeric,
  projected_sale_price numeric,
  loan_structure text,
  created_at timestamptz not null default now(),
  check (purchase_price >= 0 and down_payment >= 0 and closing_costs >= 0 and rehab_cost >= 0),
  check (monthly_rent >= 0 and monthly_operating_expenses >= 0 and other_monthly_income >= 0),
  check (interest_rate between 0 and 100 and vacancy_rate between 0 and 100),
  check (loan_term_years between 0 and 100),
  check (asking_price is null or asking_price >= 0),
  check (target_offer_price is null or target_offer_price >= 0),
  check (offer_earnest_money is null or offer_earnest_money >= 0),
  check (units is null or units > 0),
  check (selling_cost_percent is null or selling_cost_percent between 0 and 100)
);

create index deals_company_created_idx on public.deals(company_id,created_at desc);

-- Explicitly deny direct access until reviewed role-aware policies exist.
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.company_invitations enable row level security;
alter table public.deals enable row level security;

revoke all on public.companies,public.company_members,public.company_invitations,public.deals from anon,authenticated;

commit;
```

## Required next review

- Compare `public.deals` columns and types with **every** draft SQL function and the original JGAP data model.
- Design safe membership lookups that do not recurse through `company_members` RLS policies.
- Grant only the privileges needed by reviewed invoker RPCs, with company-scoped SELECT and role-scoped write policies.
- Decide whether direct Data API access is required; if yes, enforce the same role checks at table level.
- Review invitation flow, role changes, email verification, and SECURITY DEFINER ownership before exposing public signup.
- Run migration only against staging after independent review; record schema revision and run real signed-in multi-user isolation tests.
