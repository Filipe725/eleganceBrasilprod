import type { CartItem, Perfume } from './types';
import { cartItemPrice } from './decants';

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: Fbq;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1098667079338567';

/**
 * Equivalente ao snippet oficial do Meta Pixel: cria a fila `fbq`, injeta
 * o fbevents.js e inicializa o pixel — sem disparar PageView (quem faz
 * isso é o CookieConsent, a cada troca de rota). Só é chamado depois que
 * o visitante aceita os cookies (LGPD). Idempotente.
 */
export function loadMetaPixel(): void {
  if (window.fbq) return;

  const fbq = ((...args: unknown[]) => {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  }) as Fbq;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  fbq('init', META_PIXEL_ID);
}

/** Dispara o evento padrão "PageView" do Meta Pixel. */
export function trackPageView(): void {
  window.fbq?.('track', 'PageView');
}

/** Liga/desliga o envio de eventos conforme a escolha de cookies. */
export function setMetaPixelConsent(granted: boolean): void {
  window.fbq?.('consent', granted ? 'grant' : 'revoke');
}

/**
 * Dispara o evento padrão "AddToCart" do Meta Pixel ao adicionar um
 * perfume ao carrinho — permite montar públicos de carrinho abandonado
 * (quem deu AddToCart mas não chegou a InitiateCheckout) para remarketing.
 */
export function trackAddToCart(perfume: Perfume, preco = perfume.preco_atual): void {
  window.fbq?.('track', 'AddToCart', {
    value: preco,
    currency: 'BRL',
    content_ids: [perfume.id],
    contents: [{ id: perfume.id, quantity: 1, item_price: preco }],
    content_type: 'product',
    content_name: perfume.nome,
  });
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
      item_price: cartItemPrice(item),
    })),
    content_type: 'product',
  });
}
