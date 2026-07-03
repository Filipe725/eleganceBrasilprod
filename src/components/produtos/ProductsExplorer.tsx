'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpDown,
  ChevronRight,
  Loader2,
  PackageSearch,
  SlidersHorizontal,
} from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { ProductCard } from '@/components/site/ProductCard';
import { FilterDrawer, type Filters } from './FilterDrawer';
import { SortSheet, SORT_OPTIONS, type SortKey } from './SortSheet';

interface ProductsExplorerProps {
  initialPerfumes: Perfume[];
}

export const EMPTY_FILTERS: Filters = {
  familias: [],
  tamanhos: [],
  marcas: [],
  precoMin: null,
  precoMax: null,
};

/**
 * Catálogo completo (/produtos): breadcrumb, barra sticky com
 * "Ordenar" e "Filtrar", e grid 2 col. mobile / 4 col. desktop.
 * Cada mudança de filtro/ordenação refaz a query no Supabase,
 * encadeando .in / .overlaps / .gte / .lte dinamicamente.
 */
export function ProductsExplorer({ initialPerfumes }: ProductsExplorerProps) {
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('lancamentos');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opções dos filtros derivadas do catálogo inicial completo
  const facets = useMemo(() => {
    const familias = new Set<string>();
    const tamanhos = new Set<string>();
    const marcas = new Set<string>();
    let max = 0;
    for (const p of initialPerfumes) {
      p.familia_olfativa.forEach((f) => familias.add(f));
      p.tamanho.forEach((t) => tamanhos.add(t));
      marcas.add(p.marca);
      if (p.preco_atual > max) max = p.preco_atual;
    }
    const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
    return {
      familias: Array.from(familias).sort(sortPt),
      tamanhos: Array.from(tamanhos).sort(sortPt),
      marcas: Array.from(marcas).sort(sortPt),
      precoTeto: Math.max(100, Math.ceil(max / 50) * 50),
    };
  }, [initialPerfumes]);

  const activeFilterCount =
    filters.familias.length +
    filters.tamanhos.length +
    filters.marcas.length +
    (filters.precoMin !== null || filters.precoMax !== null ? 1 : 0);

  /** Refaz a busca no Supabase encadeando os filtros selecionados. */
  async function fetchPerfumes(nextFilters: Filters, nextSort: SortKey) {
    setLoading(true);
    try {
      const supabase = createClient();
      let query = supabase.from('perfumes').select('*').eq('ativo', true);

      if (nextFilters.familias.length > 0) {
        // coluna text[]: qualquer interseção com as famílias marcadas
        query = query.overlaps('familia_olfativa', nextFilters.familias);
      }
      if (nextFilters.marcas.length > 0) {
        query = query.in('marca', nextFilters.marcas);
      }
      if (nextFilters.tamanhos.length > 0) {
        // coluna text[]: qualquer interseção com os tamanhos marcados
        query = query.overlaps('tamanho', nextFilters.tamanhos);
      }
      if (nextFilters.precoMin !== null) {
        query = query.gte('preco_atual', nextFilters.precoMin);
      }
      if (nextFilters.precoMax !== null) {
        query = query.lte('preco_atual', nextFilters.precoMax);
      }

      if (nextSort === 'menor-preco') {
        query = query.order('preco_atual', { ascending: true });
      } else if (nextSort === 'maior-preco') {
        query = query.order('preco_atual', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (!error && data) setPerfumes(data);
    } catch {
      // Falha de rede: mantém a lista atual
    } finally {
      setLoading(false);
    }
  }

  function applyFilters(next: Filters) {
    setFilters(next);
    setShowFilter(false);
    void fetchPerfumes(next, sort);
  }

  function applySort(next: SortKey) {
    setSort(next);
    setShowSort(false);
    void fetchPerfumes(filters, next);
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
      <div className="sticky top-16 z-20 -mx-5 mb-6 border-y border-gold-400/20 bg-cream/95 px-5 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
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
          {loading && (
            <Loader2
              className="h-5 w-5 animate-spin text-gold-600"
              aria-label="Carregando"
            />
          )}
        </div>
      </div>

      {/* Grid: 2 colunas mobile, 4 desktop */}
      {perfumes.length === 0 && !loading ? (
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
        <div
          className={`grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 lg:grid-cols-4 ${
            loading ? 'opacity-60' : ''
          }`}
        >
          {perfumes.map((perfume) => (
            <ProductCard key={perfume.id} perfume={perfume} />
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
