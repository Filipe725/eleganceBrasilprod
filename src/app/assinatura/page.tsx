import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoAssinatura } from '@/lib/types';
import { STORE_NAME } from '@/lib/constants';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AssinaturaForm } from '@/components/assinatura/AssinaturaForm';
import { formatBRL } from '@/lib/format';

// Planos e preços editados no admin aparecem na hora.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Clube de Decants — ${STORE_NAME}`,
  description:
    'Assine e receba todo mês decants de perfumes originais escolhidos para o seu perfil, direto na sua casa.',
};

/** Esfuma os 4 lados da foto para ela se fundir ao fundo azul-marinho. */
const FUNDIR_BORDAS = {
  maskImage:
    'linear-gradient(to right, transparent, black 22%, black 85%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
  WebkitMaskImage:
    'linear-gradient(to right, transparent, black 22%, black 85%, transparent), linear-gradient(to bottom, transparent, black 14%, black 86%, transparent)',
  maskComposite: 'intersect',
  WebkitMaskComposite: 'source-in',
} as const;

const PASSOS = [
  {
    titulo: 'Conte seu perfil',
    texto: 'Escolha o plano e diga quais famílias olfativas você ama e quais prefere evitar.',
  },
  {
    titulo: 'Nós selecionamos',
    texto: 'Todo mês nossa curadoria escolhe fragrâncias originais pensadas para você.',
  },
  {
    titulo: 'Receba em casa',
    texto: 'Os decants chegam no seu endereço. Ao fim do período contratado, renovar, pausar ou cancelar é só falar com a gente.',
  },
];

export default async function AssinaturaPage() {
  let planos: PlanoAssinatura[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('planos_assinatura')
      .select('*')
      .eq('ativo', true)
      .order('ordem', { ascending: true });
    if (!error && data) planos = data;
  } catch {
    // Supabase indisponível: a página abre sem planos em vez de quebrar.
  }

  const menorPreco =
    planos.length > 0 ? Math.min(...planos.map((p) => p.preco_mensal)) : null;

  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1} className="pt-[108px] focus:outline-none">
        {/* Abertura (inspirada na arte "Clube de Decants Luxuoso"): título
            em dois tempos, foto dos frascos fundida ao fundo */}
        <section className="relative overflow-hidden bg-ink-950 text-cream">
          {/* feixe de luz dourado, só decoração */}
          <svg
            aria-hidden
            className="pointer-events-none absolute -left-16 top-0 h-48 w-[70%] max-w-3xl opacity-70"
            viewBox="0 0 700 200"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="feixe" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#d4af6a" stopOpacity="0" />
                <stop offset="0.45" stopColor="#d4af6a" stopOpacity="0.9" />
                <stop offset="1" stopColor="#d4af6a" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 195 C 180 150, 330 60, 700 4"
              fill="none"
              stroke="url(#feixe)"
              strokeWidth="1.5"
            />
          </svg>

          <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-5 pb-6 pt-14 sm:px-6 md:grid-cols-[1fr_1.05fr] md:gap-4 md:py-10">
            <div className="md:py-10">
              <h1 className="font-display leading-none">
                <span className="block text-4xl font-medium sm:text-5xl lg:text-6xl">
                  Clube de
                </span>
                <span className="mt-1 block text-7xl font-semibold tracking-tight text-gold-400 sm:text-8xl lg:text-9xl">
                  Decants
                </span>
              </h1>
              <span aria-hidden className="mt-7 block h-px w-24 bg-gold-500" />
              <p className="mt-7 max-w-md text-lg leading-relaxed text-cream/80 [text-wrap:pretty]">
                Uma fragrância nova por mês, escolhida pelo seu perfil olfativo
                e entregue na sua casa. Você conhece o perfume antes de investir
                no frasco.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-5">
                <a
                  href="#cadastro"
                  className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-gold-500 px-8 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-ink-950 transition hover:bg-gold-400"
                >
                  Escolher meu plano
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
                {menorPreco !== null && (
                  <p className="border-l border-gold-500/40 pl-7 leading-tight">
                    <span className="block text-sm text-cream/75">
                      Planos a partir de
                    </span>
                    <span className="mt-1 block">
                      <span className="text-2xl font-semibold text-gold-400">
                        {formatBRL(menorPreco)}
                      </span>{' '}
                      <span className="text-sm text-cream/75">por mês</span>
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div
              className="relative mx-auto aspect-[914/887] w-full max-w-md md:max-w-none"
              style={FUNDIR_BORDAS}
            >
              <Image
                src="/assinatura/frascos-decants.webp"
                alt="Quatro frascos de decant com perfume âmbar sobre um pedestal de pedra escura"
                fill
                priority
                sizes="(max-width: 768px) 90vw, 560px"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        {/* Como funciona: é uma sequência de verdade, por isso os números */}
        <section className="mx-auto max-w-6xl px-5 py-14 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-semibold text-ink-900">
            Como funciona
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Decant é o perfume original transferido do frasco para um vidrinho
            de poucos mililitros. É o mesmo perfume, na medida certa para usar
            por semanas e descobrir se ele é para você.
          </p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
            {PASSOS.map(({ titulo, texto }, index) => (
              <li key={titulo} className="group">
                <div className="flex items-center gap-4">
                  <span className="font-display text-5xl leading-none text-gold-600">
                    {index + 1}
                  </span>
                  <span
                    aria-hidden
                    className="h-px flex-1 bg-gold-500/50 group-last:hidden"
                  />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
                  {titulo}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
                  {texto}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Planos + cadastro */}
        <section id="cadastro" className="scroll-mt-28 bg-cream-low">
          <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
            <h2 className="mb-8 text-center font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
              Escolha seu plano
            </h2>
            {planos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gold-400/40 py-12 text-center text-sm text-muted">
                As inscrições abrem em breve. Fale com a gente pelo WhatsApp para
                entrar na lista de espera.
              </p>
            ) : (
              <AssinaturaForm planos={planos} />
            )}
          </div>
        </section>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
