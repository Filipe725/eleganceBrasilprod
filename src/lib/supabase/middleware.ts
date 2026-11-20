import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Renova a sessão do Supabase e protege as rotas /admin.
 * Usuário não autenticado é redirecionado para /admin/login.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';
  // Destino do convite (`inviteUserByEmail`): a sessão só existe no
  // navegador via token no hash da URL, que o servidor nunca recebe —
  // por isso não dá pra exigir cookie de sessão aqui.
  const isSetPasswordPage = pathname === '/admin/definir-senha';

  if (!pathname.startsWith('/admin')) {
    return response;
  }

  if (!user) {
    if (isLoginPage || isSetPasswordPage) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // Estar logado não basta: só quem está na equipe (tabela `admins`, com
  // papel admin ou vendedor) pode usar o painel. O que cada papel pode
  // fazer lá dentro é decidido pela RLS e pelas Server Actions.
  const { data: isEquipe } = await supabase.rpc('is_equipe');

  if (!isEquipe) {
    // evita loop de redirecionamento / deixa terminar o fluxo de convite
    if (isLoginPage || isSetPasswordPage) return response;
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('erro', 'sem-permissao');
    return NextResponse.redirect(url);
  }

  if (isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return response;
}
