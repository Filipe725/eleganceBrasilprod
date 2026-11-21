'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowUpDown,
  ChevronRight,
  PackageSearch,
  SlidersHorizontal,
} from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { ProductCard } from '@/components/site/ProductCard';
import { FilterDrawer, type Filters } from './FilterDrawer';
import { SortSheet, SORT_OPTIONS, type SortKey } from './SortSheet';

interface ProductsExplorerProps {
  initialPerfumes: Perfume[];
}

export const EMPTY_FILTERS: Filters = {
  generos: [],
  familias: [],
  tamanhos: [],
  marcas: [],
  precoMin: null,
  precoMax: null,
};

const overlaps = (values: string[], selected: string[]) =>
  values.some((value) => selected.includes(value));

/**
 * Mesma semântica da antiga query no Supabase: gênero/marca em `.in`,
 * família/tamanho (text[]) com qualquer interseção, faixa de preço com
 * limites inclusivos. A lista de entrada já vem do servidor ordenada por
 * lançamento (created_at desc), e o sort é estável — empates de preço
 * mantêm essa ordem.
 */
function filterAndSort(all: Perfume[], f: Filters, sort: SortKey): Perfume[] {
  const filtrados = all.filter(
    (p) =>
      (f.generos.length === 0 || f.generos.includes(p.genero)) &&
      (f.marcas.length === 0 || f.marcas.includes(p.marca)) &&
      (f.familias.length === 0 || overlaps(p.familia_olfativa, f.familias)) &&
      (f.tamanhos.length === 0 || overlaps(p.tamanho, f.tamanhos)) &&
      (f.precoMin === null || p.preco_atual >= f.precoMin) &&
      (f.precoMax === null || p.preco_atual <= f.precoMax)
  );

  if (sort === 'menor-preco') {
    return filtrados.sort((a, b) => a.preco_atual - b.preco_atual);
  }
  if (sort === 'maior-preco') {
    return filtrados.sort((a, b) => b.preco_atual - a.preco_atual);
  }
  return filtrados;
}

const SORT_KEYS: SortKey[] = ['menor-preco', 'maior-preco', 'lancamentos'];
const DEFAULT_SORT: SortKey = 'lancamentos';

/** Nome do parâmetro na URL para cada lista de filtros (repetível). */
const LIST_PARAMS = {
  generos: 'genero',
  familias: 'familia',
  tamanhos: 'tamanho',
  marcas: 'marca',
} as const;

