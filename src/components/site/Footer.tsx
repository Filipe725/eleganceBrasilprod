import Link from 'next/link';
import { MessageCircle, Mail, MapPin, ShieldCheck, Truck, Lock } from 'lucide-react';
import {
  STORE_NAME,
  STORE_EMAIL,
  STORE_ADDRESS,
  WHATSAPP_NUMBER,
  INSTITUTIONAL_LINKS,
} from '@/lib/constants';

/**
 * Rodapé institucional com trust signals, links das páginas estáticas
 * e contatos (WhatsApp, e-mail e endereço físico). Exibido em todas as
 * páginas via layout raiz.
 */
export function Footer() {
  return (
    <footer className="border-t border-gold-500/20 bg-ink-900 text-cream/70">
      {/* Trust signals */}
      <div className="border-b border-cream/10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 py-8 text-sm sm:grid-cols-3 sm:px-6">
          <p className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0 text-gold-400" aria-hidden />
            Produtos 100% originais com garantia de procedência
          </p>
          <p className="flex items-center gap-3">
            <Truck className="h-6 w-6 shrink-0 text-gold-400" aria-hidden />
            Envio rápido para todo o Brasil
          </p>
          <p className="flex items-center gap-3">
            <Lock className="h-6 w-6 shrink-0 text-gold-400" aria-hidden />
            Atendimento humano e seguro pelo WhatsApp
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-10 sm:grid-cols-3 sm:px-6">
        {/* Marca */}
        <div>
          <p className="font-display text-xl text-gold-400">{STORE_NAME}</p>
          <p className="mt-3 text-sm leading-relaxed">
            Fragrâncias artesanais que unem a vitalidade da flora brasileira à
            sofisticação da alta perfumaria europeia.
          </p>
        </div>

        {/* Institucional */}
        <nav aria-label="Institucional">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Institucional
          </p>
          <ul className="space-y-2 text-sm">
            {INSTITUTIONAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition hover:text-gold-300"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contato */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
            Contato
          </p>
          <ul className="space-y-3 text-sm">
            {WHATSAPP_NUMBER && (
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 transition hover:text-gold-300"
                >
                  <MessageCircle className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                  WhatsApp: +{WHATSAPP_NUMBER}
                </a>
              </li>
            )}
            <li>
              <a
                href={`mailto:${STORE_EMAIL}`}
                className="flex items-center gap-2.5 transition hover:text-gold-300"
              >
                <Mail className="h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                {STORE_EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              {STORE_ADDRESS}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10 py-5 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} {STORE_NAME} — Todos os direitos
        reservados
      </div>
    </footer>
  );
}
