import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { STORE_NAME } from '@/lib/constants';
import { SITE_URL } from '@/lib/site';
import { FloatingWhatsApp } from '@/components/site/FloatingWhatsApp';
import { CookieConsent } from '@/components/site/CookieConsent';
import './globals.css';

const DESCRIPTION =
  'Fragrâncias artesanais que unem a vitalidade da flora brasileira à sofisticação da alta perfumaria europeia. Monte seu pedido e finalize pelo WhatsApp.';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: `${STORE_NAME} — Perfumaria de Luxo`,
  description: DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: STORE_NAME,
    title: `${STORE_NAME} — Perfumaria de Luxo`,
    description: DESCRIPTION,
    images: ['/hero-desktop.jpeg'],
  },
  icons: {
    icon: [
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon_io/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111c2a',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        {/* Primeiro item do Tab: pula cabeçalho e menu (teclado/leitor de tela) */}
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-ink-900 focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-cream"
        >
          Pular para o conteúdo
        </a>
        {children}
        <FloatingWhatsApp />
        {/* Meta Pixel: carregado só após o aceite de cookies (LGPD) */}
        <CookieConsent />
      </body>
    </html>
  );
}