function readPrice(value: string | null): number | null {
  if (value === null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Filtros e ordenação vêm da URL: voltar de um produto mantém a busca. */
function readState(params: URLSearchParams): { filters: Filters; sort: SortKey } {
  const ordem = params.get('ordem');
  return {
    filters: {
      generos: params.getAll(LIST_PARAMS.generos),
      familias: params.getAll(LIST_PARAMS.familias),
      tamanhos: params.getAll(LIST_PARAMS.tamanhos),
      marcas: params.getAll(LIST_PARAMS.marcas),
      precoMin: readPrice(params.get('min')),
      precoMax: readPrice(params.get('max')),
    },
    sort: SORT_KEYS.includes(ordem as SortKey) ? (ordem as SortKey) : DEFAULT_SORT,
  };
}

function toQueryString(filters: Filters, sort: SortKey): string {
  const params = new URLSearchParams();
  for (const [key, param] of Object.entries(LIST_PARAMS) as [
    keyof typeof LIST_PARAMS,
    string,
  ][]) {
    filters[key].forEach((value) => params.append(param, value));
  }
  if (filters.precoMin !== null) params.set('min', String(filters.precoMin));
  if (filters.precoMax !== null) params.set('max', String(filters.precoMax));
  if (sort !== DEFAULT_SORT) params.set('ordem', sort);
  return params.toString();
}

/**
 * Catálogo completo (/produtos): breadcrumb, barra sticky com
 * "Ordenar" e "Filtrar", e grid 2 col. mobile / 4 col. desktop.
 * Filtros e ordenação rodam no cliente sobre o catálogo vindo do servidor
 * e ficam na URL (?familia=...&ordem=...): dá para voltar, recarregar e
 * compartilhar a busca filtrada.
 */
export function ProductsExplorer({ initialPerfumes }: ProductsExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, sort } = useMemo(
    () => readState(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // Opções dos filtros derivadas do catálogo inicial completo
  const facets = useMemo(() => {
    const generos = new Set<string>();
    const familias = new Set<string>();
    const tamanhos = new Set<string>();
    const marcas = new Set<string>();
    let max = 0;
    for (const p of initialPerfumes) {
      generos.add(p.genero);
      p.familia_olfativa.forEach((f) => familias.add(f));
      p.tamanho.forEach((t) => tamanhos.add(t));
      marcas.add(p.marca);
      if (p.preco_atual > max) max = p.preco_atual;
    }
    const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
    return {
      generos: Array.from(generos).sort(sortPt),
      familias: Array.from(familias).sort(sortPt),
      tamanhos: Array.from(tamanhos).sort(sortPt),
      marcas: Array.from(marcas).sort(sortPt),
      precoTeto: Math.max(100, Math.ceil(max / 50) * 50),
    };
  }, [initialPerfumes]);

  const activeFilterCount =
    filters.generos.length +
    filters.familias.length +
    filters.tamanhos.length +
    filters.marcas.length +
    (filters.precoMin !== null || filters.precoMax !== null ? 1 : 0);

  // O servidor já entrega o catálogo ativo completo: filtrar e ordenar
  // aqui é instantâneo e não gasta uma ida ao Supabase por clique.
  const perfumes = useMemo(
    () => filterAndSort(initialPerfumes, filters, sort),
    [initialPerfumes, filters, sort]
  );

  // replace (não push): filtrar não enche o histórico do "voltar"
  function updateUrl(nextFilters: Filters, nextSort: SortKey) {
    const qs = toQueryString(nextFilters, nextSort);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function applyFilters(next: Filters) {
    updateUrl(next, sort);
    setShowFilter(false);
  }

  function applySort(next: SortKey) {
    updateUrl(filters, next);
    setShowSort(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="py-4">
        <ol className="flex items-center gap-1.5 text-sm text-muted">
          <li>
            <Link href="/" className="transition hover:text-ink-900">
              Início
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="h-4 w-4" />
          </li>
          <li className="font-semibold text-ink-900" aria-current="page">
            Produtos
          </li>
        </ol>
      </nav>

      <h1 className="mb-4 font-display text-3xl font-bold text-ink-900">
        Todos os Perfumes
      </h1>

      {/* Barra sticky: Ordenar / Filtrar */}
      <div className="sticky top-[108px] z-20 -mx-5 mb-6 border-y border-gold-400/20 bg-cream/95 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSort(true)}
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink-700/20 bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition hover:border-ink-900 sm:flex-none sm:px-6"
          >
            <ArrowUpDown className="h-4 w-4" aria-hidden />
            Ordenar
            <span className="hidden text-xs font-normal text-muted sm:inline">
              • {SORT_OPTIONS.find((o) => o.key === sort)?.label}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilter(true)}
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-lg border border-ink-700/20 bg-white px-4 py-3 text-sm font-semibold text-ink-900 transition hover:border-ink-900 sm:flex-none sm:px-6"
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filtrar
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-wine px-1 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Grid: 2 colunas mobile, 4 desktop */}
      {perfumes.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold-400/40 py-20 text-center text-muted">
          <PackageSearch className="h-10 w-10 text-gold-600" aria-hidden />
          <p className="text-sm">
            Nenhum perfume encontrado com esses filtros.
          </p>
          <button
            type="button"
            onClick={() => applyFilters(EMPTY_FILTERS)}
            className="tap-target rounded-full border border-ink-900 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-cream"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
          {perfumes.map((perfume) => (
            <div key={perfume.id} className="cv-card">
              <ProductCard perfume={perfume} />
            </div>
          ))}
        </div>
      )}

      {/* Overlays */}
      {showSort && (
        <SortSheet
          current={sort}
          onSelect={applySort}
          onClose={() => setShowSort(false)}
        />
      )}
      {showFilter && (
        <FilterDrawer
          facets={facets}
          current={filters}
          onApply={applyFilters}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
