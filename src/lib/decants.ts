import type { CartItem, Perfume, PerfumeDecant } from './types';

/** Select padrão de perfumes: já traz os decants junto (um único request). */
export const PERFUME_SELECT = '*, decants:perfume_decants(*)';

const volumeFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/** 5 -> "5 ml", 2.5 -> "2,5 ml" */
export function formatVolume(ml: number): string {
  return `${volumeFormat.format(ml)} ml`;
}

/** Decants à venda (ativos), do menor para o maior volume. */
export function activeDecants(perfume: Perfume): PerfumeDecant[] {
  return (perfume.decants ?? [])
    .filter((decant) => decant.ativo)
    .sort((a, b) => a.volume_ml - b.volume_ml);
}

/** Menor preço entre os decants ativos, ou null se não há decant. */
export function menorPrecoDecant(perfume: Perfume): number | null {
  const decants = activeDecants(perfume);
  return decants.length > 0 ? Math.min(...decants.map((d) => d.preco)) : null;
}

/** Preço unitário de uma linha do carrinho (decant tem preço próprio). */
export function cartItemPrice(item: Pick<CartItem, 'perfume' | 'decant'>): number {
  return item.decant ? item.decant.preco : item.perfume.preco_atual;
}

/** Descrição da opção escolhida: "Decant 5 ml", "100ml" ou null. */
export function cartItemOption(item: Pick<CartItem, 'tamanho' | 'decant'>): string | null {
  if (item.decant) return `Decant ${formatVolume(item.decant.volume_ml)}`;
  return item.tamanho;
}
