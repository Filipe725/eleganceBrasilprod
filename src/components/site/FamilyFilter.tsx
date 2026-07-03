'use client';

/**
 * Chips pill em verde botânico (baixa opacidade quando inativos),
 * conforme o guia de estilo. Com scroll horizontal no mobile.
 */
interface FamilyFilterProps {
  familias: string[];
  selected: string | null;
  onSelect: (familia: string | null) => void;
}

export function FamilyFilter({
  familias,
  selected,
  onSelect,
}: FamilyFilterProps) {
  if (familias.length === 0) return null;

  const baseClass =
    'shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.05em] transition active:scale-[0.97]';

  return (
    <div
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      role="group"
      aria-label="Filtrar por família olfativa"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`${baseClass} ${
          selected === null
            ? 'bg-ink-900 text-white shadow-card'
            : 'bg-ink-900/[0.08] text-ink-900 hover:bg-ink-900/15'
        }`}
      >
        Todos
      </button>
      {familias.map((familia) => (
        <button
          key={familia}
          type="button"
          onClick={() => onSelect(familia)}
          aria-pressed={selected === familia}
          className={`${baseClass} ${
            selected === familia
              ? 'bg-ink-900 text-white shadow-card'
              : 'bg-ink-900/[0.08] text-ink-900 hover:bg-ink-900/15'
          }`}
        >
          {familia}
        </button>
      ))}
    </div>
  );
}
