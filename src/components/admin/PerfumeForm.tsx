'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import Image from 'next/image';
import { Loader2, Save, X, ImagePlus, ChevronDown } from 'lucide-react';
import type { BannerSeccao, Genero, Perfume } from '@/lib/types';
import { FAMILIAS_OLFATIVAS } from '@/lib/constants';
import { uploadImage, validateImageFile } from '@/lib/upload';
import { MultiSelectDropdown } from './MultiSelectDropdown';

export interface PerfumeFormData {
  nome: string;
  marca: string;
  descricao: string;
  resumo: string | null;
  notas_olfativas: string;
  preco_antigo: number | null;
  preco_atual: number;
  familia_olfativa: string[];
  tamanho: string[];
  fotos: string[];
  tag_destaque: string | null;
  genero: Genero;
  ativo: boolean;
}

interface PerfumeFormProps {
  perfume: Perfume | null; // null = criação; preenchido = edição
  seccoes: BannerSeccao[]; // secções da Home disponíveis para o tag_destaque
  perfumes: Perfume[]; // catálogo atual, usado para aprender famílias olfativas já cadastradas
  onSave: (data: PerfumeFormData) => Promise<void>;
  onCancel: () => void;
}

interface FotoItem {
  url: string; // URL pública existente, ou blob local de pré-visualização
  file?: File; // presente apenas para fotos novas, ainda não enviadas
}

const inputClass =
  'w-full rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600';

const GENEROS: Genero[] = ['Masculino', 'Feminino', 'Unissex'];

/** Mantém só dígitos e um único separador decimal (, ou .) — usado no preço. */
function sanitizeDecimalInput(value: string): string {
  const cleaned = value.replace(/[^0-9.,]/g, '');
  const sepMatch = cleaned.match(/[.,]/);
  if (!sepMatch) return cleaned;
  const sepIndex = cleaned.indexOf(sepMatch[0]);
  return (
    cleaned.slice(0, sepIndex + 1) +
    cleaned.slice(sepIndex + 1).replace(/[.,]/g, '')
  );
}

/** Mantém só dígitos, vírgulas e espaços — usado na lista de tamanhos. */
function sanitizeSizesInput(value: string): string {
  return value.replace(/[^0-9,\s]/g, '');
}

/** Junta uma lista em texto natural: "a", "a e b", "a, b e c". */
function joinComE(valores: string[]): string {
  if (valores.length <= 1) return valores[0] ?? '';
  return `${valores.slice(0, -1).join(', ')} e ${valores[valores.length - 1]}`;
}

interface NotasParseadas {
  topo: string[];
  coracao: string[];
  fundo: string[];
}

const NOTAS_VAZIAS: NotasParseadas = { topo: [], coracao: [], fundo: [] };

/**
 * Extrai listas de Topo/Coração/Fundo de um texto livre de notas
 * olfativas — best-effort, cobrindo tanto o formato novo ("Nota de
 * Topo: a, b e c") quanto formatos antigos já salvos no catálogo
 * ("Topo: a. Coração: b. Fundo: c." ou "• Notas de topo: a, b e c").
 * Falhar em reconhecer o texto só significa campos vazios no formulário
 * (o admin pode reselecionar) — nunca quebra a edição.
 */
