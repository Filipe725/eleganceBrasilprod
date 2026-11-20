'use client';

import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, Mail, ShieldCheck, ShieldOff, UserPlus } from 'lucide-react';
import {
  changeAdminRole,
  inviteAdmin,
  revokeAdmin,
  sendPasswordResetToMember,
  type AdminUser,
  type PapelEquipe,
} from '@/app/admin/actions';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminUsersManagerProps {
  initialAdmins: AdminUser[];
  currentUserId: string;
  notify: (message: string) => void;
}

const PAPEL_LABEL: Record<PapelEquipe, string> = {
  admin: 'Admin',
  vendedor: 'Vendedor(a)',
};

const PAPEL_DESCRICAO: Record<PapelEquipe, string> = {
  admin: 'acesso total',
  vendedor: 'perfumes, banners e hero — sem excluir perfumes, sem assinaturas e sem equipe',
};

const NETWORK_ERROR =
  'Falha de rede. Verifique a conexão (ou desative extensões do navegador que possam estar bloqueando requisições) e tente novamente.';

const selectClass =
  'rounded-xl border border-ink-700/20 bg-white px-3 py-3 text-sm text-ink-900 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600 disabled:opacity-50';

/**
 * Aba "Equipe": convida membros por e-mail já com o papel (admin ou
 * vendedor), troca o papel de quem já está na equipe e revoga acesso —
 * sem apagar a conta. Só admins chegam aqui; as Server Actions conferem
 * isso de novo no servidor.
 */
export function AdminUsersManager({
  initialAdmins,
  currentUserId,
  notify,
}: AdminUsersManagerProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [email, setEmail] = useState('');
  const [papelConvite, setPapelConvite] = useState<PapelEquipe>('vendedor');
  const [inviting, setInviting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminToRevoke, setAdminToRevoke] = useState<AdminUser | null>(null);

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setInviting(true);
    try {
      const result = await inviteAdmin(email, papelConvite);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setAdmins((current) => [...current, result.data]);
      setEmail('');
      notify(
        `Convite enviado para ${result.data.email} como ${PAPEL_LABEL[result.data.papel]}.`
      );
    } catch {
      // Falha de rede antes mesmo de chegar ao servidor — sem esse catch,
      // essa exceção derruba a tela com um erro genérico do Next.
      setError(NETWORK_ERROR);
    } finally {
      setInviting(false);
    }
  }

  async function handleChangeRole(member: AdminUser, papel: PapelEquipe) {
    if (papel === member.papel) return;
    setBusyId(member.user_id);
    try {
      const result = await changeAdminRole(member.user_id, papel);
      if (!result.ok) {
        notify(result.error);
        return;
      }
      setAdmins((current) =>
        current.map((a) => (a.user_id === member.user_id ? { ...a, papel } : a))
      );
      notify(`${member.email} agora é ${PAPEL_LABEL[papel]}.`);
    } catch {
      notify(NETWORK_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function handleSendReset(member: AdminUser) {
    setBusyId(member.user_id);
    try {
      const result = await sendPasswordResetToMember(member.user_id);
      notify(
        result.ok
          ? `Link de redefinição de senha enviado para ${result.data.email}.`
          : result.error
      );
    } catch {
      notify(NETWORK_ERROR);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRevoke() {
    if (!adminToRevoke) return;
    const admin = adminToRevoke;

    setBusyId(admin.user_id);
    try {
      const result = await revokeAdmin(admin.user_id);

      if (!result.ok) {
        notify(result.error);
        return;
      }

      setAdmins((current) => current.filter((a) => a.user_id !== admin.user_id));
      notify(`Acesso ao painel removido de ${admin.email}.`);
    } catch {
      notify(NETWORK_ERROR);
    } finally {
      setBusyId(null);
      setAdminToRevoke(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900">Equipe</h1>
        <p className="text-sm text-ink-700/70">
          Quem está aqui pode entrar em /admin. <strong>Admin</strong>:{' '}
          {PAPEL_DESCRICAO.admin}. <strong>Vendedor(a)</strong>:{' '}
          {PAPEL_DESCRICAO.vendedor}.
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
          placeholder="e-mail do novo membro"
          aria-label="E-mail do novo membro"
          className="w-full flex-1 rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
        />
        <select
          value={papelConvite}
          onChange={(event) => setPapelConvite(event.target.value as PapelEquipe)}
          aria-label="Papel do novo membro"
          className={selectClass}
        >
          <option value="vendedor">{PAPEL_LABEL.vendedor}</option>
          <option value="admin">{PAPEL_LABEL.admin}</option>
        </select>
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
          Convidar
        </button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {admins.map((admin) => {
          const isSelf = admin.user_id === currentUserId;
          const busy = busyId === admin.user_id;
          return (
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
                    {PAPEL_LABEL[admin.papel]} desde{' '}
                    {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                    {isSelf && ' • você'}
                  </p>
                </div>
              </div>

              {isSelf ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/[0.06] px-3 py-1.5 text-xs font-semibold text-ink-700">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Sua conta
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={admin.papel}
                    disabled={busy}
                    onChange={(event) =>
                      void handleChangeRole(admin, event.target.value as PapelEquipe)
                    }
                    aria-label={`Papel de ${admin.email}`}
                    className={`${selectClass} py-2 text-xs`}
                  >
                    <option value="vendedor">{PAPEL_LABEL.vendedor}</option>
                    <option value="admin">{PAPEL_LABEL.admin}</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => void handleSendReset(admin)}
                    disabled={busy}
                    title="Envia um e-mail para a pessoa criar uma nova senha"
                    className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-ink-700/20 px-4 py-2 text-xs font-semibold text-ink-700 transition hover:bg-ink-900/5 disabled:opacity-50"
                  >
                    <KeyRound className="h-3.5 w-3.5" aria-hidden />
                    Redefinir senha
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdminToRevoke(admin)}
                    disabled={busy}
                    className="tap-target inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <ShieldOff className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Remover acesso
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {adminToRevoke && (
        <ConfirmDialog
          title="Remover acesso ao painel"
          message={`Remover o acesso de "${adminToRevoke.email}" ao painel? A conta continua existindo, só perde o acesso.`}
          confirmLabel="Remover acesso"
          loading={busyId === adminToRevoke.user_id}
          onConfirm={confirmRevoke}
          onCancel={() => setAdminToRevoke(null)}
        />
      )}
    </div>
  );
}
