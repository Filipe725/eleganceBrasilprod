import type { CartItem } from './types';
import { formatBRL } from './format';
import { STORE_NAME, WHATSAPP_NUMBER } from './constants';

/**
 * Monta o link dinâmico da API do WhatsApp com o resumo do pedido.
 * Formato: https://wa.me/55NUMERO?text=<mensagem codificada>
 */
export function buildWhatsAppOrderLink(items: CartItem[]): string {
  const total = items.reduce(
    (sum, item) => sum + item.perfume.preco_atual * item.quantidade,
    0
  );

  const lines: string[] = [
    `Olá, *${STORE_NAME}*!`,
    'Gostaria de fazer o seguinte pedido:',
    '',
    ...items.map((item) => {
      const subtotal = item.perfume.preco_atual * item.quantidade;
      const nome = `${item.perfume.marca} ${item.perfume.nome}`.trim();
      return `▪ ${item.quantidade}x ${nome} — ${formatBRL(
        item.perfume.preco_atual
      )} cada = *${formatBRL(subtotal)}*`;
    }),
    '',
    `*Total do pedido: ${formatBRL(total)}*`,
    '',
    'Aguardo a confirmação e as opções de pagamento e entrega. Obrigado(a)!',
  ];

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
