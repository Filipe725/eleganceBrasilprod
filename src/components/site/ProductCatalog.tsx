'use client';

import { useMemo, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { SectionFilter } from './SectionFilter';
import { ProductGrid } from './ProductGrid';

interface ProductCatalogProps {
  perfumes: Perfume[];
  seccoes: BannerSeccao[];
}

export function ProductCatalog({ perfumes, seccoes }: ProductCatalogProps) {
  const [seccaoAtiva, setSeccaoAtiva] = useState<string | null>(null);

  // Mostra no filtro apenas secções que têm ao menos um perfume vinculado
  const seccoesComProdutos = useMemo(
    () =>
      seccoes.filter((s) =>
        perfumes.some((p) => p.tag_destaque === s.seccao)
      ),
    [seccoes, perfumes]
  );

  const visiveis = seccaoAtiva
    ? perfumes.filter((p) => p.tag_destaque === seccaoAtiva)
    : perfumes;

  const tituloSeccaoAtiva = seccoesComProdutos.find(
    (s) => s.seccao === seccaoAtiva
  )?.titulo;

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
        <SectionFilter
          seccoes={seccoesComProdutos}
          selected={seccaoAtiva}
          onSelect={setSeccaoAtiva}
        />
      </div>

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold-400/40 py-16 text-center text-muted">
          <PackageSearch className="h-10 w-10 text-gold-600" aria-hidden />
          <p className="text-sm">
            Nenhum perfume encontrado
            {tituloSeccaoAtiva ? ` em ${tituloSeccaoAtiva}` : ' no momento'}.
          </p>
        </div>
      ) : (
        <ProductGrid perfumes={visiveis} layout="grid" />
      )}
    </section>
  );
}
