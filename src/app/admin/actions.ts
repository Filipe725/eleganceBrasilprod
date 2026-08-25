'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
}

/** Garante que quem chamou a action está logado e é admin; lança erro caso contrário. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) throw new Error('Sem permissão de admin.');

  return user;
}

function getSiteOrigin() {
  const h = headers();
  const host = h.get('host') ?? 'localhost:3000';
  const proto =
    h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Lista os admins atuais (e-mail + data de autorização). */
export async function getAdminUsers(): Promise<AdminUser[]> {
  await requireAdmin();

  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('admins')
    .select('user_id, created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  if (!rows || rows.length === 0) return [];

  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
    perPage: 200,
  });
  if (usersError) throw new Error(usersError.message);

  const emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? '—']));

  return rows.map((row) => ({
    user_id: row.user_id,
    email: emailById.get(row.user_id) ?? '(usuário removido)',
    created_at: row.created_at,
  }));
}

/** Convida um novo admin por e-mail: cria a conta e já autoriza na tabela `admins`. */
export async function inviteAdmin(email: string): Promise<AdminUser> {
  await requireAdmin();

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('Informe um e-mail válido.');
  }

  const admin = createAdminClient();

  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
      redirectTo: `${getSiteOrigin()}/admin/definir-senha`,
    });
  if (inviteError) throw new Error(inviteError.message);

  const { error: insertError } = await admin
    .from('admins')
    .insert({ user_id: invited.user.id });
  if (insertError) {
    throw new Error(
      `Convite enviado, mas falha ao autorizar como admin: ${insertError.message}`
    );
  }

  return {
    user_id: invited.user.id,
    email: invited.user.email ?? trimmedEmail,
    created_at: new Date().toISOString(),
  };
}

/** Revoga o acesso de admin (não apaga a conta — só remove de `admins`). */
export async function revokeAdmin(userId: string): Promise<void> {
  const caller = await requireAdmin();

  if (userId === caller.id) {
    throw new Error('Você não pode remover sua própria permissão de admin.');
  }

  const admin = createAdminClient();
  const { error } = await admin.from('admins').delete().eq('user_id', userId);
  if (error) throw new Error(error.message);
}
