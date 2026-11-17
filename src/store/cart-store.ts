'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Perfume, PerfumeDecant } from '@/lib/types';
import { cartItemPrice } from '@/lib/decants';

/**
 * Identifica uma linha do carrinho: o mesmo perfume em opções
 * diferentes (frasco 50ml, frasco 100ml, decant 5ml) vira linhas separadas.
 */
export function cartItemKey(
  item: Pick<CartItem, 'perfume' | 'tamanho' | 'decant'>
): string {
  return item.decant
    ? `${item.perfume.id}|decant:${item.decant.id}`
    : `${item.perfume.id}|${item.tamanho ?? ''}`;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Frasco: passe o `tamanho`. Decant: passe o `decant` (tamanho é ignorado). */
  addItem: (
    perfume: Perfume,
    tamanho?: string | null,
    decant?: PerfumeDecant | null
  ) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantidade: number) => void;
  clearCart: () => void;
  /**
   * Substitui os dados salvos dos perfumes consultados (`queriedIds`)
   * pelos atuais do banco (`fresh`, com decants). Itens consultados que
   * não voltaram (perfume desativado/excluído) ou cujo decant saiu de
   * venda são removidos; itens adicionados depois da consulta não são
   * afetados.
   */
  syncPerfumes: (queriedIds: string[], fresh: Perfume[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (perfume, tamanho = null, decant = null) =>
        set((state) => {
          const novo: CartItem = {
            perfume,
            tamanho: decant ? null : tamanho,
            decant,
            quantidade: 1,
          };
          const key = cartItemKey(novo);
          const existing = state.items.find((item) => cartItemKey(item) === key);
          const items = existing
            ? state.items.map((item) =>
                cartItemKey(item) === key
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
              )
            : [...state.items, novo];
          return { items, isOpen: true };
        }),

      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => cartItemKey(item) !== key),
        })),

      setQuantity: (key, quantidade) =>
        set((state) => ({
          items:
            quantidade <= 0
              ? state.items.filter((item) => cartItemKey(item) !== key)
              : state.items.map((item) =>
                  cartItemKey(item) === key ? { ...item, quantidade } : item
                ),
        })),

      clearCart: () => set({ items: [] }),

      syncPerfumes: (queriedIds, fresh) =>
        set((state) => {
          const queried = new Set(queriedIds);
          const byId = new Map(fresh.map((perfume) => [perfume.id, perfume]));
          return {
            items: state.items.flatMap((item) => {
              if (!queried.has(item.perfume.id)) return [item];
              const atual = byId.get(item.perfume.id);
              if (!atual) return [];
              if (!item.decant) return [{ ...item, perfume: atual }];

              const decantAtual = atual.decants?.find(
                (d) => d.id === item.decant?.id && d.ativo
              );
              return decantAtual
                ? [{ ...item, perfume: atual, decant: decantAtual }]
                : [];
            }),
          };
        }),
    }),
    {
      name: 'elegance-cart',
      version: 2,
      partialize: (state) => ({ items: state.items }),
      // v0 não guardava o tamanho escolhido; v1 não tinha decants
      migrate: (persisted) => {
        const state = persisted as { items?: Partial<CartItem>[] };
        return {
          items: (state.items ?? []).map((item) => ({
            ...item,
            tamanho: item.tamanho ?? null,
            decant: item.decant ?? null,
          })) as CartItem[],
        };
      },
    }
  )
);

export const selectCartCount = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + item.quantidade, 0);

export const selectCartTotal = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + cartItemPrice(item) * item.quantidade, 0);
