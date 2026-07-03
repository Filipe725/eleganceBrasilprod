'use client';

interface SectionOption {
  seccao: string; // slug (ex: 'mais-vendidos')
  titulo: string; // label exibido (ex: 'OS MAIS VENDIDOS')
}

interface SectionFilterProps {
  seccoes: SectionOption[];
  selected: string | null; // slug da secção ativa, ou null para "Todos"
  onSelect: (seccao: string | null) => void;
}

/**
 * Chips pill que filtram a vitrine da Home pelas secções promocionais
 * (tag_destaque). "Todos" limpa o filtro. Ativo: fundo verde escuro
 * #002D24 e texto creme. Inativo: cinza claro com texto escuro.
 */
export function SectionFilter({
  seccoes,
  selected,
  onSelect,
}: SectionFilterProps) {
  if (seccoes.length === 0) return null;

  const baseClass =
    'shrink-0 rounded-full px-4 py-2.5 text-xs font-semibold tracking-[0.05em] transition active:scale-[0.97]';
  const activeClass = 'bg-[#002D24] text-cream shadow-card';
  const inactiveClass = 'bg-ink-900/[0.08] text-ink-900 hover:bg-ink-900/15';

  return (
    <div
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      role="group"
      aria-label="Filtrar por secção promocional"
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`${baseClass} ${selected === null ? activeClass : inactiveClass}`}
      >
        Todos
      </button>
      {seccoes.map((s) => (
        <button
          key={s.seccao}
          type="button"
          onClick={() => onSelect(s.seccao)}
          aria-pressed={selected === s.seccao}
          className={`${baseClass} ${
            selected === s.seccao ? activeClass : inactiveClass
          }`}
        >
          {s.titulo}
        </button>
      ))}
    </div>
  );
}
