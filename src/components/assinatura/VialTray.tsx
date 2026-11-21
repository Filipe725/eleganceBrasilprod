/**
 * Bandeja de decants da abertura do Clube: um frasco por família
 * olfativa, com o líquido dourado em níveis diferentes. O líquido sobe
 * uma única vez ao carregar (transform, só compositor) e fica parado para
 * quem pediu "reduzir movimento". Puramente ilustrativo (aria-hidden).
 */
const FRASCOS = [
  { familia: 'Amadeirado', nivel: 0.74 },
  { familia: 'Cítrico', nivel: 0.58 },
  { familia: 'Floral', nivel: 0.86 },
  { familia: 'Oriental', nivel: 0.66 },
];

export function VialTray() {
  return (
    <figure aria-hidden className="mx-auto w-full max-w-sm md:max-w-md">
      <div className="flex items-end justify-center gap-7 sm:gap-8">
        {FRASCOS.map(({ familia, nivel }, i) => (
          <div key={familia} className="flex flex-col items-center">
            {/* tampa metálica + gargalo */}
            <span className="h-3.5 w-6 rounded-[3px] bg-gradient-to-b from-gold-300 to-gold-500 sm:w-7" />
            <span className="h-2 w-3 bg-cream/25" />
            {/* vidro */}
            <span className="relative h-40 w-11 overflow-hidden rounded-b-2xl rounded-t-md border border-cream/35 bg-cream/[0.04] sm:h-48 sm:w-12">
              <span
                className="absolute inset-x-0 bottom-0 origin-bottom animate-fill-up bg-gradient-to-t from-gold-600 via-gold-500 to-gold-400 motion-reduce:animate-none"
                style={{ height: `${nivel * 100}%`, animationDelay: `${150 + i * 140}ms` }}
              />
              {/* reflexo do vidro */}
              <span className="absolute bottom-3 left-1.5 top-3 w-1 rounded-full bg-cream/20" />
            </span>
          </div>
        ))}
      </div>
      {/* bandeja */}
      <div className="mt-0 h-2 rounded-b-md border-x border-b border-gold-400/40 bg-gold-500/10" />
      <figcaption className="mt-3 flex justify-center gap-7 sm:gap-8">
        {FRASCOS.map(({ familia }) => (
          <span
            key={familia}
            className="w-11 text-center font-display text-xs italic text-cream/75 sm:w-12 sm:text-sm"
          >
            <span className="-mx-4 block">{familia}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
