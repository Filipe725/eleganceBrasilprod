'use client';

import { SearchX } from 'lucide-react';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { useSearchStore, matchesSearch } from '@/store/search-store';
import { HomeSection } from './HomeSection';
import { ProductCatalog } from './ProductCatalog';
import { ProductCard } from './ProductCard';
import { QuoteSection } from './QuoteSection';

interface HomeContentProps {
  perfumes: Perfume[];
  seccoes: BannerSeccao[];
}

/**
 * Corpo da Home. Quando a busca do header está ativa, substitui as
 * secções pelo grid de resultados filtrado em tempo real
 * (case-insensitive em nome, notas olfativas e marca).
 */
export function HomeContent({ perfumes, seccoes }: HomeContentProps) {
  const query = useSearchStore((state) => state.query);
  const searching = query.trim().length > 0;

  if (searching) {
    const resultados = perfumes.filter((p) => matchesSearch(p, query));

    return (
      <section className="mx-auto min-h-[50vh] max-w-6xl px-5 py-12 sm:px-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
          Resultados da busca
        </p>
        <h2 className="mb-8 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          {resultados.length} perfume{resultados.length === 1 ? '' : 's'} para
          &ldquo;{query.trim()}&rdquo;
        </h2>

        {resultados.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold-400/40 py-16 text-center text-muted">
            <SearchX className="h-10 w-10 text-gold-600" aria-hidden />
            <p className="text-sm">
              Nada encontrado. Tente outro nome ou uma nota olfativa
              (ex.: baunilha, âmbar, jasmim).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {resultados.map((perfume) => (
              <ProductCard key={perfume.id} perfume={perfume} />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <>
      {/* Secções dinâmicas com banners promocionais */}
      {seccoes.map((seccao) => (
        <HomeSection
          key={seccao.id}
          seccao={seccao}
          perfumes={perfumes.filter((p) => p.tag_destaque === seccao.seccao)}
        />
      ))}

      {/* Catálogo completo com filtro por secção promocional */}
      <ProductCatalog perfumes={perfumes} seccoes={seccoes} />

      <QuoteSection />
    </>
  );
}
