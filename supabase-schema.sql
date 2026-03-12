-- ============================================================
-- PRYYSM - Complete Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PROFILES (linked to auth.users) ──────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  company_name text default 'My Print Shop',
  avatar_url text,
  plan text default 'Pro' check (plan in ('Free','Basic','Pro','Enterprise')),
  created_at timestamptz default now()
);

-- ── CUSTOMERS ─────────────────────────────────────────────────────────────────
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  customer_code text not null,
  name text not null,
  email text not null,
  phone text,
  address text,
  company text,
  tax_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ORDERS ────────────────────────────────────────────────────────────────────
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  order_number text not null,
  project_code text not null,
  customer_name text not null,
  items integer default 1,
  printer_tech text default 'FDM',
  order_date date default current_date,
  deadline date not null,
  status text default 'pending' check (status in ('pending','in-progress','overdue','qc','packing','dispatched','completed')),
  priority text default 'medium' check (priority in ('low','medium','high')),
  sales_person text,
  notes text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── PRINTERS ──────────────────────────────────────────────────────────────────
create table public.printers (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  model text,
  code_name text not null,
  location text,
  technology text not null check (technology in ('FDM','SLA','SLS','DLP','MJF','EBM','DMLS')),
  capacity text default 'Standard',
  material text,
  status text default 'idle' check (status in ('printing','idle','maintenance','offline','running')),
  initialization_date date default current_date,
  current_job_name text,
  current_job_progress integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── JOB QUEUE ────────────────────────────────────────────────────────────────
create table public.job_queue (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete cascade,
  name text not null,
  project_code text not null,
  priority text default 'medium' check (priority in ('low','medium','high')),
  estimated_time integer default 0,
  deadline date,
  required_technology text,
  items integer default 1,
  assigned_printer_id uuid references public.printers(id) on delete set null,
  status text default 'queued' check (status in ('queued','assigned','printing','done')),
  created_at timestamptz default now()
);

-- ── RAW MATERIALS - SPOOLS ────────────────────────────────────────────────────
create table public.spools (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  spool_id text not null,
  name text not null,
  brand text,
  color text default '#000000',
  material text not null,
  finish text default 'Matte',
  weight numeric default 1000,
  used numeric default 0,
  price numeric default 0,
  currency text default 'USD',
  purchase_date date,
  notes text,
  status text default 'New',
  assigned_to_printer_id uuid references public.printers(id) on delete set null,
  min_stock integer default 2,
  min_order integer default 5,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── RAW MATERIALS - RESINS ────────────────────────────────────────────────────
create table public.resins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  resin_id text not null,
  name text not null,
  brand text,
  color text default '#808080',
  type text default 'Standard',
  volume numeric default 1000,
  used numeric default 0,
  price numeric default 0,
  currency text default 'USD',
  purchase_date date,
  notes text,
  status text default 'New',
  assigned_to_printer_id uuid references public.printers(id) on delete set null,
  min_stock integer default 1,
  min_order integer default 2,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── RAW MATERIALS - POWDERS ───────────────────────────────────────────────────
create table public.powders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  powder_id text not null,
  name text not null,
  brand text,
  material text not null,
  color text default '#FFFFFF',
  weight numeric default 20,
  used numeric default 0,
  price numeric default 0,
  currency text default 'USD',
  purchase_date date,
  notes text,
  status text default 'New',
  assigned_to_printer_id uuid references public.printers(id) on delete set null,
  min_stock integer default 2,
  min_order integer default 2,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INVENTORY ─────────────────────────────────────────────────────────────────
create table public.inventory (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  barcode text not null,
  name text not null,
  description text,
  category text default 'Miscellaneous' check (category in ('Packing Material','Electronics','Tools','Miscellaneous')),
  quantity integer default 0,
  min_stock integer default 5,
  min_order integer default 10,
  location text,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── SHIPPING LOGS ─────────────────────────────────────────────────────────────
create table public.shipping_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  from_name text,
  from_address text,
  to_name text,
  to_address text,
  tracking_number text,
  weight text,
  contents text,
  created_at timestamptz default now()
);

-- ── AI CHAT CONVERSATIONS ─────────────────────────────────────────────────────
create table public.chat_conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.chat_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- ── DOCUMENTS (Quotations, POs, Invoices) ─────────────────────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  order_number text,
  type text not null check (type in ('Quotation','Purchase Order','Tax Invoice')),
  date date default current_date,
  amount numeric default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) - Users can only see their own data
-- ============================================================

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.printers enable row level security;
alter table public.job_queue enable row level security;
alter table public.spools enable row level security;
alter table public.resins enable row level security;
alter table public.powders enable row level security;
alter table public.inventory enable row level security;
alter table public.shipping_logs enable row level security;
alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;
alter table public.documents enable row level security;

-- RLS Policies
create policy "Users own their profile" on public.profiles for all using (auth.uid() = id);
create policy "Users own their customers" on public.customers for all using (auth.uid() = user_id);
create policy "Users own their orders" on public.orders for all using (auth.uid() = user_id);
create policy "Users own their printers" on public.printers for all using (auth.uid() = user_id);
create policy "Users own their job_queue" on public.job_queue for all using (auth.uid() = user_id);
create policy "Users own their spools" on public.spools for all using (auth.uid() = user_id);
create policy "Users own their resins" on public.resins for all using (auth.uid() = user_id);
create policy "Users own their powders" on public.powders for all using (auth.uid() = user_id);
create policy "Users own their inventory" on public.inventory for all using (auth.uid() = user_id);
create policy "Users own their shipping_logs" on public.shipping_logs for all using (auth.uid() = user_id);
create policy "Users own their conversations" on public.chat_conversations for all using (auth.uid() = user_id);
create policy "Users own their messages" on public.chat_messages for all using (auth.uid() = user_id);
create policy "Users own their documents" on public.documents for all using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- TRIGGER: updated_at timestamps
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_customers_updated_at before update on public.customers for each row execute procedure public.update_updated_at();
create trigger update_orders_updated_at before update on public.orders for each row execute procedure public.update_updated_at();
create trigger update_printers_updated_at before update on public.printers for each row execute procedure public.update_updated_at();
create trigger update_spools_updated_at before update on public.spools for each row execute procedure public.update_updated_at();
create trigger update_resins_updated_at before update on public.resins for each row execute procedure public.update_updated_at();
create trigger update_powders_updated_at before update on public.powders for each row execute procedure public.update_updated_at();
create trigger update_inventory_updated_at before update on public.inventory for each row execute procedure public.update_updated_at();

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_customers_user_id on public.customers(user_id);
create index idx_printers_user_id on public.printers(user_id);
create index idx_inventory_user_id on public.inventory(user_id);
create index idx_spools_user_id on public.spools(user_id);
create index idx_resins_user_id on public.resins(user_id);
create index idx_powders_user_id on public.powders(user_id);
create index idx_job_queue_user_id on public.job_queue(user_id);
create index idx_shipping_logs_user_id on public.shipping_logs(user_id);
create index idx_chat_messages_conversation on public.chat_messages(conversation_id);
