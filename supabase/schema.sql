-- ============================================================
-- ÉLÉGANCEBRASIL — Setup do Supabase
-- Execute este script no SQL Editor do painel do Supabase.
-- Idempotente: pode ser executado novamente em um projeto que já
-- rodou a versão anterior (usa IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Cria: tabelas `perfumes` e `banners_seccoes`, políticas de RLS
-- e o bucket público `perfumes` no Storage.
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELA: perfumes
-- ------------------------------------------------------------
create table if not exists public.perfumes (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  marca            text not null default 'ÉléganceBrasil', -- ex: "Lancôme", "Giorgio Armani"
  descricao        text,                          -- descrição detalhada
  notas_olfativas  text,                          -- ex: "Topo: bergamota. Coração: âmbar. Fundo: baunilha."
  preco_antigo     numeric(10, 2) check (preco_antigo is null or preco_antigo >= 0), -- preço "de" (ancoragem)
  preco_atual      numeric(10, 2) not null check (preco_atual >= 0),                 -- preço "por"
  familia_olfativa text[] not null default '{}', -- ex: '{Amadeirado,Cítrico}' (perfume pode ter várias)
  tamanho          text[] not null default '{}', -- ex: '{50ml,100ml}'
  imagem_url       text,                          -- URL pública do Supabase Storage
  tag_destaque     text,                          -- slug da secção da Home (ex: 'mais-vendidos') ou NULL
  ativo            boolean not null default true, -- permite "esconder" sem excluir
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Colunas novas para projetos que rodaram versões anteriores do script
-- (quem tinha a coluna única `preco` deve rodar também
--  supabase/migrations/002_precos_marca_tamanho.sql)
alter table public.perfumes add column if not exists notas_olfativas text;
alter table public.perfumes add column if not exists tag_destaque text;
alter table public.perfumes add column if not exists preco_antigo numeric(10, 2);
alter table public.perfumes add column if not exists marca text not null default 'ÉléganceBrasil';
alter table public.perfumes add column if not exists tamanho text[] not null default '{}';

-- Migra projetos antigos: familia_olfativa era `text` (uma família só),
-- agora é `text[]` (múltiplas famílias por perfume).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'perfumes'
      and column_name = 'familia_olfativa' and data_type = 'text'
  ) then
    alter table public.perfumes
      alter column familia_olfativa type text[] using array[familia_olfativa];
    alter table public.perfumes
      alter column familia_olfativa set default '{}';
  end if;
end $$;

drop index if exists perfumes_familia_idx;
create index if not exists perfumes_familia_idx
  on public.perfumes using gin (familia_olfativa);
create index if not exists perfumes_tag_destaque_idx
  on public.perfumes (tag_destaque);
create index if not exists perfumes_marca_idx
  on public.perfumes (marca);
create index if not exists perfumes_preco_atual_idx
  on public.perfumes (preco_atual);

-- Mantém updated_at sempre atualizado
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists perfumes_updated_at on public.perfumes;
create trigger perfumes_updated_at
  before update on public.perfumes
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 2. TABELA: banners_seccoes
--    Cada linha é uma secção da Home ("OS MAIS VENDIDOS",
--    "MEGA OFERTAS", ...) com um banner promocional opcional.
-- ------------------------------------------------------------
create table if not exists public.banners_seccoes (
  id                 uuid primary key default gen_random_uuid(),
  seccao             text not null unique,        -- slug usado no tag_destaque e como âncora (#mais-vendidos)
  titulo             text not null,               -- título exibido, ex: "OS MAIS VENDIDOS"
  imagem_desktop_url text,                        -- banner horizontal (Desktop)
  imagem_mobile_url  text,                        -- banner quadrado/vertical (Mobile)
  link_destino       text,                        -- URL ou âncora de destino do clique
  exibir_banner      boolean not null default true, -- toggle on/off do banner (sem apagar arquivos)
  ordem              integer not null default 0,  -- ordem das secções na Home
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

drop trigger if exists banners_seccoes_updated_at on public.banners_seccoes;
create trigger banners_seccoes_updated_at
  before update on public.banners_seccoes
  for each row execute function public.handle_updated_at();

-- ------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS)
--    Leitura pública; escrita apenas para usuários autenticados.
-- ------------------------------------------------------------
alter table public.perfumes enable row level security;
alter table public.banners_seccoes enable row level security;

-- perfumes
drop policy if exists "Leitura pública de perfumes" on public.perfumes;
create policy "Leitura pública de perfumes"
  on public.perfumes for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin pode inserir perfumes" on public.perfumes;
create policy "Admin pode inserir perfumes"
  on public.perfumes for insert
  to authenticated
  with check (true);

drop policy if exists "Admin pode atualizar perfumes" on public.perfumes;
create policy "Admin pode atualizar perfumes"
  on public.perfumes for update
  to authenticated
  using (true) with check (true);

drop policy if exists "Admin pode excluir perfumes" on public.perfumes;
create policy "Admin pode excluir perfumes"
  on public.perfumes for delete
  to authenticated
  using (true);

-- banners_seccoes
drop policy if exists "Leitura pública de banners" on public.banners_seccoes;
create policy "Leitura pública de banners"
  on public.banners_seccoes for select
  to anon, authenticated
  using (true);

drop policy if exists "Admin pode inserir banners" on public.banners_seccoes;
create policy "Admin pode inserir banners"
  on public.banners_seccoes for insert
  to authenticated
  with check (true);

drop policy if exists "Admin pode atualizar banners" on public.banners_seccoes;
create policy "Admin pode atualizar banners"
  on public.banners_seccoes for update
  to authenticated
  using (true) with check (true);

drop policy if exists "Admin pode excluir banners" on public.banners_seccoes;
create policy "Admin pode excluir banners"
  on public.banners_seccoes for delete
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- 4. STORAGE: bucket público `perfumes`
--    (fotos de produto em / e banners em banners/)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'perfumes',
  'perfumes',
  true,                                      -- leitura pública das imagens
  5242880,                                   -- 5 MB por arquivo
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

drop policy if exists "Imagens de perfumes são públicas" on storage.objects;
create policy "Imagens de perfumes são públicas"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'perfumes');

drop policy if exists "Admin pode enviar imagens" on storage.objects;
create policy "Admin pode enviar imagens"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'perfumes');

