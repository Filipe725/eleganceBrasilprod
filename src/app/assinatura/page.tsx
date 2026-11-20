import type { Metadata } from 'next';
import { ClipboardList, Package, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import type { PlanoAssinatura } from '@/lib/types';
import { STORE_NAME } from '@/lib/constants';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { AssinaturaForm } from '@/components/assinatura/AssinaturaForm';

// Planos e preços editados no admin aparecem na hora.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Clube de Decants — ${STORE_NAME}`,
  description:
    'Assine e receba todo mês decants de perfumes originais escolhidos para o seu perfil, direto na sua casa.',
};

const PASSOS = [
  {
    Icon: ClipboardList,
    titulo: 'Conte seu perfil',
    texto: 'Escolha o plano e diga quais famílias olfativas você ama e quais prefere evitar.',
  },
  {
    Icon: Sparkles,
    titulo: 'Nós selecionamos',
    texto: 'Todo mês nossa curadoria escolhe fragrâncias originais pensadas para você.',
  },
  {
    Icon: Package,
    titulo: 'Receba em casa',
    texto: 'Os decants chegam todo mês no seu endereço. Ao fim do período contratado, renovar, pausar ou cancelar é só falar com a gente.',
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

  return (
    <>
      <Header />
      <main className="pt-[108px]">
        {/* Abertura */}
        <section className="bg-ink-900 text-cream">
          <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:px-6 sm:py-20">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-400">
              Clube de Decants
            </p>
            <h1 className="font-display text-3xl font-bold leading-tight sm:text-5xl">
              Uma nova fragrância chegando todo mês
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
              Decants de perfumes originais, escolhidos pelo seu perfil olfativo e
              entregues na sua casa. Descubra seu próximo perfume favorito sem
              comprar o frasco às cegas.
            </p>
            <a
              href="#cadastro"
              className="tap-target mt-8 inline-flex items-center justify-center rounded-lg bg-gold-500 px-10 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-ink-950 transition hover:bg-gold-400"
            >
              Quero assinar
            </a>
          </div>
        </section>

        {/* Como funciona */}
        <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
          <h2 className="mb-8 text-center font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Como funciona
          </h2>
          <ol className="grid gap-6 sm:grid-cols-3">
            {PASSOS.map(({ Icon, titulo, texto }, index) => (
              <li
                key={titulo}
                className="rounded-2xl bg-white p-6 text-center shadow-card"
              >
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-300/40 text-gold-600">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted/70">
                  Passo {index + 1}
                </p>
                <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">
                  {titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{texto}</p>
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
