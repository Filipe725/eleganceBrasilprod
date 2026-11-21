'use client';

import { useMemo, useState } from 'react';
import {
  Plus,
  SprayCan,
  Images,
  ShieldCheck,
  GalleryHorizontal,
  Package,
  Search,
  X,
} from 'lucide-react';
import type {
  Assinante,
  BannerSeccao,
  HeroConfig,
  HeroSlide,
  Perfume,
  PlanoAssinatura,
} from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { deleteImages } from '@/lib/upload';
import { matchesSearch } from '@/store/search-store';
import type { AdminUser, PapelEquipe } from '@/app/admin/actions';
import { PERFUME_SELECT } from '@/lib/decants';
import { PerfumeForm, type DecantInput, type PerfumeFormData } from './PerfumeForm';
import { PerfumeList } from './PerfumeList';
import { BannerManager } from './BannerManager';
import { HeroManager } from './HeroManager';
import { AdminUsersManager } from './AdminUsersManager';
import { AssinaturasManager } from './AssinaturasManager';
import { ConfirmDialog } from './ConfirmDialog';

interface AdminDashboardProps {
  initialPerfumes: Perfume[];
  initialSeccoes: BannerSeccao[];
  initialHeroSlides: HeroSlide[];
  initialHeroConfig: HeroConfig;
  initialAdmins: AdminUser[];
  initialPlanos: PlanoAssinatura[];
  initialAssinantes: Assinante[];
  currentUserId: string;
  /**
   * Só controla o que aparece na tela. A permissão de verdade está na RLS
   * (migration 011) e nas Server Actions — esconder aqui é conveniência.
   */
  papel: PapelEquipe;
}

type Tab = 'perfumes' | 'banners' | 'hero' | 'assinaturas' | 'admins';

/**
 * Orquestra o painel: aba de perfumes (CRUD completo), aba de
 * banners/secções da Home e aba de administradores.
 */
