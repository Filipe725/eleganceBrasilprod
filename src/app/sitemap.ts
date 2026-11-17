import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { INSTITUTIONAL_LINKS } from '@/lib/constants';
import { getSiteUrl } from '@/lib/site';

// Gerado a cada requisição: produtos novos entram no sitemap na hora.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const estaticas: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/produtos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/assinatura`, changeFrequency: 'weekly', priority: 0.8 },
    ...INSTITUTIONAL_LINKS.map((link) => ({
      url: `${base}${link.href}`,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    })),
  ];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .select('id, updated_at')
      .eq('ativo', true);
    if (error || !data) return estaticas;

    return [
      ...estaticas,
      ...data.map((perfume) => ({
        url: `${base}/produto/${perfume.id}`,
        lastModified: perfume.updated_at,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Supabase indisponível: publica ao menos as páginas fixas
    return estaticas;
  }
}
