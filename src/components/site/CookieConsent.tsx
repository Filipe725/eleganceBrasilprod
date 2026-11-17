'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie } from 'lucide-react';
import {
  loadMetaPixel,
  setMetaPixelConsent,
  trackPageView,
} from '@/lib/meta-pixel';

type Consent = 'granted' | 'denied';

const STORAGE_KEY = 'elegance-cookie-consent';
const OPEN_PREFERENCES_EVENT = 'elegance:open-cookie-preferences';

function readConsent(): Consent | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : null;
  } catch {
    return null;
  }
}

function saveConsent(value: Consent) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // navegador sem storage (aba anônima/bloqueio): vale só nesta visita
  }
}

/**
 * Aviso de cookies (LGPD) e carregamento do Meta Pixel. O pixel só é
 * injetado depois do "Aceitar"; quem recusa não envia nenhum dado ao
 * Meta. Também dispara o PageView a cada troca de rota, já que a
 * navegação client-side do Next não recarrega a página. Fora do /admin.
 */
export function CookieConsent() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const [consent, setConsent] = useState<Consent | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const saved = readConsent();
    setConsent(saved);
    setShowBanner(saved === null);

    const open = () => setShowBanner(true);
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  useEffect(() => {
    if (consent === 'granted' && !isAdmin) {
      loadMetaPixel();
      setMetaPixelConsent(true);
    } else if (consent === 'denied') {
      // Se o pixel já tinha sido carregado (aceitou e depois mudou de
      // ideia), para de enviar eventos a partir de agora.
      setMetaPixelConsent(false);
    }
  }, [consent, isAdmin]);

  useEffect(() => {
    if (consent === 'granted' && !isAdmin) trackPageView();
  }, [consent, isAdmin, pathname]);

  function choose(value: Consent) {
    saveConsent(value);
    setConsent(value);
    setShowBanner(false);
  }

  if (!showBanner || isAdmin) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-400/25 bg-cream/95 px-4 py-4 shadow-2xl backdrop-blur-md sm:px-6"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-900">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" aria-hidden />
          <span>
            Usamos cookies de medição (Meta Pixel) para entender como você
            chega até nós e melhorar nossos anúncios. Saiba mais na{' '}
            <Link
              href="/politica-de-privacidade"
              className="font-semibold underline underline-offset-2 hover:text-gold-600"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose('denied')}
            className="tap-target flex-1 rounded-lg border border-ink-700/25 bg-white px-5 py-2.5 text-sm font-semibold text-ink-900 transition hover:border-ink-900 sm:flex-none"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={() => choose('granted')}
            className="tap-target flex-1 rounded-lg bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-950 sm:flex-none"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reabre o aviso de cookies para o visitante rever a escolha (rodapé). */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT))}
      className={className}
    >
      Preferências de cookies
    </button>
  );
}
