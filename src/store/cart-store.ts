'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Perfume } from '@/lib/types';

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (perfume: Perfume) => void;
  removeItem: (perfumeId: string) => void;
  setQuantity: (perfumeId: string, quantidade: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (perfume) =>
        set((state) => {
          const existing = state.items.find(
            (item) => item.perfume.id === perfume.id
          );
          const items = existing
            ? state.items.map((item) =>
                item.perfume.id === perfume.id
                  ? { ...item, quantidade: item.quantidade + 1 }
                  : item
              )
            : [...state.items, { perfume, quantidade: 1 }];
          return { items, isOpen: true };
        }),

      removeItem: (perfumeId) =>
        set((state) => ({
          items: state.items.filter((item) => item.perfume.id !== perfumeId),
        })),

      setQuantity: (perfumeId, quantidade) =>
        set((state) => ({
          items:
            quantidade <= 0
              ? state.items.filter((item) => item.perfume.id !== perfumeId)
              : state.items.map((item) =>
                  item.perfume.id === perfumeId
                    ? { ...item, quantidade }
                    : item
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'elegance-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const selectCartCount = (state: { items: CartItem[] }) =>
  state.items.reduce((sum, item) => sum + item.quantidade, 0);

export const selectCartTotal = (state: { items: CartItem[] }) =>
  state.items.reduce(
    (sum, item) => sum + item.perfume.preco_atual * item.quantidade,
    0
  );
