'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Loader2,
  MessageCircle,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import type { Assinante, PlanoAssinatura, StatusAssinante } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import {
  STATUS_ASSINANTE,
  formatCep,
  formatTelefone,
  MESES_MINIMOS,
  precoPlano,
  resumoPlano,
  whatsappDoAssinante,
} from '@/lib/assinatura';
import { STORE_NAME } from '@/lib/constants';
import { ConfirmDialog } from './ConfirmDialog';

interface AssinaturasManagerProps {
  planos: PlanoAssinatura[];
  onPlanosChange: (planos: PlanoAssinatura[]) => void;
  assinantes: Assinante[];
  onAssinantesChange: (assinantes: Assinante[]) => void;
  notify: (message: string) => void;
}

const inputClass =
  'w-full rounded-xl border border-ink-700/20 bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-700/40 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600';

const STATUS_BADGE: Record<StatusAssinante, string> = {
  pendente: 'bg-gold-300/50 text-gold-600',
  ativo: 'bg-emerald-100 text-emerald-800',
  pausado: 'bg-ink-900/10 text-ink-700',
  cancelado: 'bg-red-100 text-red-700',
};

/** Converte "79,90" / "79.90" em número; NaN se inválido. */
function parseDecimal(value: string): number {
  return value.trim() ? Number(value.replace(',', '.')) : Number.NaN;
}

/**
 * Aba "Assinaturas" do painel: planos do clube de decants (CRUD) e os
 * cadastros feitos em /assinatura, com status (pendente → ativo depois
 * de combinar o pagamento pelo WhatsApp), preferências e endereço.
 */
