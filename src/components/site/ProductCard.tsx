'use client';

import Image from 'next/image';
import { Droplets, ShoppingBag } from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { formatBRL } from '@/lib/format';
import { perfumeDiscount, MAX_PARCELAS } from '@/lib/discount';
import { useCartStore } from '@/store/cart-store';

interface ProductCardProps {
  perfume: Perfume;
}

/**
 * Card de produto com ancoragem de preço: badge de desconto em vinho
 * sobre a imagem, preço antigo riscado, preço atual em destaque,
 * parcelamento e CTA escuro "COMPRAR" de largura total.
 */
export function ProductCard({ perfume }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);
  const discount = perfumeDiscount(perfume);
  const parcela = perfume.preco_atual / MAX_PARCELAS;

  return (
    <article className="group flex flex-col">
      <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-cream-container shadow-card transition-transform duration-500 group-hover:-translate-y-2">
        {perfume.imagem_url ? (
          <Image
            src={perfume.imagem_url}
            alt={`${perfume.marca} ${perfume.nome}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Droplets className="h-12 w-12 text-gold-500/60" aria-hidden />
          </div>
        )}

        {/* Badge de desconto (ancoragem de preço) */}
        {discount !== null && (
          <span className="absolute left-3 top-3 rounded-full bg-wine px-3 py-1 text-xs font-bold text-white shadow-md">
            {discount}% OFF
          </span>
        )}

        {/* Família olfativa */}
        <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/10 px-3 py-1 text-xs font-medium tracking-[0.03em] text-ink-900 backdrop-blur-sm">
          {perfume.familia_olfativa.join(', ')}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-1 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted/70">
          {perfume.marca}
        </p>
        <h3 className="mb-1 font-display text-lg font-semibold leading-snug text-ink-900">
          {perfume.nome}
          {perfume.tamanho?.length > 0 && (
            <span className="ml-1.5 text-sm font-normal text-muted">
              {perfume.tamanho.join(' / ')}
            </span>
          )}
        </h3>
        {(perfume.notas_olfativas ?? perfume.descricao) && (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted/90">
            {perfume.notas_olfativas ?? perfume.descricao}
          </p>
        )}

        {/* Tipografia de preço ancorado */}
        <div className="mt-2">
          {perfume.preco_antigo != null &&
            perfume.preco_antigo > perfume.preco_atual && (
              <p className="text-xs text-muted/70 line-through">
                {formatBRL(perfume.preco_antigo)}
              </p>
            )}
          <p className="text-xl font-bold text-wine">
            {formatBRL(perfume.preco_atual)}
          </p>
          <p className="text-[11px] text-muted/80">
            em até {MAX_PARCELAS}x de {formatBRL(parcela)} sem juros
          </p>
        </div>

        <button
          type="button"
          onClick={() => addItem(perfume)}
          className="tap-target mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-charcoal px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-ink-950 active:scale-95 sm:text-sm"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden />
          Comprar
        </button>
      </div>
    </article>
  );
}
