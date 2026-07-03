import type { Perfume } from '@/lib/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  perfumes: Perfume[];
  /**
   * 'grid': quebra linha e empilha os cards (usado na vitrine principal).
   * 'carousel': rolagem horizontal com snap, sem quebrar linha (usado
   * nas secções promocionais como "Mais Vendidos" e "Mega Ofertas").
   */
  layout?: 'grid' | 'carousel';
}

export function ProductGrid({ perfumes, layout = 'grid' }: ProductGridProps) {
  if (layout === 'carousel') {
    return (
      <div className="scrollbar-hide -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        {perfumes.map((perfume) => (
          <div
            key={perfume.id}
            className="w-[70%] shrink-0 snap-start sm:w-[45%] md:w-[30%] lg:w-[23%]"
          >
            <ProductCard perfume={perfume} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
      {perfumes.map((perfume) => (
        <ProductCard key={perfume.id} perfume={perfume} />
      ))}
    </div>
  );
}
