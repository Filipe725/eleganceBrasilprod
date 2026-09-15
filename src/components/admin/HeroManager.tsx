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
  ArrowUp,
  ArrowDown,
  Info,
} from 'lucide-react';
import type { HeroConfig, HeroSlide } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { uploadImage, validateImageFile } from '@/lib/upload';
import { isSafeLink } from '@/lib/link';
import { ConfirmDialog } from './ConfirmDialog';

interface HeroManagerProps {
  slides: HeroSlide[];
  onChange: (slides: HeroSlide[]) => void;
  config: HeroConfig;
  onConfigChange: (config: HeroConfig) => void;
  notify: (message: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600';

/** Converte um ISO (UTC) para o formato aceito por <input type="datetime-local"> (hora local). */
function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Converte o valor de <input type="datetime-local"> (hora local) para ISO/UTC, ou null se vazio. */
function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Gerenciamento do carrossel do Hero: configuração global (intervalo de
 * rotação e autoplay) e CRUD dos slides — artes Desktop/Mobile, textos,
 * CTA, link, ativo/inativo, ordem e agendamento de início/fim.
 */
export function HeroManager({
  slides,
  onChange,
  config,
  onConfigChange,
  notify,
}: HeroManagerProps) {
  const [creating, setCreating] = useState(false);
  const [slideToDelete, setSlideToDelete] = useState<HeroSlide | null>(null);
  const [deleting, setDeleting] = useState(false);
  const ordenados = [...slides].sort((a, b) => a.ordem - b.ordem);

  async function handleCreate() {
    setCreating(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('hero_slides')
      .insert({
        titulo: 'Novo slide',
        ordem: slides.length > 0 ? Math.max(...slides.map((s) => s.ordem)) + 1 : 1,
      })
      .select()
      .single();
    setCreating(false);

    if (error) {
      notify(`Erro ao criar slide: ${error.message}`);
      return;
    }

    onChange([...slides, data]);
    notify('Slide criado! Preencha os textos e envie as artes.');
  }

  async function confirmDelete() {
    if (!slideToDelete) return;
    const slide = slideToDelete;

    setDeleting(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('hero_slides')
      .delete()
      .eq('id', slide.id)
      .select('id');
    setDeleting(false);
    setSlideToDelete(null);

    if (error) {
      notify(`Erro ao excluir: ${error.message}`);
      return;
    }

    // RLS bloqueia silenciosamente (0 linhas afetadas, sem erro) quando o
    // usuário não está autorizado como admin.
    if (!data || data.length === 0) {
      notify(
        'Não foi possível excluir: seu usuário não tem permissão de admin no banco.'
      );
      return;
    }

    onChange(slides.filter((s) => s.id !== slide.id));
    notify('Slide excluído.');
  }

  function handleUpdated(updated: HeroSlide) {
    onChange(slides.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function handleMove(slide: HeroSlide, direction: -1 | 1) {
    const idx = ordenados.findIndex((s) => s.id === slide.id);
    const neighbor = ordenados[idx + direction];
    if (!neighbor) return;

    const supabase = createClient();
    const [resA, resB] = await Promise.all([
      supabase
        .from('hero_slides')
        .update({ ordem: neighbor.ordem })
        .eq('id', slide.id)
        .select()
        .single(),
      supabase
        .from('hero_slides')
        .update({ ordem: slide.ordem })
        .eq('id', neighbor.id)
        .select()
        .single(),
    ]);

    if (resA.error || resB.error) {
      notify(`Erro ao reordenar: ${(resA.error ?? resB.error)?.message}`);
      return;
    }

    onChange(
      slides.map((s) => {
        if (s.id === resA.data.id) return resA.data;
        if (s.id === resB.data.id) return resB.data;
        return s;
      })
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-ink-900">
          Hero &amp; Carrossel
        </h1>
        <p className="text-sm text-ink-700/70">
          Slides exibidos em rotação no topo da Home. Cada slide precisa de
          pelo menos uma arte (Desktop ou Mobile) para aparecer no site.
        </p>
      </div>

      <HeroConfigCard
        config={config}
        onSaved={onConfigChange}
        notify={notify}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-900">
          Slides ({slides.length})
        </h2>
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Plus className="h-4 w-4" aria-hidden />
          )}
          Novo slide
        </button>
      </div>

      {ordenados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700/20 py-16 text-center text-sm text-ink-700/70">
          Nenhum slide cadastrado. Crie o primeiro acima.
        </div>
      ) : (
        <ul className="space-y-4">
          {ordenados.map((slide, i) => (
            <HeroSlideCard
              key={slide.id}
              slide={slide}
              isFirst={i === 0}
              isLast={i === ordenados.length - 1}
              onUpdated={handleUpdated}
              onDelete={() => setSlideToDelete(slide)}
              onMoveUp={() => handleMove(slide, -1)}
              onMoveDown={() => handleMove(slide, 1)}
              notify={notify}
            />
          ))}
        </ul>
      )}

      {slideToDelete && (
        <ConfirmDialog
          title="Excluir slide"
          message={`Excluir o slide "${slideToDelete.titulo}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setSlideToDelete(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Configuração global do carrossel
// ------------------------------------------------------------------

function HeroConfigCard({
  config,
  onSaved,
  notify,
}: {
  config: HeroConfig;
  onSaved: (config: HeroConfig) => void;
  notify: (message: string) => void;
}) {
  const [intervalo, setIntervalo] = useState(String(config.intervalo_segundos));
  const [autoplay, setAutoplay] = useState(config.autoplay_ativo);
  const [saving, setSaving] = useState(false);

  const dirty =
    Number(intervalo) !== config.intervalo_segundos ||
    autoplay !== config.autoplay_ativo;

  async function handleSave() {
    const segundos = Math.min(30, Math.max(2, Number(intervalo) || 4));

    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('hero_config')
      .update({ intervalo_segundos: segundos, autoplay_ativo: autoplay })
      .eq('id', 1)
      .select()
      .single();
    setSaving(false);

    if (error) {
      notify(`Erro ao salvar configuração: ${error.message}`);
      return;
    }

    setIntervalo(String(data.intervalo_segundos));
    onSaved(data);
    notify('Configuração do carrossel salva!');
  }

  return (
    <div className="space-y-4 rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink-900">
        Configuração do carrossel
      </h2>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <label className="text-sm font-medium text-ink-700">
          Rotação automática a cada
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={2}
            max={30}
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            className={`${inputClass} max-w-[100px]`}
          />
          <span className="text-sm text-ink-700/70">segundos</span>
        </div>

        <label className="text-sm font-medium text-ink-700">Autoplay</label>
        <button
          type="button"
          role="switch"
          aria-checked={autoplay}
          onClick={() => setAutoplay((v) => !v)}
          className={`relative h-7 w-12 rounded-full transition-colors ${
            autoplay ? 'bg-ink-900' : 'bg-ink-700/25'
          }`}
        >
          <span
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
              autoplay ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
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
        Salvar configuração
      </button>
    </div>
  );
}

// ------------------------------------------------------------------
// Card de edição de um slide
// ------------------------------------------------------------------

interface HeroSlideCardProps {
  slide: HeroSlide;
  isFirst: boolean;
  isLast: boolean;
  onUpdated: (slide: HeroSlide) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  notify: (message: string) => void;
}

function HeroSlideCard({
  slide,
  isFirst,
  isLast,
  onUpdated,
  onDelete,
  onMoveUp,
  onMoveDown,
  notify,
}: HeroSlideCardProps) {
  const [titulo, setTitulo] = useState(slide.titulo);
  const [subtitulo, setSubtitulo] = useState(slide.subtitulo ?? '');
  const [textoBotao, setTextoBotao] = useState(slide.texto_botao ?? '');
  const [urlDestino, setUrlDestino] = useState(slide.url_destino ?? '');
  const [inicio, setInicio] = useState(toDatetimeLocal(slide.agendamento_inicio));
  const [fim, setFim] = useState(toDatetimeLocal(slide.agendamento_fim));
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState<string | null>(
    slide.imagem_desktop_url
  );
  const [mobilePreview, setMobilePreview] = useState<string | null>(
    slide.imagem_mobile_url
  );
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const dirty =
    desktopFile !== null ||
    mobileFile !== null ||
    titulo !== slide.titulo ||
    subtitulo !== (slide.subtitulo ?? '') ||
    textoBotao !== (slide.texto_botao ?? '') ||
    urlDestino !== (slide.url_destino ?? '') ||
    inicio !== toDatetimeLocal(slide.agendamento_inicio) ||
    fim !== toDatetimeLocal(slide.agendamento_fim);

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

  async function persist(patch: Partial<HeroSlide>) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('hero_slides')
      .update(patch)
      .eq('id', slide.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    onUpdated(data);
  }

  async function handleSave() {
    const linkTrimmed = urlDestino.trim();
    if (linkTrimmed && !isSafeLink(linkTrimmed)) {
      notify(
        'Link inválido. Use uma âncora (ex.: #catalogo), um caminho (ex.: /produtos) ou uma URL http(s).'
      );
      return;
    }
    if (inicio && fim && new Date(inicio) > new Date(fim)) {
      notify('A data de início do agendamento não pode ser depois da de fim.');
      return;
    }

    setSaving(true);
    try {
      const patch: Partial<HeroSlide> = {
        // Vazio é válido: arte já pronta (com texto embutido na imagem)
        // não precisa de título sobreposto pelo carrossel.
        titulo: titulo.trim(),
        subtitulo: subtitulo.trim() || null,
        texto_botao: textoBotao.trim() || null,
        url_destino: linkTrimmed || null,
        agendamento_inicio: fromDatetimeLocal(inicio),
        agendamento_fim: fromDatetimeLocal(fim),
      };
      if (desktopFile) {
        patch.imagem_desktop_url = await uploadImage(desktopFile, 'hero');
      }
      if (mobileFile) {
        patch.imagem_mobile_url = await uploadImage(mobileFile, 'hero');
      }
      await persist(patch);
      setDesktopFile(null);
      setMobileFile(null);
      notify(`Slide "${patch.titulo}" salvo!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar slide.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await persist({ ativo: !slide.ativo });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setToggling(false);
    }
  }

  const uploadSlot = (
    label: string,
    hint: string,
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
      <span className="mt-1 block text-[11px] text-ink-700/50">{hint}</span>
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
        <div className="flex items-start gap-2">
          <div className="flex flex-col gap-1 pt-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              aria-label="Mover slide para cima"
              className="rounded-lg p-1 text-ink-700/60 transition hover:bg-ink-900/5 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              aria-label="Mover slide para baixo"
              className="rounded-lg p-1 text-ink-700/60 transition hover:bg-ink-900/5 disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
            </button>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-ink-900">
              {slide.titulo || (
                <span className="italic text-ink-700/50">(sem título — arte já pronta)</span>
              )}
            </h3>
            <p className="text-xs text-ink-700/60">ordem: {slide.ordem}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={slide.ativo}
            aria-label={`Exibir slide ${slide.titulo || 'sem título'}`}
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              slide.ativo ? 'bg-ink-900' : 'bg-ink-700/25'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                slide.ativo ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <span className="w-14 text-xs font-medium text-ink-700">
            {slide.ativo ? 'Ativo' : 'Inativo'}
          </span>

          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir slide ${slide.titulo || 'sem título'}`}
            title="Excluir slide"
            className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {uploadSlot(
          'Arte Desktop',
          'Recomendado: 1920x600px',
          Monitor,
          desktopPreview,
          pick(setDesktopFile, setDesktopPreview),
          'aspect-[16/5]'
        )}
        {uploadSlot(
          'Arte Mobile',
          'Recomendado: 800x1000px',
          Smartphone,
          mobilePreview,
          pick(setMobileFile, setMobilePreview),
          'aspect-[4/5]'
        )}
      </div>

      <p className="flex items-start gap-1.5 rounded-lg bg-gold-500/10 px-3 py-2 text-xs text-ink-700/80">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-600" aria-hidden />
        Use fotos em que o rótulo/marca do frasco fique visível e nítido, e
        deixe o produto do lado direito da imagem — o texto é sobreposto do
        lado esquerdo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            Título
          </label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Ganhe 15% OFF + Frete Grátis na 1ª compra"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            Subtítulo
          </label>
          <input
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            placeholder="Ex.: Use o cupom BEMVINDO"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            Texto do botão
          </label>
          <input
            value={textoBotao}
            onChange={(e) => setTextoBotao(e.target.value)}
            placeholder="Ex.: GARANTIR DESCONTO"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            URL de destino
          </label>
          <input
            value={urlDestino}
            onChange={(e) => setUrlDestino(e.target.value)}
            placeholder="Ex.: /produtos ou #mega-ofertas"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            Agendamento — início (opcional)
          </label>
          <input
            type="datetime-local"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-700">
            Agendamento — fim (opcional)
          </label>
          <input
            type="datetime-local"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

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
        {saving ? 'Salvando...' : 'Salvar slide'}
      </button>
    </li>
  );
}
