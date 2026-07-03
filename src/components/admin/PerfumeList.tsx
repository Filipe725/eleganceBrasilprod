'use client';

import Image from 'next/image';
import { Pencil, Trash2, Eye, EyeOff, Droplets } from 'lucide-react';
import type { Perfume } from '@/lib/types';
import { formatBRL } from '@/lib/format';

interface PerfumeListProps {
  perfumes: Perfume[];
  onEdit: (perfume: Perfume) => void;
  onDelete: (perfume: Perfume) => void;
  onToggleActive: (perfume: Perfume) => void;
}

export function PerfumeList({
  perfumes,
  onEdit,
  onDelete,
  onToggleActive,
}: PerfumeListProps) {
  if (perfumes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700/20 py-16 text-center text-sm text-ink-700/70">
        Nenhum perfume cadastrado ainda. Clique em “Novo perfume” para começar.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {perfumes.map((perfume) => (
        <li
          key={perfume.id}
          className={`flex items-center gap-3 rounded-2xl border border-ink-700/10 bg-white p-3 shadow-sm sm:gap-4 sm:p-4 ${
            perfume.ativo ? '' : 'opacity-60'
          }`}
        >
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-ink-800 to-ink-950 sm:h-20 sm:w-20">
            {perfume.imagem_url ? (
              <Image
                src={perfume.imagem_url}
                alt={perfume.nome}
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Droplets className="h-5 w-5 text-gold-500/50" aria-hidden />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-ink-700/60">
              {perfume.marca}
            </p>
            <h3 className="truncate text-sm font-semibold text-ink-900 sm:text-base">
              {perfume.nome}
            </h3>
            <p className="text-xs text-ink-700/70">
              {perfume.familia_olfativa.join(', ')}
              {perfume.tamanho?.length > 0 && ` • ${perfume.tamanho.join(', ')}`}
              {!perfume.ativo && ' • Oculto da loja'}
            </p>
            <p className="mt-0.5 text-sm font-bold text-ink-900">
              {perfume.preco_antigo != null && (
                <span className="mr-2 text-xs font-normal text-ink-700/60 line-through">
                  {formatBRL(perfume.preco_antigo)}
                </span>
              )}
              <span className="text-wine">{formatBRL(perfume.preco_atual)}</span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => onToggleActive(perfume)}
              aria-label={perfume.ativo ? 'Ocultar da loja' : 'Mostrar na loja'}
              title={perfume.ativo ? 'Ocultar da loja' : 'Mostrar na loja'}
              className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-ink-900/5 hover:text-ink-900"
            >
              {perfume.ativo ? (
                <Eye className="h-5 w-5" aria-hidden />
              ) : (
                <EyeOff className="h-5 w-5" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => onEdit(perfume)}
              aria-label={`Editar ${perfume.nome}`}
              title="Editar"
              className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-gold-500/10 hover:text-gold-600"
            >
              <Pencil className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => onDelete(perfume)}
              aria-label={`Excluir ${perfume.nome}`}
              title="Excluir"
              className="tap-target flex items-center justify-center rounded-xl text-ink-700/60 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
