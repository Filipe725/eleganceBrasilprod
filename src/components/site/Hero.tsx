'use client';

import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HeroConfig, HeroSlide } from '@/lib/types';
import { isSafeLink } from '@/lib/link';

interface HeroProps {
  slides: HeroSlide[];
  config: HeroConfig;
}

/** Usado quando nenhum slide está ativo/configurado (ex.: instalação nova). */
const FALLBACK_SLIDE: HeroSlide = {
  id: 'fallback',
  titulo: 'A Essência do Brasil, o Refino da Europa.',
  subtitulo:
    'Descubra fragrâncias artesanais que capturam a vitalidade da flora brasileira com a sofisticação da alta perfumaria europeia.',
  texto_botao: 'Explorar Coleção',
  url_destino: '#catalogo',
  imagem_desktop_url: '/hero-desktop.jpeg',
  imagem_mobile_url: '/hero-mobile.jpg',
  ativo: true,
  ordem: 0,
  agendamento_inicio: null,
  agendamento_fim: null,
  created_at: '',
  updated_at: '',
};

/**
 * Hero da Home: carrossel de slides com rotação automática, pausa ao
 * passar o mouse, setas, dots e swipe no mobile. Conteúdo, artes e o
 * intervalo de rotação vêm do painel admin (tabelas `hero_slides` e
 * `hero_config`); sem slides cadastrados, cai no slide estático padrão.
 */
export function Hero({ slides, config }: HeroProps) {
  const items = slides.length > 0 ? slides : [FALLBACK_SLIDE];
  const multiple = items.length > 1;
  const intervalMs = Math.max(2, config.intervalo_segundos || 4) * 1000;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % items.length) + items.length) % items.length);
    },
    [items.length]
  );

  // Rotação automática — pausa no hover, some se só houver 1 slide ou
  // se o autoplay estiver desligado no admin.
  useEffect(() => {
    if (!multiple || !config.autoplay_ativo || paused) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [multiple, config.autoplay_ativo, paused, intervalMs, items.length]);

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    if (touchStartX.current === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    goTo(index + (delta < 0 ? 1 : -1));
  }

  return (
    <section
      className="relative mt-[124px] aspect-[4/5] w-full overflow-hidden sm:aspect-[16/5]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Destaques ÉléganceBrasil"
    >
      {items.map((slide, i) => (
        <HeroSlideView
          key={slide.id}
          slide={slide}
          active={i === index}
          priority={i === 0}
        />
      ))}

      {multiple && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Slide anterior"
            className="tap-target absolute left-2 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card backdrop-blur transition hover:bg-white active:scale-95 sm:left-4"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Próximo slide"
            className="tap-target absolute right-2 top-1/2 z-20 flex -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-ink-900 shadow-card backdrop-blur transition hover:bg-white active:scale-95 sm:right-4"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-7">
            {items.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Ir para o slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-7 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HeroSlideView({
  slide,
  active,
  priority,
}: {
  slide: HeroSlide;
  active: boolean;
  priority: boolean;
}) {
  const desktopSrc = slide.imagem_desktop_url ?? slide.imagem_mobile_url;
  const mobileSrc = slide.imagem_mobile_url ?? slide.imagem_desktop_url;
  const hasLink = Boolean(slide.url_destino && isSafeLink(slide.url_destino));
  const isExternal = hasLink && /^https?:\/\//i.test(slide.url_destino as string);
  const hasTexto = Boolean(slide.titulo || slide.subtitulo || slide.texto_botao);
  const altText = slide.titulo || 'Banner promocional ÉléganceBrasil';

  return (
    <div
      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
        active ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!active}
    >
      {desktopSrc && (
        <>
          {/* Desktop: arte larga (~1920x600) */}
          <div className="absolute inset-0 hidden sm:block">
            <Image
              src={desktopSrc}
              alt={altText}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover"
            />
          </div>
          {/* Mobile: arte vertical (~800x1000) */}
          <div className="absolute inset-0 sm:hidden">
            <Image
              src={mobileSrc ?? desktopSrc}
              alt={altText}
              fill
              priority={priority}
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </>
      )}

      {/* Overlay escuro à esquerda/base: só entra quando há texto do CMS
          para contrastar — uma arte 100% pronta (banner com texto já
          embutido na imagem) fica limpa, sem escurecer à toa. */}
      {hasTexto && (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to right, rgba(11,18,28,0.78) 0%, rgba(11,18,28,0.38) 45%, rgba(11,18,28,0) 72%), linear-gradient(to top, rgba(11,18,28,0.6) 0%, rgba(11,18,28,0) 38%)',
          }}
        />
      )}

      <div className="relative mx-auto flex h-full max-w-6xl flex-col items-start justify-end px-5 pb-16 text-left sm:px-6 sm:pb-20">
        {slide.titulo && (
          <h1 className="max-w-xl font-display text-3xl font-black leading-[1.15] tracking-tight text-white sm:text-5xl sm:leading-[1.1]">
            {slide.titulo}
          </h1>
        )}
        {slide.subtitulo && (
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
            {slide.subtitulo}
          </p>
        )}
        {slide.texto_botao &&
          (hasLink ? (
            <a
              href={slide.url_destino as string}
              tabIndex={active ? 0 : -1}
              {...(isExternal
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className="tap-target mt-8 inline-flex items-center justify-center rounded-lg bg-gold-500 px-10 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-ink-950 shadow-lg shadow-ink-900/30 transition hover:bg-gold-400 active:scale-95"
            >
              {slide.texto_botao}
            </a>
          ) : (
            <span className="tap-target mt-8 inline-flex items-center justify-center rounded-lg bg-gold-500 px-10 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-ink-950 shadow-lg shadow-ink-900/30">
              {slide.texto_botao}
            </span>
          ))}
      </div>
    </div>
  );
}
