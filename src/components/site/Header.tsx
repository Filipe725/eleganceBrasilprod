'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Leaf, Search, X } from 'lucide-react';
import { STORE_NAME } from '@/lib/constants';
import { CartButton } from '@/components/cart/CartButton';
import { useSearchStore } from '@/store/search-store';

/**
 * TopAppBar: logo dourado centralizado, atalho para /produtos à
 * esquerda e, à direita, a busca dinâmica (lupa que expande um input,
 * filtrando o grid da Home em tempo real) seguida do carrinho.
 */
export function Header() {
  const { query, isOpen, setQuery, openSearch, closeSearch } =
    useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Fecha a busca ao trocar de página
  useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  function handleOpenSearch() {
    openSearch();
    // A busca filtra o grid da Home: fora dela, leva o usuário para lá
    if (pathname !== '/') router.push('/');
  }

  return (
    <header className="fixed top-0 z-40 w-full border-b border-gold-400/20 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-6">
        <a
          href="/produtos"
          className="tap-target flex w-fit items-center justify-center gap-1.5 text-muted transition hover:text-ink-900"
          aria-label="Ver todos os produtos"
        >
          <Leaf className="h-5 w-5" aria-hidden />
          <span className="hidden text-sm font-medium sm:inline">Produtos</span>
        </a>

        <a href="/" className="justify-self-center text-center">
          <span className="font-display text-lg tracking-wide text-gold-600 sm:text-xl">
            {STORE_NAME}
          </span>
        </a>

        <div className="flex items-center justify-self-end">
          {/* Lupa imediatamente à esquerda do carrinho */}
          <button
            type="button"
            onClick={handleOpenSearch}
            aria-label="Buscar perfume"
            aria-expanded={isOpen}
            className="tap-target flex items-center justify-center rounded-full text-muted transition hover:text-ink-900"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
          <CartButton />
        </div>
      </div>

      {/* Campo de busca expandido */}
      {isOpen && (
        <div className="border-t border-gold-400/20 bg-cream/95 px-5 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeSearch();
              }}
              placeholder="Buscar perfume..."
              aria-label="Buscar perfume por nome ou notas olfativas"
              className="w-full bg-transparent py-2 text-base text-ink-900 placeholder:text-muted/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Fechar busca"
              className="tap-target flex items-center justify-center rounded-full text-muted transition hover:text-ink-900"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
