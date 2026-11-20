'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { onlyDigits } from '@/lib/assinatura';
import type { GeneroPreferido } from '@/lib/types';

export interface CadastroAssinaturaInput {
  plano_id: string;
  nome: string;
  email: string;
  whatsapp: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  genero_preferido: GeneroPreferido;
  familias_preferidas: string[];
  familias_evitar: string[];
  observacoes: string;
  aceite_termos: boolean;
  /** Honeypot anti-robô: campo invisível que pessoas nunca preenchem. */
  site: string;
}

export type CadastroResult = { ok: true } | { ok: false; error: string };

const GENEROS: GeneroPreferido[] = ['Sem preferência', 'Feminino', 'Masculino', 'Unissex'];
const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]);

function limparLista(lista: unknown): string[] {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, 40))
    .filter(Boolean)
    .slice(0, 20);
}

/** Server Actions recebem qualquer coisa do cliente: campo que não é texto vira ''. */
function texto(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Mesmo e-mail ou WhatsApp com cadastro pendente nesse intervalo = reenvio. */
const JANELA_DUPLICADO_MS = 24 * 60 * 60 * 1000;

/**
 * Cadastro público no clube de decants. A tabela `assinantes` NÃO aceita
 * INSERT do público (migration 009): o único caminho é esta action, que
 * valida tudo no servidor e grava com a service role. Assim a validação,
 * o honeypot e a checagem do plano não podem ser pulados chamando a API
 * do Supabase direto com a chave anônima.
 */
export async function cadastrarAssinatura(
  rawInput: CadastroAssinaturaInput
): Promise<CadastroResult> {
  const input = (rawInput ?? {}) as Partial<Record<keyof CadastroAssinaturaInput, unknown>>;

  // Robô preencheu o campo invisível: finge sucesso e não grava nada.
  if (texto(input.site)) return { ok: true };

  const nome = texto(input.nome);
  const email = texto(input.email).toLowerCase();
  const whatsapp = onlyDigits(texto(input.whatsapp));
  const cep = onlyDigits(texto(input.cep));
  const uf = texto(input.uf).toUpperCase();
  const planoId = texto(input.plano_id);

  if (input.aceite_termos !== true) {
    return { ok: false, error: 'É preciso aceitar a Política de Privacidade para se cadastrar.' };
  }
  if (nome.length < 2 || nome.length > 120) return { ok: false, error: 'Informe seu nome completo.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return { ok: false, error: 'Informe um e-mail válido.' };
  }
  if (whatsapp.length < 10 || whatsapp.length > 11) {
    return { ok: false, error: 'Informe o WhatsApp com DDD, ex.: (87) 99999-8888.' };
  }
  if (cep.length !== 8) return { ok: false, error: 'Informe um CEP válido (8 dígitos).' };
  if (!UFS.has(uf)) return { ok: false, error: 'Informe a UF (ex.: PE).' };

  const endereco = texto(input.endereco).slice(0, 200);
  const numero = texto(input.numero).slice(0, 20);
  const bairro = texto(input.bairro).slice(0, 100);
  const cidade = texto(input.cidade).slice(0, 100);
  if (!endereco || !numero || !bairro || !cidade) {
    return { ok: false, error: 'Preencha o endereço completo de entrega.' };
  }

  const generoInformado = texto(input.genero_preferido);
  const genero =
    GENEROS.find((g) => g === generoInformado) ?? 'Sem preferência';

  if (!/^[0-9a-f-]{36}$/i.test(planoId)) {
    return { ok: false, error: 'Escolha um dos planos disponíveis.' };
  }

  try {
    const supabase = createClient();

    const { data: plano } = await supabase
      .from('planos_assinatura')
      .select('id')
      .eq('id', planoId)
      .eq('ativo', true)
      .maybeSingle();
    if (!plano) {
      return { ok: false, error: 'Escolha um dos planos disponíveis.' };
    }

    const admin = createAdminClient();

    // Duplo clique, reenvio ou robô repetindo o mesmo cadastro: se já há
    // um pendente recente com o mesmo e-mail ou WhatsApp, não grava outro.
    // (Duas consultas com .eq em vez de .or(`email.eq.${email}`): o texto
    // do usuário nunca entra na sintaxe do filtro do PostgREST.)
    const desde = new Date(Date.now() - JANELA_DUPLICADO_MS).toISOString();
    const pendenteRecente = (coluna: 'email' | 'whatsapp', valor: string) =>
      admin
        .from('assinantes')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pendente')
        .gte('created_at', desde)
        .eq(coluna, valor);
    const [porEmail, porWhatsapp] = await Promise.all([
      pendenteRecente('email', email),
      pendenteRecente('whatsapp', whatsapp),
    ]);
    if ((porEmail.count ?? 0) > 0 || (porWhatsapp.count ?? 0) > 0) {
      return { ok: true };
    }

    const { error } = await admin.from('assinantes').insert({
      plano_id: plano.id,
      nome,
      email,
      whatsapp,
      cep,
      endereco,
      numero,
      complemento: texto(input.complemento).slice(0, 100) || null,
      bairro,
      cidade,
      uf,
      genero_preferido: genero,
      familias_preferidas: limparLista(input.familias_preferidas),
      familias_evitar: limparLista(input.familias_evitar),
      observacoes: texto(input.observacoes).slice(0, 1000) || null,
      status: 'pendente',
      aceite_termos_em: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Não foi possível concluir seu cadastro agora. Tente novamente ou fale com a gente pelo WhatsApp.',
    };
  }
}
