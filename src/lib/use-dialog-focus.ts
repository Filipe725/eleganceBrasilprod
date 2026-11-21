'use client';

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Comportamento de foco de gavetas e modais (WAI-ARIA dialog):
 * - ao abrir, leva o foco para dentro (elemento com `data-autofocus` ou o
 *   primeiro focável);
 * - Tab / Shift+Tab ficam presos dentro do diálogo;
 * - Esc chama `onClose`;
 * - ao fechar, devolve o foco ao elemento que abriu (ex.: botão "Filtrar").
 *
 * Elementos com `tabIndex={-1}` (como o fundo escurecido clicável) ficam
 * fora do ciclo do Tab.
 */
export function useDialogFocus<T extends HTMLElement>(
  active: boolean,
  onClose: () => void
) {
  const ref = useRef<T>(null);
  // Ref para não reinstalar os listeners a cada render do pai.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const root = ref.current;
    if (!root) return;

    const previous = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.getClientRects().length > 0
      );

    (root.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [active]);

  return ref;
}
