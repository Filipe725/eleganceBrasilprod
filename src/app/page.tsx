import { createClient } from '@/lib/supabase/server';
import type { BannerSeccao, HeroConfig, HeroSlide, Perfume } from '@/lib/types';
import { getActiveHeroSlides } from '@/lib/hero';
import { Header } from '@/components/site/Header';
import { Hero } from '@/components/site/Hero';
import { TrustBar } from '@/components/site/TrustBar';
import { HomeContent } from '@/components/site/HomeContent';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

// O catálogo é sempre buscado no servidor a cada requisição,
// garantindo preços, secções e banners atualizados após edições no admin.
export const dynamic = 'force-dynamic';

const DEFAULT_HERO_CONFIG: HeroConfig = {
  intervalo_segundos: 4,
  autoplay_ativo: true,
};

export default async function HomePage() {
  let perfumes: Perfume[] = [];
  let seccoes: BannerSeccao[] = [];
  let heroSlides: HeroSlide[] = [];
  let heroConfig: HeroConfig = DEFAULT_HERO_CONFIG;

  try {
    const supabase = createClient();
    const [perfumesRes, seccoesRes, heroSlidesRes, heroConfigRes] =
      await Promise.all([
        supabase
          .from('perfumes')
          .select('*')
          .eq('ativo', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('banners_seccoes')
          .select('*')
          .order('ordem', { ascending: true }),
        supabase
          .from('hero_slides')
          .select('*')
          .order('ordem', { ascending: true }),
        supabase.from('hero_config').select('*').eq('id', 1).maybeSingle(),
      ]);

    if (!perfumesRes.error && perfumesRes.data) perfumes = perfumesRes.data;
    if (!seccoesRes.error && seccoesRes.data) seccoes = seccoesRes.data;
    if (!heroSlidesRes.error && heroSlidesRes.data) heroSlides = heroSlidesRes.data;
    if (!heroConfigRes.error && heroConfigRes.data) heroConfig = heroConfigRes.data;
  } catch {
    // Supabase indisponível/mal configurado: renderiza a vitrine vazia
    // em vez de derrubar a página inteira.
  }

  return (
    <>
      <Header />
      <main>
        <Hero slides={getActiveHeroSlides(heroSlides)} config={heroConfig} />
        <TrustBar />
        <HomeContent perfumes={perfumes} seccoes={seccoes} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
