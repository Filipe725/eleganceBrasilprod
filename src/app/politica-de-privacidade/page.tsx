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
    body: `Nosso site funciona como um catálogo digital: você navega e monta seu carrinho sem criar conta e sem informar dados pessoais. Os itens do carrinho ficam armazenados apenas no seu próprio navegador (localStorage). Ao finalizar o pedido, você é redirecionado(a) ao WhatsApp, e as informações compartilhadas a partir daí (nome, telefone, endereço de entrega) são fornecidas por você diretamente na conversa. Se você se cadastrar no Clube de Decants, guardamos os dados informados no formulário: nome, e-mail, WhatsApp, endereço de entrega, plano escolhido e preferências olfativas.`,
  },
  {
    title: '2. Como usamos as informações',
    body: `As informações compartilhadas pelo WhatsApp são utilizadas exclusivamente para processar seu pedido: confirmação de itens, combinação de pagamento e organização da entrega. Os dados do Clube de Decants são usados apenas para gerenciar sua assinatura: combinar o pagamento, escolher os decants de acordo com o seu perfil e realizar as entregas mensais. Eles ficam guardados enquanto a assinatura existir ou até você pedir a exclusão. Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.`,
  },
  {
    title: '3. Cookies e armazenamento local',
    body: `Utilizamos o armazenamento local do navegador para manter os itens do seu carrinho e a sua escolha sobre cookies entre visitas. Com a sua autorização, também usamos o Meta Pixel (Meta Platforms), uma ferramenta de medição que registra páginas visitadas, produtos adicionados ao carrinho e o início do pedido pelo WhatsApp, para avaliarmos e melhorarmos nossos anúncios. O Meta Pixel só é carregado se você clicar em "Aceitar" no aviso de cookies; você pode mudar sua escolha a qualquer momento em "Preferências de cookies", no rodapé do site.`,
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
