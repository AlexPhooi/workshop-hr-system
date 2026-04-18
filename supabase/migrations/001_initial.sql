-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (links auth users to roles)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('driver', 'boss')) default 'driver',
  driver_id uuid,
  created_at timestamptz default now()
);

-- Drivers
create table drivers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  ic_number text not null unique,
  phone text not null unique,
  email text,
  bank_name text not null default '',
  bank_account text not null default '',
  pay_type text not null check (pay_type in ('monthly', 'daily', 'trip')) default 'monthly',
  base_salary numeric,
  daily_rate numeric,
  trip_rate numeric,
  state text not null default 'Selangor',
  telco_allowance numeric not null default 50,
  meal_per_day numeric not null default 10,
  fuel_cap numeric,
  toll_cap numeric,
  outstation_rate numeric not null default 80,
  epf_eligible boolean not null default true,
  socso_eligible boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

-- Attendance
create table attendance (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null,
  clock_in_at timestamptz,
  clock_in_lat numeric,
  clock_in_lng numeric,
  clock_out_at timestamptz,
  clock_out_lat numeric,
  clock_out_lng numeric,
  hours_worked numeric,
  ot_hours numeric,
  day_type text not null check (day_type in ('normal', 'rest', 'public_holiday')) default 'normal',
  unique(driver_id, date)
);

-- Claims
create table claims (
  id uuid primary key default uuid_generate_v4(),
  driver_id uuid not null references drivers(id) on delete cascade,
  date date not null default current_date,
  type text not null check (type in ('toll', 'fuel', 'outstation', 'meal', 'telco')),
  amount numeric not null,
  receipt_url text,
  notes text,
  status text not null check (status in ('auto_approved', 'pending', 'approved', 'rejected')) default 'pending',
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- Payroll runs
create table payroll_runs (
  id uuid primary key default uuid_generate_v4(),
  period_start date not null,
  period_end date not null,
  status text not null check (status in ('draft', 'locked', 'paid')) default 'draft',
  generated_at timestamptz,
  unique(period_start, period_end)
);

-- Payslips
create table payslips (
  id uuid primary key default uuid_generate_v4(),
  payroll_run_id uuid not null references payroll_runs(id) on delete cascade,
  driver_id uuid not null references drivers(id) on delete cascade,
  base_pay numeric not null default 0,
  ot_pay numeric not null default 0,
  total_allowances numeric not null default 0,
  epf_employee numeric not null default 0,
  epf_employer numeric not null default 0,
  socso_employee numeric not null default 0,
  socso_employer numeric not null default 0,
  eis_employee numeric not null default 0,
  eis_employer numeric not null default 0,
  gross_pay numeric not null default 0,
  net_pay numeric not null default 0,
  unique(payroll_run_id, driver_id)
);

-- Public holidays
create table public_holidays (
  id uuid primary key default uuid_generate_v4(),
  date date not null,
  name text not null,
  state text, -- null = national
  unique(date, state)
);

-- ─── RLS Policies ───────────────────────────────────────────────

alter table profiles enable row level security;
alter table drivers enable row level security;
alter table attendance enable row level security;
alter table claims enable row level security;
alter table payroll_runs enable row level security;
alter table payslips enable row level security;
alter table public_holidays enable row level security;

-- Profiles: user reads own profile
create policy "Own profile" on profiles for select using (auth.uid() = id);
create policy "Boss reads all profiles" on profiles for select
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Drivers: driver reads own row; boss reads all
create policy "Driver reads own" on drivers for select
  using (id = (select driver_id from profiles where id = auth.uid()));
create policy "Boss reads all drivers" on drivers for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Attendance: driver inserts/reads own; boss reads all
create policy "Driver attendance" on attendance for all
  using (driver_id = (select driver_id from profiles where id = auth.uid()));
create policy "Boss attendance" on attendance for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Claims: driver inserts/reads own; boss reads/updates all
create policy "Driver claims" on claims for all
  using (driver_id = (select driver_id from profiles where id = auth.uid()));
create policy "Boss claims" on claims for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Payroll runs: boss only
create policy "Boss payroll runs" on payroll_runs for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Payslips: driver reads own; boss reads all
create policy "Driver payslip" on payslips for select
  using (driver_id = (select driver_id from profiles where id = auth.uid()));
create policy "Boss payslips" on payslips for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));

-- Public holidays: all authenticated users can read
create policy "Read holidays" on public_holidays for select using (auth.role() = 'authenticated');
create policy "Boss manage holidays" on public_holidays for all
  using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'boss'));
