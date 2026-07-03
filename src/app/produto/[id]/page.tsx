import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Perfume } from '@/lib/types';
import { STORE_NAME } from '@/lib/constants';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductDetailView } from '@/components/produto/ProductDetailView';
import { RelatedProducts } from '@/components/produto/RelatedProducts';

export const dynamic = 'force-dynamic';

interface ProdutoPageProps {
  params: { id: string };
}

async function getPerfume(id: string): Promise<Perfume | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('perfumes')
    .select('*')
    .eq('id', id)
    .eq('ativo', true)
    .single();

  if (error || !data) return null;
  return data;
}

/** Perfumes com pelo menos uma família olfativa em comum, excluindo o atual. */
async function getRelacionados(perfume: Perfume): Promise<Perfume[]> {
  if (perfume.familia_olfativa.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from('perfumes')
    .select('*')
    .eq('ativo', true)
    .neq('id', perfume.id)
    .overlaps('familia_olfativa', perfume.familia_olfativa)
    .limit(8);

  if (error || !data) return [];
  return data;
}

export async function generateMetadata({
  params,
}: ProdutoPageProps): Promise<Metadata> {
  const perfume = await getPerfume(params.id);
  if (!perfume) return { title: `Produto — ${STORE_NAME}` };

  return {
    title: `${perfume.nome} — ${STORE_NAME}`,
    description: perfume.resumo ?? perfume.descricao ?? undefined,
  };
}

export default async function ProdutoPage({ params }: ProdutoPageProps) {
  const perfume = await getPerfume(params.id);
  if (!perfume) notFound();

  const relacionados = await getRelacionados(perfume);

  return (
    <>
      <Header />
      <main className="pt-16">
        <ProductDetailView perfume={perfume} />
        <RelatedProducts perfumes={relacionados} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
