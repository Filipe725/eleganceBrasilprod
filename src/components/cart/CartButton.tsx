'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore, selectCartCount } from '@/store/cart-store';

export function CartButton() {
  const openCart = useCartStore((state) => state.openCart);
  const count = useCartStore(selectCartCount);

  // Evita divergência de hidratação: o carrinho vem do localStorage,
  // então o contador só é exibido após a montagem no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <button
      type="button"
      onClick={openCart}
      className="tap-target relative flex items-center justify-center rounded-full text-muted transition hover:text-ink-900"
      aria-label={`Abrir carrinho${mounted && count > 0 ? ` (${count} itens)` : ''}`}
    >
      <ShoppingBag className="h-6 w-6" aria-hidden />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-ink-900 px-1 text-[11px] font-bold text-white">
          {count}
        </span>
      )}
    </button>
  );
}
