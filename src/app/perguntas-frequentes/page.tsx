import type { Metadata } from 'next';
import { ChevronDown } from 'lucide-react';
import { PageShell } from '@/components/site/PageShell';
import { STORE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Perguntas Frequentes — ${STORE_NAME}`,
  description: 'Tire suas dúvidas sobre pedidos, pagamento e entrega.',
};

const FAQ = [
  {
    q: 'Como faço um pedido?',
    a: 'É simples: navegue pelo catálogo, toque em "Adicionar ao Carrinho" nos perfumes desejados e depois em "Finalizar Pedido pelo WhatsApp". Você será redirecionado(a) para a nossa conversa com a lista do pedido já preenchida — sem cadastro e sem senha.',
  },
  {
    q: 'Quais formas de pagamento vocês aceitam?',
    a: 'Combinamos o pagamento diretamente na conversa do WhatsApp: Pix, cartão de crédito (com parcelamento) e boleto. Você escolhe o que for mais confortável.',
  },
  {
    q: 'Os perfumes são originais?',
    a: 'Sim, 100% originais e com garantia de procedência. Trabalhamos apenas com fornecedores autorizados e enviamos nota fiscal em todas as compras.',
  },
  {
    q: 'Vocês entregam em todo o Brasil?',
    a: 'Sim! Calculamos o frete pelo seu CEP durante o atendimento no WhatsApp e informamos o prazo estimado antes de você confirmar o pedido.',
  },
  {
    q: 'Posso trocar ou devolver um produto?',
    a: 'Sim. Nos termos do Código de Defesa do Consumidor, você pode desistir da compra em até 7 dias corridos após o recebimento. Basta nos chamar no WhatsApp que organizamos a troca ou devolução.',
  },
  {
    q: 'Meu carrinho some se eu fechar o site?',
    a: 'Não! Os itens ficam salvos no seu navegador. Você pode voltar mais tarde e continuar de onde parou.',
  },
];

export default function PerguntasFrequentesPage() {
  return (
    <PageShell
      title="Perguntas Frequentes"
      subtitle="Tudo o que você precisa saber antes de pedir."
    >
      <div className="space-y-3">
        {FAQ.map((item) => (
          <details
            key={item.q}
            className="group rounded-xl border border-gold-400/30 bg-white shadow-card"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                className="h-5 w-5 shrink-0 text-gold-600 transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-5 text-base leading-relaxed text-charcoal">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </PageShell>
  );
}
