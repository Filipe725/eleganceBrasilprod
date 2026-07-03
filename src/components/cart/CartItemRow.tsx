'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2, Droplets } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { formatBRL } from '@/lib/format';
import { useCartStore } from '@/store/cart-store';

interface CartItemRowProps {
  item: CartItem;
}

export function CartItemRow({ item }: CartItemRowProps) {
  const { setQuantity, removeItem } = useCartStore();
  const { perfume, quantidade } = item;

  return (
    <li className="flex gap-3 py-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-ink-800 to-ink-950">
        {perfume.fotos[0] ? (
          <Image
            src={perfume.fotos[0]}
            alt={perfume.nome}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Droplets className="h-6 w-6 text-gold-500/50" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted/70">
              {perfume.marca}
            </p>
            <h3 className="text-sm font-semibold leading-snug text-ink-900">
              {perfume.nome}
            </h3>
            <p className="text-xs text-ink-700/70">
              {perfume.familia_olfativa.join(', ')}
              {perfume.tamanho?.length > 0 && ` • ${perfume.tamanho.join(', ')}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeItem(perfume.id)}
            aria-label={`Remover ${perfume.nome}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-700/60 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-full border border-ink-700/20">
            <button
              type="button"
              onClick={() => setQuantity(perfume.id, quantidade - 1)}
              aria-label="Diminuir quantidade"
              className="flex h-10 w-10 items-center justify-center rounded-l-full transition hover:bg-ink-900/5"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span
              className="w-8 text-center text-sm font-semibold tabular-nums"
              aria-live="polite"
            >
              {quantidade}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(perfume.id, quantidade + 1)}
              aria-label="Aumentar quantidade"
              className="flex h-10 w-10 items-center justify-center rounded-r-full transition hover:bg-ink-900/5"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <span className="text-sm font-bold text-wine">
            {formatBRL(perfume.preco_atual * quantidade)}
          </span>
        </div>
      </div>
    </li>
  );
}
