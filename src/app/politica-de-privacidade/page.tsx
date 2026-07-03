import type { Metadata } from 'next';
import { PageShell } from '@/components/site/PageShell';
import { STORE_NAME, STORE_EMAIL } from '@/lib/constants';

export const metadata: Metadata = {
  title: `Política de Privacidade — ${STORE_NAME}`,
  description: 'Como tratamos seus dados pessoais.',
};

const SECTIONS = [
  {
    title: '1. Quais dados coletamos',
    body: `Nosso site funciona como um catálogo digital: você navega e monta seu carrinho sem criar conta e sem informar dados pessoais. Os itens do carrinho ficam armazenados apenas no seu próprio navegador (localStorage). Ao finalizar o pedido, você é redirecionado(a) ao WhatsApp, e as informações compartilhadas a partir daí (nome, telefone, endereço de entrega) são fornecidas por você diretamente na conversa.`,
  },
  {
    title: '2. Como usamos as informações',
    body: `As informações compartilhadas pelo WhatsApp são utilizadas exclusivamente para processar seu pedido: confirmação de itens, combinação de pagamento e organização da entrega. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.`,
  },
  {
    title: '3. Cookies e armazenamento local',
    body: `Utilizamos apenas o armazenamento local do navegador para manter os itens do seu carrinho entre visitas. Não utilizamos cookies de rastreamento de terceiros.`,
  },
  {
    title: '4. Seus direitos (LGPD)',
    body: `Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você pode solicitar a qualquer momento a confirmação, correção ou exclusão dos dados tratados na nossa conversa de atendimento. Basta nos contatar pelos canais abaixo.`,
  },
  {
    title: '5. Contato do responsável',
    body: `Para exercer seus direitos ou tirar dúvidas sobre esta política, fale conosco pelo e-mail ${STORE_EMAIL} ou pelo WhatsApp disponível no rodapé do site.`,
  },
];

export default function PoliticaPrivacidadePage() {
  return (
    <PageShell
      title="Política de Privacidade"
      subtitle="Transparência total sobre como cuidamos das suas informações."
    >
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 font-display text-xl font-semibold text-ink-900">
              {section.title}
            </h2>
            <p className="text-base leading-relaxed text-charcoal">
              {section.body}
            </p>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
