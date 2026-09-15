'use client';

import { create } from 'zustand';

interface SearchState {
  query: string;
  isOpen: boolean;
  setQuery: (query: string) => void;
  openSearch: () => void;
  closeSearch: () => void;
}

/**
 * Estado global da busca do header: o input fica na Navbar e o filtro
 * em tempo real é aplicado no grid de produtos da Home.
 */
export const useSearchStore = create<SearchState>()((set) => ({
  query: '',
  isOpen: false,
  setQuery: (query) => set({ query }),
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false, query: '' }),
}));

/** Filtro case-insensitive por nome, marca, gênero, família olfativa, notas ou tamanho. */
export function matchesSearch(
  perfume: {
    nome: string;
    marca?: string;
    genero?: string;
    notas_olfativas: string | null;
    familia_olfativa?: string[];
    tamanho?: string[];
  },
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    perfume.nome.toLowerCase().includes(q) ||
    (perfume.marca ?? '').toLowerCase().includes(q) ||
    (perfume.genero ?? '').toLowerCase().includes(q) ||
    (perfume.notas_olfativas ?? '').toLowerCase().includes(q) ||
    (perfume.familia_olfativa ?? []).some((f) => f.toLowerCase().includes(q)) ||
    (perfume.tamanho ?? []).some((t) => t.toLowerCase().includes(q))
  );
}
