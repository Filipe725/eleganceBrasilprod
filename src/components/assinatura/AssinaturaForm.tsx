'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import type { GeneroPreferido, PlanoAssinatura } from '@/lib/types';
import { FAMILIAS_OLFATIVAS, STORE_NAME, WHATSAPP_NUMBER } from '@/lib/constants';
import {
  GENEROS_PREFERIDOS,
  formatCep,
  formatTelefone,
  onlyDigits,
  precoPlano,
} from '@/lib/assinatura';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { cadastrarAssinatura } from '@/app/assinatura/actions';
import { WhatsAppLink } from '@/components/site/WhatsAppLink';
import { PlanoCard } from './PlanoCard';

interface AssinaturaFormProps {
  planos: PlanoAssinatura[];
}

const inputClass =
  'w-full rounded-xl border border-ink-700/20 bg-white px-4 py-3 text-ink-900 placeholder:text-ink-700/80 focus:border-gold-600 focus:outline-none focus:ring-1 focus:ring-gold-600';
const labelClass = 'mb-1.5 block text-sm font-medium text-ink-800';

/**
 * Formulário do clube de decants: plano, contato, endereço de entrega e
 * perfil olfativo (a loja monta a caixa a partir dele). O cadastro entra
 * como pendente; o pagamento é combinado pelo WhatsApp na sequência.
 */
