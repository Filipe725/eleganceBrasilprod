import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Perfume } from '@/lib/types';
import { PERFUME_SELECT } from '@/lib/decants';
import { STORE_NAME } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductDetailView } from '@/components/produto/ProductDetailView';
import { RelatedProducts } from '@/components/produto/RelatedProducts';

export const dynamic = 'force-dynamic';

interface ProdutoPageProps {
  // Next 15: params chega como Promise
  params: Promise<{ id: string }>;
}

// cache(): generateMetadata e a página pedem o mesmo perfume na mesma
// requisição — assim o Supabase é consultado uma vez só.
const getPerfume = cache(async (id: string): Promise<Perfume | null> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .select(PERFUME_SELECT)
      .eq('id', id)
      .eq('ativo', true)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    // Supabase indisponível/mal configurado: cai no notFound() do caller
    // em vez de derrubar a página com um erro genérico.
    return null;
  }
});

/** Perfumes com pelo menos uma família olfativa em comum, excluindo o atual. */
async function getRelacionados(perfume: Perfume): Promise<Perfume[]> {
  if (perfume.familia_olfativa.length === 0) return [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .select(PERFUME_SELECT)
      .eq('ativo', true)
      .neq('id', perfume.id)
      .overlaps('familia_olfativa', perfume.familia_olfativa)
      .limit(8);

    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProdutoPageProps): Promise<Metadata> {
  const { id } = await params;
  const perfume = await getPerfume(id);
  if (!perfume) return { title: `Produto — ${STORE_NAME}` };

  const title = `${perfume.nome} — ${STORE_NAME}`;
  const description = perfume.resumo ?? perfume.descricao ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: `/produto/${perfume.id}` },
    openGraph: {
      title,
      description,
      url: `/produto/${perfume.id}`,
      images: perfume.fotos.slice(0, 1),
    },
  };
}

/** Dados estruturados schema.org/Product (preço e foto nos resultados do Google). */
function productJsonLd(perfume: Perfume, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: perfume.nome,
    brand: { '@type': 'Brand', name: perfume.marca },
    description: perfume.resumo ?? perfume.descricao ?? undefined,
    image: perfume.fotos,
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/produto/${perfume.id}`,
      price: perfume.preco_atual.toFixed(2),
      priceCurrency: 'BRL',
      availability: 'https://schema.org/InStock',
    },
  };
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
  const { id } = await params;
  const perfume = await getPerfume(id);
  if (!perfume) notFound();

  const [relacionados, siteUrl] = await Promise.all([
    getRelacionados(perfume),
    getSiteUrl(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        // `<` escapado: texto vindo do admin nunca fecha a tag <script>
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd(perfume, siteUrl)).replace(/</g, '\\u003c'),
        }}
      />
      <Header />
      <main id="conteudo" tabIndex={-1} className="pt-[108px] focus:outline-none">
        <ProductDetailView perfume={perfume} />
        <RelatedProducts perfumes={relacionados} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
