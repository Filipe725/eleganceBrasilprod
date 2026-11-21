import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type {
  Assinante,
  BannerSeccao,
  HeroConfig,
  HeroSlide,
  Perfume,
  PlanoAssinatura,
} from '@/lib/types';
import { PERFUME_SELECT } from '@/lib/decants';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { getAdminUsers, type AdminUser, type PapelEquipe } from './actions';

export const dynamic = 'force-dynamic';

const DEFAULT_HERO_CONFIG: HeroConfig = {
  intervalo_segundos: 4,
  autoplay_ativo: true,
};

export default async function AdminPage() {
  // Segunda camada de proteção além do middleware. Client/auth ficam fora
  // do fluxo de redirect: se SUPABASE_URL/ANON_KEY estiverem ausentes ou
  // erradas (ex.: variável de ambiente não configurada na hospedagem),
  // isso lança erro — sem capturar aqui, o painel derrubava a página
  // inteira em vez de mandar para o login.
  let user: User | null = null;
  let isEquipe = false;
  let isAdmin = false;
  let perfumes: Perfume[] = [];
  let seccoes: BannerSeccao[] = [];
  let heroSlides: HeroSlide[] = [];
  let heroConfig: HeroConfig = DEFAULT_HERO_CONFIG;
  let planos: PlanoAssinatura[] = [];
  let assinantes: Assinante[] = [];
  let configError = false;

  try {
    const supabase = await createClient();

    const {
      data: { user: fetchedUser },
    } = await supabase.auth.getUser();
    user = fetchedUser;

    if (user) {
      const [equipeCheck, adminCheck] = await Promise.all([
        supabase.rpc('is_equipe'),
        supabase.rpc('is_admin'),
      ]);
      isEquipe = Boolean(equipeCheck.data);
      isAdmin = Boolean(adminCheck.data);
    }

    if (user && isEquipe) {
      // Assinantes e planos: a equipe toda LÊ (migration 012) para ver e
      // exportar; só admin altera — a RLS garante isso no banco.
      const [
        perfumesRes,
        seccoesRes,
        heroSlidesRes,
        heroConfigRes,
        planosRes,
        assinantesRes,
      ] = await Promise.all([
          supabase
            .from('perfumes')
            .select(PERFUME_SELECT)
            .order('created_at', { ascending: false }),
          supabase
            .from('banners_seccoes')
            .select('*')
            .order('ordem', { ascending: true }),
          supabase
            .from('hero_slides')
            .select('*')
            .order('ordem', { ascending: true }),
          supabase.from('hero_config').select('*').eq('id', 1).maybeSingle(),
          supabase
            .from('planos_assinatura')
            .select('*')
            .order('ordem', { ascending: true }),
          supabase
            .from('assinantes')
            .select('*')
            .order('created_at', { ascending: false }),
        ]);
      perfumes = perfumesRes.data ?? [];
      seccoes = seccoesRes.data ?? [];
      heroSlides = heroSlidesRes.data ?? [];
      heroConfig = heroConfigRes.data ?? DEFAULT_HERO_CONFIG;
      planos = planosRes.data ?? [];
      assinantes = assinantesRes.data ?? [];
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
  if (!isEquipe) {
    redirect('/admin/login?erro=sem-permissao');
  }

  const papel: PapelEquipe = isAdmin ? 'admin' : 'vendedor';

  // SUPABASE_SERVICE_ROLE_KEY ausente ou falha ao listar: a aba "Equipe"
  // fica vazia em vez de derrubar o painel inteiro. Vendedor nem consulta.
  const adminsResult = isAdmin ? await getAdminUsers() : null;
  const admins: AdminUser[] = adminsResult?.ok ? adminsResult.data : [];

  return (
    <div className="min-h-dvh bg-cream">
      <AdminHeader userEmail={user.email ?? ''} papel={papel} />
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-5xl px-4 py-8 focus:outline-none sm:px-6">
        <AdminDashboard
          initialPerfumes={perfumes}
          initialSeccoes={seccoes}
          initialHeroSlides={heroSlides}
          initialHeroConfig={heroConfig}
          initialAdmins={admins}
          initialPlanos={planos}
          initialAssinantes={assinantes}
          currentUserId={user.id}
          papel={papel}
        />
      </main>
    </div>
  );
}
