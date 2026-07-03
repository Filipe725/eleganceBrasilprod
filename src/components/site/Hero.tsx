/* eslint-disable @next/next/no-img-element */

/**
 * Hero do guia "L'Essence Botanique": fotografia botânica em tela cheia
 * com gradiente para o creme na base, headline em Playfair no verde
 * primário e CTA verde botânico — como no mockup de referência.
 */
export function Hero() {
  return (
    <section className="relative min-h-[560px] w-full overflow-hidden pt-16 sm:h-[85vh]">
      <picture>
        <source media="(min-width: 640px)" srcSet="/hero-desktop.jpeg" />
        <img
          src="/hero-mobile.jpg"
          alt="Frasco de perfume ÉléganceBrasil entre orquídeas brancas e folhagens tropicais sob luz dourada"
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </picture>
      {/* Esmaece a foto para o creme na base, garantindo leitura do texto */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(252,249,248,0) 35%, rgba(252,249,248,0.82) 75%, rgba(252,249,248,1) 100%)',
        }}
      />

      <div className="relative mx-auto flex h-full min-h-[560px] max-w-6xl flex-col items-center justify-end px-5 pb-12 text-center sm:px-6 sm:pb-16">
        <h1
          className="max-w-2xl font-display text-4xl font-black leading-[1.15] tracking-tight sm:text-6xl sm:leading-[1.1]"
          style={{ color: '#1F1A17' }}
        >
          A Essência do Brasil,
          <br />o Refino da Europa.
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-muted sm:max-w-md sm:text-lg">
          Descubra fragrâncias artesanais que capturam a vitalidade da flora
          brasileira com a sofisticação da alta perfumaria europeia.
        </p>
        <a
          href="#catalogo"
          className="tap-target mt-8 inline-flex items-center justify-center rounded-lg bg-ink-900 px-10 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-white shadow-lg shadow-ink-900/20 transition hover:bg-ink-800 active:scale-95"
        >
          Explorar Coleção
        </a>
      </div>
    </section>
  );
}
