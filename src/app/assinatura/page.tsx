import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { PlanoAssinatura } from '@/lib/types';
import { STORE_NAME } from '@/lib/constants';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AssinaturaForm } from '@/components/assinatura/AssinaturaForm';
import { VialTray } from '@/components/assinatura/VialTray';
import { formatBRL } from '@/lib/format';

// Planos e preços editados no admin aparecem na hora.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Clube de Decants — ${STORE_NAME}`,
  description:
    'Assine e receba todo mês decants de perfumes originais escolhidos para o seu perfil, direto na sua casa.',
};

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
        {/* Abertura: a bandeja de frascos é o elemento-assinatura da página */}
        <section className="overflow-hidden bg-ink-900 text-cream">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:py-20">
            <div>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] [text-wrap:balance] sm:text-6xl">
                Clube de Decants
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-cream/80 [text-wrap:pretty]">
                Uma fragrância nova por mês, escolhida pelo seu perfil olfativo
                e entregue na sua casa. Você conhece o perfume antes de investir
                no frasco.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <a
                  href="#cadastro"
                  className="tap-target inline-flex items-center justify-center rounded-lg bg-gold-500 px-9 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-ink-950 transition hover:bg-gold-400"
                >
                  Escolher meu plano
                </a>
                {menorPreco !== null && (
                  <p className="text-sm text-cream/75">
                    Planos a partir de{' '}
                    <span className="font-semibold text-gold-400">
                      {formatBRL(menorPreco)}
                    </span>{' '}
                    por mês
                  </p>
                )}
              </div>
            </div>
            <VialTray />
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
