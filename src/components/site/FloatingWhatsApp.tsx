'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { STORE_NAME, WHATSAPP_NUMBER } from '@/lib/constants';

/**
 * Botão flutuante do WhatsApp, fixo no canto inferior direito de toda
 * a área pública, para conversão rápida de dúvidas em conversas.
 */
export function FloatingWhatsApp() {
  const pathname = usePathname();

  if (!WHATSAPP_NUMBER || pathname.startsWith('/admin')) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá, ${STORE_NAME}! Estou no site e tenho uma dúvida. 😊`
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Tirar dúvidas pelo WhatsApp"
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl shadow-ink-950/25 transition hover:scale-105 hover:brightness-105 active:scale-95"
    >
      <MessageCircle className="h-7 w-7" aria-hidden />
    </a>
  );
}
