'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { formatBRL } from '@/lib/format';

export interface Filters {
  familias: string[];
  tamanhos: string[];
  marcas: string[];
  precoMin: number | null;
  precoMax: number | null;
}

interface Facets {
  familias: string[];
  tamanhos: string[];
  marcas: string[];
  precoTeto: number;
}

interface FilterDrawerProps {
  facets: Facets;
  current: Filters;
  onApply: (filters: Filters) => void;
  onClose: () => void;
}

/**
 * Side drawer de filtros avançados com accordions: família olfativa,
 * tamanho e marca (checkboxes) + faixa de preço (slider min/máx).
 * "Aplicar" dispara a query encadeada no Supabase.
 */
export function FilterDrawer({
  facets,
  current,
  onApply,
  onClose,
}: FilterDrawerProps) {
  const [familias, setFamilias] = useState<string[]>(current.familias);
  const [tamanhos, setTamanhos] = useState<string[]>(current.tamanhos);
  const [marcas, setMarcas] = useState<string[]>(current.marcas);
  const [precoMin, setPrecoMin] = useState(current.precoMin ?? 0);
  const [precoMax, setPrecoMax] = useState(
    current.precoMax ?? facets.precoTeto
  );

  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  }

  function handleApply() {
    onApply({
      familias,
      tamanhos,
      marcas,
      precoMin: precoMin > 0 ? precoMin : null,
      precoMax: precoMax < facets.precoTeto ? precoMax : null,
    });
  }

  function handleClear() {
    setFamilias([]);
    setTamanhos([]);
    setMarcas([]);
    setPrecoMin(0);
    setPrecoMax(facets.precoTeto);
  }

  const checkboxGroup = (
    titulo: string,
    options: string[],
    selected: string[],
    setSelected: (v: string[]) => void
  ) => (
    <details open className="group border-b border-ink-700/10">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
        {titulo}
        {selected.length > 0 && (
          <span className="ml-auto mr-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-wine px-1 text-[11px] font-bold text-white">
            {selected.length}
          </span>
        )}
        <ChevronDown
          className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-1 pb-4">
        {options.length === 0 ? (
          <p className="text-sm text-muted/70">Nenhuma opção disponível.</p>
        ) : (
          options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-sm text-charcoal transition hover:bg-ink-900/5"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(selected, setSelected, option)}
                className="h-5 w-5 rounded accent-wine"
              />
              {option}
            </label>
          ))
        )}
      </div>
    </details>
  );

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Filtrar produtos">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar filtros"
        className="absolute inset-0 animate-fade-in bg-ink-950/40 backdrop-blur-sm"
      />

      <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-slide-in flex-col bg-cream shadow-2xl">
        <header className="flex items-center justify-between border-b border-gold-400/25 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            Filtrar
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="tap-target flex items-center justify-center rounded-full text-muted transition hover:bg-ink-900/5"
          >
            <X className="h-6 w-6" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {checkboxGroup(
            'Família Olfativa',
            facets.familias,
            familias,
            setFamilias
          )}
          {checkboxGroup('Tamanho', facets.tamanhos, tamanhos, setTamanhos)}
          {checkboxGroup('Marca', facets.marcas, marcas, setMarcas)}

          {/* Faixa de preço */}
          <details open className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
              Faixa de Preço
              <ChevronDown
                className="h-4 w-4 text-muted transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="space-y-4 pb-5">
              <p className="text-sm font-semibold text-wine">
                {formatBRL(precoMin)} — {formatBRL(precoMax)}
              </p>
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="preco-min">
                  Mínimo
                </label>
                <input
                  id="preco-min"
                  type="range"
                  min={0}
                  max={facets.precoTeto}
                  step={10}
                  value={precoMin}
                  onChange={(event) =>
                    setPrecoMin(
                      Math.min(Number(event.target.value), precoMax)
                    )
                  }
                  className="w-full accent-wine"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="preco-max">
                  Máximo
                </label>
                <input
                  id="preco-max"
                  type="range"
                  min={0}
                  max={facets.precoTeto}
                  step={10}
                  value={precoMax}
                  onChange={(event) =>
                    setPrecoMax(
                      Math.max(Number(event.target.value), precoMin)
                    )
                  }
                  className="w-full accent-wine"
                />
              </div>
            </div>
          </details>
        </div>

        <footer className="flex gap-3 border-t border-ink-700/10 bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleClear}
            className="tap-target flex-1 rounded-xl border border-ink-700/25 px-4 py-3 text-sm font-semibold text-ink-800 transition hover:bg-ink-900/5"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="tap-target flex-[2] rounded-xl bg-ink-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-ink-800 active:scale-[0.98]"
          >
            Aplicar filtros
          </button>
        </footer>
      </aside>
    </div>
  );
}
