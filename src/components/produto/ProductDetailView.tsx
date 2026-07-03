'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  ShoppingBag,
} from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { formatBRL } from '@/lib/format';
import { perfumeDiscount, MAX_PARCELAS } from '@/lib/discount';
import { useCartStore } from '@/store/cart-store';

interface ProductDetailViewProps {
  perfume: Perfume;
}

/**
 * Layout de duas colunas (1 no mobile): galeria com miniaturas clicáveis
 * à esquerda, informações + compra à direita.
 */
export function ProductDetailView({ perfume }: ProductDetailViewProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [fotoAtiva, setFotoAtiva] = useState(0);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(
    perfume.tamanho[0] ?? null
  );

  const discount = perfumeDiscount(perfume);
  const parcela = perfume.preco_atual / MAX_PARCELAS;
  const fotos = perfume.fotos;
  const temVariasFotos = fotos.length > 1;

  function fotoAnterior() {
    setFotoAtiva((atual) => (atual === 0 ? fotos.length - 1 : atual - 1));
  }

  function proximaFoto() {
    setFotoAtiva((atual) => (atual === fotos.length - 1 ? 0 : atual + 1));
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:py-12">
      {/* Coluna esquerda: galeria */}
      <div className="flex flex-col-reverse gap-4 sm:flex-row">
        {/* Miniaturas: linha horizontal no mobile, coluna vertical no desktop */}
        {temVariasFotos && (
          <div className="flex gap-3 overflow-x-auto sm:w-20 sm:shrink-0 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto">
            {fotos.map((foto, index) => (
              <button
                key={foto + index}
                type="button"
                onClick={() => setFotoAtiva(index)}
                aria-label={`Ver foto ${index + 1}`}
                aria-pressed={fotoAtiva === index}
                className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                  fotoAtiva === index
                    ? 'border-ink-900'
                    : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={foto}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Imagem principal em destaque */}
        <div className="flex-1">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-container shadow-card">
            {fotos.length > 0 ? (
              <Image
                src={fotos[fotoAtiva]}
                alt={`${perfume.marca} ${perfume.nome}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Droplets className="h-16 w-16 text-gold-500/50" aria-hidden />
              </div>
            )}

            {temVariasFotos && (
              <>
                <button
                  type="button"
                  onClick={fotoAnterior}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-900 shadow-md transition hover:bg-white"
                >
                  <ChevronLeft className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={proximaFoto}
                  aria-label="Próxima foto"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-ink-900 shadow-md transition hover:bg-white"
                >
                  <ChevronRight className="h-5 w-5" aria-hidden />
                </button>
              </>
            )}
          </div>

          {temVariasFotos && (
            <div className="mt-3 flex justify-center gap-1.5">
              {fotos.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setFotoAtiva(index)}
                  aria-label={`Ir para foto ${index + 1}`}
                  aria-current={fotoAtiva === index}
                  className={`h-1.5 rounded-full transition-all ${
                    fotoAtiva === index
                      ? 'w-6 bg-ink-900'
                      : 'w-1.5 bg-ink-900/25 hover:bg-ink-900/40'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Coluna direita: informações e compra */}
      <div className="flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7A5B1D]">
          {perfume.marca}
        </p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
          {perfume.nome}
        </h1>

        <div className="mt-4">
          {discount !== null && perfume.preco_antigo != null && (
            <p className="text-sm text-muted/70 line-through">
              {formatBRL(perfume.preco_antigo)}
            </p>
          )}
          <p className="text-3xl font-bold text-wine">
            {formatBRL(perfume.preco_atual)}
          </p>
          <p className="text-sm text-muted/80">
            em até {MAX_PARCELAS}x de {formatBRL(parcela)} sem juros
          </p>
        </div>

        {perfume.tamanho.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold text-ink-800">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {perfume.tamanho.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTamanhoSelecionado(t)}
                  aria-pressed={tamanhoSelecionado === t}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    tamanhoSelecionado === t
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-700/25 bg-white text-ink-800 hover:border-ink-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => addItem(perfume)}
          className="tap-target mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-ink-950 active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" aria-hidden />
          Comprar
        </button>

        {/* Especificações detalhadas: descrição, família olfativa, notas */}
        {(perfume.descricao ||
          perfume.familia_olfativa.length > 0 ||
          perfume.notas_olfativas) && (
          <div className="mt-10 border-t border-ink-700/10">
            {perfume.descricao && (
              <details open className="group border-b border-ink-700/10 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                  Descrição
                  <ChevronDown
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-charcoal/90">
                  {perfume.descricao}
                </p>
              </details>
            )}

            {perfume.familia_olfativa.length > 0 && (
              <details open className="group border-b border-ink-700/10 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                  Família Olfativa
                  <ChevronDown
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="mt-3 flex flex-wrap gap-2">
                  {perfume.familia_olfativa.map((familia) => (
                    <span
                      key={familia}
                      className="rounded-full bg-ink-900/[0.06] px-3 py-1.5 text-xs font-medium text-ink-900"
                    >
                      {familia}
                    </span>
                  ))}
                </div>
              </details>
            )}

            {perfume.notas_olfativas && (
              <details open className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-display text-lg font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                  Notas Olfativas
                  <ChevronDown
                    className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-charcoal/90">
                  {perfume.notas_olfativas}
                </p>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
