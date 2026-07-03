'use client';

import { Check, Sparkles, TrendingDown, TrendingUp, X } from 'lucide-react';

export type SortKey = 'menor-preco' | 'maior-preco' | 'lancamentos';

export const SORT_OPTIONS: {
  key: SortKey;
  label: string;
  Icon: typeof Sparkles;
}[] = [
  { key: 'menor-preco', label: 'Menor Preço', Icon: TrendingDown },
  { key: 'maior-preco', label: 'Maior Preço', Icon: TrendingUp },
  { key: 'lancamentos', label: 'Lançamentos', Icon: Sparkles },
];

interface SortSheetProps {
  current: SortKey;
  onSelect: (key: SortKey) => void;
  onClose: () => void;
}

/** Menu inferior (bottom sheet) de ordenação do catálogo. */
export function SortSheet({ current, onSelect, onClose }: SortSheetProps) {
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Ordenar produtos">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute inset-0 animate-fade-in bg-ink-950/40 backdrop-blur-sm"
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-cream p-5 shadow-2xl sm:mx-auto sm:max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Ordenar por
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="tap-target flex items-center justify-center rounded-full text-muted transition hover:bg-ink-900/5"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <ul className="space-y-1 pb-2">
          {SORT_OPTIONS.map(({ key, label, Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => onSelect(key)}
                className={`tap-target flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-medium transition ${
                  current === key
                    ? 'bg-ink-900 text-white'
                    : 'text-ink-900 hover:bg-ink-900/5'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
                {current === key && (
                  <Check className="ml-auto h-4 w-4" aria-hidden />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
