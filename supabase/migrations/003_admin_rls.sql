-- ============================================================
-- MIGRAÇÃO 003 — Escrita restrita a admins reais (RLS)
-- Execute no SQL Editor de um projeto que já rodou o schema.sql
-- anterior. Idempotente.
--
-- Antes: as políticas de escrita de `perfumes`, `banners_seccoes`
-- e do bucket `perfumes` liberavam qualquer usuário autenticado
-- (`using (true)`), contando apenas com "Enable sign ups" desativado
-- no painel do Supabase para impedir novas contas.
-- Depois: escrita só é permitida para quem está na tabela `admins`,
-- checagem feita em nível de banco, independente dessa configuração.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELA: admins
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Admin enxerga sua própria linha" on public.admins;
create policy "Admin enxerga sua própria linha"
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- 2. Substitui as políticas de escrita por checagens de admin
-- ------------------------------------------------------------

-- perfumes
drop policy if exists "Admin pode inserir perfumes" on public.perfumes;
create policy "Admin pode inserir perfumes"
  on public.perfumes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admin pode atualizar perfumes" on public.perfumes;
create policy "Admin pode atualizar perfumes"
  on public.perfumes for update
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin pode excluir perfumes" on public.perfumes;
create policy "Admin pode excluir perfumes"
  on public.perfumes for delete
  to authenticated
  using (public.is_admin());

-- banners_seccoes
drop policy if exists "Admin pode inserir banners" on public.banners_seccoes;
create policy "Admin pode inserir banners"
  on public.banners_seccoes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admin pode atualizar banners" on public.banners_seccoes;
create policy "Admin pode atualizar banners"
  on public.banners_seccoes for update
  to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admin pode excluir banners" on public.banners_seccoes;
create policy "Admin pode excluir banners"
  on public.banners_seccoes for delete
  to authenticated
  using (public.is_admin());

-- storage.objects (bucket `perfumes`)
drop policy if exists "Admin pode enviar imagens" on storage.objects;
create policy "Admin pode enviar imagens"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'perfumes' and public.is_admin());

drop policy if exists "Admin pode atualizar imagens" on storage.objects;
create policy "Admin pode atualizar imagens"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'perfumes' and public.is_admin())
  with check (bucket_id = 'perfumes' and public.is_admin());

drop policy if exists "Admin pode excluir imagens" on storage.objects;
create policy "Admin pode excluir imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'perfumes' and public.is_admin());

-- ------------------------------------------------------------
-- 3. IMPORTANTE — Autorize seu usuário admin existente
--    (troque o e-mail pelo e-mail já usado para logar em /admin):
--
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'seuemail@exemplo.com'
--    on conflict (user_id) do nothing;
--
-- Sem essa linha, o login continua funcionando mas toda escrita
-- (criar/editar/excluir perfume ou banner, enviar imagem) passa a
-- ser bloqueada pela RLS.
-- ------------------------------------------------------------
