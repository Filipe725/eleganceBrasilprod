'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

type Status = 'validating' | 'ready' | 'invalid';

/** Tempo máximo esperando o Supabase trocar o token da URL por uma sessão. */
const LINK_TIMEOUT_MS = 12000;

/**
 * Troca o token do link (convite/recuperação) por uma sessão e devolve o
 * e-mail da conta ('' se ausente) ou null se o link for inválido.
 *
 * O cliente do @supabase/ssr usa fluxo PKCE e RECUSA tokens no hash
 * (#access_token=...) — exatamente o formato dos links de convite e
 * recuperação gerados no servidor. Por isso a troca é feita aqui,
 * explicitamente, e só o resultado DESTA troca libera o formulário: uma
 * sessão anterior no navegador nunca conta como prova.
 */
async function exchangeLinkToken(): Promise<string | null> {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const query = new URLSearchParams(window.location.search);
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  const tokenHash = query.get('token_hash');
  const otpType = query.get('type');

  // Tira os tokens da barra de endereço/histórico assim que lidos.
  window.history.replaceState(null, '', window.location.pathname);

  try {
    const supabase = createClient();
    if (tokenHash) {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: otpType === 'invite' ? 'invite' : 'recovery',
      });
      return error || !data.session ? null : (data.session.user.email ?? '');
    }
    if (accessToken && refreshToken) {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      return error || !data.session ? null : (data.session.user.email ?? '');
    }
  } catch {
    // Falha de rede ou token malformado: trata como link inválido.
  }
  return null;
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
  // Token de uso único: a troca roda UMA vez mesmo que o efeito rode de
  // novo (Strict Mode em dev monta → desmonta → monta).
  const exchangeRef = useRef<Promise<string | null> | null>(null);

  useEffect(() => {
    if (!exchangeRef.current) {
      exchangeRef.current = exchangeLinkToken();
    }
    let cancelled = false;

    // Rede travada: não deixa a tela presa em "Validando link...".
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setStatus((current) => (current === 'validating' ? 'invalid' : current));
      }
    }, LINK_TIMEOUT_MS);

    exchangeRef.current
      .then((email) => {
        if (cancelled) return;
        if (email === null) {
          setStatus('invalid');
          return;
        }
        setAccountEmail(email || null);
        setStatus('ready');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      clearTimeout(timeout);
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
    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

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
