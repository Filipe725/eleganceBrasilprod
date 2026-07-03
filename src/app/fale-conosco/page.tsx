import type { Metadata } from 'next';
import { MessageCircle, Mail, MapPin, Clock } from 'lucide-react';
import { PageShell } from '@/components/site/PageShell';
import {
  STORE_NAME,
  STORE_EMAIL,
  STORE_ADDRESS,
  WHATSAPP_NUMBER,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: `Fale Conosco — ${STORE_NAME}`,
  description: 'Atendimento pelo WhatsApp, e-mail e endereço físico.',
};

export default function FaleConoscoPage() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Olá, ${STORE_NAME}! Vim pelo site e gostaria de um atendimento. 😊`
  )}`;

  return (
    <PageShell
      title="Fale Conosco"
      subtitle="Atendimento humano, rápido e sem burocracia."
    >
      <div className="space-y-4">
        {/* CTA principal: WhatsApp */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="tap-target flex items-center gap-4 rounded-xl bg-[#25D366] p-5 text-white shadow-md transition hover:brightness-105 active:scale-[0.99]"
        >
          <MessageCircle className="h-8 w-8 shrink-0" aria-hidden />
          <span>
            <span className="block text-lg font-bold">
              Chamar no WhatsApp
            </span>
            <span className="block text-sm opacity-90">
              Resposta rápida em horário comercial
              {WHATSAPP_NUMBER ? ` • +${WHATSAPP_NUMBER}` : ''}
            </span>
          </span>
        </a>

        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href={`mailto:${STORE_EMAIL}`}
            className="flex items-start gap-4 rounded-xl border border-gold-400/30 bg-white p-5 shadow-card transition hover:border-gold-600"
          >
            <Mail className="h-6 w-6 shrink-0 text-gold-600" aria-hidden />
            <span>
              <span className="block font-semibold text-ink-900">E-mail</span>
              <span className="block break-all text-sm text-muted">
                {STORE_EMAIL}
              </span>
            </span>
          </a>

          <div className="flex items-start gap-4 rounded-xl border border-gold-400/30 bg-white p-5 shadow-card">
            <MapPin className="h-6 w-6 shrink-0 text-gold-600" aria-hidden />
            <span>
              <span className="block font-semibold text-ink-900">
                Endereço
              </span>
              <span className="block text-sm text-muted">{STORE_ADDRESS}</span>
            </span>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-xl bg-cream-low p-5">
          <Clock className="h-6 w-6 shrink-0 text-gold-600" aria-hidden />
          <p className="text-sm leading-relaxed text-charcoal">
            <strong className="text-ink-900">Horário de atendimento:</strong>
            <br />
            Segunda a sexta, das 9h às 18h • Sábado, das 9h às 13h
          </p>
        </div>
      </div>
    </PageShell>
  );
}
