'use client';

import { useState, type FormEvent, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Loader2, Save, X, ImagePlus } from 'lucide-react';
import type { BannerSeccao, Perfume } from '@/lib/types';
import { FAMILIAS_OLFATIVAS } from '@/lib/constants';

export interface PerfumeFormData {
  nome: string;
  marca: string;
  descricao: string;
  notas_olfativas: string;
  preco_antigo: number | null;
  preco_atual: number;
  familia_olfativa: string[];
  tamanho: string[];
  tag_destaque: string | null;
  ativo: boolean;
}

interface PerfumeFormProps {
  perfume: Perfume | null; // null = criação; preenchido = edição
  seccoes: BannerSeccao[]; // secções da Home disponíveis para o tag_destaque
  onSave: (data: PerfumeFormData, imageFile: File | null) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600';

export function PerfumeForm({
  perfume,
  seccoes,
  onSave,
  onCancel,
}: PerfumeFormProps) {
  const [nome, setNome] = useState(perfume?.nome ?? '');
  const [marca, setMarca] = useState(perfume?.marca ?? '');
  const [descricao, setDescricao] = useState(perfume?.descricao ?? '');
  const [notas, setNotas] = useState(perfume?.notas_olfativas ?? '');
  const [aplicarDesconto, setAplicarDesconto] = useState(
    perfume?.preco_antigo != null
  );
  const [precoBase, setPrecoBase] = useState(
    perfume
      ? String(perfume.preco_antigo ?? perfume.preco_atual)
      : ''
  );
  const [precoComDesconto, setPrecoComDesconto] = useState(
    perfume?.preco_antigo != null ? String(perfume.preco_atual) : ''
  );
  const tamanhoInicial =
    perfume?.tamanho?.map((t) => t.replace(/ml$/i, '')).join(', ') ?? '';
  const [tamanho, setTamanho] = useState(tamanhoInicial);

  const familiaOlfativaInicial = perfume?.familia_olfativa ?? [];
  const [familias, setFamilias] = useState<string[]>(
    familiaOlfativaInicial.filter((f) =>
      (FAMILIAS_OLFATIVAS as readonly string[]).includes(f)
    )
  );
  const familiaCustomInicial = familiaOlfativaInicial.filter(
    (f) => !(FAMILIAS_OLFATIVAS as readonly string[]).includes(f)
  );
  const [outroChecked, setOutroChecked] = useState(
    familiaCustomInicial.length > 0
  );
  const [familiaCustom, setFamiliaCustom] = useState(
    familiaCustomInicial.join(', ')
  );

  function toggleFamilia(familia: string) {
    setFamilias((prev) =>
      prev.includes(familia)
        ? prev.filter((f) => f !== familia)
        : [...prev, familia]
    );
  }
  const [tagDestaque, setTagDestaque] = useState(perfume?.tag_destaque ?? '');
  const [ativo, setAtivo] = useState(perfume?.ativo ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(
    perfume?.imagem_url ?? null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const precoBaseNumber = Number(precoBase.replace(',', '.'));
    if (Number.isNaN(precoBaseNumber) || precoBaseNumber < 0) {
      setError('Informe um preço válido, ex.: 199.90');
      return;
    }

    let precoAntigoNumber: number | null = null;
    let precoAtualNumber = precoBaseNumber;

    if (aplicarDesconto) {
      const precoComDescontoNumber = Number(
        precoComDesconto.replace(',', '.')
      );
      if (
        Number.isNaN(precoComDescontoNumber) ||
        precoComDescontoNumber < 0
      ) {
        setError('Informe um preço com desconto válido, ex.: 149.90');
        return;
      }
      if (precoComDescontoNumber >= precoBaseNumber) {
        setError(
          'O preço com desconto deve ser menor que o preço base.'
        );
        return;
      }
      precoAntigoNumber = precoBaseNumber;
      precoAtualNumber = precoComDescontoNumber;
    }

    const tamanhos = tamanho
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => `${t}ml`);
    if (tamanhos.length === 0) {
      setError('Informe ao menos um tamanho, ex.: 50, 100');
      return;
    }

    if (!marca.trim()) {
      setError('Informe a marca do perfume.');
      return;
    }

    const familiaCustomValues = outroChecked
      ? familiaCustom
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];
    const familiaFinal = [...familias, ...familiaCustomValues];
    if (familiaFinal.length === 0) {
      setError('Selecione ao menos uma família olfativa.');
      return;
    }

    setSaving(true);
    try {
      await onSave(
        {
          nome: nome.trim(),
          marca: marca.trim(),
          descricao: descricao.trim(),
          notas_olfativas: notas.trim(),
          preco_antigo: precoAntigoNumber,
          preco_atual: precoAtualNumber,
          familia_olfativa: familiaFinal,
          tamanho: tamanhos,
          tag_destaque: tagDestaque || null,
          ativo,
        },
        imageFile
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink-900">
          {perfume ? 'Editar perfume' : 'Novo perfume'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="tap-target flex items-center justify-center rounded-full text-ink-700/60 transition hover:bg-ink-900/5"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* Upload de imagem */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-800">
          Foto do perfume
        </span>
        <label className="group flex cursor-pointer items-center gap-4">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-ink-700/25 bg-cream transition group-hover:border-gold-600">
            {preview ? (
              <Image
                src={preview}
                alt="Pré-visualização"
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <ImagePlus className="h-8 w-8 text-ink-700/40" aria-hidden />
            )}
          </div>
          <div className="text-sm text-ink-700/70">
            <p className="font-medium text-ink-800 group-hover:text-gold-600">
              {preview ? 'Trocar imagem' : 'Selecionar imagem'}
            </p>
            <p className="text-xs">JPG, PNG ou WebP — até 5 MB</p>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleImageChange}
            className="sr-only"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-ink-800">
            Nome *
          </label>
          <input
            id="nome"
            required
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            className={inputClass}
            placeholder="Ex.: La Vie Est Belle"
          />
        </div>

        <div>
          <label htmlFor="marca" className="mb-1.5 block text-sm font-medium text-ink-800">
            Marca *
          </label>
          <input
            id="marca"
            required
            value={marca}
            onChange={(event) => setMarca(event.target.value)}
            className={inputClass}
            placeholder="Ex.: Lancôme, Giorgio Armani"
          />
        </div>

        <div>
          <label htmlFor="preco-base" className="mb-1.5 block text-sm font-medium text-ink-800">
            Preço (R$) *
          </label>
          <input
            id="preco-base"
            required
            inputMode="decimal"
            value={precoBase}
            onChange={(event) => setPrecoBase(event.target.value)}
            className={inputClass}
            placeholder="199.90"
          />
          <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm text-ink-800">
            <input
              type="checkbox"
              checked={aplicarDesconto}
              onChange={(event) => setAplicarDesconto(event.target.checked)}
              className="h-5 w-5 rounded accent-gold-600"
            />
            Aplicar desconto
          </label>
          {aplicarDesconto && (
            <div className="mt-3">
              <label
                htmlFor="preco-desconto"
                className="mb-1.5 block text-sm font-medium text-ink-800"
              >
                Preço com desconto (R$) *
              </label>
              <input
                id="preco-desconto"
                required
                inputMode="decimal"
                value={precoComDesconto}
                onChange={(event) => setPrecoComDesconto(event.target.value)}
                className={inputClass}
                placeholder="Ex.: 149.90"
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="tamanho" className="mb-1.5 block text-sm font-medium text-ink-800">
            Tamanhos * (números separados por vírgula)
          </label>
          <input
            id="tamanho"
            required
            value={tamanho}
            onChange={(event) => setTamanho(event.target.value)}
            className={inputClass}
            placeholder="Ex.: 50, 100, 200"
          />
        </div>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-ink-800">
            Família olfativa * (selecione uma ou mais)
          </span>
          <div className="flex flex-wrap gap-2">
            {FAMILIAS_OLFATIVAS.map((f) => (
              <label
                key={f}
                className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  familias.includes(f)
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-700/25 bg-white text-ink-800 hover:border-ink-900'
                }`}
              >
                <input
                  type="checkbox"
                  checked={familias.includes(f)}
                  onChange={() => toggleFamilia(f)}
                  className="sr-only"
                />
                {f}
              </label>
            ))}
            <label
              className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition ${
                outroChecked
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-ink-700/25 bg-white text-ink-800 hover:border-ink-900'
              }`}
            >
              <input
                type="checkbox"
                checked={outroChecked}
                onChange={(event) => setOutroChecked(event.target.checked)}
                className="sr-only"
              />
              Outro
            </label>
          </div>
          {outroChecked && (
            <input
              value={familiaCustom}
              onChange={(event) => setFamiliaCustom(event.target.value)}
              className={`${inputClass} mt-2`}
              placeholder="Digite a família olfativa (separe por vírgula se houver mais de uma)"
            />
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tag-destaque" className="mb-1.5 block text-sm font-medium text-ink-800">
            Secção da Home (tag de destaque)
          </label>
          <select
            id="tag-destaque"
            value={tagDestaque}
            onChange={(event) => setTagDestaque(event.target.value)}
            className={inputClass}
          >
            <option value="">Nenhuma — aparece só no catálogo geral</option>
            {seccoes.map((s) => (
              <option key={s.id} value={s.seccao}>
                {s.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-ink-800">
            Descrição detalhada
          </label>
          <textarea
            id="descricao"
            rows={3}
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            className={inputClass}
            placeholder="Ex.: Fragrância marcante para noites especiais..."
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notas" className="mb-1.5 block text-sm font-medium text-ink-800">
            Notas olfativas
          </label>
          <textarea
            id="notas"
            rows={2}
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            className={inputClass}
            placeholder="Ex.: Topo: bergamota. Coração: âmbar. Fundo: baunilha e cedro."
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-800">
        <input
          type="checkbox"
          checked={ativo}
          onChange={(event) => setAtivo(event.target.checked)}
          className="h-5 w-5 rounded accent-gold-600"
        />
        Visível na loja
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="tap-target rounded-xl border border-ink-700/25 px-6 py-3 text-sm font-semibold text-ink-800 transition hover:bg-ink-900/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-6 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Save className="h-4 w-4" aria-hidden />
          )}
          {saving ? 'Salvando...' : 'Salvar perfume'}
        </button>
      </div>
    </form>
  );
}
