'use client';

import { useEffect } from 'react';
import { X, ShoppingBag, MessageCircle, Trash2 } from 'lucide-react';
import { useCartStore, selectCartTotal } from '@/store/cart-store';
import { buildWhatsAppOrderLink } from '@/lib/whatsapp';
import { formatBRL } from '@/lib/format';
import { CartItemRow } from './CartItemRow';

export function CartDrawer() {
  const { items, isOpen, closeCart, clearCart } = useCartStore();
  const total = useCartStore(selectCartTotal);

  // Após o redirecionamento para o WhatsApp, o pedido foi enviado:
  // limpa o carrinho (e o localStorage, via persist) e fecha a gaveta.
  // O setTimeout garante que a navegação do link aconteça primeiro.
  function handleCheckout() {
    setTimeout(() => {
      clearCart();
      closeCart();
    }, 400);
  }

  // Trava o scroll da página enquanto a gaveta está aberta
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Fecha com a tecla Esc
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeCart]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
      {/* Overlay */}
      <button
        type="button"
        onClick={closeCart}
        aria-label="Fechar carrinho"
        className="absolute inset-0 animate-fade-in bg-ink-950/40 backdrop-blur-md"
      />

      {/* Gaveta lateral */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md animate-slide-in flex-col bg-cream shadow-2xl">
        <header className="flex items-center justify-between border-b border-gold-400/25 px-4 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink-900">
            <ShoppingBag className="h-5 w-5 text-gold-600" aria-hidden />
            Seu carrinho
          </h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Fechar"
            className="tap-target flex items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/5"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-ink-700">
            <ShoppingBag className="h-12 w-12 text-gold-500/60" aria-hidden />
            <p className="text-sm">Seu carrinho está vazio.</p>
            <button
              type="button"
              onClick={closeCart}
              className="tap-target rounded-full border border-ink-900 px-6 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-900 hover:text-cream"
            >
              Explorar perfumes
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink-700/10 overflow-y-auto px-4 sm:px-6">
              {items.map((item) => (
                <CartItemRow key={item.perfume.id} item={item} />
              ))}
            </ul>

            <footer className="space-y-3 border-t border-ink-700/10 bg-white px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-700">Total do pedido</span>
                <span
                  className="font-display text-2xl text-ink-900"
                  aria-live="polite"
                >
                  {formatBRL(total)}
                </span>
              </div>

              <a
                href={buildWhatsAppOrderLink(items)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCheckout}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-4 text-base font-bold text-white shadow-md transition hover:brightness-105 active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                Finalizar Pedido
              </a>
              <p className="text-center text-[11px] text-muted/80">
                Você será redirecionado ao WhatsApp com o resumo do pedido.
              </p>

              <button
                type="button"
                onClick={clearCart}
                className="mx-auto flex items-center gap-1.5 px-2 py-2 text-xs text-ink-700/70 transition hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
                Esvaziar carrinho
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
