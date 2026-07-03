'use client';

import { useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { FamilyFilter } from './FamilyFilter';
import { ProductCard } from './ProductCard';

interface ProductCatalogProps {
  perfumes: Perfume[];
}

export function ProductCatalog({ perfumes }: ProductCatalogProps) {
  const [familia, setFamilia] = useState<string | null>(null);

  // Mostra no filtro apenas famílias que existem no catálogo
  const familias = useMemo(
    () =>
      Array.from(
        new Set(perfumes.flatMap((p) => p.familia_olfativa))
      ).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [perfumes]
  );

  const visiveis = familia
    ? perfumes.filter((p) => p.familia_olfativa.includes(familia))
    : perfumes;

  return (
    <section
      id="catalogo"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-12 sm:px-6 sm:py-16"
    >
      <div className="mb-8 flex flex-col gap-5">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
            Destaques
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Nossa Coleção
          </h2>
        </div>
        <FamilyFilter
          familias={familias}
          selected={familia}
          onSelect={setFamilia}
        />
      </div>

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold-400/40 py-16 text-center text-muted">
          <PackageSearch className="h-10 w-10 text-gold-600" aria-hidden />
          <p className="text-sm">
            Nenhum perfume encontrado
            {familia ? ` na família ${familia}` : ' no momento'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
          {visiveis.map((perfume) => (
            <ProductCard key={perfume.id} perfume={perfume} />
          ))}
        </div>
      )}
    </section>
  );
}
