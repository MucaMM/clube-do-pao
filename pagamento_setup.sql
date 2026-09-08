-- Execute no Supabase SQL Editor antes de testar o pagamento.
-- Adiciona campos usados pela integração, sem remover os existentes.
alter table public.pagamentos add column if not exists pedido_id uuid;
alter table public.pagamentos add column if not exists valor numeric(12,2);
alter table public.pagamentos add column if not exists status text default 'pendente';
alter table public.pagamentos add column if not exists metodo text;
alter table public.pagamentos add column if not exists transaction_nsu text;
alter table public.pagamentos add column if not exists invoice_slug text;
alter table public.pagamentos add column if not exists receipt_url text;
alter table public.pagamentos add column if not exists installments integer;
alter table public.pagamentos add column if not exists raw_data jsonb;
create index if not exists pagamentos_pedido_id_idx on public.pagamentos(pedido_id);
