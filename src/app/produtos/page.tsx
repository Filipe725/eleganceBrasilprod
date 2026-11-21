import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import type { Perfume } from '@/lib/types';
import { PERFUME_SELECT } from '@/lib/decants';
import { STORE_NAME } from '@/lib/constants';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductsExplorer } from '@/components/produtos/ProductsExplorer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Produtos — ${STORE_NAME}`,
  description:
    'Catálogo completo de perfumes com filtros por família olfativa, marca, tamanho e faixa de preço.',
};

export default async function ProdutosPage() {
  let perfumes: Perfume[] = [];

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .select(PERFUME_SELECT)
      .eq('ativo', true)
      .order('created_at', { ascending: false });

    if (!error && data) perfumes = data;
  } catch {
    // Supabase indisponível: a página abre vazia em vez de quebrar.
  }

  return (
    <>
      <Header />
      <main id="conteudo" tabIndex={-1} className="pt-[108px] focus:outline-none">
        <ProductsExplorer initialPerfumes={perfumes} />
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