drop policy if exists "Admin pode atualizar imagens" on storage.objects;
create policy "Admin pode atualizar imagens"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'perfumes')
  with check (bucket_id = 'perfumes');

drop policy if exists "Admin pode excluir imagens" on storage.objects;
create policy "Admin pode excluir imagens"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'perfumes');

-- ------------------------------------------------------------
-- 5. Dados iniciais: secções padrão da Home
-- ------------------------------------------------------------
insert into public.banners_seccoes (seccao, titulo, ordem) values
  ('mais-vendidos', 'OS MAIS VENDIDOS', 1),
  ('mega-ofertas', 'MEGA OFERTAS', 2)
on conflict (seccao) do nothing;

-- ------------------------------------------------------------
-- 6. (Opcional) Perfumes de exemplo para testar a vitrine
-- ------------------------------------------------------------
insert into public.perfumes
  (nome, marca, descricao, notas_olfativas, preco_antigo, preco_atual, familia_olfativa, tamanho, tag_destaque)
values
  ('Amazonia Gold', 'ÉléganceBrasil',
   'Fragrância marcante inspirada no entardecer da floresta.',
   'Topo: maracujá e bergamota. Coração: âmbar e patchouli. Fundo: baunilha e cedro.',
   600.00, 480.00, '{Amadeirado}', '{100ml}', 'mais-vendidos'),
  ('Orquídea Real', 'ÉléganceBrasil',
   'Delicado e sofisticado, um buquê tropical de luxo.',
   'Topo: pera e frésia. Coração: orquídea branca e jasmim. Fundo: almíscar e sândalo.',
   null, 520.00, '{Floral}', '{75ml}', 'mais-vendidos'),
  ('Cacau Imperial', 'ÉléganceBrasil',
   'Gourmand intenso com a alma do cacau brasileiro.',
   'Topo: açafrão. Coração: cacau e fava tonka. Fundo: baunilha e couro.',
   560.00, 450.00, '{Oriental}', '{50ml,100ml}', 'mega-ofertas'),
  ('Mata Atlântica', 'ÉléganceBrasil',
   'Frescor verde para o dia a dia.',
   'Topo: folhas verdes e limão siciliano. Coração: vetiver. Fundo: cedro e almíscar branco.',
   null, 390.00, '{Aromático,Cítrico}', '{50ml}', 'mega-ofertas');

-- ============================================================
-- IMPORTANTE — Criar o usuário admin:
-- Authentication > Users > "Add user" (e-mail + senha).
-- Recomendado: desativar "Enable sign ups" em
-- Authentication > Providers > Email.
-- ============================================================
