'use server';

import { createClient } from '@/lib/supabase/server';
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

/**
 * Cadastro público no clube de decants. Valida no servidor (o formulário
 * pode ser burlado) e grava como 'pendente' com o client anônimo — a RLS
 * de `assinantes` só permite INSERT pendente, nunca leitura pelo público.
 */
export async function cadastrarAssinatura(
  input: CadastroAssinaturaInput
): Promise<CadastroResult> {
  // Robô preencheu o campo invisível: finge sucesso e não grava nada.
  if (input.site) return { ok: true };

  const nome = input.nome.trim();
  const email = input.email.trim().toLowerCase();
  const whatsapp = onlyDigits(input.whatsapp);
  const cep = onlyDigits(input.cep);
  const uf = input.uf.trim().toUpperCase();

  if (!input.aceite_termos) {
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

  const endereco = input.endereco.trim().slice(0, 200);
  const numero = input.numero.trim().slice(0, 20);
  const bairro = input.bairro.trim().slice(0, 100);
  const cidade = input.cidade.trim().slice(0, 100);
  if (!endereco || !numero || !bairro || !cidade) {
    return { ok: false, error: 'Preencha o endereço completo de entrega.' };
  }

  const genero = GENEROS.includes(input.genero_preferido)
    ? input.genero_preferido
    : 'Sem preferência';

  try {
    const supabase = createClient();

    const { data: plano } = await supabase
      .from('planos_assinatura')
      .select('id')
      .eq('id', input.plano_id)
      .eq('ativo', true)
      .maybeSingle();
    if (!plano) {
      return { ok: false, error: 'Escolha um dos planos disponíveis.' };
    }

    const { error } = await supabase.from('assinantes').insert({
      plano_id: plano.id,
      nome,
      email,
      whatsapp,
      cep,
      endereco,
      numero,
      complemento: input.complemento.trim().slice(0, 100) || null,
      bairro,
      cidade,
      uf,
      genero_preferido: genero,
      familias_preferidas: limparLista(input.familias_preferidas),
      familias_evitar: limparLista(input.familias_evitar),
      observacoes: input.observacoes.trim().slice(0, 1000) || null,
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
