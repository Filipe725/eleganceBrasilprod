'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('E-mail ou senha inválidos. Tente novamente.');
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold-400" aria-hidden />
          <h1 className="mt-3 font-display text-2xl text-cream">
            {STORE_NAME}
          </h1>
          <p className="mt-1 text-sm text-cream/60">Painel administrativo</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl bg-ink-900 p-6 shadow-xl ring-1 ring-gold-500/20"
        >
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-cream/80"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-cream/80"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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
            disabled={loading}
            className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-3.5 font-semibold text-ink-950 transition hover:bg-gold-400 disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
