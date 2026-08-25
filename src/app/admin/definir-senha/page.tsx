'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Lock, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

/**
 * Destino do link de convite (`inviteUserByEmail`). O Supabase autentica
 * a pessoa via token no hash da URL (#access_token=...) assim que o SDK
 * do navegador carrega — por isso o middleware libera esta rota mesmo
 * sem cookie de sessão ainda existir na primeira requisição.
 */
export default function DefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
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
          {!ready && !done && (
            <p className="flex items-center justify-center gap-2 py-6 text-sm text-cream/60">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Validando convite...
            </p>
          )}

          {ready && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="••••••••"
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
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  placeholder="••••••••"
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
