-- ============================================================
-- MIGRAÇÃO 002 — Ancoragem de preço, marca e tamanhos
-- Execute no SQL Editor de um projeto que já rodou o schema.sql
-- anterior (que tinha a coluna única `preco`).
-- ============================================================

-- Preço "de/por": preco_antigo é opcional (ancoragem) e
-- preco_atual substitui o antigo campo único `preco`.
alter table public.perfumes
  add column if not exists preco_antigo numeric(10, 2)
    check (preco_antigo is null or preco_antigo >= 0);

alter table public.perfumes
  add column if not exists preco_atual numeric(10, 2)
    check (preco_atual is null or preco_atual >= 0);

-- Migra os valores do campo antigo, se ele existir
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'perfumes'
      and column_name = 'preco'
  ) then
    update public.perfumes
      set preco_atual = preco
      where preco_atual is null;
    alter table public.perfumes drop column preco;
  end if;
end $$;

alter table public.perfumes
  alter column preco_atual set not null;

-- Marca do perfume (obrigatória; default para linhas existentes)
alter table public.perfumes
  add column if not exists marca text not null default 'ÉléganceBrasil';

-- Tamanhos disponíveis (array de strings, ex: '{50ml,100ml}')
alter table public.perfumes
  add column if not exists tamanho text[] not null default '{}';

-- Índices para os filtros da página /produtos
create index if not exists perfumes_marca_idx
  on public.perfumes (marca);
create index if not exists perfumes_preco_atual_idx
  on public.perfumes (preco_atual);
