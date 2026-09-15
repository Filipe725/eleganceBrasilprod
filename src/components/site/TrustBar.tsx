import { Percent, WalletCards, Zap, Lock } from 'lucide-react';

const ITEMS = [
  {
    Icon: Percent,
    title: 'Frete Grátis',
    desc: 'Nas compras acima de R$250,00',
  },
  {
    Icon: WalletCards,
    title: 'Parcele sem juros',
    desc: 'Todo o site em até 3x sem juros',
  },
  {
    Icon: Zap,
    title: 'Desconto no Pix',
    desc: 'Ganhe mais 5% de desconto pagando via Pix',
  },
  {
    Icon: Lock,
    title: 'Site seguro',
    desc: 'Seus dados estão protegidos',
  },
] as const;

/**
 * Barra de confiança exibida logo abaixo do Hero: benefícios-chave
 * (frete, parcelamento, Pix, segurança) em ícones + título + descrição,
 * no tom lilás de referência (#D8CBD9).
 */
export function TrustBar() {
  return (
    <section className="border-y border-black/5 bg-[#D8CBD9]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-6 gap-y-7 px-5 py-8 sm:grid-cols-4 sm:gap-x-8 sm:px-6">
        {ITEMS.map(({ Icon, title, desc }, index) => (
          <div
            key={title}
            className={`flex items-start gap-3 ${index > 0 ? 'hidden sm:flex' : ''}`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink-900/30 text-ink-900">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-display text-sm font-semibold uppercase tracking-wide text-ink-900 sm:text-base">
                {title}
              </p>
              <p className="mt-0.5 text-xs leading-snug text-ink-900/70 sm:text-sm">
                {desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
