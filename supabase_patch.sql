-- CLUBE DO PAO - PATCH APOS O PRIMEIRO SQL
-- Execute este arquivo no SQL Editor do Supabase.

-- Permite que o cliente leia o proprio perfil.
drop policy if exists "perfil_proprio" on public.perfis;
create policy "perfil_proprio"
on public.perfis
for select to authenticated
using (id = auth.uid() or public.is_admin());

-- Permite que o cliente cadastre os itens das suas proprias entregas.
drop policy if exists "cliente_cria_itens_entrega" on public.itens_entrega;
create policy "cliente_cria_itens_entrega"
on public.itens_entrega
for insert to authenticated
with check (
  exists (
    select 1 from public.entregas e
    where e.id = entrega_id
      and (e.cliente_id = auth.uid() or public.is_admin())
  )
);

-- Permite ao cliente visualizar as configurações usadas pelo cálculo.
drop policy if exists "configuracoes_publicas" on public.configuracoes;
create policy "configuracoes_publicas"
on public.configuracoes
for select to anon, authenticated
using (true);

-- Produtos iniciais do Plano Completo.
insert into public.produtos (nome, descricao, preco, categoria, ativo)
select * from (values
 ('Pão francês','Pão francês fresquinho',1.50,'Pães',true),
 ('Pão de queijo','Pão de queijo',2.50,'Pães',true),
 ('Café','Café',4.00,'Bebidas',true),
 ('Leite','Leite',6.00,'Laticínios',true),
 ('Queijo','Queijo',12.00,'Laticínios',true),
 ('Bolo','Bolo',15.00,'Padaria',true),
 ('Bebida','Bebida',5.00,'Bebidas',true)
) as v(nome,descricao,preco,categoria,ativo)
where not exists (select 1 from public.produtos p where lower(p.nome)=lower(v.nome));
