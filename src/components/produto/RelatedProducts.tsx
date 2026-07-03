import type { Perfume } from '@/lib/types';
import { ProductCard } from '@/components/site/ProductCard';

interface RelatedProductsProps {
  perfumes: Perfume[];
}

/**
 * Cross-sell "Você também pode gostar": grid no desktop, scroll
 * horizontal no mobile. Reaproveita o mesmo ProductCard da vitrine.
 */
export function RelatedProducts({ perfumes }: RelatedProductsProps) {
  if (perfumes.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 sm:px-6 sm:py-16">
      <h2 className="mb-6 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
        Você também pode gostar
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 md:grid-cols-3 lg:grid-cols-4">
        {perfumes.map((perfume) => (
          <div key={perfume.id} className="w-40 shrink-0 sm:w-auto">
            <ProductCard perfume={perfume} />
          </div>
        ))}
      </div>
    </section>
  );
}
