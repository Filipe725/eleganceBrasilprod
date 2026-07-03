import { createClient } from '@/lib/supabase/server';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { Header } from '@/components/site/Header';
import { Hero } from '@/components/site/Hero';
import { HomeContent } from '@/components/site/HomeContent';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

// O catálogo é sempre buscado no servidor a cada requisição,
// garantindo preços, secções e banners atualizados após edições no admin.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let perfumes: Perfume[] = [];
  let seccoes: BannerSeccao[] = [];

  try {
    const supabase = createClient();
    const [perfumesRes, seccoesRes] = await Promise.all([
      supabase
        .from('perfumes')
        .select('*')
        .eq('ativo', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('banners_seccoes')
        .select('*')
        .order('ordem', { ascending: true }),
    ]);

    if (!perfumesRes.error && perfumesRes.data) perfumes = perfumesRes.data;
    if (!seccoesRes.error && seccoesRes.data) seccoes = seccoesRes.data;
  } catch {
    // Supabase indisponível/mal configurado: renderiza a vitrine vazia
    // em vez de derrubar a página inteira.
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeContent perfumes={perfumes} seccoes={seccoes} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
