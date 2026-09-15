'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, ShieldAlert, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

type Status = 'validating' | 'ready' | 'invalid';

/** Tempo máximo esperando o Supabase trocar o token da URL por uma sessão. */
const LINK_TIMEOUT_MS = 12000;

/**
 * Destino do link de convite/recuperação (`inviteUserByEmail`). O Supabase
 * autentica a pessoa via token no hash/query da URL assim que o SDK do
 * navegador carrega — por isso o middleware libera esta rota mesmo sem
 * cookie de sessão ainda existir na primeira requisição.
 *
 * IMPORTANTE: nunca tratamos "existe uma sessão" como prova de que o
 * convite é válido. O navegador guarda uma única sessão por origem — se
 * o link já tiver sido consumido (reenvio, clique duplo, scanner de
 * e-mail) ou for aberto num navegador onde OUTRO admin já está logado,
 * o SDK do Supabase mantém a sessão antiga intacta e não dispara nada.
 * Só avançamos quando o próprio evento de autenticação (SIGNED_IN /
 * PASSWORD_RECOVERY) disparar em resposta ao token desta URL.
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

  useEffect(() => {
    const hasUrlToken =
      window.location.hash.includes('access_token=') ||
      new URLSearchParams(window.location.search).has('token_hash');

    if (!hasUrlToken) {
      setStatus('invalid');
      return;
    }

    const supabase = createClient();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') && session) {
        setAccountEmail(session.user.email ?? null);
        setStatus('ready');
      }
    });

    // Token inválido/já consumido: o Supabase não emite evento nenhum e
    // preserva silenciosamente qualquer sessão anterior. Sem esse
    // timeout, a tela ficaria presa em "Validando convite..." para
    // sempre — e sem ele um dev futuro poderia "corrigir" isso caindo
    // de volta em getSession(), reabrindo exatamente esta falha.
    const timeout = setTimeout(() => {
      setStatus((current) => (current === 'validating' ? 'invalid' : current));
    }, LINK_TIMEOUT_MS);

    return () => {
      listener.subscription.unsubscribe();
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
              Validando convite...
            </p>
          )}

          {status === 'invalid' && !done && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <ShieldAlert className="h-8 w-8 text-red-400" aria-hidden />
              <p className="text-sm text-cream/80">
                Link de convite inválido, expirado ou já utilizado.
              </p>
              <p className="text-xs leading-relaxed text-cream/50">
                Peça para um admin enviar um novo convite pela aba
                &ldquo;Admins&rdquo; do painel — e abra o link em uma aba
                onde ninguém mais esteja logado.
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
