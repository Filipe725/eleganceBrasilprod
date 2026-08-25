'use client';

import { useState } from 'react';
import { Plus, SprayCan, Images, ShieldCheck } from 'lucide-react';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import type { AdminUser } from '@/app/admin/actions';
import { PerfumeForm, type PerfumeFormData } from './PerfumeForm';
import { PerfumeList } from './PerfumeList';
import { BannerManager } from './BannerManager';
import { AdminUsersManager } from './AdminUsersManager';

interface AdminDashboardProps {
  initialPerfumes: Perfume[];
  initialSeccoes: BannerSeccao[];
  initialAdmins: AdminUser[];
  currentUserId: string;
}

type Tab = 'perfumes' | 'banners' | 'admins';

/**
 * Orquestra o painel: aba de perfumes (CRUD completo), aba de
 * banners/secções da Home e aba de administradores.
 */
export function AdminDashboard({
  initialPerfumes,
  initialSeccoes,
  initialAdmins,
  currentUserId,
}: AdminDashboardProps) {
  const [tab, setTab] = useState<Tab>('perfumes');
  const [perfumes, setPerfumes] = useState<Perfume[]>(initialPerfumes);
  const [seccoes, setSeccoes] = useState<BannerSeccao[]>(initialSeccoes);
  const [editing, setEditing] = useState<Perfume | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  function notify(message: string) {
    setFeedback(message);
    setTimeout(() => setFeedback(null), 4000);
  }

  async function handleSave(formData: PerfumeFormData) {
    const supabase = createClient();

    if (editing) {
      const { data, error } = await supabase
        .from('perfumes')
        .update(formData)
        .eq('id', editing.id)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setPerfumes((current) =>
        current.map((perfume) => (perfume.id === editing.id ? data : perfume))
      );
      notify('Perfume atualizado com sucesso!');
    } else {
      const { data, error } = await supabase
        .from('perfumes')
        .insert(formData)
        .select()
        .single();

      if (error) throw new Error(error.message);

      setPerfumes((current) => [data, ...current]);
      notify('Perfume adicionado com sucesso!');
    }

    setShowForm(false);
    setEditing(null);
  }

  async function handleDelete(perfume: Perfume) {
    if (!window.confirm(`Excluir "${perfume.nome}"? Essa ação não pode ser desfeita.`)) {
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .delete()
      .eq('id', perfume.id)
      .select('id');

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

    setPerfumes((current) => current.filter((p) => p.id !== perfume.id));
    notify('Perfume excluído.');
  }

  async function handleToggleActive(perfume: Perfume) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('perfumes')
      .update({ ativo: !perfume.ativo })
      .eq('id', perfume.id)
      .select()
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
      <div className="flex gap-2">
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
          onClick={() => setTab('admins')}
          className={tabClass(tab === 'admins')}
        >
          <ShieldCheck className="h-4 w-4" aria-hidden />
          Admins
        </button>
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
                {perfumes.length} produto{perfumes.length === 1 ? '' : 's'} cadastrado
                {perfumes.length === 1 ? '' : 's'}
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

          {showForm ? (
            <PerfumeForm
              perfume={editing}
              seccoes={seccoes}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
            />
          ) : (
            <PerfumeList
              perfumes={perfumes}
              onEdit={(perfume) => {
                setEditing(perfume);
                setShowForm(true);
              }}
              onDelete={handleDelete}
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

      {tab === 'admins' && (
        <AdminUsersManager
          initialAdmins={initialAdmins}
          currentUserId={currentUserId}
          notify={notify}
        />
      )}
    </div>
  );
}
