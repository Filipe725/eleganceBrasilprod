'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackWhatsAppContact } from '@/lib/meta-pixel';

interface WhatsAppLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  source: string;
  children: ReactNode;
}

/**
 * Link de WhatsApp que reporta o evento padrão "Contact" ao Meta Pixel
 * antes de abrir a conversa, permitindo medir conversas iniciadas pelo
 * site em qualquer ponto de contato (header, rodapé, botão flutuante...).
 */
export function WhatsAppLink({
  source,
  onClick,
  target = '_blank',
  rel = 'noopener noreferrer',
  children,
  ...props
}: WhatsAppLinkProps) {
  return (
    <a
      {...props}
      target={target}
      rel={rel}
      onClick={(event) => {
        trackWhatsAppContact(source);
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