export function AssinaturasManager({
  planos,
  onPlanosChange,
  assinantes,
  onAssinantesChange,
  notify,
}: AssinaturasManagerProps) {
  const [creating, setCreating] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<PlanoAssinatura | null>(null);
  const [assinanteToDelete, setAssinanteToDelete] = useState<Assinante | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filtro, setFiltro] = useState<StatusAssinante | 'todos'>('todos');

  const ordenados = [...planos].sort((a, b) => a.ordem - b.ordem);
  const planoPorId = useMemo(
    () => new Map(planos.map((plano) => [plano.id, plano])),
    [planos]
  );
  const visiveis =
    filtro === 'todos' ? assinantes : assinantes.filter((a) => a.status === filtro);

  async function handleCreatePlano() {
    setCreating(true);
    const { data, error } = await createClient()
      .from('planos_assinatura')
      .insert({
        nome: 'Novo plano',
        qtd_decants: 2,
        volume_ml: 5,
        preco_mensal: 0,
        ativo: false,
        ordem: planos.length > 0 ? Math.max(...planos.map((p) => p.ordem)) + 1 : 1,
      })
      .select()
      .single();
    setCreating(false);

    if (error) {
      notify(`Erro ao criar plano: ${error.message}`);
      return;
    }
    onPlanosChange([...planos, data]);
    notify('Plano criado (inativo). Preencha os dados e ative quando estiver pronto.');
  }

  async function confirmDeletePlano() {
    if (!planoToDelete) return;
    const plano = planoToDelete;

    setDeleting(true);
    const { data, error } = await createClient()
      .from('planos_assinatura')
      .delete()
      .eq('id', plano.id)
      .select('id');
    setDeleting(false);
    setPlanoToDelete(null);

    if (error) {
      notify(`Erro ao excluir: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      notify('Não foi possível excluir: seu usuário não tem permissão de admin no banco.');
      return;
    }

    onPlanosChange(planos.filter((p) => p.id !== plano.id));
    // Assinantes desse plano ficam sem plano (on delete set null)
    onAssinantesChange(
      assinantes.map((a) => (a.plano_id === plano.id ? { ...a, plano_id: null } : a))
    );
    notify('Plano excluído.');
  }

  async function confirmDeleteAssinante() {
    if (!assinanteToDelete) return;
    const assinante = assinanteToDelete;

    setDeleting(true);
    const { data, error } = await createClient()
      .from('assinantes')
      .delete()
      .eq('id', assinante.id)
      .select('id');
    setDeleting(false);
    setAssinanteToDelete(null);

    if (error) {
      notify(`Erro ao excluir: ${error.message}`);
      return;
    }
    if (!data || data.length === 0) {
      notify('Não foi possível excluir: seu usuário não tem permissão de admin no banco.');
      return;
    }

    onAssinantesChange(assinantes.filter((a) => a.id !== assinante.id));
    notify('Cadastro excluído.');
  }

  return (
    <div className="space-y-10">
      {/* ---------------- Planos ---------------- */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl text-ink-900">Clube de decants</h1>
            <p className="text-sm text-ink-700/70">
              Planos exibidos em /assinatura (só os ativos aparecem no site).
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreatePlano}
            disabled={creating}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
            Novo plano
          </button>
        </div>

        {ordenados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700/20 py-12 text-center text-sm text-ink-700/70">
            Nenhum plano cadastrado. Crie o primeiro acima.
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {ordenados.map((plano) => (
              <PlanoCard
                key={plano.id}
                plano={plano}
                assinantesAtivos={
                  assinantes.filter((a) => a.plano_id === plano.id && a.status === 'ativo')
                    .length
                }
                onUpdated={(atualizado) =>
                  onPlanosChange(planos.map((p) => (p.id === atualizado.id ? atualizado : p)))
                }
                onDelete={() => setPlanoToDelete(plano)}
                notify={notify}
              />
            ))}
          </ul>
        )}
      </section>

      {/* ---------------- Assinantes ---------------- */}
      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl text-ink-900">
            Assinantes ({assinantes.length})
          </h2>
          <p className="text-sm text-ink-700/70">
            Cadastros chegam como &ldquo;Pendente&rdquo;. Combine o pagamento pelo
            WhatsApp e mude para &ldquo;Ativo&rdquo;.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[{ value: 'todos' as const, label: 'Todos' }, ...STATUS_ASSINANTE].map(
            (opcao) => {
              const total =
                opcao.value === 'todos'
                  ? assinantes.length
                  : assinantes.filter((a) => a.status === opcao.value).length;
              const ativo = filtro === opcao.value;
              return (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => setFiltro(opcao.value)}
                  aria-pressed={ativo}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    ativo
                      ? 'bg-ink-900 text-white'
                      : 'bg-ink-900/[0.06] text-ink-900 hover:bg-ink-900/10'
                  }`}
                >
                  {opcao.label} ({total})
                </button>
              );
            }
          )}
        </div>

        {visiveis.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-700/20 py-12 text-center text-sm text-ink-700/70">
            Nenhum cadastro {filtro === 'todos' ? 'ainda' : 'com esse status'}.
          </div>
        ) : (
          <ul className="space-y-3">
            {visiveis.map((assinante) => (
              <AssinanteCard
                key={assinante.id}
                assinante={assinante}
                plano={assinante.plano_id ? planoPorId.get(assinante.plano_id) : undefined}
                onUpdated={(atualizado) =>
                  onAssinantesChange(
                    assinantes.map((a) => (a.id === atualizado.id ? atualizado : a))
                  )
                }
                onDelete={() => setAssinanteToDelete(assinante)}
                notify={notify}
              />
            ))}
          </ul>
        )}
      </section>

      {planoToDelete && (
        <ConfirmDialog
          title="Excluir plano"
          message={`Excluir o plano "${planoToDelete.nome}"? Os assinantes dele continuam cadastrados, mas ficam sem plano. Para só tirar do site, desative-o.`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={confirmDeletePlano}
          onCancel={() => setPlanoToDelete(null)}
        />
      )}

      {assinanteToDelete && (
        <ConfirmDialog
          title="Excluir cadastro"
          message={`Excluir o cadastro de ${assinanteToDelete.nome}? Os dados pessoais são apagados definitivamente (use para pedidos de exclusão pela LGPD).`}
          confirmLabel="Excluir"
          loading={deleting}
          onConfirm={confirmDeleteAssinante}
          onCancel={() => setAssinanteToDelete(null)}
        />
      )}
    </div>
  );
}

// ------------------------------------------------------------------
// Card de edição de um plano
// ------------------------------------------------------------------

