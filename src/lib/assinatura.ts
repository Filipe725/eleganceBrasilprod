import type { GeneroPreferido, PlanoAssinatura, StatusAssinante } from './types';
import { formatBRL } from './format';
import { formatVolume } from './decants';

export const STATUS_ASSINANTE: { value: StatusAssinante; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export const GENEROS_PREFERIDOS: GeneroPreferido[] = [
  'Sem preferência',
  'Feminino',
  'Masculino',
  'Unissex',
];

/** "2 decants de 5 ml por mês" */
export function resumoPlano(plano: Pick<PlanoAssinatura, 'qtd_decants' | 'volume_ml'>): string {
  const decants = plano.qtd_decants === 1 ? 'decant' : 'decants';
  return `${plano.qtd_decants} ${decants} de ${formatVolume(plano.volume_ml)} por mês`;
}

/**
 * Pagamento adiantado de no mínimo 3 meses (3, 6 ou 12). O período é
 * combinado pela atendente no WhatsApp, não escolhido no site.
 */
export const MESES_MINIMOS = 3;

/** Valor mínimo pago adiantado: 90 -> 270 */
export function totalAdiantado(plano: Pick<PlanoAssinatura, 'preco_mensal'>): number {
  return plano.preco_mensal * MESES_MINIMOS;
}

/** "R$ 79,90/mês" */
export function precoPlano(plano: Pick<PlanoAssinatura, 'preco_mensal'>): string {
  return `${formatBRL(plano.preco_mensal)}/mês`;
}

/** Mantém só os dígitos: "(87) 99999-8888" -> "87999998888" */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** "87999998888" -> "(87) 99999-8888" */
export function formatTelefone(digits: string): string {
  const d = onlyDigits(digits).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** "55290000" -> "55290-000" */
export function formatCep(digits: string): string {
  const d = onlyDigits(digits).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** Link wa.me para falar com o assinante (número salvo com DDD, sem o 55). */
export function whatsappDoAssinante(whatsapp: string, mensagem: string): string {
  const d = onlyDigits(whatsapp);
  const numero = d.length <= 11 ? `55${d}` : d;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
