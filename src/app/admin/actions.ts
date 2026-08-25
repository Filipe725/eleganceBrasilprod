'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
}

/**
 * Em produção, o Next.js apaga a mensagem de qualquer erro que atravesse
 * a fronteira de uma Server Action (substitui por um texto genérico —
 * mesma proteção usada pro Server Components render), mesmo quando é um
 * `throw new Error('mensagem amigável')` nosso. Por isso as actions abaixo
 * capturam o erro internamente e devolvem esse formato em vez de lançar,
 * preservando a mensagem até a UI.
 */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
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
export async function getAdminUsers(): Promise<ActionResult<AdminUser[]>> {
  try {
    await requireAdmin();

    const admin = createAdminClient();

    const { data: rows, error } = await admin
      .from('admins')
      .select('user_id, created_at')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { ok: true, data: [] };

    const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
      perPage: 200,
    });
    if (usersError) throw new Error(usersError.message);

    const emailById = new Map(usersPage.users.map((u) => [u.id, u.email ?? '—']));

    const data = rows.map((row) => ({
      user_id: row.user_id,
      email: emailById.get(row.user_id) ?? '(usuário removido)',
      created_at: row.created_at,
    }));

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao listar admins.') };
  }
}

/** Convida um novo admin por e-mail: cria a conta e já autoriza na tabela `admins`. */
export async function inviteAdmin(email: string): Promise<ActionResult<AdminUser>> {
  try {
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
      ok: true,
      data: {
        user_id: invited.user.id,
        email: invited.user.email ?? trimmedEmail,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao convidar admin.') };
  }
}

/** Revoga o acesso de admin (não apaga a conta — só remove de `admins`). */
export async function revokeAdmin(userId: string): Promise<ActionResult<null>> {
  try {
    const caller = await requireAdmin();

    if (userId === caller.id) {
      throw new Error('Você não pode remover sua própria permissão de admin.');
    }

    const admin = createAdminClient();
    const { error } = await admin.from('admins').delete().eq('user_id', userId);
    if (error) throw new Error(error.message);

    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao remover admin.') };
  }
}
