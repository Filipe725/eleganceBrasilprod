import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

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

  return (
    <div className="min-h-dvh bg-cream">
      <AdminHeader userEmail={user.email ?? ''} />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <AdminDashboard initialPerfumes={perfumes} initialSeccoes={seccoes} />
      </main>
    </div>
  );
}