export function AdminDashboard({
  initialPerfumes,
  initialSeccoes,
  initialHeroSlides,
  initialHeroConfig,
  initialAdmins,
  initialPlanos,
  initialAssinantes,
  currentUserId,
  papel,
}: AdminDashboardProps) {
  const isAdmin = papel === 'admin';
  const [tab, setTab] = useState<Tab>('perfumes');
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [seccoes, setSeccoes] = useState<BannerSeccao[]>(initialSeccoes);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(initialHeroSlides);
  const [heroConfig, setHeroConfig] = useState<HeroConfig>(initialHeroConfig);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>(initialPlanos);
  const [assinantes, setAssinantes] = useState<Assinante[]>(initialAssinantes);
  const assinantesPendentes = assinantes.filter((a) => a.status === 'pendente').length;
  const [editing, setEditing] = useState<Perfume | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [perfumeToDelete, setPerfumeToDelete] = useState<Perfume | null>(null);
  const [deletingPerfume, setDeletingPerfume] = useState(false);
  const [perfumeQuery, setPerfumeQuery] = useState('');

  const perfumesFiltrados = useMemo(() => {
    const q = perfumeQuery.trim();
    if (!q) return perfumes;
    return perfumes.filter((p) => matchesSearch(p, q));
  }, [perfumes, perfumeQuery]);

  function notify(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
  }

  /**
   * Sincroniza os decants do perfume com a lista do formulário, usando o
   * volume como chave: volumes que continuam mantêm o mesmo id (carrinhos
   * com esse decant seguem válidos); volumes retirados são excluídos.
   */
  async function saveDecants(perfumeId: string, decants: DecantInput[]) {
    const supabase = createClient();

    let remover = supabase.from('perfume_decants').delete().eq('perfume_id', perfumeId);
    if (decants.length > 0) {
      remover = remover.not(
        'volume_ml',
        'in',
        `(${decants.map((d) => d.volume_ml).join(',')})`
      );
    }
    const { error: deleteError } = await remover;
    if (deleteError) throw new Error(deleteError.message);

    if (decants.length === 0) return;
    const { error: upsertError } = await supabase.from('perfume_decants').upsert(
      decants.map((d) => ({
        perfume_id: perfumeId,
        volume_ml: d.volume_ml,
        preco: d.preco,
        ativo: d.ativo,
      })),
      { onConflict: 'perfume_id,volume_ml' }
    );
    if (upsertError) throw new Error(upsertError.message);
  }

  async function handleSave(formData: PerfumeFormData, decants: DecantInput[]) {
    const supabase = createClient();
    const anterior = editing;

    const { data: salvo, error } = anterior
      ? await supabase
          .from('perfumes')
          .update(formData)
          .eq('id', anterior.id)
          .select()
          .single()
      : await supabase.from('perfumes').insert(formData).select().single();

    if (error) throw new Error(error.message);

    // O perfume já foi gravado: uma falha nos decants não pode deixar o
    // formulário aberto (salvar de novo duplicaria um perfume novo).
    let decantError: string | null = null;
    try {
      await saveDecants(salvo.id, decants);
    } catch (err) {
      decantError = err instanceof Error ? err.message : 'erro desconhecido';
    }

    const { data: completo } = await supabase
      .from('perfumes')
      .select(PERFUME_SELECT)
      .eq('id', salvo.id)
      .single();
    const perfumeFinal: Perfume = completo ?? salvo;

    if (anterior) {
      void deleteImages(
        anterior.fotos.filter((foto) => !perfumeFinal.fotos.includes(foto))
      );
      setPerfumes((current) =>
        current.map((perfume) => (perfume.id === anterior.id ? perfumeFinal : perfume))
      );
    } else {
      setPerfumes((current) => [perfumeFinal, ...current]);
    }

    notify(
      decantError
        ? `Perfume salvo, mas os decants não: ${decantError}`
        : anterior
          ? 'Perfume atualizado com sucesso!'
          : 'Perfume adicionado com sucesso!'
    );
    setShowForm(false);
    setEditing(null);
  }

  async function confirmDeletePerfume() {
    if (!perfumeToDelete) return;
    const perfume = perfumeToDelete;

    setDeletingPerfume(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .delete()
      .eq('id', perfume.id)
      .select('id');
    setDeletingPerfume(false);
    setPerfumeToDelete(null);

    if (error) {
      notify(`Erro ao excluir: ${error.message}`);
      return;
    }

    // RLS bloqueia silenciosamente (0 linhas afetadas, sem erro) quando o
    // usuário não está autorizado como admin — sem essa checagem a UI
    // "excluiria" o item localmente e ele voltaria após atualizar a página.
    if (!data || data.length === 0) {
      notify(
        'Não foi possível excluir: seu usuário não tem permissão de admin no banco.'
      );
      return;
    }

    void deleteImages(perfume.fotos);
    setPerfumes((current) => current.filter((p) => p.id !== perfume.id));
    notify('Perfume excluído.');
  }

  async function handleToggleActive(perfume: Perfume) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .update({ ativo: !perfume.ativo })
      .eq('id', perfume.id)
      .select(PERFUME_SELECT)
      .single();

    if (error) {
      notify(`Erro ao atualizar: ${error.message}`);
      return;
    }

    setPerfumes((current) =>
      current.map((p) => (p.id === perfume.id ? data : p))
    );
  }

  const tabClass = (active: boolean) =>
    `tap-target inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
      active
        ? 'bg-ink-900 text-white shadow-card'
        : 'bg-ink-900/[0.06] text-ink-900 hover:bg-ink-900/10'
    }`;

  return (
    <div className="space-y-6">
      {/* Abas */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button
          type="button"
          onClick={() => setTab('perfumes')}
          className={tabClass(tab === 'perfumes')}
        >
          <SprayCan className="h-4 w-4" aria-hidden />
          Perfumes
        </button>
        <button
          type="button"
          onClick={() => setTab('banners')}
          className={tabClass(tab === 'banners')}
        >
          <Images className="h-4 w-4" aria-hidden />
          Banners &amp; Secções
        </button>
        <button
          type="button"
          onClick={() => setTab('hero')}
          className={tabClass(tab === 'hero')}
        >
          <GalleryHorizontal className="h-4 w-4" aria-hidden />
          Hero &amp; Carrossel
        </button>
        <button
              type="button"
              onClick={() => setTab('assinaturas')}
              className={tabClass(tab === 'assinaturas')}
            >
              <Package className="h-4 w-4" aria-hidden />
              Assinaturas
              {assinantesPendentes > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-wine px-1 text-[11px] font-bold text-white">
                  {assinantesPendentes}
                </span>
              )}
            </button>
        {isAdmin && (
            <button
              type="button"
              onClick={() => setTab('admins')}
              className={tabClass(tab === 'admins')}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Equipe
            </button>
        )}
      </div>

      {feedback && (
        <p
          role="status"
          className="rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-3 text-sm text-ink-800"
        >
          {feedback}
        </p>
      )}

      {tab === 'perfumes' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-2xl text-ink-900">
                Gerenciar perfumes
              </h1>
              <p className="text-sm text-ink-700/70">
                {perfumeQuery.trim()
                  ? `${perfumesFiltrados.length} de ${perfumes.length} produto${
                      perfumes.length === 1 ? '' : 's'
                    }`
                  : `${perfumes.length} produto${perfumes.length === 1 ? '' : 's'} cadastrado${
                      perfumes.length === 1 ? '' : 's'
                    }`}
              </p>
            </div>
            {!showForm && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Novo perfume
              </button>
            )}
          </div>

          {!showForm && (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/40"
                aria-hidden
              />
              <input
                type="search"
                value={perfumeQuery}
                onChange={(event) => setPerfumeQuery(event.target.value)}
                placeholder="Buscar por nome, marca, gênero, nota ou família olfativa..."
                aria-label="Buscar perfumes"
                className="w-full rounded-xl border border-ink-700/20 bg-white py-3 pl-11 pr-11 text-sm text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
              />
              {perfumeQuery && (
                <button
                  type="button"
                  onClick={() => setPerfumeQuery('')}
                  aria-label="Limpar busca"
                  className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-700/50 transition hover:bg-ink-900/5 hover:text-ink-900"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>
          )}

          {showForm ? (
            <PerfumeForm
              perfume={editing}
              seccoes={seccoes}
              perfumes={perfumes}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          ) : perfumeQuery.trim() && perfumesFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-700/20 py-16 text-center text-sm text-ink-700/70">
              Nenhum perfume encontrado para &ldquo;{perfumeQuery.trim()}&rdquo;.
            </div>
          ) : (
            <PerfumeList
              perfumes={perfumesFiltrados}
              onEdit={(perfume) => {
                setEditing(perfume);
                setShowForm(true);
              }}
              onDelete={isAdmin ? setPerfumeToDelete : undefined}
              onToggleActive={handleToggleActive}
            />
          )}
        </>
      )}

      {tab === 'banners' && (
        <BannerManager
          seccoes={seccoes}
          onChange={setSeccoes}
          notify={notify}
        />
      )}

      {tab === 'hero' && (
        <HeroManager
          slides={heroSlides}
          onChange={setHeroSlides}
          config={heroConfig}
          onConfigChange={setHeroConfig}
          notify={notify}
        />
      )}

      {tab === 'assinaturas' && (
        <AssinaturasManager
          planos={planos}
          onPlanosChange={setPlanos}
          assinantes={assinantes}
          onAssinantesChange={setAssinantes}
          notify={notify}
          podeEditar={isAdmin}
        />
      )}

      {isAdmin && tab === 'admins' && (
        <AdminUsersManager
          initialAdmins={initialAdmins}
          currentUserId={currentUserId}
          notify={notify}
        />
      )}

      {perfumeToDelete && (
        <ConfirmDialog
          title="Excluir perfume"
          message={`Excluir "${perfumeToDelete.nome}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deletingPerfume}
          onConfirm={confirmDeletePerfume}
          onCancel={() => setPerfumeToDelete(null)}
        />
      )}
    </div>
  );
}
