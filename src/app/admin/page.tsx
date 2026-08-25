import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminUsers, type AdminUser } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = createClient();

  // Segunda camada de proteção além do middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    redirect('/admin/login?erro=sem-permissao');
  }

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

  const perfumes: Perfume[] = perfumesRes.data ?? [];
  const seccoes: BannerSeccao[] = seccoesRes.data ?? [];

  let admins: AdminUser[] = [];
  try {
    admins = await getAdminUsers();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY ausente ou falha ao listar: a aba
    // "Admins" fica vazia em vez de derrubar o painel inteiro.
  }

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