function PlanoCard({
  plano,
  assinantesAtivos,
  onUpdated,
  onDelete,
  notify,
}: {
  plano: PlanoAssinatura;
  assinantesAtivos: number;
  onUpdated: (plano: PlanoAssinatura) => void;
  onDelete: () => void;
  notify: (message: string) => void;
}) {
  const [nome, setNome] = useState(plano.nome);
  const [descricao, setDescricao] = useState(plano.descricao ?? '');
  const [qtd, setQtd] = useState(String(plano.qtd_decants));
  const [volume, setVolume] = useState(String(plano.volume_ml));
  const [preco, setPreco] = useState(String(plano.preco_mensal));
  const [ordem, setOrdem] = useState(String(plano.ordem));
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const dirty =
    nome !== plano.nome ||
    descricao !== (plano.descricao ?? '') ||
    qtd !== String(plano.qtd_decants) ||
    volume !== String(plano.volume_ml) ||
    preco !== String(plano.preco_mensal) ||
    ordem !== String(plano.ordem);

  async function persist(patch: Partial<PlanoAssinatura>) {
    const { data, error } = await createClient()
      .from('planos_assinatura')
      .update(patch)
      .eq('id', plano.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    onUpdated(data);
  }

  async function handleSave() {
    const qtdNumber = Number(qtd);
    const volumeNumber = parseDecimal(volume);
    const precoNumber = parseDecimal(preco);
    const ordemNumber = Number(ordem);

    if (!nome.trim()) return notify('Informe o nome do plano.');
    if (!Number.isInteger(qtdNumber) || qtdNumber <= 0)
      return notify('Quantidade de decants deve ser um número inteiro maior que zero.');
    if (Number.isNaN(volumeNumber) || volumeNumber <= 0)
      return notify('Informe o volume de cada decant em ml, ex.: 5');
    if (Number.isNaN(precoNumber) || precoNumber < 0)
      return notify('Informe um preço mensal válido, ex.: 79.90');

    setSaving(true);
    try {
      await persist({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        qtd_decants: qtdNumber,
        volume_ml: volumeNumber,
        preco_mensal: precoNumber,
        ordem: Number.isInteger(ordemNumber) ? ordemNumber : plano.ordem,
      });
      notify(`Plano "${nome.trim()}" salvo!`);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao salvar plano.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await persist({ ativo: !plano.ativo });
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Erro ao atualizar.');
    } finally {
      setToggling(false);
    }
  }

  return (
    <li className="space-y-3 rounded-2xl border border-ink-700/10 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold text-ink-900">{plano.nome}</p>
          <p className="text-xs text-ink-700/70">
            {resumoPlano(plano)} • {precoPlano(plano)} • {assinantesAtivos} ativo
            {assinantesAtivos === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={plano.ativo}
            aria-label={`Exibir plano ${plano.nome} no site`}
            onClick={handleToggle}
            disabled={toggling}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              plano.ativo ? 'bg-ink-900' : 'bg-ink-700/25'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                plano.ativo ? 'left-6' : 'left-1'
              }`}
            />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Excluir plano ${plano.nome}`}
            className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-5 w-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink-700">Nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink-700">Descrição</span>
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className={inputClass}
            placeholder="Ex.: Para conhecer novas fragrâncias todo mês."
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink-700">Decants por mês</span>
          <input
            inputMode="numeric"
            value={qtd}
            onChange={(e) => setQtd(e.target.value.replace(/\D/g, ''))}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink-700">Volume de cada (ml)</span>
          <input
            inputMode="decimal"
            value={volume}
            onChange={(e) => setVolume(e.target.value.replace(/[^0-9.,]/g, ''))}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink-700">Preço mensal (R$)</span>
          <input
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value.replace(/[^0-9.,]/g, ''))}
            className={inputClass}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-medium text-ink-700">Ordem no site</span>
          <input
            inputMode="numeric"
            value={ordem}
            onChange={(e) => setOrdem(e.target.value.replace(/[^0-9-]/g, ''))}
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !dirty}
        className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-cream transition hover:bg-ink-800 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <Save className="h-4 w-4" aria-hidden />
        )}
        {saving ? 'Salvando...' : 'Salvar plano'}
      </button>
    </li>
  );
}

// ------------------------------------------------------------------
// Card de um assinante
// ------------------------------------------------------------------

