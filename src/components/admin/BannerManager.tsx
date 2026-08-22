'use client';

import { useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Loader2,
  Save,
  Monitor,
  Smartphone,
  ImagePlus,
} from 'lucide-react';
import type { BannerSeccao } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { uploadImage, validateImageFile } from '@/lib/upload';
import { isSafeLink } from '@/lib/link';

interface BannerManagerProps {
  seccoes: BannerSeccao[];
  onChange: (seccoes: BannerSeccao[]) => void;
  notify: (message: string) => void;
}

/** Converte um título em slug: "OS MAIS VENDIDOS" -> "os-mais-vendidos". */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Gerenciamento de banners/secções da Home: upload das artes Desktop e
 * Mobile, link de destino, toggle on/off e criação/remoção de secções.
 */
export function BannerManager({
  seccoes,
  onChange,
  notify,
}: BannerManagerProps) {
  const [novoTitulo, setNovoTitulo] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const titulo = novoTitulo.trim();
    if (!titulo) return;

    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('banners_seccoes')
      .insert({
        seccao: slugify(titulo),
        titulo: titulo.toUpperCase(),
        ordem: seccoes.length + 1,
      })
      .select()
      .single();
    setCreating(false);

    if (error) {
      notify(`Erro ao criar secção: ${error.message}`);
      return;
    }

    onChange([...seccoes, data]);
    setNovoTitulo('');
    notify('Secção criada! Agora envie as artes do banner.');
  }

  async function handleDelete(seccao: BannerSeccao) {
    if (
      !window.confirm(
        `Excluir a secção "${seccao.titulo}"? Os perfumes marcados com ela voltam a aparecer apenas no catálogo geral.`
      )
    ) {
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('banners_seccoes')
      .delete()
      .eq('id', seccao.id);

    if (error) {
      notify(`Erro ao excluir: ${error.message}`);
      return;
    }

    onChange(seccoes.filter((s) => s.id !== seccao.id));
    notify('Secção excluída.');
  }

  function handleUpdated(updated: BannerSeccao) {
    onChange(seccoes.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900">
          Banners &amp; Secções da Home
        </h1>
        <p className="text-sm text-ink-700/70">
          Cada secção aparece na Home na ordem abaixo, com banner opcional
          acima do grid de produtos.
        </p>
      </div>

      {/* Nova secção */}
      <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gold-500/50 bg-white p-4 sm:flex-row">
        <input
          value={novoTitulo}
          onChange={(event) => setNovoTitulo(event.target.value)}
          placeholder='Título da nova secção (ex.: "BLACK FRIDAY")'
          className="w-full flex-1 rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || !novoTitulo.trim()}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Criar secção
        </button>
      </div>

      {seccoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700/20 py-16 text-center text-sm text-ink-700/70">
          Nenhuma secção cadastrada. Crie a primeira acima.
        </div>
      ) : (
        <ul className="space-y-4">
          {seccoes.map((seccao) => (
            <BannerCard
              key={seccao.id}
              seccao={seccao}
              onUpdated={handleUpdated}
              onDelete={() => handleDelete(seccao)}
              notify={notify}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Card de edição de uma secção/banner
// ------------------------------------------------------------------

interface BannerCardProps {
  seccao: BannerSeccao;
  onUpdated: (seccao: BannerSeccao) => void;
  onDelete: () => void;
  notify: (message: string) => void;
}

function BannerCard({ seccao, onUpdated, onDelete, notify }: BannerCardProps) {
  const [link, setLink] = useState(seccao.link_destino ?? '');
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(
    seccao.imagem_desktop_url
  );
  const [mobilePreview, setMobilePreview] = useState<string | null>(
    seccao.imagem_mobile_url
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const dirty =
    desktopFile !== null ||
    mobileFile !== null ||
    link !== (seccao.link_destino ?? '');

  function pick(
    setFile: (f: File | null) => void,
    setPreview: (p: string | null) => void
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = '';
      if (!file) return;

      const validationError = validateImageFile(file);
      if (validationError) {
        notify(`${file.name}: ${validationError}`);
        return;
      }

      setFile(file);
      setPreview(URL.createObjectURL(file));
    };
  }

  async function persist(patch: Partial<BannerSeccao>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('banners_seccoes')
      .update(patch)
      .eq('id', seccao.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    onUpdated(data);
  }

  async function handleSave() {
    const linkTrimmed = link.trim();
    if (linkTrimmed && !isSafeLink(linkTrimmed)) {
      notify(
        'Link inválido. Use uma âncora (ex.: #mega-ofertas), um caminho (ex.: /produtos) ou uma URL http(s).'
      );
      return;
    }

    setSaving(true);
    try {
      const patch: Partial<BannerSeccao> = {
        link_destino: linkTrimmed || null,
      };
      if (desktopFile) {
        patch.imagem_desktop_url = await uploadImage(desktopFile, 'banners');
      }
      if (mobileFile) {
        patch.imagem_mobile_url = await uploadImage(mobileFile, 'banners');
      }
      await persist(patch);
      setDesktopFile(null);
      setMobileFile(null);
      notify(`Banner de "${seccao.titulo}" salvo!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar banner.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await persist({ exibir_banner: !seccao.exibir_banner });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setToggling(false);
    }
  }

  const uploadSlot = (
    label: string,
    Icon: typeof Monitor,
    preview: string | null,
    onPick: (event: ChangeEvent<HTMLInputElement>) => void,
    aspectClass: string
  ) => (
    <label className="group block cursor-pointer">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-700">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </span>
      <span
        className={`relative flex ${aspectClass} items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-ink-700/25 bg-cream transition group-hover:border-gold-600`}
      >
        {preview ? (
          <Image
            src={preview}
            alt={`Arte ${label}`}
            fill
            sizes="400px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <ImagePlus className="h-7 w-7 text-ink-700/40" aria-hidden />
        )}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onPick}
        className="sr-only"
      />
    </label>
  );

  return (
    <li className="space-y-4 rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            {seccao.titulo}
          </h3>
          <p className="text-xs text-ink-700/60">
            slug: {seccao.seccao} • âncora: #{seccao.seccao}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle exibir/ocultar banner */}
          <button
            type="button"
            role="switch"
            aria-checked={seccao.exibir_banner}
            aria-label={`Exibir banner de ${seccao.titulo}`}
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              seccao.exibir_banner ? 'bg-ink-900' : 'bg-ink-700/25'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                seccao.exibir_banner ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <span className="w-14 text-xs font-medium text-ink-700">
            {seccao.exibir_banner ? 'Visível' : 'Oculto'}
          </span>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir secção ${seccao.titulo}`}
            title="Excluir secção"
            className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        {uploadSlot(
          'Arte Desktop (horizontal ~3:1)',
          Monitor,
          desktopPreview,
          pick(setDesktopFile, setDesktopPreview),
          'aspect-[3/1]'
        )}
        {uploadSlot(
          'Arte Mobile (quadrada)',
          Smartphone,
          mobilePreview,
          pick(setMobileFile, setMobilePreview),
          'aspect-square'
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={link}
          onChange={(event) => setLink(event.target.value)}
          placeholder="Link de destino (ex.: #mega-ofertas ou https://...)"
          className="w-full flex-1 rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {saving ? 'Salvando...' : 'Salvar banner'}
        </button>
      </div>
    </li>
  );
}
