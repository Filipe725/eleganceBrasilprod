export const FAMILIAS_OLFATIVAS = [
  'Amadeirado',
  'Cítrico',
  'Floral',
  'Oriental',
  'Frutal',
  'Aromático',
  'Chipre',
  'Fougère',
] as const;

export const STORE_NAME =
  process.env.NEXT_PUBLIC_STORE_NAME ?? 'ÉléganceBrasil';

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

export const STORE_EMAIL =
  process.env.NEXT_PUBLIC_STORE_EMAIL ?? 'elegancebrasilgaranhuns@gmail.com';

export const STORE_ADDRESS =
  process.env.NEXT_PUBLIC_STORE_ADDRESS ??
  'Garanhuns-PE';

/** Links institucionais exibidos no footer e nas páginas estáticas. */
export const INSTITUTIONAL_LINKS = [
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/politica-de-privacidade', label: 'Política de Privacidade' },
  { href: '/perguntas-frequentes', label: 'Perguntas Frequentes' },
  { href: '/fale-conosco', label: 'Fale Conosco' },
] as const;