function AssinanteCard({
  assinante,
  plano,
  onUpdated,
  onDelete,
  notify,
}: {
  assinante: Assinante;
  plano: PlanoAssinatura | undefined;
  onUpdated: (assinante: Assinante) => void;
  onDelete: () => void;
  notify: (message: string) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [salvandoStatus, setSalvandoStatus] = useState(false);

  async function handleStatus(status: StatusAssinante) {
    setSalvandoStatus(true);
    const { data, error } = await createClient()
      .from('assinantes')
      .update({ status })
      .eq('id', assinante.id)
      .select()
      .single();
    setSalvandoStatus(false);

    if (error) {
      notify(`Erro ao atualizar status: ${error.message}`);
      return;
    }
    onUpdated(data);
  }

  const primeiroNome = assinante.nome.split(' ')[0];
  const mensagem = plano
    ? `Olá, ${primeiroNome}! Aqui é da ${STORE_NAME}. Recebemos seu cadastro no plano ${plano.nome} (${resumoPlano(plano)}, ${precoPlano(plano)}). O pagamento é adiantado, a partir de ${MESES_MINIMOS} meses (3, 6 ou 12). Por quantos meses você quer assinar? Vamos combinar o pagamento e o primeiro envio?`
    : `Olá, ${primeiroNome}! Aqui é da ${STORE_NAME}, sobre o seu cadastro no clube de decants.`;

  const enderecoCompleto = [
    `${assinante.endereco}, ${assinante.numero}`,
    assinante.complemento,
    assinante.bairro,
    `${assinante.cidade}/${assinante.uf}`,
    `CEP ${formatCep(assinante.cep)}`,
  ]
    .filter(Boolean)
    .join(' — ');

  return (
    <li className="rounded-2xl border border-ink-700/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-700/60 transition-transform ${
              aberto ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink-900">{assinante.nome}</span>
            <span className="block truncate text-xs text-ink-700/70">
              {plano?.nome ?? 'Sem plano'} • {assinante.cidade}/{assinante.uf} •{' '}
              {new Date(assinante.created_at).toLocaleDateString('pt-BR')}
            </span>
          </span>
        </button>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[assinante.status]}`}
        >
          {STATUS_ASSINANTE.find((s) => s.value === assinante.status)?.label}
        </span>

        <label className="flex items-center gap-2">
          <span className="sr-only">Status de {assinante.nome}</span>
          <select
            value={assinante.status}
            disabled={salvandoStatus}
            onChange={(e) => handleStatus(e.target.value as StatusAssinante)}
            className="rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-sm text-ink-900 focus:border-gold-600 focus:outline-none disabled:opacity-50"
          >
            {STATUS_ASSINANTE.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <a
          href={whatsappDoAssinante(assinante.whatsapp, mensagem)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Conversar com ${assinante.nome} no WhatsApp`}
          className="tap-target flex items-center justify-center rounded-xl bg-whatsapp px-3 text-white transition hover:bg-whatsapp-dark"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
        </a>
      </div>

      {aberto && (
        <dl className="grid gap-x-6 gap-y-3 border-t border-ink-700/10 p-4 text-sm sm:grid-cols-2">
          <Detalhe termo="Plano">
            {plano ? `${plano.nome} — ${resumoPlano(plano)}, ${precoPlano(plano)}` : 'Sem plano (excluído)'}
          </Detalhe>
          <Detalhe termo="Contato">
            {formatTelefone(assinante.whatsapp)} •{' '}
            <a href={`mailto:${assinante.email}`} className="underline underline-offset-2">
              {assinante.email}
            </a>
          </Detalhe>
          <Detalhe termo="Endereço" wide>
            {enderecoCompleto}
          </Detalhe>
          <Detalhe termo="Gênero preferido">{assinante.genero_preferido}</Detalhe>
          <Detalhe termo="Famílias que gosta">
            {assinante.familias_preferidas.join(', ') || '—'}
          </Detalhe>
          <Detalhe termo="Famílias a evitar">
            {assinante.familias_evitar.join(', ') || '—'}
          </Detalhe>
          <Detalhe termo="Aceite dos termos">
            {new Date(assinante.aceite_termos_em).toLocaleString('pt-BR')}
          </Detalhe>
          {assinante.observacoes && (
            <Detalhe termo="Observações" wide>
              <span className="whitespace-pre-line">{assinante.observacoes}</span>
            </Detalhe>
          )}
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 text-xs text-ink-700/70 transition hover:text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Excluir cadastro
            </button>
          </div>
        </dl>
      )}
    </li>
  );
}

function Detalhe({
  termo,
  wide = false,
  children,
}: {
  termo: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">{termo}</dt>
      <dd className="mt-0.5 text-ink-900">{children}</dd>
    </div>
  );
}
