import type { BannerSeccao, Perfume } from '@/lib/types';
import { PromoBanner } from './PromoBanner';
import { ProductGrid } from './ProductGrid';

interface HomeSectionProps {
  seccao: BannerSeccao;
  perfumes: Perfume[];
}

/**
 * Secção dinâmica da Home ("OS MAIS VENDIDOS", "MEGA OFERTAS", ...):
 * título editorial, banner promocional opcional e grid de produtos
 * marcados com o tag_destaque correspondente.
 */
export function HomeSection({ seccao, perfumes }: HomeSectionProps) {
  const hasBanner =
    seccao.exibir_banner &&
    Boolean(seccao.imagem_desktop_url ?? seccao.imagem_mobile_url);

  // Secção sem banner ativo e sem produtos não ocupa espaço na Home
  if (!hasBanner && perfumes.length === 0) return null;

  return (
    <section
      id={seccao.seccao}
      className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-12 sm:px-6 sm:pt-16"
    >
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-600">
        Seleção especial
      </p>
      <h2 className="mb-6 font-display text-2xl font-semibold uppercase tracking-wide text-ink-900 sm:text-3xl">
        {seccao.titulo}
      </h2>

      <PromoBanner banner={seccao} />

      {perfumes.length > 0 && (
        <ProductGrid perfumes={perfumes} layout="carousel" />
      )}
    </section>
  );
}
