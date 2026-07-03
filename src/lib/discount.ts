import type { Perfume } from './types';

/**
 * Calcula a porcentagem de desconto da ancoragem de preço:
 * ((preco_antigo - preco_atual) / preco_antigo) * 100
 *
 * Retorna o percentual inteiro (arredondado) ou null quando não há
 * desconto válido (sem preço antigo, ou preço antigo <= atual).
 */
export function calcDiscountPercent(
  precoAntigo: number | null | undefined,
  precoAtual: number
): number | null {
  if (!precoAntigo || precoAntigo <= precoAtual) return null;
  return Math.round(((precoAntigo - precoAtual) / precoAntigo) * 100);
}

/** Atalho para calcular o desconto direto de um Perfume. */
export function perfumeDiscount(perfume: Perfume): number | null {
  return calcDiscountPercent(perfume.preco_antigo, perfume.preco_atual);
}

/** Número de parcelas sem juros exibido nos cards. */
export const MAX_PARCELAS = 3;
