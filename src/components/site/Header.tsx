'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, MessageCircle, X } from 'lucide-react';
import { STORE_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import { CartButton } from '@/components/cart/CartButton';
import { WhatsAppLink } from './WhatsAppLink';
import { useSearchStore } from '@/store/search-store';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/fale-conosco', label: 'Fale Conosco' },
];

/**
 * TopAppBar em duas linhas: busca sempre visível (desktop) + marca
 * centralizada + Atendimento/Carrinho na primeira; navegação principal
 * na segunda. No mobile, a busca vira lupa que expande (sem espaço pra
 * um campo fixo), o resto do layout se mantém.
 */
export function Header() {
  const { query, isOpen, setQuery, openSearch, closeSearch } =
    useSearchStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) mobileInputRef.current?.focus();
  }, [isOpen]);

  // Fecha a busca mobile ao trocar de página
  useEffect(() => {
    closeSearch();
  }, [pathname, closeSearch]);

  function goToHomeIfNeeded() {
    if (pathname !== '/') router.push('/');
  }

  function handleMobileSearchClick() {
    openSearch();
    goToHomeIfNeeded();
  }

  const whatsappHref = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        `Olá, ${STORE_NAME}! Estou no site e tenho uma dúvida. 😊`
      )}`
    : null;

  return (
    <header className="fixed top-0 z-40 w-full border-b border-gold-400/20 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 sm:px-6">
        {/* Busca — campo fixo no desktop, lupa que expande no mobile */}
        <div className="flex items-center">
          <label className="hidden w-full max-w-xs items-center gap-2 rounded-full border border-ink-700/15 bg-white px-4 py-2.5 text-sm text-ink-900 sm:flex">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={goToHomeIfNeeded}
              placeholder="O que você está buscando?"
              aria-label="Buscar perfume por nome, marca, família olfativa ou notas olfativas"
              className="w-full bg-transparent placeholder:text-muted/60 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleMobileSearchClick}
            aria-label="Buscar perfume"
            aria-expanded={isOpen}
            className="tap-target flex items-center justify-center rounded-full text-muted transition hover:text-ink-900 sm:hidden"
          >
            <Search className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Marca */}
        <a href="/" className="justify-self-center text-center leading-tight">
          <span className="block font-display text-xl tracking-wide text-gold-600">
            {STORE_NAME}
          </span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.25em] text-muted sm:block">
            Perfumaria &amp; Cosméticos
          </span>
        </a>

        {/* Atendimento + Carrinho */}
        <div className="flex items-center justify-self-end gap-1">
          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              source="header_desktop"
              className="tap-target hidden items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted transition hover:text-ink-900 sm:flex"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              Atendimento
            </WhatsAppLink>
          )}
          <CartButton showLabel />
        </div>
      </div>

      {/* Navegação principal */}
      <nav aria-label="Navegação principal" className="border-t border-gold-400/10">
        <div className="mx-auto flex max-w-6xl items-center gap-5 overflow-x-auto px-5 py-2.5 text-sm font-medium text-ink-800 sm:px-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="shrink-0 whitespace-nowrap transition hover:text-gold-600"
            >
              {link.label}
            </a>
          ))}
          {whatsappHref && (
            <WhatsAppLink
              href={whatsappHref}
              source="header_nav"
              className="shrink-0 whitespace-nowrap transition hover:text-gold-600"
            >
              Atendimento
            </WhatsAppLink>
          )}
        </div>
      </nav>

      {/* Campo de busca expandido (mobile) */}
      {isOpen && (
        <div className="border-t border-gold-400/20 bg-cream/95 px-5 py-3 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
            <input
              ref={mobileInputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') closeSearch();
              }}
              placeholder="Buscar por nome, marca, família olfativa ou notas..."
              aria-label="Buscar perfume por nome, marca, família olfativa ou notas olfativas"
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
