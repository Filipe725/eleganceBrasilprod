'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  onAddOption: (value: string) => void;
  addPlaceholder?: string;
  emptyLabel?: string;
}

/**
 * Dropdown de múltipla escolha reutilizado em Família olfativa e nas 3
 * categorias de Notas olfativas: mostra os valores já cadastrados em
 * outros perfumes (via `options`) e permite digitar um valor novo, que
 * passa a aparecer para os próximos cadastros assim que o perfume é salvo.
 */
export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
  onAddOption,
  addPlaceholder = 'Adicionar novo...',
  emptyLabel = 'Nada cadastrado ainda.',
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [novo, setNovo] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  function handleAdd() {
    const valor = novo.trim();
    if (!valor) return;
    onAddOption(valor);
    if (!selected.includes(valor)) onChange([...selected, valor]);
    setNovo('');
  }

  return (
    <div ref={ref}>
      <span className="mb-1.5 block text-sm font-medium text-ink-800">{label}</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-left text-ink-900 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
        >
          <span className={`truncate ${selected.length === 0 ? 'text-ink-700/40' : ''}`}>
            {selected.length > 0 ? selected.join(', ') : placeholder}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-700/60 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>

        {open && (
          <div className="absolute z-10 mt-2 w-full rounded-xl border border-ink-700/15 bg-white p-3 shadow-card">
            <div className="max-h-52 space-y-0.5 overflow-y-auto">
              {options.length === 0 ? (
                <p className="px-2 py-1.5 text-sm text-ink-700/50">{emptyLabel}</p>
              ) : (
                options.map((o) => (
                  <label
                    key={o}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-ink-800 hover:bg-cream"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(o)}
                      onChange={() => toggle(o)}
                      className="h-4 w-4 rounded accent-gold-600"
                    />
                    {o}
                  </label>
                ))
              )}
            </div>
            <div className="mt-2 flex gap-2 border-t border-ink-700/10 pt-2">
              <input
                value={novo}
                onChange={(event) => setNovo(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAdd();
                  }
                }}
                placeholder={addPlaceholder}
                className="w-full rounded-lg border border-ink-700/20 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="shrink-0 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-cream transition hover:bg-ink-800"
              >
                Adicionar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
