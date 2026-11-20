'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

type Status = 'validating' | 'confirm' | 'ready' | 'invalid';

/** Tempo máximo esperando o Supabase trocar o token da URL por uma sessão. */
const LINK_TIMEOUT_MS = 12000;

type LinkToken =
  | { kind: 'session'; accessToken: string; refreshToken: string }
  | { kind: 'otp'; tokenHash: string; type: 'invite' | 'recovery' };

/**
 * Lê o token do link (convite/recuperação) e o tira da barra de
 * endereço/histórico. Dois formatos:
 * - `?token_hash=...&type=...` — modelo de e-mail apontando para cá. O
 *   token só é gasto quando a pessoa clica em "Continuar": verificadores
 *   de link de e-mail corporativo abrem a URL, mas não clicam.
 * - `#access_token=...` — link padrão do Supabase, que já passou pelo
 *   /verify (o token já foi gasto lá; aqui só vira sessão).
 */
function readLinkToken(): LinkToken | null {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  window.history.replaceState(null, '', window.location.pathname);

  const tokenHash = query.get('token_hash');
  if (tokenHash) {
    return {
      kind: 'otp',
      tokenHash,
      type: query.get('type') === 'invite' ? 'invite' : 'recovery',
    };
  }
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) {
    return { kind: 'session', accessToken, refreshToken };
  }
  return null;
}

/**
 * Troca o token por uma sessão e devolve o e-mail da conta ('' se
 * ausente) ou null se o link for inválido.
 *
 * O cliente do @supabase/ssr usa fluxo PKCE e RECUSA tokens no hash
 * (#access_token=...), por isso a troca é feita aqui, explicitamente — e
 * só o resultado DESTA troca libera o formulário: uma sessão anterior no
 * navegador nunca conta como prova.
 */
async function exchangeLinkToken(token: LinkToken): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } =
      token.kind === 'otp'
        ? await supabase.auth.verifyOtp({ token_hash: token.tokenHash, type: token.type })
        : await supabase.auth.setSession({
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
          });
    return error || !data.session ? null : (data.session.user.email ?? '');
  } catch {
    // Falha de rede ou token malformado: trata como link inválido.
    return null;
  }
}

/**
 * Destino do link de convite/recuperação. O middleware libera esta rota
 * sem cookie de sessão: a sessão nasce aqui, da troca do token da URL.
 */
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('validating');
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  // O token é lido (e apagado da URL) uma única vez, mesmo que o efeito
  // rode de novo (Strict Mode em dev monta → desmonta → monta); a troca,
  // que gasta o token de uso único, também só acontece uma vez.
  const tokenRef = useRef<LinkToken | null | undefined>(undefined);
  const exchangeRef = useRef<Promise<string | null> | null>(null);
  const mountedRef = useRef(true);

  function startExchange(token: LinkToken) {
    if (!exchangeRef.current) exchangeRef.current = exchangeLinkToken(token);
    setStatus('validating');

    // Rede travada: não deixa a tela presa em "Validando link...".
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        setStatus((current) => (current === 'validating' ? 'invalid' : current));
      }
    }, LINK_TIMEOUT_MS);

    exchangeRef.current
      .then((email) => {
        if (!mountedRef.current) return;
        if (email === null) {
          setStatus('invalid');
          return;
        }
        setAccountEmail(email || null);
        setStatus('ready');
      })
      .finally(() => clearTimeout(timeout));
  }

  useEffect(() => {
    mountedRef.current = true;
    if (tokenRef.current === undefined) tokenRef.current = readLinkToken();
    const token = tokenRef.current;

    if (!token) setStatus('invalid');
    else if (token.kind === 'otp' && !exchangeRef.current) setStatus('confirm');
    else startExchange(token);

    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('A senha deve ter ao menos 10 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSaving(false);
      setError(updateError.message);
      return;
    }

    // Senha trocada: derruba as sessões de outros aparelhos/navegadores
    // (se alguém tinha uma sessão roubada, ela morre aqui). Falha nessa
    // etapa não desfaz a troca — por isso não bloqueia o fluxo.
    await supabase.auth.signOut({ scope: 'others' }).catch(() => undefined);
    setSaving(false);

    setDone(true);
    setTimeout(() => {
      router.push('/admin');
      router.refresh();
    }, 1200);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold-400" aria-hidden />
          <h1 className="mt-3 font-display text-2xl text-cream">{STORE_NAME}</h1>
          <p className="mt-1 text-sm text-cream/60">Defina sua senha de acesso</p>
        </div>

        <div className="rounded-2xl bg-ink-900 p-6 shadow-xl ring-1 ring-gold-500/20">
          {status === 'validating' && !done && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-cream/60">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Validando link...
            </p>
          )}

          {status === 'confirm' && !done && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-sm text-cream/80">
                Clique em continuar para criar sua senha de acesso ao painel.
              </p>
              <button
                type="button"
                onClick={() => tokenRef.current && startExchange(tokenRef.current)}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3.5 font-semibold text-ink-950 transition hover:bg-gold-400"
              >
                Continuar
              </button>
            </div>
          )}

          {status === 'invalid' && !done && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ShieldAlert className="h-8 w-8 text-red-400" aria-hidden />
              <p className="text-sm text-cream/80">
                Link inválido, expirado ou já utilizado.
              </p>
              <p className="text-xs leading-relaxed text-cream/50">
                Peça um novo link em &ldquo;Esqueci minha senha&rdquo; na
                tela de login (ou a um admin, pela aba &ldquo;Equipe&rdquo;) e
                abra-o em uma aba onde ninguém mais esteja logado.
              </p>
            </div>
          )}

          {status === 'ready' && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {accountEmail && (
                <p className="rounded-lg bg-ink-950/60 px-3 py-2 text-center text-xs text-cream/70">
                  Definindo senha para{' '}
                  <span className="font-semibold text-gold-300">
                    {accountEmail}
                  </span>
                </p>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-cream/80"
                >
                  Nova senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="••••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-medium text-cream/80"
                >
                  Confirmar senha
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="••••••••••"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3.5 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Lock className="h-4 w-4" aria-hidden />
                )}
                {saving ? 'Salvando...' : 'Salvar senha e entrar'}
              </button>
            </form>
          )}

          {done && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-cream/80">
              <CheckCircle2 className="h-5 w-5 text-gold-400" aria-hidden />
              Senha definida! Entrando...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
