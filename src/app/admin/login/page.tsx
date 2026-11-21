'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, Loader2, MailCheck, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { STORE_NAME } from '@/lib/constants';
import { requestPasswordReset } from '../actions';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  );
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const erro = searchParams.get('erro');
  const [error, setError] = useState<string | null>(
    erro === 'sem-permissao'
      ? 'Este usuário não tem permissão de admin. Fale com quem administra o catálogo.'
      : erro === 'config'
        ? 'Não foi possível conectar ao banco de dados. Verifique as variáveis de ambiente do Supabase na hospedagem.'
        : null
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [resetSent, setResetSent] = useState(false);

  function switchMode(next: 'login' | 'reset') {
    setMode(next);
    setError(null);
    setResetSent(false);
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setResetSent(true);
    } catch {
      setError('Falha de rede. Verifique a conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

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
    <main id="conteudo" tabIndex={-1} className="flex min-h-dvh items-center justify-center bg-ink-950 px-4 focus:outline-none">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-gold-400" aria-hidden />
          <h1 className="mt-3 font-display text-2xl text-cream">
            {STORE_NAME}
          </h1>
          <p className="mt-1 text-sm text-cream/60">Painel administrativo</p>
        </div>

        {mode === 'reset' ? (
          <div className="space-y-4 rounded-2xl bg-ink-900 p-6 shadow-xl ring-1 ring-gold-500/20">
            {resetSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <MailCheck className="h-8 w-8 text-gold-400" aria-hidden />
                <p className="text-sm text-cream/80">
                  Se <span className="font-semibold text-gold-300">{email}</span>{' '}
                  fizer parte da equipe, você vai receber um e-mail com o link
                  para criar uma nova senha.
                </p>
                <p className="text-xs leading-relaxed text-cream/50">
                  Confira também a caixa de spam. O link vale por pouco tempo e
                  só pode ser usado uma vez.
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-cream/70">
                  Informe o e-mail que você usa para entrar no painel. Vamos
                  enviar um link para você criar uma nova senha.
                </p>
                <div>
                  <label
                    htmlFor="reset-email"
                    className="mb-1.5 block text-sm font-medium text-cream/80"
                  >
                    E-mail
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-ink-700 bg-ink-950 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="voce@exemplo.com"
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
                  {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => switchMode('login')}
              className="tap-target mx-auto flex items-center gap-1.5 text-sm text-cream/60 transition hover:text-gold-300"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Voltar para o login
            </button>
          </div>
        ) : (
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

          <button
            type="button"
            onClick={() => switchMode('reset')}
            className="tap-target mx-auto block text-sm text-cream/60 transition hover:text-gold-300"
          >
            Esqueci minha senha
          </button>
        </form>
        )}
      </div>
    </main>
  );
}
