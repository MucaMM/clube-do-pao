-- Clube do Pão — atualização para imagens dos produtos
-- Execute no SQL Editor do Supabase antes de publicar a nova versão.
alter table public.produtos add column if not exists imagem_url text;