function parseNotas(raw: string | null | undefined): NotasParseadas {
  if (!raw) return NOTAS_VAZIAS;

  const texto = raw.replace(/notas?\s+de\s+/gi, '').replace(/[•·]/g, '');

  function extrair(label: string, outros: string[]): string[] {
    const pattern = new RegExp(
      `${label}\\s*:\\s*(.*?)(?=(?:${outros.join('|')})\\s*:|$)`,
      'is'
    );
    const match = texto.match(pattern);
    if (!match) return [];
    return match[1]
      .trim()
      .replace(/\.+$/, '')
      .split(/,| e /i)
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return {
    topo: extrair('topo', ['cora[cç][aã]o', 'fundo']),
    coracao: extrair('cora[cç][aã]o', ['fundo', 'topo']),
    fundo: extrair('fundo', ['topo', 'cora[cç][aã]o']),
  };
}

export function PerfumeForm({
  perfume,
  seccoes,
  perfumes,
  onSave,
  onCancel,
}: PerfumeFormProps) {
  const [nome, setNome] = useState(perfume?.nome ?? '');
  const [marca, setMarca] = useState(perfume?.marca ?? '');
  // Marcas digitadas nesta sessão via "Adicionar" que ainda não existem em
  // nenhum perfume salvo — assim que o perfume é salvo, elas passam a vir
  // naturalmente de `perfumes` e aparecem para qualquer outro cadastro.
  const [extraMarcas, setExtraMarcas] = useState<string[]>([]);
  const [novaMarca, setNovaMarca] = useState('');
  const [marcaOpen, setMarcaOpen] = useState(false);
  const marcaRef = useRef<HTMLDivElement>(null);

  const marcasDisponiveis = useMemo(() => {
    const conhecidas = new Set<string>();
    for (const p of perfumes) if (p.marca) conhecidas.add(p.marca);
    for (const m of extraMarcas) conhecidas.add(m);
    return Array.from(conhecidas).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [perfumes, extraMarcas]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marcaRef.current && !marcaRef.current.contains(event.target as Node)) {
        setMarcaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function selectMarca(valor: string) {
    setMarca(valor);
    setMarcaOpen(false);
  }

  function handleAddMarca() {
    const valor = novaMarca.trim();
    if (!valor) return;
    setExtraMarcas((prev) => (prev.includes(valor) ? prev : [...prev, valor]));
    setMarca(valor);
    setNovaMarca('');
    setMarcaOpen(false);
  }

  const [descricao, setDescricao] = useState(perfume?.descricao ?? '');
  const [resumo, setResumo] = useState(perfume?.resumo ?? '');

  const notasIniciais = parseNotas(perfume?.notas_olfativas);
  const [notasTopo, setNotasTopo] = useState<string[]>(notasIniciais.topo);
  const [notasCoracao, setNotasCoracao] = useState<string[]>(notasIniciais.coracao);
  const [notasFundo, setNotasFundo] = useState<string[]>(notasIniciais.fundo);
  // Notas digitadas nesta sessão via "Adicionar" que ainda não existem em
  // nenhum perfume salvo — mesmo esquema de aprendizado da família/marca.
  const [extraNotasTopo, setExtraNotasTopo] = useState<string[]>([]);
  const [extraNotasCoracao, setExtraNotasCoracao] = useState<string[]>([]);
  const [extraNotasFundo, setExtraNotasFundo] = useState<string[]>([]);

  const notasExistentes = useMemo(() => {
    const topo = new Set<string>();
    const coracao = new Set<string>();
    const fundo = new Set<string>();
    for (const p of perfumes) {
      const parsed = parseNotas(p.notas_olfativas);
      parsed.topo.forEach((v) => topo.add(v));
      parsed.coracao.forEach((v) => coracao.add(v));
      parsed.fundo.forEach((v) => fundo.add(v));
    }
    return {
      topo: Array.from(topo),
      coracao: Array.from(coracao),
      fundo: Array.from(fundo),
    };
  }, [perfumes]);

  const sortPt = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
  const notasTopoDisponiveis = useMemo(
    () =>
      Array.from(new Set([...notasExistentes.topo, ...extraNotasTopo])).sort(sortPt),
    [notasExistentes, extraNotasTopo]
  );
  const notasCoracaoDisponiveis = useMemo(
    () =>
      Array.from(new Set([...notasExistentes.coracao, ...extraNotasCoracao])).sort(
        sortPt
      ),
    [notasExistentes, extraNotasCoracao]
  );
  const notasFundoDisponiveis = useMemo(
    () =>
      Array.from(new Set([...notasExistentes.fundo, ...extraNotasFundo])).sort(sortPt),
    [notasExistentes, extraNotasFundo]
  );

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
  const [familias, setFamilias] = useState<string[]>(familiaOlfativaInicial);
  // Famílias digitadas nesta sessão via "Adicionar" que ainda não existem em
  // nenhum perfume salvo — assim que o perfume é salvo, elas passam a vir
  // naturalmente de `perfumes` e aparecem para qualquer outro cadastro.
  const [extraFamilias, setExtraFamilias] = useState<string[]>([]);

  const familiasDisponiveis = useMemo(() => {
    const conhecidas = new Set<string>(FAMILIAS_OLFATIVAS);
    for (const p of perfumes) {
      for (const f of p.familia_olfativa) conhecidas.add(f);
    }
    for (const f of extraFamilias) conhecidas.add(f);
    return Array.from(conhecidas).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [perfumes, extraFamilias]);

  const [genero, setGenero] = useState<Genero>(perfume?.genero ?? 'Unissex');
  const [tagDestaque, setTagDestaque] = useState(perfume?.tag_destaque ?? '');
  const [ativo, setAtivo] = useState(perfume?.ativo ?? true);
  const [fotos, setFotos] = useState<FotoItem[]>(
    (perfume?.fotos ?? []).map((url) => ({ url }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFotosChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    const validas: File[] = [];
    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        setError(`${file.name}: ${validationError}`);
        return;
      }
      validas.push(file);
    }

    setError(null);
    const novasFotos = validas.map((file) => ({
      url: URL.createObjectURL(file),
      file,
    }));
    setFotos((prev) => [...prev, ...novasFotos]);
  }

  function removeFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
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

    if (familias.length === 0) {
      setError('Selecione ao menos uma família olfativa.');
      return;
    }

    const notasFinal = [
      notasTopo.length > 0 ? `Nota de Topo: ${joinComE(notasTopo)}` : null,
      notasCoracao.length > 0 ? `Nota de Coração: ${joinComE(notasCoracao)}` : null,
      notasFundo.length > 0 ? `Nota de Fundo: ${joinComE(notasFundo)}` : null,
    ]
      .filter((linha): linha is string => linha !== null)
      .join('\n');

    setSaving(true);
    try {
      const fotosFinal = await Promise.all(
        fotos.map((foto) => (foto.file ? uploadImage(foto.file) : foto.url))
      );

      await onSave({
        nome: nome.trim(),
        marca: marca.trim(),
        descricao: descricao.trim(),
        resumo: resumo.trim() || null,
        notas_olfativas: notasFinal,
        preco_antigo: precoAntigoNumber,
        preco_atual: precoAtualNumber,
        familia_olfativa: familias,
        tamanho: tamanhos,
        fotos: fotosFinal,
        tag_destaque: tagDestaque || null,
        genero,
        ativo,
      });
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

      {/* Galeria de fotos */}
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-800">
          Fotos do perfume{' '}
          <span className="font-normal text-ink-700/60">
            (a primeira é a capa da vitrine)
          </span>
        </span>
        <div className="flex flex-wrap gap-3">
          {fotos.map((foto, index) => (
            <div
              key={foto.url}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-ink-700/15 bg-cream"
            >
              <Image
                src={foto.url}
                alt={`Foto ${index + 1}`}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized
              />
              {index === 0 && (
                <span className="absolute bottom-0 left-0 right-0 bg-ink-900/70 px-1 py-0.5 text-center text-[9px] font-semibold uppercase tracking-wide text-white">
                  Capa
                </span>
              )}
              <button
                type="button"
                onClick={() => removeFoto(index)}
                aria-label={`Remover foto ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink-950/70 text-white transition hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ))}
          <label className="group flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-ink-700/25 bg-cream text-ink-700/60 transition group-hover:border-gold-600 hover:border-gold-600 hover:text-gold-600">
            <ImagePlus className="h-6 w-6" aria-hidden />
            <span className="text-[11px] font-medium">Adicionar</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFotosChange}
              className="sr-only"
            />
          </label>
        </div>
        <p className="mt-1.5 text-xs text-ink-700/60">
          JPG, PNG ou WebP — até 5 MB cada
        </p>
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

        <div ref={marcaRef}>
          <span className="mb-1.5 block text-sm font-medium text-ink-800">
            Marca *
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMarcaOpen((v) => !v)}
              aria-expanded={marcaOpen}
              className={`${inputClass} flex items-center justify-between gap-2 text-left`}
            >
              <span className={`truncate ${!marca ? 'text-ink-700/40' : ''}`}>
                {marca || 'Selecione a marca'}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-ink-700/60 transition-transform ${
                  marcaOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>

            {marcaOpen && (
              <div className="absolute z-10 mt-2 w-full rounded-xl border border-ink-700/15 bg-white p-3 shadow-card">
                <div className="max-h-52 space-y-0.5 overflow-y-auto">
                  {marcasDisponiveis.length === 0 ? (
                    <p className="px-2 py-1.5 text-sm text-ink-700/50">
                      Nenhuma marca cadastrada ainda.
                    </p>
                  ) : (
                    marcasDisponiveis.map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => selectMarca(m)}
                        className={`flex w-full items-center rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-cream ${
                          marca === m
                            ? 'bg-gold-500/10 font-semibold text-ink-900'
                            : 'text-ink-800'
                        }`}
                      >
                        {m}
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-2 flex gap-2 border-t border-ink-700/10 pt-2">
                  <input
                    value={novaMarca}
                    onChange={(event) => setNovaMarca(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddMarca();
                      }
                    }}
                    placeholder="Outra marca..."
                    className="w-full rounded-lg border border-ink-700/20 px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddMarca}
                    className="shrink-0 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-semibold text-cream transition hover:bg-ink-800"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}
          </div>
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
            onChange={(event) => setPrecoBase(sanitizeDecimalInput(event.target.value))}
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
                onChange={(event) =>
                  setPrecoComDesconto(sanitizeDecimalInput(event.target.value))
                }
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
            inputMode="numeric"
            value={tamanho}
            onChange={(event) => setTamanho(sanitizeSizesInput(event.target.value))}
            className={inputClass}
            placeholder="Ex.: 50, 100, 200"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink-800">
            Gênero *
          </span>
          <div className="inline-flex w-full rounded-xl border border-ink-700/20 bg-white p-1">
            {GENEROS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={genero === g}
                onClick={() => setGenero(g)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  genero === g
                    ? 'bg-ink-900 text-cream'
                    : 'text-ink-700 hover:bg-ink-900/5'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <MultiSelectDropdown
            label="Família olfativa * (selecione uma ou mais)"
            placeholder="Selecione as famílias olfativas"
            options={familiasDisponiveis}
            selected={familias}
            onChange={setFamilias}
            onAddOption={(valor) =>
              setExtraFamilias((prev) => (prev.includes(valor) ? prev : [...prev, valor]))
            }
            addPlaceholder="Outra família..."
          />
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
          <label htmlFor="resumo" className="mb-1.5 block text-sm font-medium text-ink-800">
            Resumo{' '}
            <span className="font-normal text-ink-700/60">
              (exibido só no card da vitrine, {resumo.length}/100)
            </span>
          </label>
          <textarea
            id="resumo"
            rows={2}
            maxLength={100}
            value={resumo}
            onChange={(event) => setResumo(event.target.value)}
            className={inputClass}
            placeholder="Ex.: Frescor cítrico com toque amadeirado, ideal para o dia a dia."
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="descricao" className="mb-1.5 block text-sm font-medium text-ink-800">
            Descrição detalhada{' '}
            <span className="font-normal text-ink-700/60">
              (exibida na página do produto)
            </span>
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
          <span className="mb-1.5 block text-sm font-medium text-ink-800">
            Notas olfativas
          </span>
          <div className="grid gap-4 sm:grid-cols-3">
            <MultiSelectDropdown
              label="Nota de Topo"
              placeholder="Selecione as notas de topo"
              options={notasTopoDisponiveis}
              selected={notasTopo}
              onChange={setNotasTopo}
              onAddOption={(valor) =>
                setExtraNotasTopo((prev) => (prev.includes(valor) ? prev : [...prev, valor]))
              }
              addPlaceholder="Outra nota..."
            />
            <MultiSelectDropdown
              label="Nota de Coração"
              placeholder="Selecione as notas de coração"
              options={notasCoracaoDisponiveis}
              selected={notasCoracao}
              onChange={setNotasCoracao}
              onAddOption={(valor) =>
                setExtraNotasCoracao((prev) =>
                  prev.includes(valor) ? prev : [...prev, valor]
                )
              }
              addPlaceholder="Outra nota..."
            />
            <MultiSelectDropdown
              label="Nota de Fundo"
              placeholder="Selecione as notas de fundo"
              options={notasFundoDisponiveis}
              selected={notasFundo}
              onChange={setNotasFundo}
              onAddOption={(valor) =>
                setExtraNotasFundo((prev) => (prev.includes(valor) ? prev : [...prev, valor]))
              }
              addPlaceholder="Outra nota..."
            />
          </div>
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
