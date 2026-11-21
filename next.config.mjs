// Só o Storage do NOSSO projeto Supabase passa pelo otimizador de imagens.
// Com `**.supabase.co`, qualquer pessoa podia usar o site para otimizar
// imagens hospedadas em outros projetos Supabase (custo na Vercel e
// superfície para falhas do otimizador).
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname;
  } catch {
    return null;
  }
})();

/**
 * Content-Security-Policy: limita de onde o navegador aceita scripts,
 * imagens e conexões. Se algum dia entrar um XSS, ele não consegue
 * carregar script de fora nem mandar dados (ex.: a sessão do admin, que o
 * @supabase/ssr guarda em cookie legível por JS) para outro domínio.
 *
 * - 'unsafe-inline' em script-src: o Next injeta scripts inline de
 *   hidratação; sem nonce (que deixaria todas as páginas dinâmicas), é o
 *   necessário. O ganho real está em connect-src/img-src/form-action.
 * - Meta Pixel: script em connect.facebook.net, eventos em facebook.com.
 * - Supabase: API/Auth/Storage (https) e Realtime (wss).
 * - ViaCEP: preenchimento de endereço no Clube de Decants.
 */
const supabaseOrigin = supabaseHost ? `https://${supabaseHost}` : '';
const supabaseWs = supabaseHost ? `wss://${supabaseHost}` : '';
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin} https://www.facebook.com`,
  "font-src 'self'",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://viacep.com.br https://www.facebook.com https://connect.facebook.net`,
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
]
  .join('; ')
  .replace(/\s+/g, ' ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Não anuncia a tecnologia do servidor (cabeçalho X-Powered-By).
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseHost,
            pathname: '/storage/v1/object/public/perfumes/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Bloqueia embutir o site (loja e /admin) em iframe de outra
          // origem — proteção contra clickjacking nas telas de login.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
