import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Montserrat } from 'next/font/google';
import { STORE_NAME } from '@/lib/constants';
import { FloatingWhatsApp } from '@/components/site/FloatingWhatsApp';
import './globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

const sans = Montserrat({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: `${STORE_NAME} — Perfumaria de Luxo`,
  description:
    'Fragrâncias artesanais que unem a vitalidade da flora brasileira à sofisticação da alta perfumaria europeia. Monte seu pedido e finalize pelo WhatsApp.',
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
  themeColor: '#01261f',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">
        {children}
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
