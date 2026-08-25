'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Mail, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import { inviteAdmin, revokeAdmin, type AdminUser } from '@/app/admin/actions';

interface AdminUsersManagerProps {
  initialAdmins: AdminUser[];
  currentUserId: string;
  notify: (message: string) => void;
}

/**
 * Aba "Admins": convida novos admins por e-mail (cria a conta e já
 * autoriza em `public.admins`) e permite revogar acesso de outros
 * admins — sem apagar a conta, só remove a permissão de escrita.
 */
export function AdminUsersManager({
  initialAdmins,
  currentUserId,
  notify,
}: AdminUsersManagerProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInviting(true);
    try {
      const newAdmin = await inviteAdmin(email);
      setAdmins((current) => [...current, newAdmin]);
      setEmail('');
      notify(`Convite enviado para ${newAdmin.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao convidar admin.');
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(admin: AdminUser) {
    if (
      !window.confirm(
        `Remover a permissão de admin de "${admin.email}"? A conta continua existindo, só perde acesso ao painel.`
      )
    ) {
      return;
    }

    setRevokingId(admin.user_id);
    try {
      await revokeAdmin(admin.user_id);
      setAdmins((current) => current.filter((a) => a.user_id !== admin.user_id));
      notify(`Permissão de admin removida de ${admin.email}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao remover admin.');
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900">Administradores</h1>
        <p className="text-sm text-ink-700/70">
          Quem está aqui pode entrar em /admin e gerenciar perfumes e banners.
        </p>
      </div>

      <form
        onSubmit={handleInvite}
        className="flex flex-col gap-3 rounded-2xl border border-dashed border-gold-500/50 bg-white p-4 sm:flex-row"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="e-mail do novo admin"
          className="w-full flex-1 rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
        />
        <button
          type="submit"
          disabled={inviting || !email.trim()}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
        >
          {inviting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden />
          )}
          Convidar admin
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {admins.map((admin) => (
          <li
            key={admin.user_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-700/10 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900/[0.06] text-ink-900">
                <Mail className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">{admin.email}</p>
                <p className="text-xs text-ink-700/60">
                  admin desde{' '}
                  {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                  {admin.user_id === currentUserId && ' • você'}
                </p>
              </div>
            </div>

            {admin.user_id === currentUserId ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/[0.06] px-3 py-1.5 text-xs font-semibold text-ink-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Sua conta
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRevoke(admin)}
                disabled={revokingId === admin.user_id}
                className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {revokingId === admin.user_id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : (
                  <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                )}
                Remover acesso
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
