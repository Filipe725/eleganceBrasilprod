import type { CartItem } from './types';
import { formatBRL } from './format';
import { STORE_NAME, WHATSAPP_NUMBER } from './constants';
import { cartItemOption, cartItemPrice } from './decants';

/** Link wa.me da loja com uma mensagem já escrita. */
export function buildWhatsAppLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Monta o link dinâmico da API do WhatsApp com o resumo do pedido.
 * Formato: https://wa.me/55NUMERO?text=<mensagem codificada>
 */
export function buildWhatsAppOrderLink(items: CartItem[]): string {
  const total = items.reduce(
    (sum, item) => sum + cartItemPrice(item) * item.quantidade,
    0
  );

  const lines: string[] = [
    `Olá, *${STORE_NAME}*!`,
    'Gostaria de fazer o seguinte pedido:',
    '',
    ...items.map((item) => {
      const preco = cartItemPrice(item);
      const subtotal = preco * item.quantidade;
      const nome = `${item.perfume.marca} ${item.perfume.nome}`.trim();
      const opcao = cartItemOption(item);
      return `▪ ${item.quantidade}x ${nome}${opcao ? ` (${opcao})` : ''} — ${formatBRL(
        preco
      )} cada = *${formatBRL(subtotal)}*`;
    }),
    '',
    `*Total do pedido: ${formatBRL(total)}*`,
    '',
    'Aguardo a confirmação e as opções de pagamento e entrega. Obrigado(a)!',
  ];

  return buildWhatsAppLink(lines.join('\n'));
}
