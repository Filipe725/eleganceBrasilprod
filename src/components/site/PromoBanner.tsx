import Image from 'next/image';
import type { BannerSeccao } from '@/lib/types';

interface PromoBannerProps {
  banner: BannerSeccao;
}

/**
 * Banner promocional responsivo ("pattern interrupt") exibido acima do
 * grid de cada secção. Usa duas artes via next/image: a horizontal no
 * Desktop e a quadrada/vertical no Mobile — cada uma só é carregada no
 * breakpoint em que está visível (lazy load + `sizes` zerado no outro).
 * Se só uma arte foi enviada, ela é usada nos dois breakpoints.
 */
export function PromoBanner({ banner }: PromoBannerProps) {
  const desktopSrc = banner.imagem_desktop_url ?? banner.imagem_mobile_url;
  const mobileSrc = banner.imagem_mobile_url ?? banner.imagem_desktop_url;

  if (!banner.exibir_banner || !desktopSrc || !mobileSrc) return null;

  const alt = `Banner promocional — ${banner.titulo}`;

  const images = (
    <>
      {/* Desktop: arte horizontal (~3:1) */}
      <div className="relative hidden aspect-[3/1] overflow-hidden rounded-xl shadow-card md:block">
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          sizes="(min-width: 768px) 1152px, 1px"
          className="object-cover"
        />
      </div>
      {/* Mobile: arte quadrada/vertical */}
      <div className="relative aspect-square overflow-hidden rounded-xl shadow-card md:hidden">
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          sizes="(max-width: 767px) 100vw, 1px"
          className="object-cover"
        />
      </div>
    </>
  );

  if (!banner.link_destino) {
    return <div className="mb-6">{images}</div>;
  }

  const isExternal = /^https?:\/\//i.test(banner.link_destino);

  return (
    <a
      href={banner.link_destino}
      {...(isExternal
        ? { target: '_blank', rel: 'noopener noreferrer' }
        : {})}
      className="mb-6 block transition hover:opacity-95 active:scale-[0.995]"
    >
      {images}
    </a>
  );
}
