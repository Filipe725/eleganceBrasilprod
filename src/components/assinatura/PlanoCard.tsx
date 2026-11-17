import type { PlanoAssinatura } from '@/lib/types';
import { formatVolume } from '@/lib/decants';
import { MESES_MINIMOS, totalAdiantado } from '@/lib/assinatura';

interface PlanoCardProps {
  plano: PlanoAssinatura;
  selecionado: boolean;
  /** Plano mais completo: card escuro, para diferenciar sem selo de "mais vendido". */
  destaque: boolean;
  onSelect: () => void;
}

const reais = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

/** 70 -> "70", 79.9 -> "79,90" (sem ",00" em preço redondo) */
function valor(preco: number): string {
  return Number.isInteger(preco)
    ? reais.format(preco)
    : preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Frascos desenhados: um por decant, altura proporcional ao volume. */
function Frascos({ qtd, volumeMl, escuro }: { qtd: number; volumeMl: number; escuro: boolean }) {
  const altura = Math.min(44, Math.max(22, volumeMl * 4.4));
  const vidro = escuro ? 'border-cream/50' : 'border-ink-900/35';
  const tampa = escuro ? 'bg-cream/60' : 'bg-ink-900/60';
  return (
    <div className="flex h-12 items-end gap-1.5" aria-hidden>
      {Array.from({ length: Math.min(qtd, 8) }, (_, i) => (
        <div key={i} className="flex flex-col items-center">
          <span className={`h-1.5 w-1.5 rounded-[1px] ${tampa}`} />
          <span
            className={`relative w-3 overflow-hidden rounded-b-[3px] rounded-t-[1px] border ${vidro}`}
            style={{ height: altura }}
          >
            <span className="absolute inset-x-0 bottom-0 h-[68%] bg-gold-500/80" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function PlanoCard({ plano, selecionado, destaque, onSelect }: PlanoCardProps) {
  const porDecant = plano.preco_mensal / plano.qtd_decants;
  const decants = plano.qtd_decants === 1 ? 'decant' : 'decants';

  const base = destaque
    ? 'bg-ink-900 text-cream border-ink-900'
    : 'bg-white text-ink-900 border-ink-900/15 hover:border-ink-900/40';
  const anel = selecionado
    ? destaque
      ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-cream-low'
      : 'border-ink-900 ring-1 ring-ink-900'
    : '';
  const suave = destaque ? 'text-cream/65' : 'text-muted';

  return (
    <label
      className={`flex cursor-pointer flex-col rounded-md border p-5 transition sm:p-6 ${base} ${anel}`}
    >
      <input
        type="radio"
        name="plano"
        value={plano.id}
        checked={selecionado}
        onChange={onSelect}
        className="sr-only"
      />

      <div className="flex items-start justify-between gap-4">
        <span
          className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${
            destaque ? 'text-gold-400' : 'text-gold-600'
          }`}
        >
          {plano.nome}
        </span>
        <Frascos qtd={plano.qtd_decants} volumeMl={plano.volume_ml} escuro={destaque} />
      </div>

      <p className="mt-5 flex items-baseline gap-1">
        <span className={`text-sm ${suave}`}>R$</span>
        <span className="font-display text-4xl font-semibold leading-none">
          {valor(plano.preco_mensal)}
        </span>
        <span className={`text-sm ${suave}`}>/mês</span>
      </p>
      <p className={`mt-1.5 text-xs ${suave}`}>
        a partir de {MESES_MINIMOS} meses (R$ {valor(totalAdiantado(plano))})
      </p>

      <p className="mt-3 text-sm font-medium">
        {plano.qtd_decants} {decants} de {formatVolume(plano.volume_ml)}
      </p>
      {plano.qtd_decants > 1 && (
        <p className={`text-xs ${suave}`}>sai a R$ {valor(porDecant)} cada</p>
      )}

      {plano.descricao && (
        <p className={`mt-4 text-[13px] leading-relaxed ${suave}`}>{plano.descricao}</p>
      )}

      <span className="flex-1" />
      <span
        className={`mt-5 flex items-center gap-2 border-t pt-4 text-xs font-semibold uppercase tracking-[0.15em] ${
          destaque ? 'border-cream/15' : 'border-ink-900/10'
        } ${selecionado ? '' : suave}`}
      >
        <span
          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
            destaque ? 'border-cream/60' : 'border-ink-900/50'
          }`}
        >
          {selecionado && (
            <span
              className={`h-2 w-2 rounded-full ${destaque ? 'bg-gold-400' : 'bg-ink-900'}`}
            />
          )}
        </span>
        {selecionado ? 'Plano escolhido' : 'Escolher'}
      </span>
    </label>
  );
}