export function AssinaturaForm({ planos }: AssinaturaFormProps) {
  // Premium vem marcado; se o admin renomear, cai no plano do meio.
  const [planoId, setPlanoId] = useState(
    (
      planos.find((p) => p.nome.trim().toLowerCase() === 'premium') ??
      planos[Math.floor((planos.length - 1) / 2)]
    )?.id ?? ''
  );
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [genero, setGenero] = useState<GeneroPreferido>('Sem preferência');
  const [preferidas, setPreferidas] = useState<string[]>([]);
  const [evitar, setEvitar] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [aceite, setAceite] = useState(false);
  const [site, setSite] = useState(''); // honeypot
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);

  const plano = planos.find((p) => p.id === planoId);

  /** Preenche o endereço pelo CEP (ViaCEP); se falhar, o cliente digita. */
  async function buscarCep(valor: string) {
    const digits = onlyDigits(valor);
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        if (data.logradouro) setEndereco(data.logradouro);
        if (data.bairro) setBairro(data.bairro);
        if (data.localidade) setCidade(data.localidade);
        if (data.uf) setUf(data.uf);
      }
    } catch {
      // sem internet/ViaCEP fora do ar: preenchimento manual
    } finally {
      setBuscandoCep(false);
    }
  }

  /** Uma família não pode estar ao mesmo tempo em "gosto" e "evitar". */
  function toggleFamilia(familia: string, lista: 'preferidas' | 'evitar') {
    const [atual, setAtual, setOutra] =
      lista === 'preferidas'
        ? [preferidas, setPreferidas, setEvitar]
        : [evitar, setEvitar, setPreferidas];
    if (atual.includes(familia)) {
      setAtual(atual.filter((f) => f !== familia));
    } else {
      setAtual([...atual, familia]);
      setOutra((outra) => outra.filter((f) => f !== familia));
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setEnviando(true);

    let result: Awaited<ReturnType<typeof cadastrarAssinatura>>;
    try {
      result = await cadastrarAssinatura({
        plano_id: planoId,
        nome,
        email,
        whatsapp,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        uf,
        genero_preferido: genero,
        familias_preferidas: preferidas,
        familias_evitar: evitar,
        observacoes,
        aceite_termos: aceite,
        site,
      });
    } catch {
      // Falha de rede antes de chegar ao servidor: sem isso o botão ficava
      // preso em "Enviando…" para sempre.
      setErro(
        'Não foi possível enviar agora. Verifique sua conexão e tente de novo.'
      );
      return;
    } finally {
      setEnviando(false);
    }

    if (!result.ok) {
      setErro(result.error);
      return;
    }
    setConcluido(true);
    window.scrollTo({ top: document.getElementById('cadastro')?.offsetTop ?? 0 });
  }

  if (concluido) {
    const mensagem = `Olá, ${STORE_NAME}! Acabei de me cadastrar no Clube de Decants${
      plano ? `, plano ${plano.nome} (${precoPlano(plano)})` : ''
    }. Meu nome é ${nome.trim()}. Como faço o pagamento?`;

    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto h-12 w-12 text-gold-600" aria-hidden />
        <h3 className="mt-4 font-display text-2xl font-semibold text-ink-900">
          Cadastro recebido!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Obrigado, {nome.trim().split(' ')[0]}! Agora é só combinar o pagamento
          com a gente para ativar sua assinatura e programar o primeiro envio.
        </p>
        {WHATSAPP_NUMBER && (
          <WhatsAppLink
            href={buildWhatsAppLink(mensagem)}
            source="assinatura_cadastro"
            className="tap-target mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-whatsapp px-8 py-4 text-base font-bold text-white shadow-md transition hover:bg-whatsapp-dark"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Combinar pagamento
          </WhatsAppLink>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Planos */}
      <fieldset>
        <legend className="sr-only">Plano</legend>
        <div className="grid gap-3 md:grid-cols-3">
          {planos.map((p, index) => (
            <PlanoCard
              key={p.id}
              plano={p}
              selecionado={p.id === planoId}
              destaque={planos.length > 1 && index === planos.length - 1}
              onSelect={() => setPlanoId(p.id)}
            />
          ))}
        </div>
      </fieldset>

      {/* Contato */}
      <fieldset className="space-y-4 rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <legend className="mb-1 font-display text-lg font-semibold text-ink-900">
          Seus dados
        </legend>
        <div>
          <label htmlFor="nome" className={labelClass}>Nome completo *</label>
          <input id="nome" required autoComplete="name" value={nome}
            onChange={(e) => setNome(e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className={labelClass}>E-mail *</label>
            <input id="email" type="email" required autoComplete="email" spellCheck={false} value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="whatsapp" className={labelClass}>WhatsApp com DDD *</label>
            <input id="whatsapp" type="tel" required autoComplete="tel-national"
              inputMode="numeric" value={whatsapp}
              onChange={(e) => setWhatsapp(formatTelefone(e.target.value))}
              className={inputClass} placeholder="(87) 99999-8888" />
          </div>
        </div>
      </fieldset>

      {/* Endereço */}
      <fieldset className="space-y-4 rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <legend className="mb-1 font-display text-lg font-semibold text-ink-900">
          Endereço de entrega
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cep" className={labelClass}>CEP *</label>
            <div className="relative">
              <input id="cep" required autoComplete="postal-code" inputMode="numeric"
                value={cep}
                onChange={(e) => {
                  const formatado = formatCep(e.target.value);
                  setCep(formatado);
                  void buscarCep(formatado);
                }}
                className={inputClass} placeholder="55290-000" />
              {buscandoCep && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold-600"
                  aria-label="Buscando endereço" />
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="endereco" className={labelClass}>Rua *</label>
            <input id="endereco" required autoComplete="address-line1" value={endereco}
              onChange={(e) => setEndereco(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="numero" className={labelClass}>Número *</label>
            <input id="numero" required value={numero}
              onChange={(e) => setNumero(e.target.value)} className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="complemento" className={labelClass}>Complemento</label>
            <input id="complemento" autoComplete="address-line2" value={complemento}
              onChange={(e) => setComplemento(e.target.value)} className={inputClass}
              placeholder="Apto, bloco, referência…" />
          </div>
          <div>
            <label htmlFor="bairro" className={labelClass}>Bairro *</label>
            <input id="bairro" required value={bairro}
              onChange={(e) => setBairro(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="cidade" className={labelClass}>Cidade *</label>
            <input id="cidade" required autoComplete="address-level2" value={cidade}
              onChange={(e) => setCidade(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label htmlFor="uf" className={labelClass}>UF *</label>
            <input id="uf" required maxLength={2} autoComplete="address-level1" value={uf}
              onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
              className={inputClass} placeholder="PE" />
          </div>
        </div>
      </fieldset>

      {/* Perfil olfativo */}
      <fieldset className="space-y-5 rounded-2xl bg-white p-5 shadow-card sm:p-6">
        <legend className="mb-1 font-display text-lg font-semibold text-ink-900">
          Seu perfil olfativo
        </legend>
        <p className="-mt-2 text-xs text-muted">
          É com isso que nossa curadoria escolhe seus decants todo mês.
        </p>

        <div>
          <span className={labelClass}>Prefere perfumes</span>
          <div className="flex flex-wrap gap-2">
            {GENEROS_PREFERIDOS.map((g) => (
              <button key={g} type="button" onClick={() => setGenero(g)}
                aria-pressed={genero === g} className={chipClass(genero === g)}>
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Famílias que você ama</span>
          <div className="flex flex-wrap gap-2">
            {FAMILIAS_OLFATIVAS.map((f) => (
              <button key={f} type="button" onClick={() => toggleFamilia(f, 'preferidas')}
                aria-pressed={preferidas.includes(f)} className={chipClass(preferidas.includes(f))}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className={labelClass}>Famílias que prefere evitar</span>
          <div className="flex flex-wrap gap-2">
            {FAMILIAS_OLFATIVAS.map((f) => (
              <button key={f} type="button" onClick={() => toggleFamilia(f, 'evitar')}
                aria-pressed={evitar.includes(f)}
                className={chipClass(evitar.includes(f), 'border-wine bg-wine text-white')}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="observacoes" className={labelClass}>
            Algo mais que devemos saber?
          </label>
          <textarea id="observacoes" rows={3} maxLength={1000} value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)} className={inputClass}
            placeholder="Perfumes que já usa e ama, alergias, ocasiões de uso…" />
        </div>
      </fieldset>

      {/* Honeypot: invisível para pessoas, robôs preenchem */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="site">Site</label>
        <input id="site" tabIndex={-1} autoComplete="off" value={site}
          onChange={(e) => setSite(e.target.value)} />
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-800">
        <input type="checkbox" required checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded accent-gold-600" />
        <span>
          Autorizo o uso dos meus dados para gerenciar a assinatura e as
          entregas, conforme a{' '}
          <Link href="/politica-de-privacidade" target="_blank"
            className="font-semibold underline underline-offset-2 hover:text-gold-600">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      {erro && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
        </p>
      )}

      <button type="submit" disabled={enviando || !planoId}
        className="tap-target flex w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-6 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white transition hover:bg-ink-950 active:scale-[0.98] disabled:opacity-60">
        {enviando && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
        {enviando ? 'Enviando…' : 'Assinar plano decant'}
      </button>
    </form>
  );
}

function chipClass(ativo: boolean, ativoClass = 'border-ink-900 bg-ink-900 text-white') {
  return `rounded-full border px-4 py-2 text-sm font-semibold transition ${
    ativo ? ativoClass : 'border-ink-700/25 bg-white text-ink-800 hover:border-ink-900'
  }`;
}
