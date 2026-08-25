import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminUsers, type AdminUser } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  // Segunda camada de proteção além do middleware. Client/auth ficam fora
  // do fluxo de redirect: se SUPABASE_URL/ANON_KEY estiverem ausentes ou
  // erradas (ex.: variável de ambiente não configurada na hospedagem),
  // isso lança erro — sem capturar aqui, o painel derrubava a página
  // inteira em vez de mandar para o login.
  let user: User | null = null;
  let isAdmin = false;
  let perfumes: Perfume[] = [];
  let seccoes: BannerSeccao[] = [];
  let configError = false;

  try {
    const supabase = createClient();

    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;

    if (user) {
      const { data: adminCheck } = await supabase.rpc('is_admin');
      isAdmin = Boolean(adminCheck);
    }

    if (user && isAdmin) {
      const [perfumesRes, seccoesRes] = await Promise.all([
        supabase
          .from('perfumes')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('banners_seccoes')
          .select('*')
          .order('ordem', { ascending: true }),
      ]);
      perfumes = perfumesRes.data ?? [];
      seccoes = seccoesRes.data ?? [];
    }
  } catch {
    configError = true;
  }

  if (configError) {
    redirect('/admin/login?erro=config');
  }
  if (!user) {
    redirect('/admin/login');
  }
  if (!isAdmin) {
    redirect('/admin/login?erro=sem-permissao');
  }

  // SUPABASE_SERVICE_ROLE_KEY ausente ou falha ao listar: a aba "Admins"
  // fica vazia em vez de derrubar o painel inteiro.
  const adminsResult = await getAdminUsers();
  const admins: AdminUser[] = adminsResult.ok ? adminsResult.data : [];

  return (
    <div className="min-h-dvh bg-cream">
      <AdminHeader userEmail={user.email ?? ''} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <AdminDashboard
          initialPerfumes={perfumes}
          initialSeccoes={seccoes}
          initialAdmins={admins}
          currentUserId={user.id}
        />
      </main>
    </div>
  );
}
