import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { STORE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Quem Somos — ${STORE_NAME}`,
  description:
    'Conheça a história e os valores da nossa perfumaria.',
};

export default function QuemSomosPage() {
  return (
    <PageShell
      title="Quem Somos"
      subtitle="Nossa história, nossa essência."
    >
      <div className="space-y-5 text-base leading-relaxed text-charcoal">
        <p>
          Olá, Somos a <strong>ELEGANCE AU DETAIL</strong>, um dos maiores
          ecommerces de perfumaria e beleza do Brasil.
        </p>
        <p>
          Nascemos da paixão por fragrâncias que contam histórias: unimos a
          vitalidade da flora brasileira à sofisticação da alta perfumaria
          europeia para levar até você perfumes selecionados com curadoria
          rigorosa, procedência garantida e preços justos.
        </p>
        <p>
          Nosso atendimento é feito por pessoas de verdade, direto pelo
          WhatsApp — do primeiro contato à entrega. Sem burocracia, sem
          cadastro, sem fricção: você escolhe suas fragrâncias favoritas,
          envia o pedido e nós cuidamos de todo o resto.
        </p>
        <p>
          Seja bem-vindo(a) à {STORE_NAME}. Onde a natureza floresce, o luxo
          encontra sua alma.
        </p>
      </div>
    </PageShell>
  );
}
