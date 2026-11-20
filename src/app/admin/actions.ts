'use server';

import { after } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/site';

/** Papel na equipe do painel (coluna `admins.papel`, migration 011). */
export type PapelEquipe = 'admin' | 'vendedor';

const PAPEIS: PapelEquipe[] = ['admin', 'vendedor'];

function papelValido(papel: unknown): papel is PapelEquipe {
  return typeof papel === 'string' && (PAPEIS as string[]).includes(papel);
}

export interface AdminUser {
  user_id: string;
  email: string;
  papel: PapelEquipe;
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

/**
 * Garante que quem chamou a action está logado e tem papel 'admin';
 * lança erro caso contrário. Vendedores não passam daqui: gerenciar a
 * equipe (convidar, remover, trocar papel) é exclusivo de admin.
 */
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Não autenticado.');

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) throw new Error('Sem permissão de admin.');

  return user;
}

const USERS_PER_PAGE = 1000;

/** Lista todas as contas do Auth, percorrendo as páginas da API. */
async function listAllUsers(admin: ReturnType<typeof createAdminClient>) {
  const users: User[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: USERS_PER_PAGE,
    });
    if (error) throw new Error(error.message);
    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) return users;
  }
}

/** Lista a equipe atual (e-mail, papel e data de autorização). */
export async function getAdminUsers(): Promise<ActionResult<AdminUser[]>> {
  try {
    await requireAdmin();

    const admin = createAdminClient();

    const { data: rows, error } = await admin
      .from('admins')
      .select('user_id, papel, created_at')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return { ok: true, data: [] };

    const users = await listAllUsers(admin);
    const emailById = new Map(users.map((u) => [u.id, u.email ?? '—']));

    const data = rows.map((row) => ({
      user_id: row.user_id,
      email: emailById.get(row.user_id) ?? '(usuário removido)',
      papel: papelValido(row.papel) ? row.papel : 'admin',
      created_at: row.created_at,
    }));

    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao listar admins.') };
  }
}

/** Convida um membro da equipe por e-mail: cria a conta e já autoriza com o papel escolhido. */
export async function inviteAdmin(
  email: string,
  papel: PapelEquipe = 'admin'
): Promise<ActionResult<AdminUser>> {
  try {
    await requireAdmin();

    const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }
    if (!papelValido(papel)) {
      throw new Error('Papel inválido.');
    }

    const admin = createAdminClient();

    // Convidar um e-mail que já tem conta não cria um usuário novo: o
    // Supabase reenvia um link de recovery para a conta EXISTENTE, que
    // troca a senha dela silenciosamente quando o link é usado — sem
    // essa checagem, um erro de digitação (ou reenvio para o mesmo
    // e-mail) reseta a senha de outro admin achando que está criando
    // um novo.
    const existingUsers = await listAllUsers(admin);
    const jaExiste = existingUsers.some(
      (u) => (u.email ?? '').toLowerCase() === trimmedEmail
    );
    if (jaExiste) {
      throw new Error(
        'Este e-mail já possui uma conta cadastrada. Convidar de novo ' +
          'reenviaria um link que trocaria a senha dessa conta existente ' +
          '— use outro e-mail.'
      );
    }

    const { data: invited, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
        redirectTo: `${await getSiteUrl()}/admin/definir-senha`,
      });
    if (inviteError) throw new Error(inviteError.message);

    const { error: insertError } = await admin
      .from('admins')
      .insert({ user_id: invited.user.id, papel });
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
        papel,
        created_at: new Date().toISOString(),
      },
    };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao convidar admin.') };
  }
}

/**
 * Troca o papel de um membro da equipe. Não deixa o admin rebaixar a si
 * mesmo — evita ficar sem nenhum admin e trancado fora da aba de equipe.
 */
export async function changeAdminRole(
  userId: string,
  papel: PapelEquipe
): Promise<ActionResult<null>> {
  try {
    const caller = await requireAdmin();

    if (!papelValido(papel)) throw new Error('Papel inválido.');
    if (userId === caller.id) {
      throw new Error('Você não pode alterar o seu próprio papel.');
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('admins')
      .update({ papel })
      .eq('user_id', userId)
      .select('user_id');
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Membro não encontrado na equipe.');

    return { ok: true, data: null };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao alterar o papel.') };
  }
}

/**
 * Dispara o e-mail de redefinição de senha do Supabase. O link volta
 * para /admin/definir-senha no domínio oficial (NEXT_PUBLIC_SITE_URL),
 * que troca o token por uma sessão e pede a nova senha.
 */
async function sendRecoveryEmail(email: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getSiteUrl()}/admin/definir-senha`,
  });
  if (error) {
    throw new Error(
      /rate limit/i.test(error.message)
        ? 'Limite de e-mails atingido. Aguarde alguns minutos e tente de novo.'
        : error.message
    );
  }
}

/**
 * Procura o e-mail só entre os membros da equipe (tabela `admins`, poucas
 * linhas) — nunca lista todas as contas do Auth numa rota pública.
 */
async function isTeamEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: rows, error } = await admin.from('admins').select('user_id');
  if (error) throw new Error(error.message);

  const users = await Promise.all(
    (rows ?? []).map((row) => admin.auth.admin.getUserById(row.user_id))
  );
  return users.some(({ data }) => (data.user?.email ?? '').toLowerCase() === email);
}

/**
 * "Esqueci minha senha" da tela de login (pública, sem sessão). Só envia
 * o e-mail se o endereço for de alguém da equipe e SEMPRE responde igual.
 * A busca e o envio rodam em `after()`, depois da resposta: o tempo de
 * resposta também não revela se o e-mail é da equipe.
 */
export async function requestPasswordReset(email: string): Promise<ActionResult<null>> {
  const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!trimmedEmail || !trimmedEmail.includes('@') || trimmedEmail.length > 254) {
    return { ok: false, error: 'Informe um e-mail válido.' };
  }

  after(async () => {
    try {
      if (await isTeamEmail(trimmedEmail)) await sendRecoveryEmail(trimmedEmail);
    } catch (err) {
      // Só no log do servidor; quem pediu sempre vê a mesma resposta.
      console.error('requestPasswordReset:', errorMessage(err, 'erro desconhecido'));
    }
  });

  return { ok: true, data: null };
}

/** Admin envia o e-mail de redefinição de senha para um membro da equipe. */
export async function sendPasswordResetToMember(
  userId: string
): Promise<ActionResult<{ email: string }>> {
  try {
    await requireAdmin();

    const admin = createAdminClient();
    const { data: membro, error: membroError } = await admin
      .from('admins')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (membroError) throw new Error(membroError.message);
    if (!membro) throw new Error('Membro não encontrado na equipe.');

    const { data, error } = await admin.auth.admin.getUserById(userId);
    if (error) throw new Error(error.message);
    const email = data.user.email;
    if (!email) throw new Error('Esta conta não tem e-mail cadastrado.');

    await sendRecoveryEmail(email);
    return { ok: true, data: { email } };
  } catch (err) {
    return { ok: false, error: errorMessage(err, 'Erro ao enviar a redefinição de senha.') };
  }
}

/** Revoga o acesso ao painel (não apaga a conta — só remove de `admins`). */
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
