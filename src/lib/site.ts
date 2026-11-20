import { headers } from 'next/headers';

/** URL pública fixa do site (ex.: https://elegancebrasil.com.br), se configurada. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || null;

/**
 * Origem do site para montar links absolutos (convite de admin, sitemap,
 * dados estruturados). Prefere NEXT_PUBLIC_SITE_URL: o cabeçalho `Host`
 * vem da requisição e pode ser forjado. Sem a variável, cai no Host —
 * só para não quebrar ambientes ainda não configurados. Uso no servidor.
 */
export async function getSiteUrl(): Promise<string> {
  if (SITE_URL) return SITE_URL;

  const h = await headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
