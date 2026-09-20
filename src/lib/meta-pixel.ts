import type { CartItem } from './types';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Dispara o evento padrão "Contact" do Meta Pixel: usado nos pontos de
 * contato gerais (header, rodapé, botão flutuante, fale conosco) para
 * medir conversas iniciadas no WhatsApp a partir do site.
 */
export function trackWhatsAppContact(source: string): void {
  window.fbq?.('track', 'Contact', { content_name: source });
}

/**
 * Dispara o evento padrão "InitiateCheckout" do Meta Pixel no clique de
 * "Finalizar Pedido" do carrinho, com valor e itens do pedido — permite
 * otimizar campanhas para quem de fato inicia uma compra pelo WhatsApp.
 */
export function trackWhatsAppCheckout(items: CartItem[], total: number): void {
  window.fbq?.('track', 'InitiateCheckout', {
    value: total,
    currency: 'BRL',
    num_items: items.reduce((sum, item) => sum + item.quantidade, 0),
    content_ids: items.map((item) => item.perfume.id),
    contents: items.map((item) => ({
      id: item.perfume.id,
      quantity: item.quantidade,
      item_price: item.perfume.preco_atual,
    })),
    content_type: 'product',
  });
}
